# Authentication System Migration Guide

## Overview

This document outlines the process for migrating from the old authentication system to the new centralized authentication architecture. The new system addresses issues with race conditions, multiple initializations, and circular dependencies.

## Migration Steps

### Step 1: Import from the new location

Replace imports from the old authentication files with imports from the new centralized module:

**OLD:**
```typescript
import { tokenService } from '@/features/auth/lib/services/TokenService';
import { initializeAuth } from '@/features/auth/lib/initialization/AuthInitializer';
```

**NEW:**
```typescript
import AuthService from '@/features/auth/core';
```

### Step 2: Replace token management calls

Replace calls to token management functions with their equivalents in AuthService:

**OLD:**
```typescript
const token = await tokenService.getToken();
const isValid = await tokenService.validateToken();
await tokenService.refreshToken();
```

**NEW:**
```typescript
const token = await AuthService.getToken();
const isValid = await AuthService.validateToken();
await AuthService.refreshToken();
```

### Step 3: Update initialization code

Replace old initialization patterns with AuthService initialization:

**OLD:**
```typescript
await initializeAuth();
```

**NEW:**
```typescript
await AuthService.initialize();
```

### Step 4: Update authentication state management

Replace checking authentication state with AuthService methods:

**OLD:**
```typescript
import { isAuthenticated, getUserFromTokenSync } from '@/features/auth/lib/initialization/AuthInitializer';

const authenticated = isAuthenticated();
const user = getUserFromTokenSync();
```

**NEW:**
```typescript
import AuthService from '@/features/auth/core';

const authenticated = AuthService.isAuthenticated();
const user = AuthService.getUser();
```

### Step 5: Update login/logout functions

Replace login/logout functionality:

**OLD:**
```typescript
import { login, logout } from '@/features/auth/lib/services/AuthServiceImpl';

await login(email, password);
await logout();
```

**NEW:**
```typescript
import AuthService from '@/features/auth/core';

await AuthService.signIn(email, password);
await AuthService.signOut();
```

### Step 6: Update React components

Update React components to use the new AuthProvider:

**OLD:**
```tsx
import { useAuthManagement } from '@/features/auth/hooks/useAuthManagement';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuthManagement();
  // ...
}
```

**NEW:**
```tsx
import { useAuth } from '@/features/auth/providers/AuthProvider';

function MyComponent() {
  const { isAuthenticated, user, signIn, signOut } = useAuth();
  // ...
}
```

### Step 7: Update API client usage

The API client now works with AuthService automatically, so no changes are needed in most cases. If you were manually adding tokens to API requests, this can be removed.

### Step 8: Test the migration

Use the authentication diagnostic page at `/dashboard/diagnostics/auth` to verify that the authentication system is working correctly after migration.

## Common Issues

### 1. Circular Dependencies

If you encounter circular dependency errors, check if you're importing both AuthService and a component that imports AuthService. To fix this:

- Use dynamic imports for AuthService in lower-level components
- Refactor to pass authentication state down through props
- Use the AuthProvider context instead of direct imports

### 2. Multiple Initialization Attempts

If you notice multiple initialization attempts, check if you're explicitly initializing AuthService in multiple places. The ideal pattern is:

- Initialize at the application root
- Use the initialized state everywhere else

### 3. Application Doesn't Recognize Authentication

If the application doesn't recognize that a user is authenticated after migration:

- Check that token cookies are being set correctly
- Verify that AuthService.initialize() is being called before checking authentication state
- Check for errors in the browser console

## Rollback Process

If issues are encountered that can't be immediately resolved, you can temporarily roll back to the old authentication system:

1. Revert imports to use the old authentication files
2. Restore any modified initialization code
3. Restore API client modifications
4. Contact the development team for assistance

## Support

If you encounter issues during migration, please check the authentication diagnostic page at `/dashboard/diagnostics/auth` and include the logs in your support request.
