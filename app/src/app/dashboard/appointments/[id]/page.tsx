'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AppointmentDetail } from '@/features/appointments/components/AppointmentDetail';
import { validateId } from '@/shared/utils/validation-utils';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';
import { Button } from '@/shared/components/ui/button';

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewAppointments = hasPermission(API_PERMISSIONS.APPOINTMENTS.VIEW);
  
  // CRITICAL FIX: Only use the validated ID and not the fallback to raw params.id
  const validId = validateId(params.id as string);
  
  // Loading state
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Check if user has permission to view appointments
  if (!canViewAppointments) {
    return (
      <NoPermissionView 
        title="Access Denied"
        message="You don't have permission to view appointment details."
        permissionNeeded={API_PERMISSIONS.APPOINTMENTS.VIEW}
        ctaText="Return to Dashboard"
        ctaLink="/dashboard"
        showHomeButton={false}
      />
    );
  }
  
  // If we don't have a valid ID, we'll show an error message in the component
  return <AppointmentDetail id={validId || ''} />;
}
