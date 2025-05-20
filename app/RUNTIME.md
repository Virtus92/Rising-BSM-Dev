# Runtime Configuration

This project uses Next.js and maintains compatibility between Edge and Node.js runtimes.

## Runtime Configuration

1. **Routes requiring Node.js APIs**
   - These routes have a `runtime.ts` file exporting `export const runtime = 'nodejs';`
   - Examples: auth-related routes, database-heavy operations

2. **Routes that can use Edge Runtime**
   - All other routes use the Edge runtime by default for better performance
   - No special configuration needed

## Key Runtime Requirements

- **Node.js Runtime Required for**:
  - Prisma database operations
  - JWT verification with jsonwebtoken
  - Bcrypt password hashing
  - Any other operations using Node.js specific APIs

- **Edge Runtime Compatible**:
  - Standard API routes not using Node.js specific features
  - Static page rendering
  - Client components

## Best Practices

1. Always mark routes that use Node.js specific APIs with `runtime = 'nodejs'`
2. Keep database operations in server-only code
3. Use dynamic imports for Node.js specific modules

## Next.js Configuration

The `next.config.js` file contains settings to properly handle module dependencies:

```js
serverComponentsExternalPackages: [
  'jsonwebtoken',
  'bcryptjs',
  '@prisma/client',
  'jose'
],
```

This ensures these packages are properly bundled for the Node.js runtime.
