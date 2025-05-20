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
├── middleware/              # API middleware
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
└── users/                   # User-related endpoints
    ├── count/               # Count endpoints
    ├── dashboard/           # User dashboard data
    ├── find-by-email/       # Email lookup endpoint
    ├── me/                  # Current user endpoint
    ├── permissions/         # User permissions endpoints
    │   └── check/           # Permission check endpoint
    ├── roles/               # User roles endpoints
    ├── stats/               # Statistics endpoints
    ├── [id]/                # Single user operations
    │   ├── activity/        # User activity operations
    │   ├── reset-password/  # Password reset operations
    │   └── status/          # User status operations
    └── route.ts             # Collection operations
```

## API Design Principles

The Rising-BSM API is designed following these principles:

1. **RESTful**: Resources are represented by URLs and manipulated using standard HTTP methods
2. **JSON**: All requests and responses use JSON format
3. **Consistent**: All endpoints follow consistent patterns for requests and responses
4. **Secure**: Authentication and permission checks are enforced
5. **Error Handling**: Consistent error handling and reporting
6. **Factory Pattern**: Services and repositories are created through factories

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
  "error": null
}
```

For error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Error message",
  "statusCode": 400
}
```

### Pagination

Collection endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (default: createdAt)
- `sortDirection`: Sort direction (asc/desc, default: desc)

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Filtering

Collection endpoints support filtering with query parameters:

- Field-based filters: Any field can be used as a filter
- `search`: Search term for text search
- `status`: Filter by status

Example: `/api/customers?status=active&search=smith&city=london`

## Authentication

The API uses JWT-based authentication. Authentication flow:

1. **Login**: Client sends credentials to `/api/auth/login` and receives tokens via HTTP-only cookies
2. **Access**: APIs validate tokens automatically via middleware
3. **Refresh**: When access token expires, client uses refresh token to get new tokens
4. **Logout**: Client sends request to `/api/auth/logout` to invalidate tokens

### Authentication Endpoints

- **POST /api/auth/login**: Authenticate user and get tokens
- **POST /api/auth/register**: Register new user
- **POST /api/auth/refresh**: Refresh access token
- **POST /api/auth/logout**: Invalidate tokens
- **POST /api/auth/change-password**: Change user password
- **POST /api/auth/forgot-password**: Initiate password recovery
- **POST /api/auth/reset-password**: Reset password with token

## Route Handler Pattern

Each API endpoint is implemented using Next.js Route Handlers with a consistent pattern:

```typescript
// api/customers/route.ts
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

// Get list of customers
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const serviceFactory = getServiceFactory();
      
      try {
        // Extract filter parameters from query
        const { searchParams } = new URL(req.url);
        
        const filters = {
          search: searchParams.get('search') || undefined,
          status: searchParams.get('status') || undefined,
          // Other filters...
          page: searchParams.has('page') 
            ? parseInt(searchParams.get('page') as string)
            : 1,
          limit: searchParams.has('limit') 
            ? parseInt(searchParams.get('limit') as string)
            : 10
        };
        
        // Get the customer service
        const customerService = serviceFactory.createCustomerService();
        
        // Use the service for getting data
        const result = await customerService.getAll({
          page: filters.page,
          limit: filters.limit,
          filters: {
            status: filters.status,
            search: filters.search
            // Other filters...
          }
        });

        // Success response
        return formatResponse.success(
          result,
          'Customers retrieved successfully'
        );
        
      } catch (error) {
        // Error handling
        return formatResponse.error(
          error instanceof Error ? error.message : 'Error retrieving customers',
          500
        );
      }
    },
    SystemPermission.CUSTOMERS_VIEW
  ),
  { requiresAuth: true }
);
```

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
- Error message
- HTTP status code
- Success: false indicator

Example error response:

```json
{
  "success": false,
  "data": null,
  "error": "Invalid input data: Email is required",
  "statusCode": 400
}
```

## Middleware

API endpoints use middleware for cross-cutting concerns:

1. **Authentication**: Verify user is authenticated via `withAuth` middleware
2. **Authorization**: Check user permissions via permission middleware
3. **Validation**: Validate request data
4. **Error Handling**: Catch and format errors

## Service Integration

API endpoints delegate business logic to service layers:

1. **Service Factory**: Creates service instances with proper dependencies
2. **Service Call**: Call the appropriate service method
3. **Repository Integration**: Services use repositories for data access
4. **Response Formatting**: Format the service response for the API

## Best Practices

1. **Use routeHandler**: Always use the routeHandler utility for consistency
2. **Proper Authentication**: Use authentication middleware for protected routes
3. **Permission Checks**: Use permission middleware for access control
4. **Service Factories**: Use the service factory pattern for dependency management
5. **Consistent Responses**: Use formatResponse for consistent response format
6. **Error Handling**: Implement proper error handling with try/catch blocks
7. **Pagination**: Implement pagination for collection endpoints
8. **Filtering**: Support filtering for collection endpoints
9. **Documentation**: Document all endpoints with comments

## Adding New Endpoints

To add a new API endpoint:

1. Create directory in the appropriate resource section
2. Create route.ts file with the endpoint implementation
3. Use routeHandler with proper middleware
4. Implement service and repository as needed
5. Test the endpoint
6. Document the endpoint

Example new endpoint:

```typescript
// api/customers/export/route.ts
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      try {
        const format = req.nextUrl.searchParams.get('format') || 'csv';
        const serviceFactory = getServiceFactory();
        const customerService = serviceFactory.createCustomerService();
        
        const result = await customerService.exportCustomers(format);
        
        return formatResponse.success(result, 'Customers exported successfully');
      } catch (error) {
        return formatResponse.error(
          error instanceof Error ? error.message : 'Error exporting customers',
          500
        );
      }
    },
    SystemPermission.CUSTOMERS_EXPORT
  ),
  { requiresAuth: true }
);
```
