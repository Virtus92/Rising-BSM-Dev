'use client';

import { useState } from 'react';
import { X, Check, User, Mail, Phone, UserPlus } from 'lucide-react';
import { createCustomer } from '@/lib/api';
import { toast } from 'sonner';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customerId: number) => void;
  initialData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
  };
}

export default function CreateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  initialData
}: CreateCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: initialData.name,
    email: initialData.email,
    phone: initialData.phone || '',
    type: 'individual' as 'individual' | 'business',
    company: '',
    notes: initialData.message || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!isOpen) return null;
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.type === 'business' && !formData.company.trim()) {
      newErrors.company = 'Company name is required for business customers';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await createCustomer({
        type: formData.type,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        companyName: formData.type === 'business' ? formData.company : null,
        notes: formData.notes || null,
        status: 'active'
      });
      
      if (response.success && response.data) {
        toast.success('Customer created successfully');
        onSuccess(response.data.id);
      } else {
        setErrors({
          submit: response.message || 'Failed to create customer'
        });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setErrors({
        submit: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 sm:mx-0 sm:h-10 sm:w-10">
                  <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    Create New Customer
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    {errors.submit && (
                      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                        <div className="text-sm text-red-700 dark:text-red-400">
                          {errors.submit}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-sm"
                      >
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-sm`}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                      )}
                    </div>
                    
                    {formData.type === 'business' && (
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 border ${errors.company ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-sm`}
                        />
                        {errors.company && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company}</p>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-sm`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone (optional)
                      </label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (optional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-sm"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Customer
                  </>
                )}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
