# Authentication Middleware for Next.js Edge Runtime

## Overview

This directory contains authentication middleware optimized for Next.js applications, including a special version for Edge Runtime environments. The Edge Runtime does not support Node.js built-in modules like `crypto`, which creates challenges for JWT validation.

## Files

- `authMiddleware.ts` - Standard authentication middleware (for Node.js environments)
- `authMiddlewareEdge.ts` - Edge-compatible authentication middleware
- `index.ts` - Exports for both middleware versions

## Edge Runtime Solution

The Edge Runtime solution uses a two-part approach:

1. **Basic validation in Edge** - Decodes the JWT and checks basic claims like expiration, without cryptographic verification
2. **Full validation via API** - Makes a request to a Node.js API route for full cryptographic verification when needed

This approach provides:
- Fast performance in development
- Secure validation in production
- Compatibility with Edge Runtime restrictions

## Usage

In your `middleware.ts` file, import the Edge-compatible version:

```typescript
import { authenticateRequestEdge } from '@/features/auth/middleware';

// Later in your middleware function
const authResult = await authenticateRequestEdge(request);
```

## Configuration

- `JWT_VALIDATE_FULL=true` - Set this environment variable to force full validation in development
- `NEXT_PUBLIC_APP_URL` - Base URL for the application, used for token validation callbacks

## Security Considerations

The Edge middleware performs basic claim validation but cannot verify the token signature in the Edge Runtime. For production usage, always ensure that:

1. The token validation API route is secured
2. Sensitive operations have additional validations in their handlers
3. Full token validation occurs before accessing protected resources

## Performance

The middleware is optimized for performance:
- Basic validation happens first to filter out obviously invalid tokens
- Full validation is skipped in development by default
- Minimal network requests in all environments
