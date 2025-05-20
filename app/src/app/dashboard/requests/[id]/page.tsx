'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { RequestDetail } from '@/features/requests/components/RequestDetail';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

/**
 * Dashboard page for request details
 */

/**
 * Dashboard-Seite für die Detailansicht einer Kontaktanfrage
 */
export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = parseInt(params.id as string);
  
  // Add permission check
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewRequests = hasPermission(API_PERMISSIONS.REQUESTS.VIEW);
  
  // Loading state while checking permissions
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // No permission state
  if (!canViewRequests) {
    return (
      <NoPermissionView 
        title="Access Denied"
        message="You don't have permission to view request details."
        permissionNeeded={API_PERMISSIONS.REQUESTS.VIEW}
        ctaText="Return to Dashboard"
        ctaLink="/dashboard"
        showHomeButton={false}
      />
    );
  }

  if (isNaN(requestId)) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Invalid Request ID</h1>
        <Button onClick={() => router.push('/dashboard/requests')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
    );
  }

  const handleBack = () => {
    router.push('/dashboard/requests');
  };

  return (
    <div className="container mx-auto py-6">
      <RequestDetail id={requestId} onBack={handleBack} />
    </div>
  );
}