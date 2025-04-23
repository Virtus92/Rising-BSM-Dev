'use client';

import { useState, useCallback, useEffect } from 'react';
import { UserService } from '@/infrastructure/clients/UserService';
import { UserDto, UserFilterParamsDto, UserResponseDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { useToast } from '@/shared/hooks/useToast';
import { 
  createBaseListUtility, 
  createActiveFilters, 
  hasActiveFilters 
} from '@/shared/utils/list/baseListUtils';

/**
 * Enhanced interface for user list operations
 */
export interface UseUsersResult {
  // Data
  users: UserResponseDto[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: UserFilterParamsDto;
  
  // Core list actions
  updateFilters: (newFilters: Partial<UserFilterParamsDto>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  clearFilter: <K extends keyof UserFilterParamsDto>(key: K) => void;
  clearAllFilters: () => void;
  refetch: () => Promise<void>;
  
  // User-specific operations
  deleteUser: (id: number) => Promise<boolean>;
  setRoleFilter: (role?: UserRole) => void;
  setStatusFilter: (status?: UserStatus) => void;
  currentUserId: number | null;
  
  // UI helpers
  activeFilters: Array<{
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  hasFilters: boolean;
}

/**
 * Map sort field to database column
 */
function mapSortField(field: string): string {
  const fieldMap: Record<string, string> = {
    'name': 'name',
    'email': 'email',
    'role': 'role',
    'status': 'status',
    'createdAt': 'createdAt',
    'updatedAt': 'updatedAt'
  };
  
  return fieldMap[field] || 'name';
}

/**
 * Hook for managing users with the new baseList architecture
 */
export function useUsers(initialFilters?: Partial<UserFilterParamsDto>): UseUsersResult {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Fetch current user ID once
  useEffect(() => {
    let mounted = true;
    
    const fetchCurrentUser = async () => {
      try {
        const response = await UserService.getCurrentUser();
        if (mounted && response.success && response.data) {
          setCurrentUserId(response.data.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);
  
  // Create base list utility
  const baseList = createBaseListUtility<UserResponseDto, UserFilterParamsDto>({
    // Service function that fetches data
    fetchFunction: UserService.getUsers,
    
    // Initial filters with defaults
    initialFilters: {
      sortBy: 'name',
      sortDirection: 'asc',
      ...initialFilters
    },
    
    // Sort field mapping
    mapSortField,
    
    // Configuration - using string type instead of keyof to fix type error
    defaultSortField: 'name' as string,
    defaultSortDirection: 'asc',
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit'],
      // Fix: Use a Partial Record type to allow specifying only some enum fields
      enum: {
        role: Object.values(UserRole),
        status: Object.values(UserStatus)
      } as Partial<Record<keyof UserFilterParamsDto, any[]>>
    }
  });
  
  // Delete user function with improved error handling
  const deleteUser = async (userId: number) => {
    try {
      // Validate inputs
      if (!userId || userId <= 0) {
        toast({
          title: "Invalid request",
          description: "Invalid user ID provided",
          variant: "destructive"
        });
        return false;
      }
      
      // Check if trying to delete current user
      if (userId === currentUserId) {
        toast({
          title: "Cannot delete your own account",
          description: "You cannot delete your currently logged in account.",
          variant: "destructive"
        });
        return false;
      }
      
      // Call the delete API
      const response = await UserService.deleteUser(userId);
      
      if (response.success) {
        toast({
          title: "User deleted",
          description: "The user has been successfully deleted.",
          variant: "success"
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        // Check for permission errors
        if (response.statusCode === 403 || 
            (response.message && response.message.toLowerCase().includes('permission'))) {
          toast({
            title: "Permission denied",
            description: "You do not have permission to delete this user.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Delete failed",
            description: response.message || 'Failed to delete user',
            variant: "destructive"
          });
        }
        
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      console.error('Error deleting user:', err);
      
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Convenience methods for user-specific filters
  const setRoleFilter = useCallback((role?: UserRole) => {
    baseList.setFilter('role', role);
  }, [baseList]);
  
  const setStatusFilter = useCallback((status?: UserStatus) => {
    baseList.setFilter('status', status);
  }, [baseList]);
  
  // Generate active filters for UI display
  const activeFilters = createActiveFilters(
    baseList.filters,
    [
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'search', label: 'Search' }
    ],
    baseList.clearFilter
  );
  
  // Check if there are any active filters
  const hasFilters = hasActiveFilters(baseList.filters);
  
  return {
    // Data
    users: baseList.data,
    isLoading: baseList.isLoading,
    error: baseList.error,
    pagination: baseList.pagination,
    filters: baseList.filters,
    
    // Core list actions
    updateFilters: baseList.updateFilters,
    setPage: baseList.setPage,
    setLimit: baseList.setLimit,
    setSort: baseList.setSort,
    setSearch: baseList.setSearch,
    clearFilter: baseList.clearFilter,
    clearAllFilters: baseList.clearAllFilters,
    refetch: baseList.refetch,
    
    // User-specific operations
    deleteUser,
    setRoleFilter,
    setStatusFilter,
    currentUserId,
    
    // UI helpers
    activeFilters,
    hasFilters
  };
}
