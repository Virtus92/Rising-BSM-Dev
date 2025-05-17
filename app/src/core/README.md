# Core Framework Module

## Overview

The Core module provides the foundation for the Rising-BSM application. It contains essential services, utilities, and abstractions that are used throughout the application. This module is designed to be framework-agnostic and provides a clean separation between the application's business logic and infrastructure concerns.

## Directory Structure

```
core/
├── api/                 # API client and server-side route handling
├── bootstrap/           # Application initialization and service setup
├── config/              # Configuration management
├── db/                  # Database connection and utilities
├── errors/              # Error handling and formatting
├── factories/           # Service and repository factories
├── logging/             # Logging services and utilities
├── repositories/        # Base repository abstractions
├── security/            # Security utilities (password hashing, etc.)
├── services/            # Base service abstractions
├── types/               # Common type definitions
└── validation/          # Validation utilities
```

## Key Components

### API Module

The API module provides client and server-side utilities for making HTTP requests and handling API responses.

- **ApiClient**: Client-side utility for making HTTP requests to the API
- **RouteHandler**: Server-side utility for handling API routes and formatting responses

**Usage Example**:

```typescript
// Client-side usage
import { ApiClient } from '@/core/api';

// Initialize API client
await ApiClient.initialize();

// Make a GET request
const response = await ApiClient.get('/users');

// Server-side route handler usage
import { RouteHandler } from '@/core/api/server';

export const GET = RouteHandler(async (req) => {
  // Handle GET request
  return { success: true, data: { /* response data */ } };
});
```

### Bootstrap Module

The Bootstrap module handles the initialization of the application services and provides environment-specific bootstrapping.

- **bootstrap()**: Main entry point for application initialization
- **bootstrapServer()**: Server-specific initialization
- **bootstrapClient()**: Client-specific initialization

**Usage Example**:

```typescript
import { bootstrap } from '@/core/bootstrap';

// Initialize application
await bootstrap();
```

### Config Module

The Config module provides access to application configuration settings.

- **ConfigService**: Singleton service for accessing configuration values

**Usage Example**:

```typescript
import { configService } from '@/core/config';

// Get API base URL
const apiConfig = configService.getApiConfig();

// Check environment
if (configService.isDevelopment()) {
  // Development-specific code
}
```

### DB Module

The DB module provides database connection and utilities.

- **getPrismaClient()**: Function to get a Prisma client instance
- **db**: Shorthand export for the default Prisma client

**Usage Example**:

```typescript
import { db } from '@/core/db';

// Use Prisma client
const users = await db.user.findMany();
```

### Errors Module

The Errors module provides standardized error handling and formatting.

- **AppError**: Base error class
- **ValidationError**, **NotFoundError**, etc.: Specialized error classes
- **errorHandler**: Middleware for consistent error handling
- **formatResponse**: Utility for formatting API responses

**Usage Example**:

```typescript
import { AppError, ValidationError, errorHandler } from '@/core/errors';

// Create an error
throw new ValidationError('Invalid input', 'VALIDATION_ERROR', { field: 'Invalid value' });

// Use error handler middleware
export const GET = errorHandler(async (req) => {
  // Route implementation
});
```

### Factories Module

The Factories module provides factories for creating service and repository instances.

- **ServiceFactory**: Factory for creating service instances
- **RepositoryFactory**: Factory for creating repository instances
- **DatabaseFactory**: Factory for creating database connections

**Usage Example**:

```typescript

import { getServiceFactory } from '@/core/factories/serviceFactory.server';

// Get service factory
const serviceFactory = getServiceFactory();

// Create a service
const userService = serviceFactory.createUserService();
```

### Logging Module

The Logging module provides logging utilities.

- **LoggingService**: Service for logging
- **getLogger()**: Function to get a logger instance

**Usage Example**:

```typescript
import { getLogger } from '@/core/logging';

const logger = getLogger();

logger.info('Information message');
logger.error('Error message', { error });
```

### Repositories Module

The Repositories module provides base repository abstractions.

- **BaseRepository**: Abstract base class for repositories
- **PrismaRepository**: Base repository implementation using Prisma

**Usage Example**:

```typescript
import { PrismaRepository } from '@/core/repositories';

export class UserRepository extends PrismaRepository<User, Prisma.UserDelegate> {
  constructor() {
    super(db.user);
  }
}
```

### Security Module

The Security module provides security utilities.

- **hashPassword()**: Function to hash passwords
- **verifyPassword()**: Function to verify passwords
- **generateSecureToken()**: Function to generate secure tokens

**Usage Example**:

```typescript
import { hashPassword, verifyPassword } from '@/core/security';

// Hash a password
const hashedPassword = await hashPassword('password123');

// Verify a password
const isValid = await verifyPassword('password123', hashedPassword);
```

### Services Module

The Services module provides base service abstractions.

- **BaseService**: Abstract base class for services

**Usage Example**:

```typescript
import { BaseService } from '@/core/services';

export class UserService extends BaseService implements IUserService {
  constructor(private userRepository: IUserRepository) {
    super();
  }
}
```

### Validation Module

The Validation module provides validation utilities.

- **ValidationService**: Service for validating data
- **validateUserCreate()**, **validateUserUpdate()**: Specialized validation functions

**Usage Example**:

```typescript
import { ValidationService } from '@/core/validation';

const validationService = new ValidationService();
const result = validationService.validate(data, schema);
```

## Design Principles

1. **Separation of Concerns**: The Core module separates business logic from infrastructure concerns.
2. **Dependency Inversion**: The module uses interfaces and factories to decouple dependencies.
3. **Error Handling**: Consistent error handling and formatting throughout the application.
4. **Configuration**: Centralized configuration management.
5. **Logging**: Structured logging for better observability.

## Best Practices

1. **Use Factories**: Always use factories to create services and repositories.
2. **Error Handling**: Use the provided error classes and error handler middleware.
3. **Logging**: Use the provided logger instead of console.log/error.
4. **Configuration**: Use the ConfigService for accessing configuration values.
5. **Environment Detection**: Use the ConfigService methods for environment detection.
