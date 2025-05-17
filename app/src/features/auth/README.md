# Authentication System Architecture

This document outlines the architecture of the Rising-BSM authentication system, which provides a centralized, robust authentication solution for the application.

## Core Architecture Principles

1. **Single Source of Truth**: The `AuthService` is the central authority for all authentication-related functionality
2. **Work Properly or Throw Proper Errors**: The system either functions correctly or fails with clear, informative errors
3. **No Backward Compatibility**: The system is designed without workarounds or legacy support
4. **Centralized Error Handling**: Uses standardized error types and formats across all components

## Key Components

### 1. AuthService

The `AuthService` is the core of the authentication system. It:

- Manages user authentication state
- Handles token operations (creation, validation, refresh)
- Provides authentication methods like `signIn` and `signOut`
- Implements the `IAuthService` interface for integration with service factory

Key methods:
- `initialize()`: Initializes the service and validates existing tokens
- `signIn(email, password)`: Authenticates a user with credentials
- `signOut()`: Logs out the current user
- `refreshToken()`: Refreshes the current access token
- `validateToken()`: Validates the current token
- `getToken()`: Retrieves the current token
- `getCurrentUser()`: Gets the current authenticated user

### 2. AuthErrorHandler

Centralized error handling for authentication:

- `AuthErrorType` enum for categorizing errors
- `AuthError` class for consistent error format
- `normalizeError` method to convert various error formats
- `createErrorResponse` to generate standardized API responses

### 3. Middleware

Authentication middleware for protecting routes:

- `withAuth` function for adding authentication to routes
- Role and permission-based access control
- Consistent error handling with informative messages

### 4. API Routes

API endpoints for authentication operations:

- `/api/auth/login`: User authentication
- `/api/auth/refresh`: Token refresh
- `/api/auth/logout`: User logout
- `/api/auth/validate`: Token validation
- And other authentication-related endpoints

## Authentication Flow

1. **Login Flow**:
   - User provides credentials
   - AuthService validates credentials
   - On success, tokens are generated and stored in HTTP-only cookies
   - User info is returned to client

2. **Token Refresh Flow**:
   - Client sends refresh request with refresh token
   - AuthService validates the refresh token
   - New access token is generated and returned
   - HTTP-only cookies are updated

3. **Authentication Check Flow**:
   - Route handler checks for authorization token
   - Token is validated through AuthService
   - User information is extracted and attached to request
   - If validation fails, proper errors are returned

## Error Handling

The system uses the `AuthErrorHandler` to create consistent, informative errors:

- Each error has a `type` from `AuthErrorType` enum
- Errors include appropriate HTTP status codes
- Descriptive messages provide actionable information
- Metadata can be attached for debugging purposes

## Security Measures

- HTTP-only cookies for token storage
- Appropriate security headers on responses
- Token expiration and refresh cycle
- Proper validation of token payloads
- Clear error messages without leaking sensitive information