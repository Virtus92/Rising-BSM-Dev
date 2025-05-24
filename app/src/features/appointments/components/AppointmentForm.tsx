'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Save, ArrowLeft, Loader2, User, Calendar, Clock, MapPin, FileText, AlertCircle, Timer } from 'lucide-react';
import { AppointmentResponseDto, CreateAppointmentDto, UpdateAppointmentDto, AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { useAppointmentForm } from '@/features/appointments/hooks/useAppointmentForm';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { EntityColors } from '@/shared/utils/entity-colors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { ApiClient } from '@/core/api/ApiClient';
import { format } from 'date-fns';

export interface AppointmentFormProps {
  initialData?: Partial<AppointmentDto>;
  onSubmit: (data: CreateAppointmentDto | UpdateAppointmentDto) => Promise<AppointmentResponseDto | null>;
  mode: 'create' | 'edit';
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

/**
 * Form component for creating and editing appointments
 */
export default function AppointmentForm({ 
  initialData = {}, 
  onSubmit, 
  mode, 
  isLoading = false,
  error = null,
  success = false,
  title = mode === 'create' ? 'Create New Appointment' : 'Edit Appointment',
  description,
  submitLabel = mode === 'create' ? 'Create Appointment' : 'Save Changes',
  onCancel
}: AppointmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Customer list state
  const [customers, setCustomers] = useState<{ id: number; name: string; email?: string; phone?: string }[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerLoadError, setCustomerLoadError] = useState<string | null>(null);

  const {
    title: appointmentTitle, setTitle,
    appointmentDate, setAppointmentDate,
    appointmentTime, setAppointmentTime,
    duration, setDuration,
    location, setLocation,
    description: appointmentDescription, setDescription,
    status, setStatus,
    customerId, setCustomerId,
    service, setService,
    errors: formErrors,
    submitting: formSubmitting,
    handleSubmit: formSubmit,
    updateField
  } = useAppointmentForm({
    initialData,
    onSubmit: async (data) => {
      try {
        const result = await onSubmit(data);
        if (result) {
          // Only navigate if we're not in a modal
          if (!onCancel) {
            // Navigate to detail page or list after saving
            if (mode === 'create') {
              router.push(`/dashboard/appointments/${result.id}`);
            } else {
              router.push(`/dashboard/appointments/${initialData.id}`);
            }
          }
          
          return result;
        }
        
        return null;
      } catch (error) {
        console.error('Form submission error:', error as Error);
        
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'error'
        });
        
        return null;
      }
    }
  });
  
  // Use provided loading/error states or fallback to form states
  const submitting = isLoading || formSubmitting;
  const errors = error ? { general: error, ...formErrors } : formErrors;
  
  // Only use the parent success prop for consistent state management
  const showSuccess = success;

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

  // Function to check if changes have been made
  const checkForChanges = useCallback(() => {
    const hasTitleChanged = appointmentTitle !== (initialData.title || '');
    const hasDateChanged = appointmentDate !== (initialData.appointmentDate 
      ? (typeof initialData.appointmentDate === 'string' 
          ? initialData.appointmentDate.split('T')[0] 
          : format(new Date(initialData.appointmentDate), 'yyyy-MM-dd'))
      : format(new Date(), 'yyyy-MM-dd'));
    const hasTimeChanged = appointmentTime !== (initialData.appointmentTime || format(new Date(), 'HH:mm'));
    const hasDurationChanged = duration !== (initialData.duration || 60);
    const hasLocationChanged = location !== (initialData.location || '');
    const hasDescriptionChanged = appointmentDescription !== (initialData.description || '');
    const hasStatusChanged = status !== (initialData.status || AppointmentStatus.PLANNED);
    const hasCustomerChanged = customerId !== (initialData.customerId);
    const hasServiceChanged = service !== (initialData.service || '');
    
    const changes = hasTitleChanged || hasDateChanged || hasTimeChanged || 
      hasDurationChanged || hasLocationChanged || hasDescriptionChanged || 
      hasStatusChanged || hasCustomerChanged || hasServiceChanged;
    
    setHasChanges(changes);
  }, [
    appointmentTitle, appointmentDate, appointmentTime, duration, location,
    appointmentDescription, status, customerId, service, initialData
  ]);

  // Call checkForChanges on every field change
  const handleFieldChange = (field: string, value: string | number | undefined) => {
    updateField(field, value);
    checkForChanges();
  };

  // Function to cancel and go back
  const handleCancel = () => {
    if (hasChanges && !onCancel) {
      setShowConfirmLeave(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        if (mode === 'edit' && initialData.id) {
          router.push(`/dashboard/appointments/${initialData.id}`);
        } else {
          router.push('/dashboard/appointments');
        }
      }
    }
  };

  return (
    <Card className="w-full border shadow-sm hover:shadow-md transition-all">
      <form onSubmit={(e) => { e.preventDefault(); formSubmit(); }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>

        <CardContent>
          {errors.general && (
            <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
              {errors.general}
            </div>
          )}
          
          {showSuccess && (
            <div className="bg-green-50 p-3 rounded-md text-green-800 text-sm mb-4">
              Operation completed successfully!
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:w-[400px] mb-4">
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
                  value={appointmentTitle}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Appointment title"
                  required
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
                    value={appointmentDate}
                    onChange={(e) => handleFieldChange('appointmentDate', e.target.value)}
                    required
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
                    value={appointmentTime}
                    onChange={(e) => handleFieldChange('appointmentTime', e.target.value)}
                    required
                    className={errors.appointmentTime ? "border-red-500" : ""}
                  />
                  {errors.appointmentTime && (
                    <p className="text-sm text-red-600">{errors.appointmentTime}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    value={duration}
                    onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 60)}
                    required
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
                    value={status} 
                    onValueChange={(value) => handleFieldChange('status', value)}
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
                  value={customerId?.toString() || 'no-customer'}
                  onValueChange={(value) => handleFieldChange('customerId', value === 'no-customer' ? undefined : parseInt(value))}
                  disabled={isLoadingCustomers || submitting}
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
                  value={service}
                  onChange={(e) => handleFieldChange('service', e.target.value)}
                  placeholder="Service type"
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
                  value={location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="Appointment location"
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
                  value={appointmentDescription}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Additional notes or details..."
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={submitting}
            className={EntityColors.appointments?.text || ""}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={submitting}
            className={EntityColors.appointments?.primary || "bg-purple-600 hover:bg-purple-700"}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
