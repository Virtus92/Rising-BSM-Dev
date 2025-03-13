import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService } from '../../api/services/projectService';
import { Project, Appointment } from '../../types'; 
import React from 'react';
import { ArrowLeft, Edit, Calendar, CreditCard, User, Clock, Tag, AlertTriangle, FileText } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        const projectData = await projectService.getById(parseInt(id));
        setProject(projectData);
        
        // In a real application, you would fetch appointments related to this project
        // For now, we'll use mock data if available or an empty array
        setAppointments(projectData.appointments || []);
      } catch (err: any) {
        console.error('Error fetching project data:', err);
        setError(err.message || 'Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
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

  if (!project) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 mb-4">
        <AlertTriangle className="inline-block mr-2" size={20} />
        Projekt nicht gefunden
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard/projects')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {project.title}
          </h1>
        </div>
        <div>
          <Link
            to={`/dashboard/projects/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit size={16} className="mr-2" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Project Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Projektdaten</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Kunde:</span>
              <Link to={`/dashboard/customers/${project.customer_id}`} className="text-primary-600 hover:text-primary-800">
                {project.customer_name}
              </Link>
            </div>
            
            {project.service_name && (
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500 mr-2">Dienstleistung:</span>
                <span>{project.service_name}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Zeitraum:</span>
              <span>
                {new Date(project.startDate).toLocaleDateString('de-DE')}
                {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('de-DE')}`}
              </span>
            </div>
            
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Betrag:</span>
              <span>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(project.amount)}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                project.statusClass === 'success' ? 'bg-green-100 text-green-800' :
                project.statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                project.statusClass === 'danger' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {project.statusLabel}
              </span>
            </div>
            
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Erstellt am:</span>
              <span>{new Date(project.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
          
          {project.description && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Beschreibung</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{project.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Termine</h2>
          <Link
            to={`/dashboard/appointments/neu?projekt_id=${id}&kunde_id=${project.customer_id}`}
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
                to={`/dashboard/appointments/neu?projekt_id=${id}&kunde_id=${project.customer_id}`}
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

export default ProjectDetail;