'use client';

import React, { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { User, Mail, Phone, MessageCircle, Briefcase, AlertCircle } from 'lucide-react';
import { RequestStatus } from '@/domain/enums/CommonEnums';

export interface RequestFormData {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  status?: RequestStatus;
}

export interface RequestFormFieldsProps {
  formData: RequestFormData;
  onChange: (data: Partial<RequestFormData>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showStatus?: boolean;
}

/**
 * Pure form fields component without any wrapper
 * For use in modals and other contexts where Card wrapper is not needed
 */
export const RequestFormFields: React.FC<RequestFormFieldsProps> = ({
  formData,
  onChange,
  errors = {},
  disabled = false,
  showStatus = false
}) => {
  const [activeTab, setActiveTab] = useState('basic');

  const handleFieldChange = (field: keyof RequestFormData, value: any) => {
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
          <TabsTrigger value="details">Request Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-purple-600" />
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
                <Mail className="h-3.5 w-3.5 text-purple-600" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="example@domain.com"
                required
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
                <Phone className="h-3.5 w-3.5 text-purple-600" />
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
              <Label htmlFor="service" className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                Service <span className="text-red-500">*</span>
              </Label>
              <Input
                id="service"
                name="service"
                value={formData.service}
                onChange={(e) => handleFieldChange('service', e.target.value)}
                placeholder="What service are you interested in?"
                required
                disabled={disabled}
                className={errors.service ? "border-red-500" : ""}
              />
              {errors.service && (
                <p className="text-sm text-red-600">{errors.service}</p>
              )}
            </div>
          </div>

          {showStatus && (
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-purple-600" />
                Status
              </Label>
              <Select
                value={formData.status || RequestStatus.NEW}
                onValueChange={(value) => handleFieldChange('status', value)}
                disabled={disabled}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RequestStatus.NEW}>New</SelectItem>
                  <SelectItem value={RequestStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={RequestStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={RequestStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-purple-600" />
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={(e) => handleFieldChange('message', e.target.value)}
              placeholder="Describe your request in detail..."
              rows={6}
              required
              disabled={disabled}
              className={errors.message ? "border-red-500" : ""}
            />
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};
