'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { validateId, isValidId } from '@/shared/utils/validation-utils';
import { AppointmentClient } from '@/features/appointments/lib/clients';
import { CustomerClient } from '@/features/customers/lib/clients';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { CreateAppointmentDto, UpdateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { Button } from '@/shared/components/ui/button';
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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Save } from 'lucide-react';
import { format } from 'date-fns';

type AppointmentFormProps = {
  appointmentId?: string | number;
  isEditMode?: boolean;
};

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  appointmentId,
  isEditMode = false
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Keep track of ID validation state for consistency
  const [validatedId, setValidatedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CreateAppointmentDto | UpdateAppointmentDto>({
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

  // Fetch available customers for the dropdown
  const [customers, setCustomers] = useState<{ id: number; name: string; email?: string; phone?: string }[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerLoadError, setCustomerLoadError] = useState<string | null>(null);
  
  // Function to load customers - separate for reusability
  const loadCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      setCustomerLoadError(null);
      
      // Use CustomerClient to fetch customers
      const response = await CustomerClient.getCustomers({ 
        limit: 100, // Get a reasonable number of customers
        sortBy: 'name',
        sortDirection: 'asc'
      });
      
      if (response.success && response.data) {
        // Process customer data
        let customerData: any[] = [];
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          // Direct array of customers
          customerData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Paginated response with data property
          if ('data' in response.data && Array.isArray(response.data.data)) {
            customerData = response.data.data;
          } else {
            // Treat the object itself as a single customer
            customerData = [response.data];
          }
        } else {
          customerData = [];
        }
        
        // Map customer data to a consistent format
        if (Array.isArray(customerData)) {
          const formattedCustomers = customerData.map(customer => ({
            id: customer.id,
            name: customer.name || `Customer ${customer.id}`,
            email: customer.email,
            phone: customer.phone
          }));
          
          // Sort by name for better usability
          formattedCustomers.sort((a, b) => a.name.localeCompare(b.name));
          setCustomers(formattedCustomers);
        } else {
          console.warn('CustomerClient returned unexpected data format');
          setCustomers([]);
          setCustomerLoadError('Failed to load customer data properly. Please refresh and try again.');
        }
      } else {
        console.warn('Failed to load customers:', response.message);
        setCustomers([]);
        setCustomerLoadError(`Failed to load customers: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error as Error);
      setCustomers([]);
      setCustomerLoadError('Failed to load customers. Please check your connection and try again.');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Fetch appointment data if in edit mode
  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (!isEditMode) return;
      
      // Skip validation and use the ID directly
      const numericId = Number(appointmentId);
      
      try {
        setIsLoading(true);
        const response = await AppointmentClient.getAppointmentById(numericId);
        
        if (response.success && response.data) {
          const { data } = response;
          
          // Format date from ISO string to YYYY-MM-DD
          let formattedDate = '';
          if (data.appointmentDate) {
            try {
              const dateObj = new Date(data.appointmentDate);
              formattedDate = format(dateObj, 'yyyy-MM-dd');
            } catch (error) {
              console.error('Error formatting date:', error as Error);
              formattedDate = data.appointmentDate as string;
            }
          }
          
          setFormData({
            title: data.title || '',
            appointmentDate: formattedDate,
            appointmentTime: data.appointmentTime || '09:00',
            duration: data.duration || 60,
            location: data.location || '',
            description: data.description || '',
            status: data.status || AppointmentStatus.PLANNED,
            customerId: data.customerId,
            service: data.service || ''
          });
        } else {
          setError(response.message || 'Failed to fetch appointment data');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching appointment data';
        setError(errorMessage);
        console.error('Error fetching appointment data:', error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentData();
  }, [isEditMode, appointmentId]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must not exceed 100 characters';
    }
    
    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Date is required';
    } else {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.appointmentDate)) {
        errors.appointmentDate = 'Date must be in YYYY-MM-DD format';
      }
    }
    
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Time is required';
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.appointmentTime)) {
        errors.appointmentTime = 'Time must be in HH:MM format';
      }
    }
    
    if (!formData.duration) {
      errors.duration = 'Duration is required';
    } else if (formData.duration < 15) {
      errors.duration = 'Duration must be at least 15 minutes';
    } else if (formData.duration > 480) {
      errors.duration = 'Duration cannot exceed 8 hours (480 minutes)';
    }
    
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }
    
    if (formData.location && formData.location.length > 200) {
      errors.location = 'Location cannot exceed 200 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields conversion
    if (name === 'duration') {
      // Convert to integer for duration
      const numericValue = parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue
      }));
    } else {
      // Normal string handling for other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'customerId' ? 
        (value && value !== 'no-customer' ? parseInt(value) : undefined) : 
        value
    }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Ensure duration is always a number
      if (typeof formData.duration === 'string') {
        const parsed = parseInt(formData.duration, 10);
        formData.duration = isNaN(parsed) ? 60 : parsed;
      }
      
      // Ensure date and time are properly formatted 
      const processedFormData = {
        ...formData,
        appointmentDate: formData.appointmentDate ? formData.appointmentDate.trim() : '',
        appointmentTime: formData.appointmentTime ? formData.appointmentTime.trim() : '',
      };
      
      // Log for verification
      console.log('Processed appointment data:', processedFormData, typeof processedFormData.duration);
      
      let response;
      
      if (isEditMode) {
        // Use the ID directly without validation for update
        const numericId = Number(appointmentId);
        response = await AppointmentClient.updateAppointment(numericId, processedFormData as UpdateAppointmentDto);
      } else {
        response = await AppointmentClient.createAppointment(processedFormData as CreateAppointmentDto);
      }
      
      if (response.success) {
        // Navigate back to appointments list or detail page
        if (isEditMode) {
          router.push(`/dashboard/appointments/${appointmentId}`);
        } else if (response.data && response.data.id) {
          // If we have the ID of the new appointment, go to its detail page
          router.push(`/dashboard/appointments/${response.data.id}`);
        } else {
          // Fallback to the appointments list
          router.push('/dashboard/appointments');
        }
      } else {
        setError(response.message || 'Failed to save appointment');
        
        // Handle validation errors from API
        if (response.errors && Object.keys(response.errors).length > 0) {
          // Convert errors to Record<string, string> format
          const formattedErrors: Record<string, string> = {};
          Object.entries(response.errors).forEach(([key, value]) => {
            formattedErrors[key] = Array.isArray(value) ? value.join(', ') : String(value);
          });
          setValidationErrors(formattedErrors);
        }
      }
    } catch (error) {
      setError('An error occurred while saving the appointment');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appointment data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Edit Appointment' : 'Create New Appointment'}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update the appointment details below' 
              : 'Fill in the details to schedule a new appointment'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Appointment title"
                    aria-invalid={Boolean(validationErrors.title)}
                  />
                  {validationErrors.title && (
                    <p className="text-destructive text-sm">{validationErrors.title}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer</Label>
                  <Select
                    value={formData.customerId?.toString() || 'no-customer'}
                    onValueChange={(value) => handleSelectChange('customerId', value)}
                    disabled={isLoadingCustomers}
                  >
                    <SelectTrigger id="customerId">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Make sure we have a non-empty string for the value */}
                      <SelectItem value="no-customer">No customer</SelectItem>
                      {customers.length > 0 ? (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          {isLoadingCustomers ? 'Loading customers...' : 'No customers available'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {customerLoadError && (
                    <p className="text-sm text-red-500">{customerLoadError}</p>
                  )}
                  {isLoadingCustomers && (
                    <p className="text-sm text-gray-500">Loading customers...</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service">Service Type</Label>
                  <Input
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    placeholder="Service type"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
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
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        value={formData.appointmentDate}
                        onChange={handleInputChange}
                        className="pl-10"
                        aria-invalid={Boolean(validationErrors.appointmentDate)}
                      />
                    </div>
                    {validationErrors.appointmentDate && (
                      <p className="text-destructive text-sm">{validationErrors.appointmentDate}</p>
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
                        value={formData.appointmentTime}
                        onChange={handleInputChange}
                        className="pl-10"
                        aria-invalid={Boolean(validationErrors.appointmentTime)}
                      />
                    </div>
                    {validationErrors.appointmentTime && (
                      <p className="text-destructive text-sm">{validationErrors.appointmentTime}</p>
                    )}
                  </div>
                </div>
                
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
                    value={formData.duration}
                    onChange={handleInputChange}
                    aria-invalid={Boolean(validationErrors.duration)}
                  />
                  {validationErrors.duration && (
                    <p className="text-destructive text-sm">{validationErrors.duration}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                    placeholder="Appointment location"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Appointment details or notes"
                rows={4}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Appointment' : 'Create Appointment'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AppointmentForm;
