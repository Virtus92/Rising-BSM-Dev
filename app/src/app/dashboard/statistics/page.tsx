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

/**
 * Statistics Page Component
 * 
 * Dedicated page for business statistics and analytics with
 * visualizations for customers, appointments, and requests data.
 */
export default function StatisticsPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState('month');
  const [chartType, setChartType] = useState('bar');
  
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
    error,
    refreshStats
  } = useDashboardStats();
  
  // Combined loading state
  const loading = statsLoading || permissionsLoading;

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
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={refreshStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats cards section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <StatsCards />
      </div>

      {/* Tabbed chart section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Analytics Breakdown</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant={chartType === 'bar' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setChartType('bar')}
              className="h-8"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Bar
            </Button>
            <Button 
              variant={chartType === 'pie' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setChartType('pie')}
              className="h-8"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Pie
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="customers">
          <TabsList className="mb-4">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="users">Team Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                    <CardDescription>Increase compared to last period</CardDescription>
                  </div>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{Math.round(customerCount * 0.12)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+12%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                    <CardDescription>Returning customer rate</CardDescription>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+3%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                    <CardDescription>Time to first contact</CardDescription>
                  </div>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.2h</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">-0.8h</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <DashboardCharts />
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">New Requests</CardTitle>
                    <CardDescription>Compared to last period</CardDescription>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{Math.round(requestCount * 0.18)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+18%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                    <CardDescription>Successfully handled requests</CardDescription>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">93%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+5%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
                    <CardDescription>Time to complete requests</CardDescription>
                  </div>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3d</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">-0.5d</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <DashboardCharts />
          </TabsContent>
          
          <TabsContent value="appointments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Scheduled Appointments</CardTitle>
                    <CardDescription>Compared to last period</CardDescription>
                  </div>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{Math.round(appointmentCount * 0.09)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+9%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    <CardDescription>Appointments attended</CardDescription>
                  </div>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+2%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <CardDescription>Appointments to customers</CardDescription>
                  </div>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">76%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+4%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <DashboardCharts />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <CardDescription>Team activity level</CardDescription>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(userCount * 0.85)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">85%</span> of total users
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Avg. Tasks per User</CardTitle>
                    <CardDescription>Workload distribution</CardDescription>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12.4</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-amber-500 font-medium">+1.2</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                    <CardDescription>Based on completion rates</CardDescription>
                  </div>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">+3%</span> from last {timeframe}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <DashboardCharts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
