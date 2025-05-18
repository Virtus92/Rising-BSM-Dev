'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EntityColors, getStatusBadgeColor } from '@/shared/utils/entity-colors';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { BaseListComponent, ColumnDef, CardProps } from '@/shared/components/data/BaseListComponent';
import { BaseCard, BaseCardProps } from '@/shared/components/data/BaseCard';
import { useUsers } from '../hooks/useUsers';
import { UserFilterParamsDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  User as UserIcon,
  Users as UsersIcon,
  Filter as FilterIcon
} from 'lucide-react';
import { getPaginationProps } from '@/shared/utils/list/baseListUtils';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';

// ----- Interfaces -----

export interface UserListProps {
  initialFilters?: Partial<UserFilterParamsDto>;
  onCreateClick?: () => void;
  showCreateButton?: boolean;
}

// Enhanced user type with currentUser property
interface EnhancedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  profilePicture?: string;
  isCurrentUser?: boolean;
  [key: string]: any;
}

// ----- Helper Functions -----

/**
 * Helper to generate user avatar from name
 */
const getUserAvatar = (name: string) => {
  if (!name) return "U";
  const nameParts = name.split(" ");
  if (nameParts.length > 1) {
    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

/**
 * Get color based on user role
 */
const getRoleColor = (role: string) => {
  switch (role) {
    case UserRole.ADMIN: return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case UserRole.MANAGER: return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case UserRole.EMPLOYEE: return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case UserRole.USER: return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  }
};

/**
 * Status icon component for visual representation
 */
const StatusIcon = ({ status }: { status: UserStatus }) => {
  switch (status) {
    case UserStatus.ACTIVE:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case UserStatus.INACTIVE:
      return <XCircle className="h-4 w-4 text-gray-500" />;
    case UserStatus.SUSPENDED:
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case UserStatus.DELETED:
      return <Trash2 className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

// ----- Card Component -----

/**
 * Card component for mobile view
 */
const UserCard = ({ item, onActionClick }: BaseCardProps<EnhancedUser>) => {
  const isCurrentUser = item.isCurrentUser;
  const isDeleted = item.status === UserStatus.DELETED;
  
  return (
    <BaseCard
      item={item}
      title={item.name}
      description={item.email}
      status={{
        text: item.status,
        className: getStatusBadgeColor('users', item.status)
      }}
      badges={[
        {
          text: item.role,
          className: getRoleColor(item.role)
        }
      ]}
      className={`border-l-4 ${EntityColors.users.border}`}
      fields={[
        {
          label: 'Email',
          value: item.email,
          icon: <Mail className="h-4 w-4 text-blue-600" />
        },
        {
          label: 'Status',
          value: item.status,
          icon: <StatusIcon status={item.status} />
        },
        {
          label: 'Current User',
          value: isCurrentUser ? 'Yes' : 'No',
          icon: isCurrentUser ? <UserIcon className="h-4 w-4 text-blue-600" /> : undefined
        }
      ]}
      actions={
        <div className="flex justify-between space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onActionClick?.('view', item)}
            disabled={isDeleted}
            className={`flex-1 ${EntityColors.users.text}`}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onActionClick?.('edit', item)}
            disabled={isDeleted}
            className={`flex-1 ${EntityColors.users.text}`}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onActionClick?.('delete', item)}
            disabled={isDeleted || isCurrentUser}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      }
    />
  );
};

// ----- Main Component -----

/**
 * User list component using our new baseList implementation
 */
export const UserList: React.FC<UserListProps> = ({ initialFilters = {}, onCreateClick, showCreateButton = true }) => {
  // Get permissions
  const { hasPermission } = usePermissions();
  const canEditUsers = hasPermission(API_PERMISSIONS.USERS.UPDATE);
  const canDeleteUsers = hasPermission(API_PERMISSIONS.USERS.DELETE);
  const router = useRouter();
  
  // Provide a default implementation if onCreateClick is not provided
  const defaultCreateClick = useCallback(() => {
    // Use the modal approach by default
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('openNewUserModal', 'true');
      router.push('/dashboard/users');
    }
  }, [router]);
  
  // Use the provided onCreateClick or fall back to the default
  const handleCreateClick = onCreateClick || defaultCreateClick;
  const [showFilters, setShowFilters] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number, name: string } | null>(null);
  
  // Use our new useUsers hook implementation
  const { 
    users, 
    isLoading, 
    error, 
    pagination, 
    activeFilters,
    filters, // Added to fix undefined references
    setPage,
    setSearch,
    setSort,
    deleteUser,
    currentUserId,
    setRoleFilter,
    setStatusFilter,
    refetch,
    clearAllFilters
  } = useUsers(initialFilters);

  // Enhance users with isCurrentUser flag
  const enhancedUsers: EnhancedUser[] = users.map(user => ({
    ...user,
    isCurrentUser: user.id === currentUserId
  }));

  // Handle delete confirmation
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    const success = await deleteUser(userToDelete.id);
    if (success) {
      // Toast notification for successful deletion
      if (typeof window !== 'undefined' && window.console) {
        console.log(`User '${userToDelete.name}' deleted successfully`);
      }
    }
    setUserToDelete(null);
  };
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, user: EnhancedUser) => {
    switch (action) {
      case 'view':
        router.push(`/dashboard/users/${user.id}`);
        break;
      case 'edit':
        router.push(`/dashboard/users/edit/${user.id}`);
        break;
      case 'delete':
        setUserToDelete({ id: Number(user.id), name: user.name });
        break;
    }
  }, [router]);

  // Define columns for the table view
  const columns: ColumnDef<EnhancedUser>[] = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: (user) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3 bg-primary text-primary-foreground">
            <AvatarFallback>{getUserAvatar(user.name)}</AvatarFallback>
            {user.profilePicture && (
              <AvatarImage src={user.profilePicture} alt={user.name} />
            )}
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-1.5">
              <StatusIcon status={user.status} />
              {user.name} {user.isCurrentUser && (
                <span className="text-xs text-muted-foreground">(You)</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Mail className="h-3.5 w-3.5 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (user) => (
        <Badge variant="outline" className={getRoleColor(user.role)}>
          {user.role}
        </Badge>
      ),
      sortable: true
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (user) => (
        <Badge 
          variant={
            user.status === UserStatus.ACTIVE ? 'default' : 
            user.status === UserStatus.INACTIVE ? 'secondary' : 
            user.status === UserStatus.SUSPENDED ? 'outline' : 
            'destructive'
          }
        >
          {user.status}
        </Badge>
      ),
      sortable: true
    }
  ];
  
  // Define row actions for the table
  const rowActions = useCallback((user: EnhancedUser) => {
    const isCurrentUser = user.isCurrentUser;
    const isDeleted = user.status === UserStatus.DELETED;
    
    return (
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          title="View User"
          onClick={() => router.push(`/dashboard/users/${user.id}`)}
          disabled={isDeleted}
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          title="Edit User"
          onClick={() => router.push(`/dashboard/users/edit/${user.id}`)}
          disabled={isDeleted || !canEditUsers}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="destructive" 
          size="icon" 
          title="Delete User"
          onClick={() => setUserToDelete({ id: Number(user.id), name: user.name })}
          disabled={isDeleted || isCurrentUser || !canDeleteUsers}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }, [router]);
  
  // Enhanced filter panel with better styling and user-themed colors
  const filterPanel = (
    <div className="p-5 border rounded-md mb-4 space-y-5 bg-white dark:bg-gray-800 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-blue-600" />
            Role
          </label>
          <select 
            className="w-full border rounded-md p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={filters.role || ''} 
            onChange={(e) => setRoleFilter(e.target.value ? e.target.value as UserRole : undefined)}
          >
            <option value="">All Roles</option>
            {Object.values(UserRole).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-blue-600" />
            Status
          </label>
          <select 
            className="w-full border rounded-md p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={filters.status || ''} 
            onChange={(e) => setStatusFilter(e.target.value ? e.target.value as UserStatus : undefined)}
          >
            <option value="">All Statuses</option>
            {Object.values(UserStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-2">
        <Button 
          variant="outline" 
          className={EntityColors.users.text}
          onClick={clearAllFilters}
        >
          Reset
        </Button>
        
        <Button 
          className={EntityColors.users.primary}
          onClick={() => setShowFilters(false)}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  // Use the provided onCreateClick prop instead of hardcoding navigation
  return (
    <>
      <BaseListComponent<EnhancedUser>
        // Data props
        items={enhancedUsers}
        isLoading={isLoading}
        error={error || null}
        {...getPaginationProps(pagination)} // Extract pagination props
        
        // Configuration
        columns={columns}
        keyExtractor={(item) => item.id}
        cardComponent={UserCard as React.FC<CardProps<EnhancedUser>>}
        
        // UI elements
        title="Users"
        searchPlaceholder="Search users by name or email..."
        emptyStateMessage="No users found"
        createButtonLabel="Add New User"
        showCreateButton={showCreateButton}
        
        // Active filters
        activeFilters={activeFilters}
        
        // Actions
        onPageChange={setPage}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onCreateClick={handleCreateClick}
        onRefresh={() => refetch()}
        onFilterToggle={() => setShowFilters(!showFilters)}
        onClearAllFilters={clearAllFilters}
        onActionClick={handleCardAction}
        
        // Filter panel
        filterPanel={filterPanel}
        showFilters={showFilters}
        
        // Sort state
        sortColumn={filters.sortBy}
        sortDirection={filters.sortDirection}
        
        // Row actions
        rowActions={rowActions}
      />
      
      {/* Delete confirmation dialog */}
      {userToDelete && (
        <DeleteConfirmationDialog
          open={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleDeleteUser}
          title="Delete User"
          description={`Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`}
        />
      )}
    </>
  );
};

export default UserList;