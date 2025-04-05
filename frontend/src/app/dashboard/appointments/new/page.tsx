'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppointments, useCreateAppointment } from '@/hooks/useAppointments';
import { Appointment, AppointmentCreateRequest } from '@/lib/api/types';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { mutate: createAppointment, isPending: isLoading } = useCreateAppointment();

  const [formData, setFormData] = useState<Partial<AppointmentCreateRequest>>({
    title: '',
    customerId: undefined,
    projectId: undefined,
    appointmentDate: '',
    appointmentTime: '',
    duration: 60,
    location: '',
    description: '',
    status: 'planned'
  });
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Load customers and projects
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // Mock-Kunden für Test-Zwecke
        setCustomers([
          { id: 1, name: 'Firma ABC GmbH' },
          { id: 2, name: 'Max Mustermann' },
          { id: 3, name: 'Erika Musterfrau' },
          { id: 4, name: 'Technologie XYZ AG' }
        ]);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };
    
    const loadProjects = async () => {
      try {
        // Mock-Projekte für Test-Zwecke
        setProjects([
          { id: 1, title: 'Website-Relaunch ABC GmbH' },
          { id: 2, title: 'SEO-Optimierung für Mustermann' },
          { id: 3, title: 'App-Entwicklung für XYZ AG' },
          { id: 4, title: 'Marketing-Kampagne Musterfrau' }
        ]);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    
    loadCustomers();
    loadProjects();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.appointmentDate || !formData.appointmentTime) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Ensure note is not empty if sending
    createAppointment(formData as AppointmentCreateRequest, {
      onSuccess: () => {
        router.push('/dashboard/appointments');
      }
    });
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Appointment</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title*
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer
              </label>
              <select
                name="customerId"
                value={formData.customerId || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- Select Customer --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project
              </label>
              <select
                name="projectId"
                value={formData.projectId || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- Select Project --</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="planned">Planned</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date*
              </label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time*
              </label>
              <input
                type="time"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="mr-4 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
