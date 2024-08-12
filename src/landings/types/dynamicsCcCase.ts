import { ICountry } from './appConfig/countries';
import {
  CertificateExporterAndCompany,
  CertificateAudit
} from "./defraValidation";

export interface IDynamicsCatchCertificateCase {
    da: string;
    caseType1: CaseOneType;
    caseType2: CaseTwoType;
    numberOfFailedSubmissions: number;
    isDirectLanding: boolean;
    documentNumber: string;
    documentUrl?: string;
    documentDate?: string;
    exporter: CertificateExporterAndCompany;
    exportedTo: ICountry;
    landings?: IDynamicsLanding[];
    _correlationId: string;
    requestedByAdmin: boolean;
    isUnblocked?: boolean;
    vesselOverriddenByAdmin?: boolean;
    speciesOverriddenByAdmin?: boolean;
    audits?: CertificateAudit[];
    failureIrrespectiveOfRisk?: boolean;
    clonedFrom?: string;
    landingsCloned?: boolean;
    parentDocumentVoid?: boolean;
}

export interface IBaseLanding {
    id: string;
    landingDate: string;
    is14DayLimitReached: boolean;
    species: string;
    state: string;
    presentation: string;
    cnCode: string;
    commodityCodeDescription: string;
    scientificName: string;
    vesselName : string;
    vesselPln: string;
    vesselLength: number;
    licenceHolder: string;
    source?: string;
    weight: number;
    numberOfTotalSubmissions: number;
    validation: IDynamicsLandingValidation;
    risking?: IDynamicsRisk;
    vesselOverriddenByAdmin: boolean;
    speciesOverriddenByAdmin:boolean;
    speciesAlias?: string;
    speciesAnomaly?: string;
    dataEverExpected: boolean;
    vesselAdministration: string;
    landingDataExpectedDate?: string;
    landingDataEndDate?: string;
    landingDataExpectedAtSubmission?: boolean;
    landingOutcomeAtSubmission?: LandingOutcomeType;
    landingOutcomeAtRetrospectiveCheck?: LandingRetrospectiveOutcomeType;
    isLate?: boolean;
    dateDataReceived?: string;
    adminSpecies?: string;
    adminState?: string;
    adminPresentation?: string;
    adminCommodityCode?: string;
  }

export interface IDynamicsLanding extends IBaseLanding {
    status: LandingStatusType;
}

export interface IDynamicsLandingValidation {
    liveExportWeight: number;
    totalWeightForSpecies?: number;
    totalLiveForExportSpecies?: number;
    totalEstimatedForExportSpecies?: number;
    totalEstimatedWithTolerance?: number;
    totalRecordedAgainstLanding?: number;
    landedWeightExceededBy?: number | null;
    rawLandingsUrl?: string;
    salesNoteUrl?: string;
    isLegallyDue: boolean;
}

export interface IDynamicsRisk {
    vessel?: string;
    speciesRisk?: string;
    exporterRiskScore?: string;
    landingRiskScore?: string;
    highOrLowRisk?: LevelOfRiskType;
    overuseInfo?: string[];
    isSpeciesRiskEnabled?: boolean;
}

export enum CaseOneType {
    CatchCertificate = 'CC',
    ProcessingStatement = 'PS',
    StorageDocument = 'SD'
}

export enum CaseTwoType {
    RealTimeValidation_Rejected = 'Real Time Validation - Rejected',
    RealTimeValidation_NoLandingData = 'Real Time Validation - No Landing Data',
    RealTimeValidation_Overuse = 'Real Time Validation - Overuse Failure',
    PendingLandingData = 'Pending Landing Data',
    DataNeverExpected = 'Data Never Expected',
    Success = 'Real Time Validation - Successful',
    VoidByExporter = 'Void by an Exporter',
    VoidByAdmin = 'Void by SMO/PMO'
}

export enum LevelOfRiskType {
    High = 'High',
    Low = 'Low'
}

export enum LandingStatusType {
    ValidationSuccess = 'Validation Success',
    ValidationFailure_Overuse = 'Overuse Failure',
    ValidationFailure_Weight = 'Weight Failure',
    ValidationFailure_Species = 'Species Failure',
    ValidationFailure_NoLandingData = 'No Landing Data Failure',
    ValidationFailure_NoLicenceHolder = 'Validation Failure - No Licence Holder',
    DataNeverExpected = 'Data Never Expected',
    ValidationFailure_WeightAndOveruse = 'Weight and Overuse Failure',
    PendingLandingData_DataNotYetExpected = 'Pending Landing Data - Data Not Yet Expected',
    PendingLandingData_DataExpected = 'Pending Landing Data - Data Expected',
    PendingLandingData_ElogSpecies = 'Pending Landing Data - Elog Species'
}

export enum DefraCcLandingStatusType {
    ValidationSuccess = 'Validation Success',
    ValidationFailure_Overuse = 'Validation Failure - Overuse',
    ValidationFailure_Weight = 'Validation Failure - Weight',
    ValidationFailure_Species = 'Validation Failure - Species',
    ValidationFailure_NoLandingData = 'Validation Failure - No Landing Data',
    ValidationFailure_NoLicenceHolder = 'Validation Failure - No Licence Holder',
    DataNeverExpected = 'Data Never Expected',
    ValidationFailure_WeightAndOveruse = 'Validation Failure - Weight And Overuse',
    PendingLandingData_DataNotYetExpected = 'Pending Landing Data - Data Not Yet Expected',
    PendingLandingData_DataExpected = 'Pending Landing Data - Data Expected',
    PendingLandingData_ElogSpecies = 'Pending Landing Data - Elog Species'
}

export enum LandingOutcomeType {
    Success = 'Success',
    Rejected = 'Rejected'
}

export enum LandingRetrospectiveOutcomeType {
    Success = 'Success',
    Failure = 'Failure'
}