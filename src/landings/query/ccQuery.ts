const _ = require('lodash');
import moment from 'moment';
import { ILanding, ILandingAggregated } from '../types/landing';
import { ICcQueryResult } from '../types/query';
import { vesselLookup, ifilter, mapCatchCerts, unwindCatchCerts, groupCatchCertsByLanding, aggregateOnLandingDate } from '../transformations/transformations';
import { LandingStatus } from '../types/document';
import { isElog, isWithinDeminimus } from './isWithinDeminimus';

export const TOLERANCE_IN_KG = 50;

const shouldThrowQueryTimeError = (queryTime: moment.Moment | null) => !(queryTime?.isValid());
const unwoundCatchCertsFilter = (c: any) => c.extended.vesselOverriddenByAdmin || c.rssNumber !== undefined;
const getQueryResultSource = (landing: any) => landing.items[0]?.breakdown[0] ? landing.items[0].breakdown[0].source : undefined;

function performWeightOveruseCheck(r: ICcQueryResult, landingWeightBySpecies: any, landing: any, allCertsGroupedWithAliases: any, speciesCodeOnLanding: string, speciesCodeOnCert?: string) {
    r.isSpeciesExists = true
    r.weightOnLanding = landingWeightBySpecies[speciesCodeOnLanding]
    r.landingTotalBreakdown = _(landing.items.filter(landing => landing.species === speciesCodeOnLanding))
        .flatMap(c => c.breakdown).value();

    const isEstimated = r.landingTotalBreakdown.some(_ => _.isEstimate)

    r.isOverusedThisCert = isEstimated ? (r.weightOnCert > (r.weightOnLanding * 1.1)) : (r.weightOnCert > r.weightOnLanding)
    r.isOverusedAllCerts = isEstimated ? (r.weightOnAllCerts > ((r.weightOnLanding * 1.1) + TOLERANCE_IN_KG)) : (r.weightOnAllCerts > (r.weightOnLanding + TOLERANCE_IN_KG))

    if (r.isOverusedAllCerts) {
        r.overUsedInfo = allCertsGroupedWithAliases
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
        r.overUsedInfo = [];
    }
}

function hasLandingDataPeriodExceeded(r: ICcQueryResult, queryTime: moment.Moment): boolean {
    if (r.extended.landingStatus && r.extended.landingStatus !== LandingStatus.Pending) return false;

    const endDate = moment.utc(r.extended.landingDataEndDate, 'YYYY-MM-DD', true);
    if (endDate.isValid()) return queryTime.isAfter(endDate, 'day');

    return moment.duration(r.durationSinceCertCreation) > moment.duration(14, 'days');
}

function enrichWithLandingData(params: { r: ICcQueryResult, queryTime: moment.Moment, landing: any, landingWeightTotal: number, getSpeciesAliases: (speciesCode: string) => string[], item: any, landingWeightBySpecies: any, allCertsGroupedWithAliases: any }) {
    params.r.source = getQueryResultSource(params.landing);

    params.r.weightOnLandingAllSpecies = params.landingWeightTotal
    params.r.numberOfLandingsOnDay = params.landing.numberOfLandings

    params.r.durationBetweenCertCreationAndFirstLandingRetrieved = moment.duration(
        moment.utc(params.landing.firstDateTimeRetrieved)
            .diff(params.r.createdAt)
    ).toISOString()

    params.r.durationBetweenCertCreationAndLastLandingRetrieved = moment.duration(
        moment.utc(params.landing.lastDateTimeRetrieved)
            .diff(params.r.createdAt)
    ).toISOString();
    params.r.firstDateTimeLandingDataRetrieved = moment.utc(params.landing.firstDateTimeRetrieved).toISOString();

    // first understand how many aliases we have
    // if more than one then we need to iterate through the list of aliases until we find one on the landing data from source
    // if we find an alias the use it to evaluates weights using the alias
    // if not then we have have a species mis match
    const speciesAlias = params.getSpeciesAliases(params.item.species);
    if (params.item.species in params.landingWeightBySpecies || speciesAlias.some((sa: string) => sa in params.landingWeightBySpecies)) {
        const speciesAliasCode = !(params.item.species in params.landingWeightBySpecies) ? speciesAlias.find((sa: string) => sa in params.landingWeightBySpecies) : undefined;
        params.r.speciesAlias = speciesAliasCode ? 'Y' : 'N';
        params.r.speciesAnomaly = speciesAliasCode;

        const speciesCodeOnLanding = speciesAliasCode ?? params.item.species;
        performWeightOveruseCheck(params.r, params.landingWeightBySpecies, params.landing, params.allCertsGroupedWithAliases, speciesCodeOnLanding, params.item.species);
    } else {
        // Landing, but species not on landing

        params.r.isSpeciesExists = false
        params.r.weightOnLanding = 0
        params.r.isOverusedAllCerts = false;
        params.r.isOverusedThisCert = false;
        params.r.overUsedInfo = [];

        const isEndDateReached = (validation: ICcQueryResult): boolean => (moment.utc(validation.extended.landingDataEndDate, 'YYYY-MM-DD', true).isValid()) ? params.queryTime.isAfter(moment.utc(validation.extended.landingDataEndDate), 'day') : moment.duration(validation.durationSinceCertCreation) > moment.duration(14, 'days');

        if (isElog(isWithinDeminimus)(params.r) && isEndDateReached(params.r)) {
            params.r.isExceeding14DayLimit = true;
        }
    }
}

function enrichWithoutLandingData(r: ICcQueryResult, queryTime: moment.Moment): void {
    r.weightOnLandingAllSpecies = 0;
    r.isSpeciesExists = false;
    r.weightOnLanding = 0;
    r.numberOfLandingsOnDay = 0;
    r.durationBetweenCertCreationAndFirstLandingRetrieved = null;
    r.durationBetweenCertCreationAndLastLandingRetrieved = null;
    r.isOverusedAllCerts = false;
    r.isOverusedThisCert = false;
    r.overUsedInfo = [];

    if (hasLandingDataPeriodExceeded(r, queryTime)) {
        r.isExceeding14DayLimit = true;
        r.extended.landingStatus = LandingStatus.Exceeded14Days;
    } else {
        r.isExceeding14DayLimit = false;
    }
}

function enrichWithSpeciesAliases(species: string, getSpeciesAliases: (speciesCode: string) => string[], allCertsGrouped: any) {
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
}

export const isInRetrospectivePeriod: (queryTime: moment.Moment, item: ICcQueryResult) => boolean = (queryTime: moment.Moment, item: ICcQueryResult) =>
    item.extended.landingDataEndDate === undefined ? moment.duration(item.durationSinceCertCreation) <= moment.duration(14, 'days') : queryTime.isSameOrBefore(moment.utc(item.extended.landingDataEndDate), 'day')

export function* ccQuery(
    catchCerts: any[],
    landings: ILanding[],
    vesselsIdx: (pln: string) => any,
    queryTime: moment.Moment | null,
    getSpeciesAliases: (speciesCode: string) => string[]): IterableIterator<ICcQueryResult> {

    if (shouldThrowQueryTimeError(queryTime))
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
            unwoundCatchCertsFilter
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
        Object.keys(allCertsGrouped).forEach(species => enrichWithSpeciesAliases(species, getSpeciesAliases, allCertsGrouped));

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

        for (const item of catchCertItems) {

            const r = <ICcQueryResult>{}

            r.documentNumber = item.documentNumber
            r.documentType = 'catchCertificate'
            r.createdAt = moment.utc(item.createdAt).toISOString()
            r.status = item.status
            r.extended = item.extended
            r.rssNumber = item.rssNumber
            r.da = item.da
            r.startDate = item.startDate
            r.dateLanded = item.dateLanded
            r.species = item.species
            r.weightFactor = item.factor
            r.weightOnCert = item.weight * r.weightFactor
            r.rawWeightOnCert = item.weight
            r.weightOnAllCerts = allCertsWeightBySpecies[item.species]
            r.weightOnAllCertsBefore = allCertsWeightBySpeciesSoFar[item.species]
            allCertsWeightBySpeciesSoFar[item.species] += r.weightOnCert
            r.weightOnAllCertsAfter = allCertsWeightBySpeciesSoFar[item.species]
            r.gearType = item.gearType
            r.isLandingExists = isLandingExists;
            r.isExceeding14DayLimit = false;
            r.speciesAlias = 'N';

            r.durationSinceCertCreation = moment.duration(queryTime.diff(r.createdAt)).toISOString();

            if (isLandingExists) {
                // find source for a given landing
                enrichWithLandingData({ r, queryTime, landing, landingWeightTotal, getSpeciesAliases, item, landingWeightBySpecies, allCertsGroupedWithAliases })
            } else {
                // No landing
                enrichWithoutLandingData(r, queryTime);
            }

            yield r

        }

    }

}