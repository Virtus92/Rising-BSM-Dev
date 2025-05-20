# Authentication System Updates

## Overview

This document describes the changes made to the authentication system in the Rising-BSM application. The authentication system has been completely redesigned to use a centralized `AuthService` as the single source of truth for all authentication operations.

## Key Changes

1. **Centralized Authentication Service**
   - `AuthService` is now the single source of truth for all authentication operations
   - The service manages token handling, user state, and authentication flow
   - External components now access authentication functionality through AuthService
   - Removed redundant TokenManager in favor of integrated token management in AuthService

2. **Authentication API**
   - `signIn()` and `signOut()` methods instead of `login()` and `logout()`
   - Direct token management through `getToken()`, `validateToken()`, and `refreshToken()`
   - Event-based notification system for auth state changes
   - JWT validation with proper error handling

3. **React Integration**
   - New `AuthProvider` context and `useAuth()` hook for React components
   - Consistent error handling and loading state management
   - Clear authentication state in components

4. **API Client Integration**
   - API Client now uses `initialize()` method rather than `isInitialized` property
   - Automatic token refresh on 401 responses
   - Consistent error handling with standard error format

5. **Middleware Usage**
   - Enhanced middleware function (`withAuth`) that properly handles async operations
   - Consistent error response format
   - Permission integration for role and permission checks
   - Proper user context propagation

6. **Error Handling**
   - New `AuthErrorHandler` for standardized error handling
   - Clear error types and messages
   - Consistent error response format

## Response Format Changes

The API response format now follows this structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  statusCode?: number;
}
```

Update error handling code to check `error` property:

```typescript
// Error handling
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
   - AuthService automatically refreshes tokens before expiry
   - API requests include tokens from AuthService
   - Failed requests with 401 trigger automatic token refresh

## API Routes Usage

API routes now use the `routeHandler` utility with authentication and permission middleware:

```typescript
// Example API route
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      // Your route logic here
      return formatResponse.success({ message: 'Success' });
    },
    SystemPermission.USERS_VIEW // Required permission
  ),
  { requiresAuth: true } // Enable authentication
);
```

## Client Component Usage

Client components now use the `useAuth` hook:

```tsx
'use client';

import { useAuth } from '@/features/auth';

export function ProfileComponent() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in to view your profile.</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

## Security Improvements

The authentication system now implements these security improvements:

1. **HTTP-Only Cookies**: Tokens are stored in HTTP-only cookies to prevent JavaScript access
2. **CSRF Protection**: Proper cookie settings and token validation
3. **Token Validation**: Comprehensive validation before accepting tokens
4. **Error Messages**: Non-revealing error messages for security
5. **Refresh Token Rotation**: New refresh tokens on each refresh
6. **Token Expiration**: Automatic token expiration and cleanup
