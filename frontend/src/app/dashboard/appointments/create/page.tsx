'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentForm } from '@/features/appointments/components/AppointmentForm';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { Button } from '@/shared/components/ui/button';

export default function CreateAppointmentPage() {
  const router = useRouter();
  
  return (
    <PermissionGuard
      permission={SystemPermission.APPOINTMENTS_CREATE}
      fallback={
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to create appointments.
          </p>
          <Button variant="secondary" onClick={() => router.push('/dashboard/appointments')}>
            View Appointments
          </Button>
        </div>
      }
    >
      <AppointmentForm />
    </PermissionGuard>
  );
}
