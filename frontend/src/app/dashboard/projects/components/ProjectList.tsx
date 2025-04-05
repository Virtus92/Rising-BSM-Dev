'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, ChevronDown, Edit, Trash2, ExternalLink, Calendar, User } from 'lucide-react';
import * as api from '@/lib/api';
import { getCustomers, getServices } from '@/lib/api';

// Types
interface Project {
  id: number;
  title: string;
  customerId?: number;
  customerName?: string;
  serviceId?: number;
  serviceName?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ProjectListProps {
  initialData?: {
    projects: Project[];
    pagination: Pagination;
  };
  loading?: boolean;
  error?: string | null;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
}

export default function ProjectList({ 
  initialData, 
  loading: externalLoading, 
  error: externalError,
  onPageChange,
  onFilterChange
}: ProjectListProps) {
  // State
  const [projects, setProjects] = useState<Project[]>(initialData?.projects || []);
  const [loading, setLoading] = useState(externalLoading !== undefined ? externalLoading : !initialData);
  const [error, setError] = useState<string | null>(externalError !== undefined ? externalError : null);
  const [page, setPage] = useState(initialData?.pagination?.page || 1);
  const [limit] = useState(initialData?.pagination?.limit || 10);
  const [totalPages, setTotalPages] = useState(initialData?.pagination?.pages || 1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Update state when props change
  useEffect(() => {
    if (initialData) {
      setProjects(initialData.projects);
      setTotalPages(initialData.pagination.pages);
      setPage(initialData.pagination.page);
    }
  }, [initialData]);

  useEffect(() => {
    if (externalLoading !== undefined) {
      setLoading(externalLoading);
    }
  }, [externalLoading]);

  useEffect(() => {
    if (externalError !== undefined) {
      setError(externalError);
    }
  }, [externalError]);

  // Define API response types
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
  }
  
  type Customer = {id: number, name: string};
  type Service = {id: number, name: string};
  
  interface CustomersData {
    customers: Customer[];
  }
  
  interface ServicesData {
    services: Service[];
  }

  interface ProjectsData {
    projects: Project[];
    pagination: {
      pages: number;
    };
  }

  // Generic response for delete operations
  type DeleteResponse = ApiResponse<any>;

  // Fetch filter options (customers and services)
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        setLoadingFilters(true);
        const [customersResponse, servicesResponse] = await Promise.all([
          getCustomers<ApiResponse<CustomersData>>({
            limit: 100,
            status: 'active'
          }),
          getServices<ApiResponse<ServicesData>>({ active: true })
        ]);
        
        if (customersResponse.success && customersResponse.data && 'customers' in customersResponse.data) {
          setCustomers((customersResponse.data as CustomersData).customers);
        }
        
        if (servicesResponse.success && servicesResponse.data && 'services' in servicesResponse.data) {
          setServices((servicesResponse.data as ServicesData).services);
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      } finally {
        setLoadingFilters(false);
      }
    }
    
    loadFilterOptions();
  }, []);

  // Fetch projects data if no external data provided
  useEffect(() => {
    if (initialData || externalLoading !== undefined) return;

    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, any> = {
          page,
          limit,
        };
        
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        
        if (customerFilter) {
          params.customerId = customerFilter;
        }
        
        if (serviceFilter) {
          params.serviceId = serviceFilter;
        }
        
        const result = await api.getProjects<ApiResponse<ProjectsData>>(
          params
        );
        
        if (result.success && result.data && 'projects' in result.data && 'pagination' in result.data) {
          setProjects((result.data as ProjectsData).projects);
          setTotalPages((result.data as ProjectsData).pagination.pages);
        } else {
          setError('Error loading project data');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Error loading project data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [initialData, externalLoading, page, limit, statusFilter, customerFilter, serviceFilter]);

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    if (onFilterChange) {
      onFilterChange({ status: e.target.value });
    } else {
      setPage(1); // Reset to first page when filtering
    }
  };

  // Handle customer filter change
  const handleCustomerFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomerFilter(e.target.value);
    if (onFilterChange) {
      onFilterChange({ customerId: e.target.value });
    } else {
      setPage(1); // Reset to first page when filtering
    }
  };

  // Handle service filter change
  const handleServiceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServiceFilter(e.target.value);
    if (onFilterChange) {
      onFilterChange({ serviceId: e.target.value });
    } else {
      setPage(1); // Reset to first page when filtering
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  // Handle project delete
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      const result = await api.deleteProject<DeleteResponse>(projectToDelete.id.toString());
      
      // For delete operations, we may not have data coming back, just success flag
      if (result.success) {
        // Remove the deleted project from the list
        setProjects(prevProjects => 
          prevProjects.filter(p => p.id !== projectToDelete.id)
        );
        setShowDeleteModal(false);
      } else {
        setError('Error deleting project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Error deleting project. Please try again later.');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button 
          className="mt-2 text-red-700 dark:text-red-400 font-medium underline"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    );
  }

  // Render project status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Abgeschlossen
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            In Bearbeitung
          </span>
        );
      case 'on-hold':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Pausiert
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Abgebrochen
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Neu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white py-2 px-3 focus:ring-green-500 focus:border-green-500"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              disabled={loadingFilters}
            >
              <option value="all">Alle Status</option>
              <option value="new">Neu</option>
              <option value="in-progress">In Bearbeitung</option>
              <option value="on-hold">Pausiert</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Abgebrochen</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white py-2 px-3 focus:ring-green-500 focus:border-green-500"
              value={customerFilter}
              onChange={handleCustomerFilterChange}
              disabled={loadingFilters}
            >
              <option value="">Alle Kunden</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white py-2 px-3 focus:ring-green-500 focus:border-green-500"
              value={serviceFilter}
              onChange={handleServiceFilterChange}
              disabled={loadingFilters}
            >
              <option value="">Alle Dienstleistungen</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neues Projekt
          </Link>
        </div>
      </div>
      
      {/* Projects table */}
      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Projekt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kunde
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dienstleistung
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
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Keine Projekte gefunden.
                    {statusFilter !== 'all' || customerFilter || serviceFilter ? (
                      <p className="mt-2">
                        Versuchen Sie, Ihre Filterkriterien anzupassen oder{" "}
                        <button 
                          className="text-green-600 dark:text-green-500 hover:underline"
                          onClick={() => {
                            setStatusFilter('all');
                            setCustomerFilter('');
                            setServiceFilter('');
                            
                            if (onFilterChange) {
                              onFilterChange({ status: 'all', customerId: '', serviceId: '' });
                            }
                          }}
                        >
                          alle Filter zurücksetzen
                        </button>.
                      </p>
                    ) : (
                      <p className="mt-2">
                        <Link 
                          href="/dashboard/projects/new" 
                          className="text-green-600 dark:text-green-500 hover:underline"
                        >
                          Erstellen Sie Ihr erstes Projekt
                        </Link>
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.title}
                      </div>
                      {project.amount !== undefined && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(project.amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.customerName ? (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {project.customerId ? (
                            <Link 
                              href={`/dashboard/customers/${project.customerId}`}
                              className="text-green-600 dark:text-green-500 hover:underline"
                            >
                              {project.customerName}
                            </Link>
                          ) : (
                            project.customerName
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Kein Kunde zugewiesen
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.serviceName ? (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {project.serviceName}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Keine Dienstleistung
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                        <div>
                          {project.startDate ? (
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
                          ) : (
                            <span className="italic">Kein Zeitraum</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="inline-flex items-center">
                        <Link 
                          href={`/dashboard/projects/${project.id}`}
                          className="text-green-600 dark:text-green-500 hover:text-green-900 dark:hover:text-green-400 mr-3"
                          title="Details anzeigen"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </Link>
                        <Link 
                          href={`/dashboard/projects/${project.id}/edit`}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 mr-3"
                          title="Bearbeiten"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button 
                          className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400"
                          title="Löschen"
                          onClick={() => handleDeleteClick(project)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Zeige <span className="font-medium">{(page - 1) * limit + 1}</span> bis <span className="font-medium">{Math.min(page * limit, initialData?.pagination?.total || projects.length)}</span> von{' '}
                  <span className="font-medium">{initialData?.pagination?.total || projects.length}</span> Ergebnissen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Zurück</span>
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === i + 1
                          ? 'z-10 bg-green-50 dark:bg-green-900 border-green-500 dark:border-green-600 text-green-600 dark:text-green-200'
                          : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Weiter</span>
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && projectToDelete && (
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
                      Projekt löschen
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sind Sie sicher, dass Sie das Projekt "{projectToDelete.title}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden und alle zugehörigen Daten gehen verloren.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Löschen
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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