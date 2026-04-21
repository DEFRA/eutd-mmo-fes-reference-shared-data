---
name: develop
description: 'Expert TypeScript library developer for MMO Shared Reference Data. Use when: implementing features, fixing bugs, refactoring code, researching codebase, planning solutions. Covers barrel exports, tsup builds, Boomi/CEFAS API, Service Bus integration, shared types.'
---

# Shared Reference Data — Developer Skill

Expert software engineer for the MMO Shared Reference Data library. Reads the codebase, researches, plans, reasons, writes production-ready code for this shared npm package consumed by other FES services.

## When to Use

- Adding or modifying shared types and interfaces
- Working with Boomi/CEFAS API integration
- Modifying Azure Service Bus integration
- Adding new exported functions or classes
- Any production code writing task

## Workflow

### Before Making Changes

1. Search codebase for how the type/function is consumed by downstream repos
2. Check barrel exports in `src/index.ts` — all public API must be re-exported
3. Review existing interfaces to avoid breaking changes
4. Understand the dual build (CJS + ESM) implications

### During Implementation

1. Follow all mandatory rules from the auto-loaded instruction files (`nodejs-library.instructions.md`, `typescript.instructions.md`)
2. Re-export all new public types/functions from `src/index.ts`
3. Maintain backward compatibility — never remove or rename existing exports

### After Implementation

1. Run build: `npm run build`
2. Run lint: `npm run lint`
3. Verify no TypeScript errors in problems panel
4. Invoke the `/unit-tests` skill to write or update tests
5. Review git diff to ensure no accidental changes
6. Verify `dist/` output contains CJS, ESM, and `.d.ts` files

## Project Conventions

### Barrel Exports

```typescript
// src/index.ts — ALL public API must be exported here
export { ILanding, ICcQueryResult, IDocument } from './landings/types';
export { BoomiService } from './services/BoomiService';
export { addToReportQueue, MessageLabel } from './services/queue.service';
export { validatePayload } from './validation/ajvValidator';
// Consumers import only from package root:
// import { ILanding, BoomiService } from 'mmo-shared-reference-data';
```

### Boomi/CEFAS API (OAuth2 with Legacy SSL)

```typescript
// OAuth2 client credentials flow with legacy SSL support
const httpsAgent = new https.Agent({
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
});

const tokenResponse = await axios.post(tokenUrl, credentials, {
  httpsAgent,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});

// Dynamic URL routing by resource type
const apiUrl = `${baseUrl}/${resourceType}`;
const response = await axios.get(apiUrl, {
  httpsAgent,
  headers: { Authorization: `Bearer ${token}` },
});
```

### Azure Service Bus Dual Mode

```typescript
// Real queue mode vs filesystem fallback (dev/test)
if (enableReportToQueue) {
  const sender = sbClient.createSender(queueName);
  await sender.sendMessages({ body: payload, sessionId });
  await sender.close();
} else {
  // Filesystem fallback for local development
  await writeFile(`./queue-output/${queueName}-${Date.now()}.json`, JSON.stringify(payload));
}
```

### Weight Overuse Validation

```typescript
// Tolerance thresholds differ by weight type
const tolerance = isEstimated
  ? weight * 0.1   // 10% for estimated weights
  : fixedBuffer;    // Fixed buffer for actual weights
const isOveruse = exportedWeight > (landedWeight + tolerance);
```

### Structured Logging (Bunyan)

```typescript
// Bunyan-based JSON logging with bracketed patterns
logger.info('[COMPONENT][ACTION][DETAIL]');
logger.error({ err: error }, `[COMPONENT][ACTION][ERROR]`);
```

## Anti-Patterns

> Mandatory rules in the instruction files also apply. The items below are additional anti-patterns specific to this skill:

- Forgetting to re-export new types/functions from `src/index.ts`
- Breaking backward compatibility by removing or renaming exports
- Using `moment()` instead of `moment.utc()` for CEFAS dates (`YYYY-MM-DD`)
- Missing `SSL_OP_LEGACY_SERVER_CONNECT` for CEFAS/Boomi connections
- Not cleaning up Service Bus sender/client in `finally` blocks
