'use client';

import React, { useState } from 'react';
import { createService, updateService } from '@/lib/api';
import { Service } from '@/lib/api/types';

interface ServiceFormProps {
  service?: Service; // If provided, will be an edit form
  onSuccess?: (service: any) => void;
  onCancel?: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  onSuccess,
  onCancel
}) => {
  const isEditMode = !!service;
  
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    basePrice: service?.basePrice?.toString() || '',
    vatRate: service?.vatRate?.toString() || '20.00',
    unit: service?.unit || 'hour',
    active: service ? service.active : true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format data for API
      const serviceData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        vatRate: parseFloat(formData.vatRate || '20.00')
      };
      
      let response;
      
      if (isEditMode && service) {
        response = await updateService(service.id, serviceData);
      } else {
        response = await createService(serviceData);
      }
      
      if (response.success && response.data) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.message || 'Error saving service');
      }
    } catch (err: any) {
      console.error('Error saving service:', err);
      setError(err.message || 'Error saving service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Service Name*
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        ></textarea>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base Price*
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
              €
            </span>
            <input
              type="number"
              id="basePrice"
              name="basePrice"
              value={formData.basePrice}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full pl-8 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            VAT Rate*
          </label>
          <div className="relative">
            <input
              type="number"
              id="vatRate"
              name="vatRate"
              value={formData.vatRate}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
              %
            </span>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Unit
        </label>
        <select
          id="unit"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="service">Service</option>
          <option value="piece">Piece</option>
          <option value="project">Project</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          name="active"
          checked={formData.active}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor="active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Active
        </label>
      </div>
      
      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEditMode ? 'Update Service' : 'Create Service'}
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;
