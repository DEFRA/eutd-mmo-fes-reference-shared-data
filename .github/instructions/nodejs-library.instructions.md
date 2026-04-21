---
description: 'Node.js shared library best practices for MMO FES Shared Reference Data'
applyTo: '**/*.{js,ts}'
---

# Node.js Shared Library Best Practices for MMO FES

This instructions file applies to the mmo-shared-reference-data library — a reusable TypeScript package consumed by other MMO FES services. This is NOT a web server; it exports services, types, and utilities.

## Core Principles

### 1. Library Export Pattern
Use barrel exports for a clean public API surface:
```typescript
// src/index.ts
export { BoomiService } from './services/boomi.service';
export { addToReportQueue, MessageLabel } from './services/queue.service';
export type { ILanding, ILandingAggregated, ICcQueryResult } from './landings/types';
```

### 2. Build & Distribution
Built with `tsup` targeting both CJS and ESM:
- CommonJS: `dist/index.js` (main)
- ESM: `dist/index.mjs` (module)
- Declarations: `dist/index.d.ts`

### 3. Never Import Internal Modules Directly
Consumers must only import from the package root:
```typescript
// Good
import { BoomiService, ILanding } from 'mmo-shared-reference-data';

// Bad - importing internal paths
import { BoomiService } from 'mmo-shared-reference-data/src/services/boomi.service';
```

## External API Integration (Boomi/CEFAS)

### OAuth Token Authentication
```typescript
export class BoomiService {
  static async getEntraOAuthToken(resourceType: 'landing' | 'address' | ...) {
    // Gets OAuth token scoped per resource type
  }

  static async sendRequest(resourceType, headers, url, params) {
    const tokenResponse = await this.getEntraOAuthToken(resourceType);
    return axios.get(url, {
      headers: {
        Authorization: `${tokenResponse.token_type} ${tokenResponse.access_token}`,
        ...headers
      },
      httpsAgent: new https.Agent({ secureOptions: SSL_OP_LEGACY_SERVER_CONNECT })
    });
  }
}
```

### Dynamic URL Routing by Resource Type
```typescript
static callingURL(params, resourceType) {
  return {
    landing: `/api/ecc/v1.0/LandingDeclarations?rssNumber=${params.rssNumber}&landingDate=${params.landingDate}`,
    address: `/api/address-lookup/v1.0/postcodes?postcode=${encodeURIComponent(params.postcode)}`,
    catchSubmit: `/api/fes/v1.0/${params.documentType}`,
  }[resourceType];
}
```

## Azure Service Bus Integration

### Message Publishing with Dev Fallback
```typescript
export enum MessageLabel {
  CATCH_CERTIFICATE_SUBMITTED = 'catch_certificate_submitted',
  NEW_LANDING = 'new-landing',
}

export const addToReportQueue = async (
  documentNumber, message, queueUrl, queueName, enableReportToQueue
) => {
  if (enableReportToQueue) {
    const sbClient = new ServiceBusClient(queueUrl);
    await sbClient.createSender(queueName).sendMessages(message);
  } else {
    // Development: Write to local filesystem
    fs.writeFileSync(`service_bus/${queueName}/${fileName}.json`, message.body);
  }
};
```

## Type Definitions

### Domain Model Interfaces
Export well-typed interfaces for all shared domain concepts:
```typescript
export interface ILanding {
  rssNumber: string;
  dateTimeLanded: string;
  source: 'LANDING_DECLARATION' | 'CATCH_RECORDING' | 'ELOG';
  items: ILandingItem[];
}

export interface ICcQueryResult {
  documentNumber: string;
  rssNumber: string;
  weightOnCert: number;
  weightOnLanding: number;
  isOverusedThisCert: boolean;
  isOverusedAllCerts: boolean;
}
```

## Logging Convention

Use Bunyan for structured JSON logging with bracketed patterns:
```typescript
import { createLogger } from 'bunyan';

const logger = createLogger({
  name: process.env.WEBSITE_NAME ?? 'mmo-shared-reference-data',
  level: 'debug',
  serializers: { err: stdSerializers.err }
});

// Pattern: [SERVICE][ACTION][DETAIL]
logger.info(`[BOOMI-SERVICE][LANDING][API][BASEURL] ${url}`);
logger.error(`[BOOMI-SERVICE][API][ERROR] ${e}`);
logger.info(`[AZURE-SERVICE-BUS][PUSHED-TO-QUEUE][${queueName}][SUCCESS]`);
```

## Date & Time Handling

### Always Use UTC
```typescript
import moment from 'moment';

const dateLanded = moment.utc(landing.dateLanded).format('YYYY-MM-DD');
const now = moment.utc();

// 14-day expiration window
function hasLandingDataPeriodExceeded(result, queryTime) {
  const endDate = moment.utc(result.extended.landingDataEndDate);
  return queryTime.isAfter(endDate, 'day');
}
```

## Configuration Pattern

### Centralized Config with Dotenv
```typescript
import dotenv from 'dotenv';

export const getConfig = () => ({
  boomiApiOauthClientId: process.env.REF_BOOMI_API_OAUTH_CLIENT_ID,
  boomiApiOauthClientSecret: process.env.REF_BOOMI_API_OAUTH_CLIENT_SECRET,
  boomiUrl: process.env.BOOMI_URL,
  externalAppUrl: process.env.EXTERNAL_APP_URL,
});
```

## Business Logic Patterns

### Weight Overuse Checking with Tolerance
```typescript
function performWeightOveruseCheck(result, landingWeight, isEstimated) {
  // Estimated data: 10% tolerance; actual data: 0% tolerance + fixed buffer
  result.isOverusedAllCerts = isEstimated
    ? (result.weightOnAllCerts > ((landingWeight * 1.1) + TOLERANCE_IN_KG))
    : (result.weightOnAllCerts > (landingWeight + TOLERANCE_IN_KG));
}
```

### JSON Schema Validation with AJV
```typescript
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(schema);

if (!validate(data)) {
  throw new Error(`Validation failed: ${JSON.stringify(validate.errors)}`);
}
```

## Testing Best Practices

### Mock External Services
```typescript
describe('BoomiService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(BoomiService, 'sendRequest');
    jest.spyOn(config, 'getConfig').mockImplementation(() => ({
      boomiAuthUser: 'ref-boomi-user',
      boomiUrl: 'boomi-url'
    }));
  });

  it('should throw for invalid date format', async () => {
    await expect(
      BoomiService.queryBoomi('landing', { landingDate: '2012-AA-01', rssNumber: '123' })
    ).rejects.toThrow('Invalid date');
  });
});
```

### Coverage Thresholds
Maintain 90% coverage:
- Statements: 90%
- Branches: 90%
- Functions: 90%
- Lines: 90%

## Security Considerations

- Never expose OAuth credentials in exports or logs
- Use HTTPS agents with appropriate TLS settings for legacy endpoints
- Validate all inputs before sending to external APIs
- URL-encode user-provided parameters (postcodes, search terms)
