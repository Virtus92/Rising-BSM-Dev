# Authentication System: Detailed Architecture

This document provides a comprehensive technical overview of the Rising-BSM authentication system architecture, implemented with a "work properly or throw proper errors" philosophy.

## Core Components

### AuthService (`AuthService.ts`)

AuthService is the centralized implementation of IAuthService that serves as the single source of truth for authentication. It provides a unified interface for all authentication operations.

**Key Responsibilities:**
- Token management (acquisition, validation, refresh)
- User authentication state tracking
- Login/logout operations
- Session management
- Token refresh scheduling

**State Management:**
- `authState`: Contains the current authentication state
- `initialized`: Tracks if the service has been initialized
- `tokenExpiryTime`: Tracks when the current token expires
- `refreshTimeoutId`: Reference to the scheduled token refresh

**Key Methods:**
```typescript
// Initialization
public async initialize(options?: { force?: boolean }): Promise<boolean>

// Core authentication
public async signIn(email: string, password: string): Promise<{ success: boolean; message?: string }>
public async signOut(): Promise<boolean>

// Token operations
public async getToken(): Promise<string | null>
public async validateToken(): Promise<boolean>
public async refreshToken(...): Promise<RefreshTokenResponseDto>

// User information
public getUser(): UserInfo | null
public async getCurrentUser(): Promise<UserDto>
```

### AuthErrorHandler (`AuthErrorHandler.ts`)

Provides standardized error handling for authentication operations with consistent error types, format, and responses.

**Key Components:**
- `AuthErrorType`: Enum of all possible authentication error types
- `AuthError`: Error class with type, status, and metadata
- `normalizeError`: Converts any error format to a standardized AuthError
- `createErrorResponse`: Creates NextResponse from auth errors

**Error Flow:**
1. Error is created or thrown in AuthService or middleware
2. Error is normalized through AuthErrorHandler
3. Standardized response is returned to client

### Authentication Middleware (`authMiddleware.ts`)

Middleware for securing API routes and enforcing authentication requirements.

**Key Functions:**
- `withAuth`: Main middleware generator for securing routes
- `authenticateRequest`: Validates request authentication
- `extractAuthToken`: Extracts token from requests
- `checkPermissions`: Validates user permissions

**Usage Example:**
```typescript
// Creating a secured API route
export const GET = routeHandler(
  async (request, user) => {
    // Your route logic here
    return NextResponse.json({ success: true, data: {...} });
  },
  { requiresAuth: true }
);
```

## Authentication Flow Details

### 1. Token Flow

The system uses two types of tokens:
- **Access Token**: Short-lived JWT for authentication (15-60 min)
- **Refresh Token**: Longer-lived token for refreshing access (up to 30 days)

Both tokens are stored as HTTP-only cookies and managed by AuthService.

**Token Refresh Flow:**
1. AuthService detects expiring access token
2. Refresh request is made to `/api/auth/refresh`
3. If valid, new tokens are generated and stored
4. Application continues with new tokens

### 2. Error Management

The system implements a robust error handling approach:

**Error Hierarchy:**
- All authentication errors extend from `AuthError`
- Each error has a specific `AuthErrorType`
- Errors include status codes matching HTTP semantics

**Error Normalization:**
- Various error formats are converted to `AuthError`
- Error messages are standardized for consistency
- Error responses follow a predictable format:
  ```json
  {
    "success": false,
    "data": null,
    "error": "Detailed error message",
    "statusCode": 401
  }
  ```

### 3. Permission System

Authentication integrates with a permission-based system:

- Role checking at middleware level
- Permission verification for specific actions
- Integration with the permissions service for complex rules

## Implementation Guidelines

### 1. Proper Error Handling

All authentication-related functions should:
- Use the `AuthErrorHandler` to create errors
- Include specific error types from `AuthErrorType`
- Provide clear, actionable error messages
- Not expose sensitive information in errors

### 2. Token Usage

When working with tokens:
- Always validate tokens before using
- Store tokens only in HTTP-only cookies
- Include all necessary security headers
- Don't expose tokens to client-side JavaScript

### 3. Authentication Checks

When implementing authentication checks:
- Use the `withAuth` middleware for API routes
- For client components, use hooks that verify authentication
- Always handle the unauthenticated state gracefully
- Provide clear feedback to users on authentication issues

## Security Considerations

The authentication system implements several security best practices:

- **HTTP-Only Cookies**: Prevents client-side JavaScript access to tokens
- **CSRF Protection**: Proper cookie settings and token validation
- **Rate Limiting**: Prevents brute force attacks
- **Token Validation**: Comprehensive validation before accepting tokens
- **Error Messages**: Non-leaking error messages that don't expose sensitive info
- **Refresh Token Rotation**: New refresh tokens on each refresh
- **Automatic Token Expiration**: Time-based expiration with proper cleanup

## Service Integration

The authentication system is integrated with other services through:

1. **ServiceFactory**: Creates AuthService instances with proper dependencies
2. **API Client**: Uses AuthService for obtaining and refreshing tokens
3. **Route Handler**: Uses authentication middleware for securing routes
4. **Permission System**: Integrates with permission checking for authorization

## Client-Side Integration

Client-side integration is achieved through:

1. **AuthProvider**: React context provider for authentication state
2. **useAuth Hook**: React hook for accessing authentication functionality
3. **withAuth HOC**: Higher-order component for protecting pages

**Example:**
```tsx
function ProfilePage() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please log in to view your profile.</p>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```
