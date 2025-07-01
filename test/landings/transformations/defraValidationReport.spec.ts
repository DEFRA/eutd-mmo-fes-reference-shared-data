import moment from 'moment';
import {
  CertificateAudit,
  CertificateTransport,
  IDefraValidationCatchCertificate
} from '../../../src/landings/types/defraValidation';
import { ICcQueryResult } from '../../../src/landings/types/query';
import {
  toDefraAudit,
  toTransportation,
  toCcDefraReport
} from "../../../src/landings/transformations/defraValidation";
import { DocumentStatuses, IDocument } from "../../../src/landings/types/document";
import { IAuditEvent, AuditEventTypes, InvestigationStatus } from '../../../src/landings/types/auditEvent';
import { LandingSources } from '../../../src/landings/types/landing';
import * as SUT from "../../../src/landings/transformations/defraValidation";
import * as Transformations from '../../../src/landings/transformations/transformations';
import * as Config from "../../../src/config";
import { CatchArea, CertificateStatus, DefraCcLandingStatusType } from '../../../src/landings/types';

describe('Mapping data for DEFRA Central Reporting HUB', () => {

  describe('For System Audits', () => {
    it('will always include all required elements', () => {
      const systemAudit: IAuditEvent = {
        eventType: AuditEventTypes.PreApproved,
        triggeredBy: "Bob",
        timestamp: new Date(),
        data: null
      }

      const result: CertificateAudit = toDefraAudit(systemAudit);

      expect(result.auditOperation).toEqual(AuditEventTypes.PreApproved);
      expect(result.user).toEqual(systemAudit.triggeredBy)
      expect(result.auditAt).toEqual(systemAudit.timestamp)
    });

    it('will include the investigation status if present', () => {
      const systemAudit: IAuditEvent = {
        eventType: AuditEventTypes.PreApproved,
        triggeredBy: "Bob",
        timestamp: new Date(),
        data: {
          investigationStatus: InvestigationStatus.Closed
        }
      }

      const result: CertificateAudit = toDefraAudit(systemAudit);

      expect(result.investigationStatus).toEqual(InvestigationStatus.Closed);
    });
  });

  describe('toCcDefraReport', () => {
    let mockVesselLookup;
    let mockGetVesselIdx;

    beforeEach(() => {
      mockVesselLookup = jest.spyOn(Transformations, 'vesselLookup').mockImplementation(() => () => ({
        vesselLength: 12,
        adminPort: 'PLYMOUTH',
        flag: 'GBR',
        rssNumber: 'some-rssNumber',
        da: 'England',
        homePort: 'some-home-port',
        imoNumber: null,
        licenceNumber: 'licence-number',
        licenceValidTo: '2023-01-01',
        licenceHolder: 'some licence holder'
      }));
      mockGetVesselIdx = jest.fn();
    });

    afterEach(() => {
      mockVesselLookup.mockRestore();
      mockGetVesselIdx.mockRestore();
    })

    it('can map just a documentNumber, status, correlationId and requestedByAdmin', () => {
      const res = toCcDefraReport('doc1', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx);

      expect(res).toEqual({
        documentType: "CatchCertificate",
        documentNumber: 'doc1',
        status: DocumentStatuses.Draft,
        _correlationId: 'some-uuid-correlation-id',
        requestedByAdmin: false
      });
    });

    it('can map a whole CC document', () => {
      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, exampleCc);

      expect(res).toEqual({
        documentType: "CatchCertificate",
        documentNumber: 'GBR-2020-CC-1BC924FCF',
        clonedFrom: "GBR-2023-CC-C3A82642B",
        landingsCloned: false,
        parentDocumentVoid: false,
        status: DocumentStatuses.Draft,
        userReference: exampleCc.userReference,
        created: {
          id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12',
          email: 'foo@foo.com',
          firstName: 'Bob',
          lastName: 'Exporter'
        },
        dateCreated: exampleCc.createdAt,
        audits: [
          {
            auditAt: { "$date": "2020-06-24T10:40:18.780Z" },
            auditOperation: "INVESTIGATED",
            investigationStatus: "UNDER_INVESTIGATION",
            user: "Chris Waugh",
          },
          {
            auditAt: { "$date": "2020-06-24T10:40:23.439Z" },
            auditOperation: "INVESTIGATED",
            investigationStatus: "CLOSED_NFA",
            user: "Chris Waugh",
          }
        ],
        documentUri: `${Config.getConfig().externalAppUrl}/qr/export-certificates/${exampleCc.documentUri}`,
        devolvedAuthority: "England",
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "Nigeria",
          isoCodeAlpha2: "NG",
          isoCodeAlpha3: "NGA",
          isoNumericCode: "566"
        },
        conservationReference: exampleCc.exportData.conservation.conservationReference,
        failedSubmissions: 5,
        exporterDetails: {
          address: {
            building_number: "123",
            sub_building_name: "Unit 1",
            building_name: "CJC Fish Ltd",
            street_name: "17  Old Edinburgh Road",
            county: "West Midlands",
            country: "England",
            city: exampleCc.exportData.exporterDetails.townCity,
            line1: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            postCode: exampleCc.exportData.exporterDetails.postcode,
          },
          dynamicsAddress: { dynamicsData: 'original address' },
          companyName: exampleCc.exportData.exporterDetails.exporterCompanyName,
          fullName: exampleCc.exportData.exporterDetails.exporterFullName,
          contactId: exampleCc.exportData.exporterDetails.contactId,
          accountId: exampleCc.exportData.exporterDetails.accountId
        },
        landings: [
          {
            date: "2020-06-24",
            species: {
              name: "European lobster (LBE)",
              code: "LBE",
              scientificName: "some scientific name"
            },
            state: {
              name: "Alive",
              code: "ALI",
            },
            presentation: {
              name: "Whole",
              code: "WHL",
            },
            cnCode: "1234",
            cnCodeDesc: "some commodity code description",
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 100,
            isDirectLanding: false,
            vesselAdministration: "England",
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-26",
            landingDataEndDate: "2023-10-27",
            landingDataExpectedAtSubmission: false,
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-06-02",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: false,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-05-31",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 6",
              pln: "H2200",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: undefined,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          }
        ],
        transportation: {
          modeofTransport: 'truck',
          exportLocation: "Hull",
          hasRoadTransportDocument: true,
          exportDate: undefined,
          nationality: undefined,
          registration: undefined
        },
        transportations: [{
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'truck',
          exportLocation: "Hull",
          nationality: undefined,
          registration: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, {
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'plane',
          exportLocation: "Hull",
          flightNumber: undefined,
          containerId: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, {
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'train',
          exportLocation: "Hull",
          billNumber: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, {
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'vessel',
          exportLocation: "Hull",
          name: undefined,
          flag: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, null],
        _correlationId: 'some-uuid-correlation-id',
        requestedByAdmin: false
      });
    });

    it('can map a whole CC document without exportData', () => {
      const localExampleCc = {
        "createdAt": new Date("2020-06-24T10:39:32.000Z"),
        "__t": "catchCert",
        "createdBy": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
        "status": "COMPLETE",
        "documentNumber": "GBR-2020-CC-1BC924FCF",
        "clonedFrom": "GBR-2023-CC-C3A82642B",
        "landingsCloned": false,
        "parentDocumentVoid": false,
        "audit": [
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:18.780Z"
            },
            "data": {
              "investigationStatus": "UNDER_INVESTIGATION"
            }
          },
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:23.439Z"
            },
            "data": {
              "investigationStatus": "CLOSED_NFA"
            }
          }
        ],
        "userReference": "MY REF",
        "createdByEmail": "foo@foo.com",
        "documentUri": "_44fd226f-598f-4615-930f-716b2762fea4.pdf",
        "investigation": {
          "investigator": "Chris Waugh",
          "status": "CLOSED_NFA"
        },
        "numberOfFailedAttempts": 5
      }

      const expected = {
        "_correlationId": "some-uuid-correlation-id",
        "audits": [
          {
            "auditAt": {
              "$date": "2020-06-24T10:40:18.780Z",
            },
            "auditOperation": "INVESTIGATED",
            "investigationStatus": "UNDER_INVESTIGATION",
            "user": "Chris Waugh",
          },
          {
            "auditAt": {
              "$date": "2020-06-24T10:40:23.439Z",
            },
            "auditOperation": "INVESTIGATED",
            "investigationStatus": "CLOSED_NFA",
            "user": "Chris Waugh",
          }
        ],
        "clonedFrom": "GBR-2023-CC-C3A82642B",
        "dateCreated": new Date("2020-06-24T10:39:32.000Z"),
        "documentNumber": "GBR-2020-CC-1BC924FCF",
        "documentType": "CatchCertificate",
        "documentUri": "undefined/qr/export-certificates/_44fd226f-598f-4615-930f-716b2762fea4.pdf",
        "failedSubmissions": 5,
        "landingsCloned": false,
        "parentDocumentVoid": false,
        "requestedByAdmin": false,
        "status": "DRAFT",
        "userReference": "MY REF",
      };

      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, localExampleCc);

      expect(res).toEqual(expected);
    });

    it('can map a whole CC document without conservation', () => {
      const localExampleCc = {
        "createdAt": new Date("2020-06-24T10:39:32.000Z"),
        "__t": "catchCert",
        "createdBy": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
        "status": "COMPLETE",
        "documentNumber": "GBR-2020-CC-1BC924FCF",
        "clonedFrom": "GBR-2023-CC-C3A82642B",
        "landingsCloned": false,
        "parentDocumentVoid": false,
        "audit": [
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:18.780Z"
            },
            "data": {
              "investigationStatus": "UNDER_INVESTIGATION"
            }
          },
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:23.439Z"
            },
            "data": {
              "investigationStatus": "CLOSED_NFA"
            }
          }
        ],
        "userReference": "MY REF",
        "exportData": {
          "exporterDetails": {
            "contactId": "an id",
            "accountId": "an id acc",
            "exporterFullName": "Bob Exporter",
            "exporterCompanyName": "Exporter Co",
            "addressOne": "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            "townCity": "T",
            "postcode": "P",
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
              "scientificName": "some scientific name",
              "commodityCode": "1234",
              "commodityCodeDescription": "some commodity code description",
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
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "weight": 100,
                  "dataEverExpected": true,
                  "landingDataExpectedDate": "2023-10-26",
                  "landingDataEndDate": "2023-10-27",
                }
              ]
            },
            {
              "species": "Atlantic cod (COD)",
              "speciesId": "6763576e-c5b8-41cf-a708-f4b9a470623e",
              "speciesCode": "COD",
              "scientificName": "Gadus morhua",
              "commodityCode": "1234",
              "commodityCodeDescription": `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
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
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "dataEverExpected": false
                },
                {
                  "vessel": "WIRON 6",
                  "pln": "H2200",
                  "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
                  "date": "2020-05-31",
                  "faoArea": "FAO27",
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737"
                }
              ]
            }
          ],
          "conservation": undefined,
          "exportedFrom": "United Kingdom",
          "exportedTo": {
            "officialCountryName": "Nigeria",
            "isoCodeAlpha2": "NG",
            "isoCodeAlpha3": "NGA",
            "isoNumericCode": "566"
          },
          "transportation": {
            "vehicle": 'truck',
            "departurePlace": "Hull",
            "cmr": true
          },
          "transportations": [{
            "id": 0,
            "freightBillNumber": '0',
            "vehicle": "truck",
            "departurePlace": "Hull",
            "exportedTo": {
              "officialCountryName": "Nigeria",
              "isoCodeAlpha2": "NG",
              "isoCodeAlpha3": "NGA",
              "isoNumericCode": "566"
            },
            "transportDocuments": [{
              "name": "Invoice",
              "reference": "INV001"
            }]
          }, {
            "id": 0,
            "freightBillNumber": '0',
            "vehicle": "plane",
            "departurePlace": "Hull",
            "exportedTo": {
              "officialCountryName": "Nigeria",
              "isoCodeAlpha2": "NG",
              "isoCodeAlpha3": "NGA",
              "isoNumericCode": "566"
            },
            "transportDocuments": [{
              "name": "Invoice",
              "reference": "INV001"
            }]
          }, {
            "id": 0,
            "freightBillNumber": '0',
            "vehicle": "train",
            "departurePlace": "Hull",
            "exportedTo": {
              "officialCountryName": "Nigeria",
              "isoCodeAlpha2": "NG",
              "isoCodeAlpha3": "NGA",
              "isoNumericCode": "566"
            },
            "transportDocuments": [{
              "name": "Invoice",
              "reference": "INV001"
            }]
          }, {
            "id": 0,
            "freightBillNumber": '0',
            "vehicle": "containerVessel",
            "departurePlace": "Hull",
            "exportedTo": {
              "officialCountryName": "Nigeria",
              "isoCodeAlpha2": "NG",
              "isoCodeAlpha3": "NGA",
              "isoNumericCode": "566"
            },
            "transportDocuments": [{
              "name": "Invoice",
              "reference": "INV001"
            }]
          }, {
            "id": 0,
            "freightBillNumber": '0',
            "vehicle": "unknown",
            "departurePlace": "Hull",
            "exportedTo": {
              "officialCountryName": "Nigeria",
              "isoCodeAlpha2": "NG",
              "isoCodeAlpha3": "NGA",
              "isoNumericCode": "566"
            },
            "transportDocuments": []
          }, undefined]
        },
        "createdByEmail": "foo@foo.com",
        "documentUri": "_44fd226f-598f-4615-930f-716b2762fea4.pdf",
        "investigation": {
          "investigator": "Chris Waugh",
          "status": "CLOSED_NFA"
        },
        "numberOfFailedAttempts": 5
      }

      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, localExampleCc);

      expect(res.conservationReference).toBeUndefined();
    });

    it('can map a whole CC document with landings', () => {
      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, {
        "createdAt": new Date("2020-06-24T10:39:32.000Z"),
        "__t": "catchCert",
        "createdBy": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
        "status": "COMPLETE",
        "documentNumber": "GBR-2020-CC-1BC924FCF",
        "clonedFrom": "GBR-2023-CC-C3A82642B",
        "landingsCloned": false,
        "parentDocumentVoid": false,
        "audit": [
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:18.780Z"
            },
            "data": {
              "investigationStatus": "UNDER_INVESTIGATION"
            }
          },
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:23.439Z"
            },
            "data": {
              "investigationStatus": "CLOSED_NFA"
            }
          }
        ],
        "userReference": "MY REF",
        "exportData": {
          "products": [
            {
              "species": "European lobster (LBE)",
              "speciesId": "4e5fff23-184c-4a46-beef-e93ccd040392",
              "speciesCode": "LBE",
              "scientificName": "some scientific name",
              "commodityCode": "1234",
              "commodityCodeDescription": "some commodity code description",
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
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "weight": 100,
                  "dataEverExpected": true,
                  "landingDataExpectedDate": "2023-10-26",
                  "landingDataEndDate": "2023-10-27",
                }
              ]
            },
            {
              "species": "Atlantic cod (COD)",
              "speciesId": "6763576e-c5b8-41cf-a708-f4b9a470623e",
              "speciesCode": "COD",
              "scientificName": "Gadus morhua",
              "commodityCode": "1234",
              "commodityCodeDescription": `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
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
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "dataEverExpected": false
                },
                {
                  "vessel": "WIRON 6",
                  "pln": "H2200",
                  "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
                  "date": "2020-05-31",
                  "faoArea": "FAO27",
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737"
                }
              ]
            }
          ]
        },
        "createdByEmail": "foo@foo.com",
        "documentUri": "_44fd226f-598f-4615-930f-716b2762fea4.pdf",
        "investigation": {
          "investigator": "Chris Waugh",
          "status": "CLOSED_NFA"
        },
        "numberOfFailedAttempts": 5
      });

      expect(res.landings).toEqual([
        {
          date: "2020-06-24",
          species: {
            name: "European lobster (LBE)",
            code: "LBE",
            scientificName: "some scientific name"
          },
          state: {
            name: "Alive",
            code: "ALI",
          },
          presentation: {
            name: "Whole",
            code: "WHL",
          },
          cnCode: "1234",
          cnCodeDesc: "some commodity code description",
          vessel: {
            name: "WIRON 5",
            pln: "H1100",
            length: 12,
            fao: "FAO27",
            flag: "GBR",
            cfr: "GBRC17737"
          },
          exportWeight: 100,
          isDirectLanding: false,
          vesselAdministration: "England",
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-26",
          landingDataEndDate: "2023-10-27",
          landingDataExpectedAtSubmission: false,
          isLate: undefined,
          dateDataReceived: undefined
        },
        {
          date: "2020-06-02",
          species: {
            name: "Atlantic cod (COD)",
            code: "COD",
            scientificName: "Gadus morhua"
          },
          state: {
            name: "Fresh",
            code: "FRE",
          },
          presentation: {
            name: "Gutted",
            code: "GUT",
          },
          cnCode: "1234",
          cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
          vessel: {
            name: "WIRON 5",
            pln: "H1100",
            length: 12,
            fao: "FAO27",
            flag: "GBR",
            cfr: "GBRC17737"
          },
          exportWeight: 200,
          isDirectLanding: false,
          dataEverExpected: false,
          vesselAdministration: "England",
          landingDataExpectedDate: undefined,
          landingDataEndDate: undefined,
          landingDataExpectedAtSubmission: undefined,
          isLate: undefined,
          dateDataReceived: undefined
        },
        {
          date: "2020-05-31",
          species: {
            name: "Atlantic cod (COD)",
            code: "COD",
            scientificName: "Gadus morhua"
          },
          state: {
            name: "Fresh",
            code: "FRE",
          },
          presentation: {
            name: "Gutted",
            code: "GUT",
          },
          cnCode: "1234",
          cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
          vessel: {
            name: "WIRON 6",
            pln: "H2200",
            length: 12,
            fao: "FAO27",
            flag: "GBR",
            cfr: "GBRC17737"
          },
          exportWeight: 200,
          isDirectLanding: false,
          dataEverExpected: undefined,
          vesselAdministration: "England",
          landingDataExpectedDate: undefined,
          landingDataEndDate: undefined,
          landingDataExpectedAtSubmission: undefined,
          isLate: undefined,
          dateDataReceived: undefined
        }
      ]);
    });

    it('can map a whole CC document with CMR in transportations', () => {
      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, {
        "createdAt": new Date("2020-06-24T10:39:32.000Z"),
        "__t": "catchCert",
        "createdBy": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
        "status": "COMPLETE",
        "documentNumber": "GBR-2020-CC-1BC924FCF",
        "clonedFrom": "GBR-2023-CC-C3A82642B",
        "landingsCloned": false,
        "parentDocumentVoid": false,
        "audit": [
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:18.780Z"
            },
            "data": {
              "investigationStatus": "UNDER_INVESTIGATION"
            }
          },
          {
            "eventType": "INVESTIGATED",
            "triggeredBy": "Chris Waugh",
            "timestamp": {
              "$date": "2020-06-24T10:40:23.439Z"
            },
            "data": {
              "investigationStatus": "CLOSED_NFA"
            }
          }
        ],
        "userReference": "MY REF",
        "exportData": {
          "products": [
            {
              "species": "European lobster (LBE)",
              "speciesId": "4e5fff23-184c-4a46-beef-e93ccd040392",
              "speciesCode": "LBE",
              "scientificName": "some scientific name",
              "commodityCode": "1234",
              "commodityCodeDescription": "some commodity code description",
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
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "weight": 100,
                  "dataEverExpected": true,
                  "landingDataExpectedDate": "2023-10-26",
                  "landingDataEndDate": "2023-10-27",
                }
              ]
            }
          ],
          "transportations": [{
            "id": 0,
            "vehicle": "truck",
            "cmr": true
          }],
        },
        "createdByEmail": "foo@foo.com",
        "documentUri": "_44fd226f-598f-4615-930f-716b2762fea4.pdf",
        "investigation": {
          "investigator": "Chris Waugh",
          "status": "CLOSED_NFA"
        },
        "numberOfFailedAttempts": 5
      });

      const expected = {
        id: 0,
        modeofTransport: 'truck',
        hasRoadTransportDocument: true
      };
      expect(res.transportation).toBeUndefined();
      expect(res.transportations).toHaveLength(1);
      expect(res.transportations?.[0]).toEqual(expected);
    });

    it('can map a whole CC document without _dynamicUser', () => {
      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, {
        ...exampleCc,
        exportData: {
          ...exampleCc.exportData,
          exporterDetails: {
            accountId: "an id acc",
            exporterFullName: "Bob Exporter",
            contactId: "an id",
            exporterCompanyName: "Exporter Co",
            addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            townCity: "T",
            postcode: "P",
            buildingNumber: "123",
            subBuildingName: "Unit 1",
            buildingName: "CJC Fish Ltd",
            streetName: "17  Old Edinburgh Road",
            county: "West Midlands",
            country: "England",
            _dynamicsUser: undefined
          }
        }
      });

      expect(res).toEqual({
        documentType: "CatchCertificate",
        documentNumber: 'GBR-2020-CC-1BC924FCF',
        clonedFrom: "GBR-2023-CC-C3A82642B",
        landingsCloned: false,
        parentDocumentVoid: false,
        status: DocumentStatuses.Draft,
        userReference: exampleCc.userReference,
        created: {
          id: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12',
          email: 'foo@foo.com',
          firstName: undefined,
          lastName: undefined
        },
        dateCreated: exampleCc.createdAt,
        audits: [
          {
            auditAt: { "$date": "2020-06-24T10:40:18.780Z" },
            auditOperation: "INVESTIGATED",
            investigationStatus: "UNDER_INVESTIGATION",
            user: "Chris Waugh",
          },
          {
            auditAt: { "$date": "2020-06-24T10:40:23.439Z" },
            auditOperation: "INVESTIGATED",
            investigationStatus: "CLOSED_NFA",
            user: "Chris Waugh",
          }
        ],
        documentUri: `${Config.getConfig().externalAppUrl}/qr/export-certificates/${exampleCc.documentUri}`,
        devolvedAuthority: "England",
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "Nigeria",
          isoCodeAlpha2: "NG",
          isoCodeAlpha3: "NGA",
          isoNumericCode: "566"
        },
        conservationReference: exampleCc.exportData.conservation.conservationReference,
        failedSubmissions: 5,
        exporterDetails: {
          address: {
            building_number: "123",
            sub_building_name: "Unit 1",
            building_name: "CJC Fish Ltd",
            street_name: "17  Old Edinburgh Road",
            county: "West Midlands",
            country: "England",
            city: exampleCc.exportData.exporterDetails.townCity,
            line1: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            postCode: exampleCc.exportData.exporterDetails.postcode,
          },
          dynamicsAddress: undefined,
          companyName: exampleCc.exportData.exporterDetails.exporterCompanyName,
          fullName: exampleCc.exportData.exporterDetails.exporterFullName,
          contactId: exampleCc.exportData.exporterDetails.contactId,
          accountId: exampleCc.exportData.exporterDetails.accountId
        },
        landings: [
          {
            date: "2020-06-24",
            species: {
              name: "European lobster (LBE)",
              code: "LBE",
              scientificName: "some scientific name"
            },
            state: {
              name: "Alive",
              code: "ALI",
            },
            presentation: {
              name: "Whole",
              code: "WHL",
            },
            cnCode: "1234",
            cnCodeDesc: "some commodity code description",
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 100,
            isDirectLanding: false,
            vesselAdministration: "England",
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-26",
            landingDataEndDate: "2023-10-27",
            landingDataExpectedAtSubmission: false,
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-06-02",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: false,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-05-31",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 6",
              pln: "H2200",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: undefined,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          }
        ],
        transportation: {
          modeofTransport: 'truck',
          hasRoadTransportDocument: true,
          exportDate: undefined,
          exportLocation: 'Hull',
          nationality: undefined,
          registration: undefined
        },
        transportations: [{
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'truck',
          exportLocation: "Hull",
          nationality: undefined,
          registration: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, {
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'plane',
          exportLocation: "Hull",
          nationality: undefined,
          registration: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, {
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'train',
          exportLocation: "Hull",
          billNumber: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, {
          id: 0,
          freightBillNumber: '0',
          modeofTransport: 'vessel',
          exportLocation: "Hull",
          name: undefined,
          flag: undefined,
          transportDocuments: [{
            name: "Invoice",
            reference: "INV001"
          }]
        }, null],
        _correlationId: 'some-uuid-correlation-id',
        requestedByAdmin: false
      });
    });

    it('can map a whole CC document without createdAt', () => {
      const documentCc = {
        "__t": "catchCert",
        "documentNumber": "GBR-2020-CC-1BC924FCF",
        "audit": [],
        "exportData": {
          "exporterDetails": {
            "contactId": "an id",
            "accountId": "an id acc",
            "exporterFullName": "Bob Exporter",
            "exporterCompanyName": "Exporter Co",
            "addressOne": "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            "townCity": "T",
            "postcode": "P",
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
              "scientificName": "some scientific name",
              "commodityCode": "1234",
              "commodityCodeDescription": "some commodity code description",
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
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "weight": 100,
                  "dataEverExpected": true,
                  "landingDataExpectedDate": "2023-10-26",
                  "landingDataEndDate": "2023-10-27",
                }
              ]
            },
            {
              "species": "Atlantic cod (COD)",
              "speciesId": "6763576e-c5b8-41cf-a708-f4b9a470623e",
              "speciesCode": "COD",
              "scientificName": "Gadus morhua",
              "commodityCode": "1234",
              "commodityCodeDescription": `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
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
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "dataEverExpected": false
                },
                {
                  "vessel": "WIRON 6",
                  "pln": "H2200",
                  "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
                  "date": "2020-05-31",
                  "faoArea": "FAO27",
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737"
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
        }
      }
      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, documentCc);

      expect(res).toEqual({
        documentType: "CatchCertificate",
        documentNumber: 'GBR-2020-CC-1BC924FCF',
        status: DocumentStatuses.Draft,
        created: {
          firstName: "Bob",
          lastName: "Exporter"
        },
        devolvedAuthority: "England",
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "Nigeria",
          isoCodeAlpha2: "NG",
          isoCodeAlpha3: "NGA",
          isoNumericCode: "566"
        },
        conservationReference: exampleCc.exportData.conservation.conservationReference,
        exporterDetails: {
          address: {
            building_number: "123",
            sub_building_name: "Unit 1",
            building_name: "CJC Fish Ltd",
            street_name: "17  Old Edinburgh Road",
            county: "West Midlands",
            country: "England",
            city: exampleCc.exportData.exporterDetails.townCity,
            line1: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            postCode: exampleCc.exportData.exporterDetails.postcode,
          },
          dynamicsAddress: {
            dynamicsData: "original address",
          },
          companyName: exampleCc.exportData.exporterDetails.exporterCompanyName,
          fullName: exampleCc.exportData.exporterDetails.exporterFullName,
          contactId: exampleCc.exportData.exporterDetails.contactId,
          accountId: exampleCc.exportData.exporterDetails.accountId
        },
        landings: [
          {
            date: "2020-06-24",
            species: {
              name: "European lobster (LBE)",
              code: "LBE",
              scientificName: "some scientific name"
            },
            state: {
              name: "Alive",
              code: "ALI",
            },
            presentation: {
              name: "Whole",
              code: "WHL",
            },
            cnCode: "1234",
            cnCodeDesc: "some commodity code description",
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 100,
            isDirectLanding: false,
            vesselAdministration: "England",
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-26",
            landingDataEndDate: "2023-10-27",
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-06-02",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: false,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-05-31",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 6",
              pln: "H2200",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: undefined,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          }
        ],
        transportation: {
          modeofTransport: 'truck',
          hasRoadTransportDocument: true,
          exportDate: undefined,
          exportLocation: undefined,
          nationality: undefined,
          registration: undefined
        },
        _correlationId: 'some-uuid-correlation-id',
        requestedByAdmin: false
      });
    });

    it('can map a whole CC document with a null createdAt', () => {
      const documentCc = {
        "__t": "catchCert",
        "documentNumber": "GBR-2020-CC-1BC924FCF",
        "createdAt": null,
        "audit": [],
        "exportData": {
          "exporterDetails": {
            "contactId": "an id",
            "accountId": "an id acc",
            "exporterFullName": "Bob Exporter",
            "exporterCompanyName": "Exporter Co",
            "addressOne": "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            "townCity": "T",
            "postcode": "P",
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
              "scientificName": "some scientific name",
              "commodityCode": "1234",
              "commodityCodeDescription": "some commodity code description",
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
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "weight": 100,
                  "dataEverExpected": true,
                  "landingDataExpectedDate": "2023-10-26",
                  "landingDataEndDate": "2023-10-27",
                }
              ]
            },
            {
              "species": "Atlantic cod (COD)",
              "speciesId": "6763576e-c5b8-41cf-a708-f4b9a470623e",
              "speciesCode": "COD",
              "scientificName": "Gadus morhua",
              "commodityCode": "1234",
              "commodityCodeDescription": `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
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
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737",
                  "dataEverExpected": false
                },
                {
                  "vessel": "WIRON 6",
                  "pln": "H2200",
                  "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
                  "date": "2020-05-31",
                  "faoArea": "FAO27",
                  "weight": 200,
                  "flag": "GBR",
                  "cfr": "GBRC17737"
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
        }
      }
      const res = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, DocumentStatuses.Draft, requestByAdmin, mockGetVesselIdx, documentCc);

      expect(res).toEqual({
        documentType: "CatchCertificate",
        documentNumber: 'GBR-2020-CC-1BC924FCF',
        status: DocumentStatuses.Draft,
        created: {
          firstName: "Bob",
          lastName: "Exporter"
        },
        devolvedAuthority: "England",
        exportedFrom: "United Kingdom",
        exportedTo: {
          officialCountryName: "Nigeria",
          isoCodeAlpha2: "NG",
          isoCodeAlpha3: "NGA",
          isoNumericCode: "566"
        },
        conservationReference: exampleCc.exportData.conservation.conservationReference,
        exporterDetails: {
          address: {
            building_number: "123",
            sub_building_name: "Unit 1",
            building_name: "CJC Fish Ltd",
            street_name: "17  Old Edinburgh Road",
            county: "West Midlands",
            country: "England",
            city: exampleCc.exportData.exporterDetails.townCity,
            line1: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
            postCode: exampleCc.exportData.exporterDetails.postcode,
          },
          dynamicsAddress: {
            dynamicsData: "original address",
          },
          companyName: exampleCc.exportData.exporterDetails.exporterCompanyName,
          fullName: exampleCc.exportData.exporterDetails.exporterFullName,
          contactId: exampleCc.exportData.exporterDetails.contactId,
          accountId: exampleCc.exportData.exporterDetails.accountId
        },
        landings: [
          {
            date: "2020-06-24",
            species: {
              name: "European lobster (LBE)",
              code: "LBE",
              scientificName: "some scientific name"
            },
            state: {
              name: "Alive",
              code: "ALI",
            },
            presentation: {
              name: "Whole",
              code: "WHL",
            },
            cnCode: "1234",
            cnCodeDesc: "some commodity code description",
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 100,
            isDirectLanding: false,
            vesselAdministration: "England",
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-26",
            landingDataEndDate: "2023-10-27",
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-06-02",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 5",
              pln: "H1100",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: false,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          },
          {
            date: "2020-05-31",
            species: {
              name: "Atlantic cod (COD)",
              code: "COD",
              scientificName: "Gadus morhua"
            },
            state: {
              name: "Fresh",
              code: "FRE",
            },
            presentation: {
              name: "Gutted",
              code: "GUT",
            },
            cnCode: "1234",
            cnCodeDesc: `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
            vessel: {
              name: "WIRON 6",
              pln: "H2200",
              length: 12,
              fao: "FAO27",
              flag: "GBR",
              cfr: "GBRC17737"
            },
            exportWeight: 200,
            isDirectLanding: false,
            dataEverExpected: undefined,
            vesselAdministration: "England",
            landingDataExpectedDate: undefined,
            landingDataEndDate: undefined,
            landingDataExpectedAtSubmission: undefined,
            isLate: undefined,
            dateDataReceived: undefined
          }
        ],
        transportation: {
          modeofTransport: 'truck',
          hasRoadTransportDocument: true,
          exportDate: undefined,
          exportLocation: undefined,
          nationality: undefined,
          registration: undefined
        },
        _correlationId: 'some-uuid-correlation-id',
        requestedByAdmin: false
      });
    });

    describe('when document status is DELETE', () => {
      let mockPostCodeDaLookup;

      beforeEach(() => {
        mockPostCodeDaLookup = jest.spyOn(SUT, 'daLookUp');
      });

      afterEach(() => {
        mockPostCodeDaLookup.mockRestore();
      });

      it('will display devolvedAuthority when exporter details are available', () => {
        const result: IDefraValidationCatchCertificate = toCcDefraReport('GBR-2020-CC-1BC924FCF', correlationId, 'DELETE', requestByAdmin, mockGetVesselIdx, exampleCc);

        expect(mockPostCodeDaLookup).toHaveBeenCalledWith('P');
        expect(result.devolvedAuthority).toEqual('England');
      });

      it('will not display devolvedAuthority when exporter details are not available', () => {
        const backEndCcWithNoExporterDetails: IDocument = {
          "createdAt": new Date("2020-06-12T20:12:28.201Z"),
          "__t": "catchCertificate",
          "createdBy": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
          "createdByEmail": "foo@foo.com",
          "status": "DRAFT",
          "documentNumber": "GBR-2020-CC-1BC924FCF",
          "audit": [],
          "userReference": "My Reference",
          "requestByAdmin": false,
          "exportData": {},
          "numberOfFailedAttempts": 5
        };

        const result: IDefraValidationCatchCertificate = toCcDefraReport('GBR-2020-CC-BA8A6BE06', correlationId, 'DELETE', requestByAdmin, mockGetVesselIdx, backEndCcWithNoExporterDetails);

        expect(mockPostCodeDaLookup).not.toHaveBeenCalled();
        expect(result.devolvedAuthority).toBeUndefined();
      });
    });
  });

  describe('toDefraCcLanding', () => {
    let mockLicenceLookUp;
    let mockVesselLookup;
    let mockGetVesselIdx;

    beforeEach(() => {
      mockLicenceLookUp = jest.fn().mockImplementation(() => ({
        vesselLength: 12,
        adminPort: 'PLYMOUTH',
        flag: 'GBR',
        rssNumber: 'some-rssNumber',
        da: 'England',
        homePort: 'some-home-port',
        imoNumber: null,
        licenceNumber: 'licence-number',
        licenceValidTo: '2023-01-01',
        licenceHolder: 'some licence holder'
      }));
      mockVesselLookup = jest.spyOn(Transformations, 'vesselLookup').mockImplementation(() => mockLicenceLookUp);
      mockGetVesselIdx = jest.fn();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    afterEach(() => {
      mockLicenceLookUp.mockRestore();
      mockVesselLookup.mockRestore();
      mockGetVesselIdx.mockRestore();
    });

    it('will map products with no landings', () => {
      const product = {
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
        "caughtBy": []
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "truck", exportedFrom: "United Kingdom", cmr: true }, '2023-05-01', mockVesselLookup);

      expect(res).toEqual([]);
    });

    it('will map products with a single landing', () => {
      const product = {
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
            "startDate": "2020-06-02",
            "date": "2020-06-02",
            "faoArea": "FAO27",
            "weight": 200,
            "gearType": "Type 1",
            "flag": "GBR",
            "cfr": "GBRC17737"
          }
        ]
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "truck", exportedFrom: "United Kingdom", cmr: true }, '2023-05-01', mockGetVesselIdx);

      expect(res).toEqual([{
        startDate: "2020-06-02",
        date: "2020-06-02",
        species: {
          name: "Atlantic cod (COD)",
          code: "COD",
        },
        state: {
          name: "Fresh",
          code: "FRE",
        },
        presentation: {
          name: "Gutted",
          code: "GUT",
        },
        cnCode: "03025110",
        vessel: {
          name: "WIRON 5",
          pln: "H1100",
          length: 12,
          fao: "FAO27",
          flag: "GBR",
          cfr: "GBRC17737"
        },
        exportWeight: 200,
        gearType: "Type 1",
        isDirectLanding: false,
        vesselAdministration: "England"
      }]);

    });

    it('will map products with a single landing with updated admin data', () => {
      const product = {
        "species": "Atlantic cod (COD)",
        "speciesId": "6763576e-c5b8-41cf-a708-f4b9a470623e",
        "speciesCode": "COD",
        "commodityCode": "03025110",
        "state": {
          "code": "FRE",
          "name": "Fresh",
          "admin": "Fr"
        },
        "presentation": {
          "code": "GUT",
          "name": "Gutted",
          "admin": "Filleted and skin",
        },
        "factor": 1.17,
        "caughtBy": [
          {
            "vessel": "WIRON 5",
            "pln": "H1100",
            "id": "2e9da3e5-5e31-4555-abb4-9e5e53b8d0ef",
            "date": "2020-06-02",
            "faoArea": "FAO27",
            "weight": 200,
            "flag": "GBR",
            "cfr": "GBRC17737"
          },
        ],
        "speciesAdmin": "Lobster Admin",
        "speciesOverriddenByAdmin": true,
        "commodityCodeAdmin": "1234 - ADMIN"
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "truck", exportedFrom: "United Kingdom", cmr: true }, '2023-05-01', mockGetVesselIdx);
      expect(res).toEqual([{
        date: "2020-06-02",
        species: {
          name: "Atlantic cod (COD)",
          code: "COD",
        },
        state: {
          name: "Fresh",
          code: "FRE",
        },
        presentation: {
          name: "Gutted",
          code: "GUT",
        },
        cnCode: "03025110",
        vessel: {
          name: "WIRON 5",
          pln: "H1100",
          length: 12,
          fao: "FAO27",
          flag: "GBR",
          cfr: "GBRC17737"
        },
        exportWeight: 200,
        isDirectLanding: false,
        vesselAdministration: "England",
        speciesAdmin: "Lobster Admin",
        adminState: "Fr",
        adminPresentation: "Filleted and skin",
        speciesOverriddenByAdmin: true,
        adminCommodityCode: "1234 - ADMIN",
      }]);

    });

    it('will map products with multiple landings', () => {
      const product = {
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
            "startDate": "2020-06-02",
            "date": "2020-06-02",
            "faoArea": "FAO27",
            "weight": 200,
            "gearType": "Type 1",
            "flag": "GBR",
            "cfr": "GBRC17737"
          },
          {
            "vessel": "WIRON 6",
            "pln": "H2200",
            "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
            "date": "2020-05-31",
            "faoArea": "FAO27",
            "weight": 300,
            "gearType": "",
            "flag": "GBR",
            "cfr": "GBRC17737"
          }
        ]
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "truck", exportedFrom: "United Kingdom", cmr: true }, '2023-05-01', mockGetVesselIdx);

      expect(res).toEqual([
        {
          startDate: "2020-06-02",
          date: "2020-06-02",
          species: {
            name: "Atlantic cod (COD)",
            code: "COD",
          },
          state: {
            name: "Fresh",
            code: "FRE",
          },
          presentation: {
            name: "Gutted",
            code: "GUT",
          },
          cnCode: "03025110",
          vessel: {
            name: "WIRON 5",
            pln: "H1100",
            length: 12,
            fao: "FAO27",
            flag: "GBR",
            cfr: "GBRC17737"
          },
          exportWeight: 200,
          gearType: "Type 1",
          isDirectLanding: false,
          vesselAdministration: "England"
        },
        {
          date: "2020-05-31",
          species: {
            name: "Atlantic cod (COD)",
            code: "COD",
          },
          state: {
            name: "Fresh",
            code: "FRE",
          },
          presentation: {
            name: "Gutted",
            code: "GUT",
          },
          cnCode: "03025110",
          vessel: {
            name: "WIRON 6",
            pln: "H2200",
            length: 12,
            fao: "FAO27",
            flag: "GBR",
            cfr: "GBRC17737"
          },
          exportWeight: 300,
          gearType: "",
          isDirectLanding: false,
          vesselAdministration: "England"
        }
      ]);
    });

    it('will map the cfr from cache when cfr in document is undefined', () => {
      const product = {
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
            "weight": 200,
            "flag": "GBR",
            "cfr": "some-cfr-value"
          }
        ]
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "truck", exportedFrom: "United Kingdom", cmr: true }, '2023-05-01', mockGetVesselIdx);

      expect(mockLicenceLookUp).toHaveBeenCalledWith('H1100', '2020-06-02');
      expect(mockVesselLookup).toHaveBeenCalled();
      expect(res[0].vessel.cfr).toBeDefined();
      expect(res[0].vessel.cfr).toBe('some-cfr-value');
    });

    it('will correctly map the product when vessel details is undefined', () => {
      mockLicenceLookUp.mockReturnValue(undefined);

      const product = {
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
            "weight": 200,
            "flag": "GBR"
          }
        ]
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "truck", exportedFrom: "United Kingdom", cmr: true }, '2023-05-01', mockGetVesselIdx);
      expect(res).toBeDefined();
    });

    it('will return true for isDirectLanding if the transportation vehicle is a direct landing', () => {
      const product = {
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
            "weight": 200,
            "flag": "GBR",
            "cfr": "GBRC17737"
          },
          {
            "vessel": "WIRON 6",
            "pln": "H2200",
            "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
            "date": "2020-05-31",
            "faoArea": "FAO27",
            "weight": 300,
            "flag": "GBR",
            "cfr": "GBRC17737"
          }
        ]
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "directLanding", exportedFrom: "United Kingdom" }, '2023-05-01', mockGetVesselIdx);

      expect(res).toEqual([
        {
          date: "2020-06-02",
          species: {
            name: "Atlantic cod (COD)",
            code: "COD",
          },
          state: {
            name: "Fresh",
            code: "FRE",
          },
          presentation: {
            name: "Gutted",
            code: "GUT",
          },
          cnCode: "03025110",
          vessel: {
            name: "WIRON 5",
            pln: "H1100",
            length: 12,
            fao: "FAO27",
            flag: "GBR",
            cfr: "GBRC17737"
          },
          exportWeight: 200,
          isDirectLanding: true,
          vesselAdministration: "England"
        },
        {
          date: "2020-05-31",
          species: {
            name: "Atlantic cod (COD)",
            code: "COD",
          },
          state: {
            name: "Fresh",
            code: "FRE",
          },
          presentation: {
            name: "Gutted",
            code: "GUT",
          },
          cnCode: "03025110",
          vessel: {
            name: "WIRON 6",
            pln: "H2200",
            length: 12,
            fao: "FAO27",
            flag: "GBR",
            cfr: "GBRC17737"
          },
          exportWeight: 300,
          isDirectLanding: true,
          vesselAdministration: "England"
        }
      ]);
    });

    it('will return the cfr and the flag of the vessel within each landing', () => {
      const product = {
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
            "weight": 200,
            "flag": "GBR",
            "cfr": "GBRC17737"
          }
        ]
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "directLanding", exportedFrom: "United Kingdom" }, '2023-05-01', mockGetVesselIdx);

      expect(res[0].vessel.cfr).toBe("GBRC17737");
      expect(res[0].vessel.flag).toBe("GBR");
    });

    it('will return an empty landings array if no landings are present', () => {
      const product = {
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
        "factor": 1.17
      };

      const res = SUT.toDefraCcLanding(product, { vehicle: "directLanding", exportedFrom: "United Kingdom" }, '2023-05-01', mockGetVesselIdx);

      expect(res).toStrictEqual([]);
    });

    it('will return an empty products array if no products are present', () => {
      const product = undefined;

      const res = SUT.toDefraCcLanding(product, { vehicle: "directLanding", exportedFrom: "United Kingdom" }, '2023-05-01', mockGetVesselIdx);

      expect(res).toStrictEqual([]);
    });

  });

  describe('getIsLegallyDue', () => {

    it('will return legally due false if landing.extended.vesselOverriddenByAdmin is true', () => {
      const result = SUT.getIsLegallyDue({ extended: { vesselOverriddenByAdmin: true } } as any);

      expect(result).toBe(false);
    });

    it('will return the value of isLegallyDue if landing.extended.vesselOverriddenByAdmin is undefined', () => {
      const input: any = {
        da: 'da',
        createdAt: '2021-01-01',
        dateLanded: '2021-01-01',
        species: 'test species',
        extended: { isLegallyDue: true }
      };

      expect(SUT.getIsLegallyDue(input)).toBe(true);
    });

  });

  describe('For transportation', () => {

    it('will include all the required transportation properties when provided', () => {
      const result = toTransportation(undefined);

      expect(result).toEqual(undefined);
    });

    describe('For Truck', () => {
      it('will include the correct set of properties when exporter has transport document', () => {
        const truckTransport = {
          vehicle: "truck",
          cmr: true
        };

        const expectedResult: CertificateTransport = {
          modeofTransport: 'truck',
          hasRoadTransportDocument: true
        };

        const result = toTransportation(truckTransport);

        expect(result).toEqual(expectedResult);
      });

      it('will include the correct set of properties when exporter has not got transport document', () => {
        const truckTransport = {
          vehicle: "truck",
          cmr: false,
          nationalityOfVehicle: "UK",
          registrationNumber: "WE893EF",
          departurePlace: "Telford",
          exportDate: "14/06/2019"
        }

        const expectedResult: CertificateTransport = {
          modeofTransport: 'truck',
          hasRoadTransportDocument: false,
          nationality: "UK",
          registration: "WE893EF",
          exportLocation: "Telford",
          exportDate: "14/06/2019"
        };

        const result = toTransportation(truckTransport);

        expect(result).toEqual(expectedResult);
      });
    });

    describe('For Train', () => {
      it('will include the correct set of properties', () => {
        const trainTransport = {
          vehicle: "train",
          railwayBillNumber: "1234",
          departurePlace: "Telford",
          exportDate: "03/05/2020"
        };

        const expectedResult: CertificateTransport = {
          modeofTransport: 'train',
          billNumber: "1234",
          exportLocation: "Telford",
          exportDate: "03/05/2020"
        };

        const result = toTransportation(trainTransport);

        expect(result).toEqual(expectedResult);
      });
    });

    describe('For Plane', () => {
      it('will include the correct set of properties', () => {
        const planeTransport = {
          vehicle: "plane",
          flightNumber: "BA078",
          containerNumber: "1234",
          departurePlace: "Telford",
          exportDate: "30/05/2020"
        };

        const expectedResult: CertificateTransport = {
          modeofTransport: 'plane',
          flightNumber: "BA078",
          containerId: "1234",
          exportLocation: "Telford",
          exportDate: "30/05/2020"
        };

        const result = toTransportation(planeTransport);

        expect(result).toEqual(expectedResult);
      });
    });

    describe('For Container Vessel', () => {
      it('will include the correct set of properties', () => {
        const vesselTransport = {
          vehicle: "containerVessel",
          vesselName: "WIRON 5",
          flagState: "UK",
          containerNumber: "1234",
          departurePlace: "Telford",
          exportDate: "30/05/2020"
        };

        const expectedResult: CertificateTransport = {
          modeofTransport: 'vessel',
          name: "WIRON 5",
          flag: "UK",
          containerId: "1234",
          exportLocation: "Telford",
          exportDate: "30/05/2020"
        }

        const result = toTransportation(vesselTransport);

        expect(result).toEqual(expectedResult);
      });
    });

    describe('For DirectLanding', () => {
      it('will include the correct set of properties', () => {
        const directLanding = {
          vehicle: "directLanding",
          exportedFrom: "United Kingdom",
          departurePlace: "Location",
          exportedTo: {
            officialCountryName: "France",
            isoCodeAlpha2: "FR",
            isoCodeAlpha3: "FRA",
            isoNumericCode: "250"
          },
          exportDate: "30/05/2020"
        };

        const expectedResult: CertificateTransport = {
          modeofTransport: "directLanding",
          exportLocation: "Location",
          exportDate: "30/05/2020"
        };

        const result = toTransportation(directLanding);

        expect(result).toEqual(expectedResult);
      });
    });
  });

});

const exampleCc: IDocument = {
  "createdAt": new Date("2020-06-24T10:39:32.000Z"),
  "__t": "catchCert",
  "createdBy": "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12",
  "status": "COMPLETE",
  "documentNumber": "GBR-2020-CC-1BC924FCF",
  "clonedFrom": "GBR-2023-CC-C3A82642B",
  "landingsCloned": false,
  "parentDocumentVoid": false,
  "audit": [
    {
      "eventType": "INVESTIGATED",
      "triggeredBy": "Chris Waugh",
      "timestamp": {
        "$date": "2020-06-24T10:40:18.780Z"
      },
      "data": {
        "investigationStatus": "UNDER_INVESTIGATION"
      }
    },
    {
      "eventType": "INVESTIGATED",
      "triggeredBy": "Chris Waugh",
      "timestamp": {
        "$date": "2020-06-24T10:40:23.439Z"
      },
      "data": {
        "investigationStatus": "CLOSED_NFA"
      }
    }
  ],
  "userReference": "MY REF",
  "exportData": {
    "exporterDetails": {
      "contactId": "an id",
      "accountId": "an id acc",
      "exporterFullName": "Bob Exporter",
      "exporterCompanyName": "Exporter Co",
      "addressOne": "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
      "townCity": "T",
      "postcode": "P",
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
        "scientificName": "some scientific name",
        "commodityCode": "1234",
        "commodityCodeDescription": "some commodity code description",
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
            "flag": "GBR",
            "cfr": "GBRC17737",
            "weight": 100,
            "dataEverExpected": true,
            "landingDataExpectedDate": "2023-10-26",
            "landingDataEndDate": "2023-10-27",
          }
        ]
      },
      {
        "species": "Atlantic cod (COD)",
        "speciesId": "6763576e-c5b8-41cf-a708-f4b9a470623e",
        "speciesCode": "COD",
        "scientificName": "Gadus morhua",
        "commodityCode": "1234",
        "commodityCodeDescription": `Fresh or chilled fillets of cod "Gadus morhua, Gadus ogac, Gadus macro...`,
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
            "weight": 200,
            "flag": "GBR",
            "cfr": "GBRC17737",
            "dataEverExpected": false
          },
          {
            "vessel": "WIRON 6",
            "pln": "H2200",
            "id": "4cf6cb44-28ad-4731-bea4-05051ae2edd9",
            "date": "2020-05-31",
            "faoArea": "FAO27",
            "weight": 200,
            "flag": "GBR",
            "cfr": "GBRC17737"
          }
        ]
      }
    ],
    "conservation": {
      "conservationReference": "UK Fisheries Policy"
    },
    "exportedFrom": "United Kingdom",
    "exportedTo": {
      "officialCountryName": "Nigeria",
      "isoCodeAlpha2": "NG",
      "isoCodeAlpha3": "NGA",
      "isoNumericCode": "566"
    },
    "transportation": {
      "vehicle": 'truck',
      "departurePlace": "Hull",
      "cmr": true
    },
    "transportations": [{
      "id": 0,
      "freightBillNumber": '0',
      "vehicle": "truck",
      "departurePlace": "Hull",
      "exportedTo": {
        "officialCountryName": "Nigeria",
        "isoCodeAlpha2": "NG",
        "isoCodeAlpha3": "NGA",
        "isoNumericCode": "566"
      },
      "transportDocuments": [{
        "name": "Invoice",
        "reference": "INV001"
      }]
    }, {
      "id": 0,
      "freightBillNumber": '0',
      "vehicle": "plane",
      "departurePlace": "Hull",
      "exportedTo": {
        "officialCountryName": "Nigeria",
        "isoCodeAlpha2": "NG",
        "isoCodeAlpha3": "NGA",
        "isoNumericCode": "566"
      },
      "transportDocuments": [{
        "name": "Invoice",
        "reference": "INV001"
      }]
    }, {
      "id": 0,
      "freightBillNumber": '0',
      "vehicle": "train",
      "departurePlace": "Hull",
      "exportedTo": {
        "officialCountryName": "Nigeria",
        "isoCodeAlpha2": "NG",
        "isoCodeAlpha3": "NGA",
        "isoNumericCode": "566"
      },
      "transportDocuments": [{
        "name": "Invoice",
        "reference": "INV001"
      }]
    }, {
      "id": 0,
      "freightBillNumber": '0',
      "vehicle": "containerVessel",
      "departurePlace": "Hull",
      "exportedTo": {
        "officialCountryName": "Nigeria",
        "isoCodeAlpha2": "NG",
        "isoCodeAlpha3": "NGA",
        "isoNumericCode": "566"
      },
      "transportDocuments": [{
        "name": "Invoice",
        "reference": "INV001"
      }]
    }, {
      "id": 0,
      "freightBillNumber": '0',
      "vehicle": "unknown",
      "departurePlace": "Hull",
      "exportedTo": {
        "officialCountryName": "Nigeria",
        "isoCodeAlpha2": "NG",
        "isoCodeAlpha3": "NGA",
        "isoNumericCode": "566"
      },
      "transportDocuments": []
    }, undefined]
  },
  "createdByEmail": "foo@foo.com",
  "documentUri": "_44fd226f-598f-4615-930f-716b2762fea4.pdf",
  "investigation": {
    "investigator": "Chris Waugh",
    "status": "CLOSED_NFA"
  },
  "numberOfFailedAttempts": 5
}

const correlationId = 'some-uuid-correlation-id';
const requestByAdmin = false;

describe("Mapping toDefraCcLandingStatus", () => {
  const queryTime = moment.utc();
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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.DataNeverExpected)
  });

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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.ValidationSuccess)
  });

  it('will flag as `Validation Failure - Overuse` if the cert is overuse', () => {

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
      isOverusedAllCerts: true,
      isExceeding14DayLimit: false,
      overUsedInfo: ['CC1', 'CC2'],
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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_Overuse);
  });

  it('will flag as `Validation Failure - Weight` if the cert fails weight check', () => {

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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_Weight);
  });

  it('will flag as `Validation Failure - Weight And Overuse` if the cert fails weight and overuse check both', () => {

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
      overUsedInfo: ['CC1', 'CC2'],
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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_WeightAndOveruse);
  });

  it('will flag as `Validation Failure - Species` if the cert is a species mis-match', () => {

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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_Species);
  });

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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLicenceHolder);
  });

  it('will flag as `Validation Failure - No Landing Data` if the cert is a Elog species mismatch and species weight is under the 50 KG deminimus and end date has reached at retrospective check', () => {

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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
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

    const result = SUT.toDefraCcLandingStatus(input, false);

    expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_ElogSpecies);
  });

  describe('When no landing data found', () => {

    it('will flag as `Validation Failure - No Landing Data` if there is no landing data', () => {

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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `Validation Failure - No Landing Data` if landingDataExpectedDate is undefined and there is no landing data', () => {

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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `Validation Failure - No Landing Data` if end date is in the past of the submission date', () => {
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `Validation Failure - No Landing Data` if landing data is expected at submission but 14 day limit is crossed', () => {
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
    });

    it('will flag as `Validation Failure - No Landing Data` if landing data is not expected at submission but 14 day limit is crossed at retrospective check', () => {
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataNotYetExpected);
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataNotYetExpected);
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataExpected);
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataExpected);
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataNotYetExpected);
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

      const result = SUT.toDefraCcLandingStatus(input, false);

      expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataExpected);
    });

    describe('When risking is high', () => {

      it('will flag as `Validation Failure - No Landing Data` if vessel has been overridden by an admin and landing data is not expected at submission', () => {

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

        const result = SUT.toDefraCcLandingStatus(input, true);

        expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
      });

      it('will flag as `Validation Failure - No Landing Data` if end date is in the past of the submission date and risk is High', () => {
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

        const result = SUT.toDefraCcLandingStatus(input, true);

        expect(result).toEqual(DefraCcLandingStatusType.ValidationFailure_NoLandingData);
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

        const result = SUT.toDefraCcLandingStatus(input, true);

        expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataExpected);
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

        const result = SUT.toDefraCcLandingStatus(input, true);

        expect(result).toEqual(DefraCcLandingStatusType.PendingLandingData_DataNotYetExpected);
      });
    });

  });

})

describe('when mapping CatchArea', () => {
  it('will contain the correct catch areas', () => {
    expect(CatchArea.FAO18).toBe('FAO18');
    expect(CatchArea.FAO21).toBe('FAO21');
    expect(CatchArea.FAO27).toBe('FAO27');
    expect(CatchArea.FAO31).toBe('FAO31');
    expect(CatchArea.FAO34).toBe('FAO34');
    expect(CatchArea.FAO37).toBe('FAO37');
    expect(CatchArea.FAO41).toBe('FAO41');
    expect(CatchArea.FAO47).toBe('FAO47');
    expect(CatchArea.FAO48).toBe('FAO48');
    expect(CatchArea.FAO51).toBe('FAO51');
    expect(CatchArea.FAO57).toBe('FAO57');
    expect(CatchArea.FAO58).toBe('FAO58');
    expect(CatchArea.FAO61).toBe('FAO61');
    expect(CatchArea.FAO67).toBe('FAO67');
    expect(CatchArea.FAO71).toBe('FAO71');
    expect(CatchArea.FAO77).toBe('FAO77');
    expect(CatchArea.FAO81).toBe('FAO81');
    expect(CatchArea.FAO87).toBe('FAO87');
    expect(CatchArea.FAO88).toBe('FAO88');
  });
});

describe('when mapping CertificateStatus', () => {
  it('will contain the correct statuses', () => {
    expect(CertificateStatus.COMPLETE).toBe('COMPLETE');
    expect(CertificateStatus.BLOCKED).toBe('BLOCKED');
    expect(CertificateStatus.VOID).toBe('VOID');
  });
});
