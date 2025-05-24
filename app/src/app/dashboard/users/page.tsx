'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserList } from '@/features/users/components/UserList';
import { UserFormFields, UserFormData } from '@/features/users/components/UserFormFields';
import { EntityPageLayout } from '@/shared/components/EntityPageLayout';
import { FormModal, ConfirmationModal } from '@/shared/components/modals';
import { useEntityModal } from '@/shared/hooks/useModal';
import { UserService } from '@/features/users/lib/services/UserService';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { UserDto } from '@/domain/dtos/UserDtos';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  // Get permission state
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewUsers = hasPermission(API_PERMISSIONS.USERS.VIEW);
  const canCreateUsers = hasPermission(API_PERMISSIONS.USERS.CREATE);
  const canEditUsers = hasPermission(API_PERMISSIONS.USERS.UPDATE);
  const canDeleteUsers = hasPermission(API_PERMISSIONS.USERS.DELETE);
  
  // Use the entity modal hook
  const modal = useEntityModal<UserDto>();

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    phone: '',
    profilePicture: '',
    profilePictureId: undefined
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Validate form fields
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Name validation
    if (!formData.name.trim()) {
      errors.push('Name is required.');
    } else if (formData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.push('Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address.');
    }
    
    // Password validation (only if required or provided)
    if (modal.action?.type === 'create' || formData.password) {
      if (!formData.password) {
        errors.push('Password is required.');
      } else {
        // Check password length
        if (formData.password.length < 8) {
          errors.push('Password must be at least 8 characters long.');
        }
        
        // Check for uppercase letter
        if (!/[A-Z]/.test(formData.password)) {
          errors.push('Password must contain at least one uppercase letter.');
        }
        
        // Check for lowercase letter
        if (!/[a-z]/.test(formData.password)) {
          errors.push('Password must contain at least one lowercase letter.');
        }
        
        // Check for number
        if (!/[0-9]/.test(formData.password)) {
          errors.push('Password must contain at least one number.');
        }
        
        // Check for special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
          errors.push('Password must contain at least one special character.');
        }
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.push('Passwords do not match.');
      }
    }
    
    return errors;
  };

  // Handle user form submission
  const handleUserSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors([]);
    modal.setError(null);
    modal.setSuccess(false);
    modal.setIsSubmitting(true);
    
    try {
      let response;
      
      if (modal.action?.type === 'create') {
        const { confirmPassword, ...cleanData } = formData;
        const updatedData = {
          ...cleanData,
          role: cleanData.role as UserRole,
          password: cleanData.password || '',
          profilePictureId: cleanData.profilePictureId !== undefined ? String(cleanData.profilePictureId) : undefined,
        };
        
        response = await UserService.createUser(updatedData);
      } else if (modal.action?.type === 'edit' && modal.action.item) {
        const { confirmPassword, password, ...cleanData } = formData;
        const updateData = {
          ...cleanData,
          role: cleanData.role as UserRole,
          profilePictureId: cleanData.profilePictureId !== undefined ? String(cleanData.profilePictureId) : undefined,
        };
        
        response = await UserService.updateUser(modal.action.item.id, updateData);
      }
      
      if (response?.success) {
        modal.setSuccess(true);
        modal.setError(null);
        
        // Show success toast
        toast({
          title: 'Success',
          description: `User ${modal.action?.type === 'create' ? 'created' : 'updated'} successfully`,
          variant: 'success'
        });
        
        // Close modal after a delay
        setTimeout(() => {
          modal.closeModal();
          // Redirect to the user detail page for new users
          if (modal.action?.type === 'create' && response.data?.id) {
            router.push(`/dashboard/users/${response.data.id}`);
          }
        }, 1500);
        
        return response.data || null;
      } else {
        modal.setError(response?.error || response?.message || `Failed to ${modal.action?.type} user`);
        modal.setSuccess(false);
        return null;
      }
    } catch (err) {
      console.error(`Error ${modal.action?.type}ing user:`, err);
      modal.setError('An unexpected error occurred');
      modal.setSuccess(false);
      return null;
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast, router, formData, validateForm]);

  // Handle user deletion
  const handleUserDelete = useCallback(async () => {
    if (!modal.action?.item) return;
    
    modal.setError(null);
    modal.setIsSubmitting(true);
    
    try {
      const response = await UserService.deleteUser(modal.action.item.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `User ${modal.action.item.name} has been deleted`,
          variant: 'success'
        });
        
        modal.closeModal();
      } else {
        modal.setError(response.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      modal.setError('An unexpected error occurred');
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast]);

  // Handle list actions
  const handleListAction = useCallback((action: string, user?: UserDto) => {
    switch (action) {
      case 'create':
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          phone: '',
          profilePicture: '',
          profilePictureId: undefined
        });
        setFormErrors([]);
        modal.openCreateModal();
        break;
      case 'edit':
        if (user && canEditUsers) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            confirmPassword: '',
            role: user.role as UserRole || UserRole.USER,
            status: user.status as UserStatus || UserStatus.ACTIVE,
            phone: user.phone || '',
            profilePicture: user.profilePicture || '',
            profilePictureId: user.profilePictureId ? Number(user.profilePictureId) : undefined
          });
          setFormErrors([]);
          modal.openEditModal(user);
        }
        break;
      case 'view':
        if (user) {
          router.push(`/dashboard/users/${user.id}`);
        }
        break;
      case 'delete':
        if (user && canDeleteUsers) {
          modal.openDeleteModal(user);
        }
        break;
    }
  }, [modal, canEditUsers, canDeleteUsers, router]);

  // Get modal title and description
  const getModalInfo = () => {
    switch (modal.action?.type) {
      case 'create':
        return {
          title: 'Add New User',
          description: 'Create a new user account with the required information'
        };
      case 'edit':
        return {
          title: 'Edit User',
          description: `Update information for ${modal.action.item?.name}`
        };
      case 'delete':
        return {
          title: 'Delete User',
          description: `Are you sure you want to delete ${modal.action.item?.name}? This action cannot be undone.`
        };
      default:
        return {
          title: 'User',
          description: ''
        };
    }
  };

  const modalInfo = getModalInfo();

  return (
    <EntityPageLayout
      canView={canViewUsers}
      isPermissionLoading={permissionsLoading}
      noPermissionView={
        <NoPermissionView 
          title="Access Denied"
          message="You don't have permission to view users."
          permissionNeeded={API_PERMISSIONS.USERS.VIEW}
        />
      }
    >
      <UserList 
        onCreateClick={canCreateUsers ? () => handleListAction('create') : undefined}
        showCreateButton={canCreateUsers}
        onActionClick={handleListAction}
      />
      
      {/* Create/Edit User Modal */}
      {(modal.action?.type === 'create' || modal.action?.type === 'edit') && (
        <FormModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modalInfo.title}
          description={modalInfo.description}
          isSubmitting={modal.isSubmitting}
          error={modal.error}
          success={modal.success}
          size="lg"
          onSubmit={handleUserSubmit}
          onCancel={modal.closeModal}
          submitLabel={modal.action?.type === 'create' ? 'Create User' : 'Update User'}
        >
          <UserFormFields
            formData={formData}
            onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
            showPassword={modal.action?.type === 'create'}
            showStatus={modal.action?.type === 'edit'}
            errors={formErrors}
            disabled={modal.isSubmitting}
          />
        </FormModal>
      )}
      
      {/* Delete User Modal */}
      {modal.action?.type === 'delete' && (
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modalInfo.title}
          message={modalInfo.description}
          variant="destructive"
          confirmLabel="Delete User"
          onConfirm={handleUserDelete}
          isConfirming={modal.isSubmitting}
          error={modal.error}
        />
      )}
    </EntityPageLayout>
  );
}
