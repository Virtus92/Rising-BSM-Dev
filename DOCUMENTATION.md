# Rising-BSM Project Documentation

## Project Overview

Rising-BSM is an open-source platform for business service management. It provides core functionality for customer relationship management, appointment scheduling, request handling, and business operations.

The project is built with modern web technologies including Next.js 15, Prisma ORM, TypeScript, and Tailwind CSS, following best practices for scalability, maintainability, and performance.

## Project Architecture

The project follows a modular architecture based on clean architecture principles, with a clear separation of concerns:

```
Rising-BSM/
├── app/                  # Application code
│   ├── public/           # Static assets
│   ├── src/              # Source code
│   │   ├── app/          # Next.js app router and API routes
│   │   ├── core/         # Core framework and infrastructure
│   │   ├── domain/       # Domain models and business interfaces
│   │   ├── features/     # Feature modules
│   │   └── shared/       # Shared components and utilities
│   ├── prisma/           # Prisma ORM schema and migrations
│   └── ...               # Configuration files
├── docs/                 # Technical documentation
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # License information
└── README.md             # Project overview and setup instructions
```

### Key Modules

1. **Core Module**: Provides foundation services, utilities, and abstractions that are used throughout the application.
   - API client and server-side route handling
   - Application bootstrapping and configuration
   - Error handling and logging
   - Database connection and repositories
   - Security utilities

2. **Domain Module**: Defines the core business models, interfaces, and contracts.
   - Entities and DTOs
   - Repository interfaces
   - Service interfaces
   - Enums and types
   - Permission definitions

3. **Features Module**: Contains the implementation of business capabilities, organized by domain features.
   - Authentication and authorization
   - Customer management
   - Appointment scheduling
   - Request handling
   - User management
   - Notifications system
   - Dashboard and analytics
   - Permissions management

4. **Shared Module**: Provides reusable components and utilities.
   - UI components
   - Hooks and contexts
   - Utility functions
   - Layout components

5. **App Module**: Contains Next.js pages, layouts, and API routes.
   - Public pages
   - Dashboard pages
   - API endpoints
   - Authentication pages

## Documentation Structure

The project includes comprehensive documentation at different levels:

1. **Project-Level Documentation**:
   - README.md: Project overview and setup instructions
   - CONTRIBUTING.md: Contribution guidelines
   - DOCUMENTATION.md: This document
   - docs/: Detailed technical documentation

2. **Module-Level Documentation**:
   - core/README.md: Core module documentation
   - domain/README.md: Domain module documentation
   - features/README.md: Features module documentation
   - features/auth/ARCHITECTURE.md: Authentication architecture details
   - features/auth/core/README.md: Auth core system documentation
   - app/api/README.md: API endpoints documentation

## Key Features

### Authentication System

The authentication system provides:
- JWT-based authentication with access and refresh tokens
- Role-based access control
- Permission-based authorization
- HTTP-only cookies for secure token storage
- Automatic token refresh
- Centralized AuthService as single source of truth

### Customer Management

The customer management feature provides:
- Customer profiles with contact information
- Customer relationship history
- Segmentation and tagging
- Notes and activity tracking
- Business and private customer types

### Appointment Scheduling

The appointment scheduling feature provides:
- Appointment management
- Status tracking
- Notes and details
- Connection to customers

### Request Management

The request management feature provides:
- Service request tracking
- Request assignment
- Status updates
- Conversion to appointments or customers
- Data handling for request information

### User Management

The user management feature provides:
- User accounts with roles and permissions
- Profile management
- Activity tracking
- Password management

### Dashboard and Analytics

The dashboard and analytics feature provides:
- Performance metrics
- Customer and request statistics
- Appointment overview
- Activity feed

## Technology Stack

### Frontend

- **Next.js 15**: React framework with server components and App Router
- **TailwindCSS**: Utility-first CSS framework
- **React Query/TanStack Query**: Data fetching and state management
- **RadixUI/shadcn-ui**: Accessible UI components
- **TypeScript**: Type safety and developer experience

### Backend

- **Next.js API Routes**: API endpoints with App Router
- **Prisma ORM**: Database access and migrations
- **JSON Web Tokens**: Authentication
- **Zod**: Schema validation

### Database

- **PostgreSQL**: Primary database
- **Prisma Migrations**: Database schema management

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

## Application Flow

### Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server authenticates credentials and issues JWT tokens (access and refresh)
3. Tokens are stored as HTTP-only cookies
4. AuthService manages token validation and refresh
5. Protected API routes use the `withAuth` middleware
6. API Client automatically includes tokens and handles refresh

### Customer Management Flow

1. User creates or edits customer information
2. Data is validated and stored
3. Customer history is tracked
4. Customers can be linked to requests and appointments

### Appointment Scheduling Flow

1. User creates appointment connected to a customer
2. Appointment details are stored
3. Status is tracked and updated
4. Notes can be added to appointments

### Request Management Flow

1. Request is created from web form or manually
2. Request is assigned to user
3. Request status is tracked
4. Request can be converted to appointment or customer
5. Request history is maintained

## Project Structure Best Practices

1. **Domain-Driven Design**: Code is organized by business domain and features
2. **Separation of Concerns**: Business logic is separate from UI and infrastructure
3. **Feature-Based Organization**: Code is organized by business capabilities
4. **Interface-Driven Development**: Interfaces define contracts between components
5. **Clean Architecture**: Dependencies point inward, with domain at the center
6. **Single Responsibility**: Each component has a clear, focused purpose
7. **Factory Pattern**: Services and repositories are created through factories

## Authentication System Architecture

The authentication system uses a centralized design with:

1. **AuthService**: Single source of truth for all auth operations
2. **HTTP-Only Cookies**: Secure token storage mechanism
3. **JWT Tokens**: Access tokens (short-lived) and refresh tokens (longer-lived)
4. **Middleware**: Route protection with `withAuth` middleware
5. **Permissions**: Granular access control with permission checking

Key authentication flow:
1. User authenticates via login
2. Tokens are stored in HTTP-only cookies
3. AuthService manages token validation and refresh
4. Protected routes check authentication with middleware
5. Token refresh happens automatically before expiration

## API Design

The API follows REST principles with consistent patterns:

1. **Resource-Based URLs**: `/api/[resource]` for collections, `/api/[resource]/[id]` for items
2. **Standard HTTP Methods**: GET, POST, PUT, DELETE
3. **Consistent Response Format**:
   ```json
   {
     "success": true,
     "data": { ... },
     "error": null
   }
   ```
4. **Error Handling**:
   ```json
   {
     "success": false,
     "data": null,
     "error": "Error message"
   }
   ```
5. **Authentication**: JWT tokens via `Authorization` header or HTTP-only cookies
6. **Pagination**: Page-based pagination with `page` and `limit` parameters

## Extending the Application

### Adding a New Feature

1. Create a feature directory in `src/features/`
2. Follow the feature structure pattern:
   ```
   feature-name/
   ├── api/          # API routes and models
   ├── components/   # React components
   ├── hooks/        # React hooks
   ├── lib/          # Feature implementation
   │   ├── clients/  # API clients
   │   ├── repositories/ # Repositories
   │   └── services/ # Services
   ├── utils/        # Utilities
   └── index.ts      # Public exports
   ```
3. Add API endpoints in `src/app/api/`
4. Add UI pages in `src/app/`
5. Export the feature's public API through `index.ts`

### Adding a New API Endpoint

1. Create a route handler in `src/app/api/`
2. Use the `routeHandler` utility with auth middleware
3. Implement the endpoint using service factories
4. Follow the consistent response format
5. Document the endpoint in API documentation

## Deployment

The application can be deployed using:

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm run start
```

### Docker

```bash
docker-compose up
```

## Conclusion

Rising-BSM provides a solid foundation for business service management applications with a clean, modular architecture. The clear separation of concerns and focus on domain-driven design make it maintainable and extensible.

The application is designed for scalability, with a focus on proper error handling, type safety, and consistent patterns throughout the codebase.
