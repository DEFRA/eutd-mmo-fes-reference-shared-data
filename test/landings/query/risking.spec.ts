import { isSpeciesFailure } from '../../../src/landings/query'

describe('isSpeciesFailure when validing against an landing dec or catch recording', () => {
    let mockIsHighRisk;
    let mockIsRiskEnabled;
    let mockGetTotalRiskScore;

    afterEach(() => {
        mockIsHighRisk.mockRestore();
        mockIsRiskEnabled.mockRestore();
        mockGetTotalRiskScore.mockRestore();
    });

    describe('when the landing is a species mis-match', () => {
        const isSpeciesExists = false;

        it('should return true when species toggle is disabled', () => {
            mockIsHighRisk = jest.fn(() => 'N/A');
            mockIsRiskEnabled = jest.fn(() => false);
            mockGetTotalRiskScore = jest.fn(() => 0);

            const result = isSpeciesFailure(mockIsHighRisk)(mockIsRiskEnabled(), isSpeciesExists, mockGetTotalRiskScore());

            expect(mockIsHighRisk).not.toHaveBeenCalled();
            expect(result).toBeTruthy();
        });

        it('should return true when species toggle is enabled and landing is high risk', () => {
            mockIsHighRisk = jest.fn(() => true);
            mockIsRiskEnabled = jest.fn(() => true);
            mockGetTotalRiskScore = jest.fn(() => 10);

            const result = isSpeciesFailure(mockIsHighRisk)(mockIsRiskEnabled(), isSpeciesExists, mockGetTotalRiskScore());

            expect(mockIsHighRisk).toHaveBeenCalled();
            expect(mockIsHighRisk).toHaveBeenCalledWith(10);
            expect(result).toBeTruthy();
        });

        it('should return false when species toggle is enabled and landing is low risk', () => {
            mockIsHighRisk = jest.fn(() => false);
            mockIsRiskEnabled = jest.fn(() => true);
            mockGetTotalRiskScore = jest.fn(() => 1);

            const result = isSpeciesFailure(mockIsHighRisk)(mockIsRiskEnabled(), isSpeciesExists, mockGetTotalRiskScore());

            expect(mockIsHighRisk).toHaveBeenCalled();
            expect(mockIsHighRisk).toHaveBeenCalledWith(1);
            expect(result).toBeFalsy();
        });

    });

    describe('when the landing is a species match', () => {
        const isSpeciesExists = true;

        it('should return false when species toggle is disabled', () => {
            mockIsHighRisk = jest.fn(() => 'N/A');
            mockIsRiskEnabled = jest.fn(() => false);
            mockGetTotalRiskScore = jest.fn(() => 0);

            const result = isSpeciesFailure(mockIsHighRisk)(mockIsRiskEnabled(), isSpeciesExists, mockGetTotalRiskScore());

            expect(mockIsHighRisk).not.toHaveBeenCalled();
            expect(result).toBeFalsy();
        });

        it('should return false when species toggle is enabled and landing is high risk', () => {
            mockIsHighRisk = jest.fn(() => true);
            mockIsRiskEnabled = jest.fn(() => true);
            mockGetTotalRiskScore = jest.fn(() => 10);

            const result = isSpeciesFailure(mockIsHighRisk)(mockIsRiskEnabled(), isSpeciesExists, mockGetTotalRiskScore());

            expect(mockIsHighRisk).not.toHaveBeenCalled();
            expect(result).toBeFalsy();
        });

        it('should return false when species toggle is enabled and landing is low risk', () => {
            mockIsHighRisk = jest.fn(() => false);
            mockIsRiskEnabled = jest.fn(() => true);
            mockGetTotalRiskScore = jest.fn(() => 1);

            const result = isSpeciesFailure(mockIsHighRisk)(mockIsRiskEnabled(), isSpeciesExists, mockGetTotalRiskScore());

            expect(mockIsHighRisk).not.toHaveBeenCalled();
            expect(result).toBeFalsy();
        });

    });

});