'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { useDashboardCharts, TimeFrame } from '../hooks/useDashboardCharts';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { 
  BarChart2, 
  LineChart as LineChartIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

// Colors for the charts
const COLORS = {
  requests: '#8884d8',
  appointments: '#82ca9d',
  customers: '#ffc658',
  users: '#ff8042'
};

// Custom tooltip component for the charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-md shadow-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="flex items-center">
            <span 
              className="inline-block w-3 h-3 mr-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export const DashboardCharts = () => {
  const { 
    mergedData, 
    timeFrame, 
    isLoading, 
    error, 
    changeTimeFrame,
    refreshData
  } = useDashboardCharts();
  
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle time frame change
  const handleTimeFrameChange = (value: string) => {
    changeTimeFrame(value as TimeFrame);
  };

  // Handle chart type change
  const handleChartTypeChange = (value: string) => {
    setChartType(value as 'bar' | 'line' | 'area');
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Statistics over time</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="h-[350px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Statistics over time</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center flex-col h-[350px] w-full text-red-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state from no data or permissions
  if (mergedData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Statistics over time ({timeFrame})</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <Tabs 
              value={timeFrame} 
              onValueChange={handleTimeFrameChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center justify-center flex-col h-[350px] w-full">
            <AlertCircle className="h-12 w-12 mb-4 text-amber-500" />
            <p className="text-lg font-medium">No statistics data available</p>
            <p className="text-muted-foreground text-center mb-4">
              {error ? error : `No data available for the ${timeFrame} view. Try selecting a different time period.`}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              {timeFrame === 'monthly' && (
                <Button 
                  variant="outline" 
                  onClick={() => handleTimeFrameChange('weekly')}
                >
                  Try Weekly View
                </Button>
              )}
              {timeFrame === 'weekly' && (
                <Button 
                  variant="outline" 
                  onClick={() => handleTimeFrameChange('monthly')}
                >
                  Try Monthly View
                </Button>
              )}
              {(timeFrame === 'weekly' || timeFrame === 'monthly') && (
                <Button 
                  variant="outline" 
                  onClick={() => handleTimeFrameChange('yearly')}
                >
                  Try Yearly View
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Function to render the appropriate chart based on chart type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={mergedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="period" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Bar 
                dataKey="requests" 
                fill={COLORS.requests} 
                name="Requests" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Bar 
                dataKey="appointments" 
                fill={COLORS.appointments} 
                name="Appointments" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Bar 
                dataKey="customers" 
                fill={COLORS.customers} 
                name="Customers" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Bar 
                dataKey="users" 
                fill={COLORS.users} 
                name="Users" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                isAnimationActive={true}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mergedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="period" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey="requests" 
                stroke={COLORS.requests} 
                name="Requests"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Line 
                type="monotone" 
                dataKey="appointments" 
                stroke={COLORS.appointments} 
                name="Appointments"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Line 
                type="monotone" 
                dataKey="customers" 
                stroke={COLORS.customers} 
                name="Customers"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke={COLORS.users} 
                name="Users"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mergedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.requests} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.requests} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.appointments} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.appointments} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.customers} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.customers} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.users} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.users} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="period" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Area 
                type="monotone" 
                dataKey="requests" 
                stroke={COLORS.requests} 
                fillOpacity={1} 
                fill="url(#colorRequests)" 
                name="Requests"
                isAnimationActive={true}
                animationDuration={500}
              />
              <Area 
                type="monotone" 
                dataKey="appointments" 
                stroke={COLORS.appointments} 
                fillOpacity={1} 
                fill="url(#colorAppointments)" 
                name="Appointments"
                isAnimationActive={true}
                animationDuration={500}
              />
              <Area 
                type="monotone" 
                dataKey="customers" 
                stroke={COLORS.customers} 
                fillOpacity={1} 
                fill="url(#colorCustomers)" 
                name="Customers"
                isAnimationActive={true}
                animationDuration={500}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke={COLORS.users} 
                fillOpacity={1} 
                fill="url(#colorUsers)" 
                name="Users"
                isAnimationActive={true}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  // Format the CardDescription based on the type of data
  const formatTimeFrameDescription = (timeFrame: TimeFrame) => {
    if (timeFrame === 'weekly') return 'Weekly Statistics';
    if (timeFrame === 'yearly') return 'Yearly Statistics';
    return 'Monthly Statistics';
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>{formatTimeFrameDescription(timeFrame)}</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh data"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <Tabs 
            value={timeFrame} 
            onValueChange={handleTimeFrameChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs 
            value={chartType} 
            onValueChange={handleChartTypeChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bar" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" /> Bar
              </TabsTrigger>
              <TabsTrigger value="line" className="flex items-center">
                <LineChartIcon className="h-4 w-4 mr-2" /> Line
              </TabsTrigger>
              <TabsTrigger value="area" className="flex items-center">
                <LineChartIcon className="h-4 w-4 mr-2" /> Area
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-[350px] w-full">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};
