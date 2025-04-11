'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users, UserPlus, FileText, Calendar } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { ErrorBoundary } from './ErrorFallback';

export const StatsCards = () => {
  const { 
    userCount, 
    customerCount, 
    requestCount, 
    appointmentCount,
    loading,
    error
  } = useDashboardStats();

  const statsItems = [
    {
      title: 'Total Users',
      count: userCount ?? 0,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Total Customers',
      count: customerCount ?? 0,
      icon: UserPlus,
      color: 'text-green-500'
    },
    {
      title: 'Total Requests',
      count: requestCount ?? 0,
      icon: FileText,
      color: 'text-yellow-500'
    },
    {
      title: 'Upcoming Appointments',
      count: appointmentCount ?? 0,
      icon: Calendar,
      color: 'text-purple-500'
    }
  ];

  if (error) {
    return (
      <ErrorBoundary>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsItems.map((item) => (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsItems.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : item.count}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ErrorBoundary>
  );
};
