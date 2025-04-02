'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Inbox, 
  Briefcase, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { getDashboardData } from '../utils/dashboard-service';

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

const StatCard = ({ title, value, description, icon, trend, className }: StatCardProps) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
          {icon}
        </div>
      </div>
      
      <div className="flex items-center">
        {trend && (
          <div className={`flex items-center mr-2 ${trend.isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            <span className="text-sm font-medium">{trend.value}%</span>
          </div>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

const StatsCards = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const response = await getDashboardData();
        
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.error || 'Fehler beim Laden der Dashboard-Daten');
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  // Lade-Indikator
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full h-12 w-12"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Fehler-Anzeige
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Wenn keine Daten verfügbar sind, zeige Dummydaten
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Kunden"
          value="124"
          description="Gesamt (12 neue im letzten Monat)"
          icon={<Users className="h-6 w-6 text-green-600 dark:text-green-500" />}
          trend={{ value: 8, isPositive: true }}
        />
        
        <StatCard
          title="Termine"
          value="36"
          description="Anstehend in diesem Monat"
          icon={<Calendar className="h-6 w-6 text-green-600 dark:text-green-500" />}
          trend={{ value: 5, isPositive: true }}
        />
        
        <StatCard
          title="Anfragen"
          value="18"
          description="Neue unbearbeitete Anfragen"
          icon={<Inbox className="h-6 w-6 text-green-600 dark:text-green-500" />}
          trend={{ value: 12, isPositive: false }}
        />
        
        <StatCard
          title="Projekte"
          value="42"
          description="Aktive Projekte"
          icon={<Briefcase className="h-6 w-6 text-green-600 dark:text-green-500" />}
          trend={{ value: 2, isPositive: true }}
        />
      </div>
    );
  }

  // Zeige echte Daten aus dem Backend
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Kunden"
        value={stats.customers?.total || 0}
        description={`Gesamt (${stats.customers?.new || 0} neue im letzten Monat)`}
        icon={<Users className="h-6 w-6 text-green-600 dark:text-green-500" />}
        trend={{ 
          value: Math.round((stats.customers?.new || 0) / (stats.customers?.total || 1) * 100), 
          isPositive: true 
        }}
      />
      
      <StatCard
        title="Termine"
        value={stats.appointments?.upcoming || 0}
        description={`Anstehend (${stats.appointments?.today || 0} heute)`}
        icon={<Calendar className="h-6 w-6 text-green-600 dark:text-green-500" />}
        trend={stats.appointments?.trend ? {
          value: Math.abs(stats.appointments.trend),
          isPositive: stats.appointments.trend > 0
        } : undefined}
      />
      
      <StatCard
        title="Anfragen"
        value={(stats.requests?.new || 0) + (stats.requests?.inProgress || 0)}
        description={`${stats.requests?.new || 0} neu, ${stats.requests?.inProgress || 0} in Bearbeitung`}
        icon={<Inbox className="h-6 w-6 text-green-600 dark:text-green-500" />}
        trend={stats.requests?.trend ? {
          value: Math.abs(stats.requests.trend),
          isPositive: stats.requests.trend < 0 // Weniger Anfragen ist positiv
        } : undefined}
      />
      
      <StatCard
        title="Projekte"
        value={stats.projects?.active || 0}
        description={`Aktiv (${stats.projects?.new || 0} neu, ${stats.projects?.completed || 0} abgeschlossen)`}
        icon={<Briefcase className="h-6 w-6 text-green-600 dark:text-green-500" />}
        trend={stats.projects?.trend ? {
          value: Math.abs(stats.projects.trend),
          isPositive: stats.projects.trend > 0
        } : undefined}
      />
    </div>
  );
};

export default StatsCards;