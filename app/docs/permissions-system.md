# Rising-BSM Permissions Management System Documentation

## Overview

The Rising-BSM Permissions Management System provides a comprehensive way to control user access throughout the application. The system implements a role-based access control (RBAC) model with the ability to assign individual permissions to users.

## Key Components

### 1. Permission Types

Permissions in the system follow a `category.action` format:

- **Category**: Represents a functional area of the application (e.g., users, customers)
- **Action**: Represents an operation within that area (e.g., view, create, edit)

Example: `users.create` allows creating new users.

### 2. Role-Based Permissions

Each user is assigned a role that comes with a predefined set of permissions:

- **Admin**: Full access to all system features
- **Manager**: Access to manage most operational features
- **Employee**: Limited access to operational features
- **User**: Basic access to personal features only

### 3. Individual Permissions

Beyond role-based permissions, individual permissions can be granted to or revoked from specific users to customize their access rights.

## Managing Permissions

### System-Wide Permission Management

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

## Implementation Details

### Permission Components

The system uses several key components:

- **PermissionClient**: Handles API communication for permissions
- **PermissionService**: Backend service that manages permissions
- **UserPermissions**: UI component for managing user permissions
- **PermissionGuard**: Component that conditionally renders UI based on permissions
- **usePermissions**: React hook for checking permissions in components

### Error Handling and Fallbacks

The permission system implements several fallback mechanisms:

1. If role-based permissions can't be loaded, the system falls back to hardcoded defaults
2. If user-specific permissions can't be loaded, the system falls back to role-based permissions
3. Permission checks that fail default to deny access

### Best Practices

When implementing permissions in your components:

1. **Always use the PermissionGuard component** for conditional rendering
   ```tsx
   <PermissionGuard permission={SystemPermission.USERS_CREATE}>
     <Button>Create User</Button>
   </PermissionGuard>
   ```

2. **Use the usePermissions hook** for programmatic permission checks
   ```tsx
   const { hasPermission } = usePermissions();
   
   if (hasPermission(SystemPermission.USERS_EDIT)) {
     // Code that requires edit permission
   }
   ```

3. **Register new permissions** in the PermissionEnums.ts file
   ```typescript
   // Add new permission enum
   FEATURE_ACTION = "feature.action",
   
   // Add to appropriate role arrays
   ```

4. **Use appropriate category names** that match your feature structure

## Common Patterns

### Nested Permissions

For features with nested permissions, use a hierarchical approach:

```tsx
<PermissionGuard permission={SystemPermission.CUSTOMERS_VIEW}>
  <div>
    <h1>Customer Details</h1>
    <PermissionGuard permission={SystemPermission.CUSTOMERS_EDIT}>
      <Button>Edit Customer</Button>
    </PermissionGuard>
  </div>
</PermissionGuard>
```

### Permission Groups

For features that require multiple permissions, use the anyPermission prop:

```tsx
<PermissionGuard 
  anyPermission={[
    SystemPermission.USERS_EDIT,
    SystemPermission.SYSTEM_ADMIN
  ]}
>
  <AdminPanel />
</PermissionGuard>
```

## Extending the System

To add new permissions:

1. Add new permission enum in src/domain/enums/PermissionEnums.ts
2. Update role permission arrays to include the new permission
3. Update backend permission checks if necessary
4. Implement UI permission checks using PermissionGuard or usePermissions

## Troubleshooting

Common issues:

- **Permissions not loading**: Check network requests to /api/users/permissions
- **Access denied unexpectedly**: Verify role permissions and individual permissions
- **PermissionGuard not working**: Ensure the permission string matches exactly

## Performance Considerations

The permission system implements several optimizations:

- Permission caching to reduce API calls
- Batch permission checks for efficiency
- Optimized permission evaluation for common patterns

## Security Notes

- The permission system is designed with a "deny by default" approach
- All permission checks are performed on both client and server
- Server-side checks are the ultimate authority regardless of client state
