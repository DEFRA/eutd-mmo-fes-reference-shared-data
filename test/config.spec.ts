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
    process.env.REF_BOOMI_API_OAUTH_CLIENT_ID = 'ref-boomi-client-id';
    process.env.REF_BOOMI_API_OAUTH_CLIENT_SECRET = 'ref-boomi-client-secret';
    process.env.BOOMI_URL = 'boomi-url';
    process.env.EXTERNAL_APP_URL = 'external-app-url';
    process.env.INTERNAL_ADMIN_URL = 'internal-admin-url'

    const config = SUT.getConfig();
    expect(config).toBeDefined();
    expect(config.boomiApiOauthClientId).toBe('ref-boomi-client-id');
    expect(config.boomiApiOauthClientSecret).toBe('ref-boomi-client-secret');
  });

  it('will default boomiCatchApiTimeoutMs when REF_BOOMI_CATCH_API_TIMEOUT_MS is not set', () => {
    delete process.env.REF_BOOMI_CATCH_API_TIMEOUT_MS;

    const config = SUT.getConfig();
    expect(config.boomiCatchApiTimeoutMs).toBe(90000);
  });

  it('will use REF_BOOMI_CATCH_API_TIMEOUT_MS when set', () => {
    process.env.REF_BOOMI_CATCH_API_TIMEOUT_MS = '12000';

    const config = SUT.getConfig();
    expect(config.boomiCatchApiTimeoutMs).toBe(12000);
  });
});