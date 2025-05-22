'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateId } from '@/shared/utils/validation-utils';
import { AppointmentClient } from '@/features/appointments/lib/clients';
import { CustomerClient } from '@/features/customers/lib/clients';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { useToast } from '@/shared/hooks/useToast';
import { DetailPageLayout, createStatusBadge, getInitials } from '@/shared/components/DetailPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Separator } from '@/shared/components/ui/separator';
import {
  Calendar,
  MapPin,
  Clock,
  FileText,
  User,
  MessageSquare,
  Building,
  Phone,
  Mail,
  RefreshCw,
  Tag,
  Loader2
} from 'lucide-react';
import { AppointmentDetailResponseDto } from '@/domain/dtos/AppointmentDtos';
import { format } from 'date-fns';

// Status configuration for appointments
const appointmentStatusConfig = {
  [AppointmentStatus.PLANNED]: { color: 'bg-blue-500', label: 'Planned' },
  [AppointmentStatus.SCHEDULED]: { color: 'bg-blue-600', label: 'Scheduled' },
  [AppointmentStatus.CONFIRMED]: { color: 'bg-green-500', label: 'Confirmed' },
  [AppointmentStatus.IN_PROGRESS]: { color: 'bg-purple-500', label: 'In Progress' },
  [AppointmentStatus.COMPLETED]: { color: 'bg-emerald-500', label: 'Completed' },
  [AppointmentStatus.CANCELLED]: { color: 'bg-red-500', label: 'Cancelled' },
  [AppointmentStatus.RESCHEDULED]: { color: 'bg-amber-500', label: 'Rescheduled' },
  [AppointmentStatus.NO_SHOW]: { color: 'bg-orange-500', label: 'No Show' }
};

// Utility function to format date and time
const formatDateTime = (appointment: AppointmentDetailResponseDto) => {
  if (!appointment.appointmentDate) return 'No date set';
  
  const appointmentDate = new Date(appointment.appointmentDate);
  const formattedDate = format(appointmentDate, 'EEEE, MMMM do, yyyy');
  const formattedTime = appointment.appointmentTime || 'No time set';
  
  return `${formattedDate} at ${formattedTime}`;
};

export const AppointmentDetail = ({ id }: { id: string | number }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  // State
  const [appointment, setAppointment] = useState<AppointmentDetailResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Permissions
  const canEdit = hasPermission(SystemPermission.APPOINTMENTS_EDIT);
  const canDelete = hasPermission(SystemPermission.APPOINTMENTS_DELETE);
  
  // Validate ID
  const validId = useMemo(() => {
    if (id) {
      return validateId(String(id));
    }
    return null;
  }, [id]);

  // Fetch appointment data
  const fetchAppointment = useCallback(async () => {
    if (!validId) {
      setError('Invalid appointment ID');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching appointment with ID: ${validId}`);
      const response = await AppointmentClient.getAppointment(validId);
      
      if (response.success && response.data) {
        const appointmentData = { ...response.data };
        console.log('Raw appointment data:', appointmentData);
        
        // CRITICAL FIX: The API should now return customer data directly
        // But if it's missing, we'll fetch it as a fallback
        if (appointmentData.customerId && (!appointmentData.customerName || !appointmentData.customer)) {
          console.log(`Customer data missing, fetching for ID: ${appointmentData.customerId}`);
          try {
            const customerResponse = await CustomerClient.getCustomerById(appointmentData.customerId);
            
            if (customerResponse.success && customerResponse.data) {
              console.log('Successfully fetched customer data:', customerResponse.data);
              appointmentData.customer = customerResponse.data;
              appointmentData.customerName = customerResponse.data.name;
            } else {
              console.warn('Failed to fetch customer data:', customerResponse.message);
              // Create a minimal customer object as fallback
              appointmentData.customer = {
                id: appointmentData.customerId,
                name: `Customer ${appointmentData.customerId}`,
              };
              appointmentData.customerName = `Customer ${appointmentData.customerId}`;
            }
          } catch (customerError) {
            console.error('Error fetching customer data:', customerError);
            // Create a minimal customer object as fallback
            appointmentData.customer = {
              id: appointmentData.customerId,
              name: `Customer ${appointmentData.customerId}`,
            };
            appointmentData.customerName = `Customer ${appointmentData.customerId}`;
          }
        } else if (appointmentData.customer) {
          console.log('Customer data already present:', appointmentData.customer);
          // Ensure customerName is set if customer object exists
          if (!appointmentData.customerName && appointmentData.customer.name) {
            appointmentData.customerName = appointmentData.customer.name;
          }
        }
        
        console.log('Final appointment data with customer:', {
          id: appointmentData.id,
          title: appointmentData.title,
          customerId: appointmentData.customerId,
          customerName: appointmentData.customerName,
          hasCustomer: !!appointmentData.customer
        });
        
        setAppointment(appointmentData);
      } else {
        setError(response.message || 'Failed to fetch appointment details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching appointment:', err);
    } finally {
      setIsLoading(false);
    }
  }, [validId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // Handle status change
  const handleStatusChange = async (status: string) => {
    try {
      if (!validId) {
        setError('Invalid appointment ID');
        return;
      }
      
      setChangingStatus(true);
      
      const response = await AppointmentClient.updateAppointmentStatus(validId, { status: status as AppointmentStatus });
      
      if (response.success && response.data) {
        if (typeof response.data === 'object' && 'notes' in response.data) {
          setAppointment(response.data as AppointmentDetailResponseDto);
        } else {
          const updatedResponse = await AppointmentClient.getAppointment(validId);
          if (updatedResponse.success && updatedResponse.data) {
            setAppointment(updatedResponse.data as AppointmentDetailResponseDto);
          }
        }
        
        toast({
          title: 'Status updated',
          description: `Appointment status changed to ${status}`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'Update failed',
          description: response.message || 'Failed to update appointment status',
          variant: 'error'
        });
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update appointment status',
        variant: 'error'
      });
    } finally {
      setChangingStatus(false);
    }
  };

  // Handle note submission
  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    try {
      if (!validId) {
        setError('Invalid appointment ID');
        return;
      }
      
      setIsSubmittingNote(true);
      const response = await AppointmentClient.addNote(validId, note);
      
      if (response.success) {
        if (response.data && typeof response.data === 'object' && 'notes' in response.data) {
          setAppointment(response.data as AppointmentDetailResponseDto);
        } else {
          const updatedResponse = await AppointmentClient.getAppointment(validId);
          if (updatedResponse.success && updatedResponse.data) {
            setAppointment(updatedResponse.data as AppointmentDetailResponseDto);
          }
        }
        setNote('');
        
        toast({
          title: 'Note added',
          description: 'Your note has been added successfully',
          variant: 'success'
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to add note',
          variant: 'error'
        });
      }
    } catch (err) {
      console.error('Error adding note:', err);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'error'
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle delete
  const handleDeleteAppointment = async () => {
    try {
      if (!validId) {
        setError('Invalid appointment ID');
        return;
      }
      
      const response = await AppointmentClient.deleteAppointment(validId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Appointment has been deleted successfully',
          variant: 'success'
        });
        
        router.push('/dashboard/appointments');
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete appointment',
          variant: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete appointment',
        variant: 'error'
      });
    }
  };

  if (!appointment && !isLoading && !error) {
    return null;
  }

  // Prepare data for DetailPageLayout
  const statusBadge = appointment ? createStatusBadge(appointment.status, appointmentStatusConfig) : null;
  
  const profileInfo = appointment ? [
    {
      label: 'Date & Time',
      value: <span className="text-sm font-medium">{formatDateTime(appointment)}</span>,
      icon: Calendar,
      iconColor: 'text-blue-500'
    },
    {
      label: 'Duration',
      value: <span className="text-sm">{appointment.duration} minutes</span>,
      icon: Clock,
      iconColor: 'text-green-500'
    },
    {
      label: 'Location',
      value: appointment.location ? <span className="text-sm">{appointment.location}</span> : null,
      icon: MapPin,
      iconColor: 'text-purple-500',
      emptyText: 'Not specified'
    },
    {
      label: 'Customer',
      value: appointment.customer || appointment.customerName ? (
        <Link 
          href={`/dashboard/customers/${appointment.customerId}`} 
          className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
        >
          {appointment.customer?.name || appointment.customerName}
        </Link>
      ) : appointment.customerId ? (
        <Link 
          href={`/dashboard/customers/${appointment.customerId}`} 
          className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
        >
          Customer {appointment.customerId}
        </Link>
      ) : null,
      icon: User,
      iconColor: 'text-amber-500',
      emptyText: appointment?.customerId ? 'Customer information loading...' : 'No customer assigned'
    }
  ] : [];

  const statusOptions = Object.values(AppointmentStatus).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }));

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Appointment Details
              </CardTitle>
              <CardDescription>
                Complete information about this appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment?.description && (
                <div>
                  <h3 className="font-medium mb-2 dark:text-gray-200">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{appointment.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduling Details</h3>
                  
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm">{appointment && formatDateTime(appointment)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm">{appointment?.duration} minutes</p>
                    </div>
                  </div>
                  
                  {appointment?.location && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm">{appointment.location}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Information</h3>
                  
                  {appointment?.service && (
                    <div className="flex items-start">
                      <Building className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Service</p>
                        <p className="text-sm">{appointment.service}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-blue-500" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  {statusBadge}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {appointment && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {new Date(appointment.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm font-medium flex items-center">
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {new Date(appointment.updatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'customer',
      label: 'Customer',
      icon: User,
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-500" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointment?.customer || appointment?.customerName ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full flex items-center justify-center text-lg font-semibold">
                    {getInitials(appointment.customer?.name || appointment.customerName || 'Customer')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{appointment.customer?.name || appointment.customerName}</h3>
                    {appointment.customerId && (
                      <Link 
                        href={`/dashboard/customers/${appointment.customerId}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View customer details →
                      </Link>
                    )}
                  </div>
                </div>
                
                {appointment.customer && (appointment.customer.email || appointment.customer.phone) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    {appointment.customer.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <a 
                          href={`mailto:${appointment.customer.email}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {appointment.customer.email}
                        </a>
                      </div>
                    )}
                    
                    {appointment.customer.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <a 
                          href={`tel:${appointment.customer.phone}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {appointment.customer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : appointment?.customerId ? (
              <div className="py-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Customer Information Loading</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                  This appointment is linked to customer ID {appointment.customerId}, but customer details are still loading.
                </p>
                <Link 
                  href={`/dashboard/customers/${appointment.customerId}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  View customer details →
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Customer Assigned</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  This appointment doesn't have a customer assigned yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: MessageSquare,
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
              Notes
            </CardTitle>
            <CardDescription>
              Internal notes and comments for this appointment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add note form */}
            <div>
              <h3 className="font-medium mb-4 dark:text-gray-200">Add Note</h3>
              <div className="flex flex-col space-y-2">
                <Textarea
                  placeholder="Add a note about this appointment..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                />
                <Button 
                  className="self-end mt-2" 
                  onClick={handleAddNote}
                  disabled={!note.trim() || isSubmittingNote}
                >
                  {isSubmittingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </div>
            </div>
            
            <Separator className="dark:bg-gray-700" />
            
            {/* Notes history */}
            <div>
              <h3 className="font-medium mb-4 dark:text-gray-200">Notes History</h3>
              {appointment?.notes && appointment.notes.length > 0 ? (
                <div className="space-y-4">
                  {appointment.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md dark:border dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium dark:text-gray-200">{note.userName}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{note.formattedDate}</span>
                      </div>
                      <p className="whitespace-pre-line dark:text-gray-300">{note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Notes Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    No notes have been added to this appointment yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <DetailPageLayout
      title={appointment?.title || 'Appointment'}
      subtitle={appointment?.service}
      statusBadge={statusBadge}
      onBack={() => router.push('/dashboard/appointments')}
      editLink={canEdit ? `/dashboard/appointments/edit/${id}` : undefined}
      canEdit={canEdit}
      canDelete={canDelete}
      onDelete={handleDeleteAppointment}
      currentStatus={appointment?.status}
      statusOptions={statusOptions}
      onStatusChange={handleStatusChange}
      changingStatus={changingStatus}
      avatar={{
        initials: getInitials(appointment?.title, 'AP'),
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      }}
      profileInfo={profileInfo}
      tabs={tabs}
      defaultTab="overview"
      deleteTitle="Delete Appointment"
      deleteDescription={`Are you sure you want to delete "${appointment?.title}"? This action cannot be undone.`}
      showDeleteDialog={showDeleteDialog}
      setShowDeleteDialog={setShowDeleteDialog}
      isLoading={isLoading}
      error={error}
      maxWidth="7xl"
    />
  );
};

export default AppointmentDetail;