# Deprecated Authentication Files

This directory contains files that were deprecated during the authentication centralization process. These files have been replaced with a centralized approach using the AuthService in `/features/auth/core/AuthService.ts`.

## Migrated Files

1. **initialization-index.ts**
   - Original location: `/features/auth/lib/initialization/index.ts`
   - Purpose: Provided initialization for authentication system
   - Replaced by: Direct usage of AuthService.initialize()

## Authentication System Changes

The authentication system has been refactored to use a single source of truth (AuthService) with the following improvements:

- Centralized token management within AuthService
- Consistent authentication middleware pattern for API routes
- Proper error handling for authentication failures
- Clear, typed interfaces for authentication operations
- HTTP-only cookies for secure token storage
- Automatic token refresh before expiration

## Migration Pattern

The standard pattern for protected routes is now:

```typescript
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest, user: any) => {
    // Your authenticated handler logic here
    return NextResponse.json({ success: true, data: {...} });
  });
  
  return authHandler(request);
}
```

## Token Management

Token operations are now handled exclusively by AuthService:

- Getting tokens: `AuthService.getToken()`
- Validating tokens: `AuthService.validateToken()`
- Refreshing tokens: `AuthService.refreshToken()`
- Checking authentication: `AuthService.isAuthenticated()`
- Getting user info: `AuthService.getUser()`
