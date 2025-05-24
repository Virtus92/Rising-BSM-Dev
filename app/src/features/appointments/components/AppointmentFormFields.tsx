'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { FileText, Calendar, Clock, Timer, AlertCircle, User, MapPin } from 'lucide-react';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { ApiClient } from '@/core/api/ApiClient';
import { format } from 'date-fns';

export interface AppointmentFormData {
  title: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  location?: string;
  description?: string;
  status?: AppointmentStatus;
  customerId?: number;
  service?: string;
}

export interface AppointmentFormFieldsProps {
  formData: AppointmentFormData;
  onChange: (data: Partial<AppointmentFormData>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

/**
 * Pure form fields component without any wrapper
 * For use in modals and other contexts where Card wrapper is not needed
 */
export const AppointmentFormFields: React.FC<AppointmentFormFieldsProps> = ({
  formData,
  onChange,
  errors = {},
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [customers, setCustomers] = useState<{ id: number; name: string; email?: string; phone?: string }[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerLoadError, setCustomerLoadError] = useState<string | null>(null);

  const handleFieldChange = (field: keyof AppointmentFormData, value: any) => {
    onChange({ [field]: value });
  };

  // Function to load customers
  const loadCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      setCustomerLoadError(null);
      
      const response = await ApiClient.get('/api/customers', { 
        params: {
          limit: 100,
          sortBy: 'name',
          sortDirection: 'asc',
          status: 'ACTIVE'
        }
      });
      
      if (response.success && response.data) {
        let customerData: any[] = [];
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          customerData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customerData = response.data.data;
        }
        
        if (customerData.length > 0) {
          const formattedCustomers = customerData.map(customer => ({
            id: customer.id,
            name: customer.name || `Customer ${customer.id}`,
            email: customer.email,
            phone: customer.phone
          }));
          
          formattedCustomers.sort((a, b) => a.name.localeCompare(b.name));
          setCustomers(formattedCustomers);
        } else {
          setCustomers([]);
          setCustomerLoadError('No customers available. Please create customers first.');
        }
      } else {
        setCustomers([]);
        setCustomerLoadError(`Failed to load customers: ${response.message || 'Unknown error'}`);
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

  return (
    <>
      {/* Display general error if any */}
      {errors.general && (
        <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
          {errors.general}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Appointment Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Appointment title"
              required
              disabled={disabled}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-600" />
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="appointmentDate"
                name="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleFieldChange('appointmentDate', e.target.value)}
                required
                disabled={disabled}
                className={errors.appointmentDate ? "border-red-500" : ""}
              />
              {errors.appointmentDate && (
                <p className="text-sm text-red-600">{errors.appointmentDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentTime" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-600" />
                Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="appointmentTime"
                name="appointmentTime"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => handleFieldChange('appointmentTime', e.target.value)}
                required
                disabled={disabled}
                className={errors.appointmentTime ? "border-red-500" : ""}
              />
              {errors.appointmentTime && (
                <p className="text-sm text-red-600">{errors.appointmentTime}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-purple-600" />
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 60)}
                required
                disabled={disabled}
                className={errors.duration ? "border-red-500" : ""}
              />
              {errors.duration && (
                <p className="text-sm text-red-600">{errors.duration}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-purple-600" />
                Status
              </Label>
              <Select 
                value={formData.status || AppointmentStatus.PLANNED} 
                onValueChange={(value) => handleFieldChange('status', value)}
                disabled={disabled}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AppointmentStatus.PLANNED}>Planned</SelectItem>
                  <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmed</SelectItem>
                  <SelectItem value={AppointmentStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={AppointmentStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={AppointmentStatus.CANCELLED}>Cancelled</SelectItem>
                  <SelectItem value={AppointmentStatus.NO_SHOW}>No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-purple-600" />
              Customer
            </Label>
            <Select
              value={formData.customerId?.toString() || 'no-customer'}
              onValueChange={(value) => handleFieldChange('customerId', value === 'no-customer' ? undefined : parseInt(value))}
              disabled={isLoadingCustomers || disabled}
            >
              <SelectTrigger id="customerId">
                <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select a customer"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-customer">No customer assigned</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{customer.name}</span>
                      {customer.email && (
                        <span className="text-xs text-muted-foreground">{customer.email}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customerLoadError && (
              <p className="text-sm text-amber-600">{customerLoadError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              Service
            </Label>
            <Input
              id="service"
              name="service"
              value={formData.service || ''}
              onChange={(e) => handleFieldChange('service', e.target.value)}
              placeholder="Service type"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-purple-600" />
              Location
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="Appointment location"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Additional notes or details..."
              disabled={disabled}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};
