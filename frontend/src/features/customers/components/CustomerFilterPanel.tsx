'use client';

import { X } from 'lucide-react';

// Definieren des Filter-Typs
interface CustomerFilters {
  status?: string;
  type?: string;
  city?: string;
  postalCode?: string;
  newsletter?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  search?: string;
}

interface CustomerFilterPanelProps {
  filters: CustomerFilters;
  onUpdateFilters: (filters: Partial<CustomerFilters>) => void;
  onClose: () => void;
}

/**
 * Filterpanel für die Kundenlistenansicht
 * 
 * Ermöglicht die Filterung und Sortierung der Kundenliste
 */
const CustomerFilterPanel: React.FC<CustomerFilterPanelProps> = ({ 
  filters, 
  onUpdateFilters, 
  onClose 
}) => {
  // Funktion zum Zurücksetzen aller Filter
  const resetFilters = () => {
    onUpdateFilters({
      status: undefined,
      type: undefined,
      city: undefined,
      postalCode: undefined,
      newsletter: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: 'name',
      sortDirection: 'asc',
      page: 1
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-5 mb-6 relative">
      {/* Schließen-Button und Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Sortierung</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Schließen</span>
        </button>
      </div>
      
      {/* Filteroptionen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status-Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) => onUpdateFilters({ status: e.target.value || undefined })}
            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          >
            <option value="">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="deleted">Gelöscht</option>
          </select>
        </div>
        
        {/* Kundentyp-Filter */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kundentyp
          </label>
          <select
            id="type-filter"
            value={filters.type || ''}
            onChange={(e) => onUpdateFilters({ type: e.target.value || undefined })}
            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          >
            <option value="">Alle Typen</option>
            <option value="private">Privatkunden</option>
            <option value="business">Geschäftskunden</option>
          </select>
        </div>
        
        {/* Stadt-Filter */}
        <div>
          <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stadt
          </label>
          <input
            id="city-filter"
            type="text"
            value={filters.city || ''}
            onChange={(e) => onUpdateFilters({ city: e.target.value || undefined })}
            placeholder="Stadt eingeben"
            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          />
        </div>
        
        {/* PLZ-Filter */}
        <div>
          <label htmlFor="postal-code-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Postleitzahl
          </label>
          <input
            id="postal-code-filter"
            type="text"
            value={filters.postalCode || ''}
            onChange={(e) => onUpdateFilters({ postalCode: e.target.value || undefined })}
            placeholder="PLZ eingeben"
            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          />
        </div>
        
        {/* Newsletter-Filter */}
        <div>
          <label htmlFor="newsletter-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Newsletter
          </label>
          <select
            id="newsletter-filter"
            value={filters.newsletter === undefined ? '' : String(filters.newsletter)}
            onChange={(e) => {
              const value = e.target.value;
              onUpdateFilters({ 
                newsletter: value === '' ? undefined : value === 'true' 
              });
            }}
            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          >
            <option value="">Alle</option>
            <option value="true">Abonniert</option>
            <option value="false">Nicht abonniert</option>
          </select>
        </div>
        
        {/* Sortierung */}
        <div>
          <label htmlFor="sort-by-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sortieren nach
          </label>
          <div className="flex space-x-2">
            <select
              id="sort-by-filter"
              value={filters.sortBy || 'name'}
              onChange={(e) => onUpdateFilters({ sortBy: e.target.value })}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option value="name">Name</option>
              <option value="email">E-Mail</option>
              <option value="company">Firma</option>
              <option value="city">Stadt</option>
              <option value="status">Status</option>
              <option value="createdAt">Erstelldatum</option>
            </select>
            <select
              value={filters.sortDirection || 'asc'}
              onChange={(e) => onUpdateFilters({ sortDirection: e.target.value as 'asc' | 'desc' })}
              className="border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option value="asc">Aufsteigend</option>
              <option value="desc">Absteigend</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Zeitraum-Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Erstellt von
          </label>
          <input
            id="start-date-filter"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onUpdateFilters({ startDate: e.target.value || undefined })}
            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Erstellt bis
          </label>
          <input
            id="end-date-filter"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onUpdateFilters({ endDate: e.target.value || undefined })}
            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      
      {/* Footer mit Zurücksetzen und Schließen Buttons */}
      <div className="flex justify-end space-x-2 mt-6">
        <button
          onClick={resetFilters}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          Filter zurücksetzen
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Anwenden
        </button>
      </div>
    </div>
  );
};

export default CustomerFilterPanel;