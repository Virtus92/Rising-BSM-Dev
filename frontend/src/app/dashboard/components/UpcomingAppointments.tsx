'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardData } from '../utils/dashboard-service';

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      try {
        setLoading(true);
        const response = await getDashboardData();
        
        if (response.success && response.data.appointments) {
          setAppointments(response.data.appointments);
        } else {
          // Fallback auf Beispieldaten, wenn keine vom Backend kommen
          setAppointments([
            {
              id: 1,
              title: 'Beratungsgespräch Winterdienst',
              customer: 'Müller GmbH',
              date: '2024-03-20',
              time: '10:00',
              status: 'confirmed',
            },
            {
              id: 2,
              title: 'Erstgespräch Facility Management',
              customer: 'Dr. Schmidt Praxis',
              date: '2024-03-21',
              time: '14:30',
              status: 'planned',
            },
            {
              id: 3,
              title: 'Umzugsplanung',
              customer: 'Huber Elektronik',
              date: '2024-03-22',
              time: '09:15',
              status: 'planned',
            },
            {
              id: 4,
              title: 'Angebotsbesprechung Grünflächenpflege',
              customer: 'Stadtwerke Linz',
              date: '2024-03-23',
              time: '11:00',
              status: 'confirmed',
            },
            {
              id: 5,
              title: 'Follow-up Besichtigung',
              customer: 'Mayer Immobilien',
              date: '2024-03-24',
              time: '15:45',
              status: 'planned',
            },
          ]);
        }
      } catch (err) {
        console.error('Error loading appointments:', err);
        setError('Fehler beim Laden der Termine');
      } finally {
        setLoading(false);
      }
    }
    
    loadAppointments();
  }, []);

  // Function to format date to human readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Bestätigt
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Geplant
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Storniert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Unbekannt
          </span>
        );
    }
  };

  // Function to get day name
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date);
  };

  // Lade-Indikator
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 lg:col-span-2 mt-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Fehler-Anzeige
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 lg:col-span-2 mt-6">
        <div className="text-red-500 dark:text-red-400">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-green-600 dark:text-green-500 hover:underline"
        >
          Neu laden
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 lg:col-span-2 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Anstehende Termine</h3>
        <Link 
          href="/dashboard/appointments" 
          className="text-sm text-green-600 dark:text-green-500 hover:underline"
        >
          Alle anzeigen
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        {appointments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Keine anstehenden Termine gefunden.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Termin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Datum & Zeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {appointment.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {appointment.customer}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex flex-col items-center mr-3 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {getDayName(appointment.date)}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {new Date(appointment.date).getDate()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(appointment.date)} • {appointment.time} Uhr
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(appointment.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UpcomingAppointments;