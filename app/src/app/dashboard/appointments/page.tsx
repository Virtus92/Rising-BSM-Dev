'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { AppointmentFormFields, AppointmentFormData } from '@/features/appointments/components/AppointmentFormFields';
import { EntityPageLayout } from '@/shared/components/EntityPageLayout';
import { FormModal, ConfirmationModal } from '@/shared/components/modals';
import { useEntityModal } from '@/shared/hooks/useModal';
import { AppointmentClient } from '@/features/appointments/lib/clients';
import { AppointmentDto, AppointmentFilterParamsDto, CreateAppointmentDto, UpdateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { format } from 'date-fns';
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

  // Form state
  const [formData, setFormData] = useState<AppointmentFormData>({
    title: '',
    appointmentDate: format(new Date(), 'yyyy-MM-dd'),
    appointmentTime: format(new Date(), 'HH:mm'),
    duration: 60,
    location: '',
    description: '',
    status: AppointmentStatus.PLANNED,
    customerId: undefined,
    service: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Create a stable appointment filter configuration
  const appointmentFilters = useCallback(() => ({
    sortBy: 'appointmentDate',
    sortDirection: 'asc' as 'asc' | 'desc',
  }), []);

  // Handle appointment form submission
  const handleAppointmentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Date is required';
    }
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Time is required';
    }
    if (!formData.duration || formData.duration < 15) {
      errors.duration = 'Duration must be at least 15 minutes';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    modal.setError(null);
    modal.setSuccess(false);
    modal.setIsSubmitting(true);
    
    try {
      let response;
      
      if (modal.action?.type === 'create') {
        response = await AppointmentClient.createAppointment(formData as CreateAppointmentDto);
      } else if (modal.action?.type === 'edit' && modal.action.item) {
        response = await AppointmentClient.updateAppointment(modal.action.item.id, formData as UpdateAppointmentDto);
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
  }, [modal, toast, router, formData]);

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
        setFormData({
          title: '',
          appointmentDate: format(new Date(), 'yyyy-MM-dd'),
          appointmentTime: format(new Date(), 'HH:mm'),
          duration: 60,
          location: '',
          description: '',
          status: AppointmentStatus.PLANNED,
          customerId: undefined,
          service: ''
        });
        setFormErrors({});
        modal.openCreateModal();
        break;
      case 'edit':
        if (appointment && canEditAppointments) {
          const appointmentDate = appointment.appointmentDate 
            ? (typeof appointment.appointmentDate === 'string' 
                ? appointment.appointmentDate.split('T')[0] 
                : format(new Date(appointment.appointmentDate), 'yyyy-MM-dd'))
            : format(new Date(), 'yyyy-MM-dd');
          const appointmentTime = appointment.appointmentTime || format(new Date(), 'HH:mm');
          
          setFormData({
            title: appointment.title || '',
            appointmentDate,
            appointmentTime,
            duration: appointment.duration || 60,
            location: appointment.location || '',
            description: appointment.description || '',
            status: appointment.status as AppointmentStatus || AppointmentStatus.PLANNED,
            customerId: appointment.customerId,
            service: appointment.service || ''
          });
          setFormErrors({});
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
          onSubmit={handleAppointmentSubmit}
          onCancel={modal.closeModal}
          submitLabel={modal.action?.type === 'create' ? 'Create Appointment' : 'Update Appointment'}
        >
          <AppointmentFormFields
            formData={formData}
            onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
            errors={formErrors}
            disabled={modal.isSubmitting}
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
