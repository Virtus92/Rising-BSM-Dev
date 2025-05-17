'use client';

/**
 * DashboardPermissionInitializer
 * 
 * Client-side component that ensures all required permissions are loaded
 * when the dashboard is accessed.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getLogger } from '@/core/logging';
import { PermissionClient } from '@/features/permissions/lib/clients/PermissionClient';
import { usePathname } from 'next/navigation';

// Define permissions that should be preloaded in the dashboard
const DASHBOARD_ESSENTIAL_PERMISSIONS = [
  'system.access',
  'dashboard.view',
  'profile.view',
  'requests.view',
  'customers.view',
  'users.view',
  'appointments.view'
];

// Define route-specific permissions - will be loaded based on current path
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/users': [
    'users.view',
    'users.create',
    'users.edit',
    'users.delete'
  ],
  '/dashboard/customers': [
    'customers.view',
    'customers.create',
    'customers.edit',
    'customers.delete'
  ],
  '/dashboard/requests': [
    'requests.view',
    'requests.create',
    'requests.edit',
    'requests.delete',
    'requests.assign',
    'requests.approve',
    'requests.reject'
  ],
  '/dashboard/appointments': [
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.delete'
  ],
  '/dashboard/settings': [
    'settings.view',
    'settings.edit'
  ],
  '/dashboard/permissions': [
    'roles.view',
    'roles.edit',
    'users.edit'
  ]
};

const logger = getLogger();

export function DashboardPermissionInitializer() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Skip if not authenticated or still loading
    if (!isAuthenticated || isLoading || !user) {
      return;
    }
    
    // If already initialized, don't run again
    if (isInitialized) {
      return;
    }

    const initializePermissions = async () => {
      try {
        logger.info('Initializing dashboard permissions');

        // Determine which permissions to load based on current route
        const routeSpecificPermissions: string[] = [];
        
        // Add route-specific permissions
        if (pathname) {
          // Find exact match first
          if (pathname in ROUTE_PERMISSIONS) {
            routeSpecificPermissions.push(...ROUTE_PERMISSIONS[pathname]);
          } else {
            // Check for parent routes
            Object.entries(ROUTE_PERMISSIONS).forEach(([route, permissions]) => {
              if (pathname.startsWith(route)) {
                routeSpecificPermissions.push(...permissions);
              }
            });
          }
        }

        // Combine essential and route-specific permissions (deduplicating)
        const permissionsToLoad = Array.from(
          new Set([...DASHBOARD_ESSENTIAL_PERMISSIONS, ...routeSpecificPermissions])
        );

        logger.debug('Loading dashboard permissions', {
          user,
          count: permissionsToLoad.length,
          permissions: permissionsToLoad
        });

        try {
          // First load all user permissions completely - this is crucial
          logger.info('Loading all permissions for user');
          await PermissionClient.getUserPermissions(user.id)
            .then(response => {
              if (response.success && response.data?.permissions) {
                logger.info(`Successfully loaded ${response.data.permissions.length} permissions`);
              } else {
                logger.error('Failed to load permissions: Invalid response structure', {
                  responseSuccess: response.success,
                  hasData: !!response.data,
                  hasPermissions: !!response.data?.permissions
                });
                throw new Error('Invalid permission response structure');
              }
            })
            .catch(error => {
              logger.error('Failed to load user permissions', {
                error: error instanceof Error ? error.message : String(error)
              });
              throw error; // Re-throw to handle in outer catch
            });
            
          // Now verify each essential permission individually
          const permissionPromises = permissionsToLoad.map(async perm => {
            try {
              const result = await PermissionClient.hasPermission(user.id, perm);
              logger.debug(`Permission check for ${perm}: ${result.success && result.data}`);
              return { permission: perm, result: result.success && result.data };
            } catch (error) {
              logger.warn(`Failed to verify permission ${perm}:`, {
                error: error instanceof Error ? error.message : String(error)
              });
              return { permission: perm, result: false, error };
            }
          });

          // Wait for all permission checks to complete
          const results = await Promise.all(permissionPromises);
          
          // Log missing permissions for diagnostics
          const missingPermissions = results.filter(r => !r.result).map(r => r.permission);
          if (missingPermissions.length > 0) {
            logger.warn(`User is missing essential permissions:`, {
              userId: user.id,
              missingPermissions
            });
          }

          logger.info('Dashboard permissions initialized successfully');
          setIsInitialized(true);
        } catch (error) {
          logger.error('Error initializing dashboard permissions', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Even on error, we need to mark as initialized to prevent dashboard from hanging
          setIsInitialized(true);
        }
      } catch (error) {
        logger.error('Unexpected error in permission initialization', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        setIsInitialized(true);
      }
    };

    // Run initialization
    initializePermissions();
  }, [isAuthenticated, isLoading, user, pathname, isInitialized]);

  // This component doesn't render anything visible
  return null;
}

export default DashboardPermissionInitializer;
