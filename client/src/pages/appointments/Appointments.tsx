import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { appointmentService } from '../../api/services/appointmentService';
import { AppointmentModel } from '../../types/appointment';

const Appointments = () => {
  const [appointments, setAppointments] = useState<AppointmentModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const response = await appointmentService.getAll();
        if (response && response.data) {
          setAppointments(response.data);
        } else {
          // Handle empty response properly
          setAppointments([]);
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again later.');
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = appointments ? appointments.filter(appointment => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'upcoming') {
      return new Date(appointment.termin_datum) >= new Date();
    }
    return appointment.status === activeFilter;
  }) : [];

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <Link
          to="/dashboard/termine/neu"
          className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded"
        >
          New Appointment
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleFilterChange('all')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeFilter === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('upcoming')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeFilter === 'upcoming'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => handleFilterChange('geplant')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeFilter === 'geplant'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Planned
            </button>
            <button
              onClick={() => handleFilterChange('bestaetigt')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeFilter === 'bestaetigt'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => handleFilterChange('abgeschlossen')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeFilter === 'abgeschlossen'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed
            </button>
          </nav>
        </div>

        {/* Safe rendering - handle empty states */}
        {filteredAppointments && filteredAppointments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <Link
                key={appointment.id}
                to={`/dashboard/termine/${appointment.id}`}
                className="block hover:bg-gray-50 transition duration-150"
              >
                <div className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {appointment.titel}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.status === 'geplant'
                          ? 'bg-yellow-100 text-yellow-800'
                          : appointment.status === 'bestaetigt'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'abgeschlossen'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {appointment.statusLabel || appointment.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {appointment.dateFormatted}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {appointment.timeFormatted}
                    </div>
                    {appointment.ort && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {appointment.ort}
                      </div>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {appointment.kunde_name}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 px-6 text-center">
            <p className="text-gray-500 mb-4">No appointments found</p>
            <Link
              to="/dashboard/termine/neu"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Create New Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;