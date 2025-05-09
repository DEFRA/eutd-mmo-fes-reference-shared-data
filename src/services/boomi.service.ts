import axios, { AxiosResponse } from "axios";
import querystring from 'querystring';
import { getConfig } from '../config';
import { CertificateAddress } from "../landings/types/defraValidation";
import { SSL_OP_LEGACY_SERVER_CONNECT } from "constants";
import logger from '../logger';

const https = require('https');
const moment = require('moment');
const {v4:uuidv4} = require('uuid');

interface IBoomiLandingData {
  landingDate: string,
  rssNumber: string
}

export type IOAuthRequest = {
  client_id: string,
  client_secret: string,
  scope: string,
  grant_type: string
}

export interface IOAuthResponse {
  token_type: string,
  expires_in: number,
  ext_expires_in: number,
  access_token: string
}

export interface IBoomiAddressResponse {
  header?: any,
  results?: IBoomiAddressResult[],
  _info?: any
}

interface IBoomiAddressResult {
  Address: {
    AddressLine: string,
    SubBuildingName?: string
    BuildingNumber?: string,
    BuildingName?: string,
    Street?: string,
    Locality?: string,
    DependentLocality?: string,
    Town: string,
    County?: string,
    Postcode: string,
    Country?: string,
    XCoordinate?: number,
    YCoordinate?: number,
    UPRN?: string,
    Match?: string,
    MatchDescription?: string,
    Language?: string
  }
}

type resourceType = 'landing' | 'catchActivity' | 'salesNotes' | 'eLogs' | 'address';

export class BoomiService {

  static callingURL(params: any, resourceType: resourceType) {
    return {
      landing: `/api/ecc/v1.0/LandingDeclarations?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}`,
      catchActivity: `/api/ecc/v1.0/FishingActivities?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}&version=v2`,
      salesNotes: `/api/ecc/v1.0/SalesNotes?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}`,
      eLogs: `/api/ecc/v1.0/elogs?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}`,
      address: `/api/address-lookup/v1.0/postcodes?postcode=${encodeURIComponent(params.postcode)}`
    }[resourceType]
  }

  static async sendRequest(resourceType: resourceType, headers: any, url: string, params: any) {
    const config = getConfig();

    logger.info(`[BOOMI-SERVICE][${resourceType}][REQUESTING-OAUTH-TOKEN]`);

    const tokenRequest: IOAuthRequest = {
      client_id: config.boomiApiOauthClientId,
      client_secret: config.boomiApiOauthClientSecret,
      scope: resourceType === 'address' ? config.boomiAddressLookupApiOauthScope : config.boomiLandingApiOauthScope,
      grant_type: 'client_credentials'
    };

    const tokenUrl = config.boomiApiOauthTokenUrl;
    const agent = new https.Agent({
      secureOptions: SSL_OP_LEGACY_SERVER_CONNECT
    });
    
    const data = querystring.stringify(tokenRequest);
    const tokenResponse: AxiosResponse<IOAuthResponse> = await axios.post<IOAuthResponse>(
      tokenUrl,
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: agent
      }
    ).catch(e => {
      logger.error(`[BOOMI-SERVICE][${resourceType}][ERROR][UNABLE-TO-GET-OAUTH-TOKEN][${e.stack || e}]`);
      throw new Error(e);
    });

    try {
      logger.info(`[BOOMI-SERVICE][${resourceType}][API][BASEURL] ${url}`);

      const callingUrl = `${url}${BoomiService.callingURL(params, resourceType)}`;

      logger.info(`[BOOMI-SERVICE][${resourceType}][CALLING-URL][${callingUrl}]`);

      const response: AxiosResponse = await axios.get(
        callingUrl,
        {
          headers: {
            Authorization: `${tokenResponse.data.token_type} ${tokenResponse.data.access_token}`,
            ...headers
          },
          httpsAgent: agent
        }
      );

      logger.info(`[BOOMI-SERVICE][${resourceType}][RESPONSE-DATA]${JSON.stringify(response.data)}`);

      if (!response.data) {
        logger.info(`[BOOMI-SERVICE][${resourceType}][RESPONSE-DATA][NO-DATA]`);
        logger.info(`[BOOMI-SERVICE][${resourceType}][RESPONSE-DATA][NO-DATA][STATUS]`, response.status);
        return null;
      }

      return response.data;

    } catch (e) {

      logger.error(`[BOOMI-SERVICE][${resourceType}][API][ERROR] ${e}`);

      if (!e.response && typeof e.response === "undefined") {
        throw new Error(e)
      }
      else if (e.response) {
        logger.error(`[BOOMI-SERVICE][${resourceType}][API][ERROR][RESPONSE][STATUS]`, e.response.status);
        logger.error(`[BOOMI-SERVICE][${resourceType}][API][ERROR][RESPONSE][DATA]`, e.response.data);

        throw new Error(`${e.response.status}: ${e.response.statusText}`);
      }

    }
  }

  static convertToBase64(message: string) {
    return Buffer.from(message).toString('base64');
  }

  private static async queryBoomiForLandingData(boomiParams: IBoomiLandingData, config: any, type: resourceType) {

    if ((boomiParams.landingDate === undefined) || (boomiParams.rssNumber === undefined)) {
      throw new Error('Missing data');
    }

    if (!moment(boomiParams.landingDate).isValid()) {
      throw new Error('Invalid date');
    }


    const reqHeaders = {
      ServiceID: 'landingdeclaration',
      UserID: config.boomiAuthUser,
      CustomerID: 'MMO',
      Timestamp: moment.utc().toISOString(),
      MethodID: 'landingdeclarationvalidation',
      RequestID: uuidv4()
    }

    return await this.sendRequest(type, reqHeaders, config.boomiUrl, boomiParams);
  }

  private static async queryBoomiForCatchActivity(boomiParams: IBoomiLandingData, config: any) {

    const reqHeaders = {
      ServiceID: 'catchactivity',
      UserID: config.boomiAuthUser,
      CustomerID: 'MMO',
      Timestamp: moment.utc().toISOString(),
      MethodID: 'catchactivityvalidation',
      RequestID: uuidv4()
    }

    return await this.sendRequest('catchActivity', reqHeaders, config.boomiUrl, boomiParams);
  }

  static async queryBoomi(action: string, queryParams: any, config: any){
    if (Object.keys(queryParams).length === 0) {
      throw new Error('Parameters must be provided');
    }

    if(action === 'landing' || action === 'salesNotes' || action === 'eLogs') {
      const landingParams: IBoomiLandingData = { landingDate: queryParams.landingDate, rssNumber: queryParams.rssNumber };
      return await BoomiService.queryBoomiForLandingData(landingParams, config, action);
    } else if (action === 'catchActivity') {
      const catchActivityParams: IBoomiLandingData = { landingDate: queryParams.landingDate, rssNumber: queryParams.rssNumber };
      return await BoomiService.queryBoomiForCatchActivity(catchActivityParams, config);
    } else {
      throw new Error('Please supply a valid action');
    }

  }

  static async getLandingData(dateLanded: string, rssNumber: string, transactionType: resourceType) {

    logger.info(`[GET-LANDING-DATA-AND-SALES-NOTES][OVER10][${rssNumber}][${dateLanded}][${transactionType}]`)

    /*
     CEFAS only allows calling by UTC date
     our dateLanded is now a date in UTC

               |------------------------- day UTC(dateLanded) ---|

    ==UTC===== 00 == 00 ================================== 23 == 59 =============

    Therefore make 1 call to CEFAS with UTC dates all year round
    */

    const promises = [BoomiService.queryBoomiForLandingData({ landingDate: moment.utc(dateLanded).format('YYYY-MM-DD') , rssNumber }, getConfig(), transactionType)];
    const results = await Promise.all(promises);

    return results.filter(_ => _);

  }

  static async getCatchActivity(dateLanded: string, rss: string) {

    logger.info(`[GET-LANDING-DATA][UNDER10][${rss}][${dateLanded}]`)

    const boomiParams: IBoomiLandingData = { rssNumber: rss, landingDate: dateLanded };
    const catchActivityResult = await BoomiService.queryBoomiForCatchActivity(boomiParams, getConfig());

    logger.debug(`[GET-LANDING-DATA][UNDER10][RESPONSE]${JSON.stringify(catchActivityResult)}`);

    if (catchActivityResult === null) {
      logger.debug(`[GET-LANDING-DATA][UNDER10][RESPONSE][EMPTY-RESPONSE]`);
      return null;
    }
    else {
      return catchActivityResult;
    }
  }

  static async getAddresses(postcode: string): Promise<CertificateAddress[]> {
    const config = getConfig();
    const reqHeaders = {
      UserID: config.boomiAuthUser,
      CustomerID: 'MMO',
      Timestamp: moment.utc().toISOString(),
      RequestID: uuidv4()
    }

    const result = await this.sendRequest('address', reqHeaders, config.boomiUrl, { postcode: postcode });

    return result ? this.mapAddresses(result) : [];
  }

  static mapAddresses = (apiResponse: IBoomiAddressResponse): CertificateAddress[] => {
    const response = (apiResponse && apiResponse.results)
      ? apiResponse.results.map(result => {
        return {
            address_line: result.Address.AddressLine,
            ...(result.Address.BuildingNumber) && {
              building_number: result.Address.BuildingNumber
            },
            ...(result.Address.SubBuildingName) && {
              sub_building_name: result.Address.SubBuildingName
            },
            ...(result.Address.BuildingName) && {
              building_name: result.Address.BuildingName
            },
            ...(result.Address.Street) && {
              street_name: result.Address.Street
            },
            ...(result.Address.County) && {
              county: result.Address.County
            },
            ...(result.Address.Country) && {
              country: result.Address.Country,
            },
            city : result.Address.Town,
            postCode: result.Address.Postcode
          }
        })
      : [];
      logger.info('[BOOMI][GET-ADDRESS][MAPPED-RESPONSE]', response);
      return response;
  }

}