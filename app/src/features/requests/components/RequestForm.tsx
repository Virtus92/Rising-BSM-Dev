'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { RequestResponseDto, UpdateRequestDto } from '@/domain/dtos/RequestDtos';
import { useRequestForm } from '@/features/requests/hooks/useRequestForm';
import { useToast } from '@/shared/hooks/useToast';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

interface RequestFormProps {
  initialData?: Partial<RequestResponseDto>;
  onSubmit: (data: UpdateRequestDto) => Promise<RequestResponseDto | null>;
  mode: 'create' | 'edit';
  onCancel?: () => void;
}

/**
 * Form for creating and editing requests
 */
export default function RequestForm({ initialData = {}, onSubmit, mode, onCancel }: RequestFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    service, setService,
    message, setMessage,
    status, setStatus,
    errors,
    submitting,
    handleSubmit,
    updateField
  } = useRequestForm({
    initialData,
    onSubmit: async (data) => {
      try {
        const result = await onSubmit(data);
        if (result) {
          const successMessage = mode === 'create' 
            ? 'Request created successfully' 
            : 'Request updated successfully';
            
          toast({
            title: 'Success',
            description: successMessage,
            variant: 'success'
          });
          
          // After saving, navigate to detail page or list
          if (mode === 'create') {
            router.push(`/dashboard/requests/${result.id}`);
          } else {
            router.push(`/dashboard/requests/${initialData.id}`);
          }
          
          return result;
        }
        
        return null;
      } catch (error) {
        console.error('Form submission error:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'error'
        });
        
        return null;
      }
    }
  });

  // Function to check if changes have been made
  const checkForChanges = useCallback(() => {
    const hasNameChanged = name !== (initialData.name || '');
    const hasEmailChanged = email !== (initialData.email || '');
    const hasPhoneChanged = phone !== (initialData.phone || '');
    const hasServiceChanged = service !== (initialData.service || '');
    const hasMessageChanged = message !== (initialData.message || '');
    const hasStatusChanged = status !== (initialData.status || RequestStatus.NEW);
    
    const changes = hasNameChanged || hasEmailChanged || hasPhoneChanged || 
      hasServiceChanged || hasMessageChanged || hasStatusChanged;
    
    setHasChanges(changes);
  }, [
    name, email, phone, service, message, status, initialData
  ]);

  // Call checkForChanges on every field change
  const handleFieldChange = (field: string, value: string) => {
    updateField(field, value);
    checkForChanges();
  };

  // Function to cancel and go back
  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmLeave(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        if (mode === 'edit' && initialData.id) {
          router.push(`/dashboard/requests/${initialData.id}`);
        } else {
          router.push('/dashboard/requests');
        }
      }
    }
  };

  // Function to confirm leaving despite changes
  const confirmLeave = () => {
    setShowConfirmLeave(false);
    if (onCancel) {
      onCancel();
    } else {
      if (mode === 'edit' && initialData.id) {
        router.push(`/dashboard/requests/${initialData.id}`);
      } else {
        router.push('/dashboard/requests');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={handleCancel}
            className="mr-2 p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create New Request' : 'Edit Request'}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Request Information</h3>
            
            {/* Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white`}
                placeholder="Full Name"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>
            
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white`}
                placeholder="email@example.com"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>
            
            {/* Phone */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white"
                placeholder="+43 123 456789"
              />
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Request Details</h3>
            
            {/* Service */}
            <div className="mb-4">
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service <span className="text-red-500">*</span>
              </label>
              <input
                id="service"
                name="service"
                type="text"
                value={service}
                onChange={(e) => handleFieldChange('service', e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.service ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white`}
                placeholder="Requested Service"
                required
              />
              {errors.service && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.service}</p>
              )}
            </div>
            
            {/* Status */}
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select 
                value={status} 
                onValueChange={(value) => handleFieldChange('status', value)}
              >
                <SelectTrigger id="status" className="w-full">
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
        </div>

        {/* Message */}
        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Message</h3>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={message}
            onChange={(e) => handleFieldChange('message', e.target.value)}
            className={`w-full px-3 py-2 border ${
              errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:text-white`}
            placeholder="Request message..."
            required
          ></textarea>
          {errors.message && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>

      {/* Confirmation dialog */}
      {showConfirmLeave && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Unsaved Changes
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You have unsaved changes. Are you sure you want to leave this page? All unsaved changes will be lost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmLeave}
                >
                  Leave
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowConfirmLeave(false)}
                >
                  Back to Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
