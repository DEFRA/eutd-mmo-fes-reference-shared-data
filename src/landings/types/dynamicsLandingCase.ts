import { ICountry } from "./appConfig/countries";
import { CertificateExporterAndCompany } from "./defraValidation";
import { IDynamicsLanding } from "./dynamicsCcCase";

export interface IDynamicsLandingCase extends IDynamicsLanding {
  exporter: CertificateExporterAndCompany;
  documentNumber: string;
  documentDate: string;
  documentUrl: string;
  _correlationId: string;
  requestedByAdmin: boolean;
  numberOfFailedSubmissions: number;
  exportedTo: ICountry;
}