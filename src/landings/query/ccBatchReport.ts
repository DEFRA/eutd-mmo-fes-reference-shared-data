import moment from 'moment'
import logger from '../../logger'
import { ICcQueryResult, ICcBatchValidationReport } from '../types/query'
import * as Transformations from '../transformations/transformations'
import { ILandingAggregatedItemBreakdown } from '../types';

export const TRANSPORT_VEHICLE_DIRECT = 'directLanding';

const _ = require('lodash');
const fmtDuration = d => `${d.days()}.${d.hours()}.${d.minutes()}.${d.seconds()}`

export const ccBatchReport = (
  rawValidationCertificates: IterableIterator<ICcQueryResult>,
  pdateFrom?: moment.Moment | null,
  pdateTo?: moment.Moment | null,
  pAreas?: string[]
): IterableIterator<ICcBatchValidationReport> => {

  const dateFrom = pdateFrom || moment('19700101')
  const dateTo = pdateTo || moment('20700101')

  let areas = pAreas || [];

  if (areas.length === 0) {
    areas = ['Northern Ireland', 'Isle of Man', 'Channel Islands', 'Guernsey', 'Jersey', 'England', 'Wales', 'Scotland', 'Isle of Man'];
  }

  logger.info(`[CATCH-CERT-REPORT][DATE-FROM]${dateFrom.toISOString()}[DATE-TO]${dateTo.toISOString()}[AREAS]${areas}`);

  const filter = (q: ICcQueryResult): boolean =>
    ((moment.utc(q.createdAt) >= dateFrom && moment.utc(q.createdAt) <= dateTo) && areas.includes(q.da))

  return Transformations.imap(
    Transformations.ifilter(rawValidationCertificates, filter), (q: ICcQueryResult) => {

     

      const r = <ICcBatchValidationReport>{}

      pickRfromQ(q, r);

      landBreakDown(q, r);
      
      provideBatchDetails(q,r);
     

      return r



    })
}
const provideLandingBreakdown = (species, landingAggregatedItemBreakdown) => {
  const presentation = `presentation: ${landingAggregatedItemBreakdown.presentation}, `;
  const state = `state: ${landingAggregatedItemBreakdown.state}, `;
  const estweightPlusTolerance = `estimate weight plus tolerance: ${landingAggregatedItemBreakdown.liveWeight + landingAggregatedItemBreakdown.liveWeight * 0.1}, `
  return `species: ${species}, ` +
    `${(landingAggregatedItemBreakdown.presentation === undefined) ? '' : presentation}` +
    `${(landingAggregatedItemBreakdown.state === undefined) ? '' : state}` +
    `factor: ${landingAggregatedItemBreakdown.factor}, ` +
    `${(landingAggregatedItemBreakdown.isEstimate) ? 'estimate weight' : 'landed weight'}: ${landingAggregatedItemBreakdown.weight}, ` +
    `${(landingAggregatedItemBreakdown.isEstimate) ? 'estimate live weight' : 'live weight'}: ${landingAggregatedItemBreakdown.liveWeight}, ` +
    `${(landingAggregatedItemBreakdown.isEstimate) ? estweightPlusTolerance : ''}` +
    `source of validation: ${landingAggregatedItemBreakdown.source}`
}
const provideBatchDetails=(q:ICcQueryResult,r:ICcBatchValidationReport)=>{
   /*
       * https://eaflood.atlassian.net/browse/FI0-41
       */
   const createUrl = (rawDataType) => {
    return `{BASE_URL}/reference/api/v1/extendedData/${rawDataType}?dateLanded=${q.dateLanded}&rssNumber=${q.rssNumber}`
  }
   const unavailabilityDuration = q.isLandingExists ? q.durationBetweenCertCreationAndFirstLandingRetrieved : q.durationSinceCertCreation

   if (moment.duration(unavailabilityDuration) < moment.duration())
     r.FI0_41_unavailabilityDuration = '0.0.0.0'
   else if (moment.duration(unavailabilityDuration) > moment.duration(40, 'days'))
     r.FI0_41_unavailabilityDuration = '40 days+'
   else
     r.FI0_41_unavailabilityDuration = fmtDuration(moment.duration(unavailabilityDuration))
   /*
    * https://eaflood.atlassian.net/browse/FI0-47
    */
    let failures = 0;

   if (q.isLandingExists) {
     failures = _getSpeciesFailures(failures, _checkSpecies);
   } else {
     failures = _getSpeciesFailures(failures, _ => _);
   }

   r.FI0_136_numberOfFailedValidations = failures;
   r.rawLandingsUrl = createUrl('rawLandings');
   r.salesNotesUrl = createUrl('salesNotes');

   function _getSpeciesFailures(speciesFailures, checkSpecies) {
    if (r.FI0_47_unavailabilityExceeds14Days === 'Fail') {
      speciesFailures++;
      speciesFailures = checkSpecies(speciesFailures, _checkWeightsForOveruse);
    } else {
      speciesFailures = checkSpecies(speciesFailures, _checkWeightsForOveruse);
    }

    return speciesFailures;
  }

  function _checkSpecies(speciesFailures, checkWeight) {
    if (r.FI0_289_speciesMismatch === 'Fail') {
      speciesFailures++;
    } else {
      speciesFailures = checkWeight(speciesFailures);
    }

    return speciesFailures;
  }

  function _checkWeightsForOveruse(failures) {
    if (q.isOverusedAllCerts) {
      failures++;
    }

    return failures;
  }
}
const landBreakDown = (q: ICcQueryResult, r: ICcBatchValidationReport) => {
  if (q.landingTotalBreakdown) {
    r.landingBreakdowns = '';
    q.landingTotalBreakdown
      .map(landingAggregatedItemBreakdown => provideLandingBreakdown(q.species, landingAggregatedItemBreakdown))
      .forEach((landingBreakdownDetail, index, arr) => r.landingBreakdowns += landingBreakdownDetail + `${(index === arr.length - 1) ? '' : '\n'}`);

    const landedDecLandings = q.landingTotalBreakdown.filter(landingAggregatedItemBreakdown => !landingAggregatedItemBreakdown.isEstimate);
    provideLandingLength(landedDecLandings, r,q);

    const estimatedLandings = q.landingTotalBreakdown.filter(landingAggregatedItemBreakdown => landingAggregatedItemBreakdown.isEstimate);
    provideEstimatedLandings(estimatedLandings, r, q);
  }
}
const provideEstimatedLandings = (estimatedLandings: ILandingAggregatedItemBreakdown[],r:ICcBatchValidationReport,q:ICcQueryResult) => {
  if (estimatedLandings.length > 0) {
    r.aggregatedEstimateWeight = _.sumBy(estimatedLandings, estimatedLanding => estimatedLanding.weight);

    r.aggregatedEstimateWeightPlusTolerance = _.sumBy(estimatedLandings
      .map(landingAggregatedItemBreakdown => landingAggregatedItemBreakdown.liveWeight), liveWeight => liveWeight + liveWeight * 0.1);

    // Landed Weight Exceed By: Live weight from Exporter minus “Estimate Weight + Tolerance” depending upon source of validation data.
    r.exportedWeightExceedingEstimateLandedWeight = _undefinedIfNoLandings(
      estimatedLandings.length,
      q.weightOnAllCerts > r.aggregatedEstimateWeightPlusTolerance ? q.weightOnAllCerts - r.aggregatedEstimateWeightPlusTolerance : undefined
    );
  }
}
const provideLandingLength = (landedDecLandings:ILandingAggregatedItemBreakdown[],r: ICcBatchValidationReport,q: ICcQueryResult) => {
  if (landedDecLandings.length > 0) {
    const aggregatedLandedDecWeight = _.sumBy(landedDecLandings, landedDecLanding => landedDecLanding.weight);
    r.aggregatedLandedDecWeight = (aggregatedLandedDecWeight > 0) ? aggregatedLandedDecWeight : undefined;

    const aggregatedLiveWeight = _.sumBy(q.landingTotalBreakdown, landedDecLanding => landedDecLanding.liveWeight);
    r.aggregatedLiveWeight = (aggregatedLiveWeight > 0) ? aggregatedLiveWeight : undefined;
  }
}
const pickRfromQ = (q: ICcQueryResult, r: ICcBatchValidationReport) => {
  r.documentNumber = q.documentNumber
  r.documentType = 'CC'
  r.documentStatus = q.status
  r.documentUrl = q.extended.url
  r.timestamp = q.createdAt
  r.date = moment.utc(q.createdAt).format("DD/MM/YYYY")
  r.time = moment.utc(q.createdAt).format("hh:mm:ss")
  r.exporterCompanyName = q.extended.exporterCompanyName
  r.exporterName = q.extended.exporterName
  r.authority = q.da
  r.speciesCode = q.species
  r.speciesName = q.extended.species
  r.weight = q.weightOnCert // live weight from exporter
  r.weightFactor = q.weightFactor // conversion factor applied to weight from exporter
  r.exportWeight = q.rawWeightOnCert // weight from exporter
  r.directLanding = q.extended.transportationVehicle === TRANSPORT_VEHICLE_DIRECT ? 'Y' : 'N'
  r.vessel = q.extended.vessel
  r.pln = q.extended.pln
  r.rssNumber = q.rssNumber
  r.dateLanded = q.dateLanded
  r.productState = q.extended.state
  r.productPresentation = q.extended.presentation
  r.productCommodityCode = q.extended.commodityCode
  r.investigatedBy = q.extended.investigation ? q.extended.investigation.investigator : undefined
  r.investigationStatus = q.extended.investigation ? q.extended.investigation.status : undefined
  r.voidedBy = q.extended.voidedBy;
  r.preApprovedBy = q.extended.preApprovedBy;
  r.speciesAlias = q.speciesAlias;
  r.speciesAnomaly = q.speciesAnomaly;
  /*
   * https://eaflood.atlassian.net/browse/FI0-288
   */

  r.FI0_288_numberOfLandings = q.numberOfLandingsOnDay === 0 ? undefined : q.numberOfLandingsOnDay

  /*
   * https://eaflood.atlassian.net/browse/FI0-289
   */

  r.FI0_289_speciesMismatch = _undefinedIfNoLandings(q.numberOfLandingsOnDay, q.isSpeciesExists ? 'Match' : 'Fail');

  /*
   * https://eaflood.atlassian.net/browse/FI0-290
   */

  r.FI0_290_exportedWeightExceedingLandedWeight = _undefinedIfNoLandings(q.numberOfLandingsOnDay, q.weightOnAllCerts > q.weightOnLanding ? q.weightOnAllCerts - q.weightOnLanding : undefined);

  /*
   * https://eaflood.atlassian.net/browse/FI0-291
   */

  r.FI0_291_totalExportWeights = q.weightOnAllCerts

  /*
   * https://eaflood.atlassian.net/browse/FI0-136
   */
  if (!q.isLandingExists) {
    if (q.isExceeding14DayLimit)
      r.FI0_47_unavailabilityExceeds14Days = 'Fail'
    else
      r.FI0_47_unavailabilityExceeds14Days = undefined

  } else if ((moment.duration(q.durationBetweenCertCreationAndFirstLandingRetrieved)) > moment.duration(14, 'days')) {

    r.FI0_47_unavailabilityExceeds14Days = 'Fail'

  } else {
    r.FI0_47_unavailabilityExceeds14Days = 'Pass'
  }


  return r;
}
function _undefinedIfNoLandings(numberOfLandings, valueIfLandingsAvailable) {
  if (numberOfLandings === 0) {
    return undefined
  } else {
    return valueIfLandingsAvailable;
  }
}
