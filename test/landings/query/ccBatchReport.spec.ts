const moment = require('moment');
import { generateIndex } from '../../../src/data/vesselIndex';
import { ICcBatchValidationReport, LandingSources, InvestigationStatus, AuditEventTypes } from '../../../src/landings/types';
import { ccBatchReport, ccQuery } from '../../../src/landings/query';

const vessels = [
  {
    registrationNumber: "WA1",
    fishingLicenceValidTo: "3000-12-20T00:00:00",
    fishingLicenceValidFrom: "2010-12-29T00:00:00",
    rssNumber: "rssWA1",
    adminPort: 'GUERNSEY'
  },
  {
    registrationNumber: "WA2",
    fishingLicenceValidTo: "3000-12-20T00:00:00",
    fishingLicenceValidFrom: "2010-12-29T00:00:00",
    rssNumber: "rssWA2",
    adminPort: 'WICK'
  }
]

const vesselsIdx = generateIndex(vessels);


describe('the actual catchCertificate report', () => {

  let mockGetSpeciesAlias;

  beforeEach(() => {
    mockGetSpeciesAlias = jest.fn();
    mockGetSpeciesAlias.mockImplementation(() => undefined ?? []);
  })

  afterEach(() => {
    mockGetSpeciesAlias.mockReset();
  })

  describe('when formatting its output fields', () => {

    it('outputs `dateandtime` as DD/MM/YYYY', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))
      expect(results[0].date).toBe("12/07/2019");

    });

    it('outputs `time` as hh:mm:ss', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T01:08:10.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))
      expect(results[0].time).toBe("01:08:10");

    });

    it('exposes a direct landing as `Y`', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T01:08:10.000Z",
          exportData: {
            transportation: {
              vehicle: "directLanding"
            },
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))
      expect(results[0].directLanding).toBe('Y');

    });

    it('exposes an indirect landing as `N`', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T01:08:10.000Z",
          exportData: {
            transportation: {
              vehicle: "truck"
            },
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))
      expect(results[0].directLanding).toBe('N');

    });

    it('will have a `presentation` property', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                presentation: { code: "WFH" },
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].productPresentation).toBe("WFH");
    });

    it('will have a rawLandings url', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                presentation: { code: "WFH" },
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].rawLandingsUrl).toBe("{BASE_URL}/reference/api/v1/extendedData/rawLandings?dateLanded=2019-07-08&rssNumber=rssWA1");
    });

    it('will have a salesNotes url', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                presentation: { code: "WFH" },
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].salesNotesUrl).toBe("{BASE_URL}/reference/api/v1/extendedData/salesNotes?dateLanded=2019-07-08&rssNumber=rssWA1");
    });

    it('will have a `url` property', () => {
      const documents = [
        {
          documentNumber: "CC1",
          documentUri: "www.defra.gov.uk",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                presentation: "WFH",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].documentUrl).toBe("www.defra.gov.uk");
    });

    it('will have a `voidedBy` property', () => {
      const documents = [
        {
          documentNumber: "CC1",
          documentUri: "www.defra.gov.uk",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                presentation: "WFH",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }
            ]
          },
          audit: [
            { "eventType": "VOIDED", "triggeredBy": "Jim", "timestamp": new Date(), "data": null },
            { "eventType": "VOIDED", "triggeredBy": "Bob", "timestamp": new Date(), "data": null }
          ]
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].voidedBy).toBe('Bob');
    });

    it('will have a `preApprovedBy` property', () => {
      const documents = [
        {
          documentNumber: "CC1",
          documentUri: "www.defra.gov.uk",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                presentation: "WFH",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }
            ]
          },
          audit: [
            { "eventType": AuditEventTypes.PreApproved, "triggeredBy": "Jim", "timestamp": new Date(), "data": null },
            { "eventType": AuditEventTypes.PreApproved, "triggeredBy": "Bob", "timestamp": new Date(), "data": null }
          ]
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].preApprovedBy).toBe('Bob');
    });

    it('has correct logic for unavailabilityDuration', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2019-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-13T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_41_unavailabilityDuration]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', '40 days+'],
          ['CC2', 'rssWA1', '2019-07-10', '0.0.0.1'],
          ['CC1', 'rssWA1', '2019-07-11', '40 days+'],
          ['CC2', 'rssWA1', '2019-07-11', '18.3.33.53']].sort())

    })

    it('has correct logic for unavailability duration less than zero days', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-12T00:00:00.000Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 30, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-07-31T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_41_unavailabilityDuration]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-08', '0.0.0.0']])
    })

    it('has correct logic for unavailabilityExceeds14Days', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, _status: "PENDING_LANDING_DATA" },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100, _status: "HAS_LANDING_DATA" }
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2019-07-31T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100, _status: "PENDING_LANDING_DATA" },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-13", weight: 100, _status: "HAS_LANDING_DATA" }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190713T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T10:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_47_unavailabilityExceeds14Days]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 'Fail'],
          ['CC2', 'rssWA1', '2019-07-12', undefined],
          ['CC1', 'rssWA1', '2019-07-11', 'Fail'],
          ['CC2', 'rssWA1', '2019-07-13', 'Pass']].sort())

    });

    it('has correct logic for unavailabilityExceeds14Days with respect to end date', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-08-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-08-10", weight: 100, dataEverExpected: true, landingDataExpectedDate: "2019-06-23", landingDataEndDate: "2019-07-07", _status: "PENDING_LANDING_DATA" }
                ]
              }]
          }
        }
      ]

      const landings = []

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_47_unavailabilityExceeds14Days]))
        .toEqual([['CC1', 'rssWA1', '2019-08-10', 'Fail']]);

    });

    it('has correct logic for unavailabilityExceeds14Days for an ELog', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, _status: "PENDING_LANDING_DATA" },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100, _status: "HAS_LANDING_DATA" }
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2019-07-31T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100, _status: "PENDING_LANDING_DATA" },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-13", weight: 100, _status: "HAS_LANDING_DATA" }
                ]
              }]
          }
        },
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190713T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T10:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_47_unavailabilityExceeds14Days]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 'Fail'],
          ['CC2', 'rssWA1', '2019-07-12', undefined],
          ['CC1', 'rssWA1', '2019-07-11', 'Fail'],
          ['CC2', 'rssWA1', '2019-07-13', 'Pass']].sort())

    });

    it('has correct logic for unavailabilityExceeds14Days when there are two landings on the same day', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                ]
              }]
          }
        },
      ]

      const landings = [

        // Landing is retrieved within 14 days of the CCcreation date
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T08:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },

        // Landing is retrieved after 14 days of the CCcreation date
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T230000Z').toISOString(),
          dateTimeRetrieved: '2019-08-31T08:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },

      ]

      const queryTime = moment.utc('2019-09-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_47_unavailabilityExceeds14Days]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 'Pass'],
        ].sort())

    })

    it('has correct logic for unavailabilityExceeds14Days when there are two landings on the same day for ELOG', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                ]
              }]
          }
        },
      ]

      const landings = [

        // Landing is retrieved within 14 days of the CCcreation date
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-10T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },

        // Landing is retrieved after 14 days of the CCcreation date
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T230000Z').toISOString(),
          dateTimeRetrieved: '2019-08-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },

      ]

      const queryTime = moment.utc('2019-09-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_47_unavailabilityExceeds14Days]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 'Pass'],
        ].sort())

    })

    it('has correct logic for numberOfLandings', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: '20190711T010000Z',
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: '20190712T010000Z',
          dateTimeRetrieved: '2019-07-31T10:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: '20190712T230000Z',
          dateTimeRetrieved: '2019-07-31T10:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_288_numberOfLandings]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', undefined],
          ['CC1', 'rssWA1', '2019-07-11', 1],
          ['CC1', 'rssWA1', '2019-07-12', 2],
        ])

    })

    it('has correct logic for speciesMatch', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'FOX', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T10:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'COD', weight: 100, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_289_speciesMismatch]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 'Match'],
          ['CC1', 'rssWA1', '2019-07-11', 'Fail'],
          ['CC1', 'rssWA1', '2019-07-12', undefined],
        ])

    })

    it('has correct logic for species alias', () => {

      mockGetSpeciesAlias.mockReturnValue(['ANF']);

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "MON",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: 'COD', weight: 100, factor: 1 },
            { species: 'ANF', weight: 100, factor: 1 }
          ]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T10:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [{ species: 'HER', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [{ species: 'FOX', weight: 100, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T10:26:08.000Z',
          source: LandingSources.LandingDeclaration,
          items: [{ species: 'COD', weight: 100, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(mockGetSpeciesAlias).toHaveBeenNthCalledWith(2, 'MON');

      expect(results.map(_ => [_.documentNumber, _.speciesCode, _.speciesAlias, _.speciesAnomaly, _.landingBreakdowns]).sort())
        .toEqual([
          ['CC1', 'MON', 'N', undefined, undefined],
          ['CC1', 'MON', 'N', undefined, undefined],
          ['CC1', 'MON', 'Y', 'ANF',  "species: MON, factor: 1, landed weight: 100, live weight: 100, source of validation: LANDING_DECLARATION"],
        ])

    })

    it('will set speciesMatch as `undefined` if no landings available', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = []

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.FI0_289_speciesMismatch]).sort())
        .toEqual([[undefined], [undefined], [undefined]])

    })

    it('has correct logic for exceededWeight', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190712T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))


      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_290_exportedWeightExceedingLandedWeight]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 10],
          ['CC1', 'rssWA1', '2019-07-11', undefined],
          ['CC1', 'rssWA1', '2019-07-12', undefined],
        ])

    })

    it('When a catch certificate references a landing and no landings exist on that day, then the ‘landed’ weight used as a basis for calculations for this field shall be `undefined`.', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190712T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))


      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_290_exportedWeightExceedingLandedWeight]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', undefined]
        ])
    })

    it('When a catch certificate references a landing and there does exist a landing on that day, but the referenced species does not exist on any landings on that day, then the ‘landed’ weight used as a basis for calculations for this field shall be zero.', () => {
      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'BOB', weight: 90, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_290_exportedWeightExceedingLandedWeight]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 100]
        ])
    })

    it('When the catch certificate weight does not exceed the landed weight but there are other certificates referencing the same landing / species and the sum of these weights exceeds the landed weight, then the field shall show the difference between the landing weight and the the sum of all catch certificate weights', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 40 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 40 }
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2018-07-14T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 60 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 40 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_290_exportedWeightExceedingLandedWeight]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 10],
          ['CC1', 'rssWA1', '2019-07-11', undefined],
          ['CC2', 'rssWA1', '2019-07-10', 10],
          ['CC2', 'rssWA1', '2019-07-11', undefined]
        ])

    })

    it('When the catch certificate weight exceeds the landed weight AND there are other catch certificates referencing the same landing / species, then the field shall show the difference between the landing weight and the sum of all catch certificate weights', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 40 }
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2018-07-14T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        }
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_290_exportedWeightExceedingLandedWeight]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 110],
          ['CC1', 'rssWA1', '2019-07-11', 50],
          ['CC2', 'rssWA1', '2019-07-10', 110],
          ['CC2', 'rssWA1', '2019-07-11', 50]
        ])

    });

    describe('When obtaining number of validation fails', () => {
      describe('When landing is not available within 14 days', () => {
        it("will show no failures", () => {

          const ccDate = moment.utc().toISOString();
          const documents = [
            {
              documentNumber: "CC1",
              createdAt: ccDate,
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: ccDate, weight: 50 }
                    ]
                  }]
              }
            },
            {
              documentNumber: "CC2",
              createdAt: ccDate,
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", ccDate, weight: 100 },
                    ]
                  }]
              }
            }
          ]

          const landings = []

          const queryTime = moment.utc();

          const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
          const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

          expect(results.map(_ => [_.documentNumber, _.rssNumber, _.FI0_136_numberOfFailedValidations]).sort())
            .toEqual([
              ['CC1', 'rssWA1', 0],
              ['CC2', 'rssWA1', 0]
            ]);
        });
      });

      describe('When landing is not available after 14 days', () => {
        it("will flag any cc relating to the landing as failed", () => {
          const documents = [
            {
              documentNumber: "CC1",
              createdAt: "2019-07-15T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 50, _status: "PENDING_LANDING_DATA" }
                    ]
                  }]
              }
            },
            {
              documentNumber: "CC2",
              createdAt: "2019-07-16T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, _status: "PENDING_LANDING_DATA" },
                    ]
                  }]
              }
            }
          ]

          const landings = []

          const queryTime = moment.utc('2019-09-01T12:00:00')

          const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
          const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

          expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_136_numberOfFailedValidations]).sort())
            .toEqual([
              ['CC1', 'rssWA1', '2019-07-10', 1],
              ['CC2', 'rssWA1', '2019-07-10', 1]
            ]);
        });
      });

      describe('When landing becomes available within 14 days', () => {

        it("If we overuse weight on each related CC then we will have a failure", () => {

          const documents = [
            {
              documentNumber: "CC1",
              createdAt: "2019-07-15T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 60 }
                    ]
                  }]
              }
            },
            {
              documentNumber: "CC2",
              createdAt: "2019-07-16T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 101 },
                    ]
                  }]
              }
            }
          ]

          const landings = [
            {
              rssNumber: 'rssWA1',
              dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
              dateTimeRetrieved: '2019-07-15T08:26:08.000Z',
              source: LandingSources.LandingDeclaration,
              items: [{ species: 'LBE', weight: 100, factor: 1 }]
            }]

          const queryTime = moment.utc('2019-08-01T12:00:00')

          const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
          const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

          expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_136_numberOfFailedValidations]).sort())
            .toEqual([
              ['CC1', 'rssWA1', '2019-07-10', 1],
              ['CC2', 'rssWA1', '2019-07-10', 1]
            ]);
        });

        it("If we have wrong species on each related CC then we will show a failure", () => {

          const documents = [
            {
              documentNumber: "CC1",
              createdAt: "2019-07-15T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 50 }
                    ]
                  }]
              }
            },
            {
              documentNumber: "CC2",
              createdAt: "2019-07-16T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                    ]
                  }]
              }
            }
          ]

          const landings = [
            {
              rssNumber: 'rssWA1',
              dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
              dateTimeRetrieved: '2019-07-15T08:26:08.000Z',
              source: LandingSources.LandingDeclaration,
              items: [{ species: 'COD', weight: 100, factor: 1 }]
            }]

          const queryTime = moment.utc('2019-08-01T12:00:00')

          const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
          const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

          expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_136_numberOfFailedValidations]).sort())
            .toEqual([
              ['CC1', 'rssWA1', '2019-07-10', 1],
              ['CC2', 'rssWA1', '2019-07-10', 1]
            ]);
        });
      });

      describe('When landing becomes available after 14 days', () => {

        it("If we overuse weight on each related CC then we will have two failures", () => {

          const documents = [
            {
              documentNumber: "CC1",
              createdAt: "2019-07-15T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 60 }
                    ]
                  }]
              }
            },
            {
              documentNumber: "CC2",
              createdAt: "2019-07-16T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 101 },
                    ]
                  }]
              }
            }
          ]

          const landings = [
            {
              rssNumber: 'rssWA1',
              dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
              dateTimeRetrieved: '2019-09-02T08:26:08.000Z',
              source: LandingSources.ELog,
              items: [{ species: 'LBE', weight: 100, factor: 1 }]
            }]

          const queryTime = moment.utc('2019-09-05T12:00:00')

          const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
          const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

          expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_136_numberOfFailedValidations]).sort())
            .toEqual([
              ['CC1', 'rssWA1', '2019-07-10', 2],
              ['CC2', 'rssWA1', '2019-07-10', 2]
            ]);
        });

        it("If we have wrong species on each related CC then we will show two failures", () => {
          const documents = [
            {
              documentNumber: "CC1",
              createdAt: "2019-07-15T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 50 }
                    ]
                  }]
              }
            },
            {
              documentNumber: "CC2",
              createdAt: "2019-07-16T08:26:06.939Z",
              exportData: {
                products: [
                  {
                    speciesCode: "LBE",
                    caughtBy: [
                      { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                    ]
                  }]
              }
            }
          ]

          const landings = [
            {
              rssNumber: 'rssWA1',
              dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
              dateTimeRetrieved: '2019-09-02T08:26:08.000Z',
              source: LandingSources.ELog,
              items: [{ species: 'COD', weight: 100, factor: 1 }]
            }]

          const queryTime = moment.utc('2019-09-05T12:00:00')

          const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
          const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

          expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_136_numberOfFailedValidations]).sort())
            .toEqual([
              ['CC1', 'rssWA1', '2019-07-10', 2],
              ['CC2', 'rssWA1', '2019-07-10', 2]
            ]);
        });
      });

      it('has correct logic for numberFailedValidations', () => {
        const documents = [
          {
            documentNumber: "CC1",
            createdAt: "2019-07-13T08:26:06.939Z",
            exportData: {
              products: [
                {
                  speciesCode: "LBE",
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, _status: "HAS_LANDING_DATA" },
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100, _status: "PENDING_LANDING_DATA" },
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100, _status: "HAS_LANDING_DATA" },
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-13", weight: 100, _status: "HAS_LANDING_DATA" },
                  ]
                }]
            }
          },
          {
            documentNumber: "CC2",
            createdAt: "2019-07-31T08:26:06.939Z",
            exportData: {
              products: [
                {
                  speciesCode: "LBE",
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-14", weight: 100, _status: "PENDING_LANDING_DATA" },
                  ]
                }]
            }
          }
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
            source: LandingSources.ELog,
            items: [
              { species: 'LBE', weight: 100, factor: 1 }]
          },
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190712T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
            source: LandingSources.ELog,
            items: [
              { species: 'BOB', weight: 100, factor: 1 }]
          },
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190713T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
            source: LandingSources.ELog,
            items: [
              { species: 'LBE', weight: 1, factor: 1 }]
          },
        ]

        const queryTime = moment.utc('2019-08-01T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_136_numberOfFailedValidations]).sort())
          .toEqual([
            ['CC1', 'rssWA1', '2019-07-10', 1],
            ['CC1', 'rssWA1', '2019-07-11', 1], // No landing > 14 days
            ['CC1', 'rssWA1', '2019-07-12', 2], // Landing no species
            ['CC1', 'rssWA1', '2019-07-13', 2], // Landing, species, overweight
            ['CC2', 'rssWA1', '2019-07-14', 0], // No landing < 14 days
          ])
      })
    })

    it('has correct logic for totalWeights', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2019-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 30 }
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 99 },
                ]
              }]
          }
        }
      ]

      const landings = [
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190710T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190711T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 90, factor: 1 }]
        },
        {
          rssNumber: 'rssWA1',
          dateTimeLanded: moment.utc('20190712T010000Z').toISOString(),
          dateTimeRetrieved: '2019-07-31T08:26:08.000Z',
          source: LandingSources.ELog,
          items: [
            { species: 'LBE', weight: 100, factor: 1 }]
        },
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_291_totalExportWeights]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 199],
          ['CC1', 'rssWA1', '2019-07-12', 30],
          ['CC2', 'rssWA1', '2019-07-10', 199]
        ])

    })

    it('report will include extra data from the catch certificate', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [{
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
              ]
            }],
            exporterDetails: { exporterFullName: 'Mr Bob' }
          },
          status: "COMPLETE"
        }
      ]

      const landings = []

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].exporterName).toBe('Mr Bob')
      expect(results[0].documentStatus).toBe('COMPLETE')

    })

    it('report will include current investigation from the catch certificate', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-07-13T08:26:06.939Z",
          exportData: {
            products: [{
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
              ]
            }],
            exporterDetails: { exporterFullName: 'Mr Bob', exporterCompanyName: 'Ms Bob' }
          },
          status: "COMPLETE",
          investigation: {
            investigator: "Mr Fred",
            status: InvestigationStatus.Closed
          }
        }
      ]

      const landings = []

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results[0].exporterName).toBe('Mr Bob')
      expect(results[0].exporterCompanyName).toBe('Ms Bob')
      expect(results[0].documentStatus).toBe('COMPLETE')
      expect(results[0].investigatedBy).toBe("Mr Fred")
      expect(results[0].investigationStatus).toBe(InvestigationStatus.Closed)
    })

    it('report will be filtered on open range', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-01-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2019-01-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 99 },
                ]
              }]
          }
        }
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      let results: ICcBatchValidationReport[]

      results = Array.from(ccBatchReport(ccQuery(documents, [], vesselsIdx, queryTime, mockGetSpeciesAlias)))

      expect(results.length).toBe(2)

      results = Array.from(ccBatchReport(ccQuery(documents, [], vesselsIdx, queryTime, mockGetSpeciesAlias), moment.utc('2018-06-01'), null))

      expect(results.length).toBe(1) // failing
      expect(results[0].documentNumber).toBe('CC2')

      results = Array.from(ccBatchReport(ccQuery(documents, [], vesselsIdx, queryTime, mockGetSpeciesAlias), null, moment.utc('2018-06-01')))

      expect(results.length).toBe(1)
      expect(results[0].documentNumber).toBe('CC1')

    })

    it('report will be filtered on closed range', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-01-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2019-01-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 99 },
                ]
              }]
          }
        }
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      let results: ICcBatchValidationReport[]

      results = Array.from(ccBatchReport(ccQuery(documents, [], vesselsIdx,queryTime, mockGetSpeciesAlias), moment.utc('2017-01-01'), moment.utc('2020-01-01')))

      expect(results.length).toBe(2)

      results = Array.from(ccBatchReport(ccQuery(documents, [], vesselsIdx,queryTime, mockGetSpeciesAlias), moment.utc('2019-01-01T00:00:00.000Z'), moment.utc('2019-01-01T23:59:59.999Z')))

      expect(results.length).toBe(1)
      expect(results[0].documentNumber).toBe('CC2')

    })

    it('will consider whole base in report (e.g. weight on all CCs) even when filtered : FI0-400', () => {

      const documents = [
        {
          documentNumber: "CC1",
          createdAt: "2018-01-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                ]
              }]
          }
        },
        {
          documentNumber: "CC2",
          createdAt: "2019-01-01T08:26:06.939Z",
          exportData: {
            products: [
              {
                speciesCode: "LBE",
                caughtBy: [
                  { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 99 },
                ]
              }]
          }
        }
      ]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, [], vesselsIdx,queryTime, mockGetSpeciesAlias)

      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData, moment.utc('2018-06-01'), moment.utc('2020-01-01')))

      expect(results.length).toBe(1)

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.FI0_291_totalExportWeights]).sort())
        .toEqual([
          ['CC2', 'rssWA1', '2019-07-10', 199]].sort())

    })

    it('will return the DA as a column in the report', () => {

      const documents = [{
        documentNumber: "CC1",
        createdAt: "2018-01-01T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100 },
              ]
            }]
        }
      }]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, [], vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.authority]).sort())
        .toEqual([
          ['CC1', 'rssWA1', '2019-07-10', 'Guernsey'],
          ['CC1', 'rssWA2', '2019-07-10', 'Scotland'],
        ].sort())

    })

    it('will filter on DA', () => {

      const documents = [{
        documentNumber: "CC1",
        createdAt: "2018-01-01T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100 },
              ]
            }]
        }
      }]

      const queryTime = moment.utc('2019-08-01T12:00:00')

      const queryData = ccQuery(documents, [], vesselsIdx,queryTime, mockGetSpeciesAlias)
      const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData, null, null, ['Scotland']))

      expect(results.map(_ => [_.documentNumber, _.rssNumber, _.dateLanded, _.authority]).sort())
        .toEqual([
          ['CC1', 'rssWA2', '2019-07-10', 'Scotland'],
        ].sort())
    })

    describe.each([
      'exportWeight',
      'weightFactor',
      'landingBreakdowns',
      'aggregatedLandedDecWeight',
      'aggregatedLiveWeight',
      'aggregatedEstimateWeight',
      'aggregatedEstimateWeightPlusTolerance',
      'exportedWeightExceedingEstimateLandedWeight'
    ])('when using conversion factors', (property) => {

      it(`should contain a ${property} property when an ELOG landing is found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': 'species: HER, presentation: WHL, state: FRE, factor: 1, estimate weight: 100, estimate live weight: 100, estimate weight plus tolerance: 110, source of validation: ELOG',
          'aggregatedLandedDecWeight': undefined,
          'aggregatedLiveWeight': undefined,
          'aggregatedEstimateWeight': 100,
          'aggregatedEstimateWeightPlusTolerance': 110,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.ELog,
            items: [
              { species: 'HER', presentation: "WHL", state: "FRE", weight: 100, factor: 1 },
              { species: 'COD', presentation: "WHL", state: "FRE", weight: 100, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

      it(`should contain a ${property} property when multiple ELOG landings are found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': 'species: HER, presentation: WHL, state: FRE, factor: 1, estimate weight: 100, estimate live weight: 100, estimate weight plus tolerance: 110, source of validation: ELOG\nspecies: HER, presentation: WHL, state: FRE, factor: 1, estimate weight: 200, estimate live weight: 200, estimate weight plus tolerance: 220, source of validation: ELOG',
          'aggregatedLandedDecWeight': undefined,
          'aggregatedLiveWeight': undefined,
          'aggregatedEstimateWeight': 300,
          'aggregatedEstimateWeightPlusTolerance': 330,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.ELog,
            items: [
              { species: 'HER', presentation: "WHL", state: "FRE", weight: 100, factor: 1 },
              { species: 'HER', presentation: "WHL", state: "FRE", weight: 200, factor: 1 },
              { species: 'COD', presentation: "WHL", state: "FRE", weight: 100, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

      it(`should contain a ${property} property when a catch recording landing is found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': 'species: HER, factor: 1, estimate weight: 100, estimate live weight: 100, estimate weight plus tolerance: 110, source of validation: CATCH_RECORDING',
          'aggregatedLandedDecWeight': undefined,
          'aggregatedLiveWeight': undefined,
          'aggregatedEstimateWeight': 100,
          'aggregatedEstimateWeightPlusTolerance': 110,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.CatchRecording,
            items: [
              { species: 'HER', presentation: undefined, state: undefined, weight: 100, factor: 1 },
              { species: 'COD', presentation: undefined, state: undefined, weight: 100, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

      it(`should contain a ${property} property when a landing declaration landing is found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': 'species: HER, factor: 1, landed weight: 0, live weight: 0, source of validation: LANDING_DECLARATION',
          'aggregatedLandedDecWeight': undefined,
          'aggregatedLiveWeight': undefined,
          'aggregatedEstimateWeight': undefined,
          'aggregatedEstimateWeightPlusTolerance': undefined,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.LandingDeclaration,
            items: [
              { species: 'HER', presentation: undefined, state: undefined, weight: 0, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

      it(`should contain a ${property} property when multiple catch recorded landings are found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': 'species: HER, factor: 1, estimate weight: 100, estimate live weight: 100, estimate weight plus tolerance: 110, source of validation: CATCH_RECORDING\nspecies: HER, factor: 1, estimate weight: 200, estimate live weight: 200, estimate weight plus tolerance: 220, source of validation: CATCH_RECORDING',
          'aggregatedLandedDecWeight': undefined,
          'aggregatedLiveWeight': undefined,
          'aggregatedEstimateWeight': 300,
          'aggregatedEstimateWeightPlusTolerance': 330,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.CatchRecording,
            items: [
              { species: 'HER', presentation: undefined, state: undefined, weight: 100, factor: 1 },
              { species: 'HER', presentation: undefined, state: undefined, weight: 200, factor: 1 },
              { species: 'COD', presentation: undefined, state: undefined, weight: 100, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

      it(`should contain a ${property} property when a landing declaration landing is found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': 'species: HER, presentation: GUT, state: FRO, factor: 2, landed weight: 100, live weight: 200, source of validation: LANDING_DECLARATION',
          'aggregatedLandedDecWeight': 100,
          'aggregatedLiveWeight': 200,
          'aggregatedEstimateWeight': undefined,
          'aggregatedEstimateWeightPlusTolerance': undefined,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.LandingDeclaration,
            items: [
              { species: 'HER', presentation: "GUT", state: "FRO", weight: 100, factor: 2 },
              { species: 'COD', presentation: "WHL", state: "FRE", weight: 100, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

      it(`should contain a ${property} property when there multiple landing declarations landing are found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': 'species: HER, presentation: GUT, state: FRO, factor: 2, landed weight: 100, live weight: 200, source of validation: LANDING_DECLARATION\nspecies: HER, presentation: GUT, state: FRO, factor: 2, landed weight: 500, live weight: 1000, source of validation: LANDING_DECLARATION',
          'aggregatedLandedDecWeight': 600,
          'aggregatedLiveWeight': 1200,
          'aggregatedEstimateWeight': undefined,
          'aggregatedEstimateWeightPlusTolerance': undefined,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.LandingDeclaration,
            items: [
              { species: 'HER', presentation: "GUT", state: "FRO", weight: 100, factor: 2 },
              { species: 'HER', presentation: "GUT", state: "FRO", weight: 500, factor: 2 },
              { species: 'COD', presentation: "WHL", state: "FRE", weight: 100, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

      it(`should contain the correct ${property} property when no landings are found`, () => {
        const expected = {
          'exportWeight': 100,
          'weightFactor': 1.07,
          'landingBreakdowns': undefined,
          'aggregatedLandedDecWeight': undefined,
          'aggregatedLiveWeight': undefined,
          'aggregatedEstimateWeight': undefined,
          'aggregatedEstimateWeightPlusTolerance': undefined,
          'exportedWeightExceedingEstimateLandedWeight': undefined
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 1.07,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 100 }
                  ]
                }]
            }
          },
        ]

        const landings = []

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });

    });

    describe.each([
      'exportedWeightExceedingEstimateLandedWeight'
    ])('when using conversion factors', (property) => {

      it(`should contain a correct ${property} property when a export weight exceeds an ELOG esitmate plus tolerance`, () => {
        const expected = {
          'exportedWeightExceedingEstimateLandedWeight': 890
        };

        const documents = [
          {
            documentNumber: "CC1",
            documentUri: "www.defra.gov.uk",
            createdAt: "2019-07-12T00:00:00.000Z",
            exportData: {
              products: [
                {
                  speciesCode: "HER",
                  presentation: "GUT",
                  state: "FRO",
                  factor: 2,
                  caughtBy: [
                    { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-08", weight: 500 }
                  ]
                }]
            }
          },
        ]

        const landings = [
          {
            rssNumber: 'rssWA1',
            dateTimeLanded: moment.utc('20190708T010000Z').toISOString(),
            dateTimeRetrieved: '2019-07-10T00:00:00.000Z',
            source: LandingSources.ELog,
            items: [
              { species: 'HER', presentation: "WHL", state: "FRE", weight: 100, factor: 1 },
              { species: 'COD', presentation: "WHL", state: "FRE", weight: 100, factor: 1 }]
          }
        ]

        const queryTime = moment.utc('2019-07-31T12:00:00')

        const queryData = ccQuery(documents, landings, vesselsIdx,queryTime, mockGetSpeciesAlias)
        const results: ICcBatchValidationReport[] = Array.from(ccBatchReport(queryData))

        expect(results[0][property]).toBe(expected[property]);
      });
    })
  })

})

