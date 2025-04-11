'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Users, UserPlus, FileText, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { ErrorBoundary } from './ErrorFallback';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';

export const StatsCards = () => {
  const { 
    userCount, 
    customerCount, 
    requestCount, 
    appointmentCount,
    loading,
    error,
    refreshStats
  } = useDashboardStats();

  // Default stats items with proper loading and error handling
  const statsItems = [
    {
      title: 'Total Users',
      count: userCount ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-100 dark:border-blue-900'
    },
    {
      title: 'Total Customers',
      count: customerCount ?? 0,
      icon: UserPlus,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-100 dark:border-green-900'
    },
    {
      title: 'Total Requests',
      count: requestCount ?? 0,
      icon: FileText,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-100 dark:border-yellow-900'
    },
    {
      title: 'Upcoming Appointments',
      count: appointmentCount ?? 0,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      borderColor: 'border-purple-100 dark:border-purple-900'
    }
  ];

  // Loading state with skeleton placeholders
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statsItems.map((item) => (
          <Card key={item.title} className={`border ${item.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Skeleton className="h-4 w-20 mt-1" />
              </div>
              <div className={`p-2 rounded-full ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>Failed to load statistics</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStats}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {statsItems.map((item) => (
            <Card key={item.title} className={`border ${item.borderColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <div className={`p-2 rounded-full ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Normal state with data
  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statsItems.map((item) => (
          <Card key={item.title} className={`border ${item.borderColor} hover:shadow-md transition-shadow duration-200`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <CardDescription className="text-xs">
                  {/* No mock trends, just a simple description */}
                  Current total
                </CardDescription>
              </div>
              <div className={`p-2 rounded-full ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {item.count.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ErrorBoundary>
  );
};
