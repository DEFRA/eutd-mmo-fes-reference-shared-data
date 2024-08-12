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
    process.env.REF_BOOMI_CERTIFICATE = 'ref-boomi-certificate';
    process.env.REF_BOOMI_PASSPHRASE = 'ref-boomi-passphrase';
    process.env.BOOMI_URL = 'boomi-url';
    process.env.EXTERNAL_APP_URL = 'external-app-url';
    process.env.INTERNAL_ADMIN_URL = 'internal-admin-url'

    const config = SUT.getConfig();
    expect(config).toBeDefined();
    expect(config.boomiAuthCertificate).toBe('ref-boomi-certificate');
    expect(config.boomiAuthPassphrase).toBe('ref-boomi-passphrase');
  });

  it('will get config details for alternative values', () => {
    process.env.REF_BOOMI_USER = 'ref-boomi-user';
    process.env.REF_BOOMI_CERTIFICATE = 'none';
    process.env.REF_BOOMI_PASSPHRASE = 'none';
    process.env.BOOMI_URL = 'boomi-url';
    process.env.EXTERNAL_APP_URL = 'external-app-url';
    process.env.INTERNAL_ADMIN_URL = 'internal-admin-url'

    const config = SUT.getConfig();
    expect(config.boomiAuthCertificate).toBeUndefined();
    expect(config.boomiAuthPassphrase).toBeUndefined();
  });
});