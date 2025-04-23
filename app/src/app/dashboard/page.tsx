import React from 'react';
import { StatsCards } from '@/features/dashboard/components/StatsCards';
import { UpcomingAppointments } from '@/features/dashboard/components/UpcomingAppointments';
import { DashboardCharts } from '@/features/dashboard/components/DashboardCharts';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      
      <StatsCards />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UpcomingAppointments />
        <DashboardCharts />
      </div>
    </div>
  );
}
