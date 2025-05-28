import { ICountry } from "./appConfig/countries";
import { CatchCertificateTransport, CertificateAudit, CertificateExporterAndCompany, CertificateTransport } from "./defraValidation";
import { CaseOneType, CaseTwoType, DefraCcLandingStatusType, IBaseLanding } from "./dynamicsCcCase";

export enum CatchArea {
  FAO18 = "FAO18",
  FAO21 = "FAO21",
  FAO27 = "FAO27",
  FAO31 = "FAO31",
  FAO34 = "FAO34",
  FAO37 = "FAO37",
  FAO41 = "FAO41",
  FAO47 = "FAO47",
  FAO48 = "FAO48",
  FAO51 = "FAO51",
  FAO57 = "FAO57",
  FAO58 = "FAO58",
  FAO61 = "FAO61",
  FAO67 = "FAO67",
  FAO71 = "FAO71",
  FAO77 = "FAO77",
  FAO81 = "FAO81",
  FAO87 = "FAO87",
  FAO88 = "FAO88"
}

export enum CertificateStatus {
  COMPLETE = "COMPLETE",
  BLOCKED = "BLOCKED",
  VOID = "VOID"
}

export interface IDefraTradeLanding extends IBaseLanding {
  status: DefraCcLandingStatusType;
  flag: string
  homePort: string
  catchArea: CatchArea
  fishingLicenceNumber: string
  fishingLicenceValidTo: string
  imo: number | null
}

export interface IDefraTradeCatchCertificate {
  da: string;
  certStatus: CertificateStatus;
  caseType1: CaseOneType;
  caseType2: CaseTwoType;
  numberOfFailedSubmissions: number;
  isDirectLanding: boolean;
  documentNumber: string;
  documentUrl?: string;
  documentDate?: string;
  exporter: CertificateExporterAndCompany;
  exportedTo: ICountry;
  landings?: IDefraTradeLanding[] | null;
  _correlationId: string;
  requestedByAdmin: boolean;
  isUnblocked?: boolean;
  vesselOverriddenByAdmin?: boolean;
  speciesOverriddenByAdmin?: boolean;
  audits?: CertificateAudit[];
  failureIrrespectiveOfRisk?: boolean;
  transportation?: CertificateTransport;
  transportations?: CatchCertificateTransport[];
  multiVesselSchedule: boolean;
}