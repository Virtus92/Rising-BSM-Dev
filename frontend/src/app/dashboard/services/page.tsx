'use client';

import { useState, useEffect } from 'react';
import * as api from '@/lib/api';
import { ApiResponse, Service } from '@/lib/api/types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const response = await api.getServices({ active: true });
        
        if (response.success && response.data) {
          setServices(Array.isArray(response.data) ? response.data : []);
        } else {
          setError(response.message || 'Fehler beim Laden der Leistungen');
        }
      } catch (err) {
        console.error('Error loading services:', err);
        setError('Fehler beim Laden der Leistungen. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadServices();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leistungen</h1>
        <a
          href="/dashboard/services/new"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Neue Leistung
        </a>
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
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300">Keine Leistungen vorhanden.</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Erstellen Sie Ihre erste Leistung, um Ihr Angebot zu definieren.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {service.description || 'Keine Beschreibung verfügbar'}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    €{service.basePrice.toFixed(2)}
                  </span>
                  <div>
                    <a 
                      href={`/dashboard/services/${service.id}/edit`} 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-500 mr-2"
                    >
                      Bearbeiten
                    </a>
                    <button className="text-red-600 hover:text-red-800 dark:text-red-500">
                      {service.active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}