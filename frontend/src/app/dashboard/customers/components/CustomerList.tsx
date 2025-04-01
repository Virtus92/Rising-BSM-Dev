'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, ChevronDown, MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react';
import * as api from '@/lib/api';

// Types
interface Customer {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: string;
  type: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface CustomerListProps {
  initialData?: {
    customers: Customer[];
    pagination: Pagination;
  };
  loading?: boolean;
  error?: string | null;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
}

export default function CustomerList({ 
  initialData, 
  loading: externalLoading, 
  error: externalError,
  onPageChange,
  onFilterChange
}: CustomerListProps) {
  // State
  const [customers, setCustomers] = useState<Customer[]>(initialData?.customers || []);
  const [loading, setLoading] = useState(externalLoading !== undefined ? externalLoading : !initialData);
  const [error, setError] = useState<string | null>(externalError !== undefined ? externalError : null);
  const [page, setPage] = useState(initialData?.pagination?.page || 1);
  const [limit] = useState(initialData?.pagination?.limit || 10);
  const [totalPages, setTotalPages] = useState(initialData?.pagination?.pages || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Update state when props change
  useEffect(() => {
    if (initialData) {
      setCustomers(initialData.customers);
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

  // Fetch customers data if no external data provided
  useEffect(() => {
    if (initialData || externalLoading !== undefined) return;

    async function fetchCustomers() {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, any> = {
          page,
          limit,
        };
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        
        if (typeFilter !== 'all') {
          params.type = typeFilter;
        }
        
        const result = await api.getCustomers(params);
        
        if (result.success) {
          setCustomers(result.data.customers);
          setTotalPages(result.data.pagination.pages);
        } else {
          setError('Fehler beim Laden der Kundendaten');
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Fehler beim Laden der Kundendaten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [initialData, externalLoading, page, limit, searchQuery, statusFilter, typeFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onFilterChange) {
      onFilterChange({ search: e.target.value });
    } else {
      setPage(1); // Reset to first page when searching
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    if (onFilterChange) {
      onFilterChange({ status: e.target.value });
    } else {
      setPage(1); // Reset to first page when filtering
    }
  };

  // Handle type filter change
  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
    if (onFilterChange) {
      onFilterChange({ type: e.target.value });
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

  // Handle customer delete
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      const result = await api.deleteCustomer(customerToDelete.id.toString());
      
      if (result.success) {
        // Remove the deleted customer from the list
        setCustomers(prevCustomers => 
          prevCustomers.filter(c => c.id !== customerToDelete.id)
        );
        setShowDeleteModal(false);
      } else {
        setError('Fehler beim Löschen des Kunden');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Fehler beim Löschen des Kunden. Bitte versuchen Sie es später erneut.');
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
          Seite neu laden
        </button>
      </div>
    );
  }

  // Render customer status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Aktiv
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Inaktiv
          </span>
        );
      case 'lead':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Lead
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

  // Render customer type badge
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'business':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
            Geschäftskunde
          </span>
        );
      case 'private':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Privatkunde
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Kunden suchen..."
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500 w-full sm:w-64"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white py-2 px-3 focus:ring-green-500 focus:border-green-500"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white py-2 px-3 focus:ring-green-500 focus:border-green-500"
              value={typeFilter}
              onChange={handleTypeFilterChange}
            >
              <option value="all">Alle Typen</option>
              <option value="business">Geschäftskunden</option>
              <option value="private">Privatkunden</option>
            </select>
          </div>
          
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Link>
        </div>
      </div>
      
      {/* Customers table */}
      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kontakt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Typ
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Keine Kunden gefunden.
                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
                      <p className="mt-2">
                        Versuchen Sie, Ihre Filterkriterien anzupassen oder{" "}
                        <button 
                          className="text-green-600 dark:text-green-500 hover:underline"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setTypeFilter('all');
                            
                            if (onFilterChange) {
                              onFilterChange({ search: '', status: 'all', type: 'all' });
                            }
                          }}
                        >
                          alle Filter zurücksetzen
                        </button>.
                      </p>
                    ) : (
                      <p className="mt-2">
                        <Link 
                          href="/dashboard/customers/new" 
                          className="text-green-600 dark:text-green-500 hover:underline"
                        >
                          Erstellen Sie Ihren ersten Kunden
                        </Link>
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          {customer.company && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.email && (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(customer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderTypeBadge(customer.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="inline-flex items-center">
                        <Link 
                          href={`/dashboard/customers/${customer.id}`}
                          className="text-green-600 dark:text-green-500 hover:text-green-900 dark:hover:text-green-400 mr-3"
                          title="Details anzeigen"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </Link>
                        <Link 
                          href={`/dashboard/customers/${customer.id}/edit`}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 mr-3"
                          title="Bearbeiten"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button 
                          className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400"
                          title="Löschen"
                          onClick={() => handleDeleteClick(customer)}
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
                  Zeige <span className="font-medium">{(page - 1) * limit + 1}</span> bis <span className="font-medium">{Math.min(page * limit, initialData?.pagination.total || customers.length)}</span> von{' '}
                  <span className="font-medium">{initialData?.pagination.total || customers.length}</span> Ergebnissen
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
      {showDeleteModal && customerToDelete && (
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
                        Sind Sie sicher, dass Sie den Kunden "{customerToDelete.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden und alle zugehörigen Daten gehen verloren.
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