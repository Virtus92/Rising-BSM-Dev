# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rising BSM (Business Service Management) is an open-source platform designed to provide a foundation for efficient development of personal AI assistants that handle requests, customer management, and appointment scheduling. The application is built using Next.js 15, React 18, Tailwind CSS, and Prisma ORM.

## Architecture

The project follows a feature-driven architecture where code is organized by domain rather than technical function:

```
app/src/
├── app/            # Next.js app directory with pages and API routes
├── core/           # Core framework components, services and utilities
├── domain/         # Domain models, interfaces, and service definitions
├── features/       # Feature modules with components, hooks and business logic
└── shared/         # Shared components, utilities and hooks
```

### Client/Server Architecture

The project follows strict client/server separation in Next.js:

1. **Server-only code** (files with `.server.ts` suffix):
   - Database access with Prisma
   - API keys and credentials
   - Server-only resources

2. **Client-only code** (files with `.client.ts` suffix):
   - Browser-specific code
   - UI state management
   - API clients

3. **Shared code** (files with `.ts` suffix):
   - Types and interfaces
   - Utility functions
   - Constants

### Service Pattern

The application uses a factory pattern for services:
- Server components use `getServiceFactory` from `@/core/factories/serviceFactory.server`
- Client components use `getServiceFactory` from `@/core/factories`

The service factory provides the correct implementation for each environment to ensure proper separation of concerns.

## Common Commands

### Development

```bash
# Start development server
npm run dev

# Build the application
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Formatting
npm run format
```

### Database

```bash
# Run migrations
npm run db:migrate

# Create development migrations
npm run db:migrate:dev

# Seed the database
npm run db:seed

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio
npm run db:studio
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

## Environment Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your database connection and other settings in `.env.local`

3. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```

4. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build the Docker image
docker build -t rising-bsm .

# Run the container
docker run -p 3000:3000 -e DATABASE_URL=your_db_url rising-bsm
```

The Docker setup automatically:
1. Generates the Prisma client
2. Runs database migrations
3. Seeds the database if in development mode
4. Starts the application

## Key Development Patterns

1. **API Pattern**: Client components should use API clients, never direct database access
2. **Auth Flow**: JWT with refresh token rotation and HTTP-only cookies
3. **Error Handling**: Consistent error types and proper propagation
4. **Component Structure**: Each feature module is self-contained with its components, hooks, services, and API handlers

## Import Aliases

The project uses the following import aliases:

```typescript
// Available import paths
import { something } from '@/core/...';      // Core framework code
import { something } from '@/features/...';  // Feature modules
import { something } from '@/shared/...';    // Shared components and utilities
import { something } from '@/domain/...';    // Domain models and interfaces
```