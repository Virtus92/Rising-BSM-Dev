# Authentication Middleware Usage Guide

This document provides guidance on how to properly implement and use the authentication middleware in the Rising-BSM API routes.

## Overview

The authentication middleware provides a way to secure API routes by verifying that requests include valid authentication tokens. It can also check for specific user roles and permissions.

## Basic Usage

The most common way to use the authentication middleware is with the `routeHandler` utility:

```typescript
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';

export const GET = routeHandler(
  async (req: NextRequest) => {
    // Your route logic here
    return formatResponse.success({ message: 'Success' });
  },
  { requiresAuth: true } // Enable authentication
);
```

## Permission Checking

To also check for permissions, use the permission middleware:

```typescript
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      // Your route logic here
      return formatResponse.success({ message: 'Success' });
    },
    SystemPermission.USERS_VIEW // Required permission
  ),
  { requiresAuth: true } // Authentication is required
);
```

## Multiple Permissions

You can check for multiple permissions:

```typescript
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      // Your route logic here
      return formatResponse.success({ message: 'Success' });
    },
    [SystemPermission.USERS_MANAGE, SystemPermission.USERS_CREATE] // Multiple permissions
  ),
  { requiresAuth: true }
);
```

## Accessing the Authenticated User

The authenticated user is available in request headers:

```typescript
export const GET = routeHandler(
  async (req: NextRequest) => {
    // Get user ID from headers
    const userId = parseInt(req.headers.get('X-User-Id') || '0');
    
    // Use the userId in your route logic
    return formatResponse.success({ userId });
  },
  { requiresAuth: true }
);
```

## Optional Authentication

For routes where authentication is optional:

```typescript
export const GET = routeHandler(
  async (req: NextRequest) => {
    // Check if request is authenticated
    const userId = req.headers.get('X-User-Id');
    
    if (userId) {
      // User is authenticated
      return formatResponse.success({ authenticated: true, userId });
    } else {
      // User is not authenticated
      return formatResponse.success({ authenticated: false });
    }
  },
  { requiresAuth: false } // Authentication is optional
);
```

## Role-Based Authorization

For role-based authorization, specify required roles:

```typescript
import { UserRole } from '@/domain/enums/UserEnums';

export const GET = routeHandler(
  async (req: NextRequest) => {
    // Your route logic here
    return formatResponse.success({ message: 'Admin only content' });
  },
  {
    requiresAuth: true,
    requiredRole: UserRole.ADMIN // Require admin role
  }
);
```

## Error Handling

The authentication middleware automatically handles authentication errors. When authentication fails, it returns a standardized error response:

```json
{
  "success": false,
  "data": null,
  "error": "Authentication required",
  "statusCode": 401
}
```

## Best Practices

1. **Always Use routeHandler**: Never implement authentication manually
2. **Specify Requirements Clearly**: Be explicit about authentication and permission requirements
3. **Use SystemPermission Enum**: Use the enum for permission codes instead of string literals
4. **Validate User Input**: Even with authentication, always validate user input
5. **Proper Error Handling**: Use try/catch blocks and formatResponse for errors
6. **Check Context**: Use the user ID from headers in your business logic
7. **Log Actions**: Log important actions with the user ID for audit purposes

## Example Route with Complete Implementation

```typescript
// api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';

// Get user by ID
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest, { params }) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      try {
        // Extract user ID from params
        const userId = parseInt(params.id);
        
        // Validate user ID
        if (isNaN(userId) || userId <= 0) {
          return formatResponse.error('Invalid user ID', 400);
        }
        
        // Get requesting user ID from auth middleware
        const requestingUserId = parseInt(req.headers.get('X-User-Id') || '0');
        
        // Get user service
        const userService = serviceFactory.createUserService();
        
        // Get user
        const user = await userService.findById(userId, {
          context: { userId: requestingUserId }
        });
        
        // Check if user exists
        if (!user) {
          return formatResponse.error('User not found', 404);
        }
        
        // Log access
        logger.info(`User ${requestingUserId} accessed user ${userId}`);
        
        // Return user
        return formatResponse.success(user, 'User retrieved successfully');
      } catch (error) {
        // Log error
        logger.error('Error getting user', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          params
        });
        
        // Return error
        return formatResponse.error(
          error instanceof Error ? error.message : 'Error retrieving user',
          500
        );
      }
    },
    SystemPermission.USERS_VIEW
  ),
  { requiresAuth: true }
);
```
