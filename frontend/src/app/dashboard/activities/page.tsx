'use client';

import { useState, useEffect } from 'react';
import { User, Calendar, Briefcase, Inbox, Clock, Search, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData, DashboardActivity } from '../utils/dashboard-service';

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData();
        
        if (response.success && response.data) {
          // Normalisiere Aktivitätsdaten zum einheitlichen Format
          let activityData = response.data.recentActivity || response.data.activities || [];
          
          // Konvertiere Aktivitäten zum einheitlichen Format, falls notwendig
          const normalizedActivities = activityData.map(activity => {
            // Wenn das activity-Feld bereits existiert, verwende es
            if (activity.activity && activity.userName) {
              return activity;
            }
            
            // Ansonsten erstelle ein normalisiertes Format
            let normalizedActivity = { ...activity };
            
            if (!normalizedActivity.activity && normalizedActivity.action && normalizedActivity.entity) {
              // Erstelle eine beschreibende Aktivität aus Aktion und Entity
              const actionText = {
                'create': 'hat erstellt',
                'update': 'hat aktualisiert',
                'delete': 'hat gelöscht',
                'complete': 'hat abgeschlossen'
              }[normalizedActivity.action] || normalizedActivity.action;
              
              normalizedActivity.activity = `${actionText} ${normalizedActivity.entity.type} "${normalizedActivity.entity.name}"`;
            }
            
            if (!normalizedActivity.userName && normalizedActivity.user) {
              normalizedActivity.userName = normalizedActivity.user.name;
            }
            
            return normalizedActivity;
          });
          
          setActivities(normalizedActivities);
        } else {
          setError('Keine Aktivitätsdaten verfügbar. Bitte überprüfen Sie die Verbindung zum Backend.');
        }
      } catch (err) {
        console.error('Error loading activities:', err);
        setError('Fehler beim Laden der Aktivitäten');
      } finally {
        setLoading(false);
      }
    };
    
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

  // Formatiere relatives Datum
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Überprüfung auf ungültiges Datum
      if (isNaN(date.getTime())) {
        return 'Unbekanntes Datum';
      }
      
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
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums', error);
      return 'Unbekanntes Datum';
    }
  };

  // Filtere Aktivitäten basierend auf Suchbegriff und Filtern
  const filteredActivities = activities.filter(activity => {
    const searchMatch = 
      !searchTerm || 
      (activity.activity && activity.activity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activity.userName && activity.userName.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const dateMatch = dateFilter === 'all' || (() => {
      if (!activity.timestamp) return false;
      
      try {
        const activityDate = new Date(activity.timestamp);
        if (isNaN(activityDate.getTime())) return false;
        
        const now = new Date();
        
        switch(dateFilter) {
          case 'today':
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return activityDate >= todayStart;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return activityDate >= weekAgo;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return activityDate >= monthAgo;
          default:
            return true;
        }
      } catch (error) {
        console.error('Fehler bei der Datumsprüfung:', error);
        return false;
      }
    })();
    
    const typeMatch = typeFilter === 'all' || (() => {
      if (!activity.type && !activity.activity) return false;
      
      const activityType = activity.type || '';
      const activityText = activity.activity || '';
      
      switch(typeFilter) {
        case 'customer':
          return activityType.includes('customer') || activityText.toLowerCase().includes('kunde');
        case 'appointment':
          return activityType.includes('appointment') || activityText.toLowerCase().includes('termin');
        case 'project':
          return activityType.includes('project') || activityText.toLowerCase().includes('projekt');
        case 'request':
          return activityType.includes('request') || activityText.toLowerCase().includes('anfrage');
        default:
          return true;
      }
    })();
    
    return searchMatch && dateMatch && typeMatch;
  });

  // UI für Ergebnisse mit leerer Liste
  const renderEmptyState = () => (
    <div className="p-6 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
        <Clock className="h-8 w-8 text-gray-500 dark:text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Keine Aktivitäten gefunden
      </h3>
      {searchTerm || dateFilter !== 'all' || typeFilter !== 'all' ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Versuchen Sie, Ihre Filterkriterien anzupassen oder die Suche zurückzusetzen.
        </p>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Es wurden noch keine Aktivitäten erfasst. Aktivitäten werden automatisch protokolliert, wenn Sie mit dem System arbeiten.
        </p>
      )}
      {(searchTerm || dateFilter !== 'all' || typeFilter !== 'all') && (
        <button
          onClick={() => {
            setSearchTerm('');
            setDateFilter('all');
            setTypeFilter('all');
          }}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Filter zurücksetzen
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aktivitäten</h1>
        </div>
      </div>
      
      {/* Filter und Suche */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zeitraum
              </label>
              <select
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white py-2 pl-3 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Alle</option>
                <option value="today">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Diesen Monat</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white py-2 pl-3 pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Alle</option>
                <option value="customer">Kunden</option>
                <option value="appointment">Termine</option>
                <option value="project">Projekte</option>
                <option value="request">Anfragen</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Aktivitätsliste */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 dark:text-red-400">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-green-600 dark:text-green-500 hover:underline"
            >
              Neu laden
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getActivityIcon(activity.activity || '')}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.userName || 'Unbekannter Benutzer'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.activity || 'Unbekannte Aktivität'}
                        </div>
                        {activity.entity && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {activity.entity.type}: {activity.entity.name}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                        {activity.formattedTime || formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
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

export default ActivitiesPage;
