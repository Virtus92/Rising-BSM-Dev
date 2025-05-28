# Authentication System

## Overview

Rising-BSM implements a comprehensive authentication system based on JWT (JSON Web Tokens) with refresh token rotation. This document provides a detailed explanation of the authentication architecture, flows, and implementation details.

## Key Components

### 1. AuthService (`src/features/auth/core/AuthService.ts`)

The `AuthService` is the central component that manages authentication state and operations:

- **Token Management**: Handles acquisition, validation, and refreshing of JWT tokens
- **Authentication State**: Tracks the current user's authentication status
- **Login/Logout Operations**: Processes user authentication and session termination
- **Initialization**: Ensures the authentication system is properly initialized on application startup

### 2. Token Management

The system uses two types of tokens:

- **Access Token**: Short-lived JWT (15-60 min) for API authentication
- **Refresh Token**: Longer-lived token (up to 30 days) for refreshing access tokens

Both tokens are stored securely as HTTP-only cookies and managed by the AuthService.

### 3. API Routes

Authentication-related endpoints include:

- `/api/auth/login`: User authentication
- `/api/auth/register`: User registration
- `/api/auth/logout`: Session termination
- `/api/auth/refresh`: Access token renewal
- `/api/auth/token`: Token verification and retrieval
- `/api/auth/forgot-password`: Password recovery initiation
- `/api/auth/reset-password`: Password reset
- `/api/auth/change-password`: Change password for authenticated users

### 4. Middleware

Authentication middleware protects routes and API endpoints:

- `withAuth`: HOC for protecting routes
- `authMiddleware`: Validates authentication for API requests
- `extractAuthToken`: Extracts token from requests
- `checkPermissions`: Validates user permissions

## Authentication Flow

### Login Flow

1. **User Credentials Submission**:
   - User submits email and password to `/api/auth/login`
   - Client-side validation occurs before submission

2. **Server-Side Validation**:
   - The server validates credentials against the database
   - Password is verified using bcrypt

3. **Token Generation**:
   - On successful validation, the server generates:
     - Access token (JWT)
     - Refresh token

4. **Token Storage**:
   - Tokens are stored as HTTP-only cookies
   - Access token is also available as a non-HTTP-only cookie for client-side JavaScript access
   - Tokens include user details (id, email, role) and expiration

5. **Client-Side State Update**:
   - AuthService updates the authentication state
   - Application UI updates to reflect authenticated status

```
┌───────────┐        ┌────────────┐        ┌────────────┐
│           │        │            │        │            │
│  Browser  │        │  API Route │        │  Database  │
│           │        │            │        │            │
└─────┬─────┘        └──────┬─────┘        └──────┬─────┘
      │                     │                     │
      │  Login Request      │                     │
      │ ──────────────────> │                     │
      │                     │                     │
      │                     │  Validate User      │
      │                     │ ──────────────────> │
      │                     │                     │
      │                     │  User Data          │
      │                     │ <────────────────── │
      │                     │                     │
      │                     │  Generate Tokens    │
      │                     │ ─────────┐          │
      │                     │          │          │
      │                     │ <────────┘          │
      │                     │                     │
      │                     │  Store Refresh      │
      │                     │  Token              │
      │                     │ ──────────────────> │
      │                     │                     │
      │  Response with      │                     │
      │  Tokens in Cookies  │                     │
      │ <────────────────── │                     │
      │                     │                     │
      │  Update Auth State  │                     │
      │ ─────────┐          │                     │
      │          │          │                     │
      │ <────────┘          │                     │
      │                     │                     │
```

### Token Refresh Flow

1. **Token Expiration Detection**:
   - AuthService detects an expiring access token
   - A refresh request is prepared

2. **Refresh Request**:
   - AuthService sends the refresh token to `/api/auth/refresh`

3. **Server-Side Validation**:
   - The server validates the refresh token
   - If valid, the refresh token is rotated (old one invalidated, new one created)

4. **New Tokens Issuance**:
   - New access and refresh tokens are generated
   - Tokens are sent back and stored as HTTP-only cookies

5. **Client-Side State Update**:
   - AuthService updates its internal token storage
   - Authentication state is maintained without user interruption

```
┌───────────┐        ┌────────────┐        ┌────────────┐
│           │        │            │        │            │
│ AuthService│        │ Refresh API│        │  Database  │
│           │        │            │        │            │
└─────┬─────┘        └──────┬─────┘        └──────┬─────┘
      │                     │                     │
      │  Detect Expiring    │                     │
      │  Token              │                     │
      │ ─────────┐          │                     │
      │          │          │                     │
      │ <────────┘          │                     │
      │                     │                     │
      │  Refresh Request    │                     │
      │ ──────────────────> │                     │
      │                     │                     │
      │                     │  Validate Refresh   │
      │                     │  Token              │
      │                     │ ──────────────────> │
      │                     │                     │
      │                     │  Token Valid        │
      │                     │ <────────────────── │
      │                     │                     │
      │                     │  Generate New       │
      │                     │  Tokens             │
      │                     │ ─────────┐          │
      │                     │          │          │
      │                     │ <────────┘          │
      │                     │                     │
      │                     │  Store New          │
      │                     │  Refresh Token      │
      │                     │ ──────────────────> │
      │                     │                     │
      │  Response with      │                     │
      │  New Tokens         │                     │
      │ <────────────────── │                     │
      │                     │                     │
      │  Update Token       │                     │
      │  Storage            │                     │
      │ ─────────┐          │                     │
      │          │          │                     │
      │ <────────┘          │                     │
      │                     │                     │
```

### Logout Flow

1. **User Logout**:
   - User initiates logout
   - AuthService sends request to `/api/auth/logout`

2. **Token Invalidation**:
   - Server invalidates the refresh token in the database
   - Cookies are cleared from the response

3. **Client-Side Cleanup**:
   - AuthService clears token from memory
   - Authentication state is updated to reflect unauthenticated status
   - User is redirected to login page

## Implementation Details

### Token Storage Strategy

The system uses a multi-layered approach to token storage:

1. **HTTP-only Cookies** (Primary Method):
   - `auth_token`: Access token, HTTP-only for security
   - `refresh_token`: Refresh token, HTTP-only to prevent JavaScript access

2. **JavaScript-accessible Cookie**:
   - `js_token`: Non-HTTP-only cookie for client-side access when needed
   - Used for operations that require direct token access

3. **In-Memory Storage**:
   - AuthService maintains tokens in memory during active session
   - Cleared when the page is refreshed or application is closed

### Token Refresh Management

The system implements smart token refresh strategies:

1. **Proactive Refresh**:
   - Tokens are refreshed before they expire (default 3 minutes before)
   - Prevents disruption of user experience

2. **Exponential Backoff**:
   - If refresh fails, retry with exponential backoff
   - Handles temporary network issues gracefully

3. **Auto-Reconnection**:
   - If the application tab is inactive and refresh fails, retry when tab becomes active

4. **Silent Refresh**:
   - Refresh occurs in the background without user knowledge
   - UI remains responsive during refresh operations

### Error Handling

The authentication system has comprehensive error handling:

1. **Authentication Errors**:
   - Invalid credentials
   - Expired tokens
   - Token validation failures

2. **Network Errors**:
   - Connection issues during authentication operations
   - Retry strategies for transient errors

3. **Server Errors**:
   - Proper user feedback for server-side failures
   - Fallback mechanisms when services are unavailable

## Client Usage Examples

### Using the AuthService in Components

```typescript
// Example of using authentication in a React component
import { useAuth } from '@/features/auth';

function ProfileComponent() {
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

### Protecting Routes with AuthGuard

```typescript
// Example of protecting a page route
import { withAuth } from '@/features/auth/hoc/withAuth';

function SettingsPage() {
  // This page is only accessible to authenticated users
  return <div>Settings Page Content</div>;
}

// Export with authentication guard
export default withAuth(SettingsPage);
```

### Making Authenticated API Requests

```typescript
// Example of making authenticated API requests
import { ApiClient } from '@/core/api';

// ApiClient automatically includes authentication tokens
async function fetchUserData() {
  try {
    const response = await ApiClient.get('/api/users/me');
    return response.data;
  } catch (error) {
    // Error handling
    console.error('Failed to fetch user data:', error);
    return null;
  }
}
```

## Server Implementation Examples

### Protected API Route

```typescript
// Example of a protected API route
import { routeHandler } from '@/core/api/server/route-handler';

export const GET = routeHandler(
  async (req, user) => {
    // This route is protected and only accessible to authenticated users
    // The user object contains the authenticated user's information
    return {
      success: true,
      data: {
        message: `Hello, ${user.name}!`,
        userId: user.id
      }
    };
  },
  { requiresAuth: true } // This option enforces authentication
);
```

### Authentication Middleware

```typescript
// Example of using authentication middleware in a custom API route
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/features/auth/api/middleware';

export async function GET(req: NextRequest) {
  // Authenticate the request
  const authResult = await authMiddleware(req);
  
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Request is authenticated, proceed with handling
  const user = authResult.user;
  
  return NextResponse.json({
    success: true,
    data: {
      message: `Hello, ${user.name}!`,
      userId: user.id
    }
  });
}
```

## Security Considerations

The authentication system implements several security best practices:

1. **HTTP-Only Cookies**: Prevents JavaScript access to tokens, mitigating XSS attacks
2. **CSRF Protection**: Proper cookie settings and token validation
3. **Token Rotation**: Refresh tokens are rotated on each use, mitigating token theft
4. **Short-lived Access Tokens**: Limits the window of opportunity for token misuse
5. **Secure Password Storage**: Passwords are hashed with bcrypt
6. **Rate Limiting**: Prevents brute force attacks
7. **Activity Logging**: Authentication events are logged for security monitoring

## Troubleshooting

### Common Issues

1. **Authentication Failed**:
   - Check that credentials are entered correctly
   - Verify the user exists and is active in the database
   - Check server logs for detailed error messages

2. **Token Expired/Invalid**:
   - Clear browser cookies and try again
   - Check that system clock is accurate
   - Verify JWT_SECRET is correctly configured on the server

3. **Refresh Token Failed**:
   - Check that cookies are not being blocked by browser settings
   - Verify database connection is functioning correctly
   - Ensure refresh token table exists and is accessible

### Debugging Tools

1. **Auth Debug Mode**:
   - Enable debug mode in development: `localStorage.setItem('auth_debug', 'true')`
   - View detailed authentication logs in browser console

2. **Token Inspector**:
   - Access token details: `localStorage.getItem('auth_debug') && console.log(JSON.parse(atob(localStorage.getItem('js_token')?.split('.')[1] || '')))`
   - View decoded token payload in console

3. **Authentication Diagnostics Page**:
   - Navigate to `/dashboard/diagnostics/auth` (admin only)
   - View detailed authentication system status

## Reference

### Environment Configuration

The authentication system requires these environment variables:

```
# Authentication
JWT_SECRET=your-secure-secret-key
JWT_EXPIRY=3600  # Access token expiry in seconds
REFRESH_TOKEN_EXPIRY=2592000  # Refresh token expiry in seconds

# Optional Settings
AUTH_COOKIE_DOMAIN=domain.com  # For cross-subdomain authentication
AUTH_SECURE_COOKIES=true  # For HTTPS environments
```

### AuthService API

Key methods in the AuthService:

- `initialize()`: Initialize the authentication system
- `signIn(email, password)`: Authenticate a user
- `signOut()`: End the current session
- `isAuthenticated()`: Check if user is authenticated
- `getUser()`: Get current user information
- `getToken()`: Get the current JWT token
- `validateToken()`: Validate the current token
- `refreshToken()`: Force a token refresh
- `onAuthStateChange(callback)`: Subscribe to authentication state changes