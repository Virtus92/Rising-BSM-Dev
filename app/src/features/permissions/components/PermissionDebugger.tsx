'use client';

/**
 * PermissionDebugger Component
 * 
 * This component displays current permission state for debugging purposes.
 * It can be added to the dashboard to help diagnose permission issues.
 */

import { useState, useEffect } from 'react';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';

export const PermissionDebugger = () => {
  const { permissions, loadPermissions, isLoading, isInitialized, hasPermission } = usePermissions();
  const { user, isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Define key permissions to check
  const keyPermissions = [
    API_PERMISSIONS.USERS.VIEW,
    API_PERMISSIONS.USERS.CREATE,
    API_PERMISSIONS.USERS.UPDATE,
    API_PERMISSIONS.CUSTOMERS.VIEW,
    API_PERMISSIONS.REQUESTS.VIEW,
  ];
  
  // Handle permission reload
  const handleRefreshPermissions = async () => {
    try {
      setRefreshing(true);
      const result = await loadPermissions();
      console.log('Permissions reloaded:', result);
    } catch (error) {
      console.error('Error reloading permissions:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => setExpanded(true)}
        >
          Debug Permissions
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-0 z-50 w-96 p-4 bg-white dark:bg-gray-800 border rounded-tl-lg shadow-lg max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Permission Debugger</h3>
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
        >
          Close
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">Authentication Status</h4>
          <div className="text-sm grid grid-cols-2 gap-2">
            <div>Authenticated:</div> 
            <div>{isAuthenticated ? '✅ Yes' : '❌ No'}</div>
            
            <div>User ID:</div> 
            <div>{user?.id || 'Not logged in'}</div>
            
            <div>Role:</div> 
            <div>{user?.role || 'N/A'}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-1">Permission State</h4>
          <div className="text-sm grid grid-cols-2 gap-2">
            <div>Initialized:</div> 
            <div>{isInitialized ? '✅ Yes' : '❌ No'}</div>
            
            <div>Loading:</div> 
            <div>{isLoading ? '⏳ Yes' : '✅ No'}</div>
            
            <div>Permissions Count:</div> 
            <div>{permissions.length}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-1">Key Permissions</h4>
          <div className="text-sm space-y-1">
            {keyPermissions.map(permission => (
              <div key={permission} className="flex justify-between">
                <div>{permission}:</div>
                <div>{hasPermission(permission) ? '✅ Granted' : '❌ Denied'}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Tools</h4>
          <Button 
            variant="default" 
            size="sm"
            className="w-full"
            onClick={handleRefreshPermissions}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Force Reload Permissions'}
          </Button>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium mb-1">All Permissions</h4>
          <div className="text-xs max-h-40 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-2 rounded">
            {permissions.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {permissions.map((p, i) => (
                  <li key={i}>{typeof p === 'object' && p !== null ? p.code : String(p)}</li>
                ))}
              </ul>
            ) : (
              <div className="text-red-500">No permissions loaded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDebugger;
