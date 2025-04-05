'use client';

import { useState, useEffect } from 'react';
import * as api from '@/lib/api';
import { ApiResponse } from '@/lib/api/types';
import { DashboardAppointment } from '../utils/dashboard-service';

export default function AppointmentsPage() {
  // Define a type for Appointment objects
  type Appointment = DashboardAppointment;

  // Helper function to determine status class
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'planned':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  // Helper function for status labels
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'planned':
        return 'Planned';
      case 'cancelled':
      case 'canceled':
        return 'Canceled';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return status || 'Unknown';
    }
  };

  // Delete function
  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      console.log('Deleting appointment with ID:', id);
      // Actual delete logic would be implemented here
      // api.deleteAppointment(id).then(() => loadAppointments());
    }
  };
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadAppointments() {
      try {
        setLoading(true);
        const response = await api.getAppointments();
        
        if (response.success && response.data) {
          // Überprüfen der Datenstruktur in der Antwort
          let appointmentData: Appointment[] = [];
          
          if (Array.isArray(response.data)) {
            appointmentData = response.data;
          } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
            appointmentData = response.data.appointments;
          } else {
            console.warn('Unexpected appointment data structure:', response.data);
          }
          
          // Ensure all appointments have the required fields
          appointmentData = appointmentData.map(appointment => ({
            ...appointment,
            id: appointment.id || 0,
            title: appointment.title || 'Untitled',
            customerName: appointment.customerName || 'Unknown Customer',
            appointmentDate: appointment.appointmentDate || new Date().toISOString().split('T')[0],
            appointmentTime: appointment.appointmentTime || '00:00',
            status: appointment.status || 'pending'
          }));
          
          setAppointments(appointmentData);
        } else {
          console.error('API response error:', response);
          setError(response.message || 'Error loading appointments');
        }
      } catch (err) {
        console.error('Error loading appointments:', err);
        setError('Error loading appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadAppointments();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
        <a
          href="/dashboard/appointments/new"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          New Appointment
        </a>
      </div>
      
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300">No appointments available.</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create your first appointment to begin scheduling.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{appointment.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{appointment.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(appointment.appointmentDate).toLocaleDateString('en-US')}, {appointment.appointmentTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={`/dashboard/appointments/${appointment.id}`} className="text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 mr-4">Edit</a>
                      <a href="#" onClick={(e) => handleDelete(e, appointment.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400">Delete</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}