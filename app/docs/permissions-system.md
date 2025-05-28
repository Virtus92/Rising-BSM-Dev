# Rising-BSM Permissions Management System

## Overview

The Rising-BSM Permissions Management System provides a robust, flexible way to control user access throughout the application. The system implements a role-based access control (RBAC) model with the ability to assign individual permissions to users, giving you the best of both role-based and permission-based approaches.

## Architecture

The permission system is built on three key entities:

1. **Permissions**: Individual capabilities within the system
2. **Roles**: Collections of permissions assigned to user types
3. **User Permissions**: Additional permissions granted to specific users

```
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│    Permission   │◄─────┤ RolePermission  │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
        ▲                        │
        │                        │
        │                        ▼
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│ UserPermission  │─────▶│      Role       │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
        │                        ▲
        │                        │
        ▼                        │
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│      User       │─────▶│    UserRole     │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
```

## Permission Types

Permissions in the system follow a `category.action` format:

- **Category**: Represents a functional area of the application (e.g., users, customers)
- **Action**: Represents an operation within that area (e.g., view, create, edit)

Example: `users.create` allows creating new users.

### Permission Categories

| Category | Description |
|----------|-------------|
| `dashboard` | Dashboard access and features |
| `users` | User management |
| `customers` | Customer management |
| `requests` | Request management |
| `appointments` | Appointment management |
| `notifications` | Notification system |
| `settings` | System settings |
| `permissions` | Permission management |
| `profile` | User profile actions |
| `system` | System-wide operations |

### Permission Actions

| Action | Description |
|--------|-------------|
| `view` | View or read access |
| `create` | Create new records |
| `edit` | Edit existing records |
| `delete` | Delete records |
| `approve` | Approve items requiring approval |
| `reject` | Reject items |
| `assign` | Assign items to users |
| `manage` | Special management capabilities |
| `access` | Basic access permission |
| `admin` | Full administrative access |

## Role-Based Permissions

Each user is assigned a role that comes with a predefined set of permissions:

- **Admin**: Full access to all system features
- **Manager**: Access to manage most operational features
- **Employee**: Limited access to operational features
- **User**: Basic access to personal features only

## Individual Permissions

Beyond role-based permissions, individual permissions can be granted to or revoked from specific users to customize their access rights.

## Implementation

### System-Wide Permission Definition

The system-wide permissions are defined in a centralized enum:

```typescript
// src/domain/enums/PermissionEnums.ts
export enum SystemPermission {
  // Dashboard
  DASHBOARD_ACCESS = "dashboard.access",
  
  // User management
  USERS_VIEW = "users.view",
  USERS_CREATE = "users.create",
  USERS_EDIT = "users.edit",
  USERS_DELETE = "users.delete",
  
  // Customer management
  CUSTOMERS_VIEW = "customers.view",
  CUSTOMERS_CREATE = "customers.create",
  CUSTOMERS_EDIT = "customers.edit",
  CUSTOMERS_DELETE = "customers.delete",
  
  // Request management
  REQUESTS_VIEW = "requests.view",
  REQUESTS_CREATE = "requests.create",
  REQUESTS_EDIT = "requests.edit",
  REQUESTS_DELETE = "requests.delete",
  REQUESTS_APPROVE = "requests.approve",
  REQUESTS_REJECT = "requests.reject",
  REQUESTS_ASSIGN = "requests.assign",
  REQUESTS_CONVERT = "requests.convert",
  
  // Additional permissions...
  
  // System administration
  SYSTEM_ADMIN = "system.admin"
}
```

### Permission Initialization

Permissions are automatically initialized in the database during application startup:

```typescript
// From src/features/permissions/lib/services/PermissionInitializer.ts
export async function initializePermissionSystem(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    logger.info('Initializing permission system');
    
    // 1. Clear the permission cache on startup
    await clearPermissionCache();
    logger.info('Permission cache cleared on startup');
    
    // 2. Ensure all system permissions exist in the database
    const existingPermissions = await db.permission.findMany();
    const existingPermissionCodes = existingPermissions.map(p => p.code);
    
    // Get all permission codes from the SystemPermission enum
    const allSystemPermissions = Object.values(SystemPermission);
    
    // Find missing permissions
    const missingPermissions = allSystemPermissions.filter(
      code => !existingPermissionCodes.includes(code)
    );
    
    // Create missing permissions
    if (missingPermissions.length > 0) {
      // Creation logic...
    }
    
    // 3. Initialize default role permissions for all roles
    await ensureRolePermissions();
    
    // 4. Verify admin users have the correct permissions
    // ...
    
    return {
      success: true,
      message: `Permission system initialized successfully`,
      details: { /* initialization details */ }
    };
  } catch (error) {
    // Error handling...
  }
}
```

## Using Permissions in Code

### 1. Server-Side Permission Checking

```typescript
// Example API route with permission check
import { routeHandler } from '@/core/api/server/route-handler';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

export const GET = routeHandler(
  async (req, user) => {
    // Handle GET request for customers
    // ...
    return { success: true, data: customers };
  },
  { 
    requiresAuth: true,
    requiredPermissions: [SystemPermission.CUSTOMERS_VIEW]
  }
);
```

### 2. Client-Side Permission Guards

```tsx
// React component with permission check
import { PermissionGuard } from '@/shared/components/permissions/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

function AdminSection() {
  return (
    <PermissionGuard permission={SystemPermission.USERS_EDIT}>
      <div>
        <h2>User Management</h2>
        {/* Admin UI components */}
      </div>
    </PermissionGuard>
  );
}
```

### 3. Using the usePermissions Hook

```tsx
// Using permissions hook in a component
import { usePermissions } from '@/features/users/hooks';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

function ActionButtons({ userId }) {
  const { hasPermission } = usePermissions();
  
  return (
    <div className="action-buttons">
      {hasPermission(SystemPermission.USERS_EDIT) && (
        <button onClick={() => editUser(userId)}>Edit User</button>
      )}
      
      {hasPermission(SystemPermission.USERS_DELETE) && (
        <button onClick={() => deleteUser(userId)}>Delete User</button>
      )}
    </div>
  );
}
```

### 4. Permission Middleware

```typescript
// Simplified permission middleware example
import { NextRequest, NextResponse } from 'next/server';
import { getPermissionService } from '@/core/factories/serviceFactory.server';

export async function permissionMiddleware(
  req: NextRequest,
  requiredPermissions: string[]
) {
  // Extract user ID from authenticated request
  const userId = req.headers.get('X-User-Id');
  
  if (!userId) {
    return {
      success: false,
      message: 'User not authenticated'
    };
  }
  
  // Get permission service
  const permissionService = getPermissionService();
  
  // Check if user has required permissions
  const hasPermissions = await permissionService.checkUserPermissions(
    parseInt(userId),
    requiredPermissions
  );
  
  if (!hasPermissions) {
    return {
      success: false,
      message: 'Permission denied'
    };
  }
  
  return {
    success: true
  };
}
```

## Permission Management UI

### Managing Permissions Through UI

Access the Permission Management page through:
Dashboard → Management → Permissions

The permission management page provides three main tabs:

1. **Permissions**: View and manage all system permissions
2. **Roles**: Configure which permissions are assigned to each role
3. **User Assignment**: Assign specific permissions to individual users

### User-Specific Permission Management

To manage permissions for a specific user:

1. Go to Dashboard → Users
2. Find the user and click "Edit"
3. Click the "Manage Permissions" button
4. The permissions dialog shows:
   - Role-based permissions (automatically granted based on user role)
   - Individual permissions (manually assigned to this specific user)

## Component Examples

### Permission Role Manager

```tsx
// src/features/permissions/components/PermissionRoleManager.tsx
import React, { useState, useEffect } from 'react';
import { usePermissionClient } from '../hooks/usePermissionClient';
import { UserRole } from '@/domain/enums/UserEnums';

export function PermissionRoleManager() {
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.ADMIN);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const permissionClient = usePermissionClient();
  
  // Load permissions for the selected role
  useEffect(() => {
    async function loadRolePermissions() {
      setLoading(true);
      try {
        // Load all available permissions
        const allPermissionsResult = await permissionClient.getPermissions();
        setPermissions(allPermissionsResult.data || []);
        
        // Load role-specific permissions
        const roleResult = await permissionClient.getRolePermissions(selectedRole);
        setRolePermissions(roleResult.data?.map(p => p.code) || []);
      } catch (error) {
        console.error('Error loading role permissions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRolePermissions();
  }, [selectedRole, permissionClient]);
  
  // Toggle permission for role
  const togglePermission = async (permissionCode: string) => {
    try {
      if (rolePermissions.includes(permissionCode)) {
        // Remove permission
        await permissionClient.removeRolePermission(selectedRole, permissionCode);
        setRolePermissions(prev => prev.filter(p => p !== permissionCode));
      } else {
        // Add permission
        await permissionClient.addRolePermission(selectedRole, permissionCode);
        setRolePermissions(prev => [...prev, permissionCode]);
      }
    } catch (error) {
      console.error('Error updating role permission:', error);
    }
  };
  
  return (
    <div className="permission-role-manager">
      <h2>Role Permission Management</h2>
      
      {/* Role selector */}
      <div className="role-selector">
        <label htmlFor="role-select">Select Role:</label>
        <select 
          id="role-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          {Object.values(UserRole).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      
      {/* Loading indicator */}
      {loading && <div className="loading">Loading permissions...</div>}
      
      {/* Permission list */}
      {!loading && (
        <div className="permission-list">
          {permissions.map(permission => (
            <div key={permission.code} className="permission-item">
              <label className="permission-label">
                <input
                  type="checkbox"
                  checked={rolePermissions.includes(permission.code)}
                  onChange={() => togglePermission(permission.code)}
                />
                <span className="permission-name">{permission.name}</span>
                <span className="permission-description">{permission.description}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### PermissionGuard Component Implementation

```tsx
// src/shared/components/permissions/PermissionGuard.tsx
import React from 'react';
import { useEnhancedPermissions } from '@/features/permissions/hooks/useEnhancedPermissions';
import { NoPermissionView } from '../NoPermissionView';

interface PermissionGuardProps {
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  children,
  fallback = <NoPermissionView />
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useEnhancedPermissions();
  
  // Check if user has required permissions
  const hasAccess = (
    // Single permission check
    (permission && hasPermission(permission)) ||
    // Any permission check (OR logic)
    (anyPermission && anyPermission.length > 0 && hasAnyPermission(anyPermission)) ||
    // All permissions check (AND logic)
    (allPermissions && allPermissions.length > 0 && hasAllPermissions(allPermissions)) ||
    // If no permission specified, allow access
    (!permission && !anyPermission && !allPermissions)
  );
  
  // Render children if user has access, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

## Permission Hooks

### useEnhancedPermissions Hook

```typescript
// src/features/permissions/hooks/useEnhancedPermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { usePermissionClient } from './usePermissionClient';
import { useAuth } from '@/features/auth';

export function useEnhancedPermissions() {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const permissionClient = usePermissionClient();
  
  // Load user permissions
  useEffect(() => {
    async function loadUserPermissions() {
      if (!isAuthenticated || !user?.id) {
        setPermissions([]);
        setLoading(false);
        return;
      }
      
      try {
        const result = await permissionClient.getUserPermissions(user.id);
        setPermissions(result.data?.map(p => p.code) || []);
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserPermissions();
  }, [isAuthenticated, user?.id, permissionClient]);
  
  // Check if user has a specific permission
  const hasPermission = useCallback((permissionCode: string) => {
    // System admin has all permissions
    if (permissions.includes('system.admin')) {
      return true;
    }
    
    return permissions.includes(permissionCode);
  }, [permissions]);
  
  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissionCodes: string[]) => {
    // System admin has all permissions
    if (permissions.includes('system.admin')) {
      return true;
    }
    
    return permissionCodes.some(code => permissions.includes(code));
  }, [permissions]);
  
  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissionCodes: string[]) => {
    // System admin has all permissions
    if (permissions.includes('system.admin')) {
      return true;
    }
    
    return permissionCodes.every(code => permissions.includes(code));
  }, [permissions]);
  
  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading
  };
}
```

## Common Patterns

### Permission-Based Conditional Rendering

```tsx
import { useEnhancedPermissions } from '@/features/permissions/hooks/useEnhancedPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

function UserActionButtons({ user }) {
  const { hasPermission } = useEnhancedPermissions();
  
  return (
    <div className="action-buttons">
      {/* View button always shown */}
      <button onClick={() => viewUser(user.id)}>View</button>
      
      {/* Edit button only shown with proper permission */}
      {hasPermission(SystemPermission.USERS_EDIT) && (
        <button onClick={() => editUser(user.id)}>Edit</button>
      )}
      
      {/* Delete button only shown with proper permission */}
      {hasPermission(SystemPermission.USERS_DELETE) && (
        <button onClick={() => deleteUser(user.id)}>Delete</button>
      )}
    </div>
  );
}
```

### Nested Permission Guards

```tsx
import { PermissionGuard } from '@/shared/components/permissions/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

function CustomerDetail({ customer }) {
  return (
    <PermissionGuard permission={SystemPermission.CUSTOMERS_VIEW}>
      <div className="customer-detail">
        <h2>{customer.name}</h2>
        <div className="customer-info">
          {/* Basic info visible to anyone with CUSTOMERS_VIEW */}
          <p>Email: {customer.email}</p>
          <p>Phone: {customer.phone}</p>
        </div>
        
        {/* Nested permission check for sensitive data */}
        <PermissionGuard permission={SystemPermission.CUSTOMERS_EDIT}>
          <div className="sensitive-info">
            <h3>Financial Information</h3>
            <p>Account: {customer.accountNumber}</p>
            <p>Status: {customer.paymentStatus}</p>
          </div>
        </PermissionGuard>
        
        {/* Actions require specific permissions */}
        <div className="actions">
          <PermissionGuard permission={SystemPermission.CUSTOMERS_EDIT}>
            <button>Edit Customer</button>
          </PermissionGuard>
          
          <PermissionGuard permission={SystemPermission.CUSTOMERS_DELETE}>
            <button>Delete Customer</button>
          </PermissionGuard>
        </div>
      </div>
    </PermissionGuard>
  );
}
```

### Permission Groups with OR Logic

```tsx
import { PermissionGuard } from '@/shared/components/permissions/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

function AdminPanel() {
  return (
    <PermissionGuard 
      anyPermission={[
        SystemPermission.SETTINGS_EDIT,
        SystemPermission.SYSTEM_ADMIN,
        SystemPermission.USERS_EDIT
      ]}
    >
      <div className="admin-panel">
        <h2>Administration</h2>
        {/* Admin UI components */}
      </div>
    </PermissionGuard>
  );
}
```

## Best Practices

1. **Always use the permission components and hooks** for consistent permission checking
2. **Add new permissions to the SystemPermission enum** when creating new features
3. **Use the most specific permission** for each action instead of relying on broad permissions
4. **Check permissions on both client and server** for complete security
5. **Group related permissions** in UI components for better organization
6. **Use meaningful permission codes** that follow the `category.action` format
7. **Document new permissions** thoroughly when adding them to the system

## Troubleshooting

### Common Issues

- **Permissions not loading**: Check network requests to /api/users/permissions
- **Access denied unexpectedly**: Verify role permissions and individual permissions
- **PermissionGuard not working**: Ensure the permission string matches exactly
- **Missing permissions after deployment**: Run database migrations and seed scripts

### Debugging Tools

- **Permission Debug Mode**: Enable in development with query parameter `?permDebug=true`
- **Permission Diagnostics Page**: Available at `/dashboard/diagnostics/permissions` for admins
- **Browser Console**: Check for permission-related warnings and errors in the console

## Performance Considerations

The permission system implements several optimizations:

- **Permission Caching**: Permissions are cached in memory to reduce database queries
- **Role-Based Defaults**: Common permissions are assigned at the role level
- **Client-Side Caching**: Permission results are cached on the client side
- **Optimized Permission Evaluation**: Permissions are evaluated efficiently with short-circuit logic