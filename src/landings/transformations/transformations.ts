const fs = require('fs');
const path = require('path');

const Ajv = require('ajv');
const _ = require('lodash');
const moment = require('moment');

import { AuditEventTypes, IAuditEvent } from '../types/auditEvent';
import { ILanding, ILandingAggregated, LandingSources, ILandingItem } from '../types/landing';
import { ILicence } from '../types/appConfig/vessels';
import logger from '../../logger';

function getValidator(schema) {
  logger.info(`[VALIDATION][LANDINGS][TRANSFORMATIONS][GET-VALIDATOR][SCHEMA:${schema}]`)
  const ajv = new Ajv()
  const schemaData = fs.readFileSync(path.join(__dirname, schema))
  const schemaJson = JSON.parse(schemaData)
  const validate = ajv.compile(schemaJson)
  return validate
}

const validate_cefas = getValidator('cefas.response.schema.json')
const validate_catchrecordings = getValidator('catchrecordings.response.schema.json')
const validate_eLog = getValidator('elog.response.schema.json')

// takes in an array of landing items of the same species, state, and presentation.
// sums the weights, adds a conversion factor and landing source, and returns a single landing item.
const _combineGroupedLandings = (landings: ILandingItem[], getToLiveWeightFactor: (species: string, state: string, presentation: string) => number): ILandingItem => {
  const landing = landings[0];
  const factor = getToLiveWeightFactor(landing.species, landing.state, landing.presentation);
  return {
    species: landing.species,
    // convert to grams to avoid floating point issues
    weight: _.sumBy(landings, _landing => _landing.weight * 1000) / 1000,
    factor: factor ?? 1,
    state: landing.state,
    presentation: landing.presentation
  };
}

const _cefasToLandings = (cefas: any, getToLiveWeightFactor: (species: string, state: string, presentation: string) => number): ILanding[] => {
  return cefas.landings.map((landing: any) => ({
    rssNumber: cefas.rssNumber,
    dateTimeLanded: moment.utc(landing.landingDateTime).toISOString(),
    source: LandingSources.LandingDeclaration,
    items: _(landing.landingAreas)
      // flatten every landing from every area into a single array
      .flatMap('landingAreaCatches')
      // group the array by species, state and presentation (so we can add all the weights together)
      .groupBy((item: ILandingItem) => `${item.species}-${item.state}-${item.presentation}`)
      // combine the grouped landings into a single landing for that combination of species, state, and presentation
      .map((landings: ILandingItem[]) => _combineGroupedLandings(landings, getToLiveWeightFactor))
      .value()
  }));
}

export const cefasToLandings = (cefas: any, getToLiveWeightFactor: (species: string, state: string, presentation: string) => number): ILanding[] => {

  // Validate untrusted data from the API against the schema
  const valid = validate_cefas(cefas)
  if (!valid) {
    throw new Error(`invalid cefas landing data. Errors:${JSON.stringify(validate_cefas.errors)}`)
  }

  return _cefasToLandings(cefas, getToLiveWeightFactor)

}

const _eLogToLandings = (eLog: any): ILanding[] => {
  return eLog.activities.map((activityObj: any) => ({
    rssNumber: eLog.rssNumber,
    dateTimeLanded: moment.utc(activityObj.returnDate).toISOString(),
    source: LandingSources.ELog,
    items: _(activityObj.activityAreas)
      // flatten all catches from every area into a single array
      .flatMap('activityAreaCatches')
      // group the array by species, state and presentation (so we can add all the weights together)
      .groupBy(item => `${item.species}-${item.state}-${item.presentation}`)
      // combine the grouped landings into a single landing for that combination of species, state, and presentation
      .map((landings: ILandingItem[]) => ({
        species: landings[0].species,
        // convert to grams to avoid floating point issues
        weight: _.sumBy(landings, landing => landing.weight * 1000) / 1000,
        factor: 1,
        state: landings[0].state,
        presentation: landings[0].presentation
      }))
      .value()
  }));
}

export const eLogToLandings = (eLog: any): ILanding[] => {

  // Validate untrusted data from the API against the schema
  const valid = validate_eLog(eLog)
  if (!valid) {
    throw new Error(`invalid eLog data. Errors:${JSON.stringify(validate_eLog.errors)}`)
  }

  return _eLogToLandings(eLog);
}

export const catchRecordingToLandings = (crecord: any, rssNumber: string, getToLiveWeightFactor: (species: string, state: string, presentation: string) => number): ILanding[] => {
  logger.info('[LANDINGS][FETCH-LANDING-UNDER10][CATCH-RECORDING-TO-LANDING]');

  if (!validate_catchrecordings(crecord)) {
    throw new Error(`invalid crecord landing data. Errors:${JSON.stringify(validate_catchrecordings.errors)}`);
  }

  return crecord.activities.map((landing: any) => (
    {
      rssNumber: rssNumber,
      dateTimeLanded: moment.utc(landing.returnDate).toISOString(),
      source: LandingSources.CatchRecording,
      items: _(landing.activityAreas)
        // flatten every landing from every area into a single array
        .flatMap('activityAreaCatches')
        // group the array by species, state and presentation (so we can add all the weights together)
        .groupBy(item => `${item.species}-${item.state}-${item.presentation}`)
        // combine the grouped landings into a single landing for that combination of species, state, and presentation
        .map((landings: ILandingItem[]) => _combineGroupedLandings(landings, getToLiveWeightFactor))
        .value()
    }
  ));
}

export const aggregateOnLandingDate = (landings: ILanding[]): ILandingAggregated[] =>
  _(landings)
    .sortBy(['rssNumber', 'dateTimeLanded'])
    .groupBy(landing => [landing.rssNumber, moment.utc(landing.dateTimeLanded).format('YYYY-MM-DD')])
    .map(items => ({
      // groupBy converts to Object therefore does not preserve the type of the key
      // therefore we can't simply unpack the key
      rssNumber: items[0].rssNumber,
      dateLanded: moment.utc(items[0].dateTimeLanded).format('YYYY-MM-DD'),
      numberOfLandings: items.length,
      firstDateTimeRetrieved: moment(
        _.minBy(items, item => moment(item.dateTimeRetrieved))
          .dateTimeRetrieved).toISOString(),
      lastDateTimeRetrieved: moment(
        _.maxBy(items, item => moment(item.dateTimeRetrieved))
          .dateTimeRetrieved).toISOString(),
      items: _(items)
        .map((l: ILanding) => ({ ...l, items: l.items.map((i: ILandingItem) => ({ ...i, source: l.source })) }))
        .flatMap('items')
        .sortBy('species')
        .groupBy('species')
        .map((_items, species) => {
          const totalWeightsBreakdown = _items.map(landing => {
            const factor = landing.factor ? landing.factor : 1;

            return {
              presentation: landing.presentation,
              state: landing.state,
              source: landing.source,
              isEstimate: landing.source !== LandingSources.LandingDeclaration,
              factor: factor,
              weight: landing.weight,
              liveWeight: factor * landing.weight
            }
          });

          return {
            species,
            weight: _.sumBy(totalWeightsBreakdown, item => item.liveWeight * 1000) / 1000,    // Convert to grammes to avoid floating point issues,
            breakdown: totalWeightsBreakdown
          }
        }).value()
    })).value()

const getVoidedEvent = (catchCert: any) => catchCert.audit?.length ? getLastAuditEvent(catchCert.audit, AuditEventTypes.Voided) : undefined;
const getPreApprovedEvent = (catchCert: any) => catchCert.audit?.length ? getLastAuditEvent(catchCert.audit, AuditEventTypes.PreApproved) : undefined;
const getFactor = (product: any) => product.factor ?? 1;
const nullishCoalescing = (obj: any, key: string) => obj?.[key] ?? undefined;
const isSpeciesOverriddenByAdmin = (product: any) => !!product.speciesAdmin || !!product.state?.admin || !!product.presentation?.admin || !!product.commodityCodeAdmin

export function* unwindCatchCerts(catchCerts) {
  /*
   * Unwind the referenced landings part of Catch Certificates
   * Include all data requried for reporting
   */

  for (const catchCert of catchCerts) {
    const voidedEvent = getVoidedEvent(catchCert);
    const preApprovedEvent = getPreApprovedEvent(catchCert);
    
    const exportData = catchCert.exportData;
    for (const product of exportData.products) {
      for (const caughtBy of product.caughtBy) {
        yield {
          documentNumber: catchCert.documentNumber,
          createdAt: catchCert.createdAt,
          status: catchCert.status,
          speciesCode: product.speciesCode,
          factor: getFactor(product),
          pln: caughtBy.pln,
          date: moment(caughtBy.date).format('YYYY-MM-DD'),
          startDate: caughtBy.startDate,
          weight: caughtBy.weight,
          extended: {
            exporterContactId: nullishCoalescing(exportData.exporterDetails, 'contactId'),
            exporterAccountId: nullishCoalescing(exportData.exporterDetails, 'accountId'),
            exporterName: nullishCoalescing(exportData.exporterDetails, 'exporterFullName'),
            exporterCompanyName: nullishCoalescing(exportData.exporterDetails, 'exporterCompanyName'),
            exporterPostCode: nullishCoalescing(exportData.exporterDetails, 'exporterPostCode'),
            vessel: caughtBy.vessel,
            landingId: caughtBy.id,
            landingStatus: caughtBy._status,
            pln: caughtBy.pln,
            fao: caughtBy.faoArea,
            flag: caughtBy.flag,
            cfr: caughtBy.cfr,
            presentation: nullishCoalescing(product.presentation, 'code'),
            presentationName: nullishCoalescing(product.presentation, 'name'),
            presentationAdmin: nullishCoalescing(product.presentation, 'admin'),
            species: product.species,
            speciesAdmin: product.speciesAdmin,
            scientificName: product.scientificName,
            state: nullishCoalescing(product.state, 'code'),
            stateName: nullishCoalescing(product.state, 'name'),
            stateAdmin: nullishCoalescing(product.state, 'admin'),
            commodityCode: product.commodityCode,
            commodityCodeAdmin: product.commodityCodeAdmin,
            commodityCodeDescription: product.commodityCodeDescription,
            url: catchCert.documentUri,
            investigation: catchCert.investigation,
            voidedBy: nullishCoalescing(voidedEvent, 'triggeredBy'),
            preApprovedBy: nullishCoalescing(preApprovedEvent, 'triggeredBy'),
            transportationVehicle: nullishCoalescing(exportData.transportation, 'vehicle'),
            numberOfSubmissions: caughtBy.numberOfSubmissions,
            vesselOverriddenByAdmin: caughtBy.vesselOverriddenByAdmin,
            speciesOverriddenByAdmin: isSpeciesOverriddenByAdmin(product),
            licenceHolder: caughtBy.licenceHolder,
            dataEverExpected: caughtBy.dataEverExpected,
            landingDataExpectedDate: caughtBy.landingDataExpectedDate,
            landingDataEndDate: caughtBy.landingDataEndDate,
            isLegallyDue: caughtBy.isLegallyDue,
            vesselRiskScore: caughtBy.vesselRiskScore,
            exporterRiskScore: caughtBy.exporterRiskScore,
            speciesRiskScore: caughtBy.speciesRiskScore,
            threshold: caughtBy.threshold,
            riskScore: caughtBy.riskScore,
            isSpeciesRiskEnabled: caughtBy.isSpeciesRiskEnabled
          }
        }
      }
    }
  }
}

export function getLastAuditEvent(events: IAuditEvent[], eventType: string) {
  const matches = events.filter(_ => _.eventType === eventType);
  return matches[matches.length - 1];
}

export function* mapCatchCerts(unwoundCatchCerts, licenceLookup) {

  /*
   * Clean up the unwould catch certificates
   */
  for (const { documentNumber, createdAt, status, speciesCode, factor, pln, startDate, date, weight, extended } of unwoundCatchCerts) {
    const licence = licenceLookup(pln, date);
    const rssNumber = licence ? licence.rssNumber : undefined
    yield {
      documentNumber,
      createdAt,
      status,
      rssNumber,
      startDate,
      dateLanded: date,
      species: speciesCode,
      factor: factor,
      weight,
      da: licence ? licence.da : 'England',
      extended: {
        ...extended,
        homePort: licence?.homePort,
        flag: licence?.flag,
        imoNumber: licence?.imoNumber,
        licenceNumber: licence?.licenceNumber,
        licenceValidTo: licence?.licenceValidTo,
        licenceHolder: extended.vesselOverriddenByAdmin ? extended.licenceHolder : licence?.licenceHolder
      }
    }
  }
}

export const getLandingsFromCatchCerts = (
  catchCerts,
  licenceLookup: (pln: string, dateLanded: string) => any
): { dateLanded: string, pln: string, rssNumber: string }[] =>

  _.uniqBy(
    Array.from(unwindCatchCerts(catchCerts))
      .map(({ date, pln }) => {
        const licence = licenceLookup(pln, date)
        return {
          dateLanded: date,
          pln,
          rssNumber: licence ? licence.rssNumber : undefined,
        }
      }),
    JSON.stringify
  )


export function* groupCatchCertsByLanding(unwoundCatchCerts) {

  /*
   * group by landingId:  `${rssNumber}${dateLanded}`
   */

  let group: any[] = []
  let landingId

  for (const catchCert of unwoundCatchCerts) {

    const nextLandingId = `${catchCert.rssNumber}${catchCert.dateLanded}`

    if (nextLandingId !== landingId) {

      if (group.length > 0)
        yield [landingId, group]

      group = []
      landingId = nextLandingId
    }
    group.push(catchCert)
  }

  yield [landingId, group]

}


/*
 * how to reuse this from VesselService? when this one supports injection?
 */

export function vesselLookup(vesselsIdx: (pln: string) => any): (pln: string, date: string) => ILicence  {

  return (pln: string, date: string) => {

    const licences = vesselsIdx(pln);

    if (!licences) {
      logger.error(`[VESSEL-LOOKUP][NOT-FOUND][${pln}:${date}]`);
      return undefined;
    }

    for (const licence of licences) {
      if (licence.validFrom <= date && date <= licence.validTo) {
        return {
          rssNumber: licence.rssNumber,
          da: licence.da,
          homePort: licence.homePort,
          flag: licence.flag,
          imoNumber: licence.imoNumber,
          licenceNumber: licence.number,
          licenceValidTo: licence.validTo,
          licenceHolder: licence.holder,
          vesselLength: licence.vesselLength
        }
      }
    }
  }
}

export function* ifilter(iterable, f) {
  for (const element of iterable) {
    if (f(element))
      yield element
  }
}

export function* imap(iterable, f) {
  for (const element of iterable) {
    yield f(element)
  }
}

