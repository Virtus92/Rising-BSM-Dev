'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AppointmentDetail } from '@/features/appointments/components/AppointmentDetail';
import { validateId } from '@/shared/utils/validation-utils';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { Button } from '@/shared/components/ui/button';

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  
  // CRITICAL FIX: Only use the validated ID and not the fallback to raw params.id
  const validId = validateId(params.id as string);
  
  // If we don't have a valid ID, we'll show an error message in the component
  return (
    <PermissionGuard
      permission={SystemPermission.APPOINTMENTS_VIEW}
      fallback={
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to view appointment details.
          </p>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      }
    >
      <AppointmentDetail id={validId || ''} />
    </PermissionGuard>
  );
}
