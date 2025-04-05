'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Download,
  Search,
  Filter,
  RefreshCw,
  User,
  Building2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { getCustomers, CustomerType, exportCustomers } from './utils/customer-service';
import { useAuth } from '@/providers/AuthProvider';
import CustomerListItem from './components/CustomerListItem';
import CustomerFilterPanel from './components/CustomerFilterPanel';

// Typen für Filter
interface CustomerFilters {
  status?: string;
  type?: string;
  search?: string;
  city?: string;
  postalCode?: string;
  newsletter?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const { hasPermission } = useAuth();

  // Statusvariablen
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Pagination und Filter
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortDirection: 'asc'
  });

  // Initialisierung der Filter aus URL-Parametern
  useEffect(() => {
    const initialFilters: CustomerFilters = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      sortBy: searchParams.get('sortBy') || 'name',
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'
    };

    // Optionale Filter hinzufügen, wenn sie in der URL vorhanden sind
    const optionalParams = [
      'status', 'type', 'search', 'city', 'postalCode', 'startDate', 'endDate'
    ];
    
    optionalParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        (initialFilters as any)[param] = value;
      }
    });

    // Boolean für Newsletter
    const newsletter = searchParams.get('newsletter');
    if (newsletter) {
      initialFilters.newsletter = newsletter === 'true';
    }

    setFilters(initialFilters);
  }, [searchParams]);

  // Funktion zum Laden der Kundendaten
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCustomers(filters);
      
      if (response.success && response.data) {
        setCustomers(response.data);
        
        // Pagination-Informationen setzen, wenn vorhanden
        if (response.meta?.pagination) {
          setTotalPages(response.meta.pagination.total || 1);
          setTotalCustomers(response.meta.pagination.totalRecords || 0);
        }
      } else {
        setError('Fehler beim Laden der Kundendaten');
      }
    } catch (err) {
      console.error('Fehler beim Laden der Kunden:', err);
      setError('Die Kundendaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Laden der Kunden bei Änderung der Filter
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Filter aktualisieren und in URL synchronisieren
  const updateFilters = useCallback((newFilters: Partial<CustomerFilters>) => {
    // Kombinieren der aktuellen Filter mit den neuen
    const updatedFilters = { ...filters, ...newFilters };
    
    // Wenn sich der Suchbegriff oder Filter ändert, zurück zur ersten Seite
    if ('search' in newFilters || 'status' in newFilters || 'type' in newFilters) {
      updatedFilters.page = 1;
    }
    
    setFilters(updatedFilters);
    
    // URL-Parameter aktualisieren
    const params = new URLSearchParams();
    
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value));
      }
    });
    
    const newUrl = `/dashboard/customers?${params.toString()}`;
    router.push(newUrl);
  }, [filters, router]);

  // Kunden exportieren
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExportLoading(true);
      await exportCustomers({ ...filters, format });
    } catch (err) {
      console.error('Fehler beim Exportieren der Kunden:', err);
      setError('Der Export konnte nicht abgeschlossen werden.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header mit Titel und Aktionen */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kunden</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verwalten Sie Ihre Kundendaten und -informationen
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Suchfeld */}
          <div className="relative flex-grow max-w-sm">
            <input
              type="search"
              placeholder="Kunden suchen..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            </div>
          </div>
          
          {/* Filter-Button */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            Filter
          </button>
          
          {/* Export-Button */}
          <div className="dropdown dropdown-end">
            <button 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              disabled={exportLoading}
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Exportieren
            </button>
            <ul className="dropdown-content z-[1] menu p-2 shadow bg-white dark:bg-slate-800 rounded-md w-52">
              <li><button onClick={() => handleExport('csv')}>Als CSV exportieren</button></li>
              <li><button onClick={() => handleExport('excel')}>Als Excel exportieren</button></li>
            </ul>
          </div>
          
          {/* Neuer Kunde Button */}
          {hasPermission(['admin', 'manager', 'mitarbeiter']) && (
            <button
              onClick={() => router.push('/dashboard/customers/new')}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Neuer Kunde
            </button>
          )}
        </div>
      </div>
      
      {/* Filter-Panel */}
      {filterOpen && (
        <CustomerFilterPanel 
          filters={filters} 
          onUpdateFilters={updateFilters} 
          onClose={() => setFilterOpen(false)} 
        />
      )}
      
      {/* Fehlermeldung */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Fehler</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            <button 
              onClick={loadCustomers}
              className="mt-2 flex items-center text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Erneut versuchen
            </button>
          </div>
        </div>
      )}
      
      {/* Kundenliste */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-green-600 dark:text-green-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Kundendaten werden geladen...</p>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 flex justify-center">
            <div className="flex flex-col items-center max-w-md text-center">
              <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-full mb-4">
                {filters.type === 'business' ? (
                  <Building2 className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                ) : (
                  <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Keine Kunden gefunden</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {filters.search || filters.status || filters.type || filters.city || filters.postalCode 
                  ? 'Es wurden keine Kunden gefunden, die Ihren Filterkriterien entsprechen.'
                  : 'Sie haben noch keine Kunden angelegt.'}
              </p>
              
              {hasPermission(['admin', 'manager', 'mitarbeiter']) && (
                <button
                  onClick={() => router.push('/dashboard/customers/new')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Kunden anlegen
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tabellenkopf */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-5 md:col-span-3">Kunde</div>
                <div className="col-span-4 md:col-span-3 hidden md:block">E-Mail</div>
                <div className="col-span-3 md:col-span-2 hidden md:block">Telefon</div>
                <div className="col-span-3 md:col-span-2">Stadt</div>
                <div className="col-span-4 md:col-span-2 text-right">Status</div>
              </div>
            </div>
            
            {/* Kundenliste */}
            <div>
              {customers.map((customer) => (
                <CustomerListItem
                  key={customer.id}
                  customer={customer}
                  onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Zeige <span className="font-medium">{(filters.page! - 1) * filters.limit! + 1}</span> bis{' '}
                    <span className="font-medium">
                      {Math.min(filters.page! * filters.limit!, totalCustomers)}
                    </span>{' '}
                    von <span className="font-medium">{totalCustomers}</span> Einträgen
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateFilters({ page: Math.max(1, (filters.page || 1) - 1) })}
                    disabled={filters.page === 1}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={() => updateFilters({ page: Math.min(totalPages, (filters.page || 1) + 1) })}
                    disabled={filters.page === totalPages}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
