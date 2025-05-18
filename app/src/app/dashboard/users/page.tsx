'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserList } from '@/features/users/components/UserList';
import { UserForm, UserFormData } from '@/features/users/components/UserForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { UserRole } from '@/domain/enums/UserEnums';
import { UserService } from '@/features/users/lib/services/UserService';
import { ModalController } from '@/shared/components/ModalController';
import { parseModalFromUrl, updateUrlWithoutNavigation, removeModalParamFromUrl } from '@/shared/utils/modal-controller';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function UsersPage() {
  // Get permission state
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewUsers = hasPermission(API_PERMISSIONS.USERS.VIEW);
  const canCreateUsers = hasPermission(API_PERMISSIONS.USERS.CREATE);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get and use the searchParams hook to track URL changes
  const searchParams = useSearchParams();
  
  // Direct handling of modal opening based on URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL parameters from the hook
      const openNewUserModalParam = searchParams?.get('openNewUserModal');
      const modalParam = searchParams?.get('modal');
      const sessionFlag = sessionStorage.getItem('openNewUserModal');
      
      // Check all possible sources that would trigger opening the modal
      const shouldOpenModal = openNewUserModalParam === 'true' || 
                             modalParam === 'new' ||
                             sessionFlag === 'true';
      
      if (shouldOpenModal) {
        setIsDialogOpen(true);
        // Clear the flag from sessionStorage if it exists
        sessionStorage.removeItem('openNewUserModal');
        
        // Update the URL to remove the query parameters without page reload
        const params = new URLSearchParams(window.location.search);
        let shouldUpdateUrl = false;
        
        if (params.has('openNewUserModal')) {
          params.delete('openNewUserModal');
          shouldUpdateUrl = true;
        }
        if (params.has('modal')) {
          params.delete('modal');
          shouldUpdateUrl = true;
        }
        
        if (shouldUpdateUrl) {
          const newUrl = window.location.pathname + 
                        (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [searchParams]);

  // Handle user creation
  const handleCreateUser = async (data: UserFormData) => {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      // Convert role to proper UserRole enum value
      // Also ensure required fields are present and proper types
      const updatedData = {
        ...data,
        role: data.role as UserRole, // Use the enum value directly
        password: data.password || '',  // Ensure password is always a string
        profilePictureId: data.profilePictureId !== undefined ? String(data.profilePictureId) : undefined, // Convert to string if exists
      };
      
      const response = await UserService.createUser(updatedData);
      
      if (response.success) {
        setSuccess(true);
        
        // Close dialog after a delay
        setTimeout(() => {
          setIsDialogOpen(false);
          // Reload the page to refresh the user list
          window.location.reload();
        }, 1500);
      } else {
        setError(response.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create user click
  const handleCreateClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Check if user has permission to view users */}
      {!permissionsLoading && !canViewUsers ? (
        <NoPermissionView 
          title="Access Denied"
          message="You don't have permission to view users."
          permissionNeeded={API_PERMISSIONS.USERS.VIEW}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <UserList 
            onCreateClick={canCreateUsers ? handleCreateClick : undefined}
            showCreateButton={canCreateUsers}
          />
        </div>
      )}
      
      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${isMobile ? 'sm:max-w-[100%] p-4' : 'sm:max-w-[600px]'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10 pb-4">
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          
          <UserForm
            onSubmit={handleCreateUser}
            initialData={{
              name: '',
              email: '',
              role: UserRole.USER,
              phone: ''
            }}
            isLoading={isSubmitting}
            error={error}
            success={success}
            title="Add New User"
            description="Create a new user account"
            submitLabel="Create User"
            showPassword={true}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
