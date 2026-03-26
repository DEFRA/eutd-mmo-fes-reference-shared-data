import axios, { AxiosResponse } from "axios";
import querystring from 'node:querystring';
import { getConfig } from '../config';
import { CertificateAddress } from "../landings/types/defraValidation";
import { SSL_OP_LEGACY_SERVER_CONNECT } from "node:constants";
import logger from '../logger';

const https = require('node:https');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

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

// Catch Certificate payload structure
export interface ICatchCertificatePayload {
  CreateCatchCertificateRequest: {
    SPSCertificate: any;
  };
}

// Processing Statement payload structure
export interface IProcessingStatementPayload {
  CreateCatchProcessingStatementRequest: {
    SPSCertificate: any;
  };
}

// Storage Notes payload structure
export interface IStorageNotesPayload {
  CreateCatchNonManipulationDocumentRequest: {
    CatchNonManipulationDocument: any;
  };
}

// Union type for all document payloads
export type IDocumentPayload =
  | ICatchCertificatePayload
  | IProcessingStatementPayload
  | IStorageNotesPayload;

type euStatus = 'SUCCESS' | 'FAILURE' | 'IN_PROGRESS';
export interface IEuUpgradeResponse {
  documentNumber: string;
  euCatchStatus: euStatus;
  euCatchStatusMessage?: string;
  euCatchReferenceNumber?: string;
  euCatchStatusCode?: string;
  euCatchStatusName?: string;
  euCatchUri?: string;
  euCatchTimestamp?: string;
  reasonInformation?: string;
  faultCode?: string;
  faultString?: string;
  validationErrors?: Array<{
    errorId: string;
    errorMessage: string;
    errorField: string;
  }>;
}

export interface IReferenceSPSReferencedDocument {
  TypeCode: {
    name: string;
    value: string;
  };
  RelationshipTypeCode: {
    name: string;
    value: string;
  };
  ID: {
    text: string
  };
  AttachmentBinaryObject: {
    [key: string]: string
  };
}

export interface IEuUpgradeCallback {
  [key: string]: {
    status?: euStatus,
    statusMessage?: string,
    fesDocNumber?: string,
    Header?: {
      Message: {
        severity: string;
        ID: string;
        Message: string;
      };
      Security?: {
        TimestampType: {
          Created: string;
          Expires: string;
        };
      };
    };
    Body?: {
      SubmitCatchResponse?: {
        SPSAcknowledgement: {
          SPSAcknowledgementDocument: {
            IssueDateTime: {
              DateTime: string;
            };
            StatusCode: {
              [key: string]: string;
            };
            ReasonInformation: string;
            fesDocNumber: string;
            ReferenceSPSReferencedDocument: IReferenceSPSReferencedDocument[];
          };
        };
      };
      Fault?: {
        fesDocNumber: string;
        faultcode: string;
        faultstring: string;
        detail: {
          BusinessRulesValidationException: {
            Error: Array<{
              ID: string;
              Message: {
                languageID: string;
                text: string;
              };
              Field: {
                languageID: string;
                text: string;
              };
            }>;
          };
        };
      };
    };
  }
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

type resourceType = 'landing' | 'catchActivity' | 'salesNotes' | 'eLogs' | 'address' | 'catchSubmit' | 'catchVoid';

export class BoomiService {

  private static readonly oauthTokenCache = new Map<resourceType, { token: IOAuthResponse; expiresAtMs: number }>();
  private static readonly oauthTokenInFlight = new Map<resourceType, Promise<IOAuthResponse>>();

  private static readonly httpsAgent = new https.Agent({
    secureOptions: SSL_OP_LEGACY_SERVER_CONNECT,
    keepAlive: true
  });

  private static readonly oauthExpirySafetyWindowMs = 30_000;
  private static readonly oauthTimeoutMs = 10_000;
  private static readonly submitTimeoutMs = 20_000;
  private static readonly getTimeoutMs = 20_000;

  private static readonly addressCacheTtlMs = 5 * 60_000;
  private static readonly addressCache = new Map<string, { value: CertificateAddress[]; expiresAtMs: number }>();

  private static readonly maxRetries = 2;
  private static readonly retryBaseDelayMs = 500;

  private static isTransientError(e: any): boolean {
    if (!e.response) return true; // network error / timeout
    const status = e.response.status;
    return status === 429 || status === 502 || status === 503 || status === 504;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static callingURL(params: any, resourceType: resourceType) {
    return {
      landing: `/api/ecc/v1.0/LandingDeclarations?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}`,
      catchActivity: `/api/ecc/v1.0/FishingActivities?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}&version=v2`,
      salesNotes: `/api/ecc/v1.0/SalesNotes?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}`,
      eLogs: `/api/ecc/v1.0/elogs?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}`,
      address: `/api/address-lookup/v1.0/postcodes?postcode=${encodeURIComponent(params.postcode)}`,
      catchSubmit: `/api/fes/v1.0/${params.documentType}`,
      catchVoid: `/api/fes/v1.0/CANCEL${params.documentType}`
    }[resourceType]
  }

  static resourceTypeScope(config: any, resourceType: resourceType) {
    return {
      landing: config.boomiLandingApiOauthScope,
      catchActivity: config.boomiLandingApiOauthScope,
      salesNotes: config.boomiLandingApiOauthScope,
      eLogs: config.boomiLandingApiOauthScope,
      address: config.boomiAddressLookupApiOauthScope,
      catchSubmit: config.boomiCatchApiOauthScope,
      catchVoid: config.boomiCatchApiOauthScope
    }[resourceType]
  }

  static async sendRequest(resourceType: resourceType, headers: any, url: string, params: any) {
    const tokenResponse = await this.getEntraOAuthToken(resourceType);

    try {
      logger.info(`[BOOMI-SERVICE][${resourceType}][API][BASEURL] ${url}`);

      const callingUrl = `${url}${BoomiService.callingURL(params, resourceType)}`;

      logger.info(`[BOOMI-SERVICE][${resourceType}][CALLING-URL][${callingUrl}]`);

      const response: AxiosResponse = await axios.get(
        callingUrl,
        {
          headers: {
            Authorization: `${tokenResponse.token_type} ${tokenResponse.access_token}`,
            ...headers
          },
          httpsAgent: this.httpsAgent,
          timeout: this.getTimeoutMs
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

      if (!e.response && e.response === undefined) {
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

  static async queryBoomi(action: string, queryParams: any, config: any) {
    if (Object.keys(queryParams).length === 0) {
      throw new Error('Parameters must be provided');
    }

    if (action === 'landing' || action === 'salesNotes' || action === 'eLogs') {
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

    const promises = [BoomiService.queryBoomiForLandingData({ landingDate: moment.utc(dateLanded).format('YYYY-MM-DD'), rssNumber }, getConfig(), transactionType)];
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
    const cacheKey = (postcode || '').trim().toUpperCase();
    const cached = this.addressCache.get(cacheKey);
    if (cached && cached.expiresAtMs > Date.now()) {
      logger.info(`[BOOMI][GET-ADDRESS][CACHE-HIT][${cacheKey}]`);
      return cached.value;
    }

    const config = getConfig();
    const reqHeaders = {
      UserID: config.boomiAuthUser,
      CustomerID: 'MMO',
      Timestamp: moment.utc().toISOString(),
      RequestID: uuidv4()
    }

    const result = await this.sendRequest('address', reqHeaders, config.boomiUrl, { postcode: postcode });

    const mapped = result ? this.mapAddresses(result) : [];
    this.addressCache.set(cacheKey, { value: mapped, expiresAtMs: Date.now() + this.addressCacheTtlMs });

    return mapped;
  }

  static readonly mapAddresses = (apiResponse: IBoomiAddressResponse | undefined): CertificateAddress[] => {
    const response = apiResponse?.results
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
          city: result.Address.Town,
          postCode: result.Address.Postcode
        }
      })
      : [];
    logger.info('[BOOMI][GET-ADDRESS][MAPPED-RESPONSE]', response);
    return response;
  }

  /**
   * Get OAuth token for CATCH API from Entra
   * Implements Scenario 1 from FI0-10355
   */
  static async getEntraOAuthToken(resourceType: resourceType): Promise<IOAuthResponse> {
    const config = getConfig();

    const cached = this.oauthTokenCache.get(resourceType);
    if (cached && cached.expiresAtMs > Date.now() + this.oauthExpirySafetyWindowMs) {
      logger.info(`[BOOMI-SERVICE][${resourceType}][OAUTH-TOKEN-CACHE-HIT]`);
      return cached.token;
    }

    const inFlight = this.oauthTokenInFlight.get(resourceType);
    if (inFlight !== undefined) {
      logger.info(`[BOOMI-SERVICE][${resourceType}][OAUTH-TOKEN-IN-FLIGHT]`);
      return await inFlight;
    }

    logger.info(`[BOOMI-SERVICE][${resourceType}][REQUESTING-OAUTH-TOKEN]`);

    const tokenRequest: IOAuthRequest = {
      client_id: config.boomiApiOauthClientId,
      client_secret: config.boomiApiOauthClientSecret,
      scope: this.resourceTypeScope(config, resourceType),
      grant_type: 'client_credentials'
    };

    const tokenUrl = config.boomiApiOauthTokenUrl;
    const data = querystring.stringify(tokenRequest);

    try {
      const tokenPromise = (async () => {
        const tokenResponse: AxiosResponse<IOAuthResponse> = await axios.post<IOAuthResponse>(
          tokenUrl,
          data,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            httpsAgent: this.httpsAgent,
            timeout: this.oauthTimeoutMs
          }
        );

        const token = tokenResponse.data;
        const expiresAtMs = Date.now() + (token.expires_in * 1000);
        this.oauthTokenCache.set(resourceType, { token, expiresAtMs });

        logger.info(`[BOOMI-SERVICE][${resourceType}][OAUTH-TOKEN-RECEIVED]`);
        return token;
      })();

      this.oauthTokenInFlight.set(resourceType, tokenPromise);
      return await tokenPromise;

    } catch (e) {
      logger.error(`[BOOMI-SERVICE][${resourceType}][ERROR][UNABLE-TO-GET-OAUTH-TOKEN][${e.stack || e}]`);
      throw new Error(`Failed to get ${resourceType} OAuth token: ${e.message || e}`);
    } finally {
      this.oauthTokenInFlight.delete(resourceType);
    }
  }

  /**
   * Submit document (catch certificate, processing statement, or storage notes) to CATCH API via APIM
   * Implements Scenario 2 from FI0-10355
   * @param payload - The document payload to submit
   * @param params - Parameters for URL construction (must include documentType)
   * @param resourceType - Type of resource being submitted
   */
  static async sendDocumentToBoomi(
    payload: IDocumentPayload,
    params: { documentType: string },
    resourceType: resourceType
  ): Promise<any> {
    const config = getConfig();

    logger.info(`[BOOMI-SERVICE][${resourceType}][SUBMITTING-${params.documentType}]`);

    try {
      // Step 1: Get OAuth token
      const tokenData = await this.getEntraOAuthToken(resourceType);

      // Step 2: Submit document to CATCH API
      const callingUrl = BoomiService.callingURL(params, resourceType);
      const apiUrl = `${config.boomiUrl}${callingUrl}`;

      logger.info(`[BOOMI-SERVICE][${resourceType}][BASEURL][${config.boomiUrl}]`);
      logger.info(`[BOOMI-SERVICE][${resourceType}][CALLING-URL][${apiUrl}]`);
      logger.debug(`[BOOMI-SERVICE][${resourceType}][PAYLOAD]${JSON.stringify(payload)}`);

      let lastError: any;
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const delayMs = this.retryBaseDelayMs * Math.pow(2, attempt - 1);
            logger.info(`[BOOMI-SERVICE][${resourceType}][RETRY] attempt=${attempt}/${this.maxRetries} delayMs=${delayMs}`);
            await this.delay(delayMs);
          }

          const response: AxiosResponse<any> = await axios.post<any>(
            apiUrl,
            payload,
            {
              headers: {
                'Authorization': `${tokenData.token_type} ${tokenData.access_token}`,
                'Content-Type': 'application/json'
              },
              httpsAgent: this.httpsAgent,
              timeout: this.submitTimeoutMs
            }
          );

          

          logger.info(`[BOOMI-SERVICE][${resourceType}][RESPONSE-STATUS][${response.status}]`);
          logger.info(`[BOOMI-SERVICE][${resourceType}][RESPONSE-DATA]${JSON.stringify(response.data)}`);

          return response.data;
        } catch (retryErr) {
          lastError = retryErr;
          if (!this.isTransientError(retryErr) || attempt === this.maxRetries) {
            break;
          }
          logger.warn(`[BOOMI-SERVICE][${resourceType}][TRANSIENT-ERROR] attempt=${attempt} ${retryErr.message || retryErr}`);
        }
      }

      throw lastError;

    } catch (e) {
      logger.error(`[BOOMI-SERVICE][${resourceType}][ERROR] ${e}`);

      if (e.response) {
        logger.error(`[BOOMI-SERVICE][${resourceType}][ERROR][RESPONSE][STATUS]`, e.response.status);
        logger.error(`[BOOMI-SERVICE][${resourceType}][ERROR][RESPONSE][DATA]`, JSON.stringify(e.response.data));

        throw new Error(`${params.documentType} API error: ${e.response.status} - ${e.response.statusText}`);
      }

      throw new Error(`Failed to submit ${params.documentType}: ${e.message || e}`);
    }
  }

  /**
   * Process EU upgrade callback from BOOMI
   * Implements Scenario 3 from FI0-10355
   * This method would be called by the endpoint handler in mmo-fes-reference-data-reader
   * @returns Structured response object with success/failure data
   */
  static processEuUpgradeCallback(callbackData: IEuUpgradeCallback): IEuUpgradeResponse {
    try {
      if (!callbackData) {
        logger.error('[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][ERROR][Failed to process EU upgrade callback: Invalid callback payload structure]');
        throw new Error('Failed to process EU upgrade callback: Invalid callback payload structure');
      }

      const body = callbackData.Envelope?.Body;

      // Check if it's a success response
      if (body?.SubmitCatchResponse) {
        const acknowledgement = body.SubmitCatchResponse.SPSAcknowledgement.SPSAcknowledgementDocument;
        const documentNumber = acknowledgement.fesDocNumber;
        const referenceSPSReferencedDocument = acknowledgement.ReferenceSPSReferencedDocument[0];
        const id = referenceSPSReferencedDocument.ID.text;
        const euCertificateUri = referenceSPSReferencedDocument.AttachmentBinaryObject['@uri'];
        const statusCode = acknowledgement.StatusCode.text;
        const statusName = acknowledgement.StatusCode['@name'];
        const reasonInfo = acknowledgement.ReasonInformation;
        const issueDateTime = acknowledgement.IssueDateTime.DateTime;

        logger.info(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][SUCCESS][ID:${id}][STATUS-CODE:${statusCode}]`);
        logger.info(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][SUCCESS][STATUS-NAME:${statusName}][REASON:${reasonInfo}]`);
        logger.info(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][SUCCESS][EU-CERTIFICATE-URI:${euCertificateUri}][ISSUE-TIME:${issueDateTime}]`);

        const successResponse: IEuUpgradeResponse = {
          euCatchStatus: 'SUCCESS',
          documentNumber,
          euCatchReferenceNumber: id,
          euCatchStatusCode: statusCode,
          euCatchStatusName: statusName,
          euCatchUri: euCertificateUri,
          euCatchTimestamp: issueDateTime,
          reasonInformation: reasonInfo
        };

        return successResponse;
      }
      // Check if it's a fault/error response
      else if (body?.Fault) {
        const fault = body.Fault;
        const documentNumber = fault.fesDocNumber;
        const faultCode = fault.faultcode;
        const faultString = fault.faultstring;
        const errors = fault.detail?.BusinessRulesValidationException?.Error;

        logger.warn(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][FAILURE][FAULT-STRING:${faultString}]`);

        if (errors) {
          // Log each validation error
          errors.forEach((error, index) => {
            logger.warn(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][FAILURE][ERROR-${index + 1}][ID:${error.ID}][MESSAGE:${error.Message.text}][FIELD:${error.Field.text}]`);
          });

          // Build consolidated error message
          const errorMessages = errors.map(e => `${e.ID}: ${e.Message.text}`).join('; ');

          logger.error(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][FAILURE][CONSOLIDATED-ERRORS:${errorMessages}]`);
        }

        const failureResponse: IEuUpgradeResponse = {
          euCatchStatus: 'FAILURE',
          documentNumber,
          faultCode,
          faultString,
          validationErrors: errors ? errors.map(error => ({
            errorId: error.ID,
            errorMessage: error.Message.text,
            errorField: error.Field.text
          })) : undefined
        };

        return failureResponse;
      } else {
        // Get the first key of the object
        const key = Object.keys(callbackData)[0];
        const allowedResponseTypes = ['CatchCertificateResponse', 'ProcessingStatementResponse', 'NonManipulationDocumentResponse'];

        if (!key) {
          const errorMsg = 'Failed to process EU upgrade callback: Invalid callback payload structure';
          logger.error(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][ERROR][${errorMsg}]`);
          throw new Error(errorMsg);
        }

        if (!allowedResponseTypes.includes(key)) {
          const errorMsg = 'Failed to process EU upgrade callback: Unknown callback payload structure - neither success nor fault response';
          logger.error(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][ERROR][${errorMsg}]`);
          throw new Error(errorMsg);
        }

        // Return the value associated with that key
        const response = callbackData[key];

        const pendingResponse: IEuUpgradeResponse = {
          euCatchStatus: response.status,
          documentNumber: response.fesDocNumber,
          euCatchStatusMessage: response.statusMessage
        };

        return pendingResponse;
      }

    } catch (e) {
      logger.error(`[BOOMI-SERVICE][EU-UPGRADE-CALLBACK][ERROR][${e.message}]`);
      throw new Error(`Failed to process EU upgrade callback: ${e.message} ${e.stack}`);
    }
  }

}