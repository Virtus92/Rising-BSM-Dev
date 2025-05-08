# Features Module

## Overview

The Features module contains the implementation of all the business capabilities of the Rising-BSM application. It follows a feature-based architecture where code is organized by domain feature rather than technical function. Each feature is self-contained and includes all the components, hooks, services, and API handlers needed to implement the feature.

## Directory Structure

```
features/
├── activity/           # Activity tracking and logging
├── appointments/       # Appointment management
├── auth/               # Authentication and authorization
├── customers/          # Customer management 
├── dashboard/          # Dashboard components and data
├── home/               # Landing page components
├── notifications/      # Notification system
├── permissions/        # Permission management
├── requests/           # Service requests management
├── settings/           # Application settings
└── users/              # User management
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

## Key Components

### Authentication (auth)

The authentication feature handles user authentication, authorization, and session management.

**Key Components:**
- **AuthProvider**: React context provider for authentication state
- **TokenManager**: Manages authentication tokens and session state
- **AuthClient**: Client for authentication API endpoints
- **useAuth**: Hook for accessing authentication context
- **LoginForm**: Component for user login
- **AuthMiddleware**: Server-side middleware for route protection

**Example Usage:**

```typescript
// Client component with authentication
'use client';

import { useAuth } from '@/features/auth';

export function ProfileComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in to view your profile.</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Customers

The customers feature handles customer management, including creating, updating, and retrieving customer information.

**Key Components:**
- **CustomerForm**: Component for creating and editing customers
- **CustomerList**: Component for displaying and filtering customers
- **CustomerDetail**: Component for displaying customer details
- **useCustomer**: Hook for managing customer data
- **CustomerClient**: Client for customer API endpoints

**Example Usage:**

```typescript
// Customer list page
'use client';

import { useCustomers } from '@/features/customers';
import { CustomerList } from '@/features/customers/components';

export default function CustomersPage() {
  const { customers, isLoading, error } = useCustomers();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <CustomerList customers={customers} />;
}
```

### Appointments

The appointments feature handles appointment scheduling, including creating, updating, and retrieving appointment information.

**Key Components:**
- **AppointmentForm**: Component for creating and editing appointments
- **AppointmentList**: Component for displaying and filtering appointments
- **AppointmentDetail**: Component for displaying appointment details
- **useAppointment**: Hook for managing appointment data
- **AppointmentClient**: Client for appointment API endpoints

**Example Usage:**

```typescript
// Appointment creation
'use client';

import { useAppointments } from '@/features/appointments';
import { AppointmentForm } from '@/features/appointments/components';

export default function CreateAppointmentPage() {
  const { createAppointment, isLoading } = useAppointments();
  
  const handleSubmit = async (data) => {
    await createAppointment(data);
    // Handle success or redirect
  };
  
  return <AppointmentForm onSubmit={handleSubmit} isLoading={isLoading} />;
}
```

### Requests

The requests feature handles service requests, including creating, updating, and processing service requests.

**Key Components:**
- **RequestForm**: Component for creating and editing requests
- **RequestList**: Component for displaying and filtering requests
- **RequestDetail**: Component for displaying request details
- **useRequest**: Hook for managing request data
- **RequestClient**: Client for request API endpoints

**Example Usage:**

```typescript
// Request detail page
'use client';

import { useRequest } from '@/features/requests';
import { RequestDetail } from '@/features/requests/components';

export default function RequestDetailPage({ params }) {
  const { request, isLoading, error } = useRequest(params.id);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <RequestDetail request={request} />;
}
```

### Users

The users feature handles user management, including creating, updating, and managing user accounts.

**Key Components:**
- **UserForm**: Component for creating and editing users
- **UserList**: Component for displaying and filtering users
- **UserDetail**: Component for displaying user details
- **useUsers**: Hook for managing user data
- **UserClient**: Client for user API endpoints

**Example Usage:**

```typescript
// User list page
'use client';

import { useUsers } from '@/features/users';
import { UserList } from '@/features/users/components';

export default function UsersPage() {
  const { users, isLoading, error } = useUsers();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <UserList users={users} />;
}
```

### Notifications

The notifications feature handles system notifications, including creating, updating, and retrieving notifications.

**Key Components:**
- **NotificationBadge**: Component for displaying notification count
- **NotificationList**: Component for displaying notifications
- **useNotifications**: Hook for managing notification data
- **NotificationClient**: Client for notification API endpoints

**Example Usage:**

```typescript
// Notification badge in header
'use client';

import { useNotifications } from '@/features/notifications';
import { NotificationBadge } from '@/features/notifications/components';

export function HeaderComponent() {
  const { unreadCount } = useNotifications();
  
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <NotificationBadge count={unreadCount} />
      </nav>
    </header>
  );
}
```

### Permissions

The permissions feature handles role-based access control (RBAC) and permission management.

**Key Components:**
- **PermissionGuard**: Component for conditional rendering based on permissions
- **usePermissions**: Hook for checking user permissions
- **PermissionClient**: Client for permission API endpoints

**Example Usage:**

```typescript
// Component with permission check
'use client';

import { PermissionGuard } from '@/features/permissions';

export function AdminPanel() {
  return (
    <PermissionGuard permission="users.manage">
      <div>This content is only visible to users with the 'users.manage' permission</div>
    </PermissionGuard>
  );
}
```

### Dashboard

The dashboard feature provides dashboard components and data visualization.

**Key Components:**
- **DashboardCharts**: Components for data visualization
- **StatsCards**: Components for displaying key metrics
- **RecentActivities**: Component for displaying recent activities
- **useDashboardStats**: Hook for fetching dashboard statistics

**Example Usage:**

```typescript
// Dashboard page
'use client';

import { 
  StatsCards, 
  DashboardCharts,
  RecentActivities 
} from '@/features/dashboard/components';

export default function DashboardPage() {
  return (
    <div>
      <StatsCards />
      <DashboardCharts />
      <RecentActivities />
    </div>
  );
}
```

### Home

The home feature provides components for the public-facing landing page.

**Key Components:**
- **Hero**: Main hero section for the landing page
- **Features**: Features showcase section
- **About**: About section for the landing page
- **Testimonials**: Testimonials section
- **FAQ**: Frequently asked questions section
- **CTA**: Call-to-action section

**Example Usage:**

```typescript
// Landing page
import {
  Hero,
  Features,
  About,
  Testimonials,
  FAQ,
  CTA
} from '@/features/home/components';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <About />
      <Testimonials />
      <FAQ />
      <CTA />
    </main>
  );
}
```

## Integration Patterns

### Feature to Feature Communication

Features can communicate with each other through well-defined interfaces:

1. **Direct imports**: Features can expose specific APIs through their `index.ts` file
2. **Context providers**: Features can provide context that other features can consume
3. **Event-based communication**: Features can emit and listen for events

**Example of direct import:**

```typescript
// Import from another feature
import { useAuth } from '@/features/auth';
import { useCustomers } from '@/features/customers';

export function CustomerDashboard() {
  const { user } = useAuth();
  const { customers } = useCustomers();
  
  // Combine data from multiple features
}
```

**Example of context consumption:**

```typescript
// Consume context from another feature
import { useAuth } from '@/features/auth';
import { PermissionGuard } from '@/features/permissions';

export function AdminSection() {
  const { user } = useAuth();
  
  return (
    <PermissionGuard permission="admin.access">
      <h1>Welcome, Admin {user.name}</h1>
    </PermissionGuard>
  );
}
```

### API Communication

Features communicate with the backend through their own API clients. The clients follow a consistent pattern:

```typescript
// Example API client
import { ApiClient } from '@/core/api';

export class CustomerClient {
  static async getCustomers(params) {
    return ApiClient.get('/customers', { params });
  }
  
  static async getCustomer(id) {
    return ApiClient.get(`/customers/${id}`);
  }
  
  static async createCustomer(data) {
    return ApiClient.post('/customers', data);
  }
  
  // More methods...
}
```

## Best Practices

1. **Feature Isolation**: Each feature should be as self-contained as possible.
2. **Composition**: Compose features together to build pages and layouts.
3. **Shared State**: Use React Context for sharing state within a feature.
4. **Clear Interfaces**: Define clear interfaces for inter-feature communication.
5. **Consistent Patterns**: Follow consistent patterns within and across features.
6. **Minimal Coupling**: Minimize dependencies between features.
7. **Encapsulation**: Encapsulate implementation details within the feature.

## Adding a New Feature

To add a new feature:

1. Create a new directory in the `features` directory with the feature name
2. Set up the standard subdirectories (api, components, hooks, lib, etc.)
3. Implement the feature's core functionality
4. Export the public API through the feature's `index.ts` file
5. Integrate the feature into the application

## Feature Maintenance

When maintaining a feature:

1. Keep changes localized to the feature directory
2. Avoid creating dependencies on other features unless necessary
3. Update the feature's public API through its `index.ts` file
4. Ensure backward compatibility when making changes
5. Add unit tests for new functionality
