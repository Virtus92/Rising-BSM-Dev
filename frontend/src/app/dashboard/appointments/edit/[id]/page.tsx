'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentForm } from '@/features/appointments/components/AppointmentForm';
import { validateId } from '@/shared/utils/validation-utils';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { Button } from '@/shared/components/ui/button';

export default function EditAppointmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Force the ID to be valid
  const appointmentId = params.id;
  
  return (
    <PermissionGuard
      permission={SystemPermission.APPOINTMENTS_EDIT}
      fallback={
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to edit appointments.
          </p>
          <Button 
            variant="secondary" 
            onClick={() => router.push(`/dashboard/appointments/${appointmentId || ''}`)}
          >
            View Appointment
          </Button>
        </div>
      }
    >
      <AppointmentForm appointmentId={appointmentId || ''} isEditMode={true} />
    </PermissionGuard>
  );
}
