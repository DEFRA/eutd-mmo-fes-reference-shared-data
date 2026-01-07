# MMO Shared Reference Data - AI Coding Assistant Instructions

## Project Overview
This is a TypeScript library for DEFRA's Marine Management Organisation (MMO) that provides shared reference data services for fishing vessel landings, catch certificates, and regulatory compliance. It's distributed as an npm package to multiple MMO applications.

## Core Architecture

### Domain Structure
- **Landings**: Core domain around fishing vessel landings (`src/landings/`)
  - `orchestration/`: High-level business workflows (e.g., `ccOnlineReport.ts`)
  - `persistence/`: Data storage operations (`catchCert.ts`)
  - `query/`: Data retrieval and filtering (`ccQuery.ts`, `risking.ts`)
  - `transformations/`: Data mapping between external APIs and internal models
  - `types/`: TypeScript interfaces for domain models

### External Integration Points
- **CEFAS/Boomi API**: Primary data source for fishing activity via `BoomiService`
  - OAuth2 client credentials flow with legacy SSL support
  - Multiple resource types: `landing`, `catchActivity`, `salesNotes`, `eLogs`, `address`
  - Date handling: Always use UTC dates for CEFAS calls
- **Azure Service Bus**: Message queuing via `addToReportQueue()`
  - Dual mode: real queues (production) vs local filesystem (development)
  - Uses `sessionId` or `correlationId` for message tracking

## Development Patterns

### Testing Requirements
- **100% code coverage** enforced by Jest configuration
- Mock Azure Service Bus extensively using class-based mocks
- Test both success and error paths, especially for external integrations
- Use descriptive test names: `should add message to queue when enableReportToQueue is true`

### Logging Convention
Structured logging with bracketed context:
```typescript
logger.info(`[SERVICE][ACTION][QUEUE-NAME][DOCUMENT-NUMBER][${docNumber}][CORRELATION-ID][${correlationId}]`);
logger.error(`[SERVICE][ACTION][ERROR][CONTEXT][${error.stack || error}]`);
```

### Configuration Management
- Environment variables accessed via `getConfig()` in `src/config.ts`
- Prefix patterns: `REF_BOOMI_*` for Boomi, standard names for Azure
- OAuth scopes differ by resource type (address lookup vs MMO scope)

### Build & Distribution
- **tsup** for dual CommonJS/ESM builds with TypeScript declarations
- **GitFlow branching**: `main`, `develop`, `feature/*`, `hotfix/*`, `release/*`
- Azure DevOps pipeline triggered by branch patterns
- Published to internal npm feed (requires `.npmrc` configuration)

## Common Gotchas

### Date Handling
- CEFAS requires UTC dates in `YYYY-MM-DD` format
- Use `moment.utc(dateLanded).format('YYYY-MM-DD')` for API calls
- Validate dates with `moment(date).isValid()` before processing

### Service Bus Message Patterns
- Check `enableReportToQueue` flag before deciding queue vs filesystem
- Always extract correlation ID: `message?.sessionId || message?.correlationId`
- Handle missing parameters gracefully with detailed error logging

### Type Exports
- Re-export types through barrel exports (`index.ts` files)
- Maintain clear separation: `MessageLabel` enum vs `addToReportQueue` function
- Use specific type imports: `{ ServiceBusMessage, ServiceBusSender }`

### Error Handling
- Catch and re-throw with context in service layers
- Check for both `e.response` and direct error cases in Axios calls
- Use `SSL_OP_LEGACY_SERVER_CONNECT` for HTTPS agents with legacy systems

## Working with Tests
- Run `npm test` for single run with coverage
- Use `npm run test:watch` for development
- Mock external dependencies at module level, not inline
- Test file naming: `*.spec.ts` for unit tests, `*.jest.spec.ts` for complex mocks