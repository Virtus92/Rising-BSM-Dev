# Important: Server and Client Component Imports

## Background

In Next.js, there are two types of components:
1. **Server Components**: Can use server-only APIs but can't use client-side hooks
2. **Client Components**: Can use React hooks but can't use server-only APIs

Some APIs like `cookies` from `next/headers` are server-only and cannot be imported in client components.

## Proper Import Paths

### For Server Components and API Routes

When working in server components (files without 'use client') or API routes, import the full versions with server-side APIs:

```typescript
// For API route handlers
import { routeHandler } from '@/core/api/server';

// For auth middleware with full server-side capabilities
import { getServerSession, withAuth } from '@/features/auth/api/middleware/authMiddleware';
```

### For Client Components

When working in client components (files with 'use client' directive), use the client-safe versions:

```typescript
// For client-side API utilities
import { ApiClient } from '@/core/api';

// For client-safe auth utilities
import { extractAuthToken } from '@/features/auth/api/middleware';
```

## Error Prevention

- Never import `next/headers` directly in client components
- Always use the correct import paths based on whether you're in a server or client component
- If you see errors related to "You're importing a component that needs next/headers", verify your imports

## Structure Overview

- `@/core/api/route-handler.ts`: Client-safe version (types only)
- `@/core/api/server/route-handler.ts`: Full server version
- `@/features/auth/api/middleware/authMiddleware.ts`: Full server version
- `@/features/auth/api/middleware/client/authMiddleware.ts`: Client-safe version

This separation ensures proper functioning across both server and client environments.
