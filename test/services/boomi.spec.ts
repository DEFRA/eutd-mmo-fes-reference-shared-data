import axios from "axios";
import { BoomiService, IBoomiAddressResponse } from '../../src/services/boomi.service';
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

const { v4:uuid } = require('uuid');

jest.mock('uuid');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('The boomi service', () => {

  let mockSendRequest;
  let mockConfig;

  beforeEach(() => {
    jest.resetModules();

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
    expect(result).toBe('/ws/rest/DEFRA/v1/ECC/FishingActivities?rssNumber=rssNumber&landingDate=2019-01-01&version=v2');
  });

  it('Landings Dec', () => {

    const result = BoomiService.callingURL({ rssNumber: 'rssNumber', landingDate: '2019-01-01' }, 'landing');
    expect(result).toBe('/ws/rest/DEFRA/v1/ECC/LandingDeclarations?rssNumber=rssNumber&landingDate=2019-01-01');
  });

  it('Sales Notes', () => {

    const result = BoomiService.callingURL({ rssNumber: 'rssNumber', landingDate: '2019-01-01' }, 'salesNotes');
    expect(result).toBe('/ws/rest/DEFRA/v1/ECC/SalesNotes?rssNumber=rssNumber&landingDate=2019-01-01');
  });

  it('Elogs', () => {
    const result = BoomiService.callingURL({ rssNumber: 'rssNumber', landingDate: '2019-01-01' }, 'eLogs');
    expect(result).toBe('/ws/rest/DEFRA/v1/ECC/elogs?rssNumber=rssNumber&landingDate=2019-01-01');
  });

  it('address', () => {
    const result = BoomiService.callingURL({ postcode: 'AB1 1AB' }, 'address');
    expect(result).toBe('/ws/rest/DEFRA/v1/address/postcodes?postcode=AB1%201AB');
  });

});

describe('getAddresses', () => {

  let mockSendRequest;
  let mockMapAddresses;
  let mockConfig;

  beforeEach(() => {
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
    const apiResponse = {test: 'test'};
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

  it('will handle empty results', () => {
    const input: IBoomiAddressResponse = {
      results: []
    };

    expect(BoomiService.mapAddresses(input)).toStrictEqual([]);
  });

  it('will map an address with no optional fields', () => {
    const input: IBoomiAddressResponse = {
      results: [{Address: minimumAddress}]
    };

    const result = BoomiService.mapAddresses(input);

    expect(result).toStrictEqual([
      {
        address_line: "ADDRESSLINE",
        city : 'TOWN',
        postCode: 'POSTCODE'
      }
    ])
  });

  it('will map an address with every optional field', () => {
    const input: IBoomiAddressResponse = {
      results: [{Address: fullAddress}]
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
        city : 'TOWN1',
        postCode: 'POSTCODE1'
      },
      {
        address_line: "ADDRESSLINE2",
        city : 'TOWN2',
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

  let mockAxiosCreate;
  let mockLoggerInfo;
  let mockLoggerError;
  let mockConfig;

  beforeEach(() => {
    mockAxiosCreate = jest.spyOn(axios, 'create');
    mockAxiosCreate.mockImplementation(() => mockedAxios);

    mockLoggerError = jest.spyOn(logger, 'error');
    mockLoggerInfo = jest.spyOn(logger, 'info');

    mockConfig = jest.spyOn(config, 'getConfig');
    mockConfig.mockImplementation(() => ({
      boomiAuthUser: 'ref-boomi-user',
      boomiAuthCertificate: null,
      boomiAuthPassphrase: 'ref-boomi-passphrase',
      boomiUrl: 'boomi-url'
    }));
  });

  afterEach(() => {
    mockAxiosCreate.mockRestore();
    mockLoggerError.mockRestore();
    mockLoggerInfo.mockRestore();
    mockConfig.mockRestore();
  });

  it('will send without a certificate', async () => {
    mockedAxios.get.mockResolvedValueOnce({data: null});

    const response = await BoomiService.sendRequest('address', reqHeaders,  "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosCreate).toHaveBeenCalled();  
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(response).toBeNull();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][address][WITHOUT-CERTIFICATE]');
  });

  it('will send with a certificate', async () => {
    mockConfig.mockImplementation(() => ({
      boomiAuthUser: 'ref-boomi-user',
      boomiAuthCertificate: 'ref-boomi-certificate',
      boomiAuthPassphrase: 'ref-boomi-passphrase',
      boomiUrl: 'boomi-url'
    }));

    mockedAxios.get.mockResolvedValueOnce({data: null});

    const response = await BoomiService.sendRequest('address', reqHeaders,  "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosCreate).toHaveBeenCalled();  
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(response).toBeNull();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[BOOMI-SERVICE][address][WITH-CERTIFICATE]');
  });

  it('will return null if no data is found', async () => {
    mockedAxios.get.mockResolvedValueOnce({data: null});

    const response = await BoomiService.sendRequest('address', reqHeaders,  "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosCreate).toHaveBeenCalled();  
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(response).toBeNull();
  });

  it('will return landing data if found', async () => {
    mockedAxios.get.mockResolvedValueOnce({data: { landingData: 'landing declaration' }});

    const response = await BoomiService.sendRequest('address', reqHeaders,  "/url", { postcode: 'AB1 1AB' });

    expect(mockAxiosCreate).toHaveBeenCalled();  
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(response).toEqual({ landingData: 'landing declaration' });
  });

  it('should call the sendRequest and log error', async () => {
    const error = { response: null };
    mockedAxios.get.mockRejectedValue(error);

    const response = await BoomiService.sendRequest('address', reqHeaders,  "/url", { postcode: 'AB1 1AB' });
    
    expect(mockLoggerError).toHaveBeenCalledWith(`[BOOMI-SERVICE][address][API][ERROR] ${error}`);
    expect(response).toBeUndefined();
  });

  it('should call the sendRequest and throw error', async () => {
    const error = { response: undefined };
    mockedAxios.get.mockRejectedValue(error);

    await expect(BoomiService.sendRequest('address', reqHeaders,  "/url", { postcode: 'AB1 1AB' })).rejects.toThrow();
    
    expect(mockLoggerError).toHaveBeenCalledWith(`[BOOMI-SERVICE][address][API][ERROR] ${error}`);
  });

  it('should call the sendRequest and throw specific error', async () => {
    const error = { response: {
      status: 504,
      statusText: 'something has gone wrong',
      headers: { x_header: 'something' },
      data: { landing: 'error' }
    }}
    mockedAxios.get.mockRejectedValue(error);

    await expect(BoomiService.sendRequest('address', reqHeaders,  "/url", { postcode: 'AB1 1AB' })).rejects.toThrow();
    
    expect(mockLoggerError).toHaveBeenCalledWith(`[BOOMI-SERVICE][address][API][ERROR] ${error}`);
    expect(mockLoggerError).toHaveBeenCalledWith("[BOOMI-SERVICE][address][API][ERROR][RESPONSE][STATUS]", 504);
    expect(mockLoggerError).toHaveBeenCalledWith("[BOOMI-SERVICE][address][API][ERROR][RESPONSE][HEADERS]", {"x_header": "something"});
    expect(mockLoggerError).toHaveBeenCalledWith("[BOOMI-SERVICE][address][API][ERROR][RESPONSE][DATA]", { "landing": 'error' });
  });

});