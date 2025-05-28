# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Rising-BSM is an AI-powered Business Service Management platform providing a free, open-source alternative to expensive business management solutions. It helps businesses manage customers, appointments, service requests, and integrates with AI capabilities through MCP (Model Context Protocol) server.

## Commands

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter and fix issues
npm run lint
npm run lint:fix

# Run type checking
npm run typecheck

# Format code
npm run format

# Clean build artifacts
npm run clean
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

# Reset database (caution: destroys all data)
npm run db:reset
```

### Testing Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests

# Run a single test file
npm test -- path/to/test.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create customer"
```

### Docker Commands
```bash
# Development with Docker
docker-compose up -d          # Start containers
docker-compose down          # Stop containers
docker-compose logs -f app   # View logs

# Run commands in container
docker-compose exec app npm run db:migrate:dev
docker-compose exec app npm run db:seed
```

## High-Level Architecture

### Tech Stack
- **Frontend**: Next.js 15.x, React 18.x, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: React Query (TanStack Query), React Context
- **Backend**: Next.js API routes (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh token rotation, HTTP-only cookies
- **Authorization**: Custom RBAC (Role-Based Access Control) system
- **Containerization**: Docker with Docker Compose
- **Additional Components**: 
  - Flutter mobile app in `/flutter-app`
  - MCP Server in `/rising_mcp_server` for AI agent integration

### Architectural Patterns

1. **Feature-Based Architecture**: Code organized by business capability rather than technical layers
2. **Domain-Driven Design**: Clear separation between business logic and infrastructure
3. **Service-Repository Pattern**: Services handle business logic, repositories handle data access
4. **Factory Pattern with Dependency Injection**: For creating service/repository instances
5. **Plugin System Architecture**: Comprehensive system for extending functionality (in development)

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
Each feature follows this consistent structure:
```
features/[feature-name]/
├── api/              # API routes and models
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Feature-specific logic
│   ├── clients/      # API clients
│   ├── repositories/ # Data access layer
│   └── services/     # Business logic
└── index.ts          # Public exports
```

## Critical Implementation Patterns

### API Response Pattern
**ALWAYS** use this pattern for API responses:
```typescript
import { formatResponse } from '@/core/errors'; // NOT from @/core/api
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

### Runtime Configuration
- **Edge Runtime**: Default for better performance, used for simple operations
- **Node.js Runtime**: Required for database access (Prisma), bcrypt, and other Node.js-specific operations
- Routes requiring Node.js must export: `export const runtime = 'nodejs';`

### Route Parameter Handling (Next.js 15)
Route parameters are now Promises:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... rest of handler
}
```

### Service Factory Usage
Always use service factories, never instantiate services directly:
```typescript
import { serviceFactory } from '@/core/factories';

const userService = await serviceFactory.getUserService();
const users = await userService.findAll();
```

### Permission System
- Permissions follow `category.action` format (e.g., `users.create`, `customers.view`)
- Always check permissions in API routes
- Use the PermissionMiddleware for consistent authorization

### Database Access Pattern
- **NEVER** access Prisma directly in API routes or components
- Always use the repository pattern
- Repositories extend `PrismaRepository` base class
- Use transactions for multi-step operations

## Key Implementation Guidelines

### When Creating New Features
1. Define domain models and interfaces in `domain/`
2. Create feature directory structure under `features/`
3. Implement repositories extending `PrismaRepository`
4. Implement services following existing patterns
5. Create API routes using the `routeHandler` pattern
6. Build React components and hooks
7. Export only public APIs through `index.ts`

### Common Pitfalls to Avoid
- Don't create duplicate response models - use existing DTOs
- Always validate enum parameters before passing to services
- Never import from deep paths - use feature exports
- Don't forget to handle async route parameters in Next.js 15
- Always wrap `formatResponse` with `NextResponse.json()`

### Error Handling
- Use `AppError` for application-specific errors
- Log errors with `LoggingService` before returning responses
- Provide user-friendly error messages
- Include proper HTTP status codes

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for API routes
- Component tests with React Testing Library
- Mock database calls in tests
- Use the test utilities in `src/__mocks__`

## Recent Major Features

### Plugin System (January 2025)
A comprehensive plugin architecture with:
- Secure sandboxed execution
- License management and anti-piracy
- Plugin marketplace infrastructure
- Database schema in place (Plugin, PluginLicense, PluginInstallation)
- Located in `features/plugins/` (under development)

### Automation System (January 2025)
Webhook and scheduling system replacing n8n integration:
- Webhook automation for entity operations
- Cron-based scheduling for recurring tasks
- Execution history and monitoring
- Service-specific webhook testing
- Located in `features/automation/`

### MCP Server Integration
Model Context Protocol server for AI agents:
- Resources for read operations
- Tools for write operations
- SSE support for real-time events
- Located in `/rising_mcp_server/`

## Performance Considerations
- Use Edge runtime where possible
- Implement proper database indexing
- Use pagination for large datasets
- Cache frequently accessed data
- Optimize bundle size with dynamic imports

## Security Best Practices
- Never expose sensitive data in responses
- Validate all input data
- Use prepared statements (Prisma handles this)
- Implement rate limiting on sensitive endpoints
- Keep dependencies updated
- Use environment variables for secrets

## Development Workflow Tips
- Run `npm run typecheck` before committing
- Use `npm run lint:fix` to auto-fix linting issues
- Check `npm run test:watch` during development
- Use Prisma Studio (`npm run db:studio`) for database inspection
- Monitor the server logs for debugging

## Environment Variables
Key environment variables (see `.env.example` for full list):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/rising_bsm
JWT_SECRET=your-secret-key-at-least-32-characters
JWT_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=2592000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```