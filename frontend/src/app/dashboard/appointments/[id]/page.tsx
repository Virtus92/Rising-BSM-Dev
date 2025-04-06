'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Calendar, User, Briefcase, MapPin, Clock, FileText, Plus } from 'lucide-react';
import { getAppointmentById, updateAppointmentStatus, deleteAppointment, addAppointmentNote } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils/date-formatter';
import { getStatusClass, getStatusLabel } from '@/lib/utils/status-formatter';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id;
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  
  // Load appointment data
  useEffect(() => {
    async function loadAppointmentData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getAppointmentById(appointmentId);
        
        if (response.success && response.data) {
          setAppointment(response.data.appointment);
        } else {
          setError('Error loading appointment');
        }
      } catch (err) {
        console.error('Error loading appointment details:', err);
        setError('Error loading appointment. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadAppointmentData();
  }, [appointmentId]);
  
  // Handle delete appointment
  const handleDeleteAppointment = async () => {
    try {
      const response = await deleteAppointment(appointmentId);
      
      if (response.success) {
        router.push('/dashboard/appointments');
      } else {
        setError('Error deleting appointment');
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Error deleting appointment. Please try again later.');
    }
  };
  
  // Handle add note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      const response = await addAppointmentNote(appointmentId, newNote);
      
      if (response.success) {
        // Reload appointment data to get updated notes
        const appointmentResponse = await getAppointmentById(appointmentId);
        if (appointmentResponse.success && appointmentResponse.data) {
          setAppointment(appointmentResponse.data.appointment);
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
  
  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await updateAppointmentStatus(appointmentId, newStatus);
      
      if (response.success && response.data) {
        setAppointment(response.data.appointment);
        setStatusMenuOpen(false);
      } else {
        setError('Error updating appointment status');
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Error updating appointment status. Please try again later.');
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/appointments" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Loading appointment details...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/appointments" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Appointment Details</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/appointments" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Appointment Not Found</h1>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">The requested appointment could not be found.</span>
        </div>
      </div>
    );
  }
  
  // Format dates properly
  const formattedDate = formatDate(appointment.appointmentDate, false);
  const formattedTime = appointment.appointmentTime || formatTime(appointment.appointmentDate);

  return (
    <div className="p-6">
      {/* Header with back button and actions */}
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/appointments" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{appointment.title}</h1>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(appointment.status, 'appointment')}`}>
            {getStatusLabel(appointment.status, 'appointment')}
          </span>
        </div>
        
        <div className="flex mt-4 sm:mt-0 space-x-2">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-slate-600"
            >
              Change Status
              <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {statusMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 dark:bg-slate-800 border dark:border-gray-700">
                <div className="py-1">
                  <button
                    onClick={() => handleStatusChange('planned')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                  >
                    Planned
                  </button>
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Link 
            href={`/dashboard/appointments/${appointmentId}/edit`}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Link>
          <button 
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center px-4 py-2 bg-white border border-red-600 text-red-600 rounded-md hover:bg-red-50 dark:bg-slate-700 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Appointment Details */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appointment Details</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</p>
                <p className="text-gray-900 dark:text-white">{formattedDate}, {formattedTime}</p>
                {appointment.duration && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Duration: {appointment.duration} minutes
                  </p>
                )}
              </div>
            </div>
            
            {appointment.customer && (
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="text-gray-900 dark:text-white">
                    <Link 
                      href={`/dashboard/customers/${appointment.customer.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                    >
                      {appointment.customer.name}
                    </Link>
                  </p>
                  {appointment.customer.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.customer.company}</p>
                  )}
                </div>
              </div>
            )}
            
            {appointment.project && (
              <div className="flex items-start">
                <Briefcase className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Project</p>
                  <p className="text-gray-900 dark:text-white">
                    <Link 
                      href={`/dashboard/projects/${appointment.project.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                    >
                      {appointment.project.title}
                    </Link>
                  </p>
                </div>
              </div>
            )}
            
            {appointment.location && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-gray-900 dark:text-white">{appointment.location}</p>
                </div>
              </div>
            )}
            
            {appointment.description && (
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-line">{appointment.description}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(appointment.createdAt, true)}
                  {appointment.creator && (
                    <span> by {appointment.creator.name}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats and Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status</h2>
          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(appointment.status, 'appointment')}`}>
              {getStatusLabel(appointment.status, 'appointment')}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition"
              >
                <span className="mr-2">🔄</span>
                Change Status
              </button>
              {appointment.customer && (
                <Link 
                  href={`/dashboard/customers/${appointment.customer.id}`}
                  className="flex items-center w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                >
                  <span className="mr-2">👤</span>
                  View Customer
                </Link>
              )}
              {appointment.project && (
                <Link 
                  href={`/dashboard/projects/${appointment.project.id}`}
                  className="flex items-center w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                >
                  <span className="mr-2">📁</span>
                  View Project
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes Section */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notes</h2>
        
        {/* Add note form */}
        <form onSubmit={handleAddNote} className="mb-6 bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add a New Note</h3>
          <div className="flex">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-grow border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-600 dark:text-white"
              rows={3}
              placeholder="Type your note here..."
            ></textarea>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={addingNote || !newNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed dark:disabled:bg-blue-800"
            >
              {addingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>
        
        {/* Notes list */}
        <div className="space-y-4">
          {appointment.notes && appointment.notes.length > 0 ? (
            appointment.notes.map((note: any) => (
              <div key={note.id} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-white">{note.userName}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(note.createdAt, true)}</span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{note.text}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              <p>No notes have been added yet.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Delete Appointment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this appointment? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteAppointment}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
