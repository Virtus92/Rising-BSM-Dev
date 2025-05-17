'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { ApiClient } from '@/core/api/ApiClient';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/entities/User';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { getItem } from '@/shared/utils/storage/cookieStorage';

/**
 * Authentication and Permission Diagnostic Tool
 * 
 * This component provides a comprehensive diagnostic UI for troubleshooting
 * authentication and permission issues in the application. It shows:
 * 
 * - Authentication state
 * - Token information
 * - Permission state
 * - Service health
 * - API connectivity
 */
export const AuthDiagnostics: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshAuth } = useAuth();
  const { permissions, isLoading: permissionLoading, error: permissionError, loadPermissions } = usePermissions();
  // Retrieve role directly from user object for compatibility
  const userRole = user?.role;
  
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<Error | null>(null);
  
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<Error | null>(null);
  
  // Load diagnostic data from API
  const loadDiagnostics = async () => {
    setIsLoadingDiagnostics(true);
    setDiagnosticError(null);
    
    try {
      const response = await ApiClient.get('/api/debug/auth');
      
      if (response.success) {
        setDiagnosticData(response.data);
      } else {
        setDiagnosticError(new Error(`Failed to load diagnostics: ${response.message}`));
      }
    } catch (error) {
      setDiagnosticError(error instanceof Error ? error : new Error(String(error)));
      console.error('Error loading diagnostics:', error);
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };
  
  // Load health data from API
  const loadHealthData = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    
    try {
      const response = await ApiClient.get('/api/debug/health');
      
      if (response.success) {
        setHealthData(response.data);
      } else {
        setHealthError(new Error(`Failed to load health data: ${response.message}`));
      }
    } catch (error) {
      setHealthError(error instanceof Error ? error : new Error(String(error)));
      console.error('Error loading health data:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };
  
  // Manually check token
  const checkToken = () => {
    const getLocalStorageItems = () => {
      const items: Record<string, string> = {};
      
      // Since we're not using localStorage directly anymore,
      // we'll just check our known auth-related cookies
      const knownKeys = [
        'auth_token_backup', 'auth_token', 'refresh_token_backup',
        'auth_expires_at', 'auth_expires_in', 'auth_timestamp'
      ];
      
      knownKeys.forEach(key => {
        const value = getItem(key);
        if (value) {
          items[key] = value;
        }
      });
      
      return items;
    };
    
    const localStorageItems = getLocalStorageItems();
    
    const tokenRelatedItems = Object.entries(localStorageItems)
      .filter(([key]) => key.includes('token') || key.includes('auth'))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, string>);
    
    const getCookies = () => {
      return document.cookie.split(';')
        .map(cookie => cookie.trim().split('='))
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, string>);
    };
    
    const cookies = getCookies();
    
    return {
      localStorage: tokenRelatedItems,
      cookies,
      timestamp: new Date().toISOString()
    };
  };
  
  return (
    <div className="p-4 space-y-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Authentication & Permission Diagnostics</h2>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => refreshAuth()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Auth
        </button>
        <button
          onClick={() => loadPermissions()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Refresh Permissions
        </button>
        <button
          onClick={loadDiagnostics}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Load API Diagnostics
        </button>
        <button
          onClick={loadHealthData}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          Check System Health
        </button>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      
      {/* Authentication state */}
      <section className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">Authentication State</h3>
        {authLoading ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Loading authentication state...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold">
              Status: 
              <span className={isAuthenticated ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </span>
            </p>
            {user && (
              <div className="grid grid-cols-2 gap-2 max-w-md">
                <div className="font-medium">User ID:</div>
                <div>{user.id}</div>
                <div className="font-medium">Email:</div>
                <div>{user.email}</div>
                <div className="font-medium">Role:</div>
                <div>{user.role}</div>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Token Status (Manual Check)</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-80">
                {JSON.stringify(checkToken(), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
      
      {/* Permission state */}
      <section className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">Permission State</h3>
        {permissionLoading ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        ) : permissionError ? (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded">
            <p className="font-semibold">Error loading permissions:</p>
            <p>{permissionError}</p>
            <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify({ error: permissionError }, null, 2)}</pre>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold">
              User Role: <span className="ml-2">{userRole || 'Unknown'}</span>
            </p>
            <h4 className="font-semibold mt-4 mb-2">Permissions ({permissions.length})</h4>
            <div className="bg-gray-100 p-3 rounded max-h-60 overflow-auto">
              {permissions.length > 0 ? (
                <ul className="list-disc list-inside">
                  {permissions.map((perm, index) => (
                    <li key={index} className="text-sm">{perm.code}</li>
                  ))}
                </ul>
              ) : (
                <p className="italic text-gray-500">No permissions found</p>
              )}
            </div>

            <h4 className="font-semibold mt-4 mb-2">Critical Permission Check</h4>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              <div className="font-medium">Admin Access:</div>
              <div className={permissions.some(p => p.code === SystemPermission.SYSTEM_ADMIN) ? "text-green-600" : "text-red-600"}>
                {permissions.some(p => p.code === SystemPermission.SYSTEM_ADMIN) ? "Yes" : "No"}
              </div>
              <div className="font-medium">User Management:</div>
              <div className={permissions.some(p => p.code === SystemPermission.USERS_VIEW) ? "text-green-600" : "text-red-600"}>
                {permissions.some(p => p.code === SystemPermission.USERS_VIEW) ? "Yes" : "No"}
              </div>
              <div className="font-medium">Profile Access:</div>
              <div className={permissions.some(p => p.code === SystemPermission.PROFILE_VIEW) ? "text-green-600" : "text-red-600"}>
                {permissions.some(p => p.code === SystemPermission.PROFILE_VIEW) ? "Yes" : "No"}
              </div>
            </div>
          </div>
        )}
      </section>
      
      {/* System Health */}
      <section className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">System Health</h3>
        {isLoadingHealth ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Checking system health...</span>
          </div>
        ) : healthError ? (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded">
            <p className="font-semibold">Error checking system health:</p>
            <p>{healthError.message}</p>
          </div>
        ) : healthData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-w-md">
              <div className="font-medium">Overall Status:</div>
              <div className={healthData.status === 'OK' ? "text-green-600" : "text-red-600"}>
                {healthData.status}
              </div>
              <div className="font-medium">Database:</div>
              <div className={healthData.dbStatus?.connected ? "text-green-600" : "text-red-600"}>
                {healthData.dbStatus?.connected ? `Connected (${healthData.dbStatus.latency}ms)` : 'Disconnected'}
              </div>
              <div className="font-medium">Response Time:</div>
              <div>{healthData.responseTime}ms</div>
            </div>
            
            <h4 className="font-semibold mt-4 mb-2">Services</h4>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {Object.entries(healthData.services).map(([service, status]: [string, any]) => (
                <React.Fragment key={service}>
                  <div className="font-medium">{service}:</div>
                  <div className={status.available ? "text-green-600" : "text-red-600"}>
                    {status.available ? "Available" : "Unavailable"}
                  </div>
                </React.Fragment>
              ))}
            </div>
            
            <h4 className="font-semibold mt-4 mb-2">Auth Middleware Status</h4>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              <div className="font-medium">Available:</div>
              <div className={healthData.authMiddlewareStatus?.available ? "text-green-600" : "text-red-600"}>
                {healthData.authMiddlewareStatus?.available ? "Yes" : "No"}
              </div>
              <div className="font-medium">Has User ID:</div>
              <div className={healthData.authMiddlewareStatus?.hasUserId ? "text-green-600" : "text-red-600"}>
                {healthData.authMiddlewareStatus?.hasUserId ? "Yes" : "No"}
              </div>
            </div>
            
            <h4 className="font-semibold mt-4 mb-2">System Information</h4>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              <div className="font-medium">Environment:</div>
              <div>{healthData.systemInfo?.nodeEnv}</div>
              <div className="font-medium">Timestamp:</div>
              <div>{healthData.systemInfo?.timestamp}</div>
              {healthData.systemInfo?.uptime && (
                <>
                  <div className="font-medium">Uptime:</div>
                  <div>{healthData.systemInfo.uptime} seconds</div>
                </>
              )}
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => setHealthData(null)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Clear Health Data
              </button>
            </div>
          </div>
        ) : (
          <p>Click "Check System Health" to view system status.</p>
        )}
      </section>
      
      {/* API Diagnostics */}
      <section className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">API Diagnostics</h3>
        {isLoadingDiagnostics ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Loading API diagnostics...</span>
          </div>
        ) : diagnosticError ? (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded">
            <p className="font-semibold">Error loading diagnostics:</p>
            <p>{diagnosticError.message}</p>
          </div>
        ) : diagnosticData ? (
          <div className="space-y-4">
            <h4 className="font-semibold mb-2">System Diagnostics</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(diagnosticData, null, 2)}
            </pre>
            
            <div className="mt-4">
              <button
                onClick={() => setDiagnosticData(null)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Clear Diagnostic Data
              </button>
            </div>
          </div>
        ) : (
          <p>Click "Load API Diagnostics" to view detailed system diagnostics.</p>
        )}
      </section>
    </div>
  );
};

export default AuthDiagnostics;
