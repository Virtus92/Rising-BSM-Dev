'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, User, Mail, Phone, FileText, MessageCircle, AlertCircle } from 'lucide-react';
import { RequestResponseDto, UpdateRequestDto } from '@/domain/dtos/RequestDtos';
import { useRequestForm } from '@/features/requests/hooks/useRequestForm';
import { useToast } from '@/shared/hooks/useToast';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { EntityColors } from '@/shared/utils/entity-colors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export interface RequestFormContentProps {
  initialData?: Partial<RequestResponseDto>;
  onSubmit: (data: UpdateRequestDto) => Promise<RequestResponseDto | null>;
  mode: 'create' | 'edit';
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  showFooter?: boolean;
}

/**
 * Form content component for creating and editing requests
 * This is the core form without any wrapper - can be used in cards or modals
 */
export function RequestFormContent({ 
  initialData = {}, 
  onSubmit, 
  mode, 
  isLoading = false,
  error = null,
  success = false,
  submitLabel = mode === 'create' ? 'Create Request' : 'Save Changes',
  onCancel,
  showFooter = true
}: RequestFormContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    service, setService,
    message, setMessage,
    status, setStatus,
    errors: formErrors,
    submitting: formSubmitting,
    handleSubmit: formSubmit,
    updateField
  } = useRequestForm({
    initialData,
    onSubmit: async (data) => {
      try {
        const result = await onSubmit(data);
        if (result) {
          // Only navigate if we're not in a modal
          if (!onCancel) {
            // Navigate to detail page or list after saving
            if (mode === 'create') {
              router.push(`/dashboard/requests/${result.id}`);
            } else {
              router.push(`/dashboard/requests/${initialData.id}`);
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

  return (
    <form onSubmit={(e) => { e.preventDefault(); formSubmit(); }} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm">
          {errors.general}
        </div>
      )}
      
      {showSuccess && (
        <div className="bg-green-50 p-3 rounded-md text-green-800 text-sm">
          Operation completed successfully!
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:w-[400px] mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Request Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-orange-600" />
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => updateField('name', e.target.value)}
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
                <Mail className="h-3.5 w-3.5 text-orange-600" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="example@domain.com"
                required
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
                <Phone className="h-3.5 w-3.5 text-orange-600" />
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+43 123 456789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                Status
              </Label>
              <Select 
                value={status} 
                onValueChange={(value) => updateField('status', value)}
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
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-orange-600" />
              Service <span className="text-red-500">*</span>
            </Label>
            <Input
              id="service"
              name="service"
              value={service}
              onChange={(e) => updateField('service', e.target.value)}
              placeholder="Service requested"
              required
              className={errors.service ? "border-red-500" : ""}
            />
            {errors.service && (
              <p className="text-sm text-red-600">{errors.service}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-orange-600" />
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              name="message"
              rows={6}
              value={message}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="Describe your request in detail..."
              required
              className={errors.message ? "border-red-500" : ""}
            />
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showFooter && (
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={submitting}
            className={EntityColors.requests?.text || ""}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={submitting}
            className={EntityColors.requests?.primary || "bg-orange-600 hover:bg-orange-700"}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
