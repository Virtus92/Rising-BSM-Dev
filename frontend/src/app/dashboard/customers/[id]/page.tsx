'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building, Calendar, Briefcase, Plus, Download } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import ProjectForm from '@/components/projects/ProjectForm';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { formatDate } from '@/lib/utils/date-formatter';
import { getStatusClass, getStatusLabel } from '@/lib/utils/status-formatter';
import { getCustomerById, deleteCustomer, addCustomerNote } from '@/lib/api';
import { ApiResponse, Customer } from '@/lib/api/types';

// Typ-Definitionen
interface CustomerDetails {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  status: string;
  type: string;
  newsletter: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  projects?: Array<{
    id: number;
    title: string;
    status: string;
    startDate?: string;
    endDate?: string;
  }>;
  appointments?: Array<{
    id: number;
    title: string;
    appointmentDate: string;
    status: string;
  }>;
  logs?: Array<{
    id: number;
    action: string;
    details?: string;
    userName: string;
    createdAt: string;
  }>;
}

// Parameter Type erweitern
interface PageParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

export default function CustomerDetailPage() {
  const params = useParams() as PageParams;
  const router = useRouter();
  const customerId = params.id;
  
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load customer data
  useEffect(() => {
    async function loadCustomerData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getCustomerById(customerId);
        
        if (response.success && response.data) {
          setCustomer(response.data as CustomerDetails);
        } else {
          setError('Error loading customer data');
        }
      } catch (err) {
        console.error('Error loading customer details:', err);
        setError('Error loading customer data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadCustomerData();
  }, [customerId]);

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    try {
      const response = await deleteCustomer(customerId);
      
      if (response.success) {
        router.push('/dashboard/customers');
      } else {
        setError('Error deleting customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Error deleting customer. Please try again later.');
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      const response = await addCustomerNote(customerId, { note: newNote });
      
      if (response.success) {
        // Reload customer data to get updated notes
        const customerResponse = await getCustomerById(customerId);
        if (customerResponse.success && customerResponse.data) {
        setCustomer(customerResponse.data as CustomerDetails);
        }
        setNewNote('');
      } else {
        setError('Error adding note');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Error adding note. Please try again later.');
    } finally {
      setAddingNote(false);
    }
  };

  // Handle project creation success
  const handleProjectCreated = async (project: any) => {
    // Reload customer data to get the new project
    const customerResponse = await getCustomerById(customerId);
    if (customerResponse.success && customerResponse.data) {
      setCustomer(customerResponse.data as CustomerDetails);
      setShowProjectModal(false);
      // Switch to the projects tab
      setActiveTab('projects');
    }
  };

  // Handle appointment creation success
  const handleAppointmentCreated = async (appointment: any) => {
    // Reload customer data to get the new appointment
    const customerResponse = await getCustomerById(customerId);
    if (customerResponse.success && customerResponse.data) {
      setCustomer(customerResponse.data as CustomerDetails);
      setShowAppointmentModal(false);
      // Switch to the appointments tab
      setActiveTab('appointments');
    }
  };

  // Handle Export
  const handleExport = () => {
    // TODO: Implement actual export functionality
    alert('Export functionality is not yet implemented');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Loading customer details...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-24 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Customer Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Customer Not Found</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">The requested customer could not be found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with back button and actions */}
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <span className={`px-2 py-1 text-xs rounded-full ${
            customer.status === 'active' ? 'bg-green-100 text-green-800' :
            customer.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
          </span>
        </div>
        
        <div className="flex mt-4 sm:mt-0 space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-slate-600"
          >
            <Download size={16} className="mr-1" />
            Export
          </button>
          <Link 
            href={`/dashboard/customers/${customerId}/edit`}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Link>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-red-600 text-red-600 rounded-md hover:bg-red-50 dark:bg-slate-700 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-4 px-1 ${activeTab === 'projects' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} font-medium text-sm`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-4 px-1 ${activeTab === 'appointments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} font-medium text-sm`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-4 px-1 ${activeTab === 'notes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} font-medium text-sm`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-1 ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} font-medium text-sm`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                {customer.company && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Company</p>
                    <p className="font-medium flex items-center">
                      <Building size={16} className="mr-1 text-gray-400" />
                      {customer.company}
                    </p>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium flex items-center">
                      <Mail size={16} className="mr-1 text-gray-400" />
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                        {customer.email}
                      </a>
                    </p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-medium flex items-center">
                      <Phone size={16} className="mr-1 text-gray-400" />
                      <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                        {customer.phone}
                      </a>
                    </p>
                  </div>
                )}
                {(customer.address || customer.city || customer.postalCode || customer.country) && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="font-medium flex items-start">
                      <MapPin size={16} className="mr-1 text-gray-400 mt-1" />
                      <span>
                        {customer.address && <span className="block">{customer.address}</span>}
                        {(customer.postalCode || customer.city) && (
                          <span className="block">
                            {customer.postalCode && customer.postalCode}{customer.postalCode && customer.city ? ', ' : ''}{customer.city}
                          </span>
                        )}
                        {customer.country && <span className="block">{customer.country}</span>}
                      </span>
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customer Type</p>
                  <p className="font-medium flex items-center">
                    <Briefcase size={16} className="mr-1 text-gray-400" />
                    {customer.type === 'private' ? 'Private Client' : 'Business Client'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Newsletter</p>
                  <p className="font-medium">
                    {customer.newsletter ? 'Subscribed' : 'Not subscribed'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customer Since</p>
                  <p className="font-medium flex items-center">
                    <Calendar size={16} className="mr-1 text-gray-400" />
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Projects</p>
                  <p className="text-2xl font-semibold flex items-center">
                    {customer.projects?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Upcoming Appointments</p>
                  <p className="text-2xl font-semibold">
                    {customer.appointments?.filter(a => 
                      new Date(a.appointmentDate) >= new Date() && 
                      a.status !== 'cancelled'
                    ).length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' :
                    customer.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Projects tab */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-slate-800">
            <div className="flex justify-between items-center p-6 pb-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h2>
              <button 
                onClick={() => setShowProjectModal(true)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
              >
                <Plus size={16} className="mr-1" />
                New Project
              </button>
            </div>
            {customer.projects && customer.projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customer.projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{project.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link 
                            href={`/dashboard/projects/${project.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>No projects found for this customer.</p>
                <Link 
                  href={`/dashboard/projects/new?customerId=${customer.id}`}
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus size={16} className="mr-1" />
                  Create New Project
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Appointments tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-slate-800">
            <div className="flex justify-between items-center p-6 pb-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appointments</h2>
              <button 
                onClick={() => setShowAppointmentModal(true)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
              >
                <Plus size={16} className="mr-1" />
                New Appointment
              </button>
            </div>
            {customer.appointments && customer.appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customer.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{appointment.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(appointment.appointmentDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link 
                            href={`/dashboard/appointments/${appointment.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>No appointments found for this customer.</p>
                <Link 
                  href={`/dashboard/appointments/new?customerId=${customer.id}`}
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus size={16} className="mr-1" />
                  Schedule New Appointment
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Notes tab */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Customer Notes</h2>
            
            {/* Add note form */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add a New Note</h3>
              <div className="flex">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Type your note here..."
                ></textarea>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
            
            {/* Notes list */}
            {customer.notes ? (
              <div>
                {customer.notes.split('\n').map((note, index) => (
                  <div key={index} className="p-4 border-b border-gray-200 last:border-0">
                    <p className="text-gray-600">{note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No notes have been added yet.</p>
              </div>
            )}
          </div>
        )}
        
        {/* History tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Activity History</h2>
            
            {customer.logs && customer.logs.length > 0 ? (
              <div className="space-y-4">
                {customer.logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-gray-200 pl-4 pb-2">
                    <div className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                        <span className="text-xs font-bold">i</span>
                      </div>
                      <div>
                        <p className="text-sm"><strong>{log.action}</strong></p>
                        {log.details && <p className="text-sm text-gray-600">{log.details}</p>}
                        <p className="text-xs text-gray-500 mt-1">By {log.userName} on {new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No activity history recorded yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-slate-800">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-slate-800">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-900/30">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Delete Customer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this customer? All data associated with this customer will be permanently removed.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-slate-700">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteCustomer}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-slate-600 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-slate-500"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Project Modal */}
      <Modal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Create New Project"
        size="lg"
      >
        <ProjectForm
          customerId={customer?.id}
          customerName={customer?.name}
          onSuccess={handleProjectCreated}
          onCancel={() => setShowProjectModal(false)}
        />
      </Modal>
      
      {/* Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title="Schedule New Appointment"
        size="lg"
      >
        <AppointmentForm
          customerId={customer?.id}
          customerName={customer?.name}
          onSuccess={handleAppointmentCreated}
          onCancel={() => setShowAppointmentModal(false)}
        />
      </Modal>
    </div>
  );
}
