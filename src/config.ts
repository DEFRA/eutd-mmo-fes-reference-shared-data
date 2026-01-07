import dotenv from 'dotenv';
dotenv.config();

export const getConfig = () => ({
    boomiApiOauthClientId: process.env.REF_BOOMI_API_OAUTH_CLIENT_ID,
    boomiApiOauthClientSecret: process.env.REF_BOOMI_API_OAUTH_CLIENT_SECRET,
    boomiApiOauthTokenUrl: process.env.REF_BOOMI_API_OAUTH_TOKEN_URL,
    boomiAddressLookupApiOauthScope: process.env.REF_BOOMI_API_OAUTH_AL_SCOPE,
    boomiLandingApiOauthScope: process.env.REF_BOOMI_API_OAUTH_MMO_SCOPE,
    boomiCatchApiOauthScope: process.env.REF_BOOMI_CATCH_API_OAUTH_SCOPE,
    boomiAuthUser: process.env.REF_BOOMI_USER,
    boomiUrl: process.env.BOOMI_URL,
    externalAppUrl: process.env.EXTERNAL_APP_URL,
    internalAppUrl: process.env.INTERNAL_ADMIN_URL,
});