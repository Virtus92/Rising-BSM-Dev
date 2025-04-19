'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, AlertCircle, Edit, Trash2, Plus, Loader2, User, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/shared/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { formatDate } from '@/features/notifications/components/utils/date-utils';
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';
import { useToast } from '@/shared/hooks/useToast';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';
import { format } from 'date-fns';

interface CustomerAppointmentsTabProps {
  customerId: number;
}

/**
 * Component to display and manage appointments for a specific customer
 */
export const CustomerAppointmentsTab: React.FC<CustomerAppointmentsTabProps> = ({ customerId }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isAppointmentEditModalOpen, setIsAppointmentEditModalOpen] = useState(false);
  const [currentEditAppointment, setCurrentEditAppointment] = useState<number | null>(null);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    appointmentDate: format(new Date(), 'yyyy-MM-dd'),
    appointmentTime: format(new Date(), 'HH:mm'),
    duration: 60,
    location: '',
    description: '',
    status: AppointmentStatus.PLANNED,
  });
  const { toast } = useToast();
  const router = useRouter();

  // Fetch customer appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add a query parameter to filter by customerId
        const response = await AppointmentService.getAll({
          customerId: customerId,
          limit: 100 // Get a larger number to show all appointments
        });
        
        if (response.success && response.data) {
          setAppointments(Array.isArray(response.data.data) ? response.data.data : []);
        } else {
          setError('Failed to load appointments');
          console.error('Error fetching appointments:', response.message);
        }
      } catch (err) {
        setError('Failed to load appointments');
        console.error('Error fetching appointments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchAppointments();
    }
  }, [customerId]);

  // Handle appointment status change
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setChangingStatusId(id);
      
      // First try using updateStatus with more appropriate endpoint
      try {
        const response = await AppointmentService.updateStatus(id, newStatus);
        
        if (response.success) {
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
          return;
        }
      } catch (error) {
        console.warn('Error with updateStatus, falling back to update:', error);
        // Continue to fallback
      }
      
      // Fall back to regular update method if updateStatus fails
      const response = await AppointmentService.update(id, { status: newStatus });
      
      if (response.success) {
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
          description: response.message || 'Failed to update status',
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

  // Handle appointment deletion
  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await AppointmentService.delete(id);
      
      if (response.success) {
        // Remove deleted appointment from state
        setAppointments(appointments.filter(appointment => appointment.id !== id));
        
        toast({
          title: 'Appointment deleted',
          description: 'The appointment has been successfully deleted',
          variant: 'success'
        });
      } else {
        toast({
          title: 'Delete failed',
          description: response.message || 'Failed to delete appointment',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the appointment',
        variant: 'error'
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
    
    switch (status) {
      case AppointmentStatus.PLANNED:
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>Planned</span>;
      case AppointmentStatus.CONFIRMED:
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>Confirmed</span>;
      case AppointmentStatus.COMPLETED:
        return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`}>Completed</span>;
      case AppointmentStatus.CANCELLED:
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>Cancelled</span>;
      case AppointmentStatus.RESCHEDULED:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>Rescheduled</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mb-4">
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
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Error loading appointments
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-400">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try again
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
        <PermissionGuard permission={SystemPermission.APPOINTMENTS_CREATE}>
          <Button
            onClick={() => setIsAppointmentModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create new appointment
          </Button>
        </PermissionGuard>
      </div>
    );
  }

  // Sort appointments by date (most recent first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
  });

  // Form validation and submission
  const validateAppointmentForm = () => {
    const errors: Record<string, string> = {};
    
    if (!appointmentForm.title?.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!appointmentForm.appointmentDate) {
      errors.appointmentDate = 'Date is required';
    }
    
    if (!appointmentForm.appointmentTime) {
      errors.appointmentTime = 'Time is required';
    }
    
    if (!appointmentForm.duration) {
      errors.duration = 'Duration is required';
    } else if (appointmentForm.duration < 15) {
      errors.duration = 'Duration must be at least 15 minutes';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAppointmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'duration') {
      const numericValue = parseInt(value, 10);
      setAppointmentForm(prev => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue
      }));
    } else {
      setAppointmentForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setAppointmentForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleCreateAppointment = async () => {
    if (!validateAppointmentForm()) {
      return;
    }
    
    setIsCreatingAppointment(true);
    
    try {
      const formData = {
        ...appointmentForm,
        customerId: customerId
      };
      
      const response = await AppointmentService.create(formData);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Appointment created successfully',
          variant: 'success'
        });
        
        // Add the new appointment to the list
        setAppointments([response.data, ...appointments]);
        
        // Close the modal and reset form
        setIsAppointmentModalOpen(false);
        setAppointmentForm({
          title: '',
          appointmentDate: format(new Date(), 'yyyy-MM-dd'),
          appointmentTime: format(new Date(), 'HH:mm'),
          duration: 60,
          location: '',
          description: '',
          status: AppointmentStatus.PLANNED,
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create appointment',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the appointment',
        variant: 'error'
      });
    } finally {
      setIsCreatingAppointment(false);
    }
  };
  
  const handleEditAppointment = async () => {
    if (!validateAppointmentForm() || !currentEditAppointment) {
      return;
    }
    
    setIsEditingAppointment(true);
    
    try {
      // Format the date and time properly for the API
      const dateTime = `${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}`;
      
      const formData = {
        title: appointmentForm.title,
        appointmentDate: dateTime,
        duration: appointmentForm.duration,
        location: appointmentForm.location,
        description: appointmentForm.description,
        status: appointmentForm.status,
        customerId: customerId
      };
      
      const response = await AppointmentService.update(currentEditAppointment, formData);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Appointment updated successfully',
          variant: 'success'
        });
        
        // Update the appointment in the list
        setAppointments(appointments.map(appointment => 
          appointment.id === currentEditAppointment 
            ? response.data
            : appointment
        ));
        
        // Close the modal
        setIsAppointmentEditModalOpen(false);
        setCurrentEditAppointment(null);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update appointment',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating the appointment',
        variant: 'error'
      });
    } finally {
      setIsEditingAppointment(false);
    }
  };
  
  const handleOpenEditModal = (appointment: any) => {
    // Parse the appointment date and time
    const appointmentDate = new Date(appointment.appointmentDate);
    
    // Set the form data
    setAppointmentForm({
      title: appointment.title,
      appointmentDate: format(appointmentDate, 'yyyy-MM-dd'),
      appointmentTime: format(appointmentDate, 'HH:mm'),
      duration: appointment.duration || 60,
      location: appointment.location || '',
      description: appointment.description || '',
      status: appointment.status || AppointmentStatus.PLANNED,
    });
    
    // Set the current appointment ID
    setCurrentEditAppointment(appointment.id);
    
    // Open the edit modal
    setIsAppointmentEditModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Appointments ({appointments.length})
        </h2>
        <PermissionGuard permission={SystemPermission.APPOINTMENTS_CREATE}>
          <Button
            size="sm"
            onClick={() => setIsAppointmentModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </PermissionGuard>
      </div>
      
      {/* Appointment Creation Modal */}
      <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for this customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={appointmentForm.title}
                onChange={handleAppointmentInputChange}
                placeholder="Appointment title"
                disabled={isCreatingAppointment}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">
                  Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="appointmentDate"
                    name="appointmentDate"
                    type="date"
                    value={appointmentForm.appointmentDate}
                    onChange={handleAppointmentInputChange}
                    className="pl-10"
                    disabled={isCreatingAppointment}
                  />
                </div>
                {formErrors.appointmentDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.appointmentDate}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentTime">
                  Time <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="appointmentTime"
                    name="appointmentTime"
                    type="time"
                    value={appointmentForm.appointmentTime}
                    onChange={handleAppointmentInputChange}
                    className="pl-10"
                    disabled={isCreatingAppointment}
                  />
                </div>
                {formErrors.appointmentTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.appointmentTime}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration (minutes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={appointmentForm.duration}
                  onChange={handleAppointmentInputChange}
                  disabled={isCreatingAppointment}
                />
                {formErrors.duration && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={appointmentForm.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                  disabled={isCreatingAppointment}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AppointmentStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={appointmentForm.location}
                onChange={handleAppointmentInputChange}
                placeholder="Appointment location"
                disabled={isCreatingAppointment}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={appointmentForm.description}
                onChange={handleAppointmentInputChange}
                placeholder="Appointment details or notes"
                rows={3}
                disabled={isCreatingAppointment}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAppointmentModalOpen(false)}
              disabled={isCreatingAppointment}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppointment}
              disabled={isCreatingAppointment}
            >
              {isCreatingAppointment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Edit Modal */}
      <Dialog open={isAppointmentEditModalOpen} onOpenChange={setIsAppointmentEditModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update the details of this appointment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={appointmentForm.title}
                onChange={handleAppointmentInputChange}
                placeholder="Appointment title"
                disabled={isEditingAppointment}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">
                  Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="appointmentDate"
                    name="appointmentDate"
                    type="date"
                    value={appointmentForm.appointmentDate}
                    onChange={handleAppointmentInputChange}
                    className="pl-10"
                    disabled={isEditingAppointment}
                  />
                </div>
                {formErrors.appointmentDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.appointmentDate}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentTime">
                  Time <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="appointmentTime"
                    name="appointmentTime"
                    type="time"
                    value={appointmentForm.appointmentTime}
                    onChange={handleAppointmentInputChange}
                    className="pl-10"
                    disabled={isEditingAppointment}
                  />
                </div>
                {formErrors.appointmentTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.appointmentTime}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration (minutes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={appointmentForm.duration}
                  onChange={handleAppointmentInputChange}
                  disabled={isEditingAppointment}
                />
                {formErrors.duration && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={appointmentForm.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                  disabled={isEditingAppointment}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AppointmentStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={appointmentForm.location}
                onChange={handleAppointmentInputChange}
                placeholder="Appointment location"
                disabled={isEditingAppointment}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={appointmentForm.description}
                onChange={handleAppointmentInputChange}
                placeholder="Appointment details or notes"
                rows={3}
                disabled={isEditingAppointment}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAppointmentEditModalOpen(false);
                setCurrentEditAppointment(null);
              }}
              disabled={isEditingAppointment}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditAppointment}
              disabled={isEditingAppointment}
            >
              {isEditingAppointment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {sortedAppointments.map((appointment) => (
          <Card key={appointment.id} className="mb-4">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  <Link 
                    href={`/dashboard/appointments/${appointment.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {appointment.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {appointment.description && appointment.description.length > 60
                    ? `${appointment.description.substring(0, 60)}...`
                    : appointment.description}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {renderStatusBadge(appointment.status)}
                <PermissionGuard permission={SystemPermission.APPOINTMENTS_EDIT}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs mt-1"
                        disabled={changingStatusId === appointment.id}
                      >
                        {changingStatusId === appointment.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        )}
                        Change Status
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
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid gap-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {formatDate(new Date(appointment.appointmentDate))}
                  </span>
                  {appointment.duration && (
                    <>
                      <Clock className="h-4 w-4 ml-4 mr-2 text-gray-500" />
                      <span>{appointment.duration} minutes</span>
                    </>
                  )}
                </div>
                {appointment.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{appointment.location}</span>
                  </div>
                )}
                {appointment.processorName && (
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Assigned to: {appointment.processorName}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-2 items-center p-6">
              <div className="flex space-x-2">
                <PermissionGuard permission={SystemPermission.APPOINTMENTS_EDIT}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-gray-500"
                    onClick={() => handleOpenEditModal(appointment)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission={SystemPermission.APPOINTMENTS_DELETE}>
                  <AlertDialog open={deleteId === appointment.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => setDeleteId(appointment.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this appointment. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleDelete(appointment.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </PermissionGuard>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerAppointmentsTab;
