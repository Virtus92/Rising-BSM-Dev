import { 
    Users, 
    Calendar, 
    Inbox, 
    Briefcase, 
    TrendingUp, 
    TrendingDown 
  } from 'lucide-react';
  
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
  };
  
  export default StatsCards;