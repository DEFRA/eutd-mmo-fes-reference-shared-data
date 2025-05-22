import moment from 'moment';
import { isEmpty } from 'lodash';
import {
   CertificateAudit,
   CertificateTransport,
   IDefraValidationCatchCertificate,
   CertificateExporterAndCompany,
   CertificateLanding,
   CatchCertificateTransport
} from '../types/defraValidation';
import {
   ICcQueryResult
} from "../types/query";
import { IAuditEvent } from '../types/auditEvent';
import { getConfig } from '../../config';
import { postCodeToDa, postCodeDaLookup } from '../../data/authorities';
import { isElog, isInRetrospectivePeriod, isWithinDeminimus, TRANSPORT_VEHICLE_DIRECT } from '../query';
import type { Catch, Product, Transport, IDocument } from '../types/document';
import { vesselLookup } from './transformations';
import { ILicence } from '../types/appConfig/vessels';
import { isLandingDataExpectedAtSubmission } from './dynamicsValidation';
import { DefraCcLandingStatusType } from '../types/dynamicsCcCase';

const TRANSPORT_VEHICLE_TRUCK = 'truck';
const TRANSPORT_VEHICLE_TRAIN = 'train';
const TRANSPORT_VEHICLE_PLANE = 'plane';
const TRANSPORT_VEHICLE_VESSEL = 'vessel';
const TRANSPORT_VEHICLE_CONTAINER_VESSEL = 'containerVessel';

export const daLookUp = postCodeDaLookup(postCodeToDa);

export const getIsLegallyDue = (rawValidatedLanding: ICcQueryResult) =>
   (rawValidatedLanding.extended.vesselOverriddenByAdmin && !rawValidatedLanding.rssNumber) ? false : rawValidatedLanding.extended.isLegallyDue

export function toCcDefraReport(documentNumber: string, correlationId: string, status: string, requestByAdmin: boolean, vesselsIdx?: (pln: string) => any, catchCert?: IDocument): IDefraValidationCatchCertificate {
   const result: IDefraValidationCatchCertificate = {
      documentType: "CatchCertificate",
      documentNumber: documentNumber,
      status: status,
      _correlationId: correlationId,
      requestedByAdmin: requestByAdmin
   };

   if (!isEmpty(catchCert)) {
      result.userReference = catchCert.userReference;
      result.dateCreated = catchCert.createdAt ? catchCert.createdAt : undefined;
      result.failedSubmissions = catchCert.numberOfFailedAttempts;
      result.clonedFrom = catchCert.clonedFrom;
      result.landingsCloned = catchCert.landingsCloned;
      result.parentDocumentVoid = catchCert.parentDocumentVoid;

      if (catchCert.audit.length > 0) {
         result.audits = catchCert.audit.map(_ => toDefraAudit(_));
      }

      if (catchCert.documentUri) {
         result.documentUri = `${getConfig().externalAppUrl}/qr/export-certificates/${catchCert.documentUri}`;
      }

      const exportData = catchCert.exportData;
      if (exportData) {

         if (exportData.exporterDetails) {
            const exporterDetails: CertificateExporterAndCompany = {
               fullName: exportData.exporterDetails.exporterFullName,
               companyName: exportData.exporterDetails.exporterCompanyName,
               contactId: exportData.exporterDetails.contactId,
               accountId: exportData.exporterDetails.accountId,
               address: {
                  building_number: exportData.exporterDetails.buildingNumber,
                  sub_building_name: exportData.exporterDetails.subBuildingName,
                  building_name: exportData.exporterDetails.buildingName,
                  street_name: exportData.exporterDetails.streetName,
                  county: exportData.exporterDetails.county,
                  country: exportData.exporterDetails.country,
                  line1: exportData.exporterDetails.addressOne,
                  city: exportData.exporterDetails.townCity,
                  postCode: exportData.exporterDetails.postcode
               },
               dynamicsAddress: exportData.exporterDetails._dynamicsAddress
            };

            result.exporterDetails = exporterDetails;
            result.devolvedAuthority = daLookUp(exportData.exporterDetails.postcode);

            if (exportData.conservation && exportData.conservation.conservationReference) {
               result.conservationReference = exportData.conservation.conservationReference;
            }

            const userDetails = exportData.exporterDetails._dynamicsUser || {};
            const { firstName, lastName } = userDetails;
            result.created = {
               id: catchCert.createdBy,
               email: catchCert.createdByEmail,
               firstName,
               lastName
            }
         }

         if (exportData.transportation) {
            result.transportation = toTransportation(exportData.transportation);
            result.exportedFrom = exportData.transportation.exportedFrom;
            result.exportedTo = exportData.transportation.exportedTo;
         }

         if (Array.isArray(exportData.transportations) && exportData.transportations.length > 0) {
            result.transportations = exportData.transportations.map((transportation) => toTransportations(transportation));
            result.exportedFrom = exportData.exportedFrom;
            result.exportedTo = exportData.exportedTo;
         }

         if (exportData.products && exportData.products.length > 0) {
            result.landings = exportData.products.flatMap((product: Product) =>
               toDefraCcLanding(product, exportData.transportation, catchCert.createdAt?.toISOString(), vesselsIdx));
         }
      }
   }

   return result;
}

export function toDefraCcLanding(product: Product | undefined, transportation: Transport, createdAt: string, vesselsIdx: (pln: string) => any): CertificateLanding[] {
   return (product?.caughtBy) ? product.caughtBy.map((landing: Catch) => {
      const licenceLookup = vesselLookup(vesselsIdx);
      const licence: ILicence = licenceLookup(landing.pln, landing.date);
      return {
         startDate: landing.startDate,
         date: landing.date,
         species: {
            name: product.species,
            code: product.speciesCode,
            scientificName: product.scientificName
         },
         state: {
            name: product.state.name,
            code: product.state.code,
         },
         presentation: {
            name: product.presentation.name,
            code: product.presentation.code,
         },
         cnCode: product.commodityCode,
         cnCodeDesc: product.commodityCodeDescription,
         vessel: {
            name: landing.vessel,
            pln: landing.pln,
            length: licence ? licence.vesselLength : undefined,
            fao: landing.faoArea,
            flag: landing.flag,
            cfr: landing.cfr
         },
         exportWeight: landing.weight,
         isDirectLanding: (transportation?.vehicle === TRANSPORT_VEHICLE_DIRECT),
         vesselAdministration: licence ? licence.da : undefined,
         dataEverExpected: landing.dataEverExpected,
         landingDataExpectedDate: landing.landingDataExpectedDate,
         landingDataEndDate: landing.landingDataEndDate,
         landingDataExpectedAtSubmission: (createdAt !== undefined && landing.landingDataExpectedDate !== undefined) ? moment.utc(createdAt).isSameOrAfter(moment.utc(landing.landingDataExpectedDate), 'day') : undefined,
         speciesAdmin: product.speciesAdmin,
         adminState: product.state.admin,
         adminPresentation: product.presentation.admin,
         adminCommodityCode: product.commodityCodeAdmin,
         speciesOverriddenByAdmin: product.speciesOverriddenByAdmin
      }
   }) : [];
}

export function toDefraAudit(systemAudit: IAuditEvent): CertificateAudit {
   const result: CertificateAudit = {
      auditOperation: systemAudit.eventType,
      user: systemAudit.triggeredBy,
      auditAt: systemAudit.timestamp,
      investigationStatus: systemAudit.data && systemAudit.data.investigationStatus ? systemAudit.data.investigationStatus : undefined
   }

   return result;
}

export function toTransportation(transportation): CertificateTransport {
   if (transportation === undefined)
      return undefined;

   switch (transportation.vehicle) {
      case TRANSPORT_VEHICLE_TRUCK:
         return {
            modeofTransport: transportation.vehicle,
            hasRoadTransportDocument: transportation.cmr,
            nationality: transportation.nationalityOfVehicle,
            registration: transportation.registrationNumber,
            exportLocation: transportation.departurePlace,
            exportDate: transportation.exportDate
         }
      case TRANSPORT_VEHICLE_TRAIN:
         return {
            modeofTransport: transportation.vehicle,
            billNumber: transportation.railwayBillNumber,
            exportLocation: transportation.departurePlace,
            exportDate: transportation.exportDate
         }
      case TRANSPORT_VEHICLE_PLANE:
         return {
            modeofTransport: transportation.vehicle,
            flightNumber: transportation.flightNumber,
            containerId: transportation.containerNumber,
            exportLocation: transportation.departurePlace,
            exportDate: transportation.exportDate
         }
      case TRANSPORT_VEHICLE_CONTAINER_VESSEL:
         return {
            modeofTransport: TRANSPORT_VEHICLE_VESSEL,
            name: transportation.vesselName,
            flag: transportation.flagState,
            containerId: transportation.containerNumber,
            exportLocation: transportation.departurePlace,
            exportDate: transportation.exportDate
         }
      default:
         return {
            modeofTransport: transportation.vehicle,
            exportLocation: transportation.departurePlace,
            exportDate: transportation.exportDate
         }
   }
}
export function toTransportations(transportation): CatchCertificateTransport {

   if (transportation === undefined)
      return undefined;

   const transportDocuments = Array.isArray(transportation.documents) && transportation.documents.length > 0 ? transportation.documents : [];
   switch (transportation.vehicle) {
      case TRANSPORT_VEHICLE_TRUCK:
         return {
            id: transportation.id,
            modeofTransport: transportation.vehicle,
            freightBillNumber: transportation.freightBillNumber,
            nationality: transportation.nationalityOfVehicle,
            registration: transportation.registrationNumber,
            exportLocation: transportation.departurePlace,
            transportDocuments,
         }
      case TRANSPORT_VEHICLE_TRAIN:
         return {
            id: transportation.id,
            modeofTransport: transportation.vehicle,
            freightBillNumber: transportation.freightBillNumber,
            billNumber: transportation.railwayBillNumber,
            exportLocation: transportation.departurePlace,
            transportDocuments,
         }
      case TRANSPORT_VEHICLE_PLANE:
         return {
            id: transportation.id,
            modeofTransport: transportation.vehicle,
            freightBillNumber: transportation.freightBillNumber,
            flightNumber: transportation.flightNumber,
            containerId: transportation.containerNumber,
            exportLocation: transportation.departurePlace,
            transportDocuments,
         }
      case TRANSPORT_VEHICLE_CONTAINER_VESSEL:
         return {
            id: transportation.id,
            modeofTransport: TRANSPORT_VEHICLE_VESSEL,
            freightBillNumber: transportation.freightBillNumber,
            name: transportation.vesselName,
            flag: transportation.flagState,
            containerId: transportation.containerNumber,
            exportLocation: transportation.departurePlace,
            transportDocuments,
         }
      default:
         return {
            id: transportation.id,
            modeofTransport: transportation.vehicle,
            freightBillNumber: transportation.freightBillNumber,
            exportLocation: transportation.departurePlace,
            nationality: transportation.nationalityOfVehicle,
            registration: transportation.registrationNumber,
            transportDocuments,
         }
   }
}

const hasLandingExists: (ccQuery: ICcQueryResult) => DefraCcLandingStatusType = (ccQuery: ICcQueryResult) => {
   let output: DefraCcLandingStatusType;

   if (ccQuery.isSpeciesExists) {
      const isOverusedAllCerts = ccQuery.isOverusedAllCerts && ccQuery.overUsedInfo.filter((documentNumber: string) => documentNumber !== ccQuery.documentNumber).length > 0;
      if (ccQuery.isOverusedThisCert && isOverusedAllCerts) {
         output = DefraCcLandingStatusType.ValidationFailure_WeightAndOveruse
      } else if (ccQuery.isOverusedThisCert) {
         output = DefraCcLandingStatusType.ValidationFailure_Weight;
      } else if (isOverusedAllCerts) {
         output = DefraCcLandingStatusType.ValidationFailure_Overuse;
      } else {
         output = DefraCcLandingStatusType.ValidationSuccess;
      }
   } else {
      output = DefraCcLandingStatusType.ValidationFailure_Species;
      if (isElog(isWithinDeminimus)(ccQuery)) {
         output = ccQuery.isExceeding14DayLimit ? DefraCcLandingStatusType.ValidationFailure_NoLandingData : DefraCcLandingStatusType.PendingLandingData_ElogSpecies;
      }
   }

   return output;
}

const getPendingLandingStatus: (ccQuery: ICcQueryResult) => DefraCcLandingStatusType = (ccQuery: ICcQueryResult) =>
   isLandingDataExpectedAtSubmission(ccQuery.createdAt, ccQuery.extended.landingDataExpectedDate) ? DefraCcLandingStatusType.PendingLandingData_DataExpected : DefraCcLandingStatusType.PendingLandingData_DataNotYetExpected;

export function toDefraCcLandingStatus(ccQuery: ICcQueryResult, isHighRisk: boolean): DefraCcLandingStatusType {
   if (ccQuery.extended.dataEverExpected === false)
      return DefraCcLandingStatusType.DataNeverExpected;

   let output: DefraCcLandingStatusType = getPendingLandingStatus(ccQuery);

   if (ccQuery.isLandingExists) {
      output = hasLandingExists(ccQuery);
   } else {
      const isNoLandingData = (ccQuery: ICcQueryResult) =>
         isLandingDataExpectedAtSubmission(ccQuery.createdAt, ccQuery.extended.landingDataExpectedDate) && !isInRetrospectivePeriod(moment.utc(), ccQuery) ||
         ccQuery.extended.vesselOverriddenByAdmin && isHighRisk ||
         ccQuery.isExceeding14DayLimit;

      if (isNoLandingData(ccQuery)) {
         output = DefraCcLandingStatusType.ValidationFailure_NoLandingData;
      }
   }

   if (isEmpty(ccQuery.extended.licenceHolder)) {
      output = DefraCcLandingStatusType.ValidationFailure_NoLicenceHolder;
   }

   return output;
}