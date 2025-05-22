'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RequestList } from '@/features/requests/components/RequestList';
import  RequestForm  from '@/features/requests/components/RequestForm';
import { EntityPageLayout } from '@/shared/components/EntityPageLayout';
import { FormModal, ConfirmationModal } from '@/shared/components/BaseModal';
import { useEntityModal } from '@/shared/hooks/useModal';
import { RequestService } from '@/features/requests/lib/services/RequestService.client';
import { RequestDto, RequestFilterParamsDto, CreateRequestDto, UpdateRequestDto } from '@/domain/dtos/RequestDtos';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function RequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Define default filter parameters
  const defaultFilters: Partial<RequestFilterParamsDto> = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  };
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewRequests = hasPermission(API_PERMISSIONS.REQUESTS.VIEW);
  const canCreateRequests = hasPermission(API_PERMISSIONS.REQUESTS.CREATE);
  const canEditRequests = hasPermission(API_PERMISSIONS.REQUESTS.UPDATE);
  const canDeleteRequests = hasPermission(API_PERMISSIONS.REQUESTS.DELETE);
  
  // Use the entity modal hook
  const modal = useEntityModal<RequestDto>();

  // Handle request form submission
  const handleRequestSubmit = useCallback(async (data: CreateRequestDto | UpdateRequestDto) => {
    modal.setError(null);
    modal.setSuccess(false);
    modal.setIsSubmitting(true);
    
    try {
      let response;
      
      if (modal.action?.type === 'create') {
        response = await RequestService.createRequest(data as CreateRequestDto);
      } else if (modal.action?.type === 'edit' && modal.action.item) {
        response = await RequestService.updateRequest(modal.action.item.id, data as UpdateRequestDto);
      }
      
      if (response?.success) {
        modal.setSuccess(true);
        modal.setError(null);
        
        // Show success toast
        toast({
          title: 'Success',
          description: `Request ${modal.action?.type === 'create' ? 'created' : 'updated'} successfully`,
          variant: 'success'
        });
        
        // Close modal after a delay
        setTimeout(() => {
          modal.closeModal();
          // Redirect to the request detail page for new requests
          if (modal.action?.type === 'create' && response.data?.id) {
            router.push(`/dashboard/requests/${response.data.id}`);
          }
        }, 1500);
        
        return response.data || null;
      } else {
        modal.setError(response?.message || `Failed to ${modal.action?.type} request`);
        modal.setSuccess(false);
        return null;
      }
    } catch (err) {
      console.error(`Error ${modal.action?.type}ing request:`, err);
      modal.setError('An unexpected error occurred');
      modal.setSuccess(false);
      return null;
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast, router]);

  // Handle request deletion
  const handleRequestDelete = useCallback(async () => {
    if (!modal.action?.item) return;
    
    modal.setError(null);
    modal.setIsSubmitting(true);
    
    try {
      const response = await RequestService.deleteRequest(modal.action.item.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Request from ${modal.action.item.name} has been deleted`,
          variant: 'success'
        });
        
        modal.closeModal();
      } else {
        modal.setError(response.message || 'Failed to delete request');
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      modal.setError('An unexpected error occurred');
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast]);

  // Handle list actions
  const handleListAction = useCallback((action: string, request?: RequestDto) => {
    switch (action) {
      case 'create':
        if (canCreateRequests) {
          modal.openCreateModal();
        }
        break;
      case 'edit':
        if (request && canEditRequests) {
          modal.openEditModal(request);
        }
        break;
      case 'view':
        if (request) {
          router.push(`/dashboard/requests/${request.id}`);
        }
        break;
      case 'delete':
        if (request && canDeleteRequests) {
          modal.openDeleteModal(request);
        }
        break;
    }
  }, [modal, canCreateRequests, canEditRequests, canDeleteRequests, router]);

  // Get modal title and description
  const getModalInfo = () => {
    switch (modal.action?.type) {
      case 'create':
        return {
          title: 'Create New Request',
          description: 'Submit a new contact request'
        };
      case 'edit':
        return {
          title: 'Edit Request',
          description: `Update request from ${modal.action.item?.name}`
        };
      case 'delete':
        return {
          title: 'Delete Request',
          description: `Are you sure you want to delete the request from ${modal.action.item?.name}? This action cannot be undone.`
        };
      default:
        return {
          title: 'Request',
          description: ''
        };
    }
  };

  const modalInfo = getModalInfo();
  
  return (
    <EntityPageLayout
      canView={canViewRequests}
      isPermissionLoading={permissionsLoading}
      noPermissionView={
        <NoPermissionView 
          title="Access Denied"
          message="You don't have permission to view requests."
          permissionNeeded={API_PERMISSIONS.REQUESTS.VIEW}
        />
      }
    >
      <RequestList 
        initialFilters={defaultFilters}
        onCreateClick={canCreateRequests ? () => handleListAction('create') : undefined}
        showCreateButton={canCreateRequests}
        onActionClick={handleListAction}
      />
      
      {/* Create/Edit Request Modal */}
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
          <RequestForm
            initialData={modal.action?.type === 'edit' ? modal.action.item : {}}
            onSubmit={handleRequestSubmit}
            mode={modal.action?.type === 'create' ? 'create' : 'edit'}
            isLoading={modal.isSubmitting}
            error={modal.error}
            success={modal.success}
            title={modalInfo.title}
            description={modalInfo.description}
            submitLabel={modal.action?.type === 'create' ? 'Create Request' : 'Update Request'}
            onCancel={modal.closeModal}
          />
        </FormModal>
      )}
      
      {/* Delete Request Modal */}
      {modal.action?.type === 'delete' && (
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modalInfo.title}
          message={modalInfo.description}
          variant="destructive"
          confirmLabel="Delete Request"
          onConfirm={handleRequestDelete}
          isConfirming={modal.isSubmitting}
          error={modal.error}
        />
      )}
    </EntityPageLayout>
  );
}
