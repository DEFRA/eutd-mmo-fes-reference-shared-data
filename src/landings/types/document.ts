import { ICountry } from "./appConfig/countries";

export const DocumentStatuses = Object.freeze(
  {
    Draft: 'DRAFT',
    Pending: 'PENDING',
    Complete: 'COMPLETE',
    Void: 'VOID',
    Blocked: 'BLOCKED',
    Locked: 'LOCKED'
  }
)

export enum LandingStatus {
  Pending = 'PENDING_LANDING_DATA',
  Elog = 'ELOG_SPECIES_MISMATCH',
  LandingOveruse = 'LANDING_DATA_OVERUSED',
  Complete = 'HAS_LANDING_DATA',
  Exceeded14Days = 'EXCEEDED_14_DAY_LIMIT',
  DataNeverExpected = 'LANDING_DATA_NEVER_EXPECTED'
}

export interface Investigation {
  investigator: string,
  status: string
}

export interface IGetCatchCerts {
  fromDate?: moment.Moment,
  toDate?: moment.Moment,
  documentStatus?: string,
  landings?: { pln: string, dateLanded: string }[],
  documentNumber?: string,
  exporter?: string,
  pln?: string,
  areas?: string[],
  landingStatuses?: LandingStatus[],
  landingIds?: string[]
}

export interface IDocument {
  __t: string,
  contactId?: string,
  documentNumber: string,
  status?: string,
  createdAt?: Date | null,
  createdBy?: string,
  createdByEmail?: string,
  documentUri?: string,
  audit?: any[],
  investigation?: any,
  exportData?: any,
  requestByAdmin?: boolean,
  userReference?: string,
  numberOfFailedAttempts?: number,
  clonedFrom?: string,
  landingsCloned?: boolean,
  parentDocumentVoid?: boolean
}

export interface Catch {
  id: string;
  vessel?: string;
  pln?: string;
  homePort?: string;
  flag?: string; // jurisdiction under whose laws the vessel is registered or licensed
  cfr?: string; // cost and freight (CFR) is a legal term
  imoNumber?: string | null;
  licenceNumber?: string;
  licenceValidTo?: string;
  licenceHolder?: string;
  startDate?: string;
  date?: string;
  faoArea?: string;
  weight?: number;
  gearType?: string;
  _status?: LandingStatus;
  numberOfSubmissions?: number;
  vesselOverriddenByAdmin?: boolean;
  vesselNotFound?: boolean;
  dataEverExpected?: boolean;
  landingDataExpectedDate?: string;
  landingDataEndDate?: string;
  isLegallyDue?: boolean;
  vesselRiskScore?: number;
  exporterRiskScore?: number;
  speciesRiskScore?: number;
  threshold?: number;
  riskScore?: number;
  isSpeciesRiskEnabled?: boolean;
}

interface State {
  code: string,
  name?: string,
  admin?: string
}

interface Presentation {
  code: string,
  name?: string,
  admin?: string
}

export interface Product {
  speciesId: string,
  species?: string,
  speciesAdmin?: string,
  speciesCode?: string,
  scientificName?: string,
  commodityCode?: string,
  commodityCodeAdmin?: string,
  commodityCodeDescription?: string,
  state?: State,
  presentation?: Presentation,
  caughtBy?: Catch[],
  factor? : number,
  speciesOverriddenByAdmin?: boolean;
  stateAdmin?: string,
  presentationAdmin?: string,
}

interface BasicTransportDetails {
  vehicle: string,
  exportedFrom?: string,
  departurePlace? : string,
  exportDate? : string,
  exportedTo? : ICountry,
}

interface Train extends BasicTransportDetails {
  railwayBillNumber: string,
}

interface Plane extends BasicTransportDetails {
  flightNumber: string,
  containerNumber: string
}

interface ContainerVessel extends BasicTransportDetails {
  vesselName: string,
  flagState: string,
  containerNumber: string
}

interface Truck extends BasicTransportDetails {
  cmr?: boolean,
  nationalityOfVehicle?: string,
  registrationNumber?: string
}

export type Transport = Train | Plane | ContainerVessel | Truck;