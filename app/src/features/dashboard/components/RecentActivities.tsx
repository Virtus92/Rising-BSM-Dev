'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Calendar, Briefcase, Inbox, Clock, RefreshCw } from 'lucide-react';
import { useRecentActivities } from '@/features/dashboard/hooks/useRecentActivities';

/**
 * Komponente zur Anzeige der letzten Aktivitäten im System
 */
export default function RecentActivities() {
  const { 
    activities, 
    loading, 
    error, 
    refresh 
  } = useRecentActivities({
    limit: 10,
    autoRefresh: true
  });

  // Icon für Aktivitätstyp
  const getActivityIcon = (activity: string) => {
    if (!activity) return <Clock className="h-5 w-5 text-gray-500" />;
    
    if (activity.toLowerCase().includes('kunde')) {
      return <User className="h-5 w-5 text-blue-500" />;
    } else if (activity.toLowerCase().includes('termin')) {
      return <Calendar className="h-5 w-5 text-purple-500" />;
    } else if (activity.toLowerCase().includes('projekt')) {
      return <Briefcase className="h-5 w-5 text-green-500" />;
    } else if (activity.toLowerCase().includes('anfrage')) {
      return <Inbox className="h-5 w-5 text-amber-500" />;
    } else {
      return <Clock className="h-5 w-5 text-gray-500" />;
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
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => refresh(true)} 
            className="inline-flex items-center px-2 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Aktualisieren
          </button>
          <Link 
            href="/dashboard/activities" 
            className="text-sm text-green-600 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400"
          >
            Alle anzeigen
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
            <button 
              onClick={() => refresh(true)} 
              className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Erneut versuchen
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Keine Aktivitäten gefunden.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activities.map((activity) => (
              <div key={activity.id} className="py-4 px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {getActivityIcon(activity.activity || '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.userName || 'Unbekannter Benutzer'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.activity || 'Unbekannte Aktivität'}
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {activity.formattedTime || 'Unbekannte Zeit'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}