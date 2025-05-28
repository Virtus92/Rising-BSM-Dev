# Testing Architecture - Best Practices

## Overview
This document outlines the proper testing architecture for a Next.js 15 application with both client and server components.

## Critical Architectural Rules

### Layer Separation is Non-Negotiable

The application follows a strict layered architecture that MUST be respected:

```
HTTP Request → Route Handler → Service Layer → Repository Layer → Database
```



### Why This Matters
1. **Testability**: Clean mocking boundaries
2. **Maintainability**: Changes to DB don't affect routes
3. **Security**: Business logic centralized in services
4. **Performance**: Services can implement caching
5. **Consistency**: All routes follow same pattern

## Testing Suites Architecture

### 1. **Client-Side Tests** (`jest.client.config.mjs`)
**Environment**: `jsdom`
**Purpose**: React components, hooks, client utilities

```javascript
{
  testEnvironment: 'jsdom',
  testMatch: [
    '**/components/**/*.test.(ts|tsx)',
    '**/hooks/**/*.test.(ts|tsx)',
    '**/utils/**/*.test.(ts|tsx)',
    '**/__tests__/client/**/*.test.(ts|tsx)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.client.setup.js'],
  // Mock server-side modules
  moduleNameMapper: {
    '^server-only$': '<rootDir>/src/__mocks__/server-only.js',
    '^@/app/api/(.*)$': '<rootDir>/src/__mocks__/api.js'
  }
}
```

### 2. **Server-Side Tests** (`jest.server.config.mjs`)
**Environment**: `node`
**Purpose**: API routes, services, repositories, server utilities

```javascript
{
  testEnvironment: 'node',
  testMatch: [
    '**/api/**/*.test.(ts|tsx)',
    '**/services/**/*.test.(ts|tsx)',
    '**/repositories/**/*.test.(ts|tsx)',
    '**/__tests__/server/**/*.test.(ts|tsx)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.server.setup.js'],
  // Mock client-side modules
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/__mocks__/components.js'
  }
}
```

### 3. **Domain/Core Tests** (`jest.domain.config.mjs`)
**Environment**: `node`
**Purpose**: Domain entities, DTOs, business logic (framework-agnostic)

```javascript
{
  testEnvironment: 'node',
  testMatch: [
    '**/domain/**/*.test.(ts|tsx)',
    '**/entities/**/*.test.(ts|tsx)',
    '**/dtos/**/*.test.(ts|tsx)'
  ]
}
```

### 4. **Integration Tests** (`jest.integration.config.mjs`)
**Environment**: `jsdom` with MSW
**Purpose**: Cross-boundary testing (client + server interaction)

```javascript
{
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__integration__/**/*.test.(ts|tsx)',
    '**/*.integration.test.(ts|tsx)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.js']
}
```

### 5. **E2E Tests** (`playwright.config.ts`)
**Environment**: Real browsers
**Purpose**: Full user journeys, cross-browser testing

## Package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:all",
    "test:all": "npm run test:domain && npm run test:client && npm run test:server && npm run test:integration",
    "test:client": "jest --config jest.client.config.mjs",
    "test:server": "jest --config jest.server.config.mjs", 
    "test:domain": "jest --config jest.domain.config.mjs",
    "test:integration": "jest --config jest.integration.config.mjs",
    "test:e2e": "playwright test",
    "test:watch": "jest --config jest.client.config.mjs --watch",
    "test:coverage": "jest --config jest.client.config.mjs --coverage && jest --config jest.server.config.mjs --coverage"
  }
}
```

## Advantages of This Architecture

### 🎯 **Clear Separation of Concerns**
- Each test suite has specific purpose and environment
- No conflicts between server/client code
- Easier to debug and maintain

### 🚀 **Performance Benefits**
- Parallel execution of different test suites
- Faster feedback during development
- Targeted testing (only run relevant tests)

### 🔧 **Better Developer Experience**
- Clear test organization
- Environment-specific mocking strategies
- Proper IDE support and IntelliSense

### 📊 **Accurate Coverage Reports**
- Separate coverage reports for client/server
- Better understanding of what's tested
- More meaningful metrics

## File Organization

```
src/
├── components/
│   └── __tests__/           # Client tests
├── app/api/
│   └── __tests__/           # Server tests  
├── services/
│   └── __tests__/           # Server tests
├── domain/
│   └── __tests__/           # Domain tests
├── __integration__/         # Integration tests
└── __e2e__/                # E2E tests
```

## Why This Matters

### ❌ **Single Suite Problems**
- Complex configuration trying to handle everything
- Conflicts between environments
- Slower test execution
- Hard to debug failures
- Mock complexity increases

### ✅ **Multi-Suite Benefits**
- Each suite optimized for its purpose
- Clear boundaries and responsibilities
- Better parallel execution
- Easier CI/CD integration
- More maintainable test code

## CI/CD Integration

```yaml
# GitHub Actions example
jobs:
  test-domain:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:domain
      
  test-client:
    runs-on: ubuntu-latest  
    steps:
      - run: npm run test:client
      
  test-server:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:server
      
  test-integration:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration
      
  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e
```

## Migration Strategy

1. **Phase 1**: Create separate configs
2. **Phase 2**: Move existing tests to appropriate suites
3. **Phase 3**: Add missing test types
4. **Phase 4**: Optimize each suite independently

This architecture scales better, is more maintainable, and follows industry best practices for modern web applications.