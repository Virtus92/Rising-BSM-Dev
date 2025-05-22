'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import AppointmentModalForm from '@/features/appointments/components/AppointmentModalForm';
import { EntityPageLayout } from '@/shared/components/EntityPageLayout';
import { FormModal, ConfirmationModal } from '@/shared/components/BaseModal';
import { useEntityModal } from '@/shared/hooks/useModal';
import { AppointmentClient } from '@/features/appointments/lib/clients';
import { AppointmentDto, AppointmentFilterParamsDto, CreateAppointmentDto, UpdateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function AppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.VIEW);
  const canCreateAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.CREATE);
  const canEditAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.UPDATE);
  const canDeleteAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.DELETE);
  
  // Use the entity modal hook
  const modal = useEntityModal<AppointmentDto>();

  // Create a stable appointment filter configuration
  const appointmentFilters = useCallback(() => ({
    sortBy: 'appointmentDate',
    sortDirection: 'asc' as 'asc' | 'desc',
  }), []);

  // Handle appointment form submission
  const handleAppointmentSubmit = useCallback(async (data: CreateAppointmentDto | UpdateAppointmentDto) => {
    modal.setError(null);
    modal.setSuccess(false);
    modal.setIsSubmitting(true);
    
    try {
      let response;
      
      if (modal.action?.type === 'create') {
        response = await AppointmentClient.createAppointment(data as CreateAppointmentDto);
      } else if (modal.action?.type === 'edit' && modal.action.item) {
        response = await AppointmentClient.updateAppointment(modal.action.item.id, data as UpdateAppointmentDto);
      }
      
      if (response?.success) {
        modal.setSuccess(true);
        modal.setError(null);
        
        // Show success toast
        toast({
          title: 'Success',
          description: `Appointment ${modal.action?.type === 'create' ? 'created' : 'updated'} successfully`,
          variant: 'success'
        });
        
        // Close modal after a delay
        setTimeout(() => {
          modal.closeModal();
          // Redirect to the appointment detail page for new appointments
          if (modal.action?.type === 'create' && response.data?.id) {
            router.push(`/dashboard/appointments/${response.data.id}`);
          }
        }, 1500);
        
        return response.data || null;
      } else {
        modal.setError(`Failed to ${modal.action?.type} appointment`);
        modal.setSuccess(false);
        return null;
      }
    } catch (err) {
      console.error(`Error ${modal.action?.type}ing appointment:`, err);
      modal.setError('An unexpected error occurred');
      modal.setSuccess(false);
      return null;
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast, router]);

  // Handle appointment deletion
  const handleAppointmentDelete = useCallback(async () => {
    if (!modal.action?.item) return;
    
    modal.setError(null);
    modal.setIsSubmitting(true);
    
    try {
      const response = await AppointmentClient.deleteAppointment(modal.action.item.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Appointment "${modal.action.item.title}" has been deleted`,
          variant: 'success'
        });
        
        modal.closeModal();
      } else {
        modal.setError('Failed to delete appointment');
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      modal.setError('An unexpected error occurred');
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast]);

  // Handle list actions
  const handleListAction = useCallback((action: string, appointment?: AppointmentDto) => {
    switch (action) {
      case 'create':
        modal.openCreateModal();
        break;
      case 'edit':
        if (appointment && canEditAppointments) {
          modal.openEditModal(appointment);
        }
        break;
      case 'view':
        if (appointment) {
          router.push(`/dashboard/appointments/${appointment.id}`);
        }
        break;
      case 'delete':
        if (appointment && canDeleteAppointments) {
          modal.openDeleteModal(appointment);
        }
        break;
    }
  }, [modal, canEditAppointments, canDeleteAppointments, router]);

  // Get modal title and description
  const getModalInfo = () => {
    switch (modal.action?.type) {
      case 'create':
        return {
          title: 'Create New Appointment',
          description: 'Schedule a new appointment'
        };
      case 'edit':
        return {
          title: 'Edit Appointment',
          description: `Update appointment: ${modal.action.item?.title}`
        };
      case 'delete':
        return {
          title: 'Delete Appointment',
          description: `Are you sure you want to delete "${modal.action.item?.title}"? This action cannot be undone.`
        };
      default:
        return {
          title: 'Appointment',
          description: ''
        };
    }
  };

  const modalInfo = getModalInfo();
  
  return (
    <EntityPageLayout
      canView={canViewAppointments}
      isPermissionLoading={permissionsLoading}
      noPermissionView={
        <NoPermissionView 
          title="Access Denied"
          message="You don't have permission to view appointments."
          permissionNeeded={API_PERMISSIONS.APPOINTMENTS.VIEW}
        />
      }
    >
      <AppointmentList 
        initialFilters={appointmentFilters()}
        onCreateClick={canCreateAppointments ? () => handleListAction('create') : undefined}
        showCreateButton={canCreateAppointments}
        onActionClick={handleListAction}
      />
      
      {/* Create/Edit Appointment Modal */}
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
          <AppointmentModalForm
            initialData={modal.action?.type === 'edit' ? modal.action.item : {}}
            onSubmit={handleAppointmentSubmit}
            mode={modal.action?.type === 'create' ? 'create' : 'edit'}
            isLoading={modal.isSubmitting}
            error={modal.error}
            success={modal.success}
            onCancel={modal.closeModal}
          />
        </FormModal>
      )}
      
      {/* Delete Appointment Modal */}
      {modal.action?.type === 'delete' && (
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modalInfo.title}
          message={modalInfo.description}
          variant="destructive"
          confirmLabel="Delete Appointment"
          onConfirm={handleAppointmentDelete}
          isConfirming={modal.isSubmitting}
          error={modal.error}
        />
      )}
    </EntityPageLayout>
  );
}
