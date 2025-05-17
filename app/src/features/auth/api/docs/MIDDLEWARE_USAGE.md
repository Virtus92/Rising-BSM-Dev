# Authentication Middleware Usage Guide

This document provides clear instructions and examples for using the authentication middleware in the Rising-BSM application.

## Overview

The authentication middleware is designed to protect API routes and ensure that only authenticated users can access them. The middleware also supports role-based and permission-based access control.

## Basic Authentication

For routes that require just authentication:

```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    // Your authenticated route logic here
    return NextResponse.json({ success: true, data: {...} });
  })(request);
}
```

## Authentication with Permissions

For routes that require authentication and permissions:

```typescript
export async function POST(request: NextRequest) {
  return withAuth(
    async (req: NextRequest, user: any) => {
      // Your authenticated route logic here
      return NextResponse.json({ success: true, data: {...} });
    },
    { requireAuth: true, requiredPermission: ['PERMISSION_CODE'] }
  )(request);
}
```

## Chaining Middlewares

For routes that need more complex middleware chaining:

```typescript
export async function PUT(request: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    return withPermission(
      async (req: NextRequest, user: any) => {
        // Your authenticated and permission-checked route logic here
        return NextResponse.json({ success: true, data: {...} });
      },
      'PERMISSION_CODE'
    )(req);
  })(request);
}
```

## Handling Route Parameters

For routes with URL parameters:

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(async (req: NextRequest, user: any) => {
    const id = params.id;
    // Your authenticated route logic here that uses the ID parameter
    return NextResponse.json({ success: true, data: {...} });
  })(request);
}
```

## Error Handling

Always include error handling in your route handlers:

```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      // Your authenticated route logic here
      return NextResponse.json({ success: true, data: {...} });
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred' 
      }, { status: 500 });
    }
  })(request);
}
```

## Common Mistakes

1. **Passing Request Directly**: Never pass the request object directly to a middleware function
   ```typescript
   // WRONG
   return withAuth(request);
   
   // CORRECT
   return withAuth(handler)(request);
   ```

2. **Incorrect Access to User**: User data is passed to your handler, not attached to the middleware
   ```typescript
   // WRONG
   const userData = withAuth.user;
   
   // CORRECT (inside your handler)
   async (req, user) => {
     const userData = user;
   }
   ```

3. **Missing Error Handling**: Always handle errors in your route handlers
   ```typescript
   // WRONG
   return withAuth(async (req, user) => {
     const result = await someOperationThatMightFail();
     return NextResponse.json({ success: true, data: result });
   })(request);
   
   // CORRECT
   return withAuth(async (req, user) => {
     try {
       const result = await someOperationThatMightFail();
       return NextResponse.json({ success: true, data: result });
     } catch (error) {
       return NextResponse.json({ 
         success: false, 
         message: error instanceof Error ? error.message : 'An error occurred' 
       }, { status: 500 });
     }
   })(request);
   ```

## Best Practices

1. **Consistent Error Handling**: Use consistent error response formats
2. **Middleware Composition**: Use composition for complex middleware chains
3. **TypeScript Typing**: Use proper typing for user objects where possible
4. **Clear Permissions**: Use explicit permission codes from constants
5. **Logging**: Include appropriate logging for auth failures
