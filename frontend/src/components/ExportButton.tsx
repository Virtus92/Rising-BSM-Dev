import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileX, ChevronDown } from 'lucide-react';
import { 
  exportCustomers, 
  exportAppointments, 
  exportProjects, 
  exportRequests,
  exportInvoices,
  downloadBlob,
  ExportFormat,
  ExportOptions
} from '@/lib/export/exportService';
import { toast } from 'sonner';

type EntityType = 'customers' | 'appointments' | 'projects' | 'requests' | 'invoices';

interface ExportButtonProps {
  entityType: EntityType;
  filters?: Record<string, any>;
  className?: string;
  buttonText?: string;
  dropdownPosition?: 'left' | 'right';
}

const exportFunctions: Record<EntityType, (options: ExportOptions) => Promise<Blob>> = {
  customers: exportCustomers,
  appointments: exportAppointments,
  projects: exportProjects,
  requests: exportRequests,
  invoices: exportInvoices
};

const entityNames: Record<EntityType, string> = {
  customers: 'Kunden',
  appointments: 'Termine',
  projects: 'Projekte',
  requests: 'Anfragen',
  invoices: 'Rechnungen'
};

export default function ExportButton({
  entityType,
  filters = {},
  className = '',
  buttonText,
  dropdownPosition = 'right'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setIsOpen(false);
    
    try {
      const entityName = entityNames[entityType] || entityType;
      const exportFn = exportFunctions[entityType];
      
      if (!exportFn) {
        throw new Error(`Export function not found for entity type: ${entityType}`);
      }
      
      // Start loading toast
      const loadingToast = toast.loading(`${entityName} werden exportiert...`);
      
      const blob = await exportFn({
        format,
        filters
      });
      
      // Download the file
      downloadBlob(blob, entityType, format);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`${entityName} erfolgreich exportiert`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export fehlgeschlagen: ${(error as Error).message || 'Unbekannter Fehler'}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Exportiere...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            {buttonText || 'Exportieren'}
            <ChevronDown className="h-4 w-4 ml-1" />
          </>
        )}
      </button>
      
      {isOpen && (
        <div 
          className={`origin-top-${dropdownPosition} absolute ${dropdownPosition}-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
              role="menuitem"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
              Als CSV exportieren
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
              role="menuitem"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-500" />
              Als Excel exportieren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
