'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateId, isValidId } from '@/shared/utils/validation-utils';
import { AppointmentClient } from '@/features/appointments/lib/clients';
import { CustomerClient } from '@/features/customers/lib/clients';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { Button } from '@/shared/components/ui/button';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import {
  getCustomerData,
  getStatusClassName,
  getStatusLabel,
  getFormattedDateTime
} from '../utils/appointmentUtils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card';
import {
  Calendar,
  MapPin,
  Clock,
  FileText,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { Separator } from '@/shared/components/ui/separator';
import { AppointmentDetailResponseDto } from '@/domain/dtos/AppointmentDtos';
import { format } from 'date-fns';

export const AppointmentDetail = ({ id }: { id: string | number }) => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [appointment, setAppointment] = useState<AppointmentDetailResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isMobile, setIsMobile] = useState(false);
  
  // Check permissions for actions
  const canEdit = hasPermission(SystemPermission.APPOINTMENTS_EDIT);
  const canDelete = hasPermission(SystemPermission.APPOINTMENTS_DELETE);
  
  // Track validated ID for consistency
  const [validatedId, setValidatedId] = useState<number | null>(null);
  
  // Detect mobile screen
  useLayoutEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Validate ID on component mount
  useEffect(() => {
    if (id) {
      const validId = validateId(id);
      setValidatedId(validId);
    }
  }, [id]);

  // Create a memoized fetch function to avoid recreation on each render
  const fetchAppointment = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we have a valid ID
        if (validatedId === null) {
          setError(`Invalid appointment ID: ${id}`);
          setIsLoading(false);
          return;
        }
        
        const response = await AppointmentClient.getById(validatedId);
        
        if (response.success && response.data) {
          // Ensure customer data is consistently formatted
          const appointmentData = response.data as AppointmentDetailResponseDto;
          
          // Make sure customer data is properly formatted using our helper function
          if (appointmentData.customerId && !getCustomerData(appointmentData)) {
            try {
              // Use CustomerClient to fetch customer data properly
              const customerResponse = await CustomerClient.getCustomerById(appointmentData.customerId);
              if (customerResponse.success && customerResponse.data) {
                appointmentData.customer = {
                  id: customerResponse.data.id,
                  name: customerResponse.data.name || `Customer ${customerResponse.data.id}`,
                  email: customerResponse.data.email,
                  phone: customerResponse.data.phone,
                };
              }
            } catch (customerError) {
              console.error('Error fetching customer data:', customerError);
              // Don't set an error, just add a fallback customer data
              if (appointmentData.customerId) {
                appointmentData.customer = {
                  id: appointmentData.customerId,
                  name: `Customer ${appointmentData.customerId}`,
                };
              }
            }
          }
          
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
  }, [validatedId, id]);

  // Use the memoized function in an effect
  useEffect(() => {
    if (validatedId !== null) {
      fetchAppointment();
    }
  }, [validatedId, fetchAppointment]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    try {
      // Check if we have a valid ID
      if (validatedId === null) {
        setError('Invalid appointment ID');
        return;
      }
      
      setIsSubmittingNote(true);
      const response = await AppointmentClient.addNote(validatedId, note);
      
      if (response.success) {
      // Set the updated appointment data from the response
      if (response.data && typeof response.data === 'object' && 'notes' in response.data) {
          // Complete appointment data with notes is returned
          setAppointment(response.data as AppointmentDetailResponseDto);
        } else {
          // Always refetch to ensure we have the latest data
          const updatedResponse = await AppointmentClient.getById(validatedId);
          if (updatedResponse.success && updatedResponse.data) {
            setAppointment(updatedResponse.data as AppointmentDetailResponseDto);
          }
        }
        setNote('');
      } else {
        setError(response.message || 'Failed to add note');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add note';
      setError(errorMessage);
      console.error('Error adding note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStatusChange = async (status: AppointmentStatus) => {
    try {
      // Check if we have a valid ID
      if (validatedId === null) {
        setError('Invalid appointment ID');
        return;
      }
      
      const response = await AppointmentClient.updateStatus(validatedId, { status });
      
      if (response.success && response.data) {
        // Check if the response includes complete appointment data
        if (typeof response.data === 'object' && 'notes' in response.data) {
          // Complete appointment data is returned
          setAppointment(response.data as AppointmentDetailResponseDto);
        } else {
          // Always refetch to ensure we have the latest data
          const updatedResponse = await AppointmentClient.getById(validatedId);
          if (updatedResponse.success && updatedResponse.data) {
            setAppointment(updatedResponse.data as AppointmentDetailResponseDto);
          } else {
            // Fallback: Update only the status in the UI if the API doesn't return full data
            setAppointment(prev => {
              if (!prev) return null;
              const updatedAppointment = { ...prev };
              updatedAppointment.status = status;
              updatedAppointment.statusLabel = getStatusLabel(status);
              updatedAppointment.statusClass = getStatusClassName(status);
              return updatedAppointment;
            });
            
            setError('Warning: Status updated but appointment data may be incomplete');
          }
        }
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
      console.error('Error updating appointment status:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    try {
      // Check if we have a valid ID
      if (validatedId === null) {
        setError('Invalid appointment ID');
        return;
      }
      
      setIsLoading(true);
      const response = await AppointmentClient.deleteAppointment(validatedId);
      
      if (response.success) {
        // Navigate back to the appointments list
        router.push('/dashboard/appointments');
      } else {
        setError(response.message || 'Failed to delete appointment');
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      setError(errorMessage);
      console.error('Error deleting appointment:', err);
      setIsLoading(false);
    }
  };
  
  // Using utility functions imported from appointmentUtils.ts for date formatting
  // and status class names instead of duplicating the logic here

  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center dark:bg-gray-800 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">Loading appointment details...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="min-h-[300px] dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 dark:text-red-400">{error}</div>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" onClick={() => router.back()} className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Card className="min-h-[300px] dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Appointment Not Found</CardTitle>
          <CardDescription className="dark:text-gray-400">The requested appointment could not be found</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="secondary" onClick={() => router.back()} className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`flex flex-col ${isMobile ? '' : 'sm:flex-row sm:justify-between sm:items-center'} gap-4`}>
        <Button variant="secondary" onClick={() => router.back()} className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments
        </Button>
        
        <div className="flex gap-2">
          {canEdit && (
            <Button 
              variant="outline" 
              onClick={() => router.push(`/dashboard/appointments/edit/${id}`)}
              className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="dark:bg-red-900 dark:hover:bg-red-800"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold dark:text-white">{appointment.title}</CardTitle>
              <CardDescription className="mt-2">
                <Badge className={getStatusClassName(appointment.status as AppointmentStatus)}>
                  {getStatusLabel(appointment.status as AppointmentStatus)}
                </Badge>
              </CardDescription>
            </div>
            <div className="space-x-2">
              {canEdit && (
                <>
                  {appointment.status !== AppointmentStatus.COMPLETED && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatusChange(AppointmentStatus.COMPLETED)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
                    </Button>
                  )}
                  {appointment.status !== AppointmentStatus.CANCELLED && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(AppointmentStatus.CANCELLED)}
                      className="dark:bg-red-900 dark:hover:bg-red-800"
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 dark:bg-gray-700">
              <TabsTrigger 
                value="details" 
                className="dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white dark:text-gray-300"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white dark:text-gray-300"
              >
                Notes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6`}>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium dark:text-gray-200">Date & Time</h3>
                      <p className="dark:text-gray-300">{getFormattedDateTime(appointment)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium dark:text-gray-200">Duration</h3>
                      <p className="dark:text-gray-300">{appointment.duration} minutes</p>
                    </div>
                  </div>
                  
                  {appointment.location && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium dark:text-gray-200">Location</h3>
                        <p className="dark:text-gray-300">{appointment.location}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <User className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium dark:text-gray-200">Customer</h3>
                      {(() => {
                        const customer = getCustomerData(appointment);
                        if (customer) {
                          return (
                            <>
                              <p className="dark:text-gray-300">{customer.name}</p>
                              {customer.email && <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>}
                              {customer.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>}
                            </>
                          );
                        } else if (appointment.customerId) {
                          return <p className="text-sm text-gray-500 dark:text-gray-400">Customer ID: {appointment.customerId} (details unavailable)</p>;
                        } else {
                          return <p className="text-sm text-gray-500 dark:text-gray-400">No customer assigned</p>;
                        }
                      })()}
                    </div>
                  </div>
                  
                  {appointment.service && (
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium dark:text-gray-200">Service</h3>
                        <p className="dark:text-gray-300">{appointment.service}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {appointment.description && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2 dark:text-gray-200">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{appointment.description}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes">
              <div className="space-y-6">
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
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Note
                    </Button>
                  </div>
                </div>
                
                <Separator className="dark:bg-gray-700" />
                
                <div>
                  <h3 className="font-medium mb-4 dark:text-gray-200">Notes History</h3>
                  {appointment.notes && appointment.notes.length > 0 ? (
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
                    <p className="text-gray-500 dark:text-gray-400">No notes for this appointment yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentDetail;
