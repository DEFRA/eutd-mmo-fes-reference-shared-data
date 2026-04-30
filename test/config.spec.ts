import * as SUT from '../src/config';


describe('config', () => {

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('will get config details', () => {
    process.env.REF_BOOMI_USER = 'ref-boomi-user';
    process.env.BOOMI_URL = 'boomi-url';
    process.env.EXTERNAL_APP_URL = 'external-app-url';
    process.env.INTERNAL_ADMIN_URL = 'internal-admin-url';
    process.env.REF_BOOMI_API_OAUTH_AL_SCOPE = 'al-scope';
    process.env.REF_BOOMI_API_OAUTH_MMO_SCOPE = 'mmo-scope';
    process.env.REF_BOOMI_CATCH_API_OAUTH_SCOPE = 'catch-scope';

    const config = SUT.getConfig();
    expect(config).toBeDefined();
    expect(config.boomiAuthUser).toBe('ref-boomi-user');
    expect(config.boomiUrl).toBe('boomi-url');
    expect(config.boomiAddressLookupApiOauthScope).toBe('al-scope');
    expect(config.boomiLandingApiOauthScope).toBe('mmo-scope');
    expect(config.boomiCatchApiOauthScope).toBe('catch-scope');
  });
});