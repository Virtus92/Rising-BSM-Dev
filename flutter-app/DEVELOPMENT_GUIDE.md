# Rising BSM Flutter App Development Guide

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Backend API Overview](#backend-api-overview)
4. [Authentication Implementation](#authentication-implementation)
5. [Core Features](#core-features)
   - [User Management](#user-management)
   - [Customer Management](#customer-management)
   - [Request Management](#request-management)
   - [Appointment Management](#appointment-management)
   - [Notifications](#notifications)
6. [Data Models](#data-models)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Flutter App Implementation Guide](#flutter-app-implementation-guide)
   - [App Architecture](#app-architecture)
   - [State Management](#state-management)
   - [Navigation](#navigation)
   - [API Integration](#api-integration)
   - [Authentication Flow](#authentication-flow)
   - [Offline Support](#offline-support)
9. [Admin Features](#admin-features)
10. [User Features](#user-features)
11. [Development Roadmap](#development-roadmap)
12. [Testing Strategy](#testing-strategy)

## Introduction

The Rising BSM Flutter App is a mobile client for the Rising BSM (Business Service Management) platform. The app will initially focus on providing administrative functionality, with user-facing features planned for future development.

The Flutter app will communicate with the existing NextJS backend, which provides RESTful APIs for all required functionality. This guide provides a comprehensive overview of the backend system, APIs, and implementation guidance for the Flutter app development.

## System Architecture

Rising BSM follows a modular, feature-based architecture that organizes code by domain rather than technical function:

- **Core**: Foundation services, utilities, and abstractions
- **Domain**: Business entities, interfaces, and contracts
- **Features**: Implementation of business capabilities
- **Shared**: Reusable components and utilities

The backend uses the following technology stack:

- **Framework**: Next.js 15.x with App Router
- **API**: RESTful API built with Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh token rotation
- **Authorization**: Custom permission-based system

## Backend API Overview

The Rising BSM API follows RESTful principles with a consistent structure:

- **URL Structure**:
  - `/api/[resource]`: Collection endpoints (GET, POST)
  - `/api/[resource]/[id]`: Resource endpoints (GET, PUT, DELETE)
  - `/api/[resource]/[id]/[action]`: Resource action endpoints
  - `/api/[resource]/[action]`: Collection action endpoints

- **HTTP Methods**:
  - **GET**: Retrieve resources
  - **POST**: Create resources
  - **PUT**: Update resources (full update)
  - **PATCH**: Partial update resources
  - **DELETE**: Delete resources

- **Response Format**:
  - Success response:
    ```json
    {
      "success": true,
      "data": { ... },
      "meta": { ... },
      "message": "Optional message"
    }
    ```
  - Error response:
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

- **Pagination**:
  - Supports pagination with the following query parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `sort`: Field to sort by (default: createdAt)
    - `order`: Sort order (asc/desc, default: desc)
  - Response includes pagination metadata:
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

- **Filtering**:
  - Supports filtering with query parameters:
    - `filter[field]`: Filter by field value
    - `search`: Search term for text search
    - `dateFrom`: Filter by date range start
    - `dateTo`: Filter by date range end
  - Example: `/api/customers?filter[status]=active&search=smith`

## Authentication Implementation

Rising BSM implements a secure authentication system using JWT tokens with refresh token rotation:

### Authentication Flow

1. **Login**: 
   - POST to `/api/auth/login` with email and password
   - Receive access token (short-lived) and refresh token (long-lived)
   - Tokens are returned in both HTTP-only cookies and response body

2. **Token Usage**:
   - Include the access token in `Authorization: Bearer [token]` header
   - Access token is valid for a limited time (default: 15 minutes)

3. **Token Refresh**:
   - When access token expires, call `/api/auth/refresh` with refresh token
   - Receive new access token and refresh token
   - Old refresh token is invalidated (token rotation)

4. **Logout**:
   - Call `/api/auth/logout` to invalidate tokens
   - Refresh token is added to blacklist

### Authentication Endpoints

- **POST /api/auth/login**: Authenticate user and get tokens
- **POST /api/auth/register**: Register new user
- **POST /api/auth/refresh**: Refresh access token
- **POST /api/auth/logout**: Invalidate refresh token
- **POST /api/auth/change-password**: Change user password
- **POST /api/auth/forgot-password**: Initiate password recovery
- **POST /api/auth/reset-password**: Reset password with token

### Token Management in Flutter App

For the Flutter app, implement a token manager that:
1. Securely stores tokens (consider using flutter_secure_storage)
2. Automatically refreshes tokens when needed
3. Attaches tokens to API requests
4. Handles token expiration and unauthorized scenarios

## Core Features

### User Management

User management handles authentication, authorization, and profile management.

**Key Functionality**:
- User authentication
- Profile management
- Role-based access control
- Activity tracking

**Key Endpoints**:
- **GET /api/users**: Get list of users (admin/manager)
- **GET /api/users/[id]**: Get user by ID
- **POST /api/users**: Create new user (admin/manager)
- **PUT /api/users/[id]**: Update user
- **DELETE /api/users/[id]**: Delete user (admin)
- **GET /api/users/me**: Get current user profile
- **PUT /api/users/[id]/status**: Update user status (admin)
- **GET /api/users/[id]/activity**: Get user activity history

### Customer Management

Customer management handles customer information and relationship data.

**Key Functionality**:
- Customer profiles
- Contact information
- Customer relationship history
- Activity tracking and notes

**Key Endpoints**:
- **GET /api/customers**: Get list of customers
- **GET /api/customers/[id]**: Get customer by ID
- **POST /api/customers**: Create new customer
- **PUT /api/customers/[id]**: Update customer
- **DELETE /api/customers/[id]**: Delete customer
- **POST /api/customers/[id]/notes**: Add customer note
- **GET /api/customers/stats/monthly**: Get monthly customer stats

### Request Management

Request management handles service and information requests from customers.

**Key Functionality**:
- Service request tracking
- Request assignment
- Status updates
- Conversion to appointments or customers
- Notes and history

**Key Endpoints**:
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

### Appointment Management

Appointment management handles scheduling and calendar functionality.

**Key Functionality**:
- Calendar integration
- Availability management
- Appointment status tracking
- Customer appointments
- Reminder notifications

**Key Endpoints**:
- **GET /api/appointments**: Get list of appointments
- **GET /api/appointments/[id]**: Get appointment by ID
- **POST /api/appointments**: Create new appointment
- **PUT /api/appointments/[id]**: Update appointment
- **DELETE /api/appointments/[id]**: Delete appointment
- **POST /api/appointments/[id]/notes**: Add appointment note
- **PUT /api/appointments/[id]/status**: Update appointment status
- **GET /api/appointments/upcoming**: Get upcoming appointments

### Notifications

Notifications system handles system and user-generated notifications.

**Key Functionality**:
- System notifications
- User notifications
- Read/unread status
- Notification preferences

**Key Endpoints**:
- **GET /api/notifications**: Get user notifications
- **PUT /api/notifications/[id]/read**: Mark notification as read
- **PUT /api/notifications/read-all**: Mark all notifications as read
- **GET /api/dashboard/user**: Get user-specific dashboard data with notifications

## Data Models

The Rising BSM system includes the following key data models:

### User

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'user';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  phone?: string;
  profilePictureId?: number;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  settings?: UserSettings;
}
```

### Customer

```typescript
interface Customer {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country: string;
  vatNumber?: string;
  notes?: string;
  newsletter: boolean;
  status: 'active' | 'inactive';
  type: 'private' | 'business';
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
}
```

### ContactRequest (Service Request)

```typescript
interface ContactRequest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  status: 'new' | 'processing' | 'completed' | 'rejected';
  processorId?: number;
  customerId?: number;
  appointmentId?: number;
  source?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  notes?: RequestNote[];
  requestData?: RequestData[];
}
```

### Appointment

```typescript
interface Appointment {
  id: number;
  title: string;
  customerId?: number;
  appointmentDate: string;
  duration?: number;
  location?: string;
  description?: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  notes?: AppointmentNote[];
}
```

### Notification

```typescript
interface Notification {
  id: number;
  userId?: number;
  referenceId?: number;
  referenceType?: string;
  type: string;
  title: string;
  message?: string;
  description?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints Reference

### Authentication API

| Method | Endpoint                  | Description               | Auth Required |
|--------|---------------------------|---------------------------|--------------|
| POST   | /api/auth/login           | User login                | No           |
| POST   | /api/auth/register        | User registration         | No           |
| POST   | /api/auth/refresh         | Refresh access token      | No (needs refresh token) |
| POST   | /api/auth/logout          | User logout               | Yes          |
| POST   | /api/auth/change-password | Change user password      | Yes          |
| POST   | /api/auth/forgot-password | Request password reset    | No           |
| POST   | /api/auth/reset-password  | Reset password with token | No           |
| GET    | /api/auth/validate        | Validate current token    | No           |

### Users API

| Method | Endpoint                   | Description              | Auth Required | Permissions     |
|--------|----------------------------|--------------------------|--------------|-----------------|
| GET    | /api/users                 | List users               | Yes          | users.view      |
| GET    | /api/users/[id]            | Get user by ID           | Yes          | users.view      |
| POST   | /api/users                 | Create user              | Yes          | users.create    |
| PUT    | /api/users/[id]            | Update user              | Yes          | users.update    |
| DELETE | /api/users/[id]            | Delete user              | Yes          | users.delete    |
| GET    | /api/users/me              | Get current user         | Yes          | -               |
| GET    | /api/users/[id]/activity   | Get user activity        | Yes          | users.view      |
| PUT    | /api/users/[id]/status     | Update user status       | Yes          | users.manage    |
| POST   | /api/users/[id]/reset-password | Reset user password  | Yes          | users.manage    |
| GET    | /api/users/permissions     | Get user permissions     | Yes          | -               |

### Customers API

| Method | Endpoint                     | Description              | Auth Required | Permissions       |
|--------|------------------------------|--------------------------|--------------|-------------------|
| GET    | /api/customers               | List customers           | Yes          | customers.view    |
| GET    | /api/customers/[id]          | Get customer by ID       | Yes          | customers.view    |
| POST   | /api/customers               | Create customer          | Yes          | customers.create  |
| PUT    | /api/customers/[id]          | Update customer          | Yes          | customers.update  |
| DELETE | /api/customers/[id]          | Delete customer          | Yes          | customers.delete  |
| POST   | /api/customers/[id]/notes    | Add customer note        | Yes          | customers.update  |
| GET    | /api/customers/stats/monthly | Get monthly customer stats | Yes        | customers.view    |

### Requests API

| Method | Endpoint                        | Description               | Auth Required | Permissions      |
|--------|--------------------------------|---------------------------|--------------|------------------|
| GET    | /api/requests                  | List requests             | Yes          | requests.view    |
| GET    | /api/requests/[id]             | Get request by ID         | Yes          | requests.view    |
| POST   | /api/requests                  | Create request            | Yes          | requests.create  |
| PUT    | /api/requests/[id]             | Update request            | Yes          | requests.update  |
| DELETE | /api/requests/[id]             | Delete request            | Yes          | requests.delete  |
| POST   | /api/requests/[id]/notes       | Add request note          | Yes          | requests.update  |
| PUT    | /api/requests/[id]/status      | Update request status     | Yes          | requests.update  |
| POST   | /api/requests/[id]/convert     | Convert request to customer | Yes        | requests.convert |
| POST   | /api/requests/[id]/appointment | Create appointment from request | Yes    | requests.convert |
| POST   | /api/requests/public           | Create public request     | No           | -                |

### Appointments API

| Method | Endpoint                        | Description               | Auth Required | Permissions         |
|--------|--------------------------------|---------------------------|--------------|---------------------|
| GET    | /api/appointments              | List appointments         | Yes          | appointments.view   |
| GET    | /api/appointments/[id]         | Get appointment by ID     | Yes          | appointments.view   |
| POST   | /api/appointments              | Create appointment        | Yes          | appointments.create |
| PUT    | /api/appointments/[id]         | Update appointment        | Yes          | appointments.update |
| DELETE | /api/appointments/[id]         | Delete appointment        | Yes          | appointments.delete |
| POST   | /api/appointments/[id]/notes   | Add appointment note      | Yes          | appointments.update |
| PUT    | /api/appointments/[id]/status  | Update appointment status | Yes          | appointments.update |
| GET    | /api/appointments/upcoming     | Get upcoming appointments | Yes          | appointments.view   |

### Notifications API

| Method | Endpoint                        | Description               | Auth Required | Permissions          |
|--------|--------------------------------|---------------------------|--------------|----------------------|
| GET    | /api/notifications             | List user notifications   | Yes          | -                    |
| PUT    | /api/notifications/[id]/read   | Mark notification as read | Yes          | -                    |
| PUT    | /api/notifications/read-all    | Mark all as read          | Yes          | -                    |

### Dashboard API

| Method | Endpoint                        | Description                  | Auth Required | Permissions          |
|--------|--------------------------------|------------------------------|--------------|----------------------|
| GET    | /api/dashboard/stats           | Get dashboard statistics     | Yes          | dashboard.view       |
| GET    | /api/dashboard/user            | Get user dashboard data      | Yes          | -                    |

## Flutter App Implementation Guide

### App Architecture

For the Flutter app, we recommend implementing a clean architecture approach with the following layers:

1. **Presentation Layer**: UI components, screens, and widgets
2. **Application Layer**: Blocs/Cubits or other state management
3. **Domain Layer**: Business logic, entities, and use cases
4. **Data Layer**: Repositories, data sources, and API clients

### Directory Structure

```
lib/
├── core/                 # Core utilities and services
│   ├── api/              # API client and interceptors
│   ├── config/           # App configuration
│   ├── errors/           # Error handling
│   ├── navigation/       # Navigation service
│   ├── storage/          # Local storage service
│   └── utils/            # Utilities
├── data/                 # Data layer
│   ├── models/           # Data models/DTOs
│   ├── repositories/     # Repository implementations
│   └── sources/          # Data sources (API, local)
├── domain/               # Domain layer
│   ├── entities/         # Domain entities
│   ├── repositories/     # Repository interfaces
│   └── usecases/         # Use cases
├── presentation/         # Presentation layer
│   ├── blocs/            # Blocs for state management
│   ├── screens/          # App screens
│   ├── widgets/          # Reusable widgets
│   └── themes/           # UI themes and styles
├── di/                   # Dependency injection
└── main.dart             # App entry point
```

### State Management

We recommend using the BLoC (Business Logic Component) pattern with either:
- **flutter_bloc**: For more complex state management needs
- **cubit**: For simpler state management

Key considerations:
1. Each feature should have its own Bloc/Cubit
2. States should be immutable
3. Events/actions should be well-defined
4. Separate UI from business logic

### Navigation

Use a navigation service that:
1. Centralizes navigation logic
2. Handles deep linking
3. Manages authentication routing
4. Supports named routes

Consider using:
- **go_router**: For declarative routing with support for deep linking
- **auto_route**: For code generation and type-safe routes

### API Integration

Implement a robust API client using:
- **dio**: HTTP client with interceptors, request/response manipulation
- **retrofit**: Type-safe API client generator (optional)

Key features to implement:
1. **Token Interceptor**: Adds authentication tokens to requests
2. **Refresh Interceptor**: Handles token refresh when 401 responses are received
3. **Error Interceptor**: Transforms API errors into application exceptions
4. **Logging Interceptor**: Logs requests and responses for debugging

### Authentication Flow

1. **Login Screen**:
   - Collect user credentials
   - Call login API
   - Store tokens securely
   - Navigate to main app

2. **Token Management**:
   - Store tokens using flutter_secure_storage
   - Implement automatic token refresh
   - Handle unauthorized scenarios

3. **Logout**:
   - Clear stored tokens
   - Call logout API
   - Navigate to login screen

### Offline Support

For better user experience, implement:
1. **Local Caching**: Cache API responses for offline access
2. **Synchronization**: Queue changes made offline for sync when online
3. **Connectivity Monitoring**: Detect and handle connectivity changes

Consider using:
- **hive**: Fast, lightweight local database
- **floor** or **drift**: SQLite wrappers for structured data
- **connectivity_plus**: Monitor network connectivity

## Admin Features

Prioritize the following admin features for the initial release:

1. **Dashboard**:
   - Overview statistics
   - Recent activities
   - Upcoming appointments
   - New requests

2. **User Management**:
   - View and search users
   - Create new users
   - Edit user details
   - Update user status
   - Reset user passwords

3. **Customer Management**:
   - View and search customers
   - Create new customers
   - Edit customer details
   - Add customer notes
   - View customer history

4. **Request Management**:
   - View and filter requests
   - Process new requests
   - Update request status
   - Convert requests to appointments
   - Link requests to customers

5. **Appointment Management**:
   - Calendar view of appointments
   - Create and edit appointments
   - Update appointment status
   - Appointment details and notes

6. **Notifications**:
   - View notifications
   - Mark as read
   - Filter by type

## User Features

For the later phase, implement these user-focused features:

1. **My Requests**:
   - View own service requests
   - Create new requests
   - Track request status
   - Communication thread

2. **My Appointments**:
   - View upcoming appointments
   - Appointment details
   - Reschedule requests
   - Cancel appointments

3. **Profile Management**:
   - View and edit profile
   - Change password
   - Notification preferences

4. **Notifications**:
   - View notifications
   - Mark as read
   - Push notification support

## Development Roadmap

### Phase 1: Foundation (2-3 weeks)
- Project setup and architecture
- API client implementation
- Authentication flow
- Core navigation and UI components

### Phase 2: Admin Features (4-6 weeks)
- Dashboard implementation
- User management
- Customer management
- Request management
- Appointment management
- Notifications

### Phase 3: Polishing (2-3 weeks)
- Offline support
- Error handling improvements
- Performance optimizations
- UI refinements
- Testing

### Phase 4: User Features (4-6 weeks)
- My requests implementation
- My appointments implementation
- Profile management
- Enhanced notifications

## Testing Strategy

Implement a comprehensive testing strategy:

1. **Unit Tests**:
   - Business logic
   - Repository implementations
   - Blocs/Cubits

2. **Widget Tests**:
   - UI components
   - Screen workflows
   - Navigation

3. **Integration Tests**:
   - API integration
   - Authentication flow
   - Full feature workflows

4. **Manual Testing**:
   - User acceptance testing
   - Cross-device testing
   - Performance testing
