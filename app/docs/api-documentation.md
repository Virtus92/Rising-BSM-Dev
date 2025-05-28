# Rising-BSM API Documentation

## Overview

The Rising-BSM API provides a comprehensive set of endpoints to interact with the system programmatically. This document outlines the available endpoints, authentication requirements, request/response formats, and examples for each resource type.

## API Structure

The API is built using Next.js API routes and follows RESTful principles. All API endpoints are located under the `/api` prefix.

### Base URL
- Production: `https://dinel.at/api`

### Response Format

All API responses follow a standard format:

```json
{
  "success": true|false,           // Operation result
  "data": { ... },                 // Response data (if successful)
  "message": "...",                // Optional message
  "error": { ... },                // Error details (if unsuccessful)
  "timestamp": "2025-01-23T12:34:56.789Z"  // Response timestamp
}
```

### Error Handling

Error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Error message explaining what went wrong",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }  // Optional detailed error information
  },
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

### Common Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource was successfully created
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authenticated but insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server-side error

## Authentication

Most API endpoints require authentication. The API uses JWT (JSON Web Token) for authentication.

### Authentication Methods

**1. Bearer Token**

Include the JWT in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

**2. Cookie-Based Authentication**

For browser-based clients, authentication cookies are automatically included.

### Obtaining a Token

To obtain a JWT token, authenticate using the login endpoint:

```
POST /api/auth/login
```

Example request:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

### Token Refresh

When a token expires, you can refresh it using:

```
POST /api/auth/refresh
```

The refresh token is automatically included as a cookie for this request.

## API Endpoints

### Authentication

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/auth/login` | POST | Authenticate user | No | None |
| `/api/auth/register` | POST | Register new user | No | None |
| `/api/auth/logout` | POST | Log out user | Yes | None |
| `/api/auth/refresh` | POST | Refresh token | Yes | None |
| `/api/auth/forgot-password` | POST | Request password reset | No | None |
| `/api/auth/reset-password` | POST | Reset password with token | No | None |
| `/api/auth/change-password` | POST | Change current user password | Yes | None |
| `/api/auth/validate-token` | POST | Validate a token | No | None |

### Users

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/users` | GET | List all users | Yes | users.view |
| `/api/users/:id` | GET | Get user by ID | Yes | users.view |
| `/api/users` | POST | Create new user | Yes | users.create |
| `/api/users/:id` | PUT | Update user | Yes | users.edit |
| `/api/users/:id` | DELETE | Delete user | Yes | users.delete |
| `/api/users/me` | GET | Get current user | Yes | None |
| `/api/users/:id/activity` | GET | Get user activity log | Yes | users.view |
| `/api/users/find-by-email` | GET | Find user by email | Yes | users.view |
| `/api/users/count` | GET | Count users | Yes | users.view |
| `/api/users/stats/monthly` | GET | Get monthly user stats | Yes | users.view |
| `/api/users/stats/weekly` | GET | Get weekly user stats | Yes | users.view |
| `/api/users/stats/yearly` | GET | Get yearly user stats | Yes | users.view |

### Customers

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/customers` | GET | List all customers | Yes | customers.view |
| `/api/customers/:id` | GET | Get customer by ID | Yes | customers.view |
| `/api/customers` | POST | Create new customer | Yes | customers.create |
| `/api/customers/:id` | PUT | Update customer | Yes | customers.edit |
| `/api/customers/:id` | DELETE | Delete customer | Yes | customers.delete |
| `/api/customers/:id/notes` | POST | Add note to customer | Yes | customers.edit |
| `/api/customers/:id/status` | PUT | Update customer status | Yes | customers.edit |
| `/api/customers/count` | GET | Count customers | Yes | customers.view |
| `/api/customers/stats/monthly` | GET | Get monthly customer stats | Yes | customers.view |
| `/api/customers/stats/weekly` | GET | Get weekly customer stats | Yes | customers.view |
| `/api/customers/stats/yearly` | GET | Get yearly customer stats | Yes | customers.view |

### Requests

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/requests` | GET | List all requests | Yes | requests.view |
| `/api/requests/:id` | GET | Get request by ID | Yes | requests.view |
| `/api/requests` | POST | Create new request | Yes | requests.create |
| `/api/requests/:id` | PUT | Update request | Yes | requests.edit |
| `/api/requests/:id` | DELETE | Delete request | Yes | requests.delete |
| `/api/requests/:id/notes` | POST | Add note to request | Yes | requests.edit |
| `/api/requests/:id/status` | PUT | Update request status | Yes | requests.edit |
| `/api/requests/:id/assign` | PUT | Assign request to user | Yes | requests.assign |
| `/api/requests/:id/appointment` | POST | Create appointment from request | Yes | requests.convert, appointments.create |
| `/api/requests/:id/convert` | POST | Convert request to customer | Yes | requests.convert, customers.create |
| `/api/requests/:id/link-customer` | PUT | Link request to existing customer | Yes | requests.edit |
| `/api/requests/count` | GET | Count requests | Yes | requests.view |
| `/api/requests/public` | POST | Submit public request form | No | None |
| `/api/requests/data` | GET | Get request form data structure | Yes | requests.view |
| `/api/requests/stats/monthly` | GET | Get monthly request stats | Yes | requests.view |
| `/api/requests/stats/weekly` | GET | Get weekly request stats | Yes | requests.view |
| `/api/requests/stats/yearly` | GET | Get yearly request stats | Yes | requests.view |

### Appointments

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/appointments` | GET | List all appointments | Yes | appointments.view |
| `/api/appointments/:id` | GET | Get appointment by ID | Yes | appointments.view |
| `/api/appointments` | POST | Create new appointment | Yes | appointments.create |
| `/api/appointments/:id` | PUT | Update appointment | Yes | appointments.edit |
| `/api/appointments/:id` | DELETE | Delete appointment | Yes | appointments.delete |
| `/api/appointments/:id/notes` | POST | Add note to appointment | Yes | appointments.edit |
| `/api/appointments/:id/status` | PUT | Update appointment status | Yes | appointments.edit |
| `/api/appointments/count` | GET | Count appointments | Yes | appointments.view |
| `/api/appointments/upcoming` | GET | Get upcoming appointments | Yes | appointments.view |
| `/api/appointments/stats/monthly` | GET | Get monthly appointment stats | Yes | appointments.view |
| `/api/appointments/stats/weekly` | GET | Get weekly appointment stats | Yes | appointments.view |
| `/api/appointments/stats/yearly` | GET | Get yearly appointment stats | Yes | appointments.view |

### Automation

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/automation/webhooks` | GET | List webhooks with filters | Yes | automation.view |
| `/api/automation/webhooks` | POST | Create new webhook | Yes | automation.create |
| `/api/automation/webhooks/:id` | GET | Get webhook by ID | Yes | automation.view |
| `/api/automation/webhooks/:id` | PUT | Update webhook | Yes | automation.edit |
| `/api/automation/webhooks/:id` | DELETE | Delete webhook | Yes | automation.delete |
| `/api/automation/webhooks/:id/toggle` | PATCH | Toggle webhook active status | Yes | automation.edit |
| `/api/automation/webhooks/test` | POST | Test webhook connection | Yes | automation.create |
| `/api/automation/schedules` | GET | List schedules with filters | Yes | automation.view |
| `/api/automation/schedules` | POST | Create new schedule | Yes | automation.create |
| `/api/automation/schedules/:id` | GET | Get schedule by ID | Yes | automation.view |
| `/api/automation/schedules/:id` | PUT | Update schedule | Yes | automation.edit |
| `/api/automation/schedules/:id` | DELETE | Delete schedule | Yes | automation.delete |
| `/api/automation/schedules/:id/toggle` | PATCH | Toggle schedule active status | Yes | automation.edit |
| `/api/automation/schedules/:id/execute` | POST | Execute schedule manually | Yes | automation.manage |
| `/api/automation/executions` | GET | List execution history | Yes | automation.view |
| `/api/automation/executions/:id` | GET | Get execution details | Yes | automation.view |
| `/api/automation/executions/:id/retry` | POST | Retry failed execution | Yes | automation.manage |
| `/api/automation/dashboard` | GET | Get automation dashboard data | Yes | automation.view |
| `/api/automation/cron/parse` | POST | Parse and validate cron expression | Yes | automation.view |

### Notifications

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/notifications` | GET | List user notifications | Yes | notifications.view |
| `/api/notifications/:id` | GET | Get notification by ID | Yes | notifications.view |
| `/api/notifications` | POST | Create notification | Yes | notifications.view |
| `/api/notifications/:id` | DELETE | Delete notification | Yes | notifications.view |
| `/api/notifications/:id/read` | PUT | Mark notification as read | Yes | notifications.view |
| `/api/notifications/read-all` | PUT | Mark all user notifications as read | Yes | notifications.view |

### Permissions

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/permissions` | GET | List all permissions | Yes | permissions.view |
| `/api/permissions/by-code/:code` | GET | Get permission by code | Yes | permissions.view |
| `/api/permissions/role-defaults/:role` | GET | Get default permissions for role | Yes | permissions.view |
| `/api/users/permissions` | GET | Get current user permissions | Yes | None |
| `/api/users/permissions/check` | POST | Check if user has permission | Yes | None |

### Dashboard

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/dashboard` | GET | Get dashboard data | Yes | dashboard.access |
| `/api/dashboard/stats` | GET | Get dashboard statistics | Yes | dashboard.access |
| `/api/dashboard/user` | GET | Get user-specific dashboard data | Yes | dashboard.access |

### Settings

| Endpoint | Method | Description | Auth Required | Permissions |
|----------|--------|-------------|--------------|-------------|
| `/api/settings` | GET | Get system settings | Yes | settings.view |
| `/api/settings/update` | PUT | Update system settings | Yes | settings.edit |

## Detailed Examples

### Automation Management

#### Create Webhook

```
POST /api/automation/webhooks
```

Request:
```json
{
  "name": "Customer Created Webhook",
  "description": "Trigger when a new customer is created",
  "entityType": "customer",
  "operation": "create",
  "webhookUrl": "https://your-webhook-handler.com/customer-created",
  "headers": {
    "Authorization": "Bearer your-token",
    "Content-Type": "application/json"
  },
  "payloadTemplate": {
    "event": "customer.created",
    "customer_id": "{{customer.id}}",
    "customer_name": "{{customer.name}}",
    "created_at": "{{customer.createdAt}}"
  },
  "active": true,
  "retryCount": 3,
  "retryDelaySeconds": 30
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Customer Created Webhook",
    "description": "Trigger when a new customer is created",
    "entityType": "customer",
    "operation": "create",
    "webhookUrl": "https://your-webhook-handler.com/customer-created",
    "headers": {
      "Authorization": "Bearer your-token",
      "Content-Type": "application/json"
    },
    "payloadTemplate": {
      "event": "customer.created",
      "customer_id": "{{customer.id}}",
      "customer_name": "{{customer.name}}",
      "created_at": "{{customer.createdAt}}"
    },
    "active": true,
    "retryCount": 3,
    "retryDelaySeconds": 30,
    "triggerKey": "customer.create",
    "isValid": true,
    "createdAt": "2025-01-23T12:34:56.789Z",
    "updatedAt": "2025-01-23T12:34:56.789Z",
    "createdBy": 1
  },
  "message": "Webhook created successfully",
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

#### List Webhooks with Filters

```
GET /api/automation/webhooks?entityType=customer&active=true&page=1&pageSize=10
```

Response:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Customer Created Webhook",
        "entityType": "customer",
        "operation": "create",
        "webhookUrl": "https://your-webhook-handler.com/customer-created",
        "active": true,
        "createdAt": "2025-01-23T12:34:56.789Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  },
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

#### Create Schedule

```
POST /api/automation/schedules
```

Request:
```json
{
  "name": "Daily Report",
  "description": "Send daily report every morning at 9 AM",
  "cronExpression": "0 9 * * *",
  "webhookUrl": "https://your-webhook-handler.com/daily-report",
  "headers": {
    "Authorization": "Bearer your-token"
  },
  "payload": {
    "report_type": "daily",
    "timestamp": "{{now}}"
  },
  "timezone": "UTC",
  "active": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Daily Report",
    "description": "Send daily report every morning at 9 AM",
    "cronExpression": "0 9 * * *",
    "webhookUrl": "https://your-webhook-handler.com/daily-report",
    "headers": {
      "Authorization": "Bearer your-token"
    },
    "payload": {
      "report_type": "daily",
      "timestamp": "{{now}}"
    },
    "timezone": "UTC",
    "active": true,
    "nextRunAt": "2025-01-24T09:00:00.000Z",
    "scheduleDescription": "Every day at 9:00 AM",
    "isDue": false,
    "isValid": true,
    "createdAt": "2025-01-23T12:34:56.789Z",
    "updatedAt": "2025-01-23T12:34:56.789Z",
    "createdBy": 1
  },
  "message": "Schedule created successfully",
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

#### Test Webhook

```
POST /api/automation/webhooks/test
```

Request:
```json
{
  "webhookUrl": "https://your-webhook-handler.com/test-endpoint",
  "headers": {
    "Authorization": "Bearer your-token",
    "Content-Type": "application/json"
  },
  "payload": {
    "test": true,
    "timestamp": "2025-01-23T12:34:56.789Z"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "responseStatus": 200,
    "responseBody": "{\"received\": true}",
    "executionTimeMs": 245
  },
  "message": "Webhook test successful",
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

#### Parse Cron Expression

```
POST /api/automation/cron/parse
```

Request:
```json
{
  "cronExpression": "0 9 * * MON-FRI",
  "timezone": "America/New_York"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "description": "Every weekday (Monday through Friday) at 9:00 AM",
    "nextRun": "2025-01-24T14:00:00.000Z"
  },
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

#### Get Automation Dashboard

```
GET /api/automation/dashboard
```

Response:
```json
{
  "success": true,
  "data": {
    "totalWebhooks": 5,
    "activeWebhooks": 4,
    "totalSchedules": 3,
    "activeSchedules": 2,
    "totalExecutions": 127,
    "successfulExecutions": 118,
    "failedExecutions": 9,
    "successRate": 92.9,
    "recentExecutions": [
      {
        "id": 127,
        "automationType": "webhook",
        "automationId": 1,
        "status": "success",
        "executedAt": "2025-01-23T12:30:00.000Z",
        "executionTimeMs": 234
      }
    ],
    "topFailedAutomations": [
      {
        "id": 2,
        "name": "Failed Webhook",
        "type": "webhook",
        "failureCount": 5
      }
    ]
  },
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

### User Management

[Previous user management examples remain the same...]

### Customer Management

[Previous customer management examples remain the same...]

### Request Management

[Previous request management examples remain the same...]

### Appointment Management

[Previous appointment management examples remain the same...]

### Notification System

[Previous notification examples remain the same...]

### Permission System

[Previous permission examples remain the same...]

## API Development Best Practices

Based on the Rising-BSM codebase patterns, here are the established best practices for API development:

### Response Formatting

All API routes use the `formatResponse` utility from `@/core/errors`:

```typescript
import { formatResponse } from '@/core/errors';
import { NextRequest, NextResponse } from 'next/server';

// Success response
return NextResponse.json(
  formatResponse.success(data, 'Operation successful'),
  { status: 200 }
);

// Error response
return NextResponse.json(
  formatResponse.error(message, statusCode),
  { status: statusCode }
);
```

### Error Handling Pattern

```typescript
try {
  // API logic here
  const result = await service.performOperation(data);
  
  return NextResponse.json(
    formatResponse.success(result, 'Operation completed successfully'),
    { status: 200 }
  );
  
} catch (error) {
  logger.error('Error in API operation', { error });
  
  const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
  const message = error instanceof Error ? error.message : 'Operation failed';
  
  return NextResponse.json(
    formatResponse.error(message, statusCode),
    { status: statusCode }
  );
}
```

### Enum Parameter Validation

When accepting enum values from query parameters:

```typescript
import { AutomationEntityType } from '@/domain/entities/AutomationWebhook';

const entityTypeParam = searchParams.get('entityType');
const entityType = entityTypeParam && Object.values(AutomationEntityType).includes(entityTypeParam as AutomationEntityType) 
  ? entityTypeParam as AutomationEntityType 
  : undefined;
```

### Using DTOs Directly

Use existing DTOs from the domain layer instead of creating duplicate response models:

```typescript
// ✅ Correct - Use existing DTOs
export type { WebhookResponseDto } from '@/domain/dtos/AutomationDtos';

// ❌ Incorrect - Don't create duplicate response models
export interface WebhookResponse { ... }
```

## Request Validation

The API enforces strict validation for all request bodies. If validation fails, a 422 Unprocessable Entity response is returned:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Must be a valid email address",
      "password": "Must be at least 8 characters long"
    }
  },
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Rate limits vary by endpoint:

- Authentication endpoints: 10 requests per minute
- Standard endpoints: 60 requests per minute
- Public endpoints: 30 requests per minute

When rate limits are exceeded, a 429 Too Many Requests response is returned:

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "details": {
      "retryAfter": 30
    }
  },
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

## Pagination

Many endpoints that return collections support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10, max: 100)

Paginated responses include pagination metadata:

```json
{
  "success": true,
  "data": {
    "data": [...],        // Array of items
    "total": 42,          // Total number of items
    "page": 2,            // Current page
    "pageSize": 10        // Items per page
  },
  "timestamp": "2025-01-23T12:34:56.789Z"
}
```

## Filtering and Sorting

Many collection endpoints support filtering and sorting with the following query parameters:

- `search`: Text search across multiple fields
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (`asc` or `desc`)
- Resource-specific filters (e.g., `status`, `entityType`, `active`)

Example:
```
GET /api/automation/webhooks?entityType=customer&active=true&sortBy=createdAt&sortOrder=desc
```

## API Versioning

The API currently does not use explicit versioning in the URL path. Future breaking changes will be implemented using a version prefix:

```
/api/v2/automation/webhooks
```

## Cross-Origin Resource Sharing (CORS)

The API supports CORS for specified origins. The following headers are returned for CORS requests:

- `Access-Control-Allow-Origin`: Allowed origins
- `Access-Control-Allow-Methods`: Allowed HTTP methods
- `Access-Control-Allow-Headers`: Allowed headers
- `Access-Control-Max-Age`: Preflight cache duration

## Support and Feedback

For API support or to provide feedback:

- GitHub Issues: https://github.com/your-org/rising-bsm/issues
- Developer Forum: https://community.rising-bsm.com
- Email: api-support@rising-bsm.com
