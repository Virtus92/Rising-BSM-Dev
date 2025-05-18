'use client';

import React from 'react';
import { RequestList } from '@/features/requests/components/RequestList';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';
import { RequestFilterParamsDto } from '@/domain/dtos/RequestDtos';

export default function RequestsPage() {
  // Define default filter parameters
  const defaultFilters: Partial<RequestFilterParamsDto> = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  };
  const router = useRouter();
  
  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewRequests = hasPermission(API_PERMISSIONS.REQUESTS.VIEW);
  const canCreateRequests = hasPermission(API_PERMISSIONS.REQUESTS.CREATE);
  
  const handleCreateRequest = () => {
    router.push('/dashboard/requests/new');
  };
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Check if user has permission to view requests */}
      {!permissionsLoading && !canViewRequests ? (
        <NoPermissionView 
          title="Access Denied"
          message="You don't have permission to view requests."
          permissionNeeded={API_PERMISSIONS.REQUESTS.VIEW}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <RequestList 
            initialFilters={defaultFilters}
            onCreateClick={canCreateRequests ? handleCreateRequest : undefined}
            showCreateButton={canCreateRequests} 
          />
        </div>
      )}
    </div>
  );
}
