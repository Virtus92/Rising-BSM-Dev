# Rising-BSM

Business Service Management System built with Next.js, Prisma, and TypeScript.

## Initial Setup

When first downloading or cloning the repository, follow these steps:

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Start the development server:

```bash
npm run dev
```

## Troubleshooting Prisma Issues

If you encounter Prisma-related errors like:

- `Error: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.`
- `Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.`
- TypeScript errors in repository files

Use our automatic repair script:

```bash
npm run prisma:fix
```

This script:
- Checks for proper Prisma setup
- Regenerates the Prisma client
- Clears caches
- Validates the generated files

After running the repair script, restart your development server:

```bash
npm run dev
```

## Project Structure

- `app/` - Next.js application with App Router
- `core/` - Core system components and utilities
- `domain/` - Domain entities, DTOs, and interfaces
- `features/` - Feature modules (users, customers, etc.)
- `prisma/` - Prisma schema and generated client
- `scripts/` - Utility scripts

## Development Workflow

1. Make changes to your code
2. Run tests: `npm test`
3. Format code: `npm run format`
4. Lint code: `npm run lint`
5. Build for production: `npm run build`

## Database Management

- View database in Prisma Studio: `npm run db:studio`
- Apply migrations: `npm run db:migrate`
- Create development migrations: `npm run db:migrate:dev`
- Seed database: `npm run db:seed`

## Additional Scripts

- `npm run prisma:generate` - Regenerate Prisma client
- `npm run prisma:fix` - Fix Prisma client issues

## Troubleshooting

If you encounter issues:

1. Make sure you've run `npm install` and `npm run prisma:generate`
2. Clear Next.js cache by deleting the `.next` directory
3. Run the Prisma fix script: `npm run prisma:fix`
4. Restart your development server
