'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EntityColors, getStatusBadgeColor } from '@/shared/utils/entity-colors';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { BaseListComponent, ColumnDef, CardProps } from '@/shared/components/data/BaseListComponent';
import { BaseCard, BaseCardProps } from '@/shared/components/data/BaseCard';
import { useUsers } from '../hooks/useUsers';
import { UserFilterParamsDto, UserDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { EntityCreateModal, useEntityModal } from '@/shared/components/EntityCreateModal';
import { UserForm, UserFormData } from '@/features/users/components/UserForm';
import { UserService } from '@/features/users/lib/services/UserService';
import { useToast } from '@/shared/hooks/useToast';
import { 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User as UserIcon,
  Users as UsersIcon,
  Filter as FilterIcon,
  Plus,
  UserPlus
} from 'lucide-react';
import { getPaginationProps } from '@/shared/utils/list/baseListUtils';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';

// ----- Interfaces -----

export interface UserListProps {
  initialFilters?: Partial<UserFilterParamsDto>;
  onCreateClick?: () => void;
  showCreateButton?: boolean;
  onActionClick?: (action: string, user?: UserDto) => void;
  // Enhanced prop for external modal control
  externalModalState?: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
  };
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
      className={`border-l-4 ${EntityColors.users.border} transition-all duration-200 hover:shadow-md hover:border-l-8`}
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
            className={`flex-1 ${EntityColors.users.text} hover:bg-purple-50 dark:hover:bg-purple-950/10`}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onActionClick?.('edit', item)}
            disabled={isDeleted}
            className={`flex-1 ${EntityColors.users.text} hover:bg-purple-50 dark:hover:bg-purple-950/10`}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onActionClick?.('delete', item)}
            disabled={isDeleted || isCurrentUser}
            className="flex-1 hover:bg-red-600 dark:hover:bg-red-600"
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
 * Enhanced user list component with integrated modal support
 */
export const UserList: React.FC<UserListProps> = ({ 
  initialFilters = {}, 
  onCreateClick, 
  showCreateButton = true,
  onActionClick,
  externalModalState 
}) => {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canEditUsers = hasPermission(API_PERMISSIONS.USERS.UPDATE);
  const canDeleteUsers = hasPermission(API_PERMISSIONS.USERS.DELETE);
  const canCreateUsers = hasPermission(API_PERMISSIONS.USERS.CREATE);
  const router = useRouter();
  
  // Modal state management
  const { isOpen, openModal, closeModal } = useEntityModal();
  
  // Modal should be controlled externally if provided
  const modalIsOpen = externalModalState?.isOpen ?? isOpen;
  const handleModalClose = externalModalState?.onClose ?? closeModal;
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // List states
  const [showFilters, setShowFilters] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number, name: string } | null>(null);
  
  // Use the users hook
  const { 
    users, 
    isLoading, 
    error, 
    pagination, 
    activeFilters,
    filters,
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

  // Handle user creation
  const handleCreateUser = async (data: UserFormData) => {
    setFormError(null);
    setFormSuccess(false);
    setIsSubmitting(true);
    
    try {
      const updatedData = {
        ...data,
        role: data.role as UserRole,
        password: data.password || '',
        profilePictureId: data.profilePictureId !== undefined ? String(data.profilePictureId) : undefined,
      };
      
      const response = await UserService.createUser(updatedData);
      
      if (response.success && response.data) {
        setFormSuccess(true);
        
        toast({
          title: 'Success',
          description: 'User created successfully',
          variant: 'success'
        });
        
        // Call external success callback if provided
        if (externalModalState?.onSuccess) {
          externalModalState.onSuccess();
        }
        
        // Close modal after a delay
        setTimeout(() => {
          handleModalClose();
          refetch(); // Refresh the list
        }, 1500);
      } else {
        setFormError(response.error || response.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    const success = await deleteUser(userToDelete.id);
    if (success) {
      toast({
        title: 'Success',
        description: `User '${userToDelete.name}' deleted successfully`,
        variant: 'success'
      });
    }
    setUserToDelete(null);
  };
  
  // Handle card action clicks
  const handleCardAction = useCallback((action: string, user: EnhancedUser) => {
    if (onActionClick) {
      onActionClick(action, user as UserDto);
    } else {
      // Fallback to old behavior
      switch (action) {
        case 'view':
          router.push(`/dashboard/users/${user.id}`);
          break;
        case 'edit':
          router.push(`/dashboard/users/${user.id}/edit`);
          break;
        case 'delete':
          setUserToDelete({ id: Number(user.id), name: user.name });
          break;
      }
    }
  }, [onActionClick, router]);

  // Handle create click
  const handleCreateClick = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      openModal();
    }
  }, [onCreateClick, openModal]);

  // Handle modal close with cleanup
  const handleModalCloseWithCleanup = useCallback(() => {
    handleModalClose();
    setFormError(null);
    setFormSuccess(false);
  }, [handleModalClose]);

  // Define columns for the table view
  const columns: ColumnDef<EnhancedUser>[] = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: (user) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3 bg-purple-600 text-white">
            <AvatarFallback className="bg-purple-600 text-white">
              {getUserAvatar(user.name)}
            </AvatarFallback>
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
          className="shadow-sm"
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
          onClick={() => handleCardAction('view', user)}
          disabled={isDeleted}
          className="hover:bg-purple-50 dark:hover:bg-purple-950/10"
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          title="Edit User"
          onClick={() => handleCardAction('edit', user)}
          disabled={isDeleted || !canEditUsers}
          className="hover:bg-purple-50 dark:hover:bg-purple-950/10"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="destructive" 
          size="icon" 
          title="Delete User"
          onClick={() => handleCardAction('delete', user)}
          disabled={isDeleted || isCurrentUser || !canDeleteUsers}
          className="hover:bg-red-600 dark:hover:bg-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }, [handleCardAction, canEditUsers, canDeleteUsers]);
  
  // Enhanced filter panel with better styling and user-themed colors
  const filterPanel = (
    <div className="p-6 border rounded-lg mb-6 space-y-6 bg-white dark:bg-gray-800 shadow-sm border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <FilterIcon className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filter Users</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-purple-600" />
            Role
          </label>
          <select 
            className="w-full border rounded-md p-3 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
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
            <CheckCircle className="h-4 w-4 text-purple-600" />
            Status
          </label>
          <select 
            className="w-full border rounded-md p-3 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
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
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="outline" 
          className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/10"
          onClick={clearAllFilters}
        >
          Reset Filters
        </Button>
        
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          onClick={() => setShowFilters(false)}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <BaseListComponent<EnhancedUser>
        // Data props
        items={enhancedUsers}
        isLoading={isLoading}
        error={error || null}
        {...getPaginationProps(pagination)}
        
        // Configuration
        columns={columns}
        keyExtractor={(item) => item.id}
        cardComponent={UserCard as React.FC<CardProps<EnhancedUser>>}
        
        // UI elements
        title="Users"
        searchPlaceholder="Search users by name or email..."
        emptyStateMessage="No users found"
        createButtonLabel="Add New User"
        showCreateButton={showCreateButton && canCreateUsers}
        
        // Active filters
        activeFilters={activeFilters}
        
        // Actions
        onPageChange={setPage}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onCreateClick={canCreateUsers ? handleCreateClick : undefined}
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
        
        // Enhanced styling
        className="bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/10 dark:to-gray-900"
      />
      
      {/* Create User Modal - only show if not externally controlled */}
      {!externalModalState && (
        <EntityCreateModal
          isOpen={modalIsOpen}
          onClose={handleModalCloseWithCleanup}
          title="Add New User"
          description="Create a new user account with the required information"
          isSubmitting={isSubmitting}
          maxWidth="sm:max-w-[700px]"
        >
          <UserForm
            onSubmit={handleCreateUser}
            initialData={{
              name: '',
              email: '',
              role: UserRole.USER,
              phone: ''
            }}
            isLoading={isSubmitting}
            error={formError}
            success={formSuccess}
            title="Add New User"
            description="Create a new user account"
            submitLabel="Create User"
            showPassword={true}
            onCancel={handleModalCloseWithCleanup}
          />
        </EntityCreateModal>
      )}
      
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
