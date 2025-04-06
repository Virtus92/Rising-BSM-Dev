'use client';

import React, { useState, useEffect } from 'react';
import { createProject, getServices } from '@/lib/api';
import { Service } from '@/lib/api/types';
import { formatDate } from '@/lib/utils/date-formatter';

interface ProjectFormProps {
  customerId?: number;
  customerName?: string;
  onSuccess?: (project: any) => void;
  onCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  customerId,
  customerName,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    customerId: customerId || '',
    serviceId: '',
    startDate: formatDate(new Date(), false),
    endDate: '',
    amount: '',
    description: '',
    status: 'new',
    note: ''
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load services for the dropdown
  useEffect(() => {
    async function loadServices() {
      try {
        const response = await getServices({ active: true });
        if (response.success && response.data?.services) {
          setServices(response.data.services);
        }
      } catch (err) {
        console.error('Error loading services:', err);
      }
    }
    
    loadServices();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format data for API
      const projectData = {
        ...formData,
        customerId: Number(formData.customerId),
        serviceId: Number(formData.serviceId),
        amount: formData.amount ? Number(formData.amount) : undefined
      };
      
      const response = await createProject(projectData);
      
      if (response.success && response.data) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.message || 'Error creating project');
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Error creating project. Please try again later.');
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project Title*
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      
      {!customerId && (
        <div>
          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer*
          </label>
          <input
            type="number"
            id="customerId"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
            placeholder="Customer ID"
          />
        </div>
      )}
      
      {customerName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer
          </label>
          <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-slate-600 text-gray-700 dark:text-gray-200">
            {customerName}
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Service*
        </label>
        <select
          id="serviceId"
          name="serviceId"
          value={formData.serviceId}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="">Select a service</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>{service.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Amount (€)
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="new">Neu</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="on_hold">Angehalten</option>
          <option value="completed">Abgeschlossen</option>
          <option value="cancelled">Storniert</option>
        </select>
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
      
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Initial Note
        </label>
        <textarea
          id="note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
        ></textarea>
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
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
