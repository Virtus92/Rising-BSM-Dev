'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus, 
  Loader2, 
  User, 
  ChevronDown, 
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { formatDate } from '@/shared/utils/date-utils';
import { AppointmentService } from '@/features/appointments/lib/services';
import { AppointmentClient } from '@/features/appointments/lib/clients';
import { AppointmentResponseDto, CreateAppointmentDto, UpdateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { AppointmentModalForm } from '@/features/appointments/components/AppointmentModalForm';
import { FormModal, ConfirmationModal } from '@/shared/components/BaseModal';
import { useModal } from '@/shared/hooks/useModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/shared/components/ui/dropdown-menu';

interface CustomerAppointmentsTabProps {
  customerId: number;
}

/**
 * CustomerAppointmentsTab - Fixed modal rendering issue
 * Ensures modals are always rendered regardless of appointments state
 */
export const CustomerAppointmentsTab: React.FC<CustomerAppointmentsTabProps> = ({ customerId }) => {
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);
  const [appointmentService] = useState(() => new AppointmentService());
  
  // Separate modal states to avoid conflicts with parent component modals
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  
  // Use individual modal for better control
  const modal = useModal();
  
  const { toast } = useToast();
  const router = useRouter();
  
  // Get permissions
  const { hasPermission } = usePermissions();
  const canCreateAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.CREATE);
  const canEditAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.UPDATE);
  const canDeleteAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.DELETE);

  // Fetch customer appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await appointmentService.findByCriteria({
        customerId: customerId
      });
      
      if (Array.isArray(result)) {
        setAppointments(result);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error fetching appointments:', err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, appointmentService]);

  useEffect(() => {
    if (customerId) {
      fetchAppointments();
    }
  }, [customerId, fetchAppointments]);

  // Handle appointment form submission
  const handleAppointmentSubmit = useCallback(async (data: CreateAppointmentDto | UpdateAppointmentDto) => {
    setModalError(null);
    setModalSuccess(false);
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (modalMode === 'create') {
        const createData = { ...data, customerId } as CreateAppointmentDto;
        response = await AppointmentClient.createAppointment(createData);
      } else if (modalMode === 'edit' && selectedAppointment) {
        response = await AppointmentClient.updateAppointment(selectedAppointment.id, data as UpdateAppointmentDto);
      }
      
      if (response?.success) {
        setModalSuccess(true);
        setModalError(null);
        
        toast({
          title: 'Success',
          description: `Appointment ${modalMode === 'create' ? 'created' : 'updated'} successfully`,
          variant: 'success'
        });
        
        // Refresh the appointments list
        await fetchAppointments();
        
        // Close modal after a delay
        setTimeout(() => {
          closeModal();
          // Redirect to the appointment detail page for new appointments
          if (modalMode === 'create' && response.data?.id) {
            router.push(`/dashboard/appointments/${response.data.id}`);
          }
        }, 1500);
        
        return response.data || null;
      } else {
        setModalError(`Failed to ${modalMode} appointment`);
        setModalSuccess(false);
        return null;
      }
    } catch (err) {
      console.error(`Error ${modalMode}ing appointment:`, err);
      setModalError('An unexpected error occurred');
      setModalSuccess(false);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [modalMode, selectedAppointment, customerId, toast, router, fetchAppointments]);

  // Handle appointment deletion
  const handleAppointmentDelete = useCallback(async () => {
    if (!selectedAppointment) return;
    
    setModalError(null);
    setIsSubmitting(true);
    
    try {
      const response = await AppointmentClient.deleteAppointment(selectedAppointment.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Appointment "${selectedAppointment.title}" has been deleted`,
          variant: 'success'
        });
        
        // Refresh the appointments list
        await fetchAppointments();
        closeModal();
      } else {
        setModalError('Failed to delete appointment');
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setModalError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAppointment, toast, fetchAppointments]);

  // Open modal functions
  const openCreateModal = useCallback(() => {
    console.log('Opening create modal for customer:', customerId);
    setModalMode('create');
    setSelectedAppointment(null);
    setModalError(null);
    setModalSuccess(false);
    setIsSubmitting(false);
    modal.openModal();
  }, [modal, customerId]);

  const openEditModal = useCallback((appointment: AppointmentResponseDto) => {
    setModalMode('edit');
    setSelectedAppointment(appointment);
    setModalError(null);
    setModalSuccess(false);
    setIsSubmitting(false);
    modal.openModal();
  }, [modal]);

  const openDeleteModal = useCallback((appointment: AppointmentResponseDto) => {
    setModalMode('delete');
    setSelectedAppointment(appointment);
    setModalError(null);
    setModalSuccess(false);
    setIsSubmitting(false);
    modal.openModal();
  }, [modal]);

  // Close modal function
  const closeModal = useCallback(() => {
    modal.closeModal();
    setTimeout(() => {
      setModalMode(null);
      setSelectedAppointment(null);
      setModalError(null);
      setModalSuccess(false);
      setIsSubmitting(false);
    }, 150);
  }, [modal]);

  // Handle list actions
  const handleListAction = useCallback((action: string, appointment?: AppointmentResponseDto) => {
    console.log('Handle list action called:', action, 'for customer:', customerId);
    switch (action) {
      case 'create':
        openCreateModal();
        break;
      case 'edit':
        if (appointment && canEditAppointments) {
          openEditModal(appointment);
        }
        break;
      case 'view':
        if (appointment) {
          router.push(`/dashboard/appointments/${appointment.id}`);
        }
        break;
      case 'delete':
        if (appointment && canDeleteAppointments) {
          openDeleteModal(appointment);
        }
        break;
    }
  }, [openCreateModal, openEditModal, openDeleteModal, canEditAppointments, canDeleteAppointments, router, customerId]);

  // Handle appointment status change
  const handleStatusChange = async (id: number, newStatus: AppointmentStatus) => {
    try {
      setChangingStatusId(id);
      
      let response;
      try {
        response = await appointmentService.updateStatus(id, newStatus);
      } catch (error) {
        console.warn('Error with updateStatus, falling back to update:', error);
        response = await appointmentService.update(id, { status: newStatus });
      }
      
      if (response) {
        // Update local state
        setAppointments(appointments.map(appointment => 
          appointment.id === id 
            ? { ...appointment, status: newStatus } 
            : appointment
        ));
        
        toast({
          title: 'Status updated',
          description: `Appointment status changed to ${newStatus}`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'Update failed',
          description: 'Failed to update status',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: 'Update failed',
        description: 'An error occurred while updating the status',
        variant: 'error'
      });
    } finally {
      setChangingStatusId(null);
    }
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case AppointmentStatus.PLANNED:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Planned</Badge>;
      case AppointmentStatus.CONFIRMED:
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Confirmed</Badge>;
      case AppointmentStatus.COMPLETED:
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Completed</Badge>;
      case AppointmentStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case AppointmentStatus.RESCHEDULED:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get modal title and description
  const getModalInfo = () => {
    switch (modalMode) {
      case 'create':
        return {
          title: 'Create New Appointment',
          description: 'Schedule a new appointment for this customer'
        };
      case 'edit':
        return {
          title: 'Edit Appointment',
          description: `Update appointment: ${selectedAppointment?.title}`
        };
      case 'delete':
        return {
          title: 'Delete Appointment',
          description: `Are you sure you want to delete "${selectedAppointment?.title}"? This action cannot be undone.`
        };
      default:
        return {
          title: 'Appointment',
          description: ''
        };
    }
  };

  const modalInfo = getModalInfo();

  // Render content based on state - but always render modals at the end
  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Error loading appointments
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>{error}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAppointments}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/appointments')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View all appointments
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Empty state
    if (appointments.length === 0) {
      return (
        <div className="text-center py-10">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No appointments yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            This customer doesn't have any appointments scheduled. Create one to track your meetings.
          </p>
          <div className="flex justify-center space-x-3">
            <PermissionGuard permission={SystemPermission.APPOINTMENTS_CREATE}>
              <Button
                onClick={() => {
                  console.log('Empty state create button clicked for customer:', customerId);
                  handleListAction('create');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create appointment
              </Button>
            </PermissionGuard>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/appointments')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View all appointments
            </Button>
          </div>
        </div>
      );
    }

    // Sort appointments by date (most recent first)
    const sortedAppointments = [...appointments].sort((a, b) => {
      return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
    });

    // Appointments list
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">
              Appointments ({appointments.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage appointments for this customer
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAppointments}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <PermissionGuard permission={SystemPermission.APPOINTMENTS_CREATE}>
              <Button
                size="sm"
                onClick={() => {
                  console.log('Header create button clicked for customer:', customerId);
                  handleListAction('create');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </PermissionGuard>
          </div>
        </div>
        
        <div className="space-y-4">
          {sortedAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      <Link 
                        href={`/dashboard/appointments/${appointment.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {appointment.title}
                      </Link>
                    </CardTitle>
                    {appointment.description && (
                      <CardDescription className="mt-1">
                        {appointment.description.length > 80
                          ? `${appointment.description.substring(0, 80)}...`
                          : appointment.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {renderStatusBadge(appointment.status)}
                    <PermissionGuard permission={SystemPermission.APPOINTMENTS_EDIT}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3"
                            disabled={changingStatusId === appointment.id}
                          >
                            {changingStatusId === appointment.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <ChevronDown className="h-3 w-3 mr-1" />
                            )}
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {Object.values(AppointmentStatus).map((status) => (
                            <DropdownMenuItem
                              key={status}
                              disabled={appointment.status === status}
                              className={appointment.status === status ? 'bg-muted cursor-default' : ''}
                              onClick={() => appointment.status !== status && handleStatusChange(appointment.id, status)}
                            >
                              {appointment.status === status && (
                                <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                              )}
                              <span className={appointment.status === status ? 'font-medium ml-6' : ''}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </PermissionGuard>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="grid gap-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(new Date(appointment.appointmentDate))}</span>
                    {appointment.duration && (
                      <>
                        <Clock className="h-4 w-4 ml-4 mr-2" />
                        <span>{appointment.duration} minutes</span>
                      </>
                    )}
                  </div>
                  
                  {appointment.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-3 border-t">
                <div className="flex justify-end space-x-2 w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                  >
                    View Details
                  </Button>
                  <PermissionGuard permission={SystemPermission.APPOINTMENTS_EDIT}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleListAction('edit', appointment)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission={SystemPermission.APPOINTMENTS_DELETE}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleListAction('delete', appointment)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </PermissionGuard>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Render content */}
      {renderContent()}
      
      {/* ALWAYS render modals - regardless of appointment state */}
      {/* Create/Edit Appointment Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <FormModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          title={modalInfo.title}
          description={modalInfo.description}
          isSubmitting={isSubmitting}
          error={modalError}
          success={modalSuccess}
          size="lg"
          showDefaultActions={false}
        >
          <AppointmentModalForm
            initialData={modalMode === 'edit' ? selectedAppointment : { customerId }}
            onSubmit={handleAppointmentSubmit}
            mode={modalMode === 'create' ? 'create' : 'edit'}
            isLoading={isSubmitting}
            error={modalError}
            success={modalSuccess}
            onCancel={closeModal}
          />
        </FormModal>
      )}
      
      {/* Delete Appointment Modal */}
      {modalMode === 'delete' && (
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          title={modalInfo.title}
          message={modalInfo.description}
          variant="destructive"
          confirmLabel="Delete Appointment"
          onConfirm={handleAppointmentDelete}
          isConfirming={isSubmitting}
          error={modalError}
        />
      )}
    </>
  );
};

export default CustomerAppointmentsTab;
