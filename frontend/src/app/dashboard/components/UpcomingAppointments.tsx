'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDashboardData } from '../utils/dashboard-service';
import { Appointment } from '@/lib/api/types';

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadAppointments() {
      try {
        setLoading(true);
        const response = await getDashboardData();
        
        if (response.success && response.data && response.data.upcomingAppointments) {
          console.log('Appointment data received:', response.data.upcomingAppointments);
          setAppointments(response.data.upcomingAppointments || []);
        } else {
          console.warn('No appointments data received from API');
          setError('No appointment data available. Please check the connection to the backend.');
        }
      } catch (err) {
        console.error('Error loading appointments:', err);
        setError('Error loading appointments');
      } finally {
        setLoading(false);
      }
    }
    
    loadAppointments();
  }, []);

  // Function to format date to human readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // Es kann sein, dass wir dateLabel statt eines Datums bekommen
      if (dateString.includes('.') || dateString.includes('/')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      // Überprüfen, ob das Datum gültig ist
      if (isNaN(date.getTime())) {
        console.warn('Ungültiges Datum:', dateString);
        return dateString; // Gib den String zurück, wie er ist
      }
      return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch (error) {
      console.error('Fehler beim Parsen des Datums:', dateString, error);
      return dateString; // Gib den String zurück, wie er ist
    }
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
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Abgeschlossen
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Geplant
          </span>
        );
      case 'cancelled':
      case 'canceled':
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
    if (!dateString) return '-';
    try {
      // Es kann sein, dass wir dateLabel statt eines Datums bekommen
      if (dateString.includes('.') || dateString.includes('/')) {
        // Extrahiere den Tag aus einem formatierten String (z.B. "01.02.2023")
        const parts = dateString.split(/[.,/\s]/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month, day);
            return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date);
          }
        }
        return '-';
      }
      
      const date = new Date(dateString);
      // Überprüfen, ob das Datum gültig ist
      if (isNaN(date.getTime())) {
        console.warn('Ungültiges Datum:', dateString);
        return '-';
      }
      return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date);
    } catch (error) {
      console.error('Fehler beim Parsen des Datums:', dateString, error);
      return '-';
    }
  };

  // Extracts day number from date string
  const getDayNumber = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // Es kann sein, dass wir dateLabel statt eines Datums bekommen
      if (dateString.includes('.') || dateString.includes('/')) {
        // Extrahiere den Tag aus einem formatierten String (z.B. "01.02.2023")
        const parts = dateString.split(/[.,/\s]/);
        if (parts.length >= 1) {
          return parts[0];
        }
        return '-';
      }
      
      const date = new Date(dateString);
      // Überprüfen, ob das Datum gültig ist
      if (isNaN(date.getTime())) {
        console.warn('Ungültiges Datum:', dateString);
        return '-';
      }
      return date.getDate().toString();
    } catch (error) {
      console.error('Fehler beim Parsen des Datums:', dateString, error);
      return '-';
    }
  };

  // Loading indicator
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

  // Error display
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 lg:col-span-2 mt-6">
        <div className="text-red-500 dark:text-red-400">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-green-600 dark:text-green-500 hover:underline"
        >
          Reload
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
                <tr 
                  key={appointment.id} 
                  className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition"
                  onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)} 
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {appointment.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {appointment.customer || appointment.customerName || 'Kein Kunde zugewiesen'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex flex-col items-center mr-3 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {getDayName(appointment.dateLabel || appointment.appointmentDate)}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {getDayNumber(appointment.dateLabel || appointment.appointmentDate)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(appointment.dateLabel || appointment.appointmentDate)} • {appointment.time || appointment.appointmentTime || 'Keine Zeit'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(appointment.status || 'planned')}
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