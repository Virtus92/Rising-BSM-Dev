'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Calendar, Briefcase, Inbox, Clock } from 'lucide-react';
import { getDashboardData } from '../utils/dashboard-service';

const RecentActivities = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        const response = await getDashboardData();
        
        if (response.success && response.data.activities) {
          setActivities(response.data.activities);
        } else {
          // Wenn keine echten Daten verfügbar sind, verwende Beispieldaten
          setActivities([
            {
              id: 1,
              userId: 2,
              userName: 'Max Mustermann',
              activity: 'Neuen Kunden erstellt: Anna Schmidt',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 Minuten zuvor
            },
            {
              id: 2,
              userId: 3,
              userName: 'Maria Schmidt',
              activity: 'Termin aktualisiert: Projektbesprechung',
              timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 Minuten zuvor
            },
            {
              id: 3,
              userId: 1,
              userName: 'Admin User',
              activity: 'Neues Projekt erstellt: Website-Redesign',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 Stunden zuvor
            },
            {
              id: 4,
              userId: 2,
              userName: 'Max Mustermann',
              activity: 'Kundenanfrage beantwortet: Steuerberatung',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 Stunden zuvor
            },
            {
              id: 5,
              userId: 3,
              userName: 'Maria Schmidt',
              activity: 'Projektdokumentation aktualisiert: SEO-Kampagne',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 Stunden zuvor
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading activities:', err);
        setError('Fehler beim Laden der Aktivitäten');
      } finally {
        setLoading(false);
      }
    }
    
    loadActivities();
  }, []);

  // Icon für Aktivitätstyp
  const getActivityIcon = (activity: string) => {
    if (activity.includes('Kunde')) {
      return <User className="h-5 w-5 text-blue-500" />;
    } else if (activity.includes('Termin')) {
      return <Calendar className="h-5 w-5 text-purple-500" />;
    } else if (activity.includes('Projekt')) {
      return <Briefcase className="h-5 w-5 text-green-500" />;
    } else if (activity.includes('Anfrage')) {
      return <Inbox className="h-5 w-5 text-amber-500" />;
    } else {
      return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Formatiere relative Zeit
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'gerade eben';
    } else if (diffMin < 60) {
      return `vor ${diffMin} ${diffMin === 1 ? 'Minute' : 'Minuten'}`;
    } else if (diffHour < 24) {
      return `vor ${diffHour} ${diffHour === 1 ? 'Stunde' : 'Stunden'}`;
    } else if (diffDay < 7) {
      return `vor ${diffDay} ${diffDay === 1 ? 'Tag' : 'Tagen'}`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  // Lade-Indikator
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden col-span-2">
        <div className="px-4 py-5 sm:px-6 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-4 px-6 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden col-span-2">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Letzte Aktivitäten
        </h2>
        <Link 
          href="/dashboard/activities" 
          className="text-sm text-green-600 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400"
        >
          Alle anzeigen
        </Link>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Keine Aktivitäten gefunden.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activities.map((activity) => (
              <div key={activity.id} className="py-4 px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {getActivityIcon(activity.activity)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.userName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.activity}
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;