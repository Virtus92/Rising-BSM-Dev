'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { useAuth } from '@/features/auth/providers/AuthProvider';

export default function AppointmentsPage() {
  const router = useRouter();
  const { isInitialized } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  // Wait for auth to initialize before showing content
  useEffect(() => {
    if (isInitialized) {
      // Add a small delay to ensure permissions are loaded
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);
  
  // Create a stable appointment filter configuration
  const appointmentFilters = React.useMemo(() => ({
    sortBy: 'appointmentDate',
    sortDirection: 'asc' as 'asc' | 'desc',
  }), []);

  const handleCreateAppointment = () => {
    router.push('/dashboard/appointments/create');
  };

  // Show loading state until everything is ready
  if (!isReady) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="md" />
          <div className="mt-4 text-muted-foreground">Loading appointments...</div>
        </div>
      </div>
    );
  }

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
      showLoading={true}
      loadingFallback={
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="md" />
            <div className="mt-4 text-muted-foreground">Checking permissions...</div>
          </div>
        </div>
      }
    >
      <div className="space-y-6 p-4 sm:p-6">
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
