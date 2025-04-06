'use client';

import React, { useState, useEffect } from 'react';
import { createAppointment } from '@/lib/api';
import { formatDate } from '@/lib/utils/date-formatter';

interface AppointmentFormProps {
  customerId?: number;
  customerName?: string;
  projectId?: number;
  projectTitle?: string;
  onSuccess?: (appointment: any) => void;
  onCancel?: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  customerId,
  customerName,
  projectId,
  projectTitle,
  onSuccess,
  onCancel
}) => {
  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const formattedTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  
  const [formData, setFormData] = useState({
    title: '',
    customerId: customerId || '',
    projectId: projectId || '',
    appointmentDate: formattedDate,
    appointmentTime: formattedTime,
    duration: '60',
    location: '',
    description: '',
    status: 'planned',
    note: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      const appointmentData = {
        ...formData,
        customerId: formData.customerId ? Number(formData.customerId) : undefined,
        projectId: formData.projectId ? Number(formData.projectId) : undefined,
        duration: Number(formData.duration)
      };
      
      const response = await createAppointment(appointmentData);
      
      if (response.success && response.data) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.message || 'Error creating appointment');
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Error creating appointment. Please try again later.');
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
          Appointment Title*
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
            Customer
          </label>
          <input
            type="number"
            id="customerId"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
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
      
      {!projectId && (
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project
          </label>
          <input
            type="number"
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
            placeholder="Project ID (optional)"
          />
        </div>
      )}
      
      {projectTitle && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project
          </label>
          <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-slate-600 text-gray-700 dark:text-gray-200">
            {projectTitle}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date*
          </label>
          <input
            type="date"
            id="appointmentDate"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time*
          </label>
          <input
            type="time"
            id="appointmentTime"
            name="appointmentTime"
            value={formData.appointmentTime}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Duration (minutes)*
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="15"
            step="15"
            required
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
            <option value="planned">Geplant</option>
            <option value="confirmed">Bestätigt</option>
            <option value="in_progress">Läuft</option>
            <option value="completed">Abgeschlossen</option>
            <option value="cancelled">Storniert</option>
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
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
          {loading ? 'Creating...' : 'Create Appointment'}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
