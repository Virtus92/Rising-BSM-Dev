# Authentication Middleware Usage Guide

## Important Notice: Correct Usage of `withAuth` Middleware

The `withAuth` function from the authentication middleware is an asynchronous function that returns a Promise that resolves to a route handler. Therefore, it must be properly awaited before being used.

## Correct Usage Pattern

```typescript
// ✅ CORRECT: Using withAuth properly
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest) => {
    // Your handler logic here
    return someHandlerFunction(req);
  });
  return authHandler(request);
}
```

## Incorrect Usage Pattern

```typescript
// ❌ INCORRECT: This will cause TypeErrors
export const GET = withAuth(async (request: NextRequest) => {
  // Your handler logic here
  return someHandlerFunction(request);
});
```

## Why This Matters

The incorrect pattern treats the result of `withAuth` as if it were the route handler itself, but since `withAuth` returns a Promise, this leads to the error:

```
TypeError: Function.prototype.apply was called on #<Promise>, which is an object and not a function
```

## Router Handler Pattern

For Next.js App Router routes, always follow this pattern:

1. Define an async function for the HTTP method (GET, POST, etc.)
2. Inside this function, await the call to `withAuth` to get the authenticated handler
3. Call and return the result of the authenticated handler with the request

## Example: Complete Route Handler

```typescript
import { NextRequest } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { someHandlerFunction } from '@/features/your-feature/api';

export async function GET(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest) => {
    return someHandlerFunction(req);
  });
  return authHandler(request);
}
```

## Using routeHandler Instead

If you're using the `routeHandler` function instead, follow this pattern:

```typescript
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';

export async function GET(request: NextRequest) {
  const handler = routeHandler(async (req: NextRequest) => {
    // Your logic here
    return someResponse;
  }, {
    requiresAuth: true
  });
  return handler(request);
}
```
