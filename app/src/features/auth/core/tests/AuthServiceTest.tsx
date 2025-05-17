'use client';

/**
 * AuthServiceTest.tsx
 * 
 * A component to test and verify the functionality of the new authentication system.
 * This component can be added to the diagnostics page to verify proper operation.
 */

import { useState, useEffect } from 'react';
import AuthService from '../AuthService';
import { getLogger } from '@/core/logging';
import { ApiClient } from '@/core/api/ApiClient';

const logger = getLogger();

export async function AuthServiceTest() {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const isAuthenticated = await AuthService.isAuthenticated();

  // Add to log function
  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
  };

  // Initialize on mount
  useEffect(() => {
    addLog('Component mounted, initializing AuthService...');
    
    AuthService.initialize()
      .then((success: boolean) => {
        setInitialized(true);
        setAuthenticated(isAuthenticated);
        setUser(AuthService.getUser());
        addLog(`AuthService initialized: ${success}, authenticated: ${AuthService.isAuthenticated()}`);
      })
      .catch((err: Error) => {
        setError(`Initialization error: ${err.message || 'Unknown error'}`);
        addLog(`ERROR: ${err.message || 'Unknown initialization error'}`);
      });
      
    // Subscribe to auth state changes
    const unsubscribe = AuthService.onAuthStateChange((state: any) => {
      addLog(`Auth state changed: authenticated=${state.isAuthenticated}, userId=${state.user?.id || 'none'}`);
      setAuthenticated(state.isAuthenticated);
      setUser(state.user);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Run connection test
  const runTest = async () => {
    setTesting(true);
    addLog('Starting authentication system test...');
    
    try {
      // Test 1: Check if initialized
      addLog(`Test 1: isInitialized = ${AuthService.isInitialized()}`);
      
      // Test 2: Check auth state
      const authState = AuthService.getAuthState();
      addLog(`Test 2: Auth state: ${JSON.stringify(authState)}`);
      
      // Test 3: Get and validate token
      addLog('Test 3: Getting token...');
      const token = await AuthService.getToken();
      addLog(`Token ${token ? 'received' : 'not available'}, length: ${token?.length || 0}`);
      
      // Test 4: Validate token
      addLog('Test 4: Validating token...');
      const isValid = token ? await AuthService.validateToken(token) : false;
      addLog(`Token validation result: ${isValid}`);
      
      // Test 5: Test API client integration
      addLog('Test 5: Testing API client integration...');
      await ApiClient.initialize();
      
      const testResponse = await ApiClient.get('/api/users/me');
      addLog(`API test result: ${testResponse.success ? 'Success' : 'Failed'}`);
      
      // Test 6: Test token refresh (if authenticated)
      if (authenticated) {
        addLog('Test 6: Testing token refresh...');
        const refreshResult = await AuthService.refreshToken();
        addLog(`Token refresh result: ${refreshResult.success ? 'Success' : 'Failed'}`);
      } else {
        addLog('Test 6: Skipped token refresh test (not authenticated)');
      }
      
      addLog('All tests completed!');
    } catch (err: any) {
      setError(`Test error: ${err.message || 'Unknown error'}`);
      addLog(`ERROR during test: ${err.message || 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Auth Service Test</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Status</p>
          <p className="mt-1">
            <span className={`px-2 py-1 rounded text-xs ${initialized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {initialized ? 'Initialized' : 'Not Initialized'}
            </span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${authenticated ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
              {authenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600">User</p>
          <p className="mt-1 text-sm">
            {user ? (
              <>
                ID: {user.id}, 
                Name: {user.name || 'N/A'}, 
                Role: {user.role || 'N/A'}
              </>
            ) : (
              'No user'
            )}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex mb-4">
        <button
          onClick={runTest}
          disabled={testing}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Test'}
        </button>
      </div>
      
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Log</p>
        <div className="h-60 overflow-y-auto border rounded p-2 bg-gray-50">
          {log.length === 0 ? (
            <p className="text-sm text-gray-400">No log messages</p>
          ) : (
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {log.join('\n')}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthServiceTest;