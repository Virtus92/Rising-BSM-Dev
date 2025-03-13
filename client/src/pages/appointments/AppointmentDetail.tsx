import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { appointmentService } from '../../api/services/appointmentService';
import { Appointment } from '../../types';
import React from 'react';
import { ArrowLeft, Edit, Calendar, Clock, MapPin, User, Briefcase, FileText, AlertTriangle } from 'lucide-react';

const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        const appointmentData = await appointmentService.getById(parseInt(id));
        setAppointment(appointmentData);
      } catch (err: any) {
        console.error('Error fetching appointment data:', err);
        setError(err.message || 'Failed to load appointment data');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentData();
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

  if (!appointment) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 mb-4">
        <AlertTriangle className="inline-block mr-2" size={20} />
        Termin nicht gefunden
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard/termine')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {appointment.titel}
          </h1>
        </div>
        <div>
          <Link
            to={`/dashboard/termine/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit size={16} className="mr-2" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Appointment Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Termindaten</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Kunde:</span>
              <Link to={`/dashboard/customers/${appointment.kunde_id}`} className="text-primary-600 hover:text-primary-800">
                {appointment.kunde_name}
              </Link>
            </div>
            
            {appointment.projekt_id && (
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500 mr-2">Projekt:</span>
                <Link to={`/dashboard/projekte/${appointment.projekt_id}`} className="text-primary-600 hover:text-primary-800">
                  {appointment.projekt_titel}
                </Link>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Datum:</span>
              <span>{appointment.dateFormatted}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Uhrzeit:</span>
              <span>{appointment.timeFormatted}</span>
              <span className="ml-2 text-gray-500">
                ({Math.floor(appointment.dauer / 60)}h {appointment.dauer % 60 > 0 ? `${appointment.dauer % 60}min` : ''})
              </span>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Ort:</span>
              <span>{appointment.ort}</span>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                appointment.statusClass === 'success' ? 'bg-green-100 text-green-800' :
                appointment.statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                appointment.statusClass === 'danger' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {appointment.statusLabel}
              </span>
            </div>
            
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Erstellt am:</span>
              <span>{new Date(appointment.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
          
          {appointment.beschreibung && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Beschreibung</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{appointment.beschreibung}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Status aktualisieren</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                try {
                  if (!id) return;
                  await appointmentService.updateStatus(parseInt(id), 'geplant');
                  const updatedAppointment = await appointmentService.getById(parseInt(id));
                  setAppointment(updatedAppointment);
                } catch (err) {
                  console.error('Error updating status:', err);
                }
              }}
              disabled={appointment.status === 'geplant'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                appointment.status === 'geplant'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Geplant
            </button>
            
            <button
              onClick={async () => {
                try {
                  if (!id) return;
                  await appointmentService.updateStatus(parseInt(id), 'bestaetigt');
                  const updatedAppointment = await appointmentService.getById(parseInt(id));
                  setAppointment(updatedAppointment);
                } catch (err) {
                  console.error('Error updating status:', err);
                }
              }}
              disabled={appointment.status === 'bestaetigt'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                appointment.status === 'bestaetigt'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Bestätigt
            </button>
            
            <button
              onClick={async () => {
                try {
                  if (!id) return;
                  await appointmentService.updateStatus(parseInt(id), 'abgeschlossen');
                  const updatedAppointment = await appointmentService.getById(parseInt(id));
                  setAppointment(updatedAppointment);
                } catch (err) {
                  console.error('Error updating status:', err);
                }
              }}
              disabled={appointment.status === 'abgeschlossen'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                appointment.status === 'abgeschlossen'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Abgeschlossen
            </button>
            
            <button
              onClick={async () => {
                try {
                  if (!id) return;
                  await appointmentService.updateStatus(parseInt(id), 'storniert');
                  const updatedAppointment = await appointmentService.getById(parseInt(id));
                  setAppointment(updatedAppointment);
                } catch (err) {
                  console.error('Error updating status:', err);
                }
              }}
              disabled={appointment.status === 'storniert'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                appointment.status === 'storniert'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Storniert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;