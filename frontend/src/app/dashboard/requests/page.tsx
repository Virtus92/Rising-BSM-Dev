'use client';

import { useState, useEffect } from 'react';
import * as api from '@/lib/api';
import { ApiResponse, Request } from '@/lib/api/types';
import { useSettings } from '@/contexts/SettingsContext';
import { exportRequests, downloadBlob } from '@/lib/export/exportService';
import { PlusCircle, Download, Filter } from 'lucide-react';

export default function RequestsPage() {
  const { settings } = useSettings();
  const [requests, setRequests] = useState<Request[]>([]);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        // Echte API-Anfrage
        const response = await api.getRequests();
        console.log('API Response:', response);
        
        // Flexible Verarbeitung verschiedener API-Antwortformate
        if (response.success && response.data) {
          if (Array.isArray(response.data.requests)) {
            // Format: { requests: [...] }
            setRequests(response.data.requests);
          } else if (Array.isArray(response.data)) {
            // Format: [...]
            setRequests(response.data);
          } else if (typeof response.data === 'object') {
            // Suche in allen Properties nach einem Array
            const possibleRequests = Object.values(response.data).find(val => Array.isArray(val));
            if (possibleRequests) {
              setRequests(possibleRequests as Request[]);
            } else {
              // Wenn kein Array gefunden wurde, setze einen leeren Array
              setRequests([]);
              console.warn('Keine Requests-Daten in der API-Antwort gefunden');
            }
          } else {
            setRequests([]);
            console.warn('Keine Requests-Daten in der API-Antwort gefunden');
          }
        } else if (response.success) {
          // Erfolg, aber keine Daten
          setRequests([]);
          console.log('Success message:', response.message);
        } else {
          // Fehler mit Nachricht
          setError(response.message || 'Fehler beim Laden der Anfragen.');
        }
      } catch (err: any) {
        console.error('Error loading requests:', err);
        setError(err.message || 'Error loading requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadRequests();
  }, []);

  // Format status for display
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'new': 'New',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'pending': 'Pending'
    };
    
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };
  
  // Get status styling based on status value
  const getStatusStyles = (status: string): string => {
    const styleMap: Record<string, string> = {
      'new': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      'in_progress': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
      'completed': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
      'cancelled': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400',
      'pending': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'
    };
    
    return styleMap[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };
  
  // Export data function
  const exportRequestsData = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);
      const blob = await exportRequests({ format });
      downloadBlob(blob, 'requests', format);
    } catch (error) {
      console.error('Failed to export requests:', error);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requests</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => exportRequestsData('csv')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => exportRequestsData('excel')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300">No requests available.</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            There are currently no requests to process.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{request.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{request.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{request.service || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.createdAt).toLocaleDateString('en-US')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(request.status)}`}>
                        {formatStatus(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={`/dashboard/requests/${request.id}`} className="text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400">Details</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}