'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerList } from '@/features/customers/components/CustomerList';
import CustomerForm from '@/features/customers/components/CustomerForm';
import { EntityPageLayout } from '@/shared/components/EntityPageLayout';
import { FormModal, ConfirmationModal } from '@/shared/components/BaseModal';
import { useEntityModal } from '@/shared/hooks/useModal';
import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
import { CreateCustomerDto, CustomerResponseDto, UpdateCustomerDto, CustomerDto } from '@/domain/dtos/CustomerDtos';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewCustomers = hasPermission(API_PERMISSIONS.CUSTOMERS.VIEW);
  const canCreateCustomers = hasPermission(API_PERMISSIONS.CUSTOMERS.CREATE);
  const canEditCustomers = hasPermission(API_PERMISSIONS.CUSTOMERS.UPDATE);
  const canDeleteCustomers = hasPermission(API_PERMISSIONS.CUSTOMERS.DELETE);
  
  // Use the entity modal hook
  const modal = useEntityModal<CustomerDto>();

  // Handle customer form submission
  const handleCustomerSubmit = useCallback(async (data: CreateCustomerDto | UpdateCustomerDto) => {
    modal.setError(null);
    modal.setSuccess(false);
    modal.setIsSubmitting(true);
    
    try {
      let response;
      
      if (modal.action?.type === 'create') {
        // Format and validate the data before sending
        const formattedData: CreateCustomerDto = {
          ...data,
          // Ensure required name property is never undefined
          name: data.name || '',
          // Field mapping happens in the CustomerService, but we'll ensure it here too
          postalCode: data.zipCode || data.postalCode
        };
        
        response = await CustomerService.createCustomer(formattedData);
        
        if (response.success) {
          // Add customer note if there's one entered
          if (data.notes && response.data?.id) {
            try {
              // Add a delay to ensure the customer is properly created first
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const noteResponse = await CustomerService.addCustomerNote(
                response.data.id, 
                data.notes
              );
              
              if (noteResponse.success) {
                console.log('Note added successfully', noteResponse);
              } else {
                console.error('Failed to add note:', noteResponse.message);
              }
            } catch (noteError) {
              console.error('Error adding note:', noteError);
            }
          }
        }
      } else if (modal.action?.type === 'edit' && modal.action.item) {
        // Handle edit
        const updateData: UpdateCustomerDto = {
          ...data,
          name: data.name || '',
          postalCode: data.zipCode || data.postalCode
        };
        
        response = await CustomerService.updateCustomer(modal.action.item.id, updateData);
      }
      
      if (response?.success) {
        modal.setSuccess(true);
        modal.setError(null);
        
        // Show success toast
        toast({
          title: 'Success',
          description: `Customer ${modal.action?.type === 'create' ? 'created' : 'updated'} successfully`,
          variant: 'success'
        });
        
        // Close modal after a delay
        setTimeout(() => {
          modal.closeModal();
          // Redirect to the customer detail page for new customers
          if (modal.action?.type === 'create' && response.data?.id) {
            router.push(`/dashboard/customers/${response.data.id}`);
          }
        }, 1500);
        
        return response.data || null;
      } else {
        modal.setError(response?.message || `Failed to ${modal.action?.type} customer`);
        modal.setSuccess(false);
        return null;
      }
    } catch (err) {
      console.error(`Error ${modal.action?.type}ing customer:`, err);
      modal.setError('An unexpected error occurred');
      modal.setSuccess(false);
      return null;
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast, router]);

  // Handle customer deletion
  const handleCustomerDelete = useCallback(async () => {
    if (!modal.action?.item) return;
    
    modal.setError(null);
    modal.setIsSubmitting(true);
    
    try {
      const response = await CustomerService.deleteCustomer(modal.action.item.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Customer ${modal.action.item.name} has been deleted`,
          variant: 'success'
        });
        
        modal.closeModal();
      } else {
        modal.setError(response.message || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      modal.setError('An unexpected error occurred');
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast]);

  // Handle list actions
  const handleListAction = useCallback((action: string, customer?: CustomerDto) => {
    switch (action) {
      case 'create':
        modal.openCreateModal();
        break;
      case 'edit':
        if (customer && canEditCustomers) {
          modal.openEditModal(customer);
        }
        break;
      case 'view':
        if (customer) {
          router.push(`/dashboard/customers/${customer.id}`);
        }
        break;
      case 'delete':
        if (customer && canDeleteCustomers) {
          modal.openDeleteModal(customer);
        }
        break;
    }
  }, [modal, canEditCustomers, canDeleteCustomers, router]);

  // Get modal title and description
  const getModalInfo = () => {
    switch (modal.action?.type) {
      case 'create':
        return {
          title: 'Add New Customer',
          description: 'Enter the customer\'s information below'
        };
      case 'edit':
        return {
          title: 'Edit Customer',
          description: `Update information for ${modal.action.item?.name}`
        };
      case 'delete':
        return {
          title: 'Delete Customer',
          description: `Are you sure you want to delete ${modal.action.item?.name}? This action cannot be undone.`
        };
      default:
        return {
          title: 'Customer',
          description: ''
        };
    }
  };

  const modalInfo = getModalInfo();
  
  return (
    <EntityPageLayout
      canView={canViewCustomers}
      isPermissionLoading={permissionsLoading}
      noPermissionView={
        <NoPermissionView 
          title="Access Denied"
          message="You don't have permission to view customers."
          permissionNeeded={API_PERMISSIONS.CUSTOMERS.VIEW}
        />
      }
    >
      <CustomerList 
        onCreateClick={canCreateCustomers ? () => handleListAction('create') : undefined}
        showCreateButton={canCreateCustomers}
        onActionClick={handleListAction}
      />
      
      {/* Create/Edit Customer Modal */}
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
          showDefaultActions={false}
        >
          <CustomerForm
            initialData={modal.action?.type === 'edit' && modal.action.item ? {
              ...modal.action.item,
              // Ensure dates are strings for form compatibility
              createdAt: typeof modal.action.item.createdAt === 'string' 
                ? modal.action.item.createdAt 
                : modal.action.item.createdAt?.toISOString?.() || '',
              updatedAt: typeof modal.action.item.updatedAt === 'string' 
                ? modal.action.item.updatedAt 
                : modal.action.item.updatedAt?.toISOString?.() || '',
              // Convert notes string to undefined for form compatibility
              notes: undefined // Let the form handle notes separately
            } : {}}
            onSubmit={handleCustomerSubmit}
            mode={modal.action?.type === 'create' ? 'create' : 'edit'}
            isLoading={modal.isSubmitting}
            error={modal.error}
            success={modal.success}
            title={modalInfo.title}
            description={modalInfo.description}
            submitLabel={modal.action?.type === 'create' ? 'Create Customer' : 'Update Customer'}
            onCancel={modal.closeModal}
          />
        </FormModal>
      )}
      
      {/* Delete Customer Modal */}
      {modal.action?.type === 'delete' && (
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modalInfo.title}
          message={modalInfo.description}
          variant="destructive"
          confirmLabel="Delete Customer"
          onConfirm={handleCustomerDelete}
          isConfirming={modal.isSubmitting}
          error={modal.error}
        />
      )}
    </EntityPageLayout>
  );
}
