# Authentication System Updates

## Overview

This document describes the changes made to the authentication system in the Rising-BSM application. The authentication system has been completely redesigned to use a centralized `AuthService` as the single source of truth for all authentication operations.

## Key Changes

1. **Centralized Authentication Service**
   - `AuthService` is now the single source of truth for all authentication operations
   - The service manages token handling, user state, and authentication flow
   - External components now access authentication functionality through AuthService

2. **Authentication API**
   - `signIn()` and `signOut()` instead of `login()` and `logout()`
   - Direct token management through `getToken()`, `validateToken()`, and `refreshToken()`
   - Event-based notification system for auth state changes

3. **React Integration**
   - New `AuthProvider` context and `useAuth()` hook for React components
   - Consistent error handling and loading state management

4. **API Client Integration**
   - API Client now uses `initialize()` method rather than `isInitialized` property
   - Automatic token refresh on 401 responses
   - Consistent error handling with backward compatible message property

5. **Middleware Usage**
   - Corrected middleware function (`withAuth`) now properly handles async operation
   - Consistent error response format

## Migration Tips

When working with the authentication system:

1. Always use `AuthService` methods directly instead of old token handlers
2. Access auth state through `useAuth()` hook in React components
3. Ensure proper async handling in route handlers with withAuth
4. Use AuthService.initialize() at application startup
5. Check for errors using the `error` property instead of `message`

## Error Handling

The new API response format focuses on the `error` property instead of `message`:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null; // Use this for error messages
  statusCode?: number;
  message?: string; // Deprecated - only included for backward compatibility
}
```

Update error handling code to check `error` rather than `message`:

```typescript
// Old
if (!response.success) {
  toast.error(response.message || 'An error occurred');
}

// New
if (!response.success) {
  toast.error(response.error || 'An error occurred');
}
```

## Authentication Flow

The new authentication flow follows these steps:

1. **Application Initialization**
   - API Client initialization
   - AuthService initialization
   - Token validation

2. **Authentication**
   - User logs in via AuthService.signIn
   - Token is stored in HTTP-only cookies
   - AuthService extracts user info and updates state

3. **Token Management**
   - TokenManager automatically refreshes tokens before expiry
   - API requests include tokens from AuthService
   - Failed requests with 401 trigger automatic token refresh
