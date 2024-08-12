import dotenv from 'dotenv';
dotenv.config();

export const getConfig = () => ({
    boomiAuthUser: process.env.REF_BOOMI_USER,
    boomiAuthCertificate: process.env.REF_BOOMI_CERTIFICATE == 'none' ? undefined : process.env.REF_BOOMI_CERTIFICATE,
    boomiAuthPassphrase: process.env.REF_BOOMI_PASSPHRASE == 'none' ? undefined : process.env.REF_BOOMI_PASSPHRASE,
    boomiUrl: process.env.BOOMI_URL,
    externalAppUrl: process.env.EXTERNAL_APP_URL,
    internalAppUrl: process.env.INTERNAL_ADMIN_URL
});