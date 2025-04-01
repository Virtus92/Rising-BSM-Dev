'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building, Calendar, Briefcase, Plus } from 'lucide-react';
import { getCustomerById, deleteCustomer, addCustomerNote } from '@/lib/api';

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

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Lade Kundendaten
  useEffect(() => {
    async function loadCustomerData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getCustomerById(customerId);
        
        if (response.success) {
          setCustomer(response.data.customer);
        } else {
          setError('Fehler beim Laden der Kundendaten');
        }
      } catch (err) {
        console.error('Error loading customer details:', err);
        setError('Fehler beim Laden der Kundendaten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadCustomerData();
  }, [customerId]);

  // Kunde löschen
  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const response = await deleteCustomer(customerId);
      
      if (response.success) {
        router.push('/dashboard/customers');
      } else {
        setError('Fehler beim Löschen des Kunden');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Fehler beim Löschen des Kunden. Bitte versuchen Sie es später erneut.');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Notiz hinzufügen
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      
      const response = await addCustomerNote(customerId, { note: newNote });
      
      if (response.success) {
        // Aktualisiere die Notizen im State
        if (customer && customer.logs) {
          setCustomer({
            ...customer,
            logs: [response.data.note, ...customer.logs]
          });
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

  // Lade-Indikator
  if (loading && !customer) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Fehler-Anzeige
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <div className="mt-4 flex space-x-4">
          <button 
            className="text-red-700 dark:text-red-400 font-medium underline"
            onClick={() => window.location.reload()}
          >
            Seite neu laden
          </button>
          <Link
            href="/dashboard/customers"
            className="text-gray-700 dark:text-gray-300 font-medium underline"
          >
            Zurück zur Kundenliste
          </Link>
        </div>
      </div>
    );
  }

  // Wenn kein Kunde gefunden wurde
  if (!customer) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <p className="text-yellow-700 dark:text-yellow-400">Kunde nicht gefunden.</p>
        <Link
          href="/dashboard/customers"
          className="mt-4 text-gray-700 dark:text-gray-300 font-medium underline block"
        >
          Zurück zur Kundenliste
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header mit Aktionen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center">
          <Link
            href="/dashboard/customers"
            className="mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
          {customer.status === 'inactive' && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
              Inaktiv
            </span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Link>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600 dark:text-green-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Übersicht
          </button>
          
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-green-500 text-green-600 dark:text-green-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('projects')}
          >
            Projekte
            {customer.projects && customer.projects.length > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-800">
                {customer.projects.length}
              </span>
            )}
          </button>
          
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appointments'
                ? 'border-green-500 text-green-600 dark:text-green-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('appointments')}
          >
            Termine
            {customer.appointments && customer.appointments.length > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-800">
                {customer.appointments.length}
              </span>
            )}
          </button>
          
          <button
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-green-500 text-green-600 dark:text-green-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Verlauf
          </button>
        </nav>
      </div>
      
      {/* Content basierend auf dem aktiven Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kundendaten */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Kundeninformationen
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                customer.type === 'business' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}>
                {customer.type === 'business' ? 'Geschäftskunde' : 'Privatkunde'}
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{customer.name}</dd>
                </div>
                
                {customer.company && (
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Unternehmen</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-1" />
                      {customer.company}
                    </dd>
                  </div>
                )}
                
                {customer.email && (
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">E-Mail</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`mailto:${customer.email}`} className="text-green-600 dark:text-green-500 hover:underline">
                        {customer.email}
                      </a>
                    </dd>
                  </div>
                )}
                
                {customer.phone && (
                  <div className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefon</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`tel:${customer.phone}`} className="text-green-600 dark:text-green-500 hover:underline">
                        {customer.phone}
                      </a>
                    </dd>
                  </div>
                )}
                
                {(customer.address || customer.city || customer.postalCode) && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5" />
                      <div>
                        {customer.address && <div>{customer.address}</div>}
                        {(customer.postalCode || customer.city) && (
                          <div>{[customer.postalCode, customer.city].filter(Boolean).join(' ')}</div>
                        )}
                        {customer.country && <div>{customer.country}</div>}
                      </div>
                    </dd>
                  </div>
                )}
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Newsletter</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {customer.newsletter ? 'Ja' : 'Nein'}
                  </dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Kunde seit</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    {new Date(customer.createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </dd>
                </div>
                
                {customer.notes && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notizen</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {customer.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* Aktionen und Notizen */}
          <div className="lg:col-span-1 space-y-6">
            {/* Schnellaktionen */}
            <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Schnellaktionen
                </h3>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4">
                  <Link
                    href={`/dashboard/projects/new?customerId=${customer.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Neues Projekt
                  </Link>
                  
                  <Link
                    href={`/dashboard/appointments/new?customerId=${customer.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Neuer Termin
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Letzte Notizen */}
            <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Letzte Notizen
                </h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-green-600 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400"
                >
                  Alle anzeigen
                </button>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700">
                {/* Formular für neue Notiz */}
                <form onSubmit={handleAddNote} className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="min-w-0 flex-1">
                      <textarea
                        id="new-note"
                        name="new-note"
                        rows={2}
                        className="shadow-sm block w-full focus:ring-green-500 focus:border-green-500 sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                        placeholder="Notiz hinzufügen..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingNote || !newNote.trim()}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </form>
                
                {/* Liste der Notizen */}
                {customer.logs && customer.logs.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                    {customer.logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="px-4 py-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.userName}
                          </span>
                          <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={log.createdAt}>
                            {new Date(log.createdAt).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>
                        
                        {log.action === 'Notiz hinzugefügt' ? (
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                            {log.details}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {log.action}: {log.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">
                    Keine Notizen vorhanden.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'projects' && (
        <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Projekte
            </h3>
            <Link
              href={`/dashboard/projects/new?customerId=${customer.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neues Projekt
            </Link>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            {customer.projects && customer.projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Titel
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Zeitraum
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {customer.projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {project.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : project.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : project.status === 'on-hold'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                  : project.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {project.status === 'completed' 
                              ? 'Abgeschlossen'
                              : project.status === 'in-progress'
                                ? 'In Bearbeitung'
                                : project.status === 'on-hold'
                                  ? 'Pausiert'
                                  : project.status === 'cancelled'
                                    ? 'Abgebrochen'
                                    : 'Neu'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {project.startDate && (
                            <>
                              {new Date(project.startDate).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                              {project.endDate && (
                                <>
                                  {' - '}
                                  {new Date(project.endDate).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="text-green-600 dark:text-green-500 hover:text-green-900 dark:hover:text-green-400"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">
                Keine Projekte vorhanden.
                <div className="mt-2">
                  <Link
                    href={`/dashboard/projects/new?customerId=${customer.id}`}
                    className="text-green-600 dark:text-green-500 hover:underline font-medium"
                  >
                    Erstes Projekt erstellen
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'appointments' && (
        <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Termine
            </h3>
            <Link
              href={`/dashboard/appointments/new?customerId=${customer.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Termin
            </Link>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            {customer.appointments && customer.appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Titel
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Datum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {customer.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(appointment.appointmentDate).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            appointment.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : appointment.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {appointment.status === 'completed' 
                              ? 'Abgeschlossen'
                              : appointment.status === 'confirmed'
                                ? 'Bestätigt'
                                : appointment.status === 'cancelled'
                                  ? 'Abgesagt'
                                  : 'Geplant'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/dashboard/appointments/${appointment.id}`}
                            className="text-green-600 dark:text-green-500 hover:text-green-900 dark:hover:text-green-400"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">
                Keine Termine vorhanden.
                <div className="mt-2">
                  <Link
                    href={`/dashboard/appointments/new?customerId=${customer.id}`}
                    className="text-green-600 dark:text-green-500 hover:underline font-medium"
                  >
                    Ersten Termin erstellen
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Kundenhistorie
            </h3>
            
            {/* Formular für neue Notiz */}
            <form onSubmit={handleAddNote} className="flex items-start space-x-3">
              <div className="w-64">
                <input
                  type="text"
                  id="quick-note"
                  name="quick-note"
                  className="shadow-sm block w-full focus:ring-green-500 focus:border-green-500 sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-md"
                  placeholder="Schnellnotiz hinzufügen..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Notiz
              </button>
            </form>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700">
            {customer.logs && customer.logs.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {customer.logs.map((log) => (
                  <div key={log.id} className="px-4 py-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.userName}
                      </span>
                      <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={log.createdAt}>
                        {new Date(log.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </div>
                    
                    {log.action === 'Notiz hinzugefügt' ? (
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {log.details}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {log.action}: {log.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">
                Keine Einträge vorhanden.
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Lösch-Dialog */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Kunden löschen
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sind Sie sicher, dass Sie den Kunden "{customer.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden und alle zugehörigen Daten gehen verloren.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Wird gelöscht...
                    </>
                  ) : (
                    'Löschen'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
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