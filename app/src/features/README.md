# Features Module

## Overview

The Features module contains the implementation of all the business capabilities of the Rising-BSM application. It follows a feature-based architecture where code is organized by domain feature rather than technical function. Each feature is self-contained and includes all the components, hooks, services, and API handlers needed to implement the feature.

## Directory Structure

```
features/
├── activity/           # Activity tracking and logging
├── app/                # Application initialization and state
├── appointments/       # Appointment management
├── auth/               # Authentication and authorization
│   ├── api/            # Authentication API endpoints
│   ├── components/     # Authentication UI components
│   ├── core/           # Core authentication system
│   ├── hooks/          # Authentication React hooks
│   ├── lib/            # Authentication implementation
│   ├── providers/      # Authentication providers
│   └── utils/          # Authentication utilities
├── customers/          # Customer management 
├── dashboard/          # Dashboard components and data
├── home/               # Landing page components
├── n8n/                # N8N automation integration
├── notifications/      # Notification system
├── permissions/        # Permission management
└── requests/           # Service requests management
```

## Common Feature Structure

Each feature follows a consistent internal structure:

```
feature-name/
├── api/                # API routes and server-side code
│   ├── middleware/     # API middleware
│   ├── models/         # API request/response models
│   └── routes/         # API route handlers
├── components/         # React components
├── hooks/              # React hooks for business logic
├── lib/                # Feature implementation
│   ├── clients/        # API clients
│   ├── repositories/   # Repository implementations
│   └── services/       # Service implementations
├── providers/          # React context providers
├── utils/              # Utility functions
└── index.ts            # Feature public exports
```

## Key Features

### Authentication (auth)

The authentication feature provides a comprehensive authentication and authorization system for the application.

**Key Components:**
- **AuthService**: Centralized authentication service that manages tokens and auth state
- **AuthProvider**: React context provider for authentication state
- **LoginForm/RegisterForm**: Components for user authentication
- **AuthMiddleware**: Server-side middleware for route protection
- **useAuth**: Hook for accessing authentication context in components

**Example (Using Authentication):**

```typescript
// Client component with authentication
'use client';

import { useAuth } from '@/features/auth';

export function ProfileComponent() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in to view your profile.</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

**Authentication Flow:**
1. User logs in with credentials
2. Server validates credentials and issues JWT tokens
3. Tokens are stored in HTTP-only cookies
4. AuthService manages token validation and refresh
5. Protected routes use withAuth middleware for security

### Customers

The customers feature handles customer management, including creating, updating, and retrieving customer information.

**Key Components:**
- **CustomerForm**: Component for creating and editing customers
- **CustomerList**: Component for displaying and filtering customers
- **CustomerDetail**: Component for displaying customer details
- **useCustomer/useCustomers**: Hooks for managing customer data
- **CustomerClient**: Client for customer API endpoints
- **CustomerService**: Service implementation for customer operations
- **CustomerRepository**: Repository implementation for customer data access

**Example (Customer Management):**

```typescript
// Creating a customer
'use client';

import { useCustomers } from '@/features/customers';
import { CustomerForm } from '@/features/customers/components';

export default function CreateCustomerPage() {
  const { createCustomer, isLoading } = useCustomers();
  
  const handleSubmit = async (data) => {
    const result = await createCustomer(data);
    if (result) {
      // Handle success
    }
  };
  
  return <CustomerForm onSubmit={handleSubmit} mode="create" isLoading={isLoading} />;
}
```

### Appointments

The appointments feature handles appointment management, providing functionality for scheduling, tracking, and managing appointments.

**Key Components:**
- **AppointmentForm**: Component for creating and editing appointments
- **AppointmentList**: Component for displaying appointments
- **AppointmentDetail**: Component for displaying appointment details
- **useAppointment/useAppointments**: Hooks for managing appointment data
- **AppointmentClient**: Client for appointment API endpoints
- **AppointmentService**: Service implementation for appointment operations

**Example (Appointment Management):**

```typescript
// Displaying upcoming appointments
'use client';

import { useAppointments } from '@/features/appointments';
import { AppointmentList } from '@/features/appointments/components';

export default function UpcomingAppointmentsPage() {
  const { appointments, isLoading } = useAppointments({ upcoming: true });
  
  if (isLoading) return <div>Loading...</div>;
  
  return <AppointmentList appointments={appointments} />;
}
```

### Requests

The requests feature handles service and contact requests, providing functionality for tracking, assigning, and processing requests.

**Key Components:**
- **RequestList**: Component for displaying and filtering requests
- **RequestDetail**: Component for displaying request details
- **ConvertToCustomerForm**: Component for converting requests to customers
- **CreateAppointmentForm**: Component for creating appointments from requests
- **useRequest/useRequests**: Hooks for managing request data
- **RequestClient**: Client for request API endpoints
- **RequestService**: Service implementation for request operations

**Example (Processing a Request):**

```typescript
// Converting a request to a customer
'use client';

import { useRequest } from '@/features/requests';
import { ConvertToCustomerForm } from '@/features/requests/components';

export default function ConvertRequestPage({ params }) {
  const { request, convertToCustomer, isLoading } = useRequest(params.id);
  
  const handleConvert = async (data) => {
    const result = await convertToCustomer(data);
    if (result) {
      // Handle success
    }
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return <ConvertToCustomerForm request={request} onSubmit={handleConvert} />;
}
```

### Notifications

The notifications feature provides a system for creating, managing, and displaying notifications to users.

**Key Components:**
- **NotificationBadge**: Component for displaying notification count
- **NotificationDropdown**: Component for displaying notifications
- **NotificationList**: Component for listing all notifications
- **useNotifications**: Hook for managing notification data
- **NotificationClient**: Client for notification API endpoints
- **NotificationService**: Service implementation for notification operations

**Example (Displaying Notifications):**

```typescript
// Notification badge in header
'use client';

import { useNotifications } from '@/features/notifications';
import { NotificationBadge, NotificationDropdown } from '@/features/notifications/components';

export function Header() {
  const { unreadCount, notifications, markAsRead } = useNotifications();
  
  return (
    <header className="flex items-center justify-between">
      <h1>Rising BSM</h1>
      <div className="flex items-center">
        <NotificationDropdown 
          notifications={notifications} 
          onMarkAsRead={markAsRead} 
        />
        <NotificationBadge count={unreadCount} />
      </div>
    </header>
  );
}
```

### Permissions

The permissions feature provides a robust system for managing user permissions and role-based access control.

**Key Components:**
- **PermissionProvider**: React context provider for permissions
- **useEnhancedPermissions**: Hook for checking and managing permissions
- **PermissionClient**: Client for permission API endpoints
- **PermissionService**: Service implementation for permission operations
- **PermissionCache**: Client-side cache for permissions
- **PermissionUserAssignment**: Component for assigning permissions to users
- **PermissionRoleManager**: Component for managing role permissions

**Example (Permission-Based UI):**

```typescript
'use client';

import { useEnhancedPermissions } from '@/features/permissions/hooks/useEnhancedPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

export function AdminSection() {
  const { hasPermission } = useEnhancedPermissions();
  
  if (!hasPermission(SystemPermission.USERS_MANAGE)) {
    return null;
  }
  
  return (
    <div>
      <h2>User Management</h2>
      {/* Admin UI */}
    </div>
  );
}
```

### Dashboard

The dashboard feature provides components and data hooks for the application dashboard.

**Key Components:**
- **DashboardCharts**: Components for data visualization
- **StatsCards**: Components for displaying key metrics
- **RecentActivities**: Component for displaying recent activities
- **UpcomingAppointments**: Component for displaying upcoming appointments
- **useDashboardStats**: Hook for fetching dashboard statistics

**Example (Dashboard Page):**

```typescript
'use client';

import { 
  StatsCards, 
  DashboardCharts,
  RecentActivities,
  UpcomingAppointments
} from '@/features/dashboard/components';

export default function DashboardPage() {
  return (
    <div className="grid gap-4">
      <StatsCards />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardCharts />
        <div className="space-y-4">
          <RecentActivities />
          <UpcomingAppointments />
        </div>
      </div>
    </div>
  );
}
```

### Activity

The activity feature provides activity tracking and logging functionality.

**Key Components:**
- **ActivityLogService**: Service for logging user activity
- **ActivityLogRepository**: Repository for activity log data access

### Home

The home feature provides components for the public-facing landing page.

**Key Components:**
- **Hero**: Main hero section for the landing page
- **Features**: Features showcase section
- **About**: About section for the landing page
- **Testimonials**: Testimonials section
- **FAQ**: Frequently asked questions section
- **Contact**: Contact form section

## Integration Patterns

### Feature to Feature Communication

Features can communicate with each other through well-defined interfaces:

1. **Direct imports**: Features can expose specific APIs through their `index.ts` file
2. **Context providers**: Features can provide context that other features can consume
3. **Service factories**: Features can access services through service factories

**Example (Feature Integration):**

```typescript
// Import from multiple features
import { useAuth } from '@/features/auth';
import { useCustomers } from '@/features/customers';
import { usePermissions } from '@/features/permissions';

export function CustomerDashboard() {
  const { user } = useAuth();
  const { customers } = useCustomers();
  const { hasPermission } = usePermissions();
  
  // Combine functionality from multiple features
}
```

### API Communication

Features communicate with the backend through API clients. Each feature has its own client that follows a consistent pattern:

```typescript
// Example API client
export class CustomerClient {
  static async getCustomers(params) {
    const response = await ApiClient.get('/customers', { params });
    return response.data;
  }
  
  static async createCustomer(data) {
    const response = await ApiClient.post('/customers', data);
    return response.data;
  }
  
  // More methods...
}
```

### Server-Side Implementation

Features implement server-side functionality through repositories and services:

```typescript
// Repository implementation
export class CustomerRepository implements ICustomerRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}
  
  async findById(id: number): Promise<Customer | null> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id }
      });
      
      return customer ? this.mapToDomainEntity(customer) : null;
    } catch (error) {
      this.logger.error('Error finding customer by ID', { error, id });
      throw this.handleError(error);
    }
  }
  
  // More methods...
}

// Service implementation
export class CustomerService implements ICustomerService {
  constructor(
    private customerRepository: ICustomerRepository,
    private logger: ILoggingService
  ) {}
  
  async findById(id: number): Promise<CustomerResponseDto | null> {
    try {
      const customer = await this.customerRepository.findById(id);
      return customer ? dtoFactory.createCustomerDto(customer) : null;
    } catch (error) {
      this.logger.error('Error in CustomerService.findById', { error, id });
      throw error;
    }
  }
  
  // More methods...
}
```

## Best Practices

1. **Feature Isolation**: Each feature should be as self-contained as possible.
2. **Clear Public API**: Export only what is needed through the feature's index.ts.
3. **Consistent Patterns**: Follow consistent patterns within and across features.
4. **Server/Client Separation**: Clearly separate server and client code.
5. **Proper Error Handling**: Handle errors at appropriate levels.
6. **Logging**: Use the logging service for troubleshooting.
7. **Type Safety**: Use TypeScript interfaces and types throughout.
8. **Code Organization**: Follow the established directory structure.

## Adding a New Feature

To add a new feature:

1. Create a new directory in the `features` directory with the feature name
2. Set up the standard subdirectories (api, components, hooks, lib, etc.)
3. Implement the feature's core functionality in the lib directory
4. Create API routes in the api directory
5. Create React components in the components directory
6. Create React hooks in the hooks directory
7. Export the public API through the feature's `index.ts` file
8. Integrate the feature into the application

## Feature Maintenance

When maintaining a feature:

1. Keep changes localized to the feature directory
2. Avoid creating dependencies on other features unless necessary
3. Update the feature's public API through its `index.ts` file
4. Ensure backward compatibility when making changes
