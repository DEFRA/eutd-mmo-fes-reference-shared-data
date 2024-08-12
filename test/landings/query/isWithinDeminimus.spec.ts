import moment from "moment";
import { ICcQueryResult, LandingSources } from '../../../src/landings/types';
import { DEMINIMUS_IN_KG, isElog, isWithinDeminimus } from '../../../src/landings/query';

const queryTime = moment.utc();

describe('isWithinDeminimus', () => {

    it('will return true when the LIVE EXPORT WEIGHT is less than the OR equal to given 50KG deminimus', () => {
        const input: ICcQueryResult = {
            documentNumber: "CC1",
            documentType: "catchCertificate",
            createdAt: moment.utc("2019-07-13T08:26:06.939Z").toISOString(),
            status: "COMPLETE",
            rssNumber: "rssWA1",
            da: "Guernsey",
            dateLanded: "2019-07-10",
            species: "LBE",
            weightOnCert: 50,
            rawWeightOnCert: 25,
            weightOnAllCerts: 25,
            weightOnAllCertsBefore: 0,
            weightOnAllCertsAfter: 25,
            weightFactor: 2,
            isLandingExists: true,
            isSpeciesExists: false,
            numberOfLandingsOnDay: 1,
            weightOnLanding: 0,
            weightOnLandingAllSpecies: 25,
            landingTotalBreakdown: [],
            source: LandingSources.ELog,
            isOverusedThisCert: false,
            isOverusedAllCerts: false,
            isExceeding14DayLimit: false,
            overUsedInfo: [],
            durationSinceCertCreation: moment
                .duration(queryTime.diff(moment.utc("2019-07-13T08:26:06.939Z")))
                .toISOString(),
            durationBetweenCertCreationAndFirstLandingRetrieved: moment
                .duration(
                    moment
                        .utc("2019-07-11T09:00:00.000Z")
                        .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                )
                .toISOString(),
            durationBetweenCertCreationAndLastLandingRetrieved: moment
                .duration(
                    moment
                        .utc("2019-07-11T09:00:00.000Z")
                        .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                )
                .toISOString(),
            extended: {
                landingId: "rssWA12019-07-10",
                exporterName: "Mr Bob",
                presentation: "SLC",
                documentUrl: "_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf",
                presentationName: "sliced",
                vessel: "DAYBREAK",
                fao: "FAO27",
                pln: "WA1",
                species: "Lobster",
                state: "FRE",
                stateName: "fresh",
                commodityCode: "1234",
                investigation: {},
                transportationVehicle: "directLanding",
            }
        };

        const result = isWithinDeminimus(input.isSpeciesExists, input.weightOnCert, DEMINIMUS_IN_KG);
        expect(result).toBe(true);
    });

    it('will return false when the LIVE EXPORT WEIGHT is more than the given 50KG deminimus', () => {
        const input: ICcQueryResult = {
            documentNumber: "CC1",
            documentType: "catchCertificate",
            createdAt: moment.utc("2019-07-13T08:26:06.939Z").toISOString(),
            status: "COMPLETE",
            rssNumber: "rssWA1",
            da: "Guernsey",
            dateLanded: "2019-07-10",
            species: "LBE",
            weightOnCert: 51,
            rawWeightOnCert: 25.5,
            weightOnAllCerts: 25.5,
            weightOnAllCertsBefore: 0,
            weightOnAllCertsAfter: 25.5,
            weightFactor: 2,
            isLandingExists: true,
            isSpeciesExists: false,
            numberOfLandingsOnDay: 1,
            weightOnLanding: 0,
            weightOnLandingAllSpecies: 25,
            landingTotalBreakdown: [],
            source: LandingSources.ELog,
            isOverusedThisCert: false,
            isOverusedAllCerts: false,
            isExceeding14DayLimit: false,
            overUsedInfo: [],
            durationSinceCertCreation: moment
                .duration(queryTime.diff(moment.utc("2019-07-13T08:26:06.939Z")))
                .toISOString(),
            durationBetweenCertCreationAndFirstLandingRetrieved: moment
                .duration(
                    moment
                        .utc("2019-07-11T09:00:00.000Z")
                        .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                )
                .toISOString(),
            durationBetweenCertCreationAndLastLandingRetrieved: moment
                .duration(
                    moment
                        .utc("2019-07-11T09:00:00.000Z")
                        .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                )
                .toISOString(),
            extended: {
                landingId: "rssWA12019-07-10",
                exporterName: "Mr Bob",
                presentation: "SLC",
                documentUrl: "_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf",
                presentationName: "sliced",
                vessel: "DAYBREAK",
                fao: "FAO27",
                pln: "WA1",
                species: "Lobster",
                state: "FRE",
                stateName: "fresh",
                commodityCode: "1234",
                investigation: {},
                transportationVehicle: "directLanding",
            }
        };

        const result = isWithinDeminimus(input.isSpeciesExists, input.weightOnCert, DEMINIMUS_IN_KG);
        expect(result).toBe(false);
    });

});

describe('isElog', () => {
    let mockFn;

    beforeEach(() => {
        mockFn = jest.fn(x => x);
    });

    afterEach(() => {
        mockFn.mockRestore();
    });

    describe('for landings validated by ELOG', () => {

        it('will call the given function with the correct parameters', () => {
            const input: ICcQueryResult = {
                documentNumber: "CC1",
                documentType: "catchCertificate",
                createdAt: moment.utc("2019-07-13T08:26:06.939Z").toISOString(),
                status: "COMPLETE",
                rssNumber: "rssWA1",
                da: "Guernsey",
                dateLanded: "2019-07-10",
                species: "LBE",
                weightOnCert: 49,
                rawWeightOnCert: 24.5,
                weightOnAllCerts: 24.5,
                weightOnAllCertsBefore: 0,
                weightOnAllCertsAfter: 24.5,
                weightFactor: 2,
                isLandingExists: true,
                isSpeciesExists: false,
                numberOfLandingsOnDay: 1,
                weightOnLanding: 0,
                weightOnLandingAllSpecies: 24.5,
                landingTotalBreakdown: [],
                source: LandingSources.ELog,
                isOverusedThisCert: false,
                isOverusedAllCerts: false,
                isExceeding14DayLimit: false,
                overUsedInfo: [],
                durationSinceCertCreation: moment
                    .duration(queryTime.diff(moment.utc("2019-07-13T08:26:06.939Z")))
                    .toISOString(),
                durationBetweenCertCreationAndFirstLandingRetrieved: moment
                    .duration(
                        moment
                            .utc("2019-07-11T09:00:00.000Z")
                            .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                    )
                    .toISOString(),
                durationBetweenCertCreationAndLastLandingRetrieved: moment
                    .duration(
                        moment
                            .utc("2019-07-11T09:00:00.000Z")
                            .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                    )
                    .toISOString(),
                extended: {
                    landingId: "rssWA12019-07-10",
                    exporterName: "Mr Bob",
                    presentation: "SLC",
                    documentUrl: "_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf",
                    presentationName: "sliced",
                    vessel: "DAYBREAK",
                    fao: "FAO27",
                    pln: "WA1",
                    species: "Lobster",
                    state: "FRE",
                    stateName: "fresh",
                    commodityCode: "1234",
                    investigation: {},
                    transportationVehicle: "directLanding",
                }
            };

            isElog(mockFn)(input);
            expect(mockFn).toHaveBeenCalled();
            expect(mockFn).toHaveBeenCalledWith(input.isSpeciesExists, input.weightOnCert, DEMINIMUS_IN_KG);
        });
    });

    describe('for landings validated by LANDING DECLARATION', () => {
        it('will not call the given function', () => {
            const input: ICcQueryResult = {
                documentNumber: "CC1",
                documentType: "catchCertificate",
                createdAt: moment.utc("2019-07-13T08:26:06.939Z").toISOString(),
                status: "COMPLETE",
                rssNumber: "rssWA1",
                da: "Guernsey",
                dateLanded: "2019-07-10",
                species: "LBE",
                weightOnCert: 49,
                rawWeightOnCert: 24.5,
                weightOnAllCerts: 24.5,
                weightOnAllCertsBefore: 0,
                weightOnAllCertsAfter: 24.5,
                weightFactor: 2,
                isLandingExists: true,
                isSpeciesExists: false,
                numberOfLandingsOnDay: 1,
                weightOnLanding: 0,
                weightOnLandingAllSpecies: 24.5,
                landingTotalBreakdown: [],
                source: LandingSources.LandingDeclaration,
                isOverusedThisCert: false,
                isOverusedAllCerts: false,
                isExceeding14DayLimit: false,
                overUsedInfo: [],
                durationSinceCertCreation: moment
                    .duration(queryTime.diff(moment.utc("2019-07-13T08:26:06.939Z")))
                    .toISOString(),
                durationBetweenCertCreationAndFirstLandingRetrieved: moment
                    .duration(
                        moment
                            .utc("2019-07-11T09:00:00.000Z")
                            .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                    )
                    .toISOString(),
                durationBetweenCertCreationAndLastLandingRetrieved: moment
                    .duration(
                        moment
                            .utc("2019-07-11T09:00:00.000Z")
                            .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                    )
                    .toISOString(),
                extended: {
                    landingId: "rssWA12019-07-10",
                    exporterName: "Mr Bob",
                    presentation: "SLC",
                    documentUrl: "_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf",
                    presentationName: "sliced",
                    vessel: "DAYBREAK",
                    fao: "FAO27",
                    pln: "WA1",
                    species: "Lobster",
                    state: "FRE",
                    stateName: "fresh",
                    commodityCode: "1234",
                    investigation: {},
                    transportationVehicle: "directLanding",
                }
            };

            isElog(mockFn)(input);
            expect(mockFn).not.toHaveBeenCalled();
        });
    });

    describe('for landings validated by CATCH RECORDING', () => {
        it('will not call the given function', () => {
            const input: ICcQueryResult = {
                documentNumber: "CC1",
                documentType: "catchCertificate",
                createdAt: moment.utc("2019-07-13T08:26:06.939Z").toISOString(),
                status: "COMPLETE",
                rssNumber: "rssWA1",
                da: "Guernsey",
                dateLanded: "2019-07-10",
                species: "LBE",
                weightOnCert: 49,
                rawWeightOnCert: 24.5,
                weightOnAllCerts: 24.5,
                weightOnAllCertsBefore: 0,
                weightOnAllCertsAfter: 24.5,
                weightFactor: 2,
                isLandingExists: true,
                isSpeciesExists: false,
                numberOfLandingsOnDay: 1,
                weightOnLanding: 0,
                weightOnLandingAllSpecies: 24.5,
                landingTotalBreakdown: [],
                source: LandingSources.CatchRecording,
                isOverusedThisCert: false,
                isOverusedAllCerts: false,
                isExceeding14DayLimit: false,
                overUsedInfo: [],
                durationSinceCertCreation: moment
                    .duration(queryTime.diff(moment.utc("2019-07-13T08:26:06.939Z")))
                    .toISOString(),
                durationBetweenCertCreationAndFirstLandingRetrieved: moment
                    .duration(
                        moment
                            .utc("2019-07-11T09:00:00.000Z")
                            .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                    )
                    .toISOString(),
                durationBetweenCertCreationAndLastLandingRetrieved: moment
                    .duration(
                        moment
                            .utc("2019-07-11T09:00:00.000Z")
                            .diff(moment.utc("2019-07-13T08:26:06.939Z"))
                    )
                    .toISOString(),
                extended: {
                    landingId: "rssWA12019-07-10",
                    exporterName: "Mr Bob",
                    presentation: "SLC",
                    documentUrl: "_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf",
                    presentationName: "sliced",
                    vessel: "DAYBREAK",
                    fao: "FAO27",
                    pln: "WA1",
                    species: "Lobster",
                    state: "FRE",
                    stateName: "fresh",
                    commodityCode: "1234",
                    investigation: {},
                    transportationVehicle: "directLanding",
                }
            };

            isElog(mockFn)(input);
            expect(mockFn).not.toHaveBeenCalled();
        });
    });
});