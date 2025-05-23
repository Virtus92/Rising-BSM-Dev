# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format
```

### Database Commands
```bash
# Run database migrations (development)
npm run db:migrate:dev

# Run database migrations (production)
npm run db:migrate

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio for database inspection
npm run db:studio

# Seed database with test data
npm run db:seed
```

### Testing Commands
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Run a single test file
npm test -- path/to/test.test.ts
```

### Clean and Rebuild
```bash
# Clean build artifacts
npm run clean

# Clean and rebuild
npm run rebuild
```

## High-Level Architecture

### Overview
Rising-BSM is a comprehensive business service management platform built with Next.js 15, React 18, and TypeScript. It follows a feature-based architecture with domain-driven design principles.

### Key Architectural Patterns

1. **Feature-Based Architecture**: Code is organized by business capability (features) rather than technical layers. Each feature is self-contained with its own components, hooks, services, and API routes.

2. **Domain-Driven Design**: Clear separation between domain logic (business rules) and infrastructure concerns. Domain models, interfaces, and DTOs define the business contracts.

3. **Service-Repository Pattern**: Services implement business logic while repositories handle data access. This provides a clean abstraction over the database.

4. **Factory Pattern with Dependency Injection**: Services and repositories are created through factories, enabling proper dependency injection and testability.

5. **JWT Authentication with Refresh Tokens**: Secure authentication system with token rotation and HTTP-only cookies.

6. **Role-Based Access Control (RBAC)**: Fine-grained permission system with roles and individual permissions.

### Project Structure
```
src/
├── app/              # Next.js App Router pages and API routes
├── core/             # Core infrastructure (database, API, errors, logging)
├── domain/           # Domain models, interfaces, DTOs, and business rules
├── features/         # Feature modules (auth, customers, requests, etc.)
└── shared/           # Shared components, hooks, and utilities
```

### Feature Module Structure
Each feature follows this structure:
```
features/[feature-name]/
├── api/              # API routes and models
│   ├── models/       # Request/response models
│   └── routes/       # Route handlers
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Feature-specific logic
│   ├── clients/      # API clients
│   ├── repositories/ # Data access layer
│   └── services/     # Business logic
└── index.ts          # Public exports
```

### Runtime Considerations
- **Edge Runtime**: Default for better performance, used for simple operations
- **Node.js Runtime**: Required for database access (Prisma), bcrypt, and other Node.js-specific operations
- Routes requiring Node.js must have `export const runtime = 'nodejs';`

### API Response Pattern
All API routes use a consistent response format:
```typescript
import { formatResponse } from '@/core/errors'; // Note: NOT from @/core/api
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

### Permission System
Permissions follow a `category.action` format (e.g., `users.create`, `customers.view`). The system supports both role-based and individual permissions.

### Authentication Flow
1. User logs in with credentials
2. Server validates and generates JWT + refresh token
3. Tokens stored as HTTP-only cookies
4. AuthService manages token refresh automatically
5. Protected routes check authentication and permissions

### Database Access Pattern
- Always use Prisma through the repository pattern
- Never access the database directly from components or API routes
- Use service factories to get service instances
- Repositories extend `PrismaRepository` base class

### Error Handling
- Use `AppError` for application-specific errors
- Consistent error formatting with `formatResponse`
- Comprehensive logging with `LoggingService`
- Client-friendly error messages

## Key Implementation Notes

### When Creating New Features
1. Start by defining domain models and interfaces in `domain/`
2. Create the feature directory structure under `features/`
3. Implement repositories extending `PrismaRepository`
4. Implement services following the existing patterns
5. Create API routes using the `routeHandler` pattern
6. Build React components and hooks
7. Export only public APIs through `index.ts`

### Common Patterns to Follow
- Use existing DTOs directly, don't create duplicate response models
- Validate enum parameters before passing to services
- Use service factories, never instantiate services directly
- Follow the established error handling patterns
- Add proper TypeScript types for all functions
- Use the existing permission system for access control

### Next.js 15 Specifics
- Route parameters are now Promises: `{ params: Promise<{ id: string }> }`
- Dynamic imports for heavy dependencies in Node.js runtime
- Server components for static rendering
- Client components for interactivity

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for API routes
- Component tests with React Testing Library
- Mock external dependencies properly

### Performance Considerations
- Use Edge runtime where possible for better performance
- Implement proper caching strategies
- Optimize database queries with appropriate indexes
- Use pagination for large data sets

## Recent Major Features

### Automation System (January 2025)
A comprehensive webhook and scheduling system replacing n8n integration:
- Webhook automation for entity operations (create, update, delete)
- Cron-based scheduling for recurring tasks
- Execution history and monitoring
- Service-specific webhook testing (n8n, Slack, Discord, etc.)
- Located in `features/automation/`

### Key Lessons from Automation Implementation
1. Always use `formatResponse` from `@/core/errors`
2. Wrap `formatResponse` with `NextResponse.json()`
3. Validate enum query parameters before service calls
4. Handle webhook testing differently for each service (n8n doesn't support HEAD)
5. Use proper error status code extraction pattern
6. Follow existing factory patterns exactly