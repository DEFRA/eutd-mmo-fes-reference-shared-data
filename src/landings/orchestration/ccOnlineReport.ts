import moment from 'moment';
import { type Catch, type Product, LandingStatus, DocumentStatuses } from '../types/document';
import { ICcQueryResult } from "../types/query";

export function getLandingsFromCatchCertificate(catchCertificate, reportingNewLandings = false) {
  return [].concat(...catchCertificate.exportData.products.map(product =>
    product.caughtBy.reduce((plnAndDateLanded, landing) =>
    (landing.vesselOverriddenByAdmin && !reportingNewLandings ? plnAndDateLanded : [
      ...plnAndDateLanded, {
        pln: landing.pln,
        dateLanded: moment(landing.date).format('YYYY-MM-DD'),
        dataEverExpected: landing.dataEverExpected,
        landingDataExpectedDate: landing.landingDataExpectedDate,
        landingDataEndDate: landing.landingDataEndDate,
        createdAt: catchCertificate.createdAt,
        isLegallyDue: landing.isLegallyDue
      }
    ]), [])))
}

export function shouldIncludeLanding(rssLanding) {
  return rssLanding.dataEverExpected !== false && (rssLanding.landingDataExpectedDate === undefined || moment.utc().isSameOrAfter(moment.utc(rssLanding.landingDataExpectedDate), 'day') || rssLanding.isLegallyDue)
}

export function mapLandingWithLandingStatus(product: Product, validation: ICcQueryResult, getToLiveWeightFactor: (species: string, state: string, presentation: string) => number): Product {
  return {
    ...product,
    factor: getToLiveWeightFactor(product.speciesCode, product.state.code, product.presentation.code),
    caughtBy: product.caughtBy.map((landing: Catch) => ((landing.id === validation.extended.landingId) ? {
      ...landing,
      numberOfSubmissions: validation.extended.numberOfSubmissions,
      homePort: validation.extended.homePort,
      flag: validation.extended.flag,
      cfr: validation.extended.cfr,
      imoNumber: validation.extended.imoNumber,
      licenceNumber: validation.extended.licenceNumber,
      licenceValidTo: validation.extended.licenceValidTo,
      dataEverExpected: validation.extended.dataEverExpected,
      landingDataExpectedDate: validation.extended.landingDataExpectedDate,
      landingDataEndDate: validation.extended.landingDataEndDate,
      licenceHolder: validation.extended.licenceHolder,
      _status: (validation.status === DocumentStatuses.Complete) ? findStatus(validation) : undefined
    } : landing))
  }
}

function findStatus(validation: ICcQueryResult): LandingStatus {
  if (validation.extended.dataEverExpected === false) {
    return LandingStatus.DataNeverExpected;
  }

  if (validation.isExceeding14DayLimit) {
    return LandingStatus.Exceeded14Days;
  }

  if (!validation.isLandingExists) {
    return LandingStatus.Pending;
  }

  return LandingStatus.Complete;
}