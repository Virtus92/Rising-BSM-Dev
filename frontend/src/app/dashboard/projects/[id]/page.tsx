'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Calendar, User, CreditCard, FileText, CheckSquare, Plus, Briefcase } from 'lucide-react';
import { getProjectById, deleteProject, addProjectNote } from '@/lib/api';

// Typ-Definitionen
interface ProjectDetails {
  id: number;
  title: string;
  customerId?: number;
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  serviceId?: number;
  service?: {
    id: number;
    name: string;
    basePrice: number;
    vatRate: number;
  };
  startDate?: string;
  endDate?: string;
  amount?: number;
  description?: string;
  status: string;
  createdAt: string;
  createdBy?: number;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  appointments?: Array<{
    id: number;
    title: string;
    appointmentDate: string;
    duration?: number;
    status: string;
  }>;
  notes?: Array<{
    id: number;
    text: string;
    userId?: number;
    userName: string;
    createdAt: string;
  }>;
}

// Parameter Type erweitern, damit TypeScript nicht meckert
interface PageParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

export default function ProjectDetailPage() {
  const params = useParams() as PageParams;
  const router = useRouter();
  const projectId = params.id;
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Lade Projektdaten
  useEffect(() => {
    async function loadProjectData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getProjectById(projectId);
        
        if (response.success) {
          setProject(response.data.project);
        } else {
          setError('Fehler beim Laden der Projektdaten');
        }
      } catch (err) {
        console.error('Error loading project details:', err);
        setError('Fehler beim Laden der Projektdaten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadProjectData();
  }, [projectId]);

  // Handle delete project
  const handleDeleteProject = async () => {
    try {
      const response = await deleteProject(projectId);
      
      if (response.success) {
        router.push('/dashboard/projects');
      } else {
        setError('Fehler beim Löschen des Projekts');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Fehler beim Löschen des Projekts. Bitte versuchen Sie es später erneut.');
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      const response = await addProjectNote(projectId, { text: newNote });
      
      if (response.success) {
        // Reload project data to get updated notes
        const projectResponse = await getProjectById(projectId);
        if (projectResponse.success) {
          setProject(projectResponse.data.project);
        }
        setNewNote('');
      } else {
        setError('Fehler beim Hinzufügen der Notiz');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Fehler beim Hinzufügen der Notiz. Bitte versuchen Sie es später erneut.');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/projects" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Projekt wird geladen...</h1>
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
          <Link href="/dashboard/projects" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Projektdetails</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/projects" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">Projekt nicht gefunden</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Das angeforderte Projekt konnte nicht gefunden werden.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with back button and actions */}
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/projects" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <span className={`px-2 py-1 text-xs rounded-full ${
            project.status === 'completed' ? 'bg-green-100 text-green-800' :
            project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
            project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
          </span>
        </div>
        
        <div className="flex mt-4 sm:mt-0">
          <Link 
            href={`/dashboard/projects/${projectId}/edit`}
            className="flex items-center mr-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit size={16} className="mr-1" />
            Bearbeiten
          </Link>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-red-600 text-red-600 rounded-md hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-1" />
            Löschen
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
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-4 px-1 ${activeTab === 'appointments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} font-medium text-sm`}
          >
            Termine
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-4 px-1 ${activeTab === 'notes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} font-medium text-sm`}
          >
            Notizen
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Projektinformationen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Titel</p>
                  <p className="font-medium">{project.title}</p>
                </div>
                
                {project.customer && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Kunde</p>
                    <p className="font-medium flex items-center">
                      <User size={16} className="mr-1 text-gray-400" />
                      <Link href={`/dashboard/customers/${project.customer.id}`} className="text-blue-600 hover:underline">
                        {project.customer.name}
                      </Link>
                    </p>
                  </div>
                )}
                
                {project.service && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Dienstleistung</p>
                    <p className="font-medium flex items-center">
                      <Briefcase size={16} className="mr-1 text-gray-400" />
                      {project.service.name}
                    </p>
                  </div>
                )}
                
                {project.amount && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Betrag</p>
                    <p className="font-medium flex items-center">
                      <CreditCard size={16} className="mr-1 text-gray-400" />
                      €{parseFloat(project.amount.toString()).toFixed(2)}
                    </p>
                  </div>
                )}
                
                {(project.startDate || project.endDate) && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Zeitraum</p>
                    <p className="font-medium flex items-center">
                      <Calendar size={16} className="mr-1 text-gray-400" />
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Noch nicht festgelegt'}
                      {project.startDate && project.endDate && ' bis '}
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                )}
                
                {project.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Beschreibung</p>
                    <p className="font-medium flex items-start">
                      <FileText size={16} className="mr-1 text-gray-400 mt-1" />
                      <span>{project.description}</span>
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="font-medium flex items-center">
                    <CheckSquare size={16} className="mr-1 text-gray-400" />
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Erstellt am</p>
                  <p className="font-medium flex items-center">
                    <Calendar size={16} className="mr-1 text-gray-400" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Übersicht</h2>
              <div className="space-y-4">
                {project.service && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Preis der Dienstleistung</p>
                    <p className="text-2xl font-semibold flex items-center">
                      €{parseFloat(project.service.basePrice.toString()).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">zzgl. {project.service.vatRate}% MwSt.</p>
                  </div>
                )}
                
                {project.amount && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Vereinbarter Betrag</p>
                    <p className="text-2xl font-semibold">
                      €{parseFloat(project.amount.toString()).toFixed(2)}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Appointments tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-6 pb-2">
              <h2 className="text-lg font-medium">Termine</h2>
              <Link 
                href={`/dashboard/appointments/new?projectId=${project.id}`}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} className="mr-1" />
                Neuer Termin
              </Link>
            </div>
            {project.appointments && project.appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dauer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{appointment.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(appointment.appointmentDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.duration ? `${appointment.duration} Minuten` : '-'}
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
                            Ansehen
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>Keine Termine für dieses Projekt gefunden.</p>
                <Link 
                  href={`/dashboard/appointments/new?projectId=${project.id}`}
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus size={16} className="mr-1" />
                  Neuen Termin vereinbaren
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Notes tab */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Projektnotizen</h2>
            
            {/* Add note form */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Neue Notiz hinzufügen</h3>
              <div className="flex">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Schreiben Sie hier Ihre Notiz..."
                ></textarea>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {addingNote ? 'Wird hinzugefügt...' : 'Notiz hinzufügen'}
                </button>
              </div>
            </div>
            
            {/* Notes list */}
            {project.notes && project.notes.length > 0 ? (
              <div className="space-y-4">
                {project.notes.map((note) => (
                  <div key={note.id} className="p-4 border-b border-gray-200 last:border-0">
                    <p className="text-gray-600">{note.text}</p>
                    <p className="text-xs text-gray-500 mt-2">Von {note.userName} am {new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Noch keine Notizen vorhanden.</p>
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
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Projekt löschen
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Sind Sie sicher, dass Sie dieses Projekt löschen möchten? Alle mit diesem Projekt verknüpften Daten werden permanent entfernt.
                        Dies kann nicht rückgängig gemacht werden.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteProject}
                >
                  Löschen
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
