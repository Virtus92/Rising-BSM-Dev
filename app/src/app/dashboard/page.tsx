'use client';

import React from 'react';
import { StatsCards } from '@/features/dashboard/components/StatsCards';
import { UpcomingAppointments } from '@/features/dashboard/components/UpcomingAppointments';
import { DashboardCharts } from '@/features/dashboard/components/DashboardCharts';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { BarChart2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      
      <StatsCards />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UpcomingAppointments />
        <PermissionGuard
          anyPermission={[
            SystemPermission.REQUESTS_VIEW, 
            SystemPermission.APPOINTMENTS_VIEW,
            SystemPermission.USERS_VIEW,
            SystemPermission.CUSTOMERS_VIEW
          ]}
          fallback={
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>Charts and statistics</CardDescription>
                </div>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[350px] text-center">
                  <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Limited Permissions
                  </p>
                  <p className="text-muted-foreground max-w-md">
                    You don't have permissions to view analytics data. 
                    Please contact your manager if you need access to these statistics.
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        >
          <DashboardCharts />
        </PermissionGuard>
      </div>
    </div>
  );
}
