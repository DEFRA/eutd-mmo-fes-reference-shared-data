import moment from 'moment';
import { getLandingsFromCatchCertificate, mapLandingWithLandingStatus, shouldIncludeLanding } from '../../../src/landings/orchestration/ccOnlineReport';
import { ICcQueryResult } from '../../../src/landings/types/query';
import { LandingStatus } from '../../../src/landings/types/document';
import { Product } from '../../../src/landings/types/document';

moment.suppressDeprecationWarnings = true;

describe('When extracting landings from a CC to be able to get all catch certs', () => {
  it('will collate all landings in a single list', () => {
    const catchCertificate = {
      "documentNumber": "CC1",
      "exportData": {
        "products": [
          {
            "speciesCode": "LBE",
            "species": "Lobster",
            "commodityCode": "1234",
            "commodityCodeDescription": "some commodity code description",
            "scientificName": "some scientific name",
            "state": {
              "code": "BAD"
            },
            "caughtBy": [
              { "vessel": "TEST1", "pln": "WA1", "date": "2015-10-06", "weight": 78 },
              { "vessel": "TEST1", "pln": "WA1", "date": "2014-10-06", "weight": 212 }
            ]
          },{
            "speciesCode": "LBE",
            "species": "Lobster",
            "commodityCode": "1234",
            "state": {
              "code": "BAD"
            },
            "caughtBy": [
              { "vessel": "TEST2", "pln": "WA2", "date": "2019-10-06", "weight": 100 },
              { "vessel": "TEST3", "pln": "WA3", "date": "2018-10-06", "weight": 211 },
              { "vessel": "TEST4", "pln": "WA4", "date": "2017-10-06", "weight": 140 }
            ]
          }],
        "exporterDetails": { "exporterFullName": 'Mr Bob' }
      }
    };

    const expectedResult = [
      { pln : "WA1", dateLanded : "2015-10-06" },
      { pln : "WA1", dateLanded : "2014-10-06" },
      { pln : "WA2", dateLanded : "2019-10-06" },
      { pln : "WA3", dateLanded : "2018-10-06" },
      { pln : "WA4", dateLanded : "2017-10-06" }
    ]

    const result = getLandingsFromCatchCertificate(catchCertificate);

    expect(result).toEqual(expectedResult);
  });

  it('will include all landings that have an vesselOverriddenByAdmin flag when reporting new landings', () => {
    const catchCertificate = {
      "documentNumber": "CC1",
      "createdAt": "2020-09-26T08:26:06.939Z",
      "exportData": {
        "products": [
          {
            "speciesCode": "LBE",
            "species": "Lobster",
            "commodityCode": "1234",
            "commodityCodeDescription": "some commodity code description",
            "scientificName": "some scientific name",
            "state": {
              "code": "BAD"
            },
            "caughtBy": [
              { "vessel": "TEST1", "pln": "WA1", "date": "2015-10-06", "weight": 78, "vesselOverriddenByAdmin": true },
              { "vessel": "TEST1", "pln": "WA1", "date": "2014-10-06", "weight": 212 }
            ]
          },{
            "speciesCode": "LBE",
            "species": "Lobster",
            "commodityCode": "1234",
            "state": {
              "code": "BAD"
            },
            "caughtBy": [
              { "vessel": "TEST2", "pln": "WA2", "date": "2019-10-06", "weight": 100, "vesselOverriddenByAdmin": true },
              { "vessel": "TEST3", "pln": "WA3", "date": "2018-10-06", "weight": 211 },
              { "vessel": "TEST4", "pln": "WA4", "date": "2017-10-06", "weight": 140 }
            ]
          }],
        "exporterDetails": { "exporterFullName": 'Mr Bob' }
      }
    };

    const expectedResult = [
      { pln : "WA1", dateLanded : "2015-10-06", createdAt: "2020-09-26T08:26:06.939Z" },
      { pln : "WA1", dateLanded : "2014-10-06", createdAt: "2020-09-26T08:26:06.939Z" },
      { pln : "WA2", dateLanded : "2019-10-06", createdAt: "2020-09-26T08:26:06.939Z" },
      { pln : "WA3", dateLanded : "2018-10-06", createdAt: "2020-09-26T08:26:06.939Z" },
      { pln : "WA4", dateLanded : "2017-10-06", createdAt: "2020-09-26T08:26:06.939Z" }
    ]

    const result = getLandingsFromCatchCertificate(catchCertificate, true);

    expect(result).toEqual(expectedResult);
  });

  it('will exclude all landings that have an vesselOverriddenByAdmin flag', () => {
    const catchCertificate = {
      "documentNumber": "CC1",
      "exportData": {
        "products": [
          {
            "speciesCode": "LBE",
            "species": "Lobster",
            "commodityCode": "1234",
            "commodityCodeDescription": "some commodity code description",
            "scientificName": "some scientific name",
            "state": {
              "code": "BAD"
            },
            "caughtBy": [
              { "vessel": "TEST1", "pln": "WA1", "date": "2015-10-06", "weight": 78, "vesselOverriddenByAdmin": true },
              { "vessel": "TEST1", "pln": "WA1", "date": "2014-10-06", "weight": 212 }
            ]
          },{
            "speciesCode": "LBE",
            "species": "Lobster",
            "commodityCode": "1234",
            "state": {
              "code": "BAD"
            },
            "caughtBy": [
              { "vessel": "TEST2", "pln": "WA2", "date": "2019-10-06", "weight": 100, "vesselOverriddenByAdmin": true },
              { "vessel": "TEST3", "pln": "WA3", "date": "2018-10-06", "weight": 211 },
              { "vessel": "TEST4", "pln": "WA4", "date": "2017-10-06", "weight": 140 }
            ]
          }],
        "exporterDetails": { "exporterFullName": 'Mr Bob' }
      }
    };

    const expectedResult = [
      { pln : "WA1", dateLanded : "2014-10-06" },
      { pln : "WA3", dateLanded : "2018-10-06" },
      { pln : "WA4", dateLanded : "2017-10-06" }
    ]

    const result = getLandingsFromCatchCertificate(catchCertificate);

    expect(result).toEqual(expectedResult);
  });

  it('will exclude a single landing when it has a vesselOverriddenByAdmin flag', () => {
    const catchCertificate = {
      "documentNumber": "CC1",
      "exportData": {
        "products": [
          {
            "speciesCode": "LBE",
            "species": "Lobster",
            "commodityCode": "1234",
            "commodityCodeDescription": "some commodity code description",
            "scientificName": "some scientific name",
            "state": {
              "code": "BAD"
            },
            "caughtBy": [
              { "vessel": "TEST1", "pln": "WA1", "date": "2015-10-06", "weight": 78, "vesselOverriddenByAdmin": true }
            ]
          }],
        "exporterDetails": { "exporterFullName": 'Mr Bob' }
      }
    };

    const expectedResult = [];

    const result = getLandingsFromCatchCertificate(catchCertificate);

    expect(result).toEqual(expectedResult);
  });
});

describe('When deciding whether to include a landing in landing refreshes', () => {
  it('should return false', () => {
    const rssLanding = {
      rssNumber: 'rssWA1',
      dateLanded: '01-01-2010',
      dataEverExpected: false,
      landingDataExpectedDate: '01-01-2010',
      landingDataEndDate: '01-01-2010',
      createdAt: '01-01-2010',
      isLegallyDue: false
    };

    expect(shouldIncludeLanding(rssLanding)).toBe(false);
  });

  it('should return true', () => {
    const rssLanding = {
      rssNumber: 'rssWA1',
      dateLanded: '01-01-2010',
      dataEverExpected: true,
      landingDataExpectedDate: '01-01-2010',
      landingDataEndDate: '01-01-2010',
      createdAt: '01-01-2010',
      isLegallyDue: false
    };

    expect(shouldIncludeLanding(rssLanding)).toBe(true);
  });

  it('should return true when landing is legally due', () => {
    const rssLanding = {
      rssNumber: 'rssWA1',
      dateLanded: '01-01-2010',
      dataEverExpected: true,
      landingDataExpectedDate: '01-01-3010',
      landingDataEndDate: '01-01-2010',
      createdAt: '01-01-2010',
      isLegallyDue: true
    };

    expect(shouldIncludeLanding(rssLanding)).toBe(true);
  });

  it('should return true when landing expected date is not defined', () => {
    const rssLanding = {
      rssNumber: 'rssWA1',
      dateLanded: '01-01-2010',
      createdAt: '01-01-2010',
      isLegallyDue: false
    };

    expect(shouldIncludeLanding(rssLanding)).toBe(true);
  });
});

describe('When updating a landing within an online Catch Certificate', () => {

  const landing = {
      id: "CC1-1",
      vessel: "WIRON 5",
      pln: "H1100",
      date: "some-date",
      faoArea: "FAO27",
      weight: 500
  };

  const product = {
      species: "Atlantic cod (COD)",
      speciesId: "CC1-976b1606-70b5-44d8-a4ba-ef2c81ac838a",
      speciesCode: "COD",
      commodityCode: "03025110",
      state: {
          code: "FRE",
          name: "Fresh"
      },
      presentation: {
          code: "WHL",
          name: "Whole"
      },
      factor: 1,
      caughtBy: [{
          ...landing
      }]
  };

  it('will place a _status of Has Landing Data', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-1",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding"
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isLandingExists: true,
      isExceeding14DayLimit: false,
      source: "LANDING_DECLARATION",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "LANDING_DECLARATION",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    };

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toEqual(LandingStatus.Complete);
  });

  it('will place a _status of Has Landing Data for eLogs', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-1",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding"
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isExceeding14DayLimit: false,
      isLandingExists: true,
      source: "ELOG",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "ELOG",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    }

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toEqual(LandingStatus.Complete);

  });

  it('will place a _status of has Landing data for eLogs failures within thier deminimus', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-1",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding"
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 50,
      rawWeightOnCert: 50,
      weightOnAllCerts: 50,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isExceeding14DayLimit: false,
      isLandingExists: true,
      source: "ELOG",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: false,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "ELOG",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    }

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toEqual(LandingStatus.Complete);

  });

  it('will place a _status of Pending Landing for a landing where an overuse has occured', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-1",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding"
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isLandingExists: true,
      isExceeding14DayLimit: false,
      source: "LANDING_DECLARATION",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "LANDING_DECLARATION",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    };

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toEqual(LandingStatus.Complete);
  });

  it('will place a status of pending landing data for ignored landings', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "ADMIN UPDATED VESSEL",
        landingId: "CC1-1",
        pln: "ADMIN UPDATED PLN",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding",
        vesselOverriddenByAdmin: true
      },
      rssNumber: "UNKNOWN",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isExceeding14DayLimit: false,
      isLandingExists: false,
      weightOnLandingAllSpecies: 0,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 0,
      landingTotalBreakdown: [],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    }

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toEqual(LandingStatus.Pending);
  });

  it('will place a _status of Date Ever Expected', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-1",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding",
        dataEverExpected: false,
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isExceeding14DayLimit: true,
      isLandingExists: true,
      source: "ELOG",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "ELOG",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    }

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toEqual(LandingStatus.DataNeverExpected);

  });

  it('will place a _status of Exceeding 14 day limit', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-1",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding"
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isLandingExists: true,
      isExceeding14DayLimit: true,
      source: "LANDING_DECLARATION",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "LANDING_DECLARATION",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    };

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toEqual(LandingStatus.Exceeded14Days);
  });

  it('will place a _status of undefined for BLOCKED submissions', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "BLOCKED",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-1",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding"
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isLandingExists: true,
      isExceeding14DayLimit: true,
      source: "LANDING_DECLARATION",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "LANDING_DECLARATION",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    };

    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]._status).toBeUndefined();
  });

  it('will return the same landing', () => {

    const validation: ICcQueryResult = {
      documentNumber: "CC1",
      documentType: "catchCertificate",
      createdAt: "2020-09-25T11:43:51.869Z",
      status: "COMPLETE",
      extended: {
        exporterName: "Private",
        exporterCompanyName: "Private",
        exporterPostCode: "AB1 2XX",
        vessel: "WIRON 5",
        landingId: "CC1-2",
        pln: "H1100",
        fao: "FAO27",
        flag: "GBR",
        cfr: "GBRC1121091",
        presentation: "WHL",
        presentationName: "Whole",
        species: "Atlantic cod (COD)",
        state: "FRE",
        stateName: "Fresh",
        commodityCode: "03025110",
        transportationVehicle: "directLanding"
      },
      rssNumber: "C20514",
      da: "England",
      dateLanded: "2020-08-30",
      species: "COD",
      weightFactor: 1,
      weightOnCert: 500,
      rawWeightOnCert: 500,
      weightOnAllCerts: 500,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 500,
      isLandingExists: true,
      isExceeding14DayLimit: false,
      source: "LANDING_DECLARATION",
      weightOnLandingAllSpecies: 1000,
      numberOfLandingsOnDay: 1,
      durationBetweenCertCreationAndFirstLandingRetrieved: "-PT0.011S",
      durationBetweenCertCreationAndLastLandingRetrieved: "-PT0.011S",
      isSpeciesExists: true,
      weightOnLanding: 1000,
      landingTotalBreakdown: [
        {
          presentation: "WHL",
          state: "FRE",
          source: "LANDING_DECLARATION",
          isEstimate: false,
          factor: 1,
          weight: 1000,
          liveWeight: 1000
        }
      ],
      isOverusedThisCert: false,
      isOverusedAllCerts: false,
      overUsedInfo: [],
      durationSinceCertCreation: "PT0.009S"
    };

    const expected = {
      ...landing
    };
    const result = mapLandingWithLandingStatus(product, validation, () => {return 1});

    expect(result.caughtBy?.[0]).toEqual(expected);
  });
});

describe('mapLandingWithLandingStatus', () => {
  const validation: ICcQueryResult = {
    documentNumber: 'abc-def-ghi-jkl',
    documentType: 'catchcert',
    status: 'COMPLETE',
    createdAt: '',
    rssNumber: '',
    da: '',
    dateLanded: '',
    species: 'Atlantic cod (COD)',
    weightFactor: 1,
    weightOnCert: 10,
    rawWeightOnCert: 10,
    weightOnAllCerts: 100,
    weightOnAllCertsBefore: 10,
    weightOnAllCertsAfter: 10,
    isLandingExists: false,
    isSpeciesExists: false,
    numberOfLandingsOnDay: 0,
    weightOnLanding: 0,
    weightOnLandingAllSpecies: 0,
    isOverusedThisCert: false,
    isOverusedAllCerts: false,
    overUsedInfo: [],
    durationSinceCertCreation: '',
    durationBetweenCertCreationAndFirstLandingRetrieved: null,
    durationBetweenCertCreationAndLastLandingRetrieved: null,
    extended: undefined,
    isExceeding14DayLimit: false
  };

  const getToLiveWeightFactor = (species: string, state: string, presentation: string): number => {
    const records = [
      {
        speciesCode: 'ABC',
        stateCode: 'DEF',
        presentationCode: 'GHI',
        factor: 10
      },
      {
        speciesCode: 'BCD',
        stateCode: 'EFG',
        presentationCode: 'HIJ',
        factor: 20
      },
      {
        speciesCode: 'CDE',
        stateCode: 'FGH', 
        presentationCode: 'IJK',
        factor: 30
      }
    ];
    return records.find(x => x.presentationCode === presentation && x.speciesCode === species && x.stateCode === state)?.factor ?? 1;
  };

  it('factor should match the expected value in the getToLiveWeightFactor function', () => {
    const product: Product = {
      species: 'Atlantic cod (COD)',
      speciesCode: 'BCD',
      state: {
        code: 'EFG',
        name: 'Fresh'
      },
      presentation: {
        code: 'HIJ',
        name: 'Whole'
      },
      speciesId: 'test123',
      caughtBy: []
    };

    const result = mapLandingWithLandingStatus(product, validation, getToLiveWeightFactor);
    expect(result.factor).toEqual(20);
  });

  it('factor should be equal to 1 because of no matches', () => {
    const product: Product = {
      species: 'Atlantic cod (COD)',
      speciesCode: 'BCDF',
      state: {
        code: 'EFGA',
        name: 'Fresh'
      },
      presentation: {
        code: 'HIJH',
        name: 'Whole'
      },
      speciesId: 'test123',
      caughtBy: []
    };

    const result = mapLandingWithLandingStatus(product, validation, getToLiveWeightFactor);
    expect(result.factor).toEqual(1);
  });
});
