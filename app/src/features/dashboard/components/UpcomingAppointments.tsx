'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { 
  Calendar, 
  RefreshCw, 
  Plus, 
  Check, 
  X,
  Clock, 
  PhoneCall, 
  MessageSquare, 
  Edit,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useUpcomingAppointments } from '../hooks/useUpcomingAppointments';
import { Button } from '@/shared/components/ui/button';
import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { AppointmentClient } from '@/features/appointments/lib/clients/AppointmentClient';
import { Badge } from '@/shared/components/ui/badge';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useToast } from '@/shared/hooks/useToast';

export const UpcomingAppointments = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { appointments, isLoading, error, refreshAppointments } = useUpcomingAppointments();
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);
  
  // Refresh appointments data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAppointments();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refreshAppointments]);
  
  const handleViewAll = () => {
    router.push('/dashboard/appointments');
  };
  
  const handleAddAppointment = () => {
    router.push('/dashboard/appointments/create');
  };
  
  const handleRefresh = () => {
    refreshAppointments();
  };

  const handleViewDetail = (appointmentId: number | string) => {
    router.push(`/dashboard/appointments/${appointmentId}`);
  };

  const handleEditAppointment = (appointmentId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/appointments/edit/${appointmentId}`);
  };

  const handleAddNote = async (appointmentId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simplified note adding - in a real application, you would show a dialog
    const note = prompt('Enter a note for this appointment:');
    if (note && note.trim()) {
      setIsActionLoading(Number(appointmentId));
      try {
        const response = await AppointmentClient.addAppointmentNote(appointmentId, note);
        if (response.success) {
          refreshAppointments();
          toast({
            title: 'Success',
            description: 'Note added successfully',
            variant: 'success'
          });
        } else {
          toast({
            title: 'Error',
            description: `Failed to add note: ${response.message || 'Unknown error'}`,
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error adding note:', error);
        toast({
          title: 'Error',
          description: 'Failed to add note. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsActionLoading(null);
      }
    }
  };

  const handleUpdateStatus = async (appointmentId: number | string, status: AppointmentStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const statusLabel = status === AppointmentStatus.COMPLETED ? 'completed' : 
                        status === AppointmentStatus.CANCELLED ? 'cancelled' : status.toLowerCase();
                        
    if (confirm(`Are you sure you want to mark this appointment as ${statusLabel}?`)) {
      setIsActionLoading(Number(appointmentId));
      try {
        const response = await AppointmentClient.updateAppointmentStatus(appointmentId, { status });
        if (response.success) {
          refreshAppointments();
          toast({
            title: 'Status updated',
            description: `Appointment marked as ${statusLabel}`,
            variant: 'success'
          });
        } else {
          toast({
            title: 'Error',
            description: `Failed to update status: ${response.message || 'Unknown error'}`,
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error updating status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update status. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsActionLoading(null);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Confirmed</Badge>;
      case AppointmentStatus.COMPLETED:
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Completed</Badge>;
      case AppointmentStatus.CANCELLED:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Cancelled</Badge>;
      case AppointmentStatus.RESCHEDULED:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">Rescheduled</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Planned</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (appointment: AppointmentDto) => {
    if (appointment.appointmentTime) {
      return appointment.appointmentTime;
    }
    if (appointment.appointmentDate) {
      const date = new Date(appointment.appointmentDate);
      return date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'N/A';
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check for authentication errors first
  if (error && (error.toLowerCase().includes('authentication') || error.toLowerCase().includes('login'))) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full flex items-center justify-center mb-4 mx-auto w-16 h-16">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h4 className="text-xl font-medium text-red-800 dark:text-red-300 mb-2">Authentication Required</h4>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Your session has expired or you need to log in again.</p>
            <Button 
              onClick={() => window.location.href = '/auth/login?returnUrl=/dashboard'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Log In Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state with detailed information and retry functionality
  if (error) {
    // Check if the error message indicates a permissions issue
    const isPermissionError = typeof error === 'string' && (
      error.toLowerCase().includes('permission') || 
      error.toLowerCase().includes('access denied') ||
      error.toLowerCase().includes('not authorized')
    );
    
    if (isPermissionError) {
      // Handle permission error more gracefully
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-amber-500 mb-2">Appointments not available for your role</p>
              <p className="text-muted-foreground text-sm">You don't have permission to view appointments data.</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Standard error display for non-permission errors
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h4 className="text-red-800 dark:text-red-300 font-medium">Error loading appointments</h4>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state when no appointments are available
  if (appointments.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            Upcoming Appointments
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="h-9 w-9 p-0 flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <PermissionGuard permission={API_PERMISSIONS.APPOINTMENTS.CREATE}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAddAppointment}
                className="h-9 w-9 p-0 flex items-center justify-center"
                title="Add Appointment"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full mb-3">
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No upcoming appointments</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            You don't have any appointments scheduled in the near future.
          </p>
          <PermissionGuard 
            permission={API_PERMISSIONS.APPOINTMENTS.CREATE}
            fallback={<Button variant="outline" onClick={handleViewAll}>View All Appointments</Button>}
          >
            <Button onClick={handleAddAppointment} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          </PermissionGuard>
        </CardContent>
      </Card>
    );
  }

  // Normal state with appointments data
  return (
    <Card className="h-full">
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-500" />
          Upcoming Appointments
        </CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="h-9 w-9 p-0 flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <PermissionGuard permission={API_PERMISSIONS.APPOINTMENTS.CREATE}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleAddAppointment}
              className="h-9 w-9 p-0 flex items-center justify-center"
              title="Add Appointment"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PermissionGuard>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id} 
              onClick={() => handleViewDetail(appointment.id)}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-4 cursor-pointer transition-colors"
            >
              {/* Appointment info */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-sm md:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    {appointment.customerName || appointment.customerData?.name || 'Unnamed Customer'}
                    {getStatusBadge(appointment.status)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {appointment.title || appointment.service || 'Appointment'}
                  </p>
                </div>
                <div className="text-xs text-right">
                  <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center justify-end gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    {formatDate(appointment.appointmentDate)}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {formatTime(appointment)}
                  </div>
                </div>
              </div>
              
              {/* Quick action buttons - larger and more user-friendly */}
              <div className="flex flex-wrap gap-2 mt-3">
                {isActionLoading === appointment.id ? (
                  <div className="w-full flex items-center justify-center py-2">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Processing...</span>
                  </div>
                ) : (
                  <TooltipProvider>
                    {appointment.status !== AppointmentStatus.COMPLETED && (
                      <PermissionGuard 
                        permission={API_PERMISSIONS.APPOINTMENTS.UPDATE}
                        fallback={null}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-3 border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700"
                              onClick={(e) => handleUpdateStatus(appointment.id, AppointmentStatus.COMPLETED, e)}
                            >
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400 mr-1.5" />
                              <span className="text-green-600 dark:text-green-400">Complete</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as completed</p>
                          </TooltipContent>
                        </Tooltip>
                      </PermissionGuard>
                    )}
                    
                    {appointment.status !== AppointmentStatus.CANCELLED && (
                      <PermissionGuard 
                        permission={API_PERMISSIONS.APPOINTMENTS.UPDATE}
                        fallback={null}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-3 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
                              onClick={(e) => handleUpdateStatus(appointment.id, AppointmentStatus.CANCELLED, e)}
                            >
                              <X className="h-4 w-4 text-red-600 dark:text-red-400 mr-1.5" />
                              <span className="text-red-600 dark:text-red-400">Cancel</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel appointment</p>
                          </TooltipContent>
                        </Tooltip>
                      </PermissionGuard>
                    )}
                    
                    <PermissionGuard 
                    permission={API_PERMISSIONS.APPOINTMENTS.UPDATE}
                    fallback={null}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-700"
                            onClick={(e) => handleAddNote(appointment.id, e)}
                          >
                            <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-1.5" />
                            <span className="text-amber-600 dark:text-amber-400">Note</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add note</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <div className="grow"></div> {/* Spacer */}
                    
                    <PermissionGuard 
                    permission={API_PERMISSIONS.APPOINTMENTS.UPDATE}
                    fallback={null}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-purple-200 hover:border-purple-300 dark:border-purple-800 dark:hover:border-purple-700"
                            onClick={(e) => handleEditAppointment(appointment.id, e)}
                          >
                            <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-1.5" />
                            <span className="text-purple-600 dark:text-purple-400">Edit</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit appointment</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    {appointment.customerData?.phone && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${appointment.customerData?.phone}`;
                            }}
                          >
                            <PhoneCall className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1.5" />
                            <span className="text-blue-600 dark:text-blue-400">Call</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Call customer</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 text-center border-t border-slate-200 dark:border-slate-700">
          <Button 
            variant="link"
            onClick={handleViewAll}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center mx-auto"
          >
            View all appointments
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;