const _ = require('lodash');
import moment from 'moment';
import { ILanding, ILandingAggregated } from '../types/landing';
import { ICcQueryResult } from '../types/query';
import { vesselLookup, ifilter, mapCatchCerts, unwindCatchCerts, groupCatchCertsByLanding, aggregateOnLandingDate } from '../transformations/transformations';
import { LandingStatus } from '../types/document';
import { isElog, isWithinDeminimus } from './isWithinDeminimus';

export const TOLERANCE_IN_KG = 50;

export const isInRetrospectivePeriod: (queryTime: moment.Moment, item: ICcQueryResult) => boolean = (queryTime: moment.Moment, item: ICcQueryResult) =>
    item.extended.landingDataEndDate === undefined ? moment.duration(item.durationSinceCertCreation) <= moment.duration(14, 'days') : queryTime.isSameOrBefore(moment.utc(item.extended.landingDataEndDate), 'day')

export function* ccQuery(
    catchCerts: any[],
    landings: ILanding[],
    vesselsIdx: (pln: string) => any,
    queryTime: moment.Moment | null,
    getSpeciesAliases: (speciesCode: string) => string[]): IterableIterator<ICcQueryResult> {

    if (!(queryTime && queryTime.isValid()))
        throw new Error('invalid queryTime parameter')

    /*
     * Prepare the lookups for rssNumber and DA
     */
    const licenceLookup = vesselLookup(vesselsIdx)

    /*
     * Prepare the catch certificates
     */

    /*
     * unwind the catch certificates on landings:
     *   { documentNumber, createdAt, speciesCode, pln, date, weight }
     * map this to a cleaner structure (including pln -> rss mapping)
     *   { documentNumber, createdAt, rssNumber, dateLanded, species, weight }
     * if the pln -> rss mapping fails then rssNumber will be undefined
     * filter these out  (there is no filter on javscript iterators!)
     * These shall be handled by deviation report: https://eaflood.atlassian.net/browse/FI0-332
     */
    const unwoundCatchCerts =
        ifilter(
            mapCatchCerts(
                unwindCatchCerts(catchCerts),
                licenceLookup
            ),
            c => c.extended.vesselOverriddenByAdmin || typeof c.rssNumber !== 'undefined'
        )

    /*
     * group catch certificates by the referenced landings:
     *   [ [landingId, catchCerts] ]
     *
     * Where landingId is `${rssNumber}${dateLanded}`
     *
     * Sort first before grouping.  NOTE This sort will kill the iterator and bring all data into memory
     * Would have to be unwound on the server (via the aggregate pipeline) to avoid this
     *
     * Also sort by createdAt, so that we can create running totals of the totals for all catch certificates
     * at the time each cc was created
     * */
    const catchCertsGrouped = groupCatchCertsByLanding(
        _.sortBy(
            Array.from(unwoundCatchCerts),
            ['rssNumber', 'dateLanded', 'createdAt']))

    /*
     * Prepare the landings
     */

    /*
     * Aggregate the landings by calender date
     */
    const aggregatedLandings: ILandingAggregated[] = aggregateOnLandingDate(landings)

    /*
     * index the landings by landingId `${rssNumber}${dateLanded}`
     */
    const landingsIdx = aggregatedLandings.reduce((acc, cur) => ({ ...acc, [cur.rssNumber + cur.dateLanded]: cur }), {})

    for (const [landingId, catchCertItems] of catchCertsGrouped) {
        //
        // produce a grouping of totals referenced from the catchCerts per species
        //
        const allCertsGrouped = _(catchCertItems).sortBy('species').groupBy('species').value();
        Object.keys(allCertsGrouped).forEach(species => {
            const speciesAliases = getSpeciesAliases(species);

            for (const speciesAlias of speciesAliases) {
                const isSpeciesAliasOnDocument = Array.isArray(allCertsGrouped[speciesAlias]) && allCertsGrouped[speciesAlias].length > 0;
                const speciesAliasOnCert = isSpeciesAliasOnDocument ? allCertsGrouped[speciesAlias].filter((sp) => sp.species === speciesAlias) : [];

                for (const speciesAlias of speciesAliasOnCert) {
                    if (speciesAlias.species !== species) {
                        allCertsGrouped[species].push(speciesAlias);
                    }
                }
            }

            return {
                [species]: allCertsGrouped[species]
            }
        });

        const allCertsGroupedWithAliases = Object.keys(allCertsGrouped).map(species => ({
            documentNumbers: allCertsGrouped[species].map((item) => item.documentNumber),
            species,
            weight: _.sumBy(allCertsGrouped[species], item => item.weight * item.factor * 1000) / 1000
        }));

        const allCertsWeightBySpecies = allCertsGroupedWithAliases.reduce((acc, cur) => ({ ...acc, [cur.species]: cur.weight }), {});

        // Keep a running total so that we can see how much use there
        // was by all catch certificates at the time of each certificate creation
        const allCertsWeightBySpeciesSoFar = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : 0
        })


        /*
         * For every referenced landing, prepare summerised landing data
         */

        let isLandingExists = false
        let landing
        let landingWeightBySpecies
        let landingWeightTotal

        if (landingId in landingsIdx) {
            isLandingExists = true
            landing = landingsIdx[landingId]
            landingWeightBySpecies = landing.items.reduce((acc, cur) => ({ ...acc, [cur.species]: cur.weight }), {})
            landingWeightTotal = landing.items.reduce((acc, cur) => acc + cur.weight, 0)
        }

        const performWeightOveruseCheck = (queryResult: ICcQueryResult, speciesCodeOnLanding: string, speciesCodeOnCert?: string) => {
            const weightCheckedQueryResult: ICcQueryResult = {
                ...queryResult
            };

            weightCheckedQueryResult.isSpeciesExists = true
            weightCheckedQueryResult.weightOnLanding = landingWeightBySpecies[speciesCodeOnLanding]
            weightCheckedQueryResult.landingTotalBreakdown = _(landing.items.filter(landing => landing.species === speciesCodeOnLanding))
                .flatMap(c => c.breakdown).value();

            const isEstimated = weightCheckedQueryResult.landingTotalBreakdown && weightCheckedQueryResult.landingTotalBreakdown.some(_ => _.isEstimate)

            weightCheckedQueryResult.isOverusedThisCert = isEstimated ? (weightCheckedQueryResult.weightOnCert > (weightCheckedQueryResult.weightOnLanding * 1.1)) : (weightCheckedQueryResult.weightOnCert > weightCheckedQueryResult.weightOnLanding)
            weightCheckedQueryResult.isOverusedAllCerts = isEstimated ? (weightCheckedQueryResult.weightOnAllCerts > ((weightCheckedQueryResult.weightOnLanding * 1.1) + TOLERANCE_IN_KG)) : (weightCheckedQueryResult.weightOnAllCerts > (weightCheckedQueryResult.weightOnLanding + TOLERANCE_IN_KG))

            if (weightCheckedQueryResult.isOverusedAllCerts) {
                weightCheckedQueryResult.overUsedInfo = allCertsGroupedWithAliases
                    .filter(cur => cur.species === speciesCodeOnLanding || cur.species === speciesCodeOnCert)
                    .reduce((acc, cur) => {
                        for (const d in cur.documentNumbers) {
                            if (acc.includes(cur.documentNumbers[d]))
                                continue;

                            acc = [...acc, cur.documentNumbers[d]];
                        }

                        return acc;
                    }, []);
            } else {
                weightCheckedQueryResult.overUsedInfo = [];
            }

            return weightCheckedQueryResult;
        }

        const hasLandingDataPeriodExceeded: (validation: ICcQueryResult) => boolean = (validation: ICcQueryResult) => {
            if (validation.extended.landingStatus && validation.extended.landingStatus !== LandingStatus.Pending) {
                return false;
            }

            if (moment.utc(validation.extended.landingDataEndDate, 'YYYY-MM-DD', true).isValid()) {
                return queryTime.isAfter(moment.utc(validation.extended.landingDataEndDate), 'day');
            }

            return moment.duration(validation.durationSinceCertCreation) > moment.duration(14, 'days');
        }

        for (const item of catchCertItems) {

            let r = <ICcQueryResult>{}

            r.documentNumber = item.documentNumber
            r.documentType = 'catchCertificate'
            r.createdAt = moment.utc(item.createdAt).toISOString()
            r.status = item.status
            r.extended = item.extended
            r.rssNumber = item.rssNumber
            r.da = item.da
            r.dateLanded = item.dateLanded
            r.species = item.species
            r.weightFactor = item.factor
            r.weightOnCert = item.weight * r.weightFactor
            r.rawWeightOnCert = item.weight
            r.weightOnAllCerts = allCertsWeightBySpecies[item.species]
            r.weightOnAllCertsBefore = allCertsWeightBySpeciesSoFar[item.species]
            allCertsWeightBySpeciesSoFar[item.species] += r.weightOnCert
            r.weightOnAllCertsAfter = allCertsWeightBySpeciesSoFar[item.species]

            r.isLandingExists = isLandingExists;
            r.isExceeding14DayLimit = false;
            r.speciesAlias = 'N';

            r.durationSinceCertCreation = moment.duration(queryTime.diff(r.createdAt)).toISOString();

            if (isLandingExists) {
                // find source for a given landing
                r.source = landing.items[0] && landing.items[0].breakdown[0] ?
                    landing.items[0].breakdown[0].source : undefined;

                r.weightOnLandingAllSpecies = landingWeightTotal
                r.numberOfLandingsOnDay = landing.numberOfLandings

                r.durationBetweenCertCreationAndFirstLandingRetrieved = moment.duration(
                    moment.utc(landing.firstDateTimeRetrieved)
                        .diff(r.createdAt)
                ).toISOString()

                r.durationBetweenCertCreationAndLastLandingRetrieved = moment.duration(
                    moment.utc(landing.lastDateTimeRetrieved)
                        .diff(r.createdAt)
                ).toISOString();
                r.firstDateTimeLandingDataRetrieved = moment.utc(landing.firstDateTimeRetrieved).toISOString();

                // first understand how many aliases we have
                // if more than one then we need to iterate through the list of aliases until we find one on the landing data from source
                // if we find an alias the use it to evaluates weights using the alias
                // if not then we have have a species mis match
                const speciesAlias = getSpeciesAliases(item.species);
                if (item.species in landingWeightBySpecies || speciesAlias.some((sa: string) => sa in landingWeightBySpecies)) {
                    const speciesAliasCode = !(item.species in landingWeightBySpecies) ? speciesAlias.find((sa: string) => sa in landingWeightBySpecies) : undefined;
                    r.speciesAlias = speciesAliasCode ? 'Y' : 'N';
                    r.speciesAnomaly = speciesAliasCode;

                    const speciesCodeOnLanding = speciesAliasCode ? speciesAliasCode : item.species;
                    r = performWeightOveruseCheck(r, speciesCodeOnLanding, item.species);
                } else {
                    // Landing, but species not on landing

                    r.isSpeciesExists = false
                    r.weightOnLanding = 0
                    r.isOverusedAllCerts = false;
                    r.isOverusedThisCert = false;
                    r.overUsedInfo = [];

                    const isEndDateReached = (validation: ICcQueryResult): boolean => (moment.utc(validation.extended.landingDataEndDate, 'YYYY-MM-DD', true).isValid()) ? queryTime.isAfter(moment.utc(validation.extended.landingDataEndDate), 'day') : moment.duration(validation.durationSinceCertCreation) > moment.duration(14, 'days');

                    if (isElog(isWithinDeminimus)(r) && isEndDateReached(r)) {
                        r.isExceeding14DayLimit = true;
                    }
                }

            } else {
                // No landing
                r.weightOnLandingAllSpecies = 0
                r.isSpeciesExists = false
                r.weightOnLanding = 0
                r.numberOfLandingsOnDay = 0
                r.durationBetweenCertCreationAndFirstLandingRetrieved = null
                r.durationBetweenCertCreationAndLastLandingRetrieved = null
                r.isOverusedAllCerts = false
                r.isOverusedThisCert = false
                r.overUsedInfo = [];

                if (hasLandingDataPeriodExceeded(r)) {
                    r.isExceeding14DayLimit = true;
                    r.extended.landingStatus = LandingStatus.Exceeded14Days;
                } else {
                    r.isExceeding14DayLimit = false;
                }
            }

            yield r

        }

    }

}