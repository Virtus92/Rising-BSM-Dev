# Rising-BSM API Development Guide

**Document Version**: 1.0  
**Created**: 2025-01-23  
**Last Updated**: 2025-01-23  

This guide provides the correct patterns and best practices for developing API routes in the Rising-BSM application, based on the actual codebase implementation.

## Core Principles

1. **NO ASSUMPTIONS** - Always examine existing code patterns before implementing
2. **NO WORKAROUNDS** - Use the correct patterns from the start
3. **FOLLOW EXISTING CONVENTIONS** - Maintain consistency with the established codebase
4. **USE EXISTING INFRASTRUCTURE** - Don't reinvent what already exists

## Essential Imports and Setup

### Required Imports for API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';          // ✅ Correct import location
import { LoggingService } from '@/core/logging/LoggingService';
import { getServiceFromFactory } from '@/core/factories/serviceFactory.server';
```

### Common Anti-Patterns to Avoid

```typescript
// ❌ WRONG - formatResponse is NOT in @/core/api
import { formatResponse } from '@/core/api';

// ❌ WRONG - Don't call formatResponse directly
return formatResponse.success(data);

// ❌ WRONG - Don't create duplicate response models
export interface CustomResponseModel { ... }
```

## Response Formatting Pattern

### ✅ Correct Response Pattern

```typescript
export async function apiRouteHandler(request: NextRequest) {
  const logger = new LoggingService('APIName');
  
  try {
    // API logic here
    const result = await service.performOperation(data);
    
    // ✅ Correct: Wrap formatResponse with NextResponse.json
    return NextResponse.json(
      formatResponse.success(result, 'Operation completed successfully'),
      { status: 200 }
    );
    
  } catch (error) {
    logger.error('Error in API operation', { error });
    
    // Extract status code properly
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Operation failed';
    
    // ✅ Correct: Wrap formatResponse with NextResponse.json
    return NextResponse.json(
      formatResponse.error(message, statusCode),
      { status: statusCode }
    );
  }
}
```

### ❌ Incorrect Response Pattern

```typescript
// ❌ WRONG - Don't call formatResponse directly
return formatResponse.success(data);

// ❌ WRONG - Don't use inconsistent error handling
throw new Error('Something went wrong');

// ❌ WRONG - Don't use manual response construction
return NextResponse.json({ success: true, data });
```

## Data Type Handling

### ✅ Use Existing DTOs

```typescript
// ✅ Correct - Use existing DTOs from domain layer
import { WebhookResponseDto } from '@/domain/dtos/AutomationDtos';

// Service returns DTOs directly
const webhook = await automationService.createWebhook(data);

// Return DTO directly - no conversion needed
return NextResponse.json(
  formatResponse.success(webhook),
  { status: 201 }
);
```

### ❌ Don't Create Duplicate Models

```typescript
// ❌ WRONG - Don't create duplicate response models
export interface WebhookResponse {
  id: number;
  name: string;
  createdAt: Date;  // This causes type conflicts
}

// ❌ WRONG - Don't attempt type conversion
return NextResponse.json(
  formatResponse.success(webhook as WebhookResponse),
  { status: 200 }
);
```

## Query Parameter Handling

### ✅ Proper Enum Validation

```typescript
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

export async function getWebhooksRoute(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // ✅ Correct: Validate enum values before using
  const entityTypeParam = searchParams.get('entityType');
  const operationParam = searchParams.get('operation');
  
  const filters = {
    entityType: entityTypeParam && Object.values(AutomationEntityType).includes(entityTypeParam as AutomationEntityType) 
      ? entityTypeParam as AutomationEntityType 
      : undefined,
    operation: operationParam && Object.values(AutomationOperation).includes(operationParam as AutomationOperation)
      ? operationParam as AutomationOperation
      : undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10
  };
  
  // Validate pagination
  if (filters.page < 1) filters.page = 1;
  if (filters.pageSize < 1 || filters.pageSize > 100) filters.pageSize = 10;
  
  const result = await service.getItems(filters);
  return NextResponse.json(formatResponse.success(result), { status: 200 });
}
```

### ❌ Incorrect Parameter Handling

```typescript
// ❌ WRONG - Don't pass raw strings to enum parameters
const filters = {
  entityType: searchParams.get('entityType'),  // This will cause type errors
  operation: searchParams.get('operation')
};

// ❌ WRONG - Don't skip validation
const result = await service.getItems(filters);  // Type error!
```

## Service Integration

### ✅ Correct Service Usage

```typescript
import { getAutomationService } from '../../lib/services/getAutomationService';

export async function createWebhookRoute(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ✅ Correct: Get service from factory
    const automationService = await getAutomationService();
    
    // ✅ Service returns DTOs directly
    const webhook = await automationService.createWebhook(body);
    
    return NextResponse.json(
      formatResponse.success(webhook, 'Webhook created successfully'),
      { status: 201 }
    );
  } catch (error) {
    // Error handling...
  }
}
```

### ❌ Incorrect Service Usage

```typescript
// ❌ WRONG - Don't import services directly
import { AutomationService } from '@/features/automation/lib/services/AutomationService.server';

// ❌ WRONG - Don't instantiate services manually
const service = new AutomationService();
```

## Error Handling Standards

### ✅ Consistent Error Handling

```typescript
try {
  // API logic
} catch (error) {
  logger.error('Error in operation', { error, context: additionalContext });
  
  // ✅ Correct: Extract status code safely
  const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
  const message = error instanceof Error ? error.message : 'Operation failed';
  
  // ✅ Correct: Use formatResponse for errors
  return NextResponse.json(
    formatResponse.error(message, statusCode),
    { status: statusCode }
  );
}
```

### ❌ Incorrect Error Handling

```typescript
// ❌ WRONG - Don't use inconsistent error responses
catch (error) {
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}

// ❌ WRONG - Don't ignore logging
catch (error) {
  return formatResponse.error('Failed');
}

// ❌ WRONG - Don't use generic error messages
catch (error) {
  return formatResponse.error('Something went wrong');
}
```

## Validation Patterns

### ✅ Proper Request Validation

```typescript
export async function createItemRoute(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ✅ Correct: Validate required fields
    if (!body.name || !body.url || !body.type) {
      return NextResponse.json(
        formatResponse.error('Missing required fields: name, url, type', 400),
        { status: 400 }
      );
    }
    
    // ✅ Additional validation can be done here
    if (!isValidUrl(body.url)) {
      return NextResponse.json(
        formatResponse.error('Invalid URL format', 400),
        { status: 400 }
      );
    }
    
    const result = await service.createItem(body);
    return NextResponse.json(
      formatResponse.success(result, 'Item created successfully'),
      { status: 201 }
    );
    
  } catch (error) {
    // Error handling...
  }
}
```

## File Structure Standards

### ✅ Correct File Organization

```
features/feature-name/
├── api/
│   ├── models/
│   │   ├── feature-request-models.ts     // Only request models
│   │   └── index.ts                      // Export request models + import DTOs
│   └── routes/
│       ├── create-item-route.ts          // Individual route handlers
│       ├── get-items-route.ts
│       └── index.ts                      // Export all routes
├── lib/
│   ├── services/
│   │   └── getServiceName.ts             // Service factory helper
│   └── ...
└── index.ts
```

### ✅ Correct Model Exports

```typescript
// features/automation/api/models/index.ts
// ✅ Correct: Export request models, import DTOs
export * from './automation-request-models';

// Re-export DTOs from domain layer
export type {
  WebhookResponseDto,
  ScheduleResponseDto,
  ExecutionResponseDto
} from '@/domain/dtos/AutomationDtos';
```

## Route Handler Examples

### ✅ Complete Route Handler Template

```typescript
/**
 * [Operation] [Resource] API Route
 * 
 * [METHOD] /api/[path]
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { LoggingService } from '@/core/logging/LoggingService';
import { getServiceName } from '../../lib/services/getServiceName';
import { RequestModel } from '../models';

/**
 * [Operation] [resource] endpoint
 */
export async function operationResourceRoute(request: NextRequest) {
  const logger = new LoggingService('APIName');
  
  try {
    logger.info('[METHOD] /api/[path] - [Operation description]');
    
    // Parse request data (for POST/PUT)
    const body: RequestModel = await request.json();
    
    // Validate required fields
    if (!body.requiredField) {
      return NextResponse.json(
        formatResponse.error('Required field missing', 400),
        { status: 400 }
      );
    }
    
    // Get service
    const service = await getServiceName();
    
    // Execute operation
    const result = await service.performOperation(body);
    
    logger.info('[Operation] completed successfully', { resultId: result.id });
    
    return NextResponse.json(
      formatResponse.success(result, '[Operation] completed successfully'),
      { status: 200 }
    );
    
  } catch (error) {
    logger.error('Error in [operation]', { error });
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const message = error instanceof Error ? error.message : 'Failed to [operation]';
    
    return NextResponse.json(
      formatResponse.error(message, statusCode),
      { status: statusCode }
    );
  }
}
```

## Common Mistakes to Avoid

### 1. Import Errors
```typescript
// ❌ WRONG
import { formatResponse } from '@/core/api';

// ✅ CORRECT
import { formatResponse } from '@/core/errors';
```

### 2. Response Pattern Errors
```typescript
// ❌ WRONG - Don't call formatResponse directly
return formatResponse.success(data);

// ✅ CORRECT - Wrap with NextResponse.json
return NextResponse.json(formatResponse.success(data), { status: 200 });
```

### 3. Type Conversion Errors
```typescript
// ❌ WRONG - Don't create duplicate response types
const response: CustomResponseType = result as CustomResponseType;

// ✅ CORRECT - Use DTOs directly
const response = result; // result is already a DTO
```

### 4. Service Integration Errors
```typescript
// ❌ WRONG - Don't instantiate services directly
const service = new ServiceClass();

// ✅ CORRECT - Use service factory
const service = await getServiceFromFactory();
```

### 5. Error Handling Errors
```typescript
// ❌ WRONG - Inconsistent error handling
catch (error) {
  return { error: 'Failed' };
}

// ✅ CORRECT - Use formatResponse consistently
catch (error) {
  return NextResponse.json(
    formatResponse.error(error.message, 500),
    { status: 500 }
  );
}
```

## Testing Your API Routes

### Manual Testing Checklist

1. **✅ TypeScript Compilation** - No TypeScript errors
2. **✅ Response Format** - Consistent formatResponse usage
3. **✅ Error Handling** - Proper error responses with status codes
4. **✅ Validation** - Required field validation works
5. **✅ Enum Handling** - Query parameters properly validated
6. **✅ Logging** - Appropriate logging for debugging
7. **✅ Service Integration** - Services called correctly

### Example Test Commands

```bash
# Test webhook creation
curl -X POST http://localhost:3000/api/automation/webhooks \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Webhook","entityType":"customer","operation":"create","webhookUrl":"https://example.com/webhook"}'

# Test webhook listing with filters
curl "http://localhost:3000/api/automation/webhooks?entityType=customer&active=true&page=1&pageSize=5"

# Test webhook by ID
curl http://localhost:3000/api/automation/webhooks/1
```

## Summary

The key principles for Rising-BSM API development:

1. **Use `formatResponse` from `@/core/errors`** - Not from `@/core/api`
2. **Wrap `formatResponse` with `NextResponse.json()`** - Don't call directly
3. **Use existing DTOs directly** - Don't create duplicate response models
4. **Validate enum parameters properly** - Don't pass raw strings
5. **Use service factories** - Don't instantiate services directly
6. **Handle errors consistently** - Use proper status codes and logging
7. **Follow established file structure** - Match existing patterns exactly

By following these patterns, your API routes will be consistent with the existing codebase and free from TypeScript errors.
