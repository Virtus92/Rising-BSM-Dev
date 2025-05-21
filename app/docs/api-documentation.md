# Rising-BSM API Documentation

## Overview

The Rising-BSM API provides a comprehensive set of endpoints to interact with the system programmatically. This document outlines the available endpoints, authentication requirements, request/response formats, and examples for each resource type.

## API Structure

The API is built using Next.js API routes and follows RESTful principles. All API endpoints are located under the `/api` prefix.

### Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Response Format

All API responses follow a standard format:

```json
{
  "success": true|false,           // Operation result
  "data": { ... },                 // Response data (if successful)
  "message": "...",                // Optional message
  "error": { ... },                // Error details (if unsuccessful)
  "statusCode": 200,               // HTTP status code
  "timestamp": "2025-05-21T12:34:56.789Z"  // Response timestamp
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
  "statusCode": 400,
  "timestamp": "2025-05-21T12:34:56.789Z"
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
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
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

### User Management

#### List Users

```
GET /api/users
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search text
- `sort`: Field to sort by
- `order`: Sort order (asc, desc)
- `status`: Filter by status
- `role`: Filter by role

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-02T00:00:00.000Z"
      },
      // More users...
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  },
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

#### Create User

```
POST /api/users
```

Request:
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "securepassword123",
  "role": "employee",
  "status": "active"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 26,
    "name": "New User",
    "email": "newuser@example.com",
    "role": "employee",
    "status": "active",
    "createdAt": "2025-05-21T12:34:56.789Z",
    "updatedAt": "2025-05-21T12:34:56.789Z"
  },
  "message": "User created successfully",
  "statusCode": 201,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

### Customer Management

#### Get Customer

```
GET /api/customers/123
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1234567890",
    "address": "123 Business St, City, State, 12345",
    "notes": [
      {
        "id": 1,
        "content": "Initial meeting on 2025-03-15",
        "createdAt": "2025-03-15T15:30:00.000Z",
        "createdBy": {
          "id": 1,
          "name": "Admin User"
        }
      }
    ],
    "status": "active",
    "createdAt": "2025-03-10T00:00:00.000Z",
    "updatedAt": "2025-03-15T15:30:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

#### Add Customer Note

```
POST /api/customers/123/notes
```

Request:
```json
{
  "content": "Follow-up meeting scheduled for next week"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "customerId": 123,
    "content": "Follow-up meeting scheduled for next week",
    "createdAt": "2025-05-21T12:34:56.789Z",
    "createdBy": {
      "id": 1,
      "name": "Admin User"
    }
  },
  "message": "Note added successfully",
  "statusCode": 201,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

### Request Management

#### List Requests with Filtering

```
GET /api/requests?status=pending&assignedTo=1&sort=createdAt&order=desc&page=1&limit=5
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 42,
        "title": "Technical support request",
        "description": "Need help with system configuration",
        "status": "pending",
        "priority": "medium",
        "assignedTo": {
          "id": 1,
          "name": "Admin User"
        },
        "customer": {
          "id": 123,
          "name": "Acme Corporation"
        },
        "createdAt": "2025-05-20T10:30:00.000Z",
        "updatedAt": "2025-05-20T11:45:00.000Z"
      },
      // More requests...
    ],
    "total": 15,
    "page": 1,
    "limit": 5,
    "pages": 3
  },
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

#### Convert Request to Customer

```
POST /api/requests/42/convert
```

Request:
```json
{
  "name": "New Customer from Request",
  "email": "contact@newcustomer.com",
  "phone": "+1987654321",
  "address": "456 New St, City, State, 54321",
  "additionalInfo": {
    "industry": "Technology",
    "size": "Medium"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 124,
      "name": "New Customer from Request",
      "email": "contact@newcustomer.com",
      "phone": "+1987654321",
      "address": "456 New St, City, State, 54321",
      "status": "active",
      "createdAt": "2025-05-21T12:34:56.789Z",
      "updatedAt": "2025-05-21T12:34:56.789Z"
    },
    "request": {
      "id": 42,
      "status": "converted",
      "customerId": 124,
      "updatedAt": "2025-05-21T12:34:56.789Z"
    }
  },
  "message": "Request successfully converted to customer",
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

### Appointment Management

#### Create Appointment

```
POST /api/appointments
```

Request:
```json
{
  "title": "Initial Consultation",
  "description": "Discuss project requirements",
  "startTime": "2025-06-15T14:00:00.000Z",
  "endTime": "2025-06-15T15:00:00.000Z",
  "customerId": 123,
  "assignedTo": 1,
  "location": "Online Meeting",
  "status": "scheduled"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 56,
    "title": "Initial Consultation",
    "description": "Discuss project requirements",
    "startTime": "2025-06-15T14:00:00.000Z",
    "endTime": "2025-06-15T15:00:00.000Z",
    "customerId": 123,
    "customer": {
      "id": 123,
      "name": "Acme Corporation"
    },
    "assignedTo": 1,
    "assignedUser": {
      "id": 1,
      "name": "Admin User"
    },
    "location": "Online Meeting",
    "status": "scheduled",
    "createdAt": "2025-05-21T12:34:56.789Z",
    "updatedAt": "2025-05-21T12:34:56.789Z"
  },
  "message": "Appointment created successfully",
  "statusCode": 201,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

### Notification System

#### Get User Notifications

```
GET /api/notifications?unreadOnly=true
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "title": "New Appointment",
        "message": "You have a new appointment scheduled for tomorrow",
        "type": "appointment",
        "read": false,
        "entityId": 56,
        "entityType": "appointment",
        "createdAt": "2025-05-20T15:30:00.000Z"
      },
      {
        "id": 122,
        "title": "Request Assigned",
        "message": "A new request has been assigned to you",
        "type": "request",
        "read": false,
        "entityId": 42,
        "entityType": "request",
        "createdAt": "2025-05-20T14:15:00.000Z"
      }
    ],
    "total": 2,
    "unreadCount": 2
  },
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

#### Mark Notification as Read

```
PUT /api/notifications/123/read
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "read": true,
    "updatedAt": "2025-05-21T12:34:56.789Z"
  },
  "message": "Notification marked as read",
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

### Permission System

#### Check User Permissions

```
POST /api/users/permissions/check
```

Request:
```json
{
  "userId": 1,
  "permissions": ["users.view", "customers.edit", "system.admin"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "hasAllPermissions": true,
    "permissionResults": {
      "users.view": true,
      "customers.edit": true,
      "system.admin": true
    }
  },
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
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
  "statusCode": 422,
  "timestamp": "2025-05-21T12:34:56.789Z"
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
  "statusCode": 429,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

## Pagination

Many endpoints that return collections support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Paginated responses include pagination metadata:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 42,      // Total number of items
    "page": 2,        // Current page
    "limit": 10,      // Items per page
    "pages": 5        // Total number of pages
  },
  "statusCode": 200,
  "timestamp": "2025-05-21T12:34:56.789Z"
}
```

## Filtering and Sorting

Many collection endpoints support filtering and sorting with the following query parameters:

- `search`: Text search across multiple fields
- `sort`: Field to sort by
- `order`: Sort order (`asc` or `desc`)
- Resource-specific filters (e.g., `status`, `role`, `priority`)

Example:
```
GET /api/customers?search=acme&sort=createdAt&order=desc&status=active
```

## API Versioning

The API currently does not use explicit versioning in the URL path. Future breaking changes will be implemented using a version prefix:

```
/api/v2/users
```

## Cross-Origin Resource Sharing (CORS)

The API supports CORS for specified origins. The following headers are returned for CORS requests:

- `Access-Control-Allow-Origin`: Allowed origins
- `Access-Control-Allow-Methods`: Allowed HTTP methods
- `Access-Control-Allow-Headers`: Allowed headers
- `Access-Control-Max-Age`: Preflight cache duration

## WebHooks

The API supports webhooks for integration with external systems. Webhooks are available for key events:

- Customer created/updated
- Request created/updated/status changed
- Appointment created/updated/status changed

To register a webhook:

```
POST /api/webhooks/n8n
```

Request:
```json
{
  "url": "https://your-webhook-handler.com/endpoint",
  "events": ["customer.created", "request.created"],
  "secret": "your_webhook_secret"
}
```

Webhook payloads include an `x-webhook-signature` header for verification.

## SDK and API Clients

For simplified API integration, the following client libraries are available:

- JavaScript/TypeScript: `@rising-bsm/api-client`
- Python: `rising-bsm-client`
- PHP: `rising-bsm/api-client`

Example usage (JavaScript):

```javascript
import { RisingBsmClient } from '@rising-bsm/api-client';

const client = new RisingBsmClient({
  baseUrl: 'https://your-domain.com/api',
  token: 'your_jwt_token'
});

// Get customers
const customers = await client.customers.list({ status: 'active' });

// Create appointment
const appointment = await client.appointments.create({
  title: 'New Meeting',
  startTime: '2025-06-20T10:00:00.000Z',
  endTime: '2025-06-20T11:00:00.000Z',
  customerId: 123
});
```

## API Changes and Deprecation

Changes to the API will be communicated through:

1. Release notes in the documentation
2. Deprecation headers on affected endpoints
3. Email notifications for registered developers

Deprecated endpoints will continue to function for at least 6 months after deprecation notice.

## Support and Feedback

For API support or to provide feedback:

- GitHub Issues: https://github.com/your-org/rising-bsm/issues
- Developer Forum: https://community.rising-bsm.com
- Email: api-support@rising-bsm.com