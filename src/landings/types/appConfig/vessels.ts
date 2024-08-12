export interface IVessel {
  registrationNumber: string,
  fishingVesselName: string,
  flag: string,
  homePort: string,
  fishingLicenceNumber: string,
  imo: number | string | null,
  fishingLicenceValidFrom?: string,
  fishingLicenceValidTo: string,
  rssNumber: string,
  vesselLength: number,
  adminPort?: string,
  ircs?: string | null,
  cfr?: string | null,
  licenceHolderName?: string | null,
  vesselNotFound?: boolean
}

export interface ILicence {
  rssNumber: string;
  da: string;
  homePort: string;
  flag: string;
  imoNumber: number | string | null;
  licenceNumber: string;
  licenceValidTo: string;
  licenceHolder: string;
  vesselLength: number;
}