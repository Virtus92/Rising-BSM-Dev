# Authentication System Documentation

## Overview

This document describes the new authentication system for the Rising-BSM application. The system has been completely redesigned to address issues with the previous implementation including race conditions, multiple initializations, and circular dependencies.

## Core Components

The authentication system consists of the following core components:

1. **AuthService** - The central service and single source of truth for all authentication operations
2. **TokenManager** - Handles token operations (internal to AuthService)
3. **EventEmitter** - Handles event subscription and publishing
4. **AuthProvider** - React context provider for auth state

## Architecture

The new architecture follows these key principles:

1. **Single Source of Truth**: AuthService is the only component that maintains authentication state
2. **Unidirectional Data Flow**: Components depend on AuthService, not vice versa
3. **Clear Initialization Sequence**: Authentication is initialized in a predictable sequence
4. **No Circular Dependencies**: Dependencies flow in one direction

## Usage Guide

### Basic Authentication

```typescript
import AuthService from '@/features/auth/core';

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
import { useAuth } from '@/features/auth/providers/AuthProvider';

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

Token management is now fully handled by AuthService:

```typescript
import AuthService from '@/features/auth/core';

// Refresh token
await AuthService.refreshToken();

// Validate token
const isValid = await AuthService.validateToken();

// Get token (rarely needed directly)
const token = await AuthService.getToken();
```

### API Client Integration

The API client now uses AuthService for token management:

```typescript
import { ApiClient } from '@/core/api/ApiClient';

// Initialize API client
await ApiClient.initialize();

// Make API request (token management happens automatically)
const response = await ApiClient.get('/api/users/me');
```

## Authentication Flow

1. **Initialization**: 
   - AuthService initializes TokenManager
   - TokenManager validates current token
   - AuthService extracts user info from token
   - AuthService updates authentication state

2. **Token Refresh**:
   - TokenManager schedules refresh before token expiry
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
import AuthService from '@/features/auth/core';

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

## Advantages Over Previous System

- No race conditions or multiple initializations
- Clear ownership of authentication state
- Simplified token management
- No circular dependencies
- Better error handling and recovery
- Improved testability
