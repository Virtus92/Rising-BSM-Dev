import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/core/api/ApiClient';
import { useToast } from '@/shared/hooks/useToast';

export interface DashboardActivity {
  id: number;
  type: string;
  action?: string;
  timestamp: string;
  formattedTime?: string;
  user?: {
    id: number;
    name: string;
  };
  entity?: {
    id: number;
    type: string;
    name: string;
  };
  activity?: string;
  userName?: string;
}

/**
 * Hook zum Abrufen und Verwalten von kürzlich durchgeführten Aktivitäten
 * 
 * Bietet Zugriff auf die neuesten Aktivitäten im System mit automatischer
 * Formatierung und Aktualisierungsfunktionen
 */
export function useRecentActivities(options: {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) {
  const { limit = 10, autoRefresh = true, refreshInterval = 5 * 60 * 1000 } = options;
  
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Laden der Aktivitäten
  const fetchActivities = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Parameter für die Anfrage
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      
      const response = await ApiClient.get(`/dashboard?${params.toString()}`);
      
      if (response.success && response.data) {
        // Aktivitäten aus der Antwort extrahieren
        let activityData = response.data.recentActivity || response.data.activities || [];
        
        // Limitiere die Anzahl der Aktivitäten, wenn mehr zurückgegeben wurden als angefordert
        if (limit && activityData.length > limit) {
          activityData = activityData.slice(0, limit);
        }
        
        // Konvertiere Aktivitäten zum einheitlichen Format
        const normalizedActivities = activityData.map((activity: any) => {
          // Wenn das Activity-Feld bereits existiert, verwende es
          if (activity.activity && activity.userName) {
            return activity;
          }
          
          // Ansonsten erstelle ein normalisiertes Format
          let normalizedActivity: DashboardActivity = { 
            ...activity,
            id: activity.id || Math.random().toString(36).substring(2, 11),
            type: activity.type || 'unknown',
            timestamp: activity.timestamp || activity.createdAt || new Date().toISOString()
          };
          
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
        
        if (showToast) {
          toast({
            title: 'Aktivitäten aktualisiert',
            description: 'Die Aktivitätsdaten wurden erfolgreich aktualisiert.',
            variant: 'success'
          });
        }
      } else {
        throw new Error(response.message || 'Keine gültigen Aktivitätsdaten erhalten');
      }
    } catch (err) {
      console.error('Fehler beim Laden der Aktivitäten:', err);
      
      setError('Fehler beim Laden der Aktivitäten');
      
      if (showToast) {
        toast({
          title: 'Fehler',
          description: err instanceof Error ? err.message : 'Fehler beim Laden der Aktivitäten',
          variant: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [limit, toast]);

  // Formatiere relative Zeit für ein Datum
  const formatRelativeTime = useCallback((dateString: string): string => {
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
      console.error('Fehler beim Formatieren des Datums', error as Error);
      return 'Unbekanntes Datum';
    }
  }, []);

  // Daten beim ersten Render laden
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-Refresh-Intervall einrichten, wenn aktiviert
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      fetchActivities();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchActivities]);

  // Aktivitäten mit formatierter Zeit
  const formattedActivities = activities.map(activity => ({
    ...activity,
    formattedTime: activity.formattedTime || formatRelativeTime(activity.timestamp)
  }));

  // Manuelles Aktualisieren der Aktivitäten mit optionaler Toast-Benachrichtigung
  const refresh = useCallback((showToast = true) => {
    return fetchActivities(showToast);
  }, [fetchActivities]);

  return {
    activities: formattedActivities,
    loading,
    error,
    refresh,
    formatRelativeTime
  };
}