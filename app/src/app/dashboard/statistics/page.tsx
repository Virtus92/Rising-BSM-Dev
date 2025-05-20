'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, Calendar, PieChart, Users, UserPlus, FileText, Download, RefreshCw, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { StatsCards } from '@/features/dashboard/components/StatsCards';
import { DashboardCharts } from '@/features/dashboard/components/DashboardCharts';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';
import { useDashboardCharts, TimeFrame } from '@/features/dashboard/hooks/useDashboardCharts';

/**
 * Statistics Page Component
 * 
 * Dedicated page for business statistics and analytics with
 * visualizations for customers, appointments, and requests data.
 */
export default function StatisticsPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<TimeFrame>('monthly');
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewStatistics = hasPermission(API_PERMISSIONS.STATISTICS.VIEW);
  
  // Use the dashboard stats hook for data
  const { 
    userCount, 
    customerCount, 
    requestCount, 
    appointmentCount,
    loading: statsLoading,
    error: statsError,
    refreshStats
  } = useDashboardStats();
  
  // Use dashboard charts hook for time-based data
  const {
    timeFrame,
    changeTimeFrame,
    isLoading: chartsLoading,
    error: chartsError,
    refreshData: refreshCharts
  } = useDashboardCharts();
  
  // Handler for timeframe selection
  const handleTimeframeChange = (value: string) => {
    const newTimeframe = value as TimeFrame;
    setTimeframe(newTimeframe);
    changeTimeFrame(newTimeframe);
  };

  // Handler for refresh button click
  const handleRefresh = async () => {
    await refreshStats();
    await refreshCharts();
  };
  
  // Combined loading state
  const loading = statsLoading || permissionsLoading || chartsLoading;

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading statistics...
          </p>
        </div>
      </div>
    );
  }
  
  // Check if user has permission to view statistics
  if (!permissionsLoading && !canViewStatistics) {
    return (
      <NoPermissionView 
        title="Access Denied"
        message="You don't have permission to view statistics."
        permissionNeeded={API_PERMISSIONS.STATISTICS.VIEW}
      />
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistics & Analytics</h1>
          <p className="text-muted-foreground">
            Overview of key business metrics and performance indicators
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={timeframe}
            onValueChange={handleTimeframeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats cards section - Shows summary of key metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <StatsCards />
      </div>

      {/* Tabbed chart section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Analytics Breakdown</h2>
        <DashboardCharts />
      </div>
    </div>
  );
}