'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function AppointmentsPage() {
  const router = useRouter();
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.VIEW);
  const canCreateAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.CREATE);
  
  // Create a stable appointment filter configuration
  const appointmentFilters = React.useMemo(() => ({
    sortBy: 'appointmentDate',
    sortDirection: 'asc' as 'asc' | 'desc',
  }), []);

  const handleCreateAppointment = () => {
    router.push('/dashboard/appointments/create');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Check if user has permission to view appointments */}
      {!permissionsLoading && !canViewAppointments ? (
        <NoPermissionView 
          title="Access Denied"
          message="You don't have permission to view appointments."
          permissionNeeded={API_PERMISSIONS.APPOINTMENTS.VIEW}
        />
      ) : (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <AppointmentList 
            initialFilters={appointmentFilters} 
            onCreateClick={canCreateAppointments ? handleCreateAppointment : undefined}
            showCreateButton={canCreateAppointments}
          />
        </div>
      )}
    </div>
  );
}
