'use client';

import { useState, useCallback, useEffect } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { User, Mail, Phone, Building, FileText, MapPin, Globe, Tag, AlertCircle, Mail as Newsletter } from 'lucide-react';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  zipCode?: string;
  country?: string;
  company?: string;
  vatNumber?: string;
  type?: CustomerType;
  status?: CommonStatus;
  newsletter?: boolean;
  notes?: string;
}

export interface CustomerFormFieldsProps {
  formData: CustomerFormData;
  onChange: (data: Partial<CustomerFormData>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

/**
 * Pure form fields component without any wrapper
 * For use in modals and other contexts where Card wrapper is not needed
 */
export const CustomerFormFields: React.FC<CustomerFormFieldsProps> = ({
  formData,
  onChange,
  errors = {},
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState('basic');

  const handleFieldChange = (field: keyof CustomerFormData, value: any) => {
    onChange({ [field]: value });
  };

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
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Full name"
                required
                disabled={disabled}
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
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="example@domain.com"
                disabled={disabled}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-green-600" />
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+43 123 456789"
                disabled={disabled}
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
                value={formData.company || ''}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                placeholder="Company name (optional)"
                disabled={disabled}
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
              value={formData.vatNumber || ''}
              onChange={(e) => handleFieldChange('vatNumber', e.target.value)}
              placeholder="VAT or tax ID (optional)"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-green-600" />
              Customer Type
            </Label>
            <Select
              value={formData.type || CustomerType.PRIVATE}
              onValueChange={(value) => handleFieldChange('type', value)}
              disabled={disabled}
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
              value={formData.status || CommonStatus.ACTIVE}
              onValueChange={(value) => handleFieldChange('status', value)}
              disabled={disabled}
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
              checked={formData.newsletter || false}
              onCheckedChange={(checked) => handleFieldChange('newsletter', Boolean(checked))}
              disabled={disabled}
            />
            <span className="text-xs text-muted-foreground">
              {formData.newsletter ? 'Subscribed' : 'Not subscribed'}
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
              value={formData.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Street address"
              disabled={disabled}
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
                value={formData.postalCode || formData.zipCode || ''}
                onChange={(e) => {
                  handleFieldChange('postalCode', e.target.value);
                  handleFieldChange('zipCode', e.target.value);
                }}
                placeholder="1234"
                disabled={disabled}
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
                value={formData.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="City"
                disabled={disabled}
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
                value={formData.country || ''}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                placeholder="Country"
                disabled={disabled}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};
