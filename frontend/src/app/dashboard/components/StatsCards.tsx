'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Inbox, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  AlertCircle 
} from 'lucide-react';
import { getDashboardData, StatItem } from '../utils/dashboard-service';
import { ApiRequestError } from '@/lib/api/config';

// Definieren von Typen für Stats-Daten
export interface DashboardStats {
  customers?: StatItem;
  appointments?: StatItem;
  requests?: StatItem;
  projects?: StatItem;
  [key: string]: StatItem | undefined;
}

// Props für eine einzelne Statistik-Karte
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

/**
 * Einzelne Statistik-Karte Komponente
 */
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  loading = false,
  className = '' 
}) => {
  // Skeleton UI, wenn Daten geladen werden
  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full h-12 w-12"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  // Farbschema basierend auf dem Trend
  const iconBgColor = trend?.isPositive 
    ? 'bg-green-100 dark:bg-green-900/30' 
    : trend ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
  
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`${iconBgColor} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-center">
        {/* Prozentanzeige entfernt */}
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

/**
 * Error Message Komponente für Fehleranzeigen
 */
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 flex items-start">
    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
    <p className="text-red-700 dark:text-red-400">{message}</p>
  </div>
);

/**
 * Hauptkomponente für Statistik-Karten
 */
const StatsCards: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Laden der Dashboard-Daten
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDashboardData();
        
        if (response.success && response.data?.stats) {
          setStats(response.data.stats);
        } else {
          throw new Error('Keine Statistikdaten verfügbar');
        }
      } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        let errorMessage = 'Fehler beim Laden der Dashboard-Daten';
        
        if (err instanceof ApiRequestError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
    
    // Polling-Intervall für Dashboard-Daten (alle 5 Minuten)
    const intervalId = setInterval(loadDashboardData, 5 * 60 * 1000);
    
    // Intervall bereinigen, wenn die Komponente unmontiert wird
    return () => clearInterval(intervalId);
  }, []);

  // Sicherstellen, dass alle benötigten Statsobjekte existieren
  useEffect(() => {
    if (stats && !loading) {
      console.log('Verarbeitete Stats im Frontend:', stats);
    }
  }, [stats, loading]);

  // Array von Statistikkarten für einfacheres Rendern
  const statCards = [
    {
      title: "Kunden",
      getValue: () => {
        const total = stats?.customers?.total;
        return typeof total === 'number' && !isNaN(total) ? total : 0;
      },
      getDescription: () => {
        // Prozentinfos entfernen
        return `Gesamt`;
      },
      getIcon: () => <Users className="h-6 w-6 text-green-600 dark:text-green-500" aria-hidden="true" />,
      getTrend: () => {
        const newCustomers = stats?.customers?.new || 0;
        const total = stats?.customers?.total || 1;
        return {
          value: Math.round((newCustomers / total * 100)) || 0,
          isPositive: newCustomers > 0
        };
      }
    },
    {
      title: "Termine",
      getValue: () => {
        const upcoming = stats?.appointments?.upcoming;
        return typeof upcoming === 'number' && !isNaN(upcoming) ? upcoming : 0;
      },
      getDescription: () => {
        // Prozentinfos entfernen
        return `Anstehend`;
      },
      getIcon: () => <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-500" aria-hidden="true" />,
      getTrend: () => {
        const trend = stats?.appointments?.trend;
        if (typeof trend !== 'number' || isNaN(trend)) return undefined;
        return {
          value: Math.abs(trend),
          isPositive: trend > 0
        };
      }
    },
    {
      title: "Anfragen",
      getValue: () => {
        const newReq = stats?.requests?.new || 0;
        const inProgress = stats?.requests?.inProgress || 0;
        return (typeof newReq === 'number' && !isNaN(newReq) ? newReq : 0) + 
               (typeof inProgress === 'number' && !isNaN(inProgress) ? inProgress : 0);
      },
      getDescription: () => {
        // Prozentinfos entfernen
        return `Offen`;
      },
      getIcon: () => <Inbox className="h-6 w-6 text-purple-600 dark:text-purple-500" aria-hidden="true" />,
      getTrend: () => {
        const trend = stats?.requests?.trend;
        if (typeof trend !== 'number' || isNaN(trend)) return undefined;
        return {
          value: Math.abs(trend),
          isPositive: trend < 0 // Weniger offene Anfragen ist positiv
        };
      }
    },
    {
      title: "Projekte",
      getValue: () => {
        const active = stats?.projects?.active;
        return typeof active === 'number' && !isNaN(active) ? active : 0;
      },
      getDescription: () => {
        // Prozentinfos entfernen
        return `Aktiv`;
      },
      getIcon: () => <Briefcase className="h-6 w-6 text-yellow-600 dark:text-yellow-500" aria-hidden="true" />,
      getTrend: () => {
        const trend = stats?.projects?.trend;
        if (typeof trend !== 'number' || isNaN(trend)) return undefined;
        return {
          value: Math.abs(trend),
          isPositive: trend > 0
        };
      }
    }
  ];

  // Wenn ein Fehler aufgetreten ist und das Laden abgeschlossen ist
  if (error && !loading) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Dashboard Statistiken">
      {statCards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.getValue()}
          description={card.getDescription()}
          icon={card.getIcon()}
          trend={!loading ? card.getTrend() : undefined}
          loading={loading}
        />
      ))}
    </div>
  );
};

export default StatsCards;