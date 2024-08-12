import * as SUT from "../../../../src/landings/types/appConfig";

describe('when mapping level of risk', () => {
  it('will contain the landing statuses', () => {
    expect(SUT.WEIGHT.EXPORTER).toBe('exporterWeight');
    expect(SUT.WEIGHT.SPECIES).toBe('speciesWeight');
    expect(SUT.WEIGHT.VESSEL).toBe('vesselWeight');
  });
})