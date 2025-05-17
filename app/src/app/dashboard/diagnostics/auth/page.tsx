'use client';

/**
 * Auth Diagnostics Page
 * 
 * Page for testing and debugging the authentication system
 */

import React from 'react';
import AuthServiceTest from '@/features/auth/core/tests/AuthServiceTest';
import { ApiClient } from '@/core/api/ApiClient';
import { getLogger } from '@/core/logging';
import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';

const logger = getLogger();

export default function AuthDiagnostics() {
  const { isAuthenticated, user } = useAuth();
  const [apiState, setApiState] = useState<any>({ initialized: false });
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  // Get API client status
  useEffect(() => {
    setApiState({
      initialized: ApiClient.isInitialized,
      baseUrl: ApiClient.getBaseUrl(),
    });
  }, []);
  
  // Test functions
  const testApiClient = async () => {
    setActiveTest('apiClient');
    setTestResults(prev => ({ ...prev, apiClient: { status: 'running' } }));
    
    try {
      // Initialize API client
      await ApiClient.initialize();
      
      // Try to get current user
      const response = await ApiClient.get('/api/users/me');
      
      setTestResults(prev => ({ 
        ...prev, 
        apiClient: { 
          status: 'completed', 
          initialized: ApiClient.isInitialized,
          userResponse: response.success ? 'Success' : 'Failed',
          responseData: response
        } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        apiClient: { 
          status: 'error', 
          error: error instanceof Error ? error.message : String(error)
        } 
      }));
    } finally {
      setActiveTest(null);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Authentication Diagnostics</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Auth Service Test */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Auth Service</h2>
          <AuthServiceTest />
        </div>
        
        {/* API Client Test */}
        <div>
          <h2 className="text-xl font-semibold mb-4">API Client</h2>
          <div className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded text-xs ${apiState.initialized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {apiState.initialized ? 'Initialized' : 'Not Initialized'}
                </span>
              </p>
            </div>
            
            <button
              onClick={testApiClient}
              disabled={activeTest === 'apiClient'}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {activeTest === 'apiClient' ? 'Testing...' : 'Test API Client'}
            </button>
            
            {testResults.apiClient && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Test Results</p>
                <div className="p-2 border rounded bg-gray-50">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(testResults.apiClient, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Auth State */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Auth Status</p>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded text-xs ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600">User Info</p>
              <div className="mt-1">
                {user ? (
                  <pre className="text-xs font-mono bg-gray-50 p-2 rounded">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500">No user data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
