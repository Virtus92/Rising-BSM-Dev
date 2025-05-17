# Factory Pattern for Client/Server Code Separation

This directory contains factory implementations for both client and server contexts in the Next.js application.

## File Structure

- `*.ts` - Base/shared factories that can be imported anywhere
- `*.client.ts` - Client-specific implementations that are safe to use in browser contexts
- `*.server.ts` - Server-only implementations that access database directly

## How it Works

### Client Components

Client components should:
1. Import from `@/core/factories` for standard factories
2. Import directly from client-specific services/repositories when needed
   - For example: `import { permissionServiceClient } from '@/features/permissions/lib/services/PermissionService.client';`

The main `index.ts` file exports client-safe versions of all factories to ensure they don't import `server-only` code.

### Server Components

Server components should:
1. Import from `@/core/factories/serviceFactory.server` for server-side factories 
2. Never import from the main `index.ts` factory as it contains client-safe code

## Implementation Details

### Database Access

- Client components should never access the database directly
- Server components can use `getPrismaClient()` from `databaseFactory.server.ts`
- Client-side database factory provides mock Prisma client that prevents database operations

### Repositories

- Server repositories connect directly to the database
- Client repositories use API clients or provide mock implementations

### Services

- Server services implement full business logic with database access
- Client services use API calls to interact with the server

## Common Issues

### "server-only" Import Error

If you see this error:
```
You're importing a component that needs "server-only". 
That only works in a Server Component which is not supported in the pages/ directory.
```

It means you're importing server-only code in a client component. Solutions:

1. Change your import to use a client-specific implementation
2. Import from `@/core/factories` instead of `@/core/factories/databaseFactory` directly
3. Create a new client-side implementation if one doesn't exist

## Best Practices

1. Always mark server-only code with `import 'server-only';` 
2. Use `.client.ts` and `.server.ts` extensions consistently
3. Create client-specific implementations for all services/repositories
4. Use factory pattern to abstract the implementation details
5. Client hooks should import client services directly for clarity
