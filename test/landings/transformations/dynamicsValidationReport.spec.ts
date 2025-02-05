import moment from 'moment';
import * as SUT from '../../../src/landings/transformations/dynamicsValidation';
import { CertificateExporterAndCompany } from '../../../src/landings/types/defraValidation';
import { ICcQueryResult, IDocument, IDynamicsLanding, InvestigationStatus, LandingOutcomeType, LandingRetrospectiveOutcomeType, LandingSources, LandingStatusType, LevelOfRiskType } from '../../../src/landings/types';
import { ICountry } from '../../../src/landings/types/appConfig/countries';

moment.suppressDeprecationWarnings = true;

const exampleCc: IDocument = {
  "createdAt": new Date("2020-06-24T10:39:32.000Z"),
  "__t": "catchCert",
  "createdBy": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
  "status": "COMPLETE",
  "documentNumber": "GBR-2020-CC-1BC924FCF",
  "requestByAdmin": false,
  "audit": [
    {
      "eventType": "INVESTIGATED",
      "triggeredBy": "Chris Waugh",
      "timestamp": new Date("2020-06-24T10:40:18.780Z"),
      "data": {
        "investigationStatus": "UNDER_INVESTIGATION"
      }
    },
    {
      "eventType": "INVESTIGATED",
      "triggeredBy": "Chris Waugh",
      "timestamp": new Date("2020-06-24T10:40:23.439Z"),
      "data": {
        "investigationStatus": "CLOSED_NFA"
      }
    }
  ],
  "userReference": "MY REF",
  "exportData": {
    "exporterDetails": {
      "contactId": "a contact id",
      "accountId": "an account id",
      "exporterFullName": "Bob Exporter",
      "exporterCompanyName": "Exporter Co",
      "addressOne": "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
      "townCity": "T",
      "postcode": "AB1 1AB",
      "buildingNumber": "123",
      "subBuildingName": "Unit 1",
      "buildingName": "CJC Fish Ltd",
      "streetName": "17  Old Edinburgh Road",
      "county": "West Midlands",
      "country": "England",
      "_dynamicsAddress": { "dynamicsData": 'original address' },
      "_dynamicsUser": {
        "firstName": 'Bob',
        "lastName": 'Exporter'
      }
    },
    "products": [
      {
        "species": "European lobster (LBE)",
        "speciesId": "4e5fff23-184c-4a46-beef-e93ccd040392",
        "speciesCode": "LBE",
        "commodityCode": "03063210",
        "commodityCodeDescription": "Fresh or chilled fillets of cod \"Gadus morhua, Gadus ogac, Gadus macrocephalus\" and of Boreogadus saida",
        "scientificName": "Gadus morhua",
        "state": {
          "code": "ALI",
          "name": "Alive"
        },
        "presentation": {
          "code": "WHL",
          "name": "Whole"
        },
        "factor": 1,
        "caughtBy": [
          {
            "vessel": "WIRON 5",
            "pln": "H1100",
            "id": "5a259dc5-b05c-44fe-8d3f-7ee8cc99bfca",
            "date": "2020-06-24",
            "faoArea": "FAO27",
            "weight": 100
          }
        ]
      },
      {
        "species": "Atlantic cod (COD)",
        "speciesId": "6763576e-c5b8-41cf-a708-f4b9a470623e",
        "speciesCode": "COD",
        "commodityCode": "03025110",
        "state": {
          "code": "FRE",
          "name": "Fresh"
        },
        "presentation": {
          "code": "GUT",
          "name": "Gutted"
        },
        "factor": 1.17,
        "caughtBy": [
          {
            "vessel": "WIRON 5",
            "pln": "H1100",
            "id": "2e9da3e5-5e31-4555-abb4-9e5e53b8d0ef",
            "date": "2020-06-02",
            "faoArea": "FAO27",
            "weight": 200
          },
          {
            "vessel": "WIRON 6",
            "pln": "H2200",
            "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
            "date": "2020-05-31",
            "faoArea": "FAO27",
            "weight": 200
          }
        ]
      }
    ],
    "conservation": {
      "conservationReference": "UK Fisheries Policy"
    },
    "transportation": {
      "vehicle": "truck",
      "exportedFrom": "United Kingdom",
      "exportedTo": {
        "officialCountryName": "Nigeria",
        "isoCodeAlpha2": "NG",
        "isoCodeAlpha3": "NGA",
        "isoNumericCode": "566"
      },
      "cmr": true
    }
  },
  "createdByEmail": "foo@foo.com",
  "documentUri": "_44fd226f-598f-4615-930f-716b2762fea4.pdf",
  "investigation": {
    "investigator": "Chris Waugh",
    "status": "CLOSED_NFA"
  },
  "numberOfFailedAttempts": 5
}

describe('When mapping from an ICcQueryResult to an Landing Status', () => {
  const queryTime = moment.utc();

  describe('When validating against a Landing dec or Catch Recording', () => {

    it('will flag as `Validation Success` if there are not failures', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [{
          factor: 1.7,
          isEstimate: true,
          weight: 30,
          liveWeight: 51,
          source: LandingSources.LandingDeclaration
        }],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationSuccess)
    });

    it('will flag as `Data never expected` if dataEverExpected is false', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [{
          factor: 1.7,
          isEstimate: true,
          weight: 30,
          liveWeight: 51,
          source: LandingSources.LandingDeclaration
        }],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          dataEverExpected: false,
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.DataNeverExpected)
    });

    it('will flag as `Overuse Failure` if the cert is overuse', () => {

      const input: ICcQueryResult = {
        documentNumber: "GBR-2024-CC-26F85FD5A",
        documentType: "catchCertificate",
        createdAt: "2024-09-13T10:40:40.023Z",
        status: "COMPLETE",
        extended: {
          exporterContactId: "42baa958-e498-e911-a962-000d3ab6488a",
          exporterName: "harshal edake",
          exporterCompanyName: "Capgemini",
          exporterPostCode: "CH3 7PN",
          vessel: "CATHARINA OF LADRAM",
          landingId: "GBR-2024-CC-26F85FD5A-6863951470",
          pln: "BM111",
          fao: "FAO27",
          flag: "GBR",
          cfr: "GBR000C19045",
          presentation: "WHL",
          presentationName: "Whole",
          species: "Common squids nei (SQC)",
          scientificName: "Loligo spp",
          state: "FRE",
          stateName: "Fresh",
          commodityCode: "03074220",
          commodityCodeDescription: "Squid \"Loligo spp.\", live, fresh or chilled",
          transportationVehicle: "truck",
          numberOfSubmissions: 1,
          speciesOverriddenByAdmin: false,
          licenceHolder: "WATERDANCE LIMITED ",
          dataEverExpected: true,
          landingDataExpectedDate: "2024-07-19",
          landingDataEndDate: "2024-08-02",
          isLegallyDue: true,
          homePort: "BRIXHAM",
          imoNumber: 9019365,
          licenceNumber: "11930",
          licenceValidTo: "2030-12-31"
        },
        rssNumber: "C19045",
        da: "England",
        dateLanded: "2024-07-19",
        species: "SQC",
        weightFactor: 1,
        weightOnCert: 100,
        rawWeightOnCert: 100,
        weightOnAllCerts: 400,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        isLandingExists: true,
        isExceeding14DayLimit: false,
        speciesAlias: "N",
        durationSinceCertCreation: "PT0.008S",
        source: "LANDING_DECLARATION",
        weightOnLandingAllSpecies: 100,
        numberOfLandingsOnDay: 1,
        durationBetweenCertCreationAndFirstLandingRetrieved: "-PT19H49M5.517S",
        durationBetweenCertCreationAndLastLandingRetrieved: "-PT19H49M5.517S",
        firstDateTimeLandingDataRetrieved: "2024-09-12T14:51:34.506Z",
        isSpeciesExists: true,
        weightOnLanding: 100,
        landingTotalBreakdown: [
          {
            presentation: "WHL",
            state: "FRE",
            source: "LANDING_DECLARATION",
            isEstimate: false,
            factor: 1,
            weight: 100,
            liveWeight: 100
          }
        ],
        isOverusedThisCert: false,
        isOverusedAllCerts: true,
        overUsedInfo: [
          "GBR-2024-CC-26F85FD5A"
        ]
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Overuse);
    });

    it('will flag as `Overuse Failure` if the cert is overuse with species alias', () => {

      const input: ICcQueryResult = {
        documentNumber: "GBR-2024-CC-26F85FD5A",
        documentType: "catchCertificate",
        createdAt: "2024-09-13T10:40:40.023Z",
        status: "COMPLETE",
        extended: {
          exporterContactId: "42baa958-e498-e911-a962-000d3ab6488a",
          exporterName: "harshal edake",
          exporterCompanyName: "Capgemini",
          exporterPostCode: "CH3 7PN",
          vessel: "CATHARINA OF LADRAM",
          landingId: "GBR-2024-CC-26F85FD5A-1331378976",
          pln: "BM111",
          fao: "FAO27",
          flag: "GBR",
          cfr: "GBR000C19045",
          presentation: "WHL",
          presentationName: "Whole",
          species: "European squid (SQR)",
          scientificName: "Loligo vulgaris",
          state: "FRE",
          stateName: "Fresh",
          commodityCode: "03074220",
          commodityCodeDescription: "Squid \"Loligo spp.\", live, fresh or chilled",
          transportationVehicle: "truck",
          numberOfSubmissions: 1,
          speciesOverriddenByAdmin: false,
          licenceHolder: "WATERDANCE LIMITED ",
          dataEverExpected: true,
          landingDataExpectedDate: "2024-07-19",
          landingDataEndDate: "2024-08-02",
          isLegallyDue: true,
          homePort: "BRIXHAM",
          imoNumber: 9019365,
          licenceNumber: "11930",
          licenceValidTo: "2030-12-31"
        },
        rssNumber: "C19045",
        da: "England",
        dateLanded: "2024-07-19",
        species: "SQR",
        weightFactor: 1,
        weightOnCert: 100,
        rawWeightOnCert: 100,
        weightOnAllCerts: 400,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        isLandingExists: true,
        isExceeding14DayLimit: false,
        speciesAlias: "Y",
        durationSinceCertCreation: "PT0.008S",
        source: "LANDING_DECLARATION",
        weightOnLandingAllSpecies: 100,
        numberOfLandingsOnDay: 1,
        durationBetweenCertCreationAndFirstLandingRetrieved: "-PT19H49M5.517S",
        durationBetweenCertCreationAndLastLandingRetrieved: "-PT19H49M5.517S",
        firstDateTimeLandingDataRetrieved: "2024-09-12T14:51:34.506Z",
        speciesAnomaly: "SQC",
        isSpeciesExists: true,
        weightOnLanding: 100,
        landingTotalBreakdown: [
          {
            presentation: "WHL",
            state: "FRE",
            source: "LANDING_DECLARATION",
            isEstimate: false,
            factor: 1,
            weight: 100,
            liveWeight: 100
          }
        ],
        isOverusedThisCert: false,
        isOverusedAllCerts: true,
        overUsedInfo: [
          "GBR-2024-CC-26F85FD5A"
        ]
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Overuse);
    });

    it('will flag as `Weight Failure` if the cert fails weight check', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.LandingDeclaration
          }
        ],
        isOverusedThisCert: true,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Weight);
    });

    it('will flag as `Weight Failure` if over use occurs on the same certificate - Weight and Overuse only applies if the landing has been used on more than one catch certificates', () => {
      const input: ICcQueryResult =     {
        documentNumber: "GBR-2024-CC-FA0CB09E3",
        documentType: "catchCertificate",
        createdAt: "2024-07-17T10:27:23.172Z",
        status: "COMPLETE",
        extended: {
          exporterContactId: "0eee9e71-61d5-ee11-904d-000d3ab00f0f",
          exporterName: "Gosia Miksza",
          exporterCompanyName: "weight failure retest EoDA2",
          exporterPostCode: "PE2 8YY",
          vessel: "HEATHER D",
          landingId: "GBR-2024-CC-FA0CB09E3-2521405671",
          pln: "LA8",
          fao: "FAO27",
          flag: "GBR",
          cfr: "GBR000B11377",
          presentation: "WHL",
          presentationName: "Whole",
          species: "Atlantic wolffish (CAA)",
          scientificName: "Anarhichas lupus",
          state: "FRE",
          stateName: "Fresh",
          commodityCode: "03028990",
          commodityCodeDescription: "Fresh or chilled fish, n.e.s.",
          transportationVehicle: "truck",
          numberOfSubmissions: 1,
          speciesOverriddenByAdmin: false,
          licenceHolder: "MR B THOMAS",
          dataEverExpected: true,
          landingDataExpectedDate: "2024-07-17",
          landingDataEndDate: "2024-07-22",
          isLegallyDue: false,
          homePort: "SWANSEA",
          imoNumber: null,
          licenceNumber: "11407",
          licenceValidTo: "2030-12-31"
        },
        rssNumber: "B11377",
        da: "Wales",
        dateLanded: "2024-07-16",
        species: "CAA",
        weightFactor: 1,
        weightOnCert: 85,
        rawWeightOnCert: 85,
        weightOnAllCerts: 85,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 85,
        isLandingExists: true,
        isExceeding14DayLimit: false,
        speciesAlias: "N",
        durationSinceCertCreation: "PT0.129S",
        source: "LANDING_DECLARATION",
        weightOnLandingAllSpecies: 60,
        numberOfLandingsOnDay: 1,
        durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.441S",
        durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.441S",
        firstDateTimeLandingDataRetrieved: "2024-07-17T10:27:22.731Z",
        isSpeciesExists: true,
        weightOnLanding: 30,
        landingTotalBreakdown: [
          {
            presentation: "WHL",
            state: "FRE",
            source: "LANDING_DECLARATION",
            isEstimate: false,
            factor: 1,
            weight: 30,
            liveWeight: 30
          }
        ],
        isOverusedThisCert: true,
        isOverusedAllCerts: true,
        overUsedInfo: [
          "GBR-2024-CC-FA0CB09E3"
        ]
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Weight);
    });

    it('will flag as `Weight and Overuse Failure` if the cert fails weight and overuse check both', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.LandingDeclaration
          }
        ],
        isOverusedThisCert: true,
        isOverusedAllCerts: true,
        isExceeding14DayLimit: false,
        overUsedInfo: ['CC1','CC2'],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_WeightAndOveruse);
    });

    it('will flag as `Species Failure` if the cert is a species mis-match', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.LandingDeclaration
          }
        ],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Species);
    });

    describe('When isLegallyDue is set to True and expected date is in future', () => {

      it('will not flag as `Pending Landing Data - Data Not Yet Expected` and flag as `Validation Success` if there are not failures', () => {
        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2024-02-04T08:26:06.939Z').toISOString(),
          status: 'COMPLETE',
          rssNumber: 'rssWA1',
          da: 'Guernsey',
          dateLanded: '2024-02-05',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: true,
          isSpeciesExists: true,
          numberOfLandingsOnDay: 1,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [{
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.LandingDeclaration
          }],
          isOverusedThisCert: false,
          isOverusedAllCerts: false,
          isExceeding14DayLimit: false,
          overUsedInfo: [],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12019-07-10',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            dataEverExpected: true,
            landingDataExpectedDate: '2024-02-08',
            landingDataEndDate: '2024-02-09',
            isLegallyDue: true,
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob'
          }
        }

        const result = SUT.toLandingStatus(input, false);

        expect(result).toEqual(LandingStatusType.ValidationSuccess)
      });

      it('will not flag as `Pending Landing Data - Data Not Yet Expected` and flag as `Overuse Failure` if the cert fails weight and overuse check both', () => {
        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: '2024-02-05T12:08:49.970Z',
          status: 'COMPLETE',
          extended: {
            exporterContactId: '123',
            exporterAccountId: '456',
            exporterName: 'Automation Tester',
            exporterCompanyName: 'Automation Testing Ltd',
            exporterPostCode: 'NE4 7YH',
            vessel: 'AGAN BORLOWEN',
            landingId: 'CC1-4986830728',
            pln: 'SS229',
            fao: 'FAO27',
            flag: 'GBR',
            cfr: 'GBR000C20415',
            presentation: 'WHL',
            presentationName: 'Whole',
            species: 'Atlantic cod (COD)',
            scientificName: 'Gadus morhua',
            state: 'FRE',
            stateName: 'Fresh',
            commodityCode: '03025110',
            commodityCodeDescription: 'Fresh or chilled cod "Gadus morhua"',
            transportationVehicle: 'truck',
            numberOfSubmissions: 1,
            speciesOverriddenByAdmin: false,
            licenceHolder: 'MR S CLARY-BROM ',
            dataEverExpected: true,
            landingDataExpectedDate: '2024-02-08',
            landingDataEndDate: '2024-02-09',
            isLegallyDue: true,
            homePort: 'NEWLYN',
            imoNumber: null,
            licenceNumber: '25072',
            licenceValidTo: '2030-12-31'
          },
          rssNumber: 'C20415',
          da: 'England',
          dateLanded: '2024-02-05',
          species: 'COD',
          weightFactor: 1,
          weightOnCert: 25,
          rawWeightOnCert: 25,
          weightOnAllCerts: 220,
          weightOnAllCertsBefore: 75,
          weightOnAllCertsAfter: 100,
          isLandingExists: true,
          isExceeding14DayLimit: false,
          speciesAlias: 'N',
          durationSinceCertCreation: 'PT0.006S',
          source: 'CATCH_RECORDING',
          weightOnLandingAllSpecies: 100,
          numberOfLandingsOnDay: 1,
          durationBetweenCertCreationAndFirstLandingRetrieved: '-PT1S',
          durationBetweenCertCreationAndLastLandingRetrieved: '-PT1S',
          firstDateTimeLandingDataRetrieved: '2024-02-05T10:44:07.254Z',
          isSpeciesExists: true,
          weightOnLanding: 100,
          landingTotalBreakdown: [
            {
              presentation: 'WHL',
              state: 'FRE',
              source: 'CATCH_RECORDING',
              isEstimate: true,
              factor: 1,
              weight: 100,
              liveWeight: 100
            }
          ],
          isOverusedThisCert: false,
          isOverusedAllCerts: true,
          overUsedInfo: [
            'CC2',
            'CC3',
          ],
          hasSalesNote: true
        }

        const result = SUT.toLandingStatus(input, false);

        expect(result).toEqual(LandingStatusType.ValidationFailure_Overuse);
      })

      it('will not flag as `Pending Landing Data - Data Not Yet Expected` and flag as `Weight Failure` if the cert fails weight check', () => {

        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2024-02-04T08:26:06.939Z').toISOString(),
          status: 'COMPLETE',
          rssNumber: 'rssWA1',
          da: 'Guernsey',
          dateLanded: '2024-02-05',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: true,
          isSpeciesExists: true,
          numberOfLandingsOnDay: 1,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [
            {
              factor: 1.7,
              isEstimate: true,
              weight: 30,
              liveWeight: 51,
              source: LandingSources.LandingDeclaration
            }
          ],
          isOverusedThisCert: true,
          isOverusedAllCerts: false,
          isExceeding14DayLimit: false,
          overUsedInfo: [],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12024-02-04',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            dataEverExpected: true,
            landingDataExpectedDate: '2024-02-08',
            landingDataEndDate: '2024-02-09',
            isLegallyDue: true,
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob'
          }
        }

        const result = SUT.toLandingStatus(input, false);

        expect(result).toEqual(LandingStatusType.ValidationFailure_Weight);
      });

      it('will not flag as `Pending Landing Data - Data Not Yet Expected` and flag as `Weight and Overuse Failure` if the cert fails weight and overuse check both', () => {

        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2024-02-04T08:26:06.939Z').toISOString(),
          status: 'COMPLETE',
          rssNumber: 'rssWA1',
          da: 'Guernsey',
          dateLanded: '2024-02-05',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: true,
          isSpeciesExists: true,
          numberOfLandingsOnDay: 1,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [
            {
              factor: 1.7,
              isEstimate: true,
              weight: 30,
              liveWeight: 51,
              source: LandingSources.LandingDeclaration
            }
          ],
          isOverusedThisCert: true,
          isOverusedAllCerts: true,
          isExceeding14DayLimit: false,
          overUsedInfo: ['CC1','CC2'],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2024-02-04T09:00:00.000Z')
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2024-02-04T09:00:00.000Z')
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12024-02-04',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            dataEverExpected: true,
            landingDataExpectedDate: '2024-02-08',
            landingDataEndDate: '2024-02-09',
            isLegallyDue: true,
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob'
          }
        }

        const result = SUT.toLandingStatus(input, false);

        expect(result).toEqual(LandingStatusType.ValidationFailure_WeightAndOveruse);
      });

      it('will not flag as `Pending Landing Data - Data Not Yet Expected` and flag as `Species Failure` if the cert is a species mis-match', () => {

        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2024-02-04T08:26:06.939Z').toISOString(),
          status: 'COMPLETE',
          rssNumber: 'rssWA1',
          da: 'Guernsey',
          dateLanded: '2024-02-05',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: true,
          isSpeciesExists: false,
          numberOfLandingsOnDay: 1,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [
            {
              factor: 1.7,
              isEstimate: true,
              weight: 30,
              liveWeight: 51,
              source: LandingSources.LandingDeclaration
            }
          ],
          isOverusedThisCert: false,
          isOverusedAllCerts: false,
          isExceeding14DayLimit: false,
          overUsedInfo: [],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2024-02-04T09:00:00.000Z')
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2024-02-03T09:00:00.000Z')
              .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12024-02-04',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            dataEverExpected: true,
            landingDataExpectedDate: '2024-02-08',
            landingDataEndDate: '2024-02-09',
            isLegallyDue: true,
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob'
          }
        }

        const result = SUT.toLandingStatus(input, false);

        expect(result).toEqual(LandingStatusType.ValidationFailure_Species);
      });

    })

  });

  describe('When validating against a logbook', () => {

    it('will flag as `Validation Success` if there are not failures', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationSuccess);
    });

    it('will flag as `Overuse Failure` if the cert is overuse', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: false,
        isOverusedAllCerts: true,
        isExceeding14DayLimit: false,
        overUsedInfo: ['CC1','CC2'],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Overuse);
    });

    it('will flag as `Weight Failure` if the cert fails weight check', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        documentType: 'catchCertificate',
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: true,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(queryTime
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended:
        {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Weight);
    });

    it('will flag as `Weight and Overuse Failure` if the cert fails both weight and overuse check', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        documentType: 'catchCertificate',
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: true,
        isOverusedAllCerts: true,
        isExceeding14DayLimit: false,
        overUsedInfo: ['CC1','CC2'],
        durationSinceCertCreation: moment.duration(queryTime
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended:
        {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_WeightAndOveruse);
    });

    it('will flag as `Species Failure` if the cert is a species missmatch', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Species);
    });

    it('will flag as `Species Failure` if the cert is a species missmatch on a landing initially validated with an ELOG', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          dataEverExpected: true,
          landingDataExpectedDate: '2019-07-11',
          landingDataEndDate: '2019-07-14',
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Species);
    });

    it('will flag as `Pending Landing Data - Elog species` if the cert is a species missmatch and species weight is under the 50 KG deminimus', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 20,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_ElogSpecies);
    });

    it('will flag as `Species Failure` if the cert is a Elog species mismatch and species weight is under the 50 KG deminimus and end date has reached at retrospective check', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 20,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: true,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_Species);
    });

    it('will flag as `Pending Landing Data - Elog Species` if isLegallyDue is true', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2024-02-04T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2024-02-05',
        species: 'LBE',
        weightOnCert: 50,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.ELog
          }
        ],
        source: LandingSources.ELog,
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2024-02-04T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12024-02-04',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          dataEverExpected: true,
          landingDataExpectedDate: '2024-02-08',
          landingDataEndDate: '2024-02-09',
          isLegallyDue: true,
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_ElogSpecies);
    });
  })

  describe('When no landing data found', () => {

    it('will flag as `No Landing Data Failure` if there is no landing data', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: '2019-07-12',
          landingDataEndDate: '2019-07-14'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `No Landing Data Failure` if landingDataExpectedDate is undefined and there is no landing data', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `No Landing Data Failure` if end date is in the past of the submission date', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: true,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: '2019-07-11',
          landingDataEndDate: '2019-07-12'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `No Landing Data Failure` if landing data is expected at submission but 14 day limit is crossed', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: true,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: '2019-07-13',
          landingDataEndDate: '2019-07-18'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `No Landing Data Failure` if landing data is not expected at submission but 14 day limit is crossed at retrospective check', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: true,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: '2019-07-16',
          landingDataEndDate: '2019-07-18'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `Pending Landing Data - Data Not Yet Expected` if landing data is not expected at submission', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: moment.utc().add(2, 'day').format('YYYY-MM-DD'),
          landingDataEndDate: moment.utc().add(3, 'day').format('YYYY-MM-DD')
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_DataNotYetExpected);
    });

    it('will flag as `Pending Landing Data - Data Not Yet Expected` if vessel has been overridden by an admin and landing data is not expected at submission', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'N/A',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: '2019-07-15',
          landingDataEndDate: '2019-08-14',
          vesselOverriddenByAdmin: true
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_DataNotYetExpected);
    });

    it('will flag as `Pending Landing Data - Data Expected` if there is no landing data during the retrospective period', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc().toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: moment.utc().format('YYYY-MM-DD'),
          landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_DataExpected);
    });

    it('will flag as `Pending Landing Data - Data Expected` if it is legallyDue and there is no landing data at the time of submission and it is inside of the retrospective period', () => {

      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc().toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          isLegallyDue: true,
          dataEverExpected: true,
          landingDataExpectedDate: moment.utc().format('YYYY-MM-DD'),
          landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_DataExpected);
    });

    it('will flag as `Pending Landing Data - Data Not Yet Expected` if it is legallyDue and landing data is not expected at submission', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-10T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          isLegallyDue: true,
          dataEverExpected: true,
          landingDataExpectedDate: '2019-07-13',
          landingDataEndDate: '2019-07-14'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_DataNotYetExpected);
    });

    it('will flag as `Pending Landing Data - Data Expected` if expected date is in the past of the submission date and enddate is in future and risk is Low', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2024-07-05T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2024-07-03',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 0,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          licenceHolder: 'Mr Bob',
          dataEverExpected: true,
          landingDataExpectedDate: '2024-07-05',
          landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD'),
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.PendingLandingData_DataExpected);
    });

    describe('When risking is high', () => {

      it('will flag as `No Landing Data Failure` if vessel has been overridden by an admin and landing data is not expected at submission', () => {

        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
          status: 'COMPLETE',
          rssNumber: 'N/A',
          da: 'Guernsey',
          dateLanded: '2019-07-10',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: false,
          isSpeciesExists: false,
          numberOfLandingsOnDay: 0,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [],
          isOverusedThisCert: false,
          isOverusedAllCerts: false,
          isExceeding14DayLimit: false,
          overUsedInfo: [],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12019-07-10',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob',
            dataEverExpected: true,
            landingDataExpectedDate: '2019-07-15',
            landingDataEndDate: '2019-08-14',
            vesselOverriddenByAdmin: true
          }
        }

        const result = SUT.toLandingStatus(input, true);

        expect(result).toEqual(LandingStatusType.ValidationFailure_NoLandingData);
      });

      it('will flag as `No Landing Data Failure` if end date is in the past of the submission date and risk is High', () => {
        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
          status: 'COMPLETE',
          rssNumber: 'rssWA1',
          da: 'Guernsey',
          dateLanded: '2019-07-10',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: false,
          isSpeciesExists: false,
          numberOfLandingsOnDay: 0,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [],
          isOverusedThisCert: false,
          isOverusedAllCerts: false,
          isExceeding14DayLimit: true,
          overUsedInfo: [],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12019-07-10',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob',
            dataEverExpected: true,
            landingDataExpectedDate: '2019-07-11',
            landingDataEndDate: '2019-07-12'
          }
        }

        const result = SUT.toLandingStatus(input, true);

        expect(result).toEqual(LandingStatusType.ValidationFailure_NoLandingData);
      });

      it('will flag as `Pending Landing Data - Data Expected` if expected date is in the past of the submission date and enddate is in future and risk is High', () => {
        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2024-07-05T08:26:06.939Z').toISOString(),
          status: 'BLOCKED',
          rssNumber: 'rssWA1',
          da: 'Guernsey',
          dateLanded: '2024-07-03',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: false,
          isSpeciesExists: false,
          numberOfLandingsOnDay: 0,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [],
          isOverusedThisCert: false,
          isOverusedAllCerts: false,
          isExceeding14DayLimit: false,
          overUsedInfo: [],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12019-07-10',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob',
            dataEverExpected: true,
            landingDataExpectedDate: '2024-07-05',
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD'),
          }
        }

        const result = SUT.toLandingStatus(input, true);

        expect(result).toEqual(LandingStatusType.PendingLandingData_DataExpected);
      });

      it('will flag as `Pending Landing Data - data not yet expected` if landing data is not expected at submission and risk is High', () => {
        const input: ICcQueryResult = {
          documentNumber: 'CC1',
          documentType: 'catchCertificate',
          createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
          status: 'COMPLETE',
          rssNumber: 'rssWA1',
          da: 'Guernsey',
          dateLanded: '2019-07-10',
          species: 'LBE',
          weightOnCert: 121,
          rawWeightOnCert: 122,
          weightOnAllCerts: 200,
          weightOnAllCertsBefore: 0,
          weightOnAllCertsAfter: 100,
          weightFactor: 5,
          isLandingExists: false,
          isSpeciesExists: false,
          numberOfLandingsOnDay: 0,
          weightOnLanding: 30,
          weightOnLandingAllSpecies: 30,
          landingTotalBreakdown: [],
          isOverusedThisCert: false,
          isOverusedAllCerts: false,
          isExceeding14DayLimit: false,
          overUsedInfo: [],
          durationSinceCertCreation: moment.duration(
            queryTime
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
            moment.utc('2019-07-11T09:00:00.000Z')
              .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
          extended: {
            landingId: 'rssWA12019-07-10',
            exporterName: 'Mr Bob',
            presentation: 'SLC',
            documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
            presentationName: 'sliced',
            vessel: 'DAYBREAK',
            fao: 'FAO27',
            pln: 'WA1',
            species: 'Lobster',
            state: 'FRE',
            stateName: 'fresh',
            commodityCode: '1234',
            investigation: {
              investigator: "Investigator Gadget",
              status: InvestigationStatus.Open
            },
            transportationVehicle: 'directLanding',
            licenceHolder: 'Mr Bob',
            dataEverExpected: true,
            landingDataExpectedDate: '2019-07-15',
            landingDataEndDate: '2019-08-12'
          }
        }

        const result = SUT.toLandingStatus(input, true);

        expect(result).toEqual(LandingStatusType.PendingLandingData_DataNotYetExpected);
      });
    });

  });

  describe('When no licence holder name found', () => {

    it('will flag as `Validation Failure - No Licence Holder` if the landing does not contain a licence holder', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: true,
        isSpeciesExists: true,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        landingTotalBreakdown: [
          {
            factor: 1.7,
            isEstimate: true,
            weight: 30,
            liveWeight: 51,
            source: LandingSources.LandingDeclaration
          }
        ],
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding'
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.ValidationFailure_NoLicenceHolder);
    });

  });

  describe('When Landing Data Never Expected', () => {

    it('will flag as `Data Never Expected`', () => {
      const input: ICcQueryResult = {
        documentNumber: 'CC1',
        documentType: 'catchCertificate',
        createdAt: moment.utc('2019-07-13T08:26:06.939Z').toISOString(),
        status: 'COMPLETE',
        rssNumber: 'rssWA1',
        da: 'Guernsey',
        dateLanded: '2019-07-10',
        species: 'LBE',
        weightOnCert: 121,
        rawWeightOnCert: 122,
        weightOnAllCerts: 200,
        weightOnAllCertsBefore: 0,
        weightOnAllCertsAfter: 100,
        weightFactor: 5,
        isLandingExists: false,
        isSpeciesExists: false,
        numberOfLandingsOnDay: 1,
        weightOnLanding: 30,
        weightOnLandingAllSpecies: 30,
        isOverusedThisCert: false,
        isOverusedAllCerts: false,
        isExceeding14DayLimit: false,
        overUsedInfo: [],
        durationSinceCertCreation: moment.duration(
          queryTime
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
          moment.utc('2019-07-11T09:00:00.000Z')
            .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
        extended: {
          landingId: 'rssWA12019-07-10',
          exporterName: 'Mr Bob',
          presentation: 'SLC',
          documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
          presentationName: 'sliced',
          vessel: 'DAYBREAK',
          fao: 'FAO27',
          pln: 'WA1',
          species: 'Lobster',
          state: 'FRE',
          stateName: 'fresh',
          commodityCode: '1234',
          investigation: {
            investigator: "Investigator Gadget",
            status: InvestigationStatus.Open
          },
          transportationVehicle: 'directLanding',
          dataEverExpected: false
        }
      }

      const result = SUT.toLandingStatus(input, false);

      expect(result).toEqual(LandingStatusType.DataNeverExpected);
    });

  });

});

describe('When mapping toExporter', () => {
  it('will return a CertificateExporterAndCompany', () => {
    const expeceted: CertificateExporterAndCompany = {
      accountId: "an account id",
      address: {
        building_name: "CJC Fish Ltd",
        building_number: "123",
        city: "T",
        country: "England",
        county: "West Midlands",
        line1: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
        postCode: "AB1 1AB",
        street_name: "17  Old Edinburgh Road",
        sub_building_name: "Unit 1",
      },
      companyName: "Exporter Co",
      contactId: "a contact id",
      dynamicsAddress: {
        dynamicsData: "original address",
      },
      fullName: "Bob Exporter",
    }


    expect(SUT.toExporter(exampleCc)).toStrictEqual(expeceted);
  });
});

describe('When mapping toExportedTo', () => {

  it('will return a CertificateExporterAndCompany', () => {
    const expeceted: ICountry = {
      isoCodeAlpha2: "NG",
      isoCodeAlpha3: "NGA",
      officialCountryName: "Nigeria",
    };

    expect(SUT.toExportedTo(exampleCc)).toStrictEqual(expeceted);
  });

  it('will return with no transportation', () => {
    expect(SUT.toExportedTo({ ...exampleCc, exportData: undefined })).toStrictEqual({
      isoCodeAlpha2: undefined,
      isoCodeAlpha3: undefined,
      officialCountryName: undefined,
    });
  });
});

describe('when mapping isLandingDataLate', () => {
  it('will return undefined', () => {
    expect(SUT.isLandingDataLate('invalid date', 'invalid date')).toBeUndefined();
  })
});

describe('when mapping level of risk', () => {
  it('will contain the correct landing statuses', () => {
    expect(LevelOfRiskType.High).toBe('High');
    expect(LevelOfRiskType.Low).toBe('Low');
  });
});

describe('when mapping landing outcome type', () => {
  it('will contain the correct landing outcome', () => {
    expect(LandingOutcomeType.Success).toBe('Success');
    expect(LandingOutcomeType.Rejected).toBe('Rejected');
  });
});

describe('when mapping landing retrospective outcome type', () => {
  it('will contain the correct landing retrospective outcome', () => {
    expect(LandingRetrospectiveOutcomeType.Success).toBe('Success');
    expect(LandingRetrospectiveOutcomeType.Failure).toBe('Failure');
  });
});

describe('when mapping has14DayLimitReached', () => {

  it('will set 14DayLimitReached to true when landing data is not expected', () => {
    const input: ICcQueryResult = {
      documentNumber: "GBR-2024-CC-5D31C8ADF",
      documentType: "catchCertificate",
      createdAt: "2024-06-12T13:05:35.209Z",
      status: "COMPLETE",
      extended: {
        exporterContactId: "0eee9e71-61d5-ee11-904d-000d3ab00f0f",
        exporterName: "Gosia Miksza",
        exporterCompanyName: "Scenario 12",
        exporterPostCode: "PE2 8YY",
        vessel: "CELTIC",
        landingId: "GBR-2024-CC-5D31C8ADF-7949086400",
        pln: "M509",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBR000C18051",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Wolffishes(=Catfishes) nei (CAT)",
        scientificName: "Anarhichas spp",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03028990",
        commodityCodeDescription: "Fresh or chilled fish, n.e.s.",
        transportationVehicle: "directLanding",
        numberOfSubmissions: 1,
        speciesOverriddenByAdmin: false,
        licenceHolder: "MR A G PHILLIPS",
        dataEverExpected: false,
        isLegallyDue: false,
        homePort: "MILFORD HAVEN",
        imoNumber: null,
        licenceNumber: "11704",
        licenceValidTo: "2030-12-31"
      },
      rssNumber: "C18051",
      da: "Wales",
      dateLanded: "2024-06-11",
      species: "CAT",
      weightFactor: 1,
      weightOnCert: 20,
      rawWeightOnCert: 20,
      weightOnAllCerts: 20,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 20,
      isLandingExists: false,
      isExceeding14DayLimit: false,
      speciesAlias: "N",
      durationSinceCertCreation: "PT0.046S",
      weightOnLandingAllSpecies: 20,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.107S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.107S",
      firstDateTimeLandingDataRetrieved: "2024-06-12T13:05:35.102Z",
      isSpeciesExists: false,
      weightOnLanding: 0,
      isOverusedAllCerts: false,
      isOverusedThisCert: false,
      overUsedInfo: []
    };

    expect(SUT.has14DayLimitReached(input, true)).toBe(true);
  });

  it('will set 14DayLimitReached to true when species failure for an under 50 kg landing using Elog outside of retrospective period', () => {
    const input: ICcQueryResult = {
      documentNumber: "GBR-2024-CC-5D31C8ADF",
      documentType: "catchCertificate",
      createdAt: "2024-06-12T13:05:35.209Z",
      status: "COMPLETE",
      extended: {
        exporterContactId: "0eee9e71-61d5-ee11-904d-000d3ab00f0f",
        exporterName: "Gosia Miksza",
        exporterCompanyName: "Scenario 12",
        exporterPostCode: "PE2 8YY",
        vessel: "CELTIC",
        landingId: "GBR-2024-CC-5D31C8ADF-7949086400",
        pln: "M509",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBR000C18051",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Wolffishes(=Catfishes) nei (CAT)",
        scientificName: "Anarhichas spp",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03028990",
        commodityCodeDescription: "Fresh or chilled fish, n.e.s.",
        transportationVehicle: "directLanding",
        numberOfSubmissions: 1,
        speciesOverriddenByAdmin: false,
        licenceHolder: "MR A G PHILLIPS",
        dataEverExpected: true,
        landingDataExpectedDate: "2024-06-12",
        landingDataEndDate: moment.utc().subtract(2, 'day').format('YYYY-MM-DD'),
        isLegallyDue: false,
        homePort: "MILFORD HAVEN",
        imoNumber: null,
        licenceNumber: "11704",
        licenceValidTo: "2030-12-31"
      },
      rssNumber: "C18051",
      da: "Wales",
      dateLanded: "2024-06-11",
      species: "CAT",
      weightFactor: 1,
      weightOnCert: 20,
      rawWeightOnCert: 20,
      weightOnAllCerts: 20,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 20,
      isLandingExists: true,
      isExceeding14DayLimit: false,
      speciesAlias: "N",
      durationSinceCertCreation: "PT0.046S",
      source: "ELOG",
      weightOnLandingAllSpecies: 20,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.107S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.107S",
      firstDateTimeLandingDataRetrieved: "2024-06-12T13:05:35.102Z",
      isSpeciesExists: false,
      weightOnLanding: 0,
      isOverusedAllCerts: false,
      isOverusedThisCert: false,
      overUsedInfo: []
    };

    expect(SUT.has14DayLimitReached(input, false)).toBe(true);
  });

  it('will set 14DayLimitReached to true when Species Failure - Validation Failure - occurs for a landing using Landing Declaration', () => {
    const input: ICcQueryResult = {
      documentNumber: "GBR-2024-CC-5D31C8ADF",
      documentType: "catchCertificate",
      createdAt: "2024-06-12T13:05:35.209Z",
      status: "COMPLETE",
      extended: {
        exporterContactId: "0eee9e71-61d5-ee11-904d-000d3ab00f0f",
        exporterName: "Gosia Miksza",
        exporterCompanyName: "Scenario 12",
        exporterPostCode: "PE2 8YY",
        vessel: "CELTIC",
        landingId: "GBR-2024-CC-5D31C8ADF-7949086400",
        pln: "M509",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBR000C18051",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Wolffishes(=Catfishes) nei (CAT)",
        scientificName: "Anarhichas spp",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03028990",
        commodityCodeDescription: "Fresh or chilled fish, n.e.s.",
        transportationVehicle: "directLanding",
        numberOfSubmissions: 1,
        speciesOverriddenByAdmin: false,
        licenceHolder: "MR A G PHILLIPS",
        dataEverExpected: true,
        landingDataExpectedDate: "2024-06-12",
        landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD'),
        isLegallyDue: false,
        homePort: "MILFORD HAVEN",
        imoNumber: null,
        licenceNumber: "11704",
        licenceValidTo: "2030-12-31"
      },
      rssNumber: "C18051",
      da: "Wales",
      dateLanded: "2024-06-11",
      species: "CAT",
      weightFactor: 1,
      weightOnCert: 20,
      rawWeightOnCert: 20,
      weightOnAllCerts: 20,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 20,
      isLandingExists: true,
      isExceeding14DayLimit: false,
      speciesAlias: "N",
      durationSinceCertCreation: "PT0.046S",
      source: "LANDING_DECLARATION",
      weightOnLandingAllSpecies: 20,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.107S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.107S",
      firstDateTimeLandingDataRetrieved: "2024-06-12T13:05:35.102Z",
      isSpeciesExists: false,
      weightOnLanding: 0,
      isOverusedAllCerts: false,
      isOverusedThisCert: false,
      overUsedInfo: []
    };

    expect(SUT.has14DayLimitReached(input, false)).toBe(true);
  });

  it('will set 14DayLimitReached to true when Overuse - Validation Failure - occurs for a landing using Landing Declaration', () => {
    const input: ICcQueryResult = {
      documentNumber: "GBR-2024-CC-5D31C8ADF",
      documentType: "catchCertificate",
      createdAt: "2024-06-12T13:05:35.209Z",
      status: "COMPLETE",
      extended: {
        exporterContactId: "0eee9e71-61d5-ee11-904d-000d3ab00f0f",
        exporterName: "Gosia Miksza",
        exporterCompanyName: "Scenario 12",
        exporterPostCode: "PE2 8YY",
        vessel: "CELTIC",
        landingId: "GBR-2024-CC-5D31C8ADF-7949086400",
        pln: "M509",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBR000C18051",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Wolffishes(=Catfishes) nei (CAT)",
        scientificName: "Anarhichas spp",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03028990",
        commodityCodeDescription: "Fresh or chilled fish, n.e.s.",
        transportationVehicle: "directLanding",
        numberOfSubmissions: 1,
        speciesOverriddenByAdmin: false,
        licenceHolder: "MR A G PHILLIPS",
        dataEverExpected: true,
        landingDataExpectedDate: "2024-06-12",
        landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD'),
        isLegallyDue: false,
        homePort: "MILFORD HAVEN",
        imoNumber: null,
        licenceNumber: "11704",
        licenceValidTo: "2030-12-31"
      },
      rssNumber: "C18051",
      da: "Wales",
      dateLanded: "2024-06-11",
      species: "CAT",
      weightFactor: 1,
      weightOnCert: 20,
      rawWeightOnCert: 20,
      weightOnAllCerts: 20,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 20,
      isLandingExists: true,
      isExceeding14DayLimit: false,
      speciesAlias: "N",
      durationSinceCertCreation: "PT0.046S",
      source: "LANDING_DECLARATION",
      weightOnLandingAllSpecies: 20,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.107S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.107S",
      firstDateTimeLandingDataRetrieved: "2024-06-12T13:05:35.102Z",
      isSpeciesExists: true,
      weightOnLanding: 0,
      isOverusedAllCerts: true,
      isOverusedThisCert: true,
      overUsedInfo: ['CC1']
    };

    expect(SUT.has14DayLimitReached(input, false)).toBe(true);
  });

  it('will set 14DayLimitReached to false when species failure for an under 50 kg landing using Elog', () => {
    const input: ICcQueryResult = {
      documentNumber: "GBR-2024-CC-5D31C8ADF",
      documentType: "catchCertificate",
      createdAt: "2024-06-12T13:05:35.209Z",
      status: "COMPLETE",
      extended: {
        exporterContactId: "0eee9e71-61d5-ee11-904d-000d3ab00f0f",
        exporterName: "Gosia Miksza",
        exporterCompanyName: "Scenario 12",
        exporterPostCode: "PE2 8YY",
        vessel: "CELTIC",
        landingId: "GBR-2024-CC-5D31C8ADF-7949086400",
        pln: "M509",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBR000C18051",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Wolffishes(=Catfishes) nei (CAT)",
        scientificName: "Anarhichas spp",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03028990",
        commodityCodeDescription: "Fresh or chilled fish, n.e.s.",
        transportationVehicle: "directLanding",
        numberOfSubmissions: 1,
        speciesOverriddenByAdmin: false,
        licenceHolder: "MR A G PHILLIPS",
        dataEverExpected: true,
        landingDataExpectedDate: "2024-06-12",
        landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD'),
        isLegallyDue: false,
        homePort: "MILFORD HAVEN",
        imoNumber: null,
        licenceNumber: "11704",
        licenceValidTo: "2030-12-31"
      },
      rssNumber: "C18051",
      da: "Wales",
      dateLanded: "2024-06-11",
      species: "CAT",
      weightFactor: 1,
      weightOnCert: 20,
      rawWeightOnCert: 20,
      weightOnAllCerts: 20,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 20,
      isLandingExists: true,
      isExceeding14DayLimit: false,
      speciesAlias: "N",
      durationSinceCertCreation: "PT0.046S",
      source: "ELOG",
      weightOnLandingAllSpecies: 20,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.107S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.107S",
      firstDateTimeLandingDataRetrieved: "2024-06-12T13:05:35.102Z",
      isSpeciesExists: false,
      weightOnLanding: 0,
      isOverusedAllCerts: false,
      isOverusedThisCert: false,
      overUsedInfo: []
    };

    expect(SUT.has14DayLimitReached(input, false)).toBe(false);
  });
});

describe('When mapping from a IDynamicsLanding to failureIrrespectiveOfRisk', () => {
  const landing: IDynamicsLanding = {
    status: LandingStatusType.ValidationFailure_Overuse,
    id: "GBR-2020-CC-X",
    landingDate: "2018-12-08",
    species: "COD",
    is14DayLimitReached: false,
    vesselOverriddenByAdmin: false,
    state: "FRE",
    presentation: "FIL",
    speciesOverriddenByAdmin: false,
    cnCode: "1234",
    commodityCodeDescription: "some description",
    scientificName: "some scientific name",
    vesselName: "BOB WINNIE",
    vesselPln: "FH691",
    vesselLength: 10,
    licenceHolder: "VESSEL MASTER",
    weight: 10,
    numberOfTotalSubmissions: 1,
    adminSpecies: "Sand smelt (ATP)",
    adminState: "Fresh",
    adminPresentation: "Whole",
    adminCommodityCode: "some commodity code",
    validation: {
      liveExportWeight: 26,
      totalRecordedAgainstLanding: 26,
      landedWeightExceededBy: undefined,
      rawLandingsUrl: "some-raw-landings-url",
      salesNoteUrl: "some-sales-notes-url",
      isLegallyDue: true
    },
    dataEverExpected: true,
    vesselAdministration: 'England'
  };

  const landing_weight_failure: IDynamicsLanding = {
    status: LandingStatusType.ValidationFailure_Weight,
    id: "GBR-2020-CC-X",
    landingDate: "2018-12-08",
    species: "COD",
    is14DayLimitReached: false,
    vesselOverriddenByAdmin: false,
    state: "FRE",
    presentation: "FIL",
    speciesOverriddenByAdmin: false,
    cnCode: "1234",
    commodityCodeDescription: "some description",
    scientificName: "some scientific name",
    vesselName: "BOB WINNIE",
    vesselPln: "FH691",
    vesselLength: 10,
    licenceHolder: "VESSEL MASTER",
    weight: 10,
    numberOfTotalSubmissions: 1,
    adminSpecies: "Sand smelt (ATP)",
    adminState: "Fresh",
    adminPresentation: "Whole",
    adminCommodityCode: "some commodity code",
    validation: {
      liveExportWeight: 26,
      totalRecordedAgainstLanding: 26,
      landedWeightExceededBy: undefined,
      rawLandingsUrl: "some-raw-landings-url",
      salesNoteUrl: "some-sales-notes-url",
      isLegallyDue: true
    },
    dataEverExpected: true,
    vesselAdministration: 'England'
  };

  const landing_species_failure: IDynamicsLanding = {
    status: LandingStatusType.ValidationFailure_Species,
    id: "GBR-2020-CC-X",
    landingDate: "2018-12-08",
    species: "COD",
    is14DayLimitReached: false,
    vesselOverriddenByAdmin: false,
    state: "FRE",
    cnCode: "1234",
    commodityCodeDescription: "some description",
    scientificName: "some scientific name",
    presentation: "FIL",
    speciesOverriddenByAdmin: false,
    vesselName: "BOB WINNIE",
    vesselPln: "FH691",
    vesselLength: 10,
    licenceHolder: "VESSEL MASTER",
    weight: 10,
    numberOfTotalSubmissions: 1,
    adminSpecies: "Sand smelt (ATP)",
    adminState: "Fresh",
    adminPresentation: "Whole",
    adminCommodityCode: "some commodity code",
    validation: {
      liveExportWeight: 26,
      totalRecordedAgainstLanding: 26,
      landedWeightExceededBy: undefined,
      rawLandingsUrl: "some-raw-landings-url",
      salesNoteUrl: "some-sales-notes-url",
      isLegallyDue: true
    },
    dataEverExpected: true,
    vesselAdministration: 'England'
  };

  const landing_no_data_failure: IDynamicsLanding = {
    status: LandingStatusType.ValidationFailure_NoLandingData,
    id: "GBR-2020-CC-X",
    landingDate: "2018-12-08",
    species: "COD",
    is14DayLimitReached: false,
    vesselOverriddenByAdmin: false,
    state: "FRE",
    presentation: "FIL",
    speciesOverriddenByAdmin: false,
    cnCode: "1234",
    commodityCodeDescription: "some description",
    scientificName: "some scientific name",
    vesselName: "BOB WINNIE",
    vesselPln: "FH691",
    vesselLength: 10,
    licenceHolder: "VESSEL MASTER",
    weight: 10,
    numberOfTotalSubmissions: 1,
    adminSpecies: "Sand smelt (ATP)",
    adminState: "Fresh",
    adminPresentation: "Whole",
    adminCommodityCode: "some commodity code",
    validation: {
      liveExportWeight: 26,
      totalRecordedAgainstLanding: 26,
      landedWeightExceededBy: undefined,
      rawLandingsUrl: "some-raw-landings-url",
      salesNoteUrl: "some-sales-notes-url",
      isLegallyDue: true
    },
    dataEverExpected: true,
    vesselAdministration: 'England'
  };

  const landing_no_licence_holder: IDynamicsLanding = {
    status: LandingStatusType.ValidationFailure_NoLicenceHolder,
    id: "GBR-2020-CC-X",
    landingDate: "2018-12-08",
    species: "COD",
    is14DayLimitReached: false,
    vesselOverriddenByAdmin: false,
    state: "FRE",
    presentation: "FIL",
    speciesOverriddenByAdmin: true,
    cnCode: "1234",
    commodityCodeDescription: "some description",
    scientificName: "some scientific name",
    vesselName: "BOB WINNIE",
    vesselPln: "FH691",
    vesselLength: 10,
    licenceHolder: "VESSEL MASTER",
    weight: 10,
    numberOfTotalSubmissions: 1,
    adminSpecies: "Sand smelt (ATP)",
    adminState: "Fresh",
    adminPresentation: "Whole",
    adminCommodityCode: "some commodity code",
    validation: {
      liveExportWeight: 26,
      totalRecordedAgainstLanding: 26,
      landedWeightExceededBy: undefined,
      rawLandingsUrl: "some-raw-landings-url",
      salesNoteUrl: "some-sales-notes-url",
      isLegallyDue: true
    },
    dataEverExpected: true,
    vesselAdministration: 'England'
  };

  it('will return the correct failureIrrespectiveOfRisk for a given set of landings', () => {
    expect(SUT.toFailureIrrespectiveOfRisk([landing])).toBeFalsy();
    expect(SUT.toFailureIrrespectiveOfRisk([landing, landing_species_failure])).toBeTruthy();
    expect(SUT.toFailureIrrespectiveOfRisk([landing, landing_weight_failure])).toBeTruthy();
    expect(SUT.toFailureIrrespectiveOfRisk([landing, landing_no_data_failure])).toBeTruthy();
    expect(SUT.toFailureIrrespectiveOfRisk([landing, landing_no_licence_holder])).toBeTruthy();
  });
});
