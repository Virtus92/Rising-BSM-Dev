import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serviceService } from '../../api/services/serviceService';
import { Service } from '../../types';
import React from 'react';
import { ArrowLeft, Edit, AlertTriangle, Tag, DollarSign, Percent } from 'lucide-react';

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        const serviceData = await serviceService.getById(parseInt(id));
        setService(serviceData);
      } catch (err: any) {
        console.error('Error fetching service data:', err);
        setError(err.message || 'Failed to load service data');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [id]);

  const handleToggleStatus = async () => {
    try {
      if (!id || !service) return;
      
      await serviceService.update(parseInt(id), {
        ...service,
        active: !service.active
      });
      
      // Refresh service data
      const updatedService = await serviceService.getById(parseInt(id));
      setService(updatedService);
    } catch (err: any) {
      console.error('Error toggling service status:', err);
      setError(err.message || 'Failed to update service status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
        <AlertTriangle className="inline-block mr-2" size={20} />
        {error}
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 mb-4">
        <AlertTriangle className="inline-block mr-2" size={20} />
        Dienstleistung nicht gefunden
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard/dienste')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {service.name}
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              service.active 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            {service.active ? 'Deaktivieren' : 'Aktivieren'}
          </button>
          <Link
            to={`/dashboard/dienste/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit size={16} className="mr-2" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Service Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Dienstleistungsdaten</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <Tag className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Name:</span>
              <span className="font-medium">{service.name}</span>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Preis:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(service.priceBase)}
                {service.unit && ` / ${service.unit}`}
              </span>
            </div>
            
            <div className="flex items-center">
              <Percent className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">MwSt-Satz:</span>
              <span className="font-medium">{service.vatRate}%</span>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                service.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {service.active ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
          </div>
          
          {service.description && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Beschreibung</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{service.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Projects using this service */}
      {service.projects && service.projects.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Zugehörige Projekte</h2>
          </div>
          <div className="px-6 py-5">
            <ul className="divide-y divide-gray-200">
              {service.projects.map(project => (
                <li key={project.id} className="py-3">
                  <Link to={`/dashboard/projekte/${project.id}`} className="block hover:bg-gray-50 -mx-6 px-6 py-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.title}</p>
                        <p className="text-sm text-gray-500">{project.customer_name}</p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.statusClass === 'success' ? 'bg-green-100 text-green-800' :
                        project.statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        project.statusClass === 'danger' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {project.statusLabel}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;