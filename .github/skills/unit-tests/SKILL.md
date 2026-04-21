---
name: unit-tests
description: 'Expert unit test engineer for MMO Shared Reference Data. Use when: writing unit tests, updating tests for code changes, fixing failing tests, improving code coverage, fixing SonarQube issues.'
---

# Shared Reference Data — Unit Tests Skill

Expert in writing and maintaining unit tests for the MMO Shared Reference Data library. This shared library enforces 90% coverage.

## When to Use

- Writing unit tests for new or modified code
- Fixing failing tests after code changes
- Maintaining 90% code coverage
- Fixing SonarQube issues or code smells

## Coverage Requirements

- **Statements**: 90%
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%
- Run tests: `npm test` (single run with coverage report)
- Watch mode: `npm run test:watch`

## Test Framework & Tools

- **Jest** as test runner with ts-jest
- **sinon** for stubs and spies
- Test files in `test/` directory mirroring `src/` structure

## Mocking Patterns

### Boomi/CEFAS API (OAuth2)

```typescript
// Mock both success and dual error handling
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Success
mockedAxios.post.mockResolvedValueOnce({ data: { access_token: 'token' } });
mockedAxios.get.mockResolvedValueOnce({ data: mockApiData });

// Error with response (HTTP error)
mockedAxios.get.mockRejectedValueOnce({
  response: { status: 500, data: 'Server Error' },
});

// Error without response (network error)
mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));
```

### Azure Service Bus (Class-Based Mock)

```typescript
// Class-based mocks for Service Bus client
const mockSender = {
  sendMessages: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};
const mockSbClient = {
  createSender: jest.fn().mockReturnValue(mockSender),
  close: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@azure/service-bus', () => ({
  ServiceBusClient: jest.fn().mockImplementation(() => mockSbClient),
}));
```

### Filesystem Fallback (Queue Dev Mode)

```typescript
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
```

### Date Mocking for CEFAS

```typescript
// CEFAS requires UTC dates in YYYY-MM-DD format
jest.spyOn(Date, 'now').mockImplementation(() => 1693751375000);
// Verify: moment.utc().format('YYYY-MM-DD') === '2023-09-03'
```

## What to Test

1. **Barrel exports** — verify all public API is exported from `src/index.ts`
2. **Boomi OAuth2** — token fetch, API call with bearer, dual error handling (`e.response` + direct)
3. **Service Bus** — send with sessionId, sender/client cleanup in `finally`, filesystem fallback
4. **Weight validation** — overuse with 10% tolerance (estimated) and fixed buffer (actual), boundary values
5. **AJV validation** — valid/invalid payloads, schema error reporting
6. **Type interfaces** — ensure type guards match interface definitions
7. **Legacy SSL** — `SSL_OP_LEGACY_SERVER_CONNECT` option set on HTTPS agent
8. **Date formatting** — `moment.utc()` produces correct `YYYY-MM-DD` for CEFAS
9. **Logging** — bracketed format with Bunyan

## SonarQube Issue Resolution

When fixing SonarQube issues, **NEVER modify functionality**. If existing tests fail after a fix, revert it. Only structural refactoring is allowed.

## Workflow

1. Identify the source file(s) that need tests
2. Find existing test file or create new one mirroring `src/` → `test/` path
3. Read the source code to understand ALL branches — 90% coverage required
4. Write tests for every code path including error branches
5. Run `npm test` and verify 90% coverage across all metrics
6. If any metric is below 90%, identify uncovered lines and add tests
7. Check problems tab for SonarQube issues
