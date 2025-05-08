# App Module

## Overview

The App module forms the foundation of the Rising-BSM application using Next.js 15's App Router. It contains all the routes, layouts, and API endpoints for the application. This module defines the structure and navigation flow of the application and integrates the various feature modules.

## Directory Structure

```
app/
├── api/                # API routes (Next.js Route Handlers)
│   ├── appointments/   # Appointment-related endpoints
│   ├── auth/           # Authentication endpoints
│   ├── customers/      # Customer-related endpoints
│   ├── requests/       # Request-related endpoints
│   ├── users/          # User-related endpoints
│   └── ...             # Other API endpoints
├── auth/               # Authentication pages
│   ├── login/          # Login page
│   └── register/       # Registration page
├── dashboard/          # Dashboard pages
│   ├── appointments/   # Appointment management pages
│   ├── customers/      # Customer management pages
│   ├── requests/       # Request management pages
│   ├── users/          # User management pages
│   └── ...             # Other dashboard pages
├── globals.css         # Global CSS styles
├── layout.tsx          # Root layout component
└── page.tsx            # Landing page component
```

## Key Components

### Root Layout

The `layout.tsx` file defines the root layout for the entire application. It includes:

- HTML document structure
- Metadata configuration
- Global providers and contexts
- Main layout wrapper
- Theme configuration

**Example:**

```tsx
import { Metadata } from 'next';
import { Providers } from '@/shared/providers/Providers';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Rising BSM',
    template: '%s | Rising BSM',
  },
  description: 'AI-Powered Business Service Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Landing Page

The `page.tsx` file is the landing page of the application. It showcases the key features and benefits of Rising BSM with a modern, appealing design.

It includes:
- Hero section with animated elements
- Features showcase
- About section
- Testimonials
- FAQ section
- Call-to-action section

### API Routes

The `api` directory contains all the API endpoints for the application, organized by domain. Each endpoint uses Next.js Route Handlers to provide RESTful API functionality.

#### API Route Structure

Each API route follows a consistent pattern:

```
api/[resource]/route.ts         # Collection endpoints (GET, POST)
api/[resource]/[id]/route.ts    # Resource endpoints (GET, PUT, DELETE)
api/[resource]/[id]/[action]    # Custom actions on resources
```

**Example API Route:**

```typescript
// api/customers/route.ts
import { NextRequest } from 'next/server';
import { RouteHandler } from '@/core/api/server';

export const GET = RouteHandler(async (req: NextRequest) => {
  // Handle GET request for customers collection
  // ...
  return { success: true, data: customers };
});

export const POST = RouteHandler(async (req: NextRequest) => {
  // Handle POST request to create a new customer
  // ...
  return { success: true, data: newCustomer };
});
```

### Authentication

The `auth` directory contains the authentication-related pages:

- **Login Page**: User login form with authentication logic
- **Register Page**: User registration form with validation
- **Password Reset**: Password recovery workflow

### Dashboard

The `dashboard` directory contains all the authenticated pages for the application. It is organized by domain and follows a consistent structure:

```
dashboard/
├── layout.tsx                 # Dashboard layout with sidebar, header
├── page.tsx                   # Main dashboard page with stats and widgets
├── [resource]/                # Resource section (e.g., customers)
│   ├── page.tsx               # Resource list page
│   ├── [id]/                  # Resource detail pages
│   │   └── page.tsx           # Resource detail page
│   └── create/                # Resource creation page
│       └── page.tsx           # Resource creation form
```

## Page Structure

Each page in the app module follows a consistent structure:

1. **Page Component**: The main Next.js page component
2. **Feature Components**: Components from feature modules are used to build the page
3. **Data Fetching**: Server components fetch initial data
4. **Client Interactivity**: Client components handle user interactions

**Example Page Structure:**

```tsx
// dashboard/customers/page.tsx

// Import server actions for initial data loading
import { getCustomers } from '@/features/customers/actions';

// Import feature components
import { CustomerList } from '@/features/customers/components';
import { PageHeader } from '@/shared/components/layout';

export default async function CustomersPage() {
  // Server-side data fetching
  const initialCustomers = await getCustomers();
  
  return (
    <div className="space-y-4">
      <PageHeader 
        title="Customers" 
        description="Manage your customer relationships"
      />
      
      {/* Pass initial data to client component */}
      <CustomerList initialCustomers={initialCustomers} />
    </div>
  );
}
```

## Layouts

The app module uses Next.js nested layouts to define the UI structure:

1. **Root Layout (`layout.tsx`)**: Base HTML structure and providers
2. **Dashboard Layout (`dashboard/layout.tsx`)**: Authenticated layout with navigation
3. **Feature-specific Layouts**: Optional layouts for specific features

**Example Dashboard Layout:**

```tsx
// dashboard/layout.tsx
import { DashboardSidebar } from '@/features/dashboard/components';
import { DashboardHeader } from '@/features/dashboard/components';
import { AuthRequired } from '@/features/auth/components';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRequired>
      <div className="flex h-screen">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthRequired>
  );
}
```

## Routing and Navigation

The app uses Next.js 15 App Router for routing:

### URL Structure

- `/`: Landing page
- `/auth/login`: Login page
- `/auth/register`: Registration page
- `/dashboard`: Main dashboard
- `/dashboard/[resource]`: Resource list (e.g., `/dashboard/customers`)
- `/dashboard/[resource]/[id]`: Resource detail (e.g., `/dashboard/customers/123`)
- `/dashboard/[resource]/create`: Create new resource
- `/dashboard/[resource]/[id]/edit`: Edit existing resource

### Navigation Components

Navigation is handled through specialized components:

- **DashboardNavbar**: Top navigation for the dashboard
- **DashboardSidebar**: Side navigation for the dashboard
- **Breadcrumbs**: Breadcrumb navigation for nested pages

## Data Fetching

The app uses multiple data-fetching strategies:

1. **Server Components**: Initial data fetching for SEO and performance
2. **React Query**: Client-side data fetching and state management
3. **Direct API Calls**: Simple data fetching for client components

**Example Server Component Data Fetching:**

```tsx
// dashboard/customers/[id]/page.tsx
import { getCustomerById } from '@/features/customers/actions';
import { CustomerDetail } from '@/features/customers/components';
import { notFound } from 'next/navigation';

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerById(parseInt(params.id));
  
  if (!customer) {
    return notFound();
  }
  
  return <CustomerDetail initialCustomer={customer} />;
}
```

## Error Handling

The app implements comprehensive error handling:

1. **Error Boundaries**: Catch and display errors at component level
2. **Not Found Pages**: Custom pages for non-existent resources
3. **API Error Handling**: Consistent error responses from API endpoints
4. **Global Error Page**: Fallback for unexpected errors

**Example Not Found Page:**

```tsx
// dashboard/customers/[id]/not-found.tsx
import { NotFound } from '@/shared/components/error/NotFound';

export default function CustomerNotFound() {
  return (
    <NotFound
      title="Customer Not Found"
      description="The requested customer could not be found."
      backLink="/dashboard/customers"
      backLinkText="Back to Customers"
    />
  );
}
```

## Authentication and Authorization

Authentication and authorization are integrated throughout the app:

1. **Auth Middleware**: Protects routes and API endpoints
2. **Auth Components**: UI components for authentication
3. **Auth Hooks**: React hooks for authentication state
4. **Permission Checks**: Role-based and User specific access control

**Example Auth Protection:**

```tsx
// dashboard/settings/page.tsx
import { PermissionGuard } from '@/features/permissions/components';
import { SettingsPanel } from '@/features/settings/components';

export default function SettingsPage() {
  return (
    <PermissionGuard permission="settings.view">
      <SettingsPanel />
    </PermissionGuard>
  );
}
```

## Best Practices

1. **Server Components**: Use server components for initial rendering where possible
2. **Client Boundaries**: Clearly define client/server boundaries with 'use client' directives
3. **Consistent Structure**: Follow consistent directory and file structure
4. **Error Handling**: Implement comprehensive error handling
5. **SEO Optimization**: Use metadata API for SEO optimization
6. **Performance**: Optimize performance with proper data fetching strategies
7. **Accessibility**: Ensure all pages are accessible
8. **Type Safety**: Use TypeScript throughout

## Adding New Pages

To add a new page to the application:

1. Identify the appropriate section (e.g., dashboard, auth)
2. Create the directory and page.tsx file following the established pattern
3. Implement the page using components from feature modules
4. Add necessary data fetching
5. Update navigation as needed
6. Add proper metadata and documentation

## Page Metadata

Each page should include proper metadata for SEO:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customers',
  description: 'Manage your customer relationships and contacts',
};

export default function CustomersPage() {
  // Page implementation
}
```

## Integration with Feature Modules

The App module integrates with feature modules by:

1. **Importing Components**: Using components defined in feature modules
2. **Data Fetching**: Using server actions and API clients from features
3. **Hooks**: Using hooks defined in feature modules for state management
4. **Context Providers**: Using context providers for feature-specific state

This integration follows a clear separation of concerns, where:
- **App Module**: Handles routing, layout, and page structure
- **Feature Modules**: Provide the business logic and UI components
- **Shared Module**: Provides common utilities and UI components
- **Core/Domain Modules**: Provide the foundation and business rules
