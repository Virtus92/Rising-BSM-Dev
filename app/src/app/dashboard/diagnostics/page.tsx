'use client';

import React from 'react';
import AuthDiagnostics from '@/features/auth/components/AuthDiagnostics';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Authentication and Permission Diagnostics Page
 * 
 * This page provides comprehensive tools for debugging authentication and permissions
 * It requires SYSTEM_ADMIN permission to access
 */
export default function DiagnosticsPage() {
  const { hasPermission, isLoading, error } = usePermissions();
  
  // Check if user is admin
  let isAdmin = false;
  let permissionError = error;
  
  try {
    isAdmin = hasPermission(SystemPermission.SYSTEM_ADMIN);
  } catch (err) {
    permissionError = err as Error;
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-center p-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-lg font-medium">Loading permission state...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Permission error
  if (permissionError) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-4">Permission Check Error</h2>
            <p className="mb-4">{permissionError.message}</p>
            <pre className="bg-white p-3 rounded text-sm overflow-auto max-h-96 text-red-600">
              {JSON.stringify(permissionError, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }
  
  // Access denied
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-yellow-700 mb-2">Access Restricted</h2>
            <p className="text-yellow-600">Administrator permissions are required to access this page.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Main diagnostics page for admins
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>
      
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-700 mb-2">About This Tool</h2>
        <p className="text-blue-600">
          This page provides detailed diagnostics for the authentication and permission systems.
          It's designed to help administrators troubleshoot issues by exposing the inner workings
          of these systems without any fallbacks or workarounds.
        </p>
      </div>
      
      <AuthDiagnostics />
      
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Technical Information</h2>
        <p className="text-gray-600 mb-2">
          The diagnostics tool directly exposes raw authentication and permission state without
          any fallbacks or automatic corrections. This helps identify the true causes of auth
          and permission issues.
        </p>
        <p className="text-gray-600">
          All fallback mechanisms have been removed from the codebase to improve error visibility
          and debugging.
        </p>
      </div>
    </div>
  );
}