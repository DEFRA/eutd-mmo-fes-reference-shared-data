import * as SUT from "../../../src/landings/types";

describe('document type', () => {
  it('will contain the documment statuses', () => {
    expect(SUT.DocumentStatuses.Blocked).toBe('BLOCKED');
    expect(SUT.DocumentStatuses.Draft).toBe('DRAFT');
    expect(SUT.DocumentStatuses.Complete).toBe('COMPLETE');
    expect(SUT.DocumentStatuses.Void).toBe('VOID');
    expect(SUT.DocumentStatuses.Locked).toBe('LOCKED');
    expect(SUT.DocumentStatuses.Pending).toBe('PENDING');
  });

  it('will contain the landing statuses', () => {
    expect(SUT.LandingStatus.Pending).toBe('PENDING_LANDING_DATA');
    expect(SUT.LandingStatus.Complete).toBe('HAS_LANDING_DATA');
    expect(SUT.LandingStatus.Exceeded14Days).toBe('EXCEEDED_14_DAY_LIMIT');
    expect(SUT.LandingStatus.DataNeverExpected).toBe('LANDING_DATA_NEVER_EXPECTED');
  });
});