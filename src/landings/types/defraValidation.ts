import { ICountry } from './appConfig/countries';
import { DefraCcLandingStatusType, IDynamicsRisk, LandingOutcomeType, LandingRetrospectiveOutcomeType } from './dynamicsCcCase';

export interface IDefraValidationReport  {
    certificateId:      string;
    status:             string;
    requestedByAdmin:   boolean;
    landingId?:         string;
    validationPass?:    boolean;
    lastUpdated?:       Date;
    isUnblocked?:       boolean;
}

export interface CertificateAddress {
    address_line?: string;
    building_number?: string | null;
    sub_building_name?: string;
    building_name?: string;
    street_name?: string;
    county?: string | null;
    country?: string;
    line1? : string;
    line2? : string;
    city : string;
    postCode?: string;
}

export interface CertificateAudit {
    auditOperation: string;
    investigationStatus?: string;
    user: string;
    auditAt: Date;
}

export interface CertificateCompany {
    companyName: string;
    address: CertificateAddress;
    contactId? : string;
    accountId: string;
    dynamicsAddress : any;
}

export interface CertificateExporterAndCompany {
    fullName: string;
    companyName: string;
    contactId? : string;
    accountId?: string;
    address: CertificateAddress;
    dynamicsAddress?: any;
}

export interface CertificateAuthority {
  name: string,
  companyName: string,
  address: string,
  tel: string,
  email:  string,
  dateIssued: string,
}

export interface CertificateConsignment {
    description: string;
    personResponsible: string;
}

export interface HealthCertificate {
    number: string;
    date: string;
}

export interface CertificatePlant {
    approvalNumber: string;
    name: string;
    address: CertificateAddress;
    dateOfAcceptance: string;
}

export interface CertificateStorageFacility {
    name?: string;
    address: CertificateAddress;
}

interface ModeOfTransport {
    modeofTransport: string;
    exportLocation?: string;
    exportDate?: string;
}

export interface Truck extends ModeOfTransport {
    hasRoadTransportDocument: boolean;
    nationality?: string;
    registration?: string;
}

export interface Train extends ModeOfTransport {
    billNumber: string;
}

export interface Plane extends ModeOfTransport {
    flightNumber: string;
    containerId: string;
}

export interface Vessel extends ModeOfTransport {
    name: string;
    flag: string;
    containerId: string;
}

type FishingVessel = ModeOfTransport;

export type CertificateTransport = Truck | Train | Plane | Vessel | FishingVessel;

export interface CertificateFish {
    name: string;
    code: string;
    scientificName?: string;
}

export interface CertificateLandingVessel {
    name: string,
    pln: string,
    length: number,
    fao?: string,
    flag: string, // the jurisdiction under whose laws the vessel is registered or licensed
    cfr: string // cost and freight (CFR)
}

export interface CertificateLanding {
    startDate?: string;
    date: string;
    species: CertificateFish;
    state: CertificateFish;
    presentation: CertificateFish;
    cnCode: string;
    cnCodeDesc?: string;
    vessel: CertificateLandingVessel;
    exportWeight: number;
    isDirectLanding: boolean;
    isValidationFailed?: boolean;
    isSpeciesMisMatch?: boolean;
    isExporterLandingOveruse?: boolean;
    isOveruse?: boolean;
    isLandingDataAvailable?: boolean;
    rss?: string;
    exportWeightFactor?: number;
    landingBreakdown?: object;
    totalWeightRecordedAgainstLanding?: number;
    isNoLandingDataTimeExceeded?: boolean;
    daysWithNoLandingData?: string;
    landedWeightExceededAmount?: number;
    totalWeightExported?: number;
    rawLandingsDataUrl?: string;
    rawSalesNotesDataUrl?: string;
    isLegallyDue?: boolean;
    vesselAdministration?: string;
    dataEverExpected?: boolean;
    landingDataExpectedDate?: string;
    landingDataEndDate?: string;
    isLate?: boolean;
    dateDataReceived?: string;
    landingDataExpectedAtSubmission?: boolean;
    adminSpecies?: string;
    adminState?: string;
    adminPresentation?: string;
    adminCommodityCode?: string;
    speciesOverriddenByAdmin?: boolean;
    risking?: IDynamicsRisk;
    landingValidationstatusAtSubmission?: DefraCcLandingStatusType; 
    landingOutcomeAtSubmission?: LandingOutcomeType; 
    landingValidationstatusAtRetrospective?: DefraCcLandingStatusType;
    landingOutcomeAtRetrospectiveCheck?: LandingRetrospectiveOutcomeType;
}

interface Created {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

export interface IDefraValidationCatchCertificate {
    documentType:           string;
    documentNumber:         string;
    status:                 string;
    devolvedAuthority?:     string;
    dateCreated?:           Date;
    lastUpdated?:           Date;
    created?:               Created;
    userReference?:         string;
    audits?:                CertificateAudit[];
    exporterDetails?:       CertificateExporterAndCompany;
    landings?:              CertificateLanding[];
    conservationReference?: string;
    documentUri?:           string;
    exportedFrom?:          string;
    exportedTo?:            ICountry;
    transportation?:        CertificateTransport;
    failedSubmissions?:     number;
    _correlationId:         string;
    requestedByAdmin:       boolean;
    clonedFrom?:            string;
    landingsCloned?:        boolean;
    parentDocumentVoid?:    boolean;
}