# API Module

## Overview

The API module provides the backend REST API for the Rising-BSM application. It's built using Next.js Route Handlers and follows RESTful principles. The API is organized by domain resources and provides endpoints for all the core functionality of the application.

## Directory Structure

```
api/
├── appointments/            # Appointment-related endpoints
│   ├── count/               # Count endpoints
│   ├── stats/               # Statistics endpoints
│   ├── upcoming/            # Upcoming appointments
│   ├── [id]/                # Single appointment operations
│   │   ├── notes/           # Appointment notes operations
│   │   └── status/          # Appointment status operations
│   └── route.ts             # Collection operations
├── auth/                    # Authentication endpoints
│   ├── login/               # Login endpoint
│   ├── logout/              # Logout endpoint
│   ├── register/            # Registration endpoint
│   ├── refresh/             # Token refresh endpoint
│   ├── change-password/     # Password change endpoint
│   ├── forgot-password/     # Password recovery endpoint
│   └── reset-password/      # Password reset endpoint
├── bootstrap/               # Application initialization
├── customers/               # Customer-related endpoints
│   ├── count/               # Count endpoints
│   ├── stats/               # Statistics endpoints
│   ├── [id]/                # Single customer operations
│   │   ├── notes/           # Customer notes operations
│   │   └── status/          # Customer status operations
│   └── route.ts             # Collection operations
├── dashboard/               # Dashboard data endpoints
│   ├── stats/               # Statistics endpoints
│   └── user/                # User-specific dashboard data
├── error.ts                 # Global error handling
├── helpers/                 # API utility functions
├── log/                     # Logging endpoints
├── notifications/           # Notification endpoints
│   ├── read-all/            # Mark all as read endpoint
│   ├── [id]/                # Single notification operations
│   │   └── read/            # Mark as read endpoint
│   └── route.ts             # Collection operations
├── permissions/             # Permission management endpoints
│   ├── by-code/             # Permission lookup by code
│   ├── role-defaults/       # Default role permissions
│   └── route.ts             # Collection operations
├── requests/                # Request-related endpoints
│   ├── count/               # Count endpoints
│   ├── data/                # Request data operations
│   ├── public/              # Public request creation
│   ├── stats/               # Statistics endpoints
│   ├── [id]/                # Single request operations
│   │   ├── appointment/     # Request-to-appointment operations
│   │   ├── assign/          # Assignment operations
│   │   ├── convert/         # Conversion operations
│   │   ├── link-customer/   # Link to customer operations
│   │   ├── notes/           # Request notes operations
│   │   └── status/          # Request status operations
│   └── route.ts             # Collection operations
├── settings/                # Application settings endpoints
│   └── update/              # Settings update endpoint
├── users/                   # User-related endpoints
│   ├── count/               # Count endpoints
│   ├── dashboard/           # User dashboard data
│   ├── find-by-email/       # Email lookup endpoint
│   ├── me/                  # Current user endpoint
│   ├── permissions/         # User permissions endpoints
│   │   └── check/           # Permission check endpoint
│   ├── roles/               # User roles endpoints
│   ├── stats/               # Statistics endpoints
│   ├── [id]/                # Single user operations
│   │   ├── activity/        # User activity operations
│   │   ├── reset-password/  # Password reset operations
│   │   └── status/          # User status operations
│   └── route.ts             # Collection operations
└── webhooks/                # Webhook endpoints
    └── n8n/                 # n8n integration webhooks
```

## API Design Principles

The Rising-BSM API is designed following these principles:

1. **RESTful**: Resources are represented by URLs and manipulated using standard HTTP methods
2. **JSON**: All requests and responses use JSON format
3. **Consistent**: All endpoints follow consistent patterns for requests and responses
4. **Versioned**: API versioning is supported through URL or header
5. **Secure**: Authentication and permission checks are enforced
6. **Documented**: Each endpoint is documented with input/output definitions
7. **Error Handling**: Consistent error handling and reporting

## Common Patterns

### URL Structure

The API follows a consistent URL structure:

- `/api/[resource]`: Collection endpoints (GET, POST)
- `/api/[resource]/[id]`: Resource endpoints (GET, PUT, DELETE)
- `/api/[resource]/[id]/[action]`: Resource action endpoints
- `/api/[resource]/[action]`: Collection action endpoints

### HTTP Methods

- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT**: Update resources (full update)
- **PATCH**: Partial update resources
- **DELETE**: Delete resources

### Request Format

All request bodies follow a consistent format:

```json
{
  "field1": "value1",
  "field2": "value2",
  ...
}
```

### Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... },
  "message": "Optional message"
}
```

For error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### Pagination

Collection endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Field to sort by (default: createdAt)
- `order`: Sort order (asc/desc, default: desc)

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### Filtering

Collection endpoints support filtering with query parameters:

- `filter[field]`: Filter by field value
- `search`: Search term for text search
- `dateFrom`: Filter by date range start
- `dateTo`: Filter by date range end

Example: `/api/customers?filter[status]=active&search=smith`

## Authentication

The API uses JWT-based authentication. Authentication flow:

1. **Login**: Client sends credentials to `/api/auth/login` and receives tokens
2. **Access**: Client includes `Authorization: Bearer [token]` header
3. **Refresh**: When access token expires, client uses refresh token to get new tokens
4. **Logout**: Client sends refresh token to `/api/auth/logout` to invalidate it

### Authentication Endpoints

- **POST /api/auth/login**: Authenticate user and get tokens
- **POST /api/auth/register**: Register new user
- **POST /api/auth/refresh**: Refresh access token
- **POST /api/auth/logout**: Invalidate refresh token
- **POST /api/auth/change-password**: Change user password
- **POST /api/auth/forgot-password**: Initiate password recovery
- **POST /api/auth/reset-password**: Reset password with token

## Key Endpoints

### User Endpoints

- **GET /api/users**: Get list of users
- **GET /api/users/[id]**: Get user by ID
- **POST /api/users**: Create new user
- **PUT /api/users/[id]**: Update user
- **DELETE /api/users/[id]**: Delete user
- **GET /api/users/me**: Get current user
- **GET /api/users/[id]/activity**: Get user activity

### Customer Endpoints

- **GET /api/customers**: Get list of customers
- **GET /api/customers/[id]**: Get customer by ID
- **POST /api/customers**: Create new customer
- **PUT /api/customers/[id]**: Update customer
- **DELETE /api/customers/[id]**: Delete customer
- **POST /api/customers/[id]/notes**: Add customer note
- **GET /api/customers/stats/monthly**: Get monthly customer stats

### Request Endpoints

- **GET /api/requests**: Get list of requests
- **GET /api/requests/[id]**: Get request by ID
- **POST /api/requests**: Create new request
- **PUT /api/requests/[id]**: Update request
- **DELETE /api/requests/[id]**: Delete request
- **POST /api/requests/[id]/notes**: Add request note
- **PUT /api/requests/[id]/status**: Update request status
- **POST /api/requests/[id]/convert**: Convert request to customer
- **POST /api/requests/[id]/appointment**: Create appointment from request
- **POST /api/requests/public**: Create request from public form

### Appointment Endpoints

- **GET /api/appointments**: Get list of appointments
- **GET /api/appointments/[id]**: Get appointment by ID
- **POST /api/appointments**: Create new appointment
- **PUT /api/appointments/[id]**: Update appointment
- **DELETE /api/appointments/[id]**: Delete appointment
- **POST /api/appointments/[id]/notes**: Add appointment note
- **PUT /api/appointments/[id]/status**: Update appointment status
- **GET /api/appointments/upcoming**: Get upcoming appointments

### Notification Endpoints

- **GET /api/notifications**: Get user notifications
- **PUT /api/notifications/[id]/read**: Mark notification as read
- **PUT /api/notifications/read-all**: Mark all notifications as read

### Dashboard Endpoints

- **GET /api/dashboard/stats**: Get dashboard statistics
- **GET /api/dashboard/user**: Get user-specific dashboard data

## Error Handling

The API implements consistent error handling:

1. **Validation Errors**: For invalid input data
2. **Authentication Errors**: For authentication failures
3. **Authorization Errors**: For permission issues
4. **Not Found Errors**: For non-existent resources
5. **Conflict Errors**: For state conflicts
6. **Internal Errors**: For unexpected server errors

Error responses include:
- Error code
- Human-readable message
- Detailed information where appropriate

Example error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

## Implementation Details

### Route Handler Pattern

Each API endpoint is implemented using Next.js Route Handlers with a consistent pattern:

```typescript
// api/customers/route.ts
import { NextRequest } from 'next/server';
import { RouteHandler } from '@/core/api/server';
import { customerService } from '@/features/customers/lib';
import { authMiddleware } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

// Get list of customers
export const GET = RouteHandler(
  async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      // Other params...
    };
    
    const result = await customerService.findCustomers(params);
    return result;
  },
  [
    authMiddleware,
    permissionMiddleware('customers.view')
  ]
);

// Create new customer
export const POST = RouteHandler(
  async (req: NextRequest) => {
    const data = await req.json();
    const result = await customerService.createCustomer(data);
    return result;
  },
  [
    authMiddleware,
    permissionMiddleware('customers.create')
  ]
);
```

### Middleware Chain

API endpoints use middleware chains for cross-cutting concerns:

1. **Authentication**: Verify user is authenticated
2. **Authorization**: Check user permissions
3. **Validation**: Validate request data
4. **Logging**: Log API requests
5. **Error Handling**: Catch and format errors

### Service Integration

API endpoints delegate business logic to service layers:

1. **Service Call**: Call the appropriate service method
2. **Data Mapping**: Map between API and domain models
3. **Response Formatting**: Format the service response for the API

## Best Practices

1. **Security First**: Always implement proper authentication and authorization
2. **Validation**: Validate all input data
3. **Clear Naming**: Use clear and consistent naming for endpoints
4. **Documentation**: Document all endpoints
6. **Error Handling**: Implement comprehensive error handling
7. **Logging**: Log all API activity
8. **Rate Limiting**: Implement rate limiting for public endpoints
9. **CORS**: Configure proper CORS settings

## API Documentation

The full API documentation includes:

1. **Endpoint Description**: What the endpoint does
2. **URL**: The endpoint URL
3. **Method**: HTTP method
4. **URL Params**: Required and optional URL parameters
5. **Data Params**: Required and optional request body parameters
6. **Success Response**: Format of successful response
7. **Error Responses**: Possible error responses
8. **Sample Call**: Example API call
9. **Notes**: Additional information

For each endpoint, a comprehensive documentation will be maintained in the code comments and generated into API documentation.

## Testing the API

The API endpoints can be tested using:

1. **Postman**: Collection of API requests
2. **Swagger UI**: Interactive API documentation
3. **Curl**: Command-line HTTP client
4. **API Test Suite**: Automated tests

Example test with curl:

```bash
# Get authentication token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Use token to get customers
curl -X GET http://localhost:3000/api/customers \
  -H "Authorization: Bearer [token]"
```

## Adding New Endpoints

To add a new API endpoint:

1. Create route file in the appropriate directory
2. Implement the route handler with proper middleware
3. Add service integration
4. Add documentation
5. Add tests

Example new endpoint implementation:

```typescript
// api/customers/export/route.ts
import { NextRequest } from 'next/server';
import { RouteHandler } from '@/core/api/server';
import { customerService } from '@/features/customers/lib';
import { authMiddleware } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

export const GET = RouteHandler(
  async (req: NextRequest) => {
    const format = req.nextUrl.searchParams.get('format') || 'csv';
    const result = await customerService.exportCustomers(format);
    return result;
  },
  [
    authMiddleware,
    permissionMiddleware('customers.export')
  ]
);
```
