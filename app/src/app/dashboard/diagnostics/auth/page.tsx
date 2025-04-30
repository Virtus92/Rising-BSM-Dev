'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { AuthErrorDisplay } from '@/shared/components/AuthErrorDisplay';
import { AuthErrorType, authErrorHandler } from '@/features/auth/utils/AuthErrorHandler';
import { enableAuthDebugMode, disableAuthDebugMode, getAuthDebugConfig } from '@/features/auth/utils/AuthDebugMode';
import { getItem } from '@/shared/utils/storage/cookieStorage';

/**
 * Auth and Permissions Diagnostic Page
 * This page helps debug authentication and permission issues by providing detailed information
 * and tools to test various authentication and permission scenarios.
 */
export default function AuthDiagnosticPage() {
  const { user, isAuthenticated, isLoading, refreshAuth } = useAuth();
  const { permissions, isLoading: permissionsLoading, error: permissionsError, refetch: refetchPermissions } = usePermissions();
  
  const [localError, setLocalError] = useState<Error | null>(null);
  const [tokensInfo, setTokensInfo] = useState<any>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugConfig, setDebugConfig] = useState<any>(null);
  
  // Get token information from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const tokens = {
          authToken: !!getItem('auth_token_backup'),
          refreshToken: !!getItem('refresh_token_backup'),
          expiresAt: getItem('auth_expires_at'),
          timestamp: getItem('auth_timestamp'),
          authCookie: false,
          refreshCookie: false
        };
        
        // Check cookies
        const cookies = document.cookie.split(';');
        const authCookiePattern = /^(auth_token|accessToken|auth_token_access|access_token)=/;
        const refreshCookiePattern = /^(refresh_token)=/;
        tokens.authCookie = cookies.some(c => authCookiePattern.test(c.trim()));
        tokens.refreshCookie = cookies.some(c => refreshCookiePattern.test(c.trim()));
        
        setTokensInfo(tokens);
      } catch (error) {
        console.error('Error getting token info:', error);
        setLocalError(error instanceof Error ? error : new Error(String(error)));
      }
      
      // Check if debug mode is enabled
      const config = getAuthDebugConfig();
      setDebugEnabled(config.enabled);
      setDebugConfig(config);
    }
  }, []);
  
  // Toggle debug mode
  const toggleDebugMode = () => {
    if (debugEnabled) {
      disableAuthDebugMode();
      setDebugEnabled(false);
      setDebugConfig(getAuthDebugConfig());
    } else {
      enableAuthDebugMode();
      setDebugEnabled(true);
      setDebugConfig(getAuthDebugConfig());
    }
  };
  
  // Force error for testing
  const forceError = (errorType: string) => {
    try {
      switch (errorType) {
        case 'auth':
          throw authErrorHandler.createError(
            'Manual authentication error for testing',
            AuthErrorType.AUTH_REQUIRED,
            { source: 'diagnostic-page', triggered: new Date().toISOString() }
          );
        case 'permission':
          throw authErrorHandler.createPermissionError(
            'Manual permission error for testing',
            { source: 'diagnostic-page', triggered: new Date().toISOString() }
          );
        case 'token':
          throw authErrorHandler.createError(
            'Manual token error for testing',
            AuthErrorType.TOKEN_INVALID,
            { source: 'diagnostic-page', triggered: new Date().toISOString() }
          );
        case 'network':
          throw authErrorHandler.createError(
            'Manual network error for testing',
            AuthErrorType.NETWORK_ERROR,
            { source: 'diagnostic-page', triggered: new Date().toISOString() }
          );
        default:
          throw new Error(`Unknown error type: ${errorType}`);
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  // Clear forced error
  const clearError = () => {
    setLocalError(null);
  };
  
  // Force token refresh
  const forceTokenRefresh = async () => {
    try {
      const result = await refreshAuth();
      if (!result) {
        setLocalError(new Error('Token refresh failed'));
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication & Permissions Diagnostics</h1>
      
      {/* Debug Mode Controls */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Debug Mode</h2>
        <div className="flex items-center mb-4">
          <button
            onClick={toggleDebugMode}
            className={`px-4 py-2 rounded-md ${
              debugEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {debugEnabled ? 'Disable Debug Mode' : 'Enable Debug Mode'}
          </button>
          <span className="ml-2">Status: {debugEnabled ? '✅ Enabled' : '❌ Disabled'}</span>
        </div>
        
        {debugConfig && (
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-medium mb-2">Debug Configuration:</h3>
            <pre className="text-xs overflow-x-auto">{JSON.stringify(debugConfig, null, 2)}</pre>
          </div>
        )}
      </div>
      
      {/* Authentication Status */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        
        {isLoading ? (
          <div className="animate-pulse bg-gray-100 h-20 rounded"></div>
        ) : (
          <>
            <div className="mb-4">
              <span className="font-medium">Authenticated:</span> {isAuthenticated ? '✅ Yes' : '❌ No'}
            </div>
            
            {user && (
              <div className="bg-gray-100 p-3 rounded-md mb-4">
                <h3 className="font-medium mb-2">User Information:</h3>
                <div>
                  <p><span className="font-medium">ID:</span> {user.id}</p>
                  <p><span className="font-medium">Name:</span> {user.name}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Role:</span> {user.role}</p>
                </div>
              </div>
            )}
            
            {tokensInfo && (
              <div className="bg-gray-100 p-3 rounded-md mb-4">
                <h3 className="font-medium mb-2">Token Status:</h3>
                <div>
                  <p>
                    <span className="font-medium">Auth Token (localStorage):</span> 
                    {tokensInfo.authToken ? '✅ Present' : '❌ Missing'}
                  </p>
                  <p>
                    <span className="font-medium">Refresh Token (localStorage):</span> 
                    {tokensInfo.refreshToken ? '✅ Present' : '❌ Missing'}
                  </p>
                  <p>
                    <span className="font-medium">Auth Token (cookie):</span> 
                    {tokensInfo.authCookie ? '✅ Present' : '❌ Missing'}
                  </p>
                  <p>
                    <span className="font-medium">Refresh Token (cookie):</span> 
                    {tokensInfo.refreshCookie ? '✅ Present' : '❌ Missing'}
                  </p>
                  <p>
                    <span className="font-medium">Expires At:</span> 
                    {tokensInfo.expiresAt ? new Date(tokensInfo.expiresAt).toLocaleString() : 'Not set'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <button
                onClick={forceTokenRefresh}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Force Token Refresh
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Permissions Status */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Permissions Status</h2>
        
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">Status:</span>
          {permissionsLoading ? (
            <span>⏳ Loading...</span>
          ) : permissionsError ? (
            <span className="text-red-500">❌ Error</span>
          ) : (
            <span className="text-green-500">✅ Loaded</span>
          )}
          
          <button
            onClick={() => refetchPermissions()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Refresh Permissions
          </button>
        </div>
        
        {permissionsError && (
          <AuthErrorDisplay 
            error={permissionsError} 
            showDetails={true}
            className="mb-4"
          />
        )}
        
        {permissions && permissions.length > 0 && (
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-medium mb-2">User Permissions ({permissions.length}):</h3>
            <div className="max-h-60 overflow-y-auto">
              <ul className="grid grid-cols-2 gap-1">
                {permissions.map((permission) => (
                  <li key={permission} className="text-sm">
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Error Testing */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Error Testing</h2>
        
        <div className="mb-4">
          <span className="font-medium">Force Error:</span>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => forceError('auth')}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
            >
              Authentication Error
            </button>
            <button
              onClick={() => forceError('permission')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"
            >
              Permission Error
            </button>
            <button
              onClick={() => forceError('token')}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
            >
              Token Error
            </button>
            <button
              onClick={() => forceError('network')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Network Error
            </button>
          </div>
        </div>
        
        {localError && (
          <div className="mt-4">
            <AuthErrorDisplay 
              error={localError} 
              showDetails={true}
              className="mb-4"
            />
            
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
            >
              Clear Error
            </button>
          </div>
        )}
      </div>
      
      {/* System Information */}
      <div className="p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        
        <div className="bg-gray-100 p-3 rounded-md">
          <h3 className="font-medium mb-2">Environment:</h3>
          <p><span className="font-medium">Node Environment:</span> {process.env.NODE_ENV}</p>
          <p><span className="font-medium">Browser:</span> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'}</p>
          <p><span className="font-medium">Date/Time:</span> {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
