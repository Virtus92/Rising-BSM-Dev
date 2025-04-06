/**
 * Export Service for handling data exports to CSV or Excel
 */

import { fetchApi } from '../api/config';

/**
 * File format options for export
 */
export type ExportFormat = 'csv' | 'excel';

/**
 * Base options for export functionality
 */
export interface ExportOptions {
  format?: ExportFormat;
  filename?: string;
  filters?: Record<string, any>;
}

/**
 * Generic export function for any entity type
 * @param endpoint The API endpoint to fetch export data from
 * @param options Export options including format, filename, and filters
 * @returns Promise that resolves to a Blob of the exported file
 */
export async function exportData(endpoint: string, options: ExportOptions = {}): Promise<Blob> {
  try {
    const { format = 'csv', filters = {}, filename } = options;
    
    // Prepare query params
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    if (filename) {
      queryParams.append('filename', filename);
    }
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    // Make the API request with raw response
    const response = await fetch(`/api${endpoint}/export${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }
    
    // Convert response to blob
    return await response.blob();
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * Export customers data
 * @param options Export options
 * @returns Promise that resolves to a Blob of the exported file
 */
export function exportCustomers(options: ExportOptions = {}): Promise<Blob> {
  return exportData('/customers', {
    filename: 'customers',
    ...options
  });
}

/**
 * Export appointments data
 * @param options Export options
 * @returns Promise that resolves to a Blob of the exported file
 */
export function exportAppointments(options: ExportOptions = {}): Promise<Blob> {
  return exportData('/appointments', {
    filename: 'appointments',
    ...options
  });
}

/**
 * Export projects data
 * @param options Export options
 * @returns Promise that resolves to a Blob of the exported file
 */
export function exportProjects(options: ExportOptions = {}): Promise<Blob> {
  return exportData('/projects', {
    filename: 'projects',
    ...options
  });
}

/**
 * Export requests data
 * @param options Export options
 * @returns Promise that resolves to a Blob of the exported file
 */
export function exportRequests(options: ExportOptions = {}): Promise<Blob> {
  return exportData('/requests', {
    filename: 'requests',
    ...options
  });
}

/**
 * Export invoices data
 * @param options Export options
 * @returns Promise that resolves to a Blob of the exported file
 */
export function exportInvoices(options: ExportOptions = {}): Promise<Blob> {
  return exportData('/invoices', {
    filename: 'invoices',
    ...options
  });
}

/**
 * Helper to download a blob as a file
 * @param blob The file blob to download
 * @param filename Filename without extension
 * @param format File format (extension)
 */
/**
 * Helper to download a blob as a file with a formatted filename that includes date
 * @param blob The file blob to download
 * @param filename Filename without extension
 * @param format File format (extension)
 */
export function downloadBlob(blob: Blob, filename: string, format: ExportFormat = 'csv'): void {
  const extension = format === 'csv' ? 'csv' : 'xlsx';
  // Add date to filename for better organization
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${date}.${extension}`;
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFilename;
  
  // Append to the document
  document.body.appendChild(link);
  
  // Trigger click
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
