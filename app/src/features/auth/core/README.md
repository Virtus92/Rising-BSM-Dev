# Authentication System Documentation

## Overview

This document describes the authentication system for the Rising-BSM application. The system has been redesigned to provide a centralized approach to authentication with a single source of truth for all authentication operations.

## Core Components

The authentication system consists of the following core components:

1. **AuthService** - The central service and single source of truth for all authentication operations
2. **EventEmitter** - Handles event subscription and publishing
3. **AuthProvider** - React context provider for auth state
4. **TokenValidator** - Validates JWT tokens

## Architecture

The authentication architecture follows these key principles:

1. **Single Source of Truth**: AuthService is the only component that maintains authentication state
2. **Unidirectional Data Flow**: Components depend on AuthService, not vice versa
3. **Clear Initialization Sequence**: Authentication is initialized in a predictable sequence
4. **No Circular Dependencies**: Dependencies flow in one direction
5. **Proper Error Handling**: All operations either work correctly or throw appropriate errors

## Usage Guide

### Basic Authentication

```typescript
import { AuthService } from '@/features/auth/core';

// Check if user is authenticated
const isAuthenticated = AuthService.isAuthenticated();

// Get current user
const user = AuthService.getUser();

// Sign in
await AuthService.signIn(email, password);

// Sign out
await AuthService.signOut();
```

### React Components

```tsx
import { useAuth } from '@/features/auth/hooks/useAuthManagement';

function MyComponent() {
  const { isAuthenticated, user, signIn, signOut } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <button onClick={() => signIn('user@example.com', 'password')}>Sign In</button>
      )}
    </div>
  );
}
```

### Token Management

Token management is fully handled by AuthService:

```typescript
import { AuthService } from '@/features/auth/core';

// Refresh token
await AuthService.refreshToken();

// Validate token
const isValid = await AuthService.validateToken();

// Get token (rarely needed directly)
const token = await AuthService.getToken();
```

### API Client Integration

The API client uses AuthService for token management:

```typescript
import { ApiClient } from '@/core/api/ApiClient';

// Initialize API client
await ApiClient.initialize();

// Make API request (token management happens automatically)
const response = await ApiClient.get('/api/users/me');
```

## Authentication Flow

1. **Initialization**: 
   - AuthService initializes and validates current token
   - AuthService extracts user info from token
   - AuthService updates authentication state

2. **Token Refresh**:
   - AuthService schedules refresh before token expiry
   - AuthService handles token refresh
   - Authentication state is updated
   - Components are notified of state changes

3. **API Requests**:
   - API client makes requests with current token
   - If 401 response, AuthService refreshes token
   - Failed requests are retried with new token

## Event System

The authentication system uses events to communicate state changes:

```typescript
import { AuthService } from '@/features/auth/core';

// Subscribe to auth state changes
const unsubscribe = AuthService.onAuthStateChange((state) => {
  console.log('Auth state changed:', state.isAuthenticated);
});

// Unsubscribe when done
unsubscribe();

// Subscribe to token expiring
AuthService.onTokenExpiring(() => {
  console.log('Token is about to expire');
});
```

## Testing

The authentication system includes testing components in `@/features/auth/core/tests` for diagnosing issues. The auth diagnostic page is available at `/dashboard/diagnostics/auth`.

## Implementation Details

- HTTP-only cookies are used for token storage
- Token validation and refresh are handled centrally
- Token expiration is monitored and refreshed automatically
- Error handling is improved with clear error messages

## Security Considerations

The authentication system implements several security best practices:

- **HTTP-Only Cookies**: Prevents client-side JavaScript access to tokens
- **CSRF Protection**: Proper cookie settings and token validation
- **Rate Limiting**: Prevents brute force attacks
- **Token Validation**: Comprehensive validation before accepting tokens
- **Error Messages**: Non-leaking error messages that don't expose sensitive info
- **Refresh Token Rotation**: New refresh tokens on each refresh
- **Automatic Token Expiration**: Time-based expiration with proper cleanup

## API Reference

### AuthService Methods

- `initialize(options?: { force?: boolean }): Promise<boolean>`  
  Initializes the authentication service

- `signIn(email: string, password: string): Promise<{ success: boolean; message?: string }>`  
  Authenticates a user with email and password

- `signOut(): Promise<boolean>`  
  Signs out the current user

- `getToken(): Promise<string | null>`  
  Gets the current access token

- `validateToken(): Promise<boolean>`  
  Validates the current token

- `refreshToken(): Promise<any>`  
  Refreshes the current token

- `getUser(): UserInfo | null`  
  Gets the current user information

- `isAuthenticated(): boolean`  
  Checks if a user is authenticated

- `onAuthStateChange(callback: (state: AuthState) => void): () => void`  
  Subscribes to authentication state changes

- `onTokenExpiring(callback: () => void): () => void`  
  Subscribes to token expiring events

## Troubleshooting

Common issues and solutions:

1. **Token validation fails**:
   - Check if token is expired
   - Verify that cookies are properly set
   - Ensure that authentication initialization has completed

2. **Authentication state inconsistencies**:
   - Call `AuthService.initialize({ force: true })` to reset state
   - Check browser console for authentication errors
   - Verify that cookies are not being blocked

3. **API requests failing with 401**:
   - Check if token is valid
   - Verify that token refresh is working
   - Ensure that API client is properly initialized
