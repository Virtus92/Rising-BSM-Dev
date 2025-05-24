'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Save, ArrowLeft, Loader2, User, Mail, Phone, Building, FileText, MapPin, Globe, Tag, AlertCircle, Mail as Newsletter } from 'lucide-react';
import { CustomerResponseDto, CreateCustomerDto, UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { useCustomerForm } from '@/features/customers/hooks/useCustomerForm';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { EntityColors } from '@/shared/utils/entity-colors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';

export interface CustomerFormProps {
  initialData?: Partial<CustomerResponseDto>;
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => Promise<CustomerResponseDto | null>;
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
 * Form component for creating and editing customers
 */
export default function CustomerForm({ 
  initialData = {}, 
  onSubmit, 
  mode, 
  isLoading = false,
  error = null,
  success = false,
  title = mode === 'create' ? 'Create New Customer' : 'Edit Customer',
  description,
  submitLabel = mode === 'create' ? 'Create Customer' : 'Save Changes',
  onCancel 
}: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Log initialData for debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CustomerForm initialData:', {
        vatNumber: initialData.vatNumber,
        type: initialData.type,
        newsletter: initialData.newsletter,
      });
    }
  }, [initialData]);

  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    address, setAddress,
    city, setCity,
    postalCode, setPostalCode,
    country, setCountry,
    company, setCompany,
    vatNumber, setVatNumber,
    customerType, setCustomerType,
    status, setStatus,
    newsletter, setNewsletter,
    errors: formErrors,
    submitting: formSubmitting,
    handleSubmit: formSubmit,
    updateField
  } = useCustomerForm({
    initialData,
    onSubmit: async (data) => {
      try {
        // Log the data being submitted for debugging purposes
        if (process.env.NODE_ENV === 'development') {
          console.log('Submitting customer data:', {
            ...data,
            // Highlight the fields we're focusing on
            vatNumber: data.vatNumber,
            type: data.type,
            newsletter: data.newsletter
          });
        }
        
        const result = await onSubmit(data);
        if (result) {
          // Only navigate if we're not in a modal
          if (!onCancel) {
            // Navigate to detail page or list after saving
            if (mode === 'create') {
              router.push(`/dashboard/customers/${result.id}`);
            } else {
              router.push(`/dashboard/customers/${initialData.id}`);
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

  // Function to check if changes have been made
  const checkForChanges = useCallback(() => {
    const hasNameChanged = name !== (initialData.name || '');
    const hasEmailChanged = email !== (initialData.email || '');
    const hasPhoneChanged = phone !== (initialData.phone || '');
    const hasAddressChanged = address !== (initialData.address || '');
    const hasCityChanged = city !== (initialData.city || '');
    const hasPostalCodeChanged = postalCode !== (initialData.postalCode || '');
    const hasCountryChanged = country !== (initialData.country || '');
    const hasCompanyChanged = company !== (initialData.company || '');
    const hasVatNumberChanged = vatNumber !== (initialData.vatNumber || '');
    const hasTypeChanged = customerType !== (initialData.type || CustomerType.PRIVATE);
    const hasStatusChanged = status !== (initialData.status || CommonStatus.ACTIVE);
    const hasNewsletterChanged = newsletter !== (initialData.newsletter || false);
    
    const changes = hasNameChanged || hasEmailChanged || hasPhoneChanged || 
      hasAddressChanged || hasCityChanged || hasPostalCodeChanged || 
      hasCountryChanged || hasCompanyChanged || hasVatNumberChanged || 
      hasTypeChanged || hasStatusChanged || hasNewsletterChanged;
    
    setHasChanges(changes);
  }, [
    name, email, phone, address, city, postalCode, country,
    company, vatNumber, customerType, status, newsletter, initialData
  ]);

  // Call checkForChanges on every field change
  const handleFieldChange = (field: string, value: string | boolean) => {
    if (process.env.NODE_ENV === 'development') {
      if (field === 'type' || field === 'customerType' || field === 'newsletter' || field === 'vatNumber') {
        console.log(`CustomerForm updating ${field}:`, value);
      }
    }
    
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
          router.push(`/dashboard/customers/${initialData.id}`);
        } else {
          router.push('/dashboard/customers');
        }
      }
    }
  };

  return (
    <Card className="w-full border shadow-sm hover:shadow-md transition-all">
      <form onSubmit={(e) => { e.preventDefault(); formSubmit(); }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
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
              <TabsTrigger value="address">Address & Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-green-600" />
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Full name"
                    required
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-green-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="example@domain.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-green-600" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="+43 123 456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-green-600" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    value={company}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    placeholder="Company name (optional)"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vatNumber" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-green-600" />
                  VAT Number
                </Label>
                <Input
                  id="vatNumber"
                  name="vatNumber"
                  value={vatNumber}
                  onChange={(e) => handleFieldChange('vatNumber', e.target.value)}
                  placeholder="VAT or tax ID (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-green-600" />
                  Customer Type
                </Label>
                <Select
                  value={customerType}
                  onValueChange={(value) => handleFieldChange('type', value)}
                  name="type"
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select customer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CustomerType.PRIVATE}>Private</SelectItem>
                    <SelectItem value={CustomerType.BUSINESS}>Business</SelectItem>
                    <SelectItem value={CustomerType.INDIVIDUAL}>Individual</SelectItem>
                    <SelectItem value={CustomerType.GOVERNMENT}>Government</SelectItem>
                    <SelectItem value={CustomerType.NON_PROFIT}>Non-Profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-green-600" />
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => handleFieldChange('status', value)}
                  name="status"
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CommonStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={CommonStatus.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={CommonStatus.DELETED}>Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-center gap-3">
                <Label htmlFor="newsletter" className="flex items-center gap-1.5 cursor-pointer">
                  <Newsletter className="h-3.5 w-3.5 text-green-600" />
                  Newsletter Subscription
                </Label>
                <Switch
                  id="newsletter"
                  name="newsletter"
                  checked={newsletter}
                  onCheckedChange={(checked) => {
                    // Explicitly ensure we're passing a boolean
                    handleFieldChange('newsletter', Boolean(checked));
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {newsletter ? 'Subscribed' : 'Not subscribed'}
                </span>
              </div>
            </TabsContent>
            
            <TabsContent value="address" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-green-600" />
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="Street address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-green-600" />
                    Postal Code
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={postalCode}
                    onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                    placeholder="1234"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-green-600" />
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-green-600" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={country}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
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
            className={EntityColors.customers?.text || ""}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={submitting}
            className={EntityColors.customers?.primary || "bg-green-600 hover:bg-green-700"}
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