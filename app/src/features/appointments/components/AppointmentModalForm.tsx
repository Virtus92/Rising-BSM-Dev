'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { ApiClient } from '@/core/api/ApiClient';
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
import { Calendar, Clock, User, Save, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export interface AppointmentModalFormProps {
  initialData?: Partial<AppointmentDto>;
  onSubmit: (data: CreateAppointmentDto | UpdateAppointmentDto) => Promise<any>;
  mode: 'create' | 'edit';
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  onCancel: () => void;
}

export const AppointmentModalForm: React.FC<AppointmentModalFormProps> = ({
  initialData,
  onSubmit,
  mode,
  isLoading = false,
  error,
  success,
  onCancel
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<CreateAppointmentDto | UpdateAppointmentDto>({
    title: initialData?.title || '',
    appointmentDate: initialData?.appointmentDate 
      ? (typeof initialData.appointmentDate === 'string' 
          ? initialData.appointmentDate.split('T')[0] 
          : format(new Date(initialData.appointmentDate), 'yyyy-MM-dd'))
      : format(new Date(), 'yyyy-MM-dd'),
    appointmentTime: initialData?.appointmentTime || format(new Date(), 'HH:mm'),
    duration: initialData?.duration || 60,
    location: initialData?.location || '',
    description: initialData?.description || '',
    status: initialData?.status || AppointmentStatus.PLANNED,
    customerId: initialData?.customerId,
    service: initialData?.service || ''
  });

  // Fetch available customers for the dropdown
  const [customers, setCustomers] = useState<{ id: number; name: string; email?: string; phone?: string }[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerLoadError, setCustomerLoadError] = useState<string | null>(null);
  
  // Function to load customers - Fixed API path
  const loadCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      setCustomerLoadError(null);
      
      console.log('Loading customers for appointment form...'); // Debug log
      
      // First try with ACTIVE status (uppercase)
      let response = await ApiClient.get('/api/customers', { 
      params: {
      limit: 100,
      sortBy: 'name',
      sortDirection: 'asc',
      status: 'ACTIVE'
      }
      });
    
    // If no results with ACTIVE, try without status filter
    if (response.success && response.data && 
        response.data.data && response.data.data.length === 0) {
      
      console.log('No customers found with ACTIVE status, trying without filter...');
      
      response = await ApiClient.get('/api/customers', { 
        params: {
          limit: 100,
          sortBy: 'name',
          sortDirection: 'asc'
        }
      });
    }
      
      console.log('Customer API response:', response); // Debug log
      
      if (response.success && response.data) {
        let customerData: any[] = [];
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          customerData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customerData = response.data.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          customerData = [response.data];
        }
        
        if (Array.isArray(customerData) && customerData.length > 0) {
          const formattedCustomers = customerData.map(customer => ({
            id: customer.id,
            name: customer.name || `Customer ${customer.id}`,
            email: customer.email,
            phone: customer.phone
          }));
          
          formattedCustomers.sort((a, b) => a.name.localeCompare(b.name));
          setCustomers(formattedCustomers);
          
          console.log(`Loaded ${formattedCustomers.length} customers:`, formattedCustomers); // Debug log
        } else {
          console.warn('No customer data found in response:', response.data);
          setCustomers([]);
          setCustomerLoadError('No customers available. Please create customers first.');
        }
      } else {
        setCustomers([]);
        setCustomerLoadError(`Failed to load customers: ${response.message || 'Unknown error'}`);
        console.error('Customer API error:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
      setCustomerLoadError('Failed to load customers. Please try again.');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

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
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.appointmentDate)) {
        errors.appointmentDate = 'Date must be in YYYY-MM-DD format';
      }
    }
    
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Time is required';
    } else {
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
    
    if (name === 'duration') {
      const numericValue = parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue
      }));
    } else {
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
    
    // Ensure duration is always a number
    if (typeof formData.duration === 'string') {
      const parsed = parseInt(formData.duration, 10);
      formData.duration = isNaN(parsed) ? 60 : parsed;
    }
    
    const processedFormData = {
      ...formData,
      appointmentDate: formData.appointmentDate ? formData.appointmentDate.trim() : '',
      appointmentTime: formData.appointmentTime ? formData.appointmentTime.trim() : '',
    };
    
    console.log('Submitting appointment form:', processedFormData);
    await onSubmit(processedFormData);
  };

  // Get customer name for display
  const getCustomerDisplayName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer ${customerId}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md text-sm border border-green-200">
          Appointment {mode === 'create' ? 'created' : 'updated'} successfully!
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              disabled={isLoading}
            />
            {validationErrors.title && (
              <p className="text-destructive text-sm">{validationErrors.title}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <div className="space-y-2">
              <Select
                value={formData.customerId?.toString() || 'no-customer'}
                onValueChange={(value) => handleSelectChange('customerId', value)}
                disabled={isLoadingCustomers || isLoading}
              >
                <SelectTrigger id="customerId">
                  <SelectValue placeholder={
                    isLoadingCustomers 
                      ? "Loading customers..." 
                      : formData.customerId 
                        ? getCustomerDisplayName(formData.customerId)
                        : "Select a customer"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-customer">No customer assigned</SelectItem>
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{customer.name}</span>
                          {customer.email && (
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    !isLoadingCustomers && (
                      <SelectItem value="no-customers" disabled>
                        No customers found
                      </SelectItem>
                    )
                  )}
                  {isLoadingCustomers && (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading customers...
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {/* Loading indicator */}
              {isLoadingCustomers && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading customers...
                </div>
              )}
              
              {/* Error state */}
              {customerLoadError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
                  <p className="font-medium">Failed to load customers</p>
                  <p className="mt-1">{customerLoadError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadCustomers}
                    className="mt-2"
                    disabled={isLoadingCustomers}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {/* Empty state with action */}
              {!isLoadingCustomers && !customerLoadError && customers.length === 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-3 rounded-md text-sm">
                  <p className="font-medium">No customers found</p>
                  <p className="mt-1">Create a customer first to link to this appointment.</p>
                  <a 
                    href="/dashboard/customers?create=true" 
                    target="_blank"
                    className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Create Customer
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
              
              {/* Show customer pre-selection info */}
              {formData.customerId && customers.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-2 rounded-md text-sm">
                  <p className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Pre-selected: {getCustomerDisplayName(formData.customerId)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="service">Service Type</Label>
            <Input
              id="service"
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              placeholder="Service type"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
              disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
          rows={3}
          disabled={isLoading}
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Create Appointment' : 'Update Appointment'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentModalForm;
