import { ILandingAggregatedItemBreakdown } from './landing';

export interface ICcQueryResult {
  // From the catchCert
  documentNumber: string;
  documentType: string;
  status: string | undefined;
  createdAt: string;
  rssNumber: string;
  da: string;
  // Fishing trip start date
  startDate?: string;
  dateLanded: string;
  species: string;
  weightFactor: number;
  weightOnCert: number;
  rawWeightOnCert: number;
  weightOnAllCerts: number;
  weightOnAllCertsBefore: number;
  weightOnAllCertsAfter: number;
  // Is there a landing?
  isLandingExists: boolean;
  hasSalesNote?: boolean;
  // Date of landing received
  firstDateTimeLandingDataRetrieved?: string;
  isSpeciesExists: boolean;
  // From the landing
  numberOfLandingsOnDay: number;
  weightOnLanding: number;
  landingTotalBreakdown?: ILandingAggregatedItemBreakdown[];
  weightOnLandingAllSpecies: number;
  // Some derivations
  isOverusedThisCert: boolean;
  isOverusedAllCerts: boolean;
  // Linked certs
  overUsedInfo: string[];
  durationSinceCertCreation: string;
  durationBetweenCertCreationAndFirstLandingRetrieved: string | null;
  durationBetweenCertCreationAndLastLandingRetrieved: string | null;
  extended: any;
  // Source of landing only when found
  source?: string;
  isExceeding14DayLimit: boolean;
  isPreApproved?: boolean;
  // species mismatch
  speciesAlias?: string,
  speciesAnomaly?: string
}

export interface IBatchReportBase {
  documentNumber: string;
  documentType: string;
  documentStatus: string;
  documentUrl: string;
  timestamp: string;
  date: string | undefined;
  time: string | undefined;
  exporter: string;
  exporterCompanyName: string;
  id: string;
  exporterName: string;
  authority: string;
  speciesCode: string;
  speciesName: string;
  weight: number;
}

export interface ICcBatchReport extends IBatchReportBase {
  directLanding: string;
  vessel: string;
  pln: string;
  rssNumber: string;
  dateLanded: string;
  productState: string;
  productPresentation: string;
  productCommodityCode: string;
  investigatedBy: string;
  investigationStatus: string;
}

export interface ICcBatchValidationReport extends ICcBatchReport {
  speciesAlias: string | undefined;
  speciesAnomaly: string | undefined;
  rawLandingsUrl: string;
  salesNotesUrl: string;
  voidedBy: string | undefined;
  preApprovedBy: string | undefined;
  weightFactor: number | undefined;
  exportWeight: number | undefined;
  weightOnLandingAllSpecies: number | undefined;
  landingBreakdowns: string | undefined;
  aggregatedLandedDecWeight: number | undefined,
  aggregatedLiveWeight: number | undefined,
  aggregatedEstimateWeight: number | undefined,
  aggregatedEstimateWeightPlusTolerance: number | undefined,
  exportedWeightExceedingEstimateLandedWeight: number | undefined;
  FI0_41_unavailabilityDuration: string;
  FI0_47_unavailabilityExceeds14Days: string | undefined;
  FI0_288_numberOfLandings: number | undefined;
  FI0_289_speciesMismatch: string | undefined;
  FI0_290_exportedWeightExceedingLandedWeight: string;
  FI0_291_totalExportWeights: number;
  FI0_136_numberOfFailedValidations: number;
}