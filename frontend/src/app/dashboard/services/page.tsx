'use client';

import { useState, useEffect } from 'react';
import { toggleServiceStatus, getServices } from '@/lib/api';
import { ApiResponse, Service } from '@/lib/api/types';
import Modal from '@/components/shared/Modal';
import ServiceForm from '@/components/services/ServiceForm';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  
  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const response = await getServices();
        
        if (response.success && response.data) {
          let serviceData = [];
          
          if (response.data.services) {
            serviceData = response.data.services;
          } else if (Array.isArray(response.data)) {
            serviceData = response.data;
          }
          
          setServices(serviceData);
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
  
  // Handle service status toggle
  const handleStatusToggle = async (serviceId: number, newStatus: boolean) => {
    try {
      const response = await toggleServiceStatus(serviceId, { active: newStatus });
      
      if (response.success) {
        // Update the service in the list
        setServices(prevServices => {
          return prevServices.map(service => {
            if (service.id === serviceId) {
              return { ...service, active: newStatus };
            }
            return service;
          });
        });
        
        setShowStatusChangeModal(false);
        setSelectedServiceId(null);
      } else {
        setError(response.message || 'Fehler beim Ändern des Service-Status');
      }
    } catch (err) {
      console.error('Error toggling service status:', err);
      setError('Fehler beim Ändern des Service-Status. Bitte versuchen Sie es später erneut.');
    }
  };
  
  // Open edit modal
  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowEditModal(true);
  };
  
  // Open status change modal
  const handleStatusChangeClick = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setShowStatusChangeModal(true);
  };
  
  // Handle service update success
  const handleServiceUpdated = (updatedService: any) => {
    // Update the service in the list
    setServices(prevServices => {
      return prevServices.map(service => {
        if (service.id === updatedService.id || updatedService.service?.id === service.id) {
          const serviceData = updatedService.service || updatedService;
          return { ...service, ...serviceData };
        }
        return service;
      });
    });
    
    // Close the edit modal
    setShowEditModal(false);
    setEditingService(null);
  };
  
  // Filter services based on active status
  const filteredServices = showInactive 
    ? services 
    : services.filter(service => service.active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leistungen</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={() => setShowInactive(!showInactive)}
              className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Inaktive anzeigen</span>
          </label>
          <a
            href="/dashboard/services/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Neue Leistung
          </a>
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
      ) : filteredServices.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            {showInactive
              ? 'Keine Leistungen vorhanden.'
              : 'Keine aktiven Leistungen vorhanden.'}
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {showInactive
              ? 'Erstellen Sie Ihre erste Leistung, um Ihr Angebot zu definieren.'
              : 'Erstellen Sie eine neue Leistung oder aktivieren Sie existierende Leistungen.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div key={service.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden ${!service.active ? 'border-l-4 border-yellow-500' : ''}`}>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {service.name}
                  </h3>
                  {!service.active && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
                      Inaktiv
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {service.description || 'Keine Beschreibung verfügbar'}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    €{service.basePrice.toFixed(2)}
                  </span>
                  <div>
                    <button 
                      onClick={() => handleEdit(service)} 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 mr-2"
                    >
                      Bearbeiten
                    </button>
                    <button 
                      onClick={() => handleStatusChangeClick(service.id)}
                      className={`${service.active ? 'text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400' : 'text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400'}`}
                    >
                      {service.active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingService(null);
        }}
        title="Leistung bearbeiten"
        size="lg"
      >
        {editingService && (
          <ServiceForm
            service={editingService}
            onSuccess={handleServiceUpdated}
            onCancel={() => {
              setShowEditModal(false);
              setEditingService(null);
            }}
          />
        )}
      </Modal>
      
      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusChangeModal}
        onClose={() => {
          setShowStatusChangeModal(false);
          setSelectedServiceId(null);
        }}
        title="Status ändern"
        size="sm"
      >
        {selectedServiceId !== null && (
          <div className="p-4">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              {services.find(s => s.id === selectedServiceId)?.active 
                ? 'Möchten Sie diese Leistung wirklich deaktivieren?'
                : 'Möchten Sie diese Leistung wirklich aktivieren?'}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowStatusChangeModal(false);
                  setSelectedServiceId(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  const service = services.find(s => s.id === selectedServiceId);
                  if (service) {
                    handleStatusToggle(selectedServiceId, !service.active);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Bestätigen
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}