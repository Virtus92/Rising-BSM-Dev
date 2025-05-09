'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar, RefreshCw, Plus, Check, X, Clock, PhoneCall, MessageSquare, Edit } from 'lucide-react';
import { useUpcomingAppointments } from '../hooks/useUpcomingAppointments';
import { Button } from '@/shared/components/ui/button';
import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { AppointmentClient } from '@/features/appointments/lib/clients/AppointmentClient';
import { Badge } from '@/shared/components/ui/badge';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';

export const UpcomingAppointments = () => {
  const router = useRouter();
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
          alert('Note added successfully');
        } else {
          alert(`Failed to add note: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error adding note:', error as Error);
        alert('Failed to add note. Please try again.');
      } finally {
        setIsActionLoading(null);
      }
    }
  };

  const handleUpdateStatus = async (appointmentId: number | string, status: AppointmentStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to mark this appointment as ${status.toLowerCase()}?`)) {
      setIsActionLoading(Number(appointmentId));
      try {
        const response = await AppointmentClient.updateAppointmentStatus(appointmentId, { status });
        if (response.success) {
          refreshAppointments();
        } else {
          alert(`Failed to update status: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error updating status:', error as Error);
        alert('Failed to update status. Please try again.');
      } finally {
        setIsActionLoading(null);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case AppointmentStatus.COMPLETED:
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      case AppointmentStatus.CANCELLED:
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case AppointmentStatus.RESCHEDULED:
        return <Badge className="bg-yellow-100 text-yellow-800">Rescheduled</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Planned</Badge>;
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
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 animate-pulse rounded"></div>
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
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <h4 className="text-red-800 text-sm font-medium mb-2">Error loading appointments</h4>
            <p className="text-red-700 text-xs mb-3">{error}</p>
            <p className="text-red-600 text-xs mb-2">The API endpoint might be unavailable or experiencing issues.</p>
          </div>
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mx-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading Data
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
            <Button variant="ghost" size="sm" onClick={handleRefresh} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <PermissionGuard permission={SystemPermission.APPOINTMENTS_CREATE}>
              <Button variant="ghost" size="sm" onClick={handleAddAppointment} title="Add Appointment">
                <Plus className="h-4 w-4" />
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent className="text-center py-6 px-4">
          <p className="text-muted-foreground mb-4">No upcoming appointments</p>
          <PermissionGuard 
            permission={SystemPermission.APPOINTMENTS_CREATE}
            fallback={<p className="text-xs text-muted-foreground">You don't have permission to create appointments</p>}
          >
            <Button onClick={handleAddAppointment} variant="outline" size="sm">
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
          <Button variant="ghost" size="sm" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <PermissionGuard permission={SystemPermission.APPOINTMENTS_CREATE}>
            <Button variant="ghost" size="sm" onClick={handleAddAppointment} title="Add Appointment">
              <Plus className="h-4 w-4" />
            </Button>
          </PermissionGuard>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id} 
              onClick={() => handleViewDetail(appointment.id)}
              className="hover:bg-muted/30 p-4 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-sm flex items-center gap-1">
                    {appointment.customerName || appointment.customerData?.name || 'Unnamed Customer'}
                    {getStatusBadge(appointment.status)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {appointment.title || appointment.service || 'Appointment'}
                  </p>
                </div>
                <div className="text-xs text-right">
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(appointment.appointmentDate)}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(appointment)}
                  </div>
                </div>
              </div>
              
              {/* Quick action buttons */}
              <div className="flex justify-end gap-1 mt-2">
                {isActionLoading === appointment.id ? (
                  <div className="text-xs italic text-muted-foreground">Processing...</div>
                ) : (
                  <TooltipProvider>
                    {appointment.status !== AppointmentStatus.COMPLETED && (
                      <PermissionGuard 
                        permission={SystemPermission.APPOINTMENTS_EDIT}
                        fallback={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block p-1">
                                <Check className="h-3 w-3 text-gray-300" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>You don't have permission to complete appointments</p>
                            </TooltipContent>
                          </Tooltip>
                        }
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="p-1 h-7"
                              onClick={(e) => handleUpdateStatus(appointment.id, AppointmentStatus.COMPLETED, e)}
                            >
                              <Check className="h-3 w-3 text-green-500" />
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
                        permission={SystemPermission.APPOINTMENTS_EDIT}
                        fallback={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block p-1">
                                <X className="h-3 w-3 text-gray-300" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>You don't have permission to cancel appointments</p>
                            </TooltipContent>
                          </Tooltip>
                        }
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="p-1 h-7"
                              onClick={(e) => handleUpdateStatus(appointment.id, AppointmentStatus.CANCELLED, e)}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel appointment</p>
                          </TooltipContent>
                        </Tooltip>
                      </PermissionGuard>
                    )}
                    
                    <PermissionGuard 
                      permission={SystemPermission.APPOINTMENTS_EDIT}
                      fallback={
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block p-1">
                              <MessageSquare className="h-3 w-3 text-gray-300" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>You don't have permission to add notes</p>
                          </TooltipContent>
                        </Tooltip>
                      }
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="p-1 h-7"
                            onClick={(e) => handleAddNote(appointment.id, e)}
                          >
                            <MessageSquare className="h-3 w-3 text-blue-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add note</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <PermissionGuard 
                      permission={SystemPermission.APPOINTMENTS_EDIT}
                      fallback={
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block p-1">
                              <Edit className="h-3 w-3 text-gray-300" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>You don't have permission to edit appointments</p>
                          </TooltipContent>
                        </Tooltip>
                      }
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="p-1 h-7"
                            onClick={(e) => handleEditAppointment(appointment.id, e)}
                          >
                            <Edit className="h-3 w-3 text-purple-500" />
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
                            className="p-1 h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${appointment.customerData?.phone}`;
                            }}
                          >
                            <PhoneCall className="h-3 w-3 text-green-600" />
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
        
        <div className="p-4 text-center">
          <Button variant="link" size="sm" onClick={handleViewAll}>
            View all appointments →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};