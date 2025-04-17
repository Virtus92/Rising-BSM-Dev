'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { Button } from '@/shared/components/ui/button';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

export default function AppointmentsPage() {
  const router = useRouter();
  
  // Create a stable appointment filter configuration
  const appointmentFilters = React.useMemo(() => ({
    sortBy: 'appointmentDate',
    sortDirection: 'asc' as 'asc' | 'desc',
  }), []);

  const handleCreateAppointment = () => {
    router.push('/dashboard/appointments/create');
  };

  return (
    <PermissionGuard
      permission={SystemPermission.APPOINTMENTS_VIEW}
      fallback={
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to view appointments.
          </p>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-4 sm:p-6">
        {/* Removed the redundant header since AppointmentList component has its own title and controls */}
        
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <AppointmentList 
            initialFilters={appointmentFilters} 
            onCreateClick={handleCreateAppointment}
          />
        </div>
      </div>
    </PermissionGuard>
  );
}
