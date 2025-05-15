import moment = require('moment');
import { isEmpty } from "lodash";
import {
  isInRetrospectivePeriod,
  isElog,
  isWithinDeminimus
} from "../query";
import {
  CertificateExporterAndCompany,
  ICountry,
  IDocument,
  ICcQueryResult,
  LandingStatusType,
  IDynamicsLanding
} from '../types';

export const isLandingDataExpectedAtSubmission = (createdAt: string, landingExpectedDate: string): boolean =>
  (createdAt === undefined || landingExpectedDate === undefined) ? true : moment.utc(createdAt).isSameOrAfter(moment.utc(landingExpectedDate), 'day');

export function toExporter(catchCertificate: IDocument): CertificateExporterAndCompany {
  return {
    fullName: catchCertificate.exportData.exporterDetails.exporterFullName,
    companyName: catchCertificate.exportData.exporterDetails.exporterCompanyName,
    contactId: catchCertificate.exportData.exporterDetails.contactId,
    accountId: catchCertificate.exportData.exporterDetails.accountId,
    address: {
      building_number: catchCertificate.exportData.exporterDetails.buildingNumber,
      sub_building_name: catchCertificate.exportData.exporterDetails.subBuildingName,
      building_name: catchCertificate.exportData.exporterDetails.buildingName,
      street_name: catchCertificate.exportData.exporterDetails.streetName,
      county: catchCertificate.exportData.exporterDetails.county,
      country: catchCertificate.exportData.exporterDetails.country,
      line1: catchCertificate.exportData.exporterDetails.addressOne,
      city: catchCertificate.exportData.exporterDetails.townCity,
      postCode: catchCertificate.exportData.exporterDetails.postcode
    },
    dynamicsAddress: catchCertificate.exportData.exporterDetails._dynamicsAddress
  };
}

export function toExportedTo(certificate: IDocument): ICountry {

  if (certificate.exportData?.transportation?.exportedTo) {
    return {
      officialCountryName: certificate.exportData.transportation.exportedTo.officialCountryName,
      isoCodeAlpha2: certificate.exportData.transportation.exportedTo.isoCodeAlpha2,
      isoCodeAlpha3: certificate.exportData.transportation.exportedTo.isoCodeAlpha3
    }
  }

  return {
      officialCountryName: certificate.exportData?.exportedTo?.officialCountryName,
      isoCodeAlpha2: certificate.exportData?.exportedTo?.isoCodeAlpha2,
      isoCodeAlpha3: certificate.exportData?.exportedTo?.isoCodeAlpha3
  }
}

export const isLandingDataLate: (firstDateTimeRetrieved: string, landingDataExpectedDate: string) => boolean | undefined = (firstDateTimeRetrieved: string, landingDataExpectedDate: string) => {
  const landingDataReceivedTime: moment.Moment = moment.utc(firstDateTimeRetrieved);
  const landingDataExpected: moment.Moment = moment.utc(landingDataExpectedDate);
  return firstDateTimeRetrieved !== undefined && landingDataExpectedDate !== undefined && landingDataReceivedTime.isValid() && landingDataExpected.isValid() ? landingDataReceivedTime.isAfter(landingDataExpected, 'day') : undefined;
}

export function landingExists(ccQuery: ICcQueryResult, output?: LandingStatusType) {
  if (ccQuery.isSpeciesExists) {
    const isOverusedAllCerts = ccQuery.isOverusedAllCerts && ccQuery.overUsedInfo.filter((documentNumber: string) => documentNumber !== ccQuery.documentNumber).length > 0;
    if (ccQuery.isOverusedThisCert && isOverusedAllCerts) {
      output = LandingStatusType.ValidationFailure_WeightAndOveruse
    } else if (ccQuery.isOverusedThisCert) {
      output = LandingStatusType.ValidationFailure_Weight;
    } else if (ccQuery.isOverusedAllCerts) {
      output = LandingStatusType.ValidationFailure_Overuse;
    } else {
      output = LandingStatusType.ValidationSuccess;
    }
  } else {
    output = LandingStatusType.ValidationFailure_Species;
    if (isElog(isWithinDeminimus)(ccQuery) && !ccQuery.isExceeding14DayLimit) {
      output = LandingStatusType.PendingLandingData_ElogSpecies;
    }
  }

  return output;
}

function landingDoesNotExists(ccQuery: ICcQueryResult, isHighRisk: boolean, landingDataExpectedAtSubmission: boolean, output: LandingStatusType) {
  const isNoLandingData = (ccQuery: ICcQueryResult) =>
    landingDataExpectedAtSubmission && !isInRetrospectivePeriod(moment.utc(), ccQuery) ||
    ccQuery.extended.vesselOverriddenByAdmin && isHighRisk ||
    ccQuery.isExceeding14DayLimit;

  if (isNoLandingData(ccQuery)) {
    output = LandingStatusType.ValidationFailure_NoLandingData;
  }

  return output;
}

export function toLandingStatus(ccQuery: ICcQueryResult, isHighRisk: boolean): LandingStatusType {
  if (ccQuery.extended.dataEverExpected === false)
    return LandingStatusType.DataNeverExpected;

  const landingDataExpectedAtSubmission = isLandingDataExpectedAtSubmission(ccQuery.createdAt, ccQuery.extended.landingDataExpectedDate);

  let output: LandingStatusType = landingDataExpectedAtSubmission ? LandingStatusType.PendingLandingData_DataExpected : LandingStatusType.PendingLandingData_DataNotYetExpected;

  if (ccQuery.isLandingExists) {
    output = landingExists(ccQuery, output);
  } else {
    output = landingDoesNotExists(ccQuery, isHighRisk, landingDataExpectedAtSubmission, output);
  }

  if (isEmpty(ccQuery.extended.licenceHolder)) {
    output = LandingStatusType.ValidationFailure_NoLicenceHolder;
  }

  return output;
}

export const has14DayLimitReached: (item: ICcQueryResult, landingDataNotExpected: boolean) => boolean = (item: ICcQueryResult, landingDataNotExpected: boolean) =>
  landingDataNotExpected || !isInRetrospectivePeriod(moment.utc(), item) ? true : item.isLandingExists && !isElog(isWithinDeminimus)(item);

export function toFailureIrrespectiveOfRisk(landings: IDynamicsLanding[]): boolean {
  return landings.some(landing => [
    LandingStatusType.ValidationFailure_Weight,
    LandingStatusType.ValidationFailure_Species,
    LandingStatusType.ValidationFailure_NoLandingData,
    LandingStatusType.ValidationFailure_NoLicenceHolder
  ].includes(landing.status));
}