import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { customerService } from '../../api/services/customerService';
import { Customer, Project, Appointment } from '../../types';
import React from 'react';
import { ArrowLeft, Edit, Calendar, Briefcase, Phone, Mail, MapPin, Building, Clock, AlertTriangle } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        const customerData = await customerService.getById(parseInt(id));
        setCustomer(customerData);
        
        // For a real app, these would be additional API calls
        // Here we're simulating the project and appointment data
        setProjects(customerData.projects || []);
        setAppointments(customerData.appointments || []);
      } catch (err: any) {
        console.error('Error fetching customer data:', err);
        setError(err.message || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id]);

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

  if (!customer) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 mb-4">
        <AlertTriangle className="inline-block mr-2" size={20} />
        Kunde nicht gefunden
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard/customers')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {customer.firstName} {customer.lastName}
          </h1>
        </div>
        <div>
          <Link
            to={`/dashboard/customers/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit size={16} className="mr-2" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Kundendaten</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customer.company && (
              <div className="col-span-2">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-500 mr-2">Unternehmen:</span>
                  <span className="font-medium">{customer.company}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">E-Mail:</span>
              <a href={`mailto:${customer.email}`} className="text-primary-600 hover:text-primary-800">
                {customer.email}
              </a>
            </div>
            
            {customer.phone && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500 mr-2">Telefon:</span>
                <a href={`tel:${customer.phone}`} className="text-primary-600 hover:text-primary-800">
                  {customer.phone}
                </a>
              </div>
            )}
            
            {(customer.address || customer.city) && (
              <div className="col-span-2">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <span className="text-gray-500 mr-2">Adresse:</span>
                  <span>
                    {customer.address && <div>{customer.address}</div>}
                    {customer.city && (
                      <div>
                        {customer.postalCode} {customer.city}
                        {customer.country && `, ${customer.country}`}
                      </div>
                    )}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Kunde seit:</span>
              <span>{new Date(customer.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                customer.status === 'aktiv' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {customer.status === 'aktiv' ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
          </div>
          
          {customer.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notizen</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Projekte</h2>
          <Link
            to={`/dashboard/projects/neu?kunde_id=${id}`}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
          >
            Projekt anlegen
          </Link>
        </div>
        <div className="px-6 py-5">
          {projects && projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeitraum</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.title}</div>
                        {project.service_name && (
                          <div className="text-sm text-gray-500">{project.service_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(project.startDate).toLocaleDateString('de-DE')}
                          {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('de-DE')}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.statusClass === 'success' ? 'bg-green-100 text-green-800' :
                          project.statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          project.statusClass === 'danger' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {project.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/dashboard/projects/${project.id}`} className="text-primary-600 hover:text-primary-900">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>Keine Projekte vorhanden</p>
              <Link
                to={`/dashboard/projects/neu?kunde_id=${id}`}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Erstes Projekt anlegen
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Termine</h2>
          <Link
            to={`/dashboard/appointments/neu?kunde_id=${id}`}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
          >
            Termin anlegen
          </Link>
        </div>
        <div className="px-6 py-5">
          {appointments && appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{appointment.titel}</div>
                        {appointment.projekt_titel && (
                          <div className="text-sm text-gray-500">{appointment.projekt_titel}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.dateFormatted}</div>
                        <div className="text-sm text-gray-500">{appointment.timeFormatted}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.statusClass === 'success' ? 'bg-green-100 text-green-800' :
                          appointment.statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.statusClass === 'danger' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/dashboard/appointments/${appointment.id}`} className="text-primary-600 hover:text-primary-900">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>Keine Termine vorhanden</p>
              <Link
                to={`/dashboard/appointments/neu?kunde_id=${id}`}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Ersten Termin anlegen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;