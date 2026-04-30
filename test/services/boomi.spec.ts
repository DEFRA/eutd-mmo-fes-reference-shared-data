import axios from "axios";
import { DefaultAzureCredential } from '@azure/identity';
import {
  BoomiService,
  IBoomiAddressResponse,
  IEuUpgradeResponse,
} from '../../src/services/boomi.service';
import {
  mockLandingData,
  mockCatchActivitiesData,
  mockFishingActivitiesData,
  mockSalesNotes,
  mockELogsData
} from '../mockData';
import * as config from '../../src/config';
import logger from "../../src/logger";

const moment = require('moment');
moment.suppressDeprecationWarnings = true;

const { v4: uuid } = require('uuid');

jest.mock('uuid');
jest.mock('axios');
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn()
  }))
}));

const clearBoomiOAuthCache = () => {
  ((BoomiService as unknown) as any).oauthTokenCache?.clear?.();
  ((BoomiService as unknown) as any).oauthTokenInFlight?.clear?.();
  ((BoomiService as unknown) as any).addressCache?.clear?.();
};

describe('The boomi service', () => {

  let mockSendRequest: jest.SpyInstance;
  let mockConfig: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();

    clearBoomiOAuthCache();

    uuid.mockImplementation(() => 'some-uuid-correlation-id');
    mockSendRequest = jest.spyOn(BoomiService, 'sendRequest');
    mockConfig = jest.spyOn(config, 'getConfig');
    mockConfig.mockImplementation(() => ({
      boomiAuthUser: 'ref-boomi-user',
      boomiAuthCertificate: 'ref-boomi-certificate',
      boomiAuthPassphrase: 'ref-boomi-passphrase',
      boomiUrl: 'boomi-url'
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Should throw an error if no action is provided', async () => {
    let err;
    try {
      await BoomiService.queryBoomi('null', { bob: true }, config);
    } catch (e) {
      err = e
    } finally {
      expect(err).toEqual(new Error('Please supply a valid action'));
    }
  });

  it('Should throw an error if no params are provided', async () => {
    let err;
    try {
      await BoomiService.queryBoomi('landing', {}, config);

    } catch (e) {
      err = e
    } finally {
      expect(err).toEqual(new Error('Parameters must be provided'));
    }
  });

  it('Should throw an error if the params are invalid', async () => {
    let err;
    try {
      await BoomiService.queryBoomi('landing', { landingDafte: 'ABC', rssfNumber: '££' }, config);

    } catch (e) {
      err = e
    } finally {
      expect(err).toEqual(new Error('Missing data'));
    }
  });

  it('Should throw an error if the date format is invalid', async () => {
    let err;
    try {
      await BoomiService.queryBoomi('landing', { landingDate: '2012-AA-01', rssNumber: '123' }, config);

    } catch (e) {
      err = e
    } finally {
      expect(err).toEqual(new Error('Invalid date'));
    }

  });

  it('Should encrypt a message in base64', async () => {

    const response = BoomiService.convertToBase64('landing');
    expect(response).toEqual('bGFuZGluZw==');

  });

  it('Should call the endpoint for landings', async () => {
    mockSendRequest.mockResolvedValue(mockLandingData);

    const response = await BoomiService.queryBoomi('landing', { landingDate: '2019-08-15', rssNumber: 'C20515' }, config);

    expect(mockSendRequest).toHaveBeenCalled();
    expect(response.length).toBeGreaterThan(0);
  });

  it('Should call the endpoint for catch Activities (Catch recordings)', async () => {
    mockSendRequest.mockResolvedValue(mockCatchActivitiesData);

    const response = await BoomiService.queryBoomi('catchActivity', { landingDate: '2018-02-02', rssNumber: '123' }, config);

    expect(mockSendRequest).toHaveBeenCalled();
    expect(response).toBe(mockCatchActivitiesData);
  });

  it('Should return null if there is no landings when calling getCatchActivity directly', async () => {
    mockSendRequest.mockResolvedValue(null);

    const response = await BoomiService.getCatchActivity('2018-02-02', '123');

    expect(mockSendRequest).toHaveBeenCalled();
    expect(response).toBe(null);
  });

  it('Should return landings when calling getCatchActivity directly', async () => {
    mockSendRequest.mockResolvedValue(mockCatchActivitiesData);

    const response = await BoomiService.getCatchActivity('2018-02-02', '123');

    expect(mockSendRequest).toHaveBeenCalled();
    expect(response).toBe(mockCatchActivitiesData);
  });

  it('Should not throw an error if there is no page object when calling getCatchActivity with version 2 of the catch activity api', async () => {
    mockSendRequest.mockResolvedValue(mockFishingActivitiesData);

    const response = await BoomiService.getCatchActivity('2019-12-02', '123');

    expect(mockSendRequest).toHaveBeenCalled();
    expect(response).toBe(mockFishingActivitiesData);
  });

  it('Should call the endpoint for sales notes', async () => {
    mockSendRequest.mockResolvedValue(mockSalesNotes);

    const response = await BoomiService.queryBoomi('salesNotes', { landingDate: '2018-02-02', rssNumber: 'A21802' }, config);

    expect(mockSendRequest).toHaveBeenCalled();
    expect(response).toBe(mockSalesNotes);
  });

  it('Should call the endpoint for eLogs', async () => {
    mockSendRequest.mockResolvedValue(mockELogsData);

    const response = await BoomiService.queryBoomi('eLogs', { landingDate: '2018-02-03', rssNumber: 'C20514' }, config);

    expect(mockSendRequest).toHaveBeenCalled();
    expect(response).toBe(mockELogsData);

  });

  it('Should not call the CEFAS service multiple times to handle summertime / UTC overlaps', async () => {
    mockSendRequest.mockResolvedValue([]);

    await BoomiService.getLandingData('2019-07-01', 'rssNumber', 'landing');

    const expectedReqHeaders = {
      CustomerID: "MMO",
      MethodID: "landingdeclarationvalidation",
      RequestID: "some-uuid-correlation-id",
      ServiceID: "landingdeclaration",
      Timestamp: expect.any(String),
      UserID: "ref-boomi-user"
    }

    expect(mockSendRequest).toHaveBeenCalledTimes(1);
    expect(mockSendRequest).toHaveBeenCalledWith('landing', expectedReqHeaders, 'boomi-url', { landingDate: "2019-07-01", rssNumber: "rssNumber" });
  });

  it('Should call the CEFAS service once when not in summertime', async () => {
    mockSendRequest.mockResolvedValue([]);

    await BoomiService.getLandingData('2019-11-01', 'rssNumber', 'landing');

    expect(mockSendRequest).toHaveBeenCalledTimes(1);
  });

  it('Should return an array containing a single array when calling a single day for landing data', async () => {
    mockSendRequest.mockResolvedValue([]);

    const spy = jest.spyOn(BoomiService, 'sendRequest');
    spy.mockResolvedValueOnce(['landing 1', 'landing 2']);
    spy.mockResolvedValueOnce(['landing 3', 'landing 4']);

    const response = await BoomiService.getLandingData('2019-11-01', 'rssNumber', 'landing');

    expect(response).toEqual([['landing 1', 'landing 2']]);
  });

  it('Should return a single array containing a single array when calling in BST for landing data', async () => {
    mockSendRequest.mockResolvedValueOnce(['landing 1', 'landing 2']);
    mockSendRequest.mockResolvedValueOnce(['landing 3', 'landing 4']);

    const response = await BoomiService.getLandingData('2019-07-01', 'rssNumber', 'landing');

    expect(response).toEqual([['landing 1', 'landing 2']]);

  });

  it('Should filter out null results', async () => {
    mockSendRequest.mockResolvedValueOnce(null);
    mockSendRequest.mockResolvedValueOnce(['landing 3', 'landing 4']);

    const response = await BoomiService.getLandingData('2019-07-01', 'rssNumber', 'landing');

    expect(response).toEqual([]);
  });

  it('Should not filter out empty arrays', async () => {
    mockSendRequest.mockResolvedValueOnce([]);
    mockSendRequest.mockResolvedValueOnce(['landing 3', 'landing 4']);

    const response = await BoomiService.getLandingData('2019-07-01', 'rssNumber', 'landing');

    expect(response).toEqual([[]]);
  });

});

describe('Boomi callingUrl', () => {

  it('FishingActivities', () => {
    const result = BoomiService.callingURL({ rssNumber: 'rssNumber', landingDate: '2019-01-01' }, 'catchActivity');
    expect(result).toBe('/api/ecc/v1.0/FishingActivities?rssNumber=rssNumber&landingDate=2019-01-01&version=v2');
  });

  it('Landings Dec', () => {

    const result = BoomiService.callingURL({ rssNumber: 'rssNumber', landingDate: '2019-01-01' }, 'landing');
    expect(result).toBe('/api/ecc/v1.0/LandingDeclarations?rssNumber=rssNumber&landingDate=2019-01-01');
  });

  it('Sales Notes', () => {

    const result = BoomiService.callingURL({ rssNumber: 'rssNumber', landingDate: '2019-01-01' }, 'salesNotes');
    expect(result).toBe('/api/ecc/v1.0/SalesNotes?rssNumber=rssNumber&landingDate=2019-01-01');
  });

  it('Elogs', () => {
    const result = BoomiService.callingURL({ rssNumber: 'rssNumber', landingDate: '2019-01-01' }, 'eLogs');
    expect(result).toBe('/api/ecc/v1.0/elogs?rssNumber=rssNumber&landingDate=2019-01-01');
  });

  it('address', () => {
    const result = BoomiService.callingURL({ postcode: 'AB1 1AB' }, 'address');
    expect(result).toBe('/api/address-lookup/v1.0/postcodes?postcode=AB1%201AB');
  });

});

describe('getAddresses', () => {

  let mockSendRequest: jest.SpyInstance;
  let mockMapAddresses: jest.SpyInstance;
  let mockConfig: jest.SpyInstance;

  beforeEach(() => {
    clearBoomiOAuthCache();

    mockSendRequest = jest.spyOn(BoomiService, 'sendRequest');
    mockSendRequest.mockResolvedValue(null);

    mockMapAddresses = jest.spyOn(BoomiService, 'mapAddresses');
    mockMapAddresses.mockResolvedValue(['address']);

    mockConfig = jest.spyOn(config, 'getConfig');
    mockConfig.mockImplementation(() => ({
      boomiAuthUser: 'ref-boomi-user',
      boomiAuthCertificate: 'ref-boomi-certificate',
      boomiAuthPassphrase: 'ref-boomi-passphrase',
      boomiUrl: 'boomi-url'
    }));

    uuid.mockReturnValue('some-uuid');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will return an empty array if sendRequest returns null with an empty string', async () => {
    mockSendRequest.mockResolvedValue(null);

    const result = await BoomiService.getAddresses();

    expect(result).toStrictEqual([]);
  });

  it('will call sendRequest with the correct parameters', async () => {
    const postcode = 'AB1 1AB'

    await BoomiService.getAddresses(postcode);

    const expectedHeaders = expect.objectContaining({
      UserID: 'ref-boomi-user',
      CustomerID: 'MMO',
      Timestamp: expect.any(String),
      RequestID: 'some-uuid'
    });

    expect(mockSendRequest).toHaveBeenCalledWith(
      'address',
      expectedHeaders,
      'boomi-url',
      {
        postcode: postcode
      }
    );
  });

  it('will return an empty array if sendRequest returns null', async () => {
    mockSendRequest.mockResolvedValue(null);

    const result = await BoomiService.getAddresses('AB1 1AB');

    expect(result).toStrictEqual([]);
  });

  it('will map and return addresses if sendRequest returns a result', async () => {
    const apiResponse = { test: 'test' };
    const mappedAddresses = ['address 1', 'address 2'];

    mockSendRequest.mockResolvedValue(apiResponse);
    mockMapAddresses.mockResolvedValue(mappedAddresses);

    const result = await BoomiService.getAddresses('AB1 1AB');

    expect(mockMapAddresses).toHaveBeenCalledWith(apiResponse);
    expect(result).toStrictEqual(mappedAddresses);
  });

  it('will not catch any errors from sendRequest', async () => {
    const error = new Error('something went wrong');

    mockSendRequest.mockRejectedValue(error);

    await expect(BoomiService.getAddresses('AB1 1AB')).rejects.toThrow(error);
  });

});

describe('mapAddresses', () => {

  const minimumAddress = {
    AddressLine: 'ADDRESSLINE',
    Town: 'TOWN',
    Postcode: 'POSTCODE'
  }

  const fullAddress = {
    ...minimumAddress,
    SubBuildingName: 'SUBBUILDINGNAME',
    BuildingNumber: 'BUILDINGNUMBER',
    BuildingName: 'BUILDINGNAME',
    Street: 'STREET',
    Locality: 'LOCALITY',
    DependentLocality: 'DEPENDENTLOCALITY',
    County: 'COUNTY',
    Country: 'COUNTRY',
    XCoordinate: 111111,
    YCoordinate: 111111,
    UPRN: 'UPRN',
    Match: 'MATCH',
    MatchDescription: 'MATCHDESCRIPTION',
    Language: 'LANGUAGE'
  };

  it('will handle no results', () => {
    const input: IBoomiAddressResponse = {};

    expect(BoomiService.mapAddresses(input)).toStrictEqual([]);
  });

  it('will handle empty results when null', () => {
    const input: IBoomiAddressResponse | undefined = undefined;

    expect(BoomiService.mapAddresses(input)).toStrictEqual([]);
  });

  it('will handle empty results', () => {
    const input: IBoomiAddressResponse = {
      results: []
    };

    expect(BoomiService.mapAddresses(input)).toStrictEqual([]);
  });

  it('will map an address with no optional fields', () => {
    const input: IBoomiAddressResponse = {
      results: [{ Address: minimumAddress }]
    };

    const result = BoomiService.mapAddresses(input);

    expect(result).toStrictEqual([
      {
        address_line: "ADDRESSLINE",
        city: 'TOWN',
        postCode: 'POSTCODE'
      }
    ])
  });

  it('will map an address with every optional field', () => {
    const input: IBoomiAddressResponse = {
      results: [{ Address: fullAddress }]
    };

    const result = BoomiService.mapAddresses(input);

    expect(result).toStrictEqual([
      {
        address_line: "ADDRESSLINE",
        building_number: 'BUILDINGNUMBER',
        sub_building_name: 'SUBBUILDINGNAME',
        building_name: 'BUILDINGNAME',
        street_name: 'STREET',
        county: 'COUNTY',
        country: 'COUNTRY',
        city: 'TOWN',
        postCode: 'POSTCODE',
      }
    ])
  });

  it('will map multiple addresses', () => {
    const input: IBoomiAddressResponse = {
      results: [
        {
          Address: {
            AddressLine: 'ADDRESSLINE1',
            Town: 'TOWN1',
            Postcode: 'POSTCODE1'
          }
        },
        {
          Address: {
            AddressLine: 'ADDRESSLINE2',
            Town: 'TOWN2',
            Postcode: 'POSTCODE2'
          }
        },
      ]
    };

    const result = BoomiService.mapAddresses(input);

    expect(result).toStrictEqual([
      {
        address_line: "ADDRESSLINE1",
        city: 'TOWN1',
        postCode: 'POSTCODE1'
      },
      {
        address_line: "ADDRESSLINE2",
        city: 'TOWN2',
        postCode: 'POSTCODE2'
      }
    ])
  });

});

describe('call sendRequest', () => {

  const reqHeaders = {
    ServiceID: 'landingdeclaration',
    UserID: 'boomi-auth-user',
    CustomerID: 'MMO',
    Timestamp: 'some-time-stamp',
    MethodID: 'landingdeclarationvalidation',
    RequestID: 'some-uuid-user-for-request-id'
  }

  const mockOAuthResponse = {
    token_type: 'Bearer',
    expires_in: 3600,
    ext_expires_in: 3600,
    access_token: 'access token 1234'
  };

  let mockAxiosPost: jest.SpyInstance;
  let mockAxiosGet: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;
  let mockConfig: jest.SpyInstance;

  beforeEach(() => {
    clearBoomiOAuthCache();

    // Use the OAuth2 local-dev path by providing client credentials in config
    mockAxiosPost = jest.spyOn(axios, 'post');
    mockAxiosPost.mockResolvedValue({ status: 200, data: mockOAuthResponse });

    mockAxiosGet = jest.spyOn(axios, 'get');
    mockAxiosGet.mockResolvedValue({
      status: 200,
      data: null
    });

    mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerInfo = jest.spyOn(logger, 'info');

    mockConfig = jest.spyOn(config, 'getConfig');
    mockConfig.mockImplementation(() => ({
      boomiAuthUser: 'ref-boomi-user',
      boomiUrl: 'boomi-url',
      boomiApiOauthClientId: 'client-id',
      boomiApiOauthClientSecret: 'client-secret',
      boomiApiOauthTokenUrl: 'token-url',
      boomiAddressLookupApiOauthScope: 'al_scope',
      boomiLandingApiOauthScope: 'landing-scope',
    }));
  });

  afterEach(() => {
    mockAxiosPost.mockRestore();
    mockAxiosGet.mockRestore();
    mockLoggerError.mockRestore();
    mockLoggerInfo.mockRestore();
    mockConfig.mockRestore();
  });

  it('will send request', async () => {

    const response = await BoomiService.sendRequest('address', reqHeaders, "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosPost).toHaveBeenCalled();
    expect(mockAxiosGet).toHaveBeenCalled();
    expect(response).toBeNull();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][address][REQUESTING-OAUTH-TOKEN]');
  });

  it('will send request with landing', async () => {

    const response = await BoomiService.sendRequest('landing', reqHeaders, "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosPost).toHaveBeenCalled();
    expect(mockAxiosGet).toHaveBeenCalled();
    expect(response).toBeNull();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][landing][REQUESTING-OAUTH-TOKEN]');
  });

  it('should call the sendRequest and throw token error', async () => {
    const error = { response: undefined };
    mockAxiosPost.mockRejectedValue(error);

    await expect(BoomiService.sendRequest('address', reqHeaders, "/url", { postcode: 'AB1 1AB' })).rejects.toThrow();

    expect(mockLoggerError).toHaveBeenCalledWith(`[BOOMI-SERVICE][address][ERROR][UNABLE-TO-GET-OAUTH-TOKEN][${error}]`);
  });

  it('will return null if no data is found', async () => {

    const response = await BoomiService.sendRequest('address', reqHeaders, "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosPost).toHaveBeenCalled();
    expect(mockAxiosGet).toHaveBeenCalled();
    expect(response).toBeNull();
  });

  it('will return landing data if found', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: { landingData: 'landing declaration' } });

    const response = await BoomiService.sendRequest('address', reqHeaders, "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosPost).toHaveBeenCalled();
    expect(mockAxiosGet).toHaveBeenCalled();
    expect(response).toEqual({ landingData: 'landing declaration' });
  });

  it('should call the sendRequest and log error', async () => {
    const error = { response: null };
    mockAxiosGet.mockRejectedValue(error);

    const response = await BoomiService.sendRequest('address', reqHeaders, "/url", { postcode: 'AB1 1AB' });

    expect(mockLoggerError).toHaveBeenCalledWith(`[BOOMI-SERVICE][address][API][ERROR] ${error}`);
    expect(response).toBeUndefined();
  });

  it('should call the sendRequest and throw error', async () => {
    const error = { response: undefined };
    mockAxiosGet.mockRejectedValue(error);

    await expect(BoomiService.sendRequest('address', reqHeaders, "/url", { postcode: 'AB1 1AB' })).rejects.toThrow();

    expect(mockLoggerError).toHaveBeenCalledWith(`[BOOMI-SERVICE][address][API][ERROR] ${error}`);
  });

  it('should call the sendRequest and throw specific error', async () => {
    const error = {
      response: {
        status: 504,
        statusText: 'something has gone wrong',
        headers: { x_header: 'something' },
        data: { landing: 'error' }
      }
    }
    mockAxiosGet.mockRejectedValue(error);

    await expect(BoomiService.sendRequest('address', reqHeaders, "/url", { postcode: 'AB1 1AB' })).rejects.toThrow();

    expect(mockLoggerError).toHaveBeenCalledWith(`[BOOMI-SERVICE][address][API][ERROR] ${error}`);
    expect(mockLoggerError).toHaveBeenCalledWith("[BOOMI-SERVICE][address][API][ERROR][RESPONSE][STATUS]", 504);
    expect(mockLoggerError).toHaveBeenCalledWith("[BOOMI-SERVICE][address][API][ERROR][RESPONSE][DATA]", { "landing": 'error' });
  });

});

describe('CATCH API Integration (FI0-10355)', () => {
  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;

  beforeEach(() => {
    mockLoggerInfo = jest.spyOn(logger, 'info').mockImplementation(() => { });
    mockLoggerError = jest.spyOn(logger, 'error').mockImplementation(() => { });

    clearBoomiOAuthCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('getEntraOAuthToken', () => {
    let mockAxiosPost: jest.SpyInstance;
    let mockGetToken: jest.Mock;
    let mockConfig: jest.SpyInstance;

    const mockExpiresOnTimestamp = Date.now() + 3_600_000;
    const mockOAuth2Response = {
      token_type: 'Bearer',
      expires_in: 3600,
      ext_expires_in: 3600,
      access_token: 'test-token'
    };

    beforeEach(() => {
      mockAxiosPost = jest.spyOn(axios, 'post');
      mockGetToken = jest.fn();
      (DefaultAzureCredential as jest.Mock).mockImplementation(() => ({ getToken: mockGetToken }));
      mockConfig = jest.spyOn(config, 'getConfig');
    });

    afterEach(() => {
      mockAxiosPost.mockRestore();
      mockConfig.mockRestore();
    });

    describe('local development (OAuth2 client credentials)', () => {
      beforeEach(() => {
        mockConfig.mockReturnValue({
          boomiApiOauthClientId: 'client-id',
          boomiApiOauthClientSecret: 'client-secret',
          boomiApiOauthTokenUrl: 'https://token-url',
          boomiCatchApiOauthScope: 'catch-scope',
          boomiLandingApiOauthScope: 'landing-scope',
          boomiAddressLookupApiOauthScope: 'address-scope'
        } as any);
      });

      it('should use OAuth2 for catchSubmit when client credentials are configured', async () => {
        mockAxiosPost.mockResolvedValue({ data: { ...mockOAuth2Response, access_token: 'test-token-catchSubmit' } });

        const result = await BoomiService.getEntraOAuthToken('catchSubmit');

        expect(mockAxiosPost).toHaveBeenCalled();
        expect(mockGetToken).not.toHaveBeenCalled();
        expect(result.access_token).toBe('test-token-catchSubmit');
        expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][catchSubmit][AUTH-MODE][OAUTH2-CLIENT-CREDENTIALS]');
        expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][catchSubmit][OAUTH-TOKEN-RECEIVED]');
      });

      it('should use OAuth2 for landing when client credentials are configured', async () => {
        mockAxiosPost.mockResolvedValue({ data: { ...mockOAuth2Response, access_token: 'test-token-landing' } });

        const result = await BoomiService.getEntraOAuthToken('landing');

        expect(mockAxiosPost).toHaveBeenCalled();
        expect(result.access_token).toBe('test-token-landing');
        expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][landing][AUTH-MODE][OAUTH2-CLIENT-CREDENTIALS]');
      });

      it('should throw when OAuth2 token request fails', async () => {
        mockAxiosPost.mockRejectedValue(new Error('Network error'));

        await expect(BoomiService.getEntraOAuthToken('catchSubmit')).rejects.toThrow('Failed to get catchSubmit OAuth token: Network error');
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('[BOOMI-SERVICE][catchSubmit][ERROR]'));
      });
    });

    describe('Azure (Managed Identity)', () => {
      beforeEach(() => {
        mockConfig.mockReturnValue({
          // no boomiApiOauthClientId => managed identity path
          boomiCatchApiOauthScope: 'catch-scope',
          boomiLandingApiOauthScope: 'landing-scope',
          boomiAddressLookupApiOauthScope: 'address-scope'
        } as any);
      });

      it('should use managed identity for catchSubmit when no client credentials', async () => {
        mockGetToken.mockResolvedValue({ token: 'test-token-catchSubmit', expiresOnTimestamp: mockExpiresOnTimestamp });

        const result = await BoomiService.getEntraOAuthToken('catchSubmit');

        expect(mockGetToken).toHaveBeenCalled();
        expect(mockAxiosPost).not.toHaveBeenCalled();
        expect(result.token_type).toBe('Bearer');
        expect(result.access_token).toBe('test-token-catchSubmit');
        expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][catchSubmit][AUTH-MODE][MANAGED-IDENTITY]');
        expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][catchSubmit][OAUTH-TOKEN-RECEIVED]');
      });

      it('should use managed identity for landing', async () => {
        mockGetToken.mockResolvedValue({ token: 'test-token-landing', expiresOnTimestamp: mockExpiresOnTimestamp });

        const result = await BoomiService.getEntraOAuthToken('landing');

        expect(result.access_token).toBe('test-token-landing');
        expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][landing][AUTH-MODE][MANAGED-IDENTITY]');
      });

      it('should use managed identity for catchActivity', async () => {
        mockGetToken.mockResolvedValue({ token: 'test-token-catchactivity', expiresOnTimestamp: mockExpiresOnTimestamp });

        const result = await BoomiService.getEntraOAuthToken('catchActivity');

        expect(result.access_token).toBe('test-token-catchactivity');
      });

      it('should throw when managed identity fails', async () => {
        mockGetToken.mockRejectedValue(new Error('Network error'));

        await expect(BoomiService.getEntraOAuthToken('catchSubmit')).rejects.toThrow('Failed to get catchSubmit OAuth token: Network error');
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('[BOOMI-SERVICE][catchSubmit][ERROR]'));
      });

      it('should handle failure with stack trace', async () => {
        mockGetToken.mockRejectedValue({ stack: 'Error stack trace here' });

        await expect(BoomiService.getEntraOAuthToken('catchSubmit')).rejects.toThrow('Failed to get catchSubmit OAuth token:');
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Error stack trace here'));
      });

      it('should handle failure without stack or message', async () => {
        mockGetToken.mockRejectedValue('Simple string error');

        await expect(BoomiService.getEntraOAuthToken('catchSubmit')).rejects.toThrow('Failed to get catchSubmit OAuth token: Simple string error');
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Simple string error'));
      });
    });
  });

  describe('sendDocumentToBoomi', () => {
    let mockAxiosPost: jest.SpyInstance;
    let mockGetEntraOAuthToken: jest.SpyInstance;

    beforeEach(() => {
      mockAxiosPost = jest.spyOn(axios, 'post');
      mockGetEntraOAuthToken = jest.spyOn(BoomiService, 'getEntraOAuthToken');
    });

    it('should successfully submit catch certificate', async () => {
      const mockPayload = {
        CreateCatchCertificateRequest: {
          SPSCertificate: {
            certificateId: 'CERT-123',
            exporterName: 'Test Exporter'
          }
        }
      };

      const mockTokenResponse = {
        token_type: 'Bearer',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'test-access-token'
      };

      const mockApiResponse = {
        status: 'OK',
        statusCode: '202',
        message: 'Accepted'
      };

      mockGetEntraOAuthToken.mockResolvedValue(mockTokenResponse);
      mockAxiosPost.mockResolvedValue({ data: mockApiResponse, status: 200 });

      const result = await BoomiService.sendDocumentToBoomi(mockPayload, { documentType: 'CATCHCERTIFICATE' }, 'catchSubmit');

      expect(result).toEqual(mockApiResponse);
      expect(mockGetEntraOAuthToken).toHaveBeenCalledWith('catchSubmit');
      expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][catchSubmit][SUBMITTING-CATCHCERTIFICATE]');
    });

    it('should handle API error with response', async () => {
      const mockPayload = {
        CreateCatchCertificateRequest: {
          SPSCertificate: { certificateId: 'CERT-123' }
        }
      };
      const mockTokenResponse = {
        token_type: 'Bearer',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'test-access-token'
      };

      const mockError = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid payload' }
        }
      };

      mockGetEntraOAuthToken.mockResolvedValue(mockTokenResponse);
      mockAxiosPost.mockRejectedValue(mockError);

      await expect(BoomiService.sendDocumentToBoomi(mockPayload, { documentType: 'CATCHCERTIFICATE' }, 'catchSubmit')).rejects.toThrow('CATCHCERTIFICATE API error: 400 - Bad Request');
      expect(mockLoggerError).toHaveBeenCalledWith('[BOOMI-SERVICE][catchSubmit][ERROR][RESPONSE][STATUS]', 400);
    });

    it('should handle API error without response', async () => {
      const mockPayload = {
        CreateCatchCertificateRequest: {
          SPSCertificate: { certificateId: 'CERT-123' }
        }
      };
      const mockTokenResponse = {
        token_type: 'Bearer',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'test-access-token'
      };

      const mockError = new Error('Network error');

      mockGetEntraOAuthToken.mockResolvedValue(mockTokenResponse);
      mockAxiosPost.mockRejectedValue(mockError);

      await expect(BoomiService.sendDocumentToBoomi(mockPayload, { documentType: 'CATCHCERTIFICATE' }, 'catchSubmit')).rejects.toThrow('Failed to submit CATCHCERTIFICATE: Network error');
    });

    it('should handle error without message property', async () => {
      const mockPayload = {
        CreateCatchCertificateRequest: {
          SPSCertificate: { certificateId: 'CERT-123' }
        }
      };
      const mockTokenResponse = {
        token_type: 'Bearer',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'test-access-token'
      };

      // Error without message property
      const mockError = 'String error without message property';

      mockGetEntraOAuthToken.mockResolvedValue(mockTokenResponse);
      mockAxiosPost.mockRejectedValue(mockError);

      await expect(BoomiService.sendDocumentToBoomi(mockPayload, { documentType: 'CATCHCERTIFICATE' }, 'catchSubmit')).rejects.toThrow('Failed to submit CATCHCERTIFICATE: String error without message property');
    });
  });

  describe('processEuUpgradeCallback', () => {
    it('should successfully process successful EU upgrade callback with SOAP envelope', () => {
      const callbackData = {
        Envelope: {
          Header: {
            Message: {
              severity: 'debugging',
              ID: 'WS_REQUEST_ID',
              Message: '4f387b5b-1616-444c-9870-a131da173efc'
            },
            Security: {
              TimestampType: {
                Created: '2025-07-31T16:59:07.375+02:00',
                Expires: '2025-07-31T16:59:12.375+02:00'
              }
            }
          },
          Body: {
            SubmitCatchResponse: {
              SPSAcknowledgement: {
                SPSAcknowledgementDocument: {
                  IssueDateTime: {
                    DateTime: '2025-07-31T16:59:06.732+02:00'
                  },
                  StatusCode: {
                    "@name": "Issued (Validated)",
                    text: "70"
                  },
                  ReasonInformation: 'Message has been successfully processed',
                  fesDocNumber: "GBR-2026-CC-3FD5E066",
                  ReferenceSPSReferencedDocument: [
                    {
                      TypeCode: {
                        name: 'Certificate (Catch Certificate)',
                        value: '16'
                      },
                      RelationshipTypeCode: {
                        name: 'Document reference, internal (Document reference, internal)',
                        value: 'CAW'
                      },
                      ID: {
                        text: 'CATCH.CC.GB.2025.0000083'
                      },
                      AttachmentBinaryObject: {
                        '@format': 'url',
                        '@mimeCode': 'text/url',
                        '@uri': 'https://webgate.acceptance.ec.europa.eu/tracesnt-beta/certificate/catch-certificate/CATCH.CC.GB.2025.0000083'
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      const result: IEuUpgradeResponse = BoomiService.processEuUpgradeCallback(callbackData);

      // Verify it's a success response
      expect(result.euCatchStatus).toBe('SUCCESS');
      expect(result.euCatchReferenceNumber).toBe('CATCH.CC.GB.2025.0000083');
      expect(result.euCatchStatusCode).toBe('70');
      expect(result.euCatchStatusName).toBe('Issued (Validated)');
      expect(result.euCatchUri).toBe('https://webgate.acceptance.ec.europa.eu/tracesnt-beta/certificate/catch-certificate/CATCH.CC.GB.2025.0000083');
      expect(result.euCatchTimestamp).toBe('2025-07-31T16:59:06.732+02:00');
      expect(result.reasonInformation).toBe('Message has been successfully processed');

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][SUCCESS][ID:CATCH.CC.GB.2025.0000083]')
      );
    });

    it('should successfully process failed EU upgrade callback with SOAP envelope', () => {
      const callbackData = {
        Envelope: {
          Header: {
            Message: {
              severity: 'debugging',
              ID: 'WS_REQUEST_ID',
              Message: 'b62c0a35-839f-4d90-b745-4bbb8ab0f384'
            }
          },
          Body: {
            Fault: {
              faultcode: 'S:Client',
              faultstring: 'Some business rules are not met',
              fesDocNumber: "GBR-2026-CC-3FD5E066",
              detail: {
                BusinessRulesValidationException: {
                  Error: [
                    {
                      ID: 'SPS-CONSIGNOR-NOT-FOUND',
                      Message: {
                        languageID: 'en',
                        text: 'ID not found or not compatible'
                      },
                      Field: {
                        languageID: 'en',
                        text: '/SPSCertificate/SPSConsignment/ConsignorSPSParty'
                      }
                    },
                    {
                      ID: 'CATCH-WS-020',
                      Message: {
                        languageID: 'en',
                        text: '[en] catch.ws.invalid.vessel.fishing.gear.found'
                      },
                      Field: {
                        languageID: 'en',
                        text: ''
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      const result = BoomiService.processEuUpgradeCallback(callbackData);

      // Verify it's a failure response
      expect(result.euCatchStatus).toBe('FAILURE');

      // Use type assertion since TypeScript doesn't narrow properly in tests
      expect(result.faultCode).toBe('S:Client');
      expect(result.faultString).toBe('Some business rules are not met');
      expect(result.validationErrors).toHaveLength(2);
      expect(result.validationErrors?.[0].errorId).toBe('SPS-CONSIGNOR-NOT-FOUND');
      expect(result.validationErrors?.[0].errorMessage).toBe('ID not found or not compatible');
      expect(result.validationErrors?.[0].errorField).toBe('/SPSCertificate/SPSConsignment/ConsignorSPSParty');
      expect(result.validationErrors?.[1].errorId).toBe('CATCH-WS-020');
    });

    it('should throw error when envelope structure is invalid', () => {
      const callbackData = {
        Envelope: {
          Header: {
            Message: {
              severity: 'debugging',
              ID: 'WS_REQUEST_ID',
              Message: 'test-request-id'
            }
          },
          Body: {}
        }
      };

      expect(() => BoomiService.processEuUpgradeCallback(callbackData as any)).toThrow('Failed to process EU upgrade callback: Unknown callback payload structure - neither success nor fault response');
    });

    it('should throw error when envelope is missing', () => {
      const callbackData = {} as any;

      expect(() => BoomiService.processEuUpgradeCallback(callbackData)).toThrow('Failed to process EU upgrade callback: Invalid callback payload structure');
    });

    it('should process a pending response from Boomi', () => {
      const callbackData = {
        CatchCertificateResponse: {
          status: "IN_PROGRESS",
          statusMessage: "Catch certificate is being retried.",
          fesDocNumber: "GBR-2025-CC-0E8E95F97"
        }
      } as any;

      const result = BoomiService.processEuUpgradeCallback(callbackData);

      expect(result.euCatchStatus).toBe('IN_PROGRESS');
      expect(result.documentNumber).toBe('GBR-2025-CC-0E8E95F97');
      expect(result.euCatchStatusMessage).toBe('Catch certificate is being retried.');
    });

    it('should process a server error response from Boomi', () => {
      const callbackData = {
        Envelope: {
          Body: {
            Fault: {
              faultcode: "S:Server",
              faultstring: "bad unexpected thing",
              fesDocNumber: "GBR-2025-CC-E45C5652D"
            }
          }
        }
      } as any;

      const result = BoomiService.processEuUpgradeCallback(callbackData);

      expect(result.euCatchStatus).toBe('FAILURE');
      expect(result.documentNumber).toBe('GBR-2025-CC-E45C5652D');
      expect(result.faultCode).toBe('S:Server');
      expect(result.faultString).toBe('bad unexpected thing');
    });

    it('should throw error when callbackdata is missing', () => {
      expect(() => BoomiService.processEuUpgradeCallback(undefined)).toThrow('Failed to process EU upgrade callback: Invalid callback payload structure');
    });

    it('should handle error without message property', () => {
      const callbackData = {
        Envelope: {
          Header: {
            Message: {
              severity: 'debugging',
              ID: 'WS_REQUEST_ID',
              Message: 'test-request-id'
            }
          },
          Body: {
            SubmitCatchResponse: {
              SPSAcknowledgement: {
                SPSAcknowledgementDocument: {
                  ReferenceSPSReferencedDocument: null // This will cause TypeError
                }
              }
            }
          }
        }
      };

      expect(() => BoomiService.processEuUpgradeCallback(callbackData as any)).toThrow('Failed to process EU upgrade callback:');
      expect(mockLoggerError).toHaveBeenCalledWith('[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][ERROR][Cannot read properties of null (reading \'0\')]');
    });
  });
});

// Additional migrated lightweight tests from test/boomi.service.test.ts
describe('Migrated BoomiService lightweight tests', () => {

  let mockGetToken: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    clearBoomiOAuthCache();

    // default config used by these migrated tests
    jest.spyOn(config, 'getConfig').mockReturnValue({
      boomiAuthUser: 'test-user',
      boomiUrl: 'https://boomi.test',
      boomiLandingApiOauthScope: 'scope',
      boomiAddressLookupApiOauthScope: 'scope',
      boomiCatchApiOauthScope: 'scope'
    } as any);

    mockGetToken = jest.fn();
    (DefaultAzureCredential as jest.Mock).mockImplementation(() => ({ getToken: mockGetToken }));
  });

  test('mapAddresses maps API response correctly (migrated)', () => {
    const apiResponse = {
      results: [
        {
          Address: {
            AddressLine: '1 Test St',
            BuildingNumber: '1',
            SubBuildingName: 'Flat 1',
            BuildingName: 'Test Building',
            Street: 'Test Street',
            Town: 'Testtown',
            County: 'Testshire',
            Postcode: 'TS1 1ST',
            Country: 'UK'
          }
        }
      ]
    } as any;

    const mapped = BoomiService.mapAddresses(apiResponse);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].address_line).toBe('1 Test St');
    expect(mapped[0].building_number).toBe('1');
    expect(mapped[0].sub_building_name).toBe('Flat 1');
    expect(mapped[0].postCode).toBe('TS1 1ST');
    expect(mapped[0].city).toBe('Testtown');
  });

  test('getAddresses caches results and calls sendRequest once (migrated)', async () => {
    const apiResponse = { results: [] };
    const spySend = jest.spyOn(BoomiService as any, 'sendRequest').mockResolvedValue(apiResponse);

    const first = await BoomiService.getAddresses('TS1 1ST');
    const second = await BoomiService.getAddresses('ts1 1st'); // different casing should hit cache

    expect(spySend).toHaveBeenCalledTimes(1);
    expect(first).toEqual([]);
    expect(second).toEqual([]);
  });

  test('getEntraOAuthToken caches token and handles in-flight requests (migrated)', async () => {
    const mockExpiresOnTimestamp = Date.now() + 3_600_000;
    mockGetToken.mockResolvedValue({ token: 'abc', expiresOnTimestamp: mockExpiresOnTimestamp });

    const p1 = BoomiService.getEntraOAuthToken('catchSubmit' as any);
    const p2 = BoomiService.getEntraOAuthToken('catchSubmit' as any);

    const [t1, t2] = await Promise.all([p1, p2]);

    expect(mockGetToken).toHaveBeenCalledTimes(1);
    expect(t1.access_token).toBe('abc');
    expect(t2.access_token).toBe('abc');

    // subsequent call should hit cache (no more credential calls)
    const t3 = await BoomiService.getEntraOAuthToken('catchSubmit' as any);
    expect(mockGetToken).toHaveBeenCalledTimes(1);
    expect(t3.access_token).toBe('abc');
  });

  test('processEuUpgradeCallback handles success response (migrated)', () => {
    const callbackData: any = {
      Envelope: {
        Body: {
          SubmitCatchResponse: {
            SPSAcknowledgement: {
              SPSAcknowledgementDocument: {
                IssueDateTime: { DateTime: '2026-03-26T12:00:00Z' },
                StatusCode: { text: '200', '@name': 'OK' },
                ReasonInformation: 'All good',
                fesDocNumber: 'FES123',
                ReferenceSPSReferencedDocument: [
                  {
                    ID: { text: 'REF123' },
                    AttachmentBinaryObject: { '@uri': 'https://example.com/doc.pdf' }
                  }
                ]
              }
            }
          }
        }
      }
    };

    const res = BoomiService.processEuUpgradeCallback(callbackData);
    expect(res.euCatchStatus).toBe('SUCCESS');
    expect(res.documentNumber).toBe('FES123');
    expect(res.euCatchReferenceNumber).toBe('REF123');
    expect(res.euCatchUri).toBe('https://example.com/doc.pdf');
    expect(res.euCatchStatusCode).toBe('200');
    expect(res.euCatchStatusName).toBe('OK');
  });

  test('processEuUpgradeCallback handles fault response with validation errors (migrated)', () => {
    const callbackData: any = {
      Envelope: {
        Body: {
          Fault: {
            fesDocNumber: 'FES999',
            faultcode: 'Server',
            faultstring: 'Validation failed',
            detail: {
              BusinessRulesValidationException: {
                Error: [
                  { ID: 'E1', Message: { text: 'Bad field' }, Field: { text: 'field1' } }
                ]
              }
            }
          }
        }
      }
    };

    const res = BoomiService.processEuUpgradeCallback(callbackData);
    expect(res.euCatchStatus).toBe('FAILURE');
    expect(res.documentNumber).toBe('FES999');
    expect(res.validationErrors).toBeDefined();
    expect(res.validationErrors?.[0].errorId).toBe('E1');
  });

  test('processEuUpgradeCallback handles pending/other top-level response (migrated)', () => {
    const callbackData: any = {
      CatchCertificateResponse: {
        status: 'IN_PROGRESS',
        fesDocNumber: 'FES555',
        statusMessage: 'Queued'
      }
    };

    const res = BoomiService.processEuUpgradeCallback(callbackData);
    expect(res.euCatchStatus).toBe('IN_PROGRESS');
    expect(res.documentNumber).toBe('FES555');
    expect(res.euCatchStatusMessage).toBe('Queued');
  });

  test('sendDocumentToBoomi retries on transient error and succeeds (migrated)', async () => {
    // ensure getEntraOAuthToken returns token without calling credential
    jest.spyOn(BoomiService as any, 'getEntraOAuthToken').mockResolvedValue({ token_type: 'Bearer', access_token: 'abc', expires_in: 3600, ext_expires_in: 3600 });

    // first call: transient 503 error, second call: success
    const transientError = { response: { status: 503, statusText: 'Service Unavailable' }, message: '503' };
    const mockedAxiosPost = jest.spyOn(axios, 'post');
    mockedAxiosPost.mockRejectedValueOnce(transientError);
    mockedAxiosPost.mockResolvedValueOnce({ status: 200, data: { result: 'ok' } });

    const payload = { any: 'payload' } as any;

    const res = await BoomiService.sendDocumentToBoomi(payload, { documentType: 'CatchCertificate' }, 'catchSubmit' as any);

    expect(mockedAxiosPost).toHaveBeenCalled();
    expect(res).toEqual({ result: 'ok' });
  });

});
