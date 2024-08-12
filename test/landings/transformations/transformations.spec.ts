const _ = require('lodash')
const moment = require('moment')
const Transformations = require('../../../src/landings/transformations/transformations');
import { generateIndex } from '../../../src/data/vesselIndex';
import { ILanding, ILandingAggregated, ILandingAggregatedItem, ILandingAggregatedItemBreakdown, LandingSources } from '../../../src/landings/types/landing';
import { AuditEventTypes, InvestigationStatus } from '../../../src/landings/types/auditEvent';

interface ICatchTestItem {
  species: string,
  weight: number,
  area: number,
  dateLanded: string,
  state?: string,
  presentation?: string
}

const createCefas = (catches: ICatchTestItem[]) => ({
  cfr: 'cfr',
  rssNumber: 'rssNumber',
  vesselRegistrationNumber: 'regNumber',
  vesselName: 'vesselName',
  fishingAuthority: 'fishingAuthority',
  landings: _(catches)
    .sortBy('dateLanded')
    .groupBy('dateLanded')
    .map((items, dateLanded) => ({
      logbookNumber: 'logbookNumber',
      landingDateTime: dateLanded,
      landingPort: 'landingPort',
      landingAreas: _(items)
        .sortBy('area')
        .groupBy('area')
        .map((items, area) => ({
          faoArea: parseInt(area),
          faoSubArea: 'SUB' + area,
          landingAreaCatches: _(items)
            .map(item => ({
              species: item.species,
              weight: item.weight,
              state: item.state ? item.state : 'STA',
              presentation: item.presentation ? item.presentation : 'PRE'
            })).value()
        })).value()
    })).value(),
  dateTimeStamp: '20190101T000000Z'
})

const createELog = (catches: ICatchTestItem[]) => ({
  cfr: 'cfr',
  rssNumber: 'rssNumber',
  vesselRegistrationNumber: 'regNumber',
  vesselName: 'vesselName',
  fishingAuthority: 'fishingAuthority',
  activities: _(catches)
    .sortBy('dateLanded')
    .groupBy('dateLanded')
    .map((items, dateLanded) => ({
      returnDate: dateLanded,
      returnPort: 'landingPort',
      logbookNumber: 'logbookNumber',
      activityAreas: _(items)
        .sortBy('area')
        .groupBy('area')
        .map((items, area) => ({
          faoArea: parseInt(area),
          faoSubArea: 'SUB' + area,
          activityAreaCatches: _(items)
            .map(item => ({
              species: item.species,
              weight: item.weight,
              state: item.state ? item.state : 'STA',
              presentation: item.presentation ? item.presentation : 'PRE'
            })).value()
        })).value()
    })).value(),
  dateTimeStamp: '20190101T000000Z'
})

describe('when converting from catch recording response to landing', () => {

  const rssNumber = 'rssNumber';

  let mockGetToLiveWeightFactor;

  beforeEach(() => {
    mockGetToLiveWeightFactor = jest.fn();
    mockGetToLiveWeightFactor.mockImplementation(() => 1);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('will return an empty array if there are no fishing activities', () => {
    const input = {
      cfr: 'cfr',
      rssNumber: 'rss',
      vesselRegistrationNumber: 'vesselReg',
      vesselName: 'vesselName',
      fishingAuthority: 'uk',
      activities: [],
      dateTimeStamp: '2020-01-01'
    };

    expect(Transformations.catchRecordingToLandings(input, rssNumber, mockGetToLiveWeightFactor))
      .toStrictEqual([]);
  });

  it('will return an ILanding with no ILandingItems if we get an activity with no activity areas', () => {
    const input = {
      cfr: 'cfr',
      rssNumber: 'rss',
      vesselRegistrationNumber: 'vesselReg',
      vesselName: 'vesselName',
      fishingAuthority: 'uk',
      activities: [
        {
          tripId: 'tripId1',
          returnDate: '2020-01-01',
          returnPort: 'port',
          activityAreas: []
        }
      ],
      dateTimeStamp: '2020-01-01'
    };

    expect(Transformations.catchRecordingToLandings(input, rssNumber, mockGetToLiveWeightFactor))
      .toStrictEqual([
        {
          rssNumber: rssNumber,
          dateTimeLanded: moment.utc('2020-01-01').toISOString(),
          source: LandingSources.CatchRecording,
          items: []
        }
      ]);
  });

  it('will return an ILanding with no ILandingItems if we get an activity area with no catches', () => {
    const input = {
      cfr: 'cfr',
      rssNumber: 'rss',
      vesselRegistrationNumber: 'vesselReg',
      vesselName: 'vesselName',
      fishingAuthority: 'uk',
      activities: [
        {
          tripId: 'tripId1',
          returnDate: '2020-01-01',
          returnPort: 'port',
          activityAreas: [
            {
              faoArea: 33,
              faoSubArea: 'FO',
              activityAreaCatches: []
            }
          ]
        }
      ],
      dateTimeStamp: '2020-01-01'
    };

    expect(Transformations.catchRecordingToLandings(input, rssNumber, mockGetToLiveWeightFactor))
      .toStrictEqual([
        {
          rssNumber: rssNumber,
          dateTimeLanded: moment.utc('2020-01-01').toISOString(),
          source: LandingSources.CatchRecording,
          items: []
        }
      ]);
  });

  it('will return an ILanding with an ILandingItem if we get a valid catch', () => {
    mockGetToLiveWeightFactor.mockReturnValue(0.99);

    const input = {
      cfr: 'cfr',
      rssNumber: 'rss',
      vesselRegistrationNumber: 'vesselReg',
      vesselName: 'vesselName',
      fishingAuthority: 'uk',
      activities: [
        {
          tripId: 'tripId1',
          returnDate: '2020-01-01',
          returnPort: 'port',
          activityAreas: [
            {
              faoArea: 33,
              faoSubArea: 'FO',
              activityAreaCatches: [
                {
                  species: 'COD',
                  presentation: 'FIL',
                  state: 'FRO',
                  weight: 50
                }
              ]
            }
          ]
        }
      ],
      dateTimeStamp: '2020-01-01'
    };

    expect(Transformations.catchRecordingToLandings(input, rssNumber, mockGetToLiveWeightFactor))
      .toStrictEqual([
        {
          rssNumber: rssNumber,
          dateTimeLanded: moment.utc('2020-01-01').toISOString(),
          source: LandingSources.CatchRecording,
          items: [
            {
              species: 'COD',
              weight: 50,
              factor: 0.99,
              state: 'FRO',
              presentation: 'FIL'
            }
          ]
        }
      ]);
  });

  it('will group catches within the same trip that have the same date, species, state, and presentation', () => {
    mockGetToLiveWeightFactor.mockReturnValue(0.99);

    const input = {
      cfr: 'cfr',
      rssNumber: 'rss',
      vesselRegistrationNumber: 'vesselReg',
      vesselName: 'vesselName',
      fishingAuthority: 'uk',
      activities: [
        {
          tripId: 'tripId1',
          returnDate: '2020-01-01',
          returnPort: 'port',
          activityAreas: [
            {
              faoArea: 33,
              faoSubArea: 'FO',
              activityAreaCatches: [
                {
                  species: 'COD',
                  presentation: 'FIL',
                  state: 'FRO',
                  weight: 50
                }
              ]
            },
            {
              faoArea: 66,
              faoSubArea: 'FO',
              activityAreaCatches: [
                {
                  species: 'COD',
                  presentation: 'FIL',
                  state: 'FRO',
                  weight: 50
                }
              ]
            }
          ]
        }
      ],
      dateTimeStamp: '2020-01-01'
    };

    expect(Transformations.catchRecordingToLandings(input, rssNumber, mockGetToLiveWeightFactor))
      .toStrictEqual([
        {
          rssNumber: rssNumber,
          dateTimeLanded: moment.utc('2020-01-01').toISOString(),
          source: LandingSources.CatchRecording,
          items: [
            {
              species: 'COD',
              weight: 100,
              factor: 0.99,
              state: 'FRO',
              presentation: 'FIL'
            }
          ]
        }
      ]);
  });

  it('will not group catches if they are on different trips', async () => {
    mockGetToLiveWeightFactor.mockReturnValue(0.99);

    const input = {
      cfr: 'cfr',
      rssNumber: 'rss',
      vesselRegistrationNumber: 'vesselReg',
      vesselName: 'vesselName',
      fishingAuthority: 'uk',
      activities: [
        {
          tripId: 'tripId1',
          returnDate: '2020-01-01',
          returnPort: 'port',
          activityAreas: [
            {
              faoArea: 33,
              faoSubArea: 'FO',
              activityAreaCatches: [
                {
                  species: 'COD',
                  presentation: 'FIL',
                  state: 'FRO',
                  weight: 50
                }
              ]
            }
          ]
        },
        {
          tripId: 'tripId2',
          returnDate: '2020-01-01',
          returnPort: 'port',
          activityAreas: [
            {
              faoArea: 33,
              faoSubArea: 'FO',
              activityAreaCatches: [
                {
                  species: 'COD',
                  presentation: 'FIL',
                  state: 'FRO',
                  weight: 50
                }
              ]
            }
          ]
        }
      ],
      dateTimeStamp: '2020-01-01'
    };

    expect(Transformations.catchRecordingToLandings(input, rssNumber, mockGetToLiveWeightFactor))
      .toStrictEqual([
        {
          rssNumber: rssNumber,
          dateTimeLanded: moment.utc('2020-01-01').toISOString(),
          source: LandingSources.CatchRecording,
          items: [
            {
              species: 'COD',
              weight: 50,
              factor: 0.99,
              state: 'FRO',
              presentation: 'FIL'
            }
          ]
        },
        {
          rssNumber: rssNumber,
          dateTimeLanded: moment.utc('2020-01-01').toISOString(),
          source: LandingSources.CatchRecording,
          items: [
            {
              species: 'COD',
              weight: 50,
              factor: 0.99,
              state: 'FRO',
              presentation: 'FIL'
            }
          ]
        }
      ]);
  });

  it('will throw an error if the input does not pass schema validation', () => {
    const input = 'invalid';

    expect(() => Transformations.catchRecordingToLandings(input, rssNumber, mockGetToLiveWeightFactor))
      .toThrow('invalid crecord landing data');
  });

});

describe('when converting from cefas to landing', () => {

  let mockGetToLiveWeightFactor;
  const testConversionFactor = 0.5;

  beforeAll(() => {
    mockGetToLiveWeightFactor = jest.fn();
  });

  beforeEach(() => {
    mockGetToLiveWeightFactor.mockImplementation(() => testConversionFactor);
  })

  it('will thrown an exception for empty input', () => {
    expect(() => Transformations.cefasToLandings(null, mockGetToLiveWeightFactor))
      .toThrow('should be object');
  });

  it('will thrown an exception for empty object', () => {
    expect(() => Transformations.cefasToLandings({}, mockGetToLiveWeightFactor))
      .toThrow('missingProperty');
  });

  it('will return landings for valid input', () => {

    const cefas = {
      cfr: "GBR000C18064",
      rssNumber: "C18064",
      vesselRegistrationNumber: "BM1",
      vesselName: "Emulate",
      fishingAuthority: "GBE",
      landings: [
        {
          logbookNumber: "A1165920190477",
          landingDateTime: "2018-02-02T06:50:45Z",
          landingPort: "GBBRX",
          landingAreas: [
            {
              faoArea: 27,
              faoSubArea: "7",
              landingAreaCatches: [
                { species: "SCE", state: "FRE", presentation: "WHL", weight: 10 }
              ]
            }
          ]
        }
      ],
      dateTimeStamp: "2019-08-22T09:41:02.577Z"
    }

    const expected = [
      {
        rssNumber: "C18064",
        dateTimeLanded: moment.utc("2018-02-02T06:50:45").toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [{ species: "SCE", weight: 10, state: 'FRE', presentation: 'WHL', factor: 0.5 }]
      }
    ];

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor)

    expect(landings).toEqual(expected)

  });

  it('will return valid landings for generated cefas data', () => {

    const cefas = createCefas([
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T010000Z' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T010000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [{ species: "COD", weight: 0.1, state: 'STA', presentation: 'PRE', factor: 0.5 }]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected)

  })

  it('will return valid multiple landings for generated cefas data', () => {

    const cefas = createCefas([
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T020000Z' },
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T220000Z' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [{ species: "COD", weight: 0.1, state: 'STA', presentation: 'PRE', factor: 0.5 }]
      },
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T220000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [{ species: "COD", weight: 0.1, state: 'STA', presentation: 'PRE', factor: 0.5 }]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected)

  })

  it('will return valid single landing for generated cefas data from different areas', () => {

    const cefas = createCefas([
      { species: 'COD', weight: 1, area: 5, dateLanded: '20190101T020000Z' },
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z' },
      { species: 'BOB', weight: 1, area: 4, dateLanded: '20190101T020000Z' },
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [
          { species: 'COD', weight: 2, state: 'STA', presentation: 'PRE', factor: 0.5 },
          { species: 'BOB', weight: 1, state: 'STA', presentation: 'PRE', factor: 0.5 }]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected)

  });

  it('will not combine catches which are the same species but in a different state', () => {

    const cefas = createCefas([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', state: 'STA1' },
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', state: 'STA2' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [
          { species: 'COD', weight: 1, state: 'STA1', presentation: 'PRE', factor: 0.5 },
          { species: 'COD', weight: 1, state: 'STA2', presentation: 'PRE', factor: 0.5 }
        ]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected)

  });

  it('will not combine catches which are the same species but in a different presentation', () => {

    const cefas = createCefas([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE1' },
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE2' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE1', factor: 0.5 },
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE2', factor: 0.5 }
        ]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected)

  });

  it('will return a conversion factor from mongo if one if found', () => {
    mockGetToLiveWeightFactor.mockReturnValue(0.7);

    const cefas = createCefas([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE1' }
    ]);
    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE1', factor: 0.7 }
        ]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected)
  });

  it('will return a factor of 1 if no conversion factors can be found', () => {
    mockGetToLiveWeightFactor.mockReturnValue(null);

    const cefas = createCefas([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE1' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE1', factor: 1 }
        ]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected);
  });

  it('will sum decimals into something sane', () => {

    const cefas = createCefas([
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T010000' },
      { species: 'COD', weight: 0.2, area: 5, dateLanded: '20190101T010000' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T010000').toISOString(),
        source: LandingSources.LandingDeclaration,
        items: [{ species: "COD", weight: 0.3, state: 'STA', presentation: 'PRE', factor: 0.5 }]
      }
    ]

    const landings = Transformations.cefasToLandings(cefas, mockGetToLiveWeightFactor);

    expect(landings).toEqual(expected)

  })

})

describe('when converting from eLog to landing', () => {

  let mockGetToLiveWeightFactor;
  const testConversionFactor = undefined;

  beforeAll(() => {
    mockGetToLiveWeightFactor = jest.fn();
  });

  beforeEach(() => {
    mockGetToLiveWeightFactor.mockReturnValue(testConversionFactor);
  });

  it('will thrown an exception for empty input', () => {
    expect(() => Transformations.eLogToLandings(null))
      .toThrow('should be object');
  });

  it('will thrown an exception for empty object', () => {
    expect(() => Transformations.eLogToLandings({}))
      .toThrow('missingProperty');
  });

  it('will return landings for valid input', () => {
    const eLog = {
      cfr: "NLD200202641",
      rssNumber: "C20514",
      vesselRegistrationNumber: "H1100",
      vesselName: "Wiron 5",
      fishingAuthority: "GBE",
      activities: [
        {
          returnDate: "2018-02-03T13:30:00",
          returnPort: "NLSCE",
          logbookNumber: "C2051420180053",
          activityAreas: [
            {
              faoArea: 27,
              faoSubArea: "4",
              activityAreaCatches: [
                {
                  species: "HER",
                  presentation: "WHL",
                  state: "FRE",
                  weight: 124406
                }
              ]
            },
            {
              faoArea: 27,
              faoSubArea: "7",
              activityAreaCatches: [
                {
                  species: "BRB",
                  presentation: "WHL",
                  state: "FRE",
                  weight: 10007
                },
                {
                  species: "COD",
                  presentation: "WHL",
                  state: "FRE",
                  weight: 173
                }
              ]
            }
          ]
        }
      ],
      dateTimeStamp: "2019-08-14T12:14:24.793"
    };

    const expected = [
      {
        rssNumber: "C20514",
        dateTimeLanded: moment.utc("2018-02-03T13:30:00").toISOString(),
        source: LandingSources.ELog,
        items: [{ species: "HER", presentation: "WHL", state: "FRE", weight: 124406, factor: 1 },
        { species: "BRB", presentation: "WHL", state: "FRE", weight: 10007, factor: 1 },
        { species: "COD", presentation: "WHL", state: "FRE", weight: 173, factor: 1 }]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });

  it('will return valid landings for generated eLog data', () => {
    const eLog = createELog([
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T010000Z' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T010000').toISOString(),
        source: LandingSources.ELog,
        items: [{ species: "COD", weight: 0.1, state: 'STA', presentation: 'PRE', factor: 1 }]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });

  it('will return valid multiple landings for generated eLog data', () => {
    const eLog = createELog([
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T020000Z' },
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T220000Z' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.ELog,
        items: [{ species: "COD", weight: 0.1, state: 'STA', presentation: 'PRE', factor: 1 }]
      },
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T220000').toISOString(),
        source: LandingSources.ELog,
        items: [{ species: "COD", weight: 0.1, state: 'STA', presentation: 'PRE', factor: 1 }]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected)
  });

  it('will return valid single landing for generated eLog data from different areas', () => {
    const eLog = createELog([
      { species: 'COD', weight: 1, area: 5, dateLanded: '20190101T020000Z' },
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z' },
      { species: 'BOB', weight: 1, area: 4, dateLanded: '20190101T020000Z' },
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.ELog,
        items: [
          { species: 'COD', weight: 2, state: 'STA', presentation: 'PRE', factor: 1 },
          { species: 'BOB', weight: 1, state: 'STA', presentation: 'PRE', factor: 1 }]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });

  it('will not combine catches which are the same species but in a different state', () => {
    const eLog = createELog([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', state: 'STA1' },
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', state: 'STA2' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.ELog,
        items: [
          { species: 'COD', weight: 1, state: 'STA1', presentation: 'PRE', factor: 1 },
          { species: 'COD', weight: 1, state: 'STA2', presentation: 'PRE', factor: 1 }
        ]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });

  it('will not combine catches which are the same species but in a different presentation', () => {
    const eLog = createELog([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE1' },
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE2' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.ELog,
        items: [
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE1', factor: 1 },
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE2', factor: 1 }
        ]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });

  it('will return a conversion factor from mongo if one is found', () => {
    mockGetToLiveWeightFactor.mockReturnValue(0.7);

    const eLog = createELog([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE1' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.ELog,
        items: [
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE1', factor: 1 }
        ]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });

  it('will return a factor of 1 if no conversion factors can be found', () => {
    mockGetToLiveWeightFactor.mockReturnValue(null);

    const eLog = createELog([
      { species: 'COD', weight: 1, area: 4, dateLanded: '20190101T020000Z', presentation: 'PRE1' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T020000').toISOString(),
        source: LandingSources.ELog,
        items: [
          { species: 'COD', weight: 1, state: 'STA', presentation: 'PRE1', factor: 1 }
        ]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });

  it('will sum decimals into something sane', () => {
    const eLog = createELog([
      { species: 'COD', weight: 0.1, area: 5, dateLanded: '20190101T010000' },
      { species: 'COD', weight: 0.2, area: 5, dateLanded: '20190101T010000' }
    ]);

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc('20190101T010000').toISOString(),
        source: LandingSources.ELog,
        items: [{ species: "COD", weight: 0.3, state: 'STA', presentation: 'PRE', factor: 1 }]
      }
    ];

    const landings = Transformations.eLogToLandings(eLog);

    expect(landings).toEqual(expected);
  });
});

describe('when getting a set of referenced landings from catch certificates', () => {

  it('can find the unique set', () => {

    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100 }
              ]
            },
            {
              speciesCode: "BOB",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-11", weight: 100 }
              ]
            }
          ]
        }
      },
      {
        documentNumber: "CC2",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-12", weight: 100 }
              ]
            },
            {
              speciesCode: "BOB",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-12", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-12", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-13", weight: 100 }
              ]
            }
          ]
        }
      }
    ]

    const vessels = [
      {
        registrationNumber: 'WA1',
        fishingLicenceValidFrom: '2006-06-07',
        fishingLicenceValidTo: '2100-06-30',
        adminPort: 'Airstrip One',
        rssNumber: 'RS1',
      },
      {
        registrationNumber: 'WA2',
        fishingLicenceValidFrom: '2006-06-07',
        fishingLicenceValidTo: '2100-06-30',
        adminPort: 'Airstrip One',
        rssNumber: 'RS2',
      }
    ]

    const expected = [
      { dateLanded: '2019-07-10', pln: 'WA1', rssNumber: 'RS1' },
      { dateLanded: '2019-07-10', pln: 'WA2', rssNumber: 'RS2' },
      { dateLanded: '2019-07-11', pln: 'WA2', rssNumber: 'RS2' },
      { dateLanded: '2019-07-12', pln: 'WA1', rssNumber: 'RS1' },
      { dateLanded: '2019-07-12', pln: 'WA2', rssNumber: 'RS2' },
      { dateLanded: '2019-07-13', pln: 'WA2', rssNumber: 'RS2' },
    ]

    const vesselsIdx = generateIndex(vessels);

    const licenceLookup = Transformations.vesselLookup(vesselsIdx)

    const res = Array.from(Transformations.getLandingsFromCatchCerts(catchCerts, licenceLookup))

    expect(res).toEqual(expected)

  })

  it('will return an undefined rssNumber', () => {

    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 }
              ]
            }
          ]
        }
      }
    ]

    const vessels = []

    const expected = [
      { dateLanded: '2019-07-10', pln: 'WA1', rssNumber: undefined }
    ]

    const vesselsIdx = generateIndex(vessels);

    const licenceLookup = Transformations.vesselLookup(vesselsIdx)

    const res = Array.from(Transformations.getLandingsFromCatchCerts(catchCerts, licenceLookup))

    expect(res).toEqual(expected)

  })
});

describe('licence map', () => {

  it('will return undefined if no licences are found', () => {

    const vessels = []

    const vesselsIdx = generateIndex(vessels);
    const lookup = Transformations.vesselLookup(vesselsIdx);

    expect(lookup('K529', '2006-06-08')).toBeUndefined();

  })

  it('will fallback to England as DA', () => {

    const vessels = [
      {
        registrationNumber: 'K529',
        fishingLicenceValidFrom: '2006-06-07T00:00:00',
        fishingLicenceValidTo: '2006-06-30T00:00:00',
        adminPort: 'Airstrip One',
        rssNumber: 'A12032',
      }
    ]

    const vesselsIdx = generateIndex(vessels);
    const lookup = Transformations.vesselLookup(vesselsIdx);

    expect(lookup('K529', '2006-06-08').da).toBe('England')

  })

  it('will fail on when licence is missing', () => {

    const vessels = [
      {
        registrationNumber: 'K529',
        fishingLicenceValidFrom: '2006-06-07T00:00:00',
        fishingLicenceValidTo: '2006-06-30T00:00:00',
        adminPort: 'Airstrip One',
        rssNumber: 'A12032',
      }
    ]

    const vesselsIdx = generateIndex(vessels);
    const lookup = Transformations.vesselLookup(vesselsIdx);

    expect(lookup('K529', '2001-01-01')).toBe(undefined)

  })

  it('will find a valid licence and licence holder', () => {

    const vessels = [
      {
        registrationNumber: 'K529',
        fishingLicenceValidFrom: '2006-06-07T00:00:00',
        fishingLicenceValidTo: '2006-06-30T00:00:00',
        fishingLicenceNumber: '30117',
        adminPort: 'GUERNSEY',
        rssNumber: 'A12032',
        homePort: 'WESTRAY',
        flag: 'GBR',
        imo: null,
        licenceHolderName: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      }
    ]

    const vesselsIdx = generateIndex(vessels);
    const lookup = Transformations.vesselLookup(vesselsIdx);

    expect(lookup('K529', '2006-06-07'))
      .toStrictEqual({
        da: 'Guernsey',
        flag: 'GBR',
        homePort: 'WESTRAY',
        imoNumber: null,
        licenceNumber: '30117',
        licenceValidTo: '2006-06-30',
        rssNumber: 'A12032',
        licenceHolder: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      })
  })

  it('lower boundary (inclusive) check', () => {

    const vessels = [
      {
        registrationNumber: 'K529',
        fishingLicenceValidFrom: '2006-06-07T00:00:00',
        fishingLicenceValidTo: '2006-06-30T00:00:00',
        fishingLicenceNumber: '30117',
        adminPort: 'GUERNSEY',
        rssNumber: 'A12032',
        homePort: 'WESTRAY',
        flag: 'GBR',
        imo: null,
        licenceHolderName: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      }
    ]

    const vesselsIdx = generateIndex(vessels);
    const lookup = Transformations.vesselLookup(vesselsIdx);

    expect(lookup('K529', '2006-06-06')).toBe(undefined)

    expect(lookup('K529', '2006-06-07'))
      .toStrictEqual({
        da: 'Guernsey',
        flag: 'GBR',
        homePort: 'WESTRAY',
        imoNumber: null,
        licenceNumber: '30117',
        licenceValidTo: '2006-06-30',
        rssNumber: 'A12032',
        licenceHolder: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      })

  })

  it('upper boundery (inclusive) check', () => {

    const vessels = [
      {
        registrationNumber: 'K529',
        fishingLicenceValidFrom: '2006-06-07T00:00:00',
        fishingLicenceValidTo: '2006-06-30T00:00:00',
        fishingLicenceNumber: '30117',
        adminPort: 'GUERNSEY',
        rssNumber: 'A12032',
        homePort: 'WESTRAY',
        flag: 'GBR',
        imo: null,
        licenceHolderName: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      }
    ]

    const vesselsIdx = generateIndex(vessels);
    const lookup = Transformations.vesselLookup(vesselsIdx);

    expect(lookup('K529', '2006-06-29'))
      .toStrictEqual({
        da: 'Guernsey',
        flag: 'GBR',
        homePort: 'WESTRAY',
        imoNumber: null,
        licenceNumber: '30117',
        licenceValidTo: '2006-06-30',
        rssNumber: 'A12032',
        licenceHolder: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      })

    expect(lookup('K529', '2006-06-30'))
      .toStrictEqual({
        da: 'Guernsey',
        flag: 'GBR',
        homePort: 'WESTRAY',
        imoNumber: null,
        licenceNumber: '30117',
        licenceValidTo: '2006-06-30',
        rssNumber: 'A12032',
        licenceHolder: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      })

    expect(lookup('K529', '2006-06-30'))
      .toStrictEqual({
        da: 'Guernsey',
        flag: 'GBR',
        homePort: 'WESTRAY',
        imoNumber: null,
        licenceNumber: '30117',
        licenceValidTo: '2006-06-30',
        rssNumber: 'A12032',
        licenceHolder: 'I am the Licence Holder name for this fishing boat',
        vesselLength: 9.4
      })

    expect(lookup('K529', '2006-07-01')).toBe(undefined)

  })

});

describe('aggregate landings on date', () => {

  describe('when generating a breakdown of the overall species weight', () => {
    it('will show the presentation and state', () => {
      const landings: ILanding[] = [
        {
          rssNumber: 'rssNumber',
          dateTimeLanded: '20190101T010000Z',
          dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: "COD", presentation: "RAL", state: "JOL", weight: 10, factor: 1 }
          ]
        },
        {
          rssNumber: 'rssNumber',
          dateTimeLanded: '20190101T233000Z',
          dateTimeRetrieved: '2019-01-02T14:14:14.000Z',
          source: LandingSources.CatchRecording,
          items: [
            { species: "COD", presentation: "WHL", state: "FRE", weight: 10, factor: 1 }
          ]
        }
      ]

      const expected: ILandingAggregatedItemBreakdown[] = [
        { presentation: "RAL", state: "JOL", isEstimate: false, factor: 1, weight: 10, liveWeight: 10, source: LandingSources.LandingDeclaration },
        { presentation: "WHL", state: "FRE", isEstimate: true, factor: 1, weight: 10, liveWeight: 10, source: LandingSources.CatchRecording }
      ]

      const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

      expect(aggregates[0].items[0].breakdown).toEqual(expected)
    });

    it('will show the weight for the individual landing', () => {
      const landings: ILanding[] = [
        {
          rssNumber: 'rssNumber',
          dateTimeLanded: '20190101T010000Z',
          dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
          source: LandingSources.ELog,
          items: [
            { species: "COD", presentation: "WHL", state: "FRE", weight: 10, factor: 1 }
          ]
        },
        {
          rssNumber: 'rssNumber',
          dateTimeLanded: '20190101T233000Z',
          dateTimeRetrieved: '2019-01-02T14:14:14.000Z',
          source: LandingSources.ELog,
          items: [
            { species: "COD", presentation: "WHL", state: "FRE", weight: 20, factor: 1 }
          ]
        }
      ]

      const expected: ILandingAggregatedItemBreakdown[] = [{ presentation: "WHL", state: "FRE", isEstimate: true, factor: 1, weight: 10, liveWeight: 10, source: LandingSources.ELog },
      { presentation: "WHL", state: "FRE", isEstimate: true, factor: 1, weight: 20, liveWeight: 20, source: LandingSources.ELog }]

      const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

      expect(aggregates[0].items[0].breakdown).toEqual(expected)
    });

    it('will show the factor', () => {
      const landings: ILanding[] = [
        {
          rssNumber: 'rssNumber',
          dateTimeLanded: '20190101T010000Z',
          dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: "COD", presentation: "RAL", state: "JOL", weight: 10, factor: 50 }
          ]
        },
        {
          rssNumber: 'rssNumber',
          dateTimeLanded: '20190101T233000Z',
          dateTimeRetrieved: '2019-01-02T14:14:14.000Z',
          source: LandingSources.LandingDeclaration,
          items: [
            { species: "COD", presentation: "GEL", state: "ROL", weight: 10, factor: 80 }
          ]
        }
      ]

      const expected: ILandingAggregatedItemBreakdown[] = [{ presentation: "RAL", state: "JOL", isEstimate: false, factor: 50, weight: 10, liveWeight: 500, source: LandingSources.LandingDeclaration },
      { presentation: "GEL", state: "ROL", isEstimate: false, factor: 80, weight: 10, liveWeight: 800, source: LandingSources.LandingDeclaration }]

      const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

      expect(aggregates[0].items[0].breakdown).toEqual(expected)
    });

    it('if landing source is a Landing Declaration, it will not be an estimate', () => {
      const landings: ILanding[] = [{
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190101T010000Z',
        dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
        source: LandingSources.LandingDeclaration,
        items: [
          { species: "COD", presentation: "RAL", state: "JOL", weight: 10, factor: 2 }
        ]
      }
      ]

      const expected: ILandingAggregatedItemBreakdown[] = [{
        presentation: "RAL", state: "JOL",
        isEstimate: false, factor: 2, weight: 10, liveWeight: 20, source: LandingSources.LandingDeclaration
      }]

      const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

      expect(aggregates[0].items[0].breakdown).toEqual(expected)
    });

    it('will show the source when available', () => {
      const landings: ILanding[] = [{
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190101T010000Z',
        dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
        source: LandingSources.LandingDeclaration,
        items: [
          { species: "COD", presentation: "RAL", state: "JOL", weight: 10, factor: 1 },
          { species: "COD", presentation: "RAL", state: "JOL", weight: 10, factor: 2 },
          { species: "COD", presentation: "RAL", state: "JOL", weight: 10, factor: 3 }
        ]
      }
      ]

      const expected: ILandingAggregatedItemBreakdown[] = [
        { presentation: "RAL", state: "JOL", isEstimate: false, factor: 1, weight: 10, liveWeight: 10, source: LandingSources.LandingDeclaration },
        { presentation: "RAL", state: "JOL", isEstimate: false, factor: 2, weight: 10, liveWeight: 20, source: LandingSources.LandingDeclaration },
        { presentation: "RAL", state: "JOL", isEstimate: false, factor: 3, weight: 10, liveWeight: 30, source: LandingSources.LandingDeclaration }]

      const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

      expect(aggregates[0].items[0].breakdown).toEqual(expected)
    });

    it('if landing source is not Landing Declaration, it will be an estimate', () => {
      const landings: ILanding[] = [{
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190101T010000Z',
        dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
        source: LandingSources.CatchRecording,
        items: [
          { species: "COD", presentation: "WHL", state: "FRE", weight: 10, factor: 1 }
        ]
      }
      ]

      const expected: ILandingAggregatedItemBreakdown[] = [{ presentation: "WHL", state: "FRE", isEstimate: true, factor: 1, weight: 10, liveWeight: 10, source: LandingSources.CatchRecording }]

      const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

      expect(aggregates[0].items[0].breakdown).toEqual(expected)
    });

    it('will calculate the live landing weight', () => {
      const landings: ILanding[] = [{
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190101T010000Z',
        dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
        source: LandingSources.LandingDeclaration,
        items: [
          { species: "COD", presentation: "RAL", state: "JOL", weight: 10, factor: 2 },
          { species: "COD", presentation: "RAL", state: "JOL", weight: 50, factor: 1 }
        ]
      }
      ]

      const expected: ILandingAggregatedItemBreakdown[] = [
        { presentation: "RAL", state: "JOL", isEstimate: false, factor: 2, weight: 10, liveWeight: 20, source: LandingSources.LandingDeclaration },
        { presentation: "RAL", state: "JOL", isEstimate: false, factor: 1, weight: 50, liveWeight: 50, source: LandingSources.LandingDeclaration }]

      const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

      expect(aggregates[0].items[0].breakdown).toEqual(expected)

    });
  });

  it('aggregates landings on date from single date and single rssnumber', () => {

    const landings: ILanding[] = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190101T010000Z',
        dateTimeRetrieved: '2019-01-01T15:15:15.000Z',
        source: LandingSources.ELog,
        items: [
          { species: "COD", weight: 10, factor: 1 }
        ]
      },
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190101T233000Z',
        dateTimeRetrieved: '2019-01-02T14:14:14.000Z',
        source: LandingSources.CatchRecording,
        items: [
          { species: "COD", weight: 10, factor: 1 }
        ]
      }
    ]

    const expected: ILandingAggregated[] = [
      {
        rssNumber: 'rssNumber',
        dateLanded: '2019-01-01',
        numberOfLandings: 2,
        firstDateTimeRetrieved: '2019-01-01T15:15:15.000Z',
        lastDateTimeRetrieved: '2019-01-02T14:14:14.000Z',
        items: [
          {
            species: "COD", weight: 20, breakdown: [{
              factor: 1,
              isEstimate: true,
              liveWeight: 10,
              source: LandingSources.ELog,
              weight: 10
            }, {
              factor: 1,
              isEstimate: true,
              liveWeight: 10,
              source: LandingSources.CatchRecording,
              weight: 10
            }]
          }
        ]
      },
    ]

    const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

    expect(aggregates).toEqual(expected)

  })

  it('aggregates landings on date from single date and single rssnumber muliple species', () => {

    const landings: ILanding[] = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190701T010000Z',
        source: LandingSources.ELog,
        items: [
          { species: "COD", weight: 22, factor: 1 }
        ]
      },
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190701T220000Z',
        source: LandingSources.CatchRecording,
        items: [
          { species: "COD", weight: 9, factor: 1 },
          { species: "BOB", weight: 99, factor: 1 }
        ]
      }
    ]

    const expectedItems: ILandingAggregatedItem[] = [
      {
        species: "COD", weight: 31, breakdown: [{
          factor: 1,
          source: LandingSources.ELog,
          liveWeight: 22,
          weight: 22,
          isEstimate: true
        }, {
          factor: 1,
          source: LandingSources.CatchRecording,
          liveWeight: 9,
          weight: 9,
          isEstimate: true
        }]
      },
      {
        species: "BOB", weight: 99, breakdown: [{
          factor: 1,
          source: LandingSources.CatchRecording,
          liveWeight: 99,
          weight: 99,
          isEstimate: true
        }]
      }
    ]

    const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

    expect(aggregates.length).toBe(1)
    const aggregated = aggregates[0]
    expect(aggregated.rssNumber).toBe('rssNumber')
    expect(aggregated.dateLanded).toBe('2019-07-01')

    expect(_.sortBy(aggregated.items, 'species'))
      .toEqual(_.sortBy(expectedItems, 'species'))

  })

  it('aggregates landings on date. multiple dates and vessels', () => {

    const landings = [
      {
        rssNumber: 'number 1',
        dateTimeLanded: '20190101T010000',
        dateTimeRetrieved: '20190101T010000Z',
        items: [{ species: 'COD', weight: 50 }, { species: 'POD', weight: 10 }]
      },
      {
        rssNumber: 'number 1',
        dateTimeLanded: '20190101T220000',
        dateTimeRetrieved: '20190101T230000Z',
        items: [{ species: 'COD', weight: 10 }, { species: 'XOD', weight: 20 }]
      },
      {
        rssNumber: 'number 2',
        dateTimeLanded: '20190101T020000',
        dateTimeRetrieved: '20190101T030000Z',
        items: [{ species: 'ZOD', weight: 40 }]
      },
      {
        rssNumber: 'number 1',
        dateTimeLanded: '20190102T010000',
        dateTimeRetrieved: '20190102T020000Z',
        items: [{ species: 'COD', weight: 30 }]
      },
      {
        rssNumber: 'number 2',
        dateTimeLanded: '20190102T020000',
        dateTimeRetrieved: '20190102T030000Z',
        items: [{ species: 'COD', weight: 30 }]
      },
      {
        rssNumber: 'number 2',
        dateTimeLanded: '20190102T230000',
        dateTimeRetrieved: '20190102T235900Z',
        items: [{ species: 'COD', weight: 60 }]
      }
    ]

    const expected = [
      {
        rssNumber: 'number 1',
        dateLanded: '2019-01-01',
        numberOfLandings: 2,
        firstDateTimeRetrieved: '2019-01-01T01:00:00.000Z',
        lastDateTimeRetrieved: '2019-01-01T23:00:00.000Z',
        items: [
          {
            species: 'COD', weight: 60, breakdown: [{
              factor: 1,
              isEstimate: true,
              liveWeight: 50,
              weight: 50
            }, {
              factor: 1,
              isEstimate: true,
              liveWeight: 10,
              weight: 10
            }]
          },
          {
            species: 'POD', weight: 10, breakdown: [{
              factor: 1,
              isEstimate: true,
              liveWeight: 10,
              weight: 10
            }]
          },
          {
            species: 'XOD', weight: 20, breakdown: [{
              factor: 1,
              isEstimate: true,
              liveWeight: 20,
              weight: 20
            }]
          }]
      },
      {
        rssNumber: 'number 2',
        dateLanded: '2019-01-01',
        numberOfLandings: 1,
        firstDateTimeRetrieved: '2019-01-01T03:00:00.000Z',
        lastDateTimeRetrieved: '2019-01-01T03:00:00.000Z',
        items: [
          {
            species: 'ZOD', weight: 40, breakdown: [{
              factor: 1,
              isEstimate: true,
              liveWeight: 40,
              weight: 40
            }]
          }]
      },
      {
        rssNumber: 'number 1',
        dateLanded: '2019-01-02',
        numberOfLandings: 1,
        firstDateTimeRetrieved: '2019-01-02T02:00:00.000Z',
        lastDateTimeRetrieved: '2019-01-02T02:00:00.000Z',
        items: [
          {
            species: 'COD', weight: 30, breakdown: [{
              factor: 1,
              isEstimate: true,
              liveWeight: 30,
              weight: 30
            }]
          }]
      },
      {
        rssNumber: 'number 2',
        dateLanded: '2019-01-02',
        numberOfLandings: 2,
        firstDateTimeRetrieved: '2019-01-02T03:00:00.000Z',
        lastDateTimeRetrieved: '2019-01-02T23:59:00.000Z',
        items: [
          {
            species: 'COD', weight: 90, breakdown: [{
              factor: 1,
              isEstimate: true,
              liveWeight: 30,
              weight: 30
            }, {
              factor: 1,
              isEstimate: true,
              liveWeight: 60,
              weight: 60
            }]
          }]
      }
    ]

    const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

    expect(aggregates.length).toBe(4)

    expect(_.sortBy(aggregates, ['rssNumber', 'dateLanded']))
      .toEqual(_.sortBy(expected, ['rssNumber', 'dateLanded']))

  })

  it('does not aggregate the dateLanded w.r.t. daylight savings', () => {
    const landings = [
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190630T120000Z',
        dateTimeRetrieved: '20190702T120000Z',
        items: [{ species: 'COX', weight: 1 }]
      },
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190630T233000Z',
        dateTimeRetrieved: '20190702T120000Z',
        items: [{ species: 'SAL', weight: 1 }]
      },
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190701T120000Z',
        dateTimeRetrieved: '20190702T120000Z',
        items: [{ species: 'SAL', weight: 1 }]
      },
      {
        rssNumber: 'rssNumber',
        dateTimeLanded: '20190701T233000Z',
        dateTimeRetrieved: '20190702T120000Z',
        items: [{ species: 'POS', weight: 1 }]
      },
    ]

    const expected = [
      {
        rssNumber: 'rssNumber',
        dateLanded: '2019-06-30',
        numberOfLandings: 2,
        firstDateTimeRetrieved: '2019-07-02T12:00:00.000Z',
        lastDateTimeRetrieved: '2019-07-02T12:00:00.000Z',
        items: [{
          species: 'COX', weight: 1, breakdown: [{
            factor: 1,
            isEstimate: true,
            liveWeight: 1,
            weight: 1
          }]
        }, {
          species: 'SAL', weight: 1, breakdown: [{
            factor: 1,
            isEstimate: true,
            liveWeight: 1,
            weight: 1
          }]
        }]
      },
      {
        rssNumber: 'rssNumber',
        dateLanded: '2019-07-01',
        numberOfLandings: 2,
        firstDateTimeRetrieved: '2019-07-02T12:00:00.000Z',
        lastDateTimeRetrieved: '2019-07-02T12:00:00.000Z',
        items: [{
          species: 'POS', weight: 1, breakdown: [{
            factor: 1,
            isEstimate: true,
            liveWeight: 1,
            weight: 1
          }]
        }, {
          species: 'SAL', weight: 1, breakdown: [{
            factor: 1,
            isEstimate: true,
            liveWeight: 1,
            weight: 1
          }]
        }]
      }
    ]

    const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)

    expect(_.sortBy(aggregates, ['rssNumber', 'dateLanded']))
      .toEqual(_.sortBy(expected, ['rssNumber', 'dateLanded']))
  })

  it('does something sane with decimals', () => {

    const landings = [
      {
        rssNumber: 'number 1',
        dateTimeLanded: '20190701T010000Z',
        items: [
          { species: 'COD', weight: 0.12 },
        ]
      },
      {
        rssNumber: 'number 1',
        dateTimeLanded: '20190701T220000Z',
        items: [
          { species: 'COD', weight: 0.931 },
        ]
      }
    ]

    const aggregates: ILandingAggregated[] = Transformations.aggregateOnLandingDate(landings)
    expect(aggregates.length).toBe(1)
    const aggregate = aggregates[0]
    expect(aggregate.items.length).toBe(1)
    const item = aggregate.items[0]

    expect(item.weight).toBe(1.051)

  })

});

describe('about unwindCatchCerts', () => {

  it('can unwind catch certificates', () => {

    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100 }
              ]
            }
          ]
        }
      }
    ]

    const expected = [
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', pln: 'WA1', date: '2019-07-10', weight: 100, factor: 1 },
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', pln: 'WA2', date: '2019-07-10', weight: 100, factor: 1 }
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts))
      .map((item: any) => {
        delete item.extended;
        return item
      })

    expect(unwound).toEqual(expected)

  })

  it('will include the factor to be applied on the weight', () => {

    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              factor: 1,
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100 }
              ]
            }
          ]
        }
      }
    ]

    const expected = [
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', factor: 1, pln: 'WA1', date: '2019-07-10', weight: 100 },
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', factor: 1, pln: 'WA2', date: '2019-07-10', weight: 100 }
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts))
      .map((item: any) => {
        delete item.extended;
        return item
      })

    expect(unwound).toEqual(expected)

  })

  it('will set a default factor of 1 if there is no factor', () => {

    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100 }
              ]
            }
          ]
        }
      }
    ]

    const expected = [
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', factor: 1, pln: 'WA1', date: '2019-07-10', weight: 100 },
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', factor: 1, pln: 'WA2', date: '2019-07-10', weight: 100 }
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts))
      .map((item: any) => {
        delete item.extended;
        return item
      })

    expect(unwound).toEqual(expected)

  })

  it('can unwind more catch certificates', () => {

    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
              ]
            },
            {
              speciesCode: "COD",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 500 },
              ]
            },
          ],
        },
      },
      {
        documentNumber: "CC2",
        createdAt: "2019-07-10T08:26:06.999Z",
        exportData: {
          products: [
            {
              speciesCode: "LBE",
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 300 }]
            }],
        },
      },
    ]


    const expected = [
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', pln: 'WA1', date: '2019-07-10', weight: 100, factor: 1 },
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', pln: 'WA1', date: '2019-07-11', weight: 100, factor: 1 },
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'COD', pln: 'WA1', date: '2019-07-10', weight: 500, factor: 1 },
      { documentNumber: 'CC2', createdAt: '2019-07-10T08:26:06.999Z', speciesCode: 'LBE', pln: 'WA1', date: '2019-07-10', weight: 300, factor: 1 },
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts))
      .map((item: any) => {
        delete item.extended;
        return item
      })

    expect(unwound).toEqual(expected)

  })

  it('can unwind catch certificates with extended data', () => {

    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              species: "Lobster",
              speciesCode: "LBE",
              commodityCode: "4321",
              commodityCodeDescription: "some commodity code description",
              scientificName: "some scientific name",
              state: { code: "Nice" },
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, numberOfSubmissions: 1, id: "CC1-CC-1", _status: "PENDING_LANDING_DATA", vesselOverriddenByAdmin: true, licenceHolder: "A" },
              ]
            },
            {
              species: "Bobster",
              speciesCode: "BOB",
              commodityCode: "4321",
              commodityCodeDescription: "some commodity code description 2",
              scientificName: "some scientific name 2",
              state: { code: "Nice" },
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA2", date: "2019-07-10", weight: 100, numberOfSubmissions: 2, id: "CC1-CC-2", _status: "HAS_LANDING_DATA", licenceHolder: "B" }
              ]
            }
          ],
          exporterDetails: { exporterFullName: 'Mr Bob' }
        },
        status: 'COMPLETE',
        audit: [
          { "eventType": AuditEventTypes.Voided, "triggeredBy": "Jim", "timestamp": new Date(), "data": null },
          { "eventType": AuditEventTypes.Voided, "triggeredBy": "Bob", "timestamp": new Date(), "data": null },
          { "eventType": AuditEventTypes.PreApproved, "triggeredBy": "Bobby", "timestamp": new Date(), "data": null }
        ],
        investigation: {
          investigator: 'Mr Fred',
          status: InvestigationStatus.MinorVerbal
        }
      }
    ]

    const expected = [
      {
        documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z',
        speciesCode: 'LBE', pln: 'WA1', date: '2019-07-10', weight: 100, factor: 1,
        status: "COMPLETE",
        extended: {
          exporterName: 'Mr Bob',
          vessel: 'DAYBREAK',
          pln: 'WA1',
          species: 'Lobster',
          state: 'Nice',
          commodityCode: '4321',
          commodityCodeDescription: "some commodity code description",
          scientificName: "some scientific name",
          landingId: 'CC1-CC-1',
          landingStatus: 'PENDING_LANDING_DATA',
          investigation: {
            investigator: 'Mr Fred',
            status: InvestigationStatus.MinorVerbal
          },
          voidedBy: 'Bob',
          preApprovedBy: 'Bobby',
          numberOfSubmissions: 1,
          vesselOverriddenByAdmin: true,
          licenceHolder: 'A',
          speciesOverriddenByAdmin: false
        }
      },
      {
        documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z',
        speciesCode: 'BOB', pln: 'WA2', date: '2019-07-10', weight: 100, factor: 1,
        status: "COMPLETE",
        extended: {
          exporterName: 'Mr Bob',
          vessel: 'DAYBREAK',
          pln: 'WA2',
          species: 'Bobster',
          state: 'Nice',
          commodityCode: '4321',
          commodityCodeDescription: "some commodity code description 2",
          scientificName: "some scientific name 2",
          landingId: 'CC1-CC-2',
          landingStatus: 'HAS_LANDING_DATA',
          investigation: {
            investigator: 'Mr Fred',
            status: InvestigationStatus.MinorVerbal
          },
          voidedBy: 'Bob',
          preApprovedBy: 'Bobby',
          numberOfSubmissions: 2,
          licenceHolder: 'B',
          speciesOverriddenByAdmin: false
        }
      },
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts))

    expect(unwound).toEqual(expected)

  });

  it('will set extended.vesselOverriddenByAdmin to true if it is true on the landing', () => {
    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              species: "Lobster",
              speciesCode: "LBE",
              commodityCode: "1234",
              state: { code: "Nice" },
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, numberOfSubmissions: 1, id: "CC1-CC-1", _status: "PENDING_LANDING_DATA", vesselOverriddenByAdmin: true },
              ]
            }
          ],
          exporterDetails: { exporterFullName: 'Mr Bob' }
        },
        status: 'COMPLETE',
        audit: []
      }
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts))
    const landing: any = unwound[0];

    expect(landing.extended.vesselOverriddenByAdmin).toEqual(true);
  });

  it('will set extended.vesselOverriddenByAdmin to undefined if it is not defined in the landing', () => {
    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              species: "Lobster",
              speciesCode: "LBE",
              commodityCode: "1234",
              state: { code: "Nice" },
              caughtBy: [
                { vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, numberOfSubmissions: 1, id: "CC1-CC-1", _status: "PENDING_LANDING_DATA" },
              ]
            }
          ],
          exporterDetails: { exporterFullName: 'Mr Bob' }
        },
        status: 'COMPLETE',
        audit: []
      }
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts))
    const landing: any = unwound[0];

    expect(landing.extended.vesselOverriddenByAdmin).toBeUndefined();
  });

  it('can unwind catch certifcate data with cfr and flag', () => {
    const catchCerts = [
      {
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        exportData: {
          products: [
            {
              species: "Lobster",
              speciesCode: "LBE",
              commodityCode: "1234",
              state: { code: "Nice" },
              caughtBy: [
                {
                  vessel: "DAYBREAK",
                  pln: "WA1",
                  date: "2019-07-10",
                  weight: 100,
                  numberOfSubmissions: 1,
                  id: "CC1-CC-1",
                  _status: "PENDING_LANDING_DATA",
                  flag: "GBR",
                  cfr: "GBRC17737"
                },
              ]
            }
          ],
          exporterDetails: { exporterFullName: 'Mr Bob' }
        },
        status: 'COMPLETE',
        audit: [],
        investigation: {}
      }
    ];

    const expected = [
      {
        documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z',
        speciesCode: 'LBE', pln: 'WA1', date: '2019-07-10', weight: 100, factor: 1,
        status: "COMPLETE",
        extended: {
          exporterName: 'Mr Bob',
          vessel: 'DAYBREAK',
          pln: 'WA1',
          species: 'Lobster',
          state: 'Nice',
          commodityCode: '1234',
          landingId: 'CC1-CC-1',
          landingStatus: 'PENDING_LANDING_DATA',
          investigation: {},
          numberOfSubmissions: 1,
          flag: 'GBR',
          cfr: 'GBRC17737',
          speciesOverriddenByAdmin: false
        }
      }
    ]

    const unwound = Array.from(Transformations.unwindCatchCerts(catchCerts));

    expect(unwound).toEqual(expected)
  });

});

describe('on groupCatchCertsByLanding', () => {

  it('can group by rssNumber and dateLanded', () => {
    const unwoundCatchCerts = [
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', rssNumber: 'WA1', dateLanded: '2019-07-10', species: 'LBE', weight: 100 },
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', rssNumber: 'WA1', dateLanded: '2019-07-11', species: 'LBE', weight: 100 },
      { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', rssNumber: 'WA1', dateLanded: '2019-07-10', species: 'COD', weight: 500 },
      { documentNumber: 'CC2', createdAt: '2019-07-10T08:26:06.999Z', rssNumber: 'WA0', dateLanded: '2019-07-10', species: 'LBE', weight: 300 },
    ]

    const expected = [
      ['WA02019-07-10',
        [
          { documentNumber: 'CC2', createdAt: '2019-07-10T08:26:06.999Z', rssNumber: 'WA0', dateLanded: '2019-07-10', species: 'LBE', weight: 300 },
        ]
      ],
      ['WA12019-07-10',
        [
          { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', rssNumber: 'WA1', dateLanded: '2019-07-10', species: 'LBE', weight: 100 },
          { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', rssNumber: 'WA1', dateLanded: '2019-07-10', species: 'COD', weight: 500 },
        ]
      ],
      ['WA12019-07-11',
        [
          { documentNumber: 'CC1', createdAt: '2019-07-10T08:26:06.939Z', rssNumber: 'WA1', dateLanded: '2019-07-11', species: 'LBE', weight: 100 },
        ]
      ]
    ]

    const grouped = Array.from(Transformations.groupCatchCertsByLanding(
      _.sortBy(
        Array.from(unwoundCatchCerts),
        ['rssNumber', 'dateLanded', 'createdAt'])))

    expect(grouped).toEqual(expected)

  })

});

describe('mapCatchCerts', () => {
  it('will surface the factor applied to the weight', () => {
    const unwoundCertificates = [
      { documentNumber: 'CC1', status: 'COMPLETE', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', factor: 1, pln: 'WA1', date: '2019-07-10', weight: 100, extended: { vesselOverriddenByAdmin: undefined,speciesOverriddenByAdmin:false } }
    ];

    const result = Array.from(Transformations.mapCatchCerts(unwoundCertificates, () => true));

    expect(result).toStrictEqual([{
      createdAt: "2019-07-10T08:26:06.939Z",
      dateLanded: "2019-07-10",
      da: undefined,
      documentNumber: "CC1",
      factor: 1,
      species: "LBE",
      status: "COMPLETE",
      rssNumber: undefined,
      weight: 100,
      extended: {
        vesselOverriddenByAdmin: undefined,
        speciesOverriddenByAdmin:false,
        flag: undefined,
        homePort: undefined,
        imoNumber: undefined,
        licenceHolder: undefined,
        licenceNumber: undefined,
        licenceValidTo: undefined
      }
    }])
  });

  it('will surface the licence details for the vessel', () => {
    const unwoundCertificates = [
      { documentNumber: 'CC1', status: 'COMPLETE', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', factor: 1, pln: 'WA1', date: '2019-07-10', weight: 100, extended: { vesselOverriddenByAdmin: undefined,  speciesOverriddenByAdmin:false } }
    ];

    const result = Array.from(Transformations.mapCatchCerts(unwoundCertificates, () => ({
      rssNumber: 'C19353',
      da: 'England',
      homePort: 'FLEETWOOD',
      flag: 'GBR',
      imoNumber: null,
      licenceNumber: '22657',
      licenceValidTo: '2382-12-31',
      licenceHolder: 'I am the Licence Holder name for this fishing boat'
    })));

    expect(result).toStrictEqual([{
      createdAt: "2019-07-10T08:26:06.939Z",
      dateLanded: "2019-07-10",
      da: 'England',
      documentNumber: "CC1",
      factor: 1,
      species: "LBE",
      status: "COMPLETE",
      rssNumber: 'C19353',
      weight: 100,
      extended: {
        vesselOverriddenByAdmin: undefined,
        speciesOverriddenByAdmin:false,
        flag: 'GBR',
        homePort: 'FLEETWOOD',
        imoNumber: null,
        licenceNumber: '22657',
        licenceValidTo: '2382-12-31',
        licenceHolder: 'I am the Licence Holder name for this fishing boat'
      }
    }])
  });

  it('will surface the admin licence holder', () => {
    const unwoundCertificates = [
      { documentNumber: 'CC1', status: 'COMPLETE', createdAt: '2019-07-10T08:26:06.939Z', speciesCode: 'LBE', factor: 1, pln: 'WA1', date: '2019-07-10', weight: 100, extended: { vesselOverriddenByAdmin: true, speciesOverriddenByAdmin:false, licenceHolder: 'Admin added licence holder' } }
    ];

    const result = Array.from(Transformations.mapCatchCerts(unwoundCertificates, () => ({
      rssNumber: 'C19353',
      da: 'England',
      homePort: 'FLEETWOOD',
      flag: 'GBR',
      imoNumber: null,
      licenceNumber: '22657',
      licenceValidTo: '2382-12-31',
      licenceHolder: 'I am the Licence Holder name for this fishing boat'
    })));

    expect(result).toStrictEqual([{
      createdAt: "2019-07-10T08:26:06.939Z",
      dateLanded: "2019-07-10",
      da: 'England',
      documentNumber: "CC1",
      factor: 1,
      species: "LBE",
      status: "COMPLETE",
      rssNumber: 'C19353',
      weight: 100,
      extended: {
        vesselOverriddenByAdmin: true,
        speciesOverriddenByAdmin:false,
        flag: 'GBR',
        homePort: 'FLEETWOOD',
        imoNumber: null,
        licenceNumber: '22657',
        licenceValidTo: '2382-12-31',
        licenceHolder: 'Admin added licence holder'
      }
    }])
  });
});