'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/core/api';
import AuthService from '@/features/auth/core/AuthService';
import { getLogger } from '@/core/logging';
import PermissionRequestManager from '@/features/permissions/lib/utils/PermissionRequestManager';

// Get logger
const logger = getLogger();

// Define diagnostic test types
interface DiagnosticTest {
  name: string;
  description: string;
  run: () => Promise<any>;
}

// Define status types
type StatusType = 'pending' | 'running' | 'success' | 'error';

// Define result types
interface TestResult {
  test: string;
  status: StatusType;
  result: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export default function DiagnosticsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Define the diagnostic tests
  const diagnosticTests: DiagnosticTest[] = [
    {
      name: 'auth-status',
      description: 'Check authentication status',
      run: async () => {
        const isAuthenticated = await AuthService.isAuthenticated();
        const user = AuthService.getUser();
        return {
          isAuthenticated,
          user
        };
      }
    },
    {
      name: 'token-info',
      description: 'Get token information',
      run: async () => {
        const tokenInfo = await AuthService.getTokenInfo();
        const token = await AuthService.getToken();
        return {
          tokenInfo,
          tokenLengthIfExists: token ? token.length : 0,
          tokenFirstCharsIfExists: token ? token.substring(0, 5) + '...' : null
        };
      }
    },
    {
      name: 'validate-token',
      description: 'Validate current token with server',
      run: async () => {
        const token = await AuthService.getToken();
        if (!token) {
          return { valid: false, reason: 'No token available' };
        }
        
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        return {
          httpStatus: response.status,
          responseData: data
        };
      }
    },
    {
      name: 'current-user',
      description: 'Get current user information',
      run: async () => {
        try {
          const response = await ApiClient.get('/api/users/me');
          return response;
        } catch (error) {
          throw new Error(`Failed to get current user: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    },
    {
      name: 'user-permissions',
      description: 'Get user permissions directly',
      run: async () => {
        const userId = AuthService.getUser()?.id;
        if (!userId) {
          throw new Error('Not authenticated');
        }
        
        try {
          const response = await ApiClient.get(`/api/users/permissions?userId=${userId}`);
          return response;
        } catch (error) {
          throw new Error(`Failed to get permissions: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    },
    {
      name: 'permission-manager',
      description: 'Test permission manager',
      run: async () => {
        const userId = AuthService.getUser()?.id;
        if (!userId) {
          throw new Error('Not authenticated');
        }
        
        const permManager = PermissionRequestManager.getInstance();
        const requestId = `test-${Date.now()}`;
        const permissions = await permManager.getPermissions(userId, requestId);
        
        return {
          permissionCount: permissions.length,
          permissions: permissions
        };
      }
    },
    {
      name: 'sample-api-calls',
      description: 'Test sample API calls',
      run: async () => {
        // Define a proper type for the results object
        interface ApiResults {
          users?: any;
          dashboard?: any;
          [key: string]: any; // Add index signature for other potential properties
        }
        
        const results: ApiResults = {};
        
        // Try a few API endpoints
        try {
          results.users = await ApiClient.get('/api/users');
        } catch (error) {
          results.users = { error: error as Error };
        }
        
        try {
          results.dashboard = await ApiClient.get('/api/dashboard/stats');
        } catch (error) {
          results.dashboard = { error: error as Error };
        }
        
        return results;
      }
    },
    {
      name: 'cookie-inspection',
      description: 'Inspect cookies',
      run: async () => {
        // Proper type with index signature
        interface CookieRecord {
          [key: string]: string;
        }
        
        return document.cookie.split(';').reduce<CookieRecord>((acc, cookie) => {
          const [name, value] = cookie.trim().split('=');
          if (name) {
            acc[name] = value || '';
          }
          return acc;
        }, {});
      }
    },
    {
      name: 'token-refresh',
      description: 'Trigger token refresh',
      run: async () => {
        try {
          const refreshResult = await AuthService.refreshToken();
          return refreshResult;
        } catch (error) {
          throw new Error(`Refresh failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  ];

  // Set up logger to capture logs
  useEffect(() => {
    // Save original methods
    const originalDebug = logger.debug;
    const originalInfo = logger.info;
    const originalWarn = logger.warn;
    const originalError = logger.error;
    
    // Override with logging capture
    logger.debug = (message: string, ...args: any[]) => {
      setLogMessages(prev => [...prev, `[DEBUG] ${message} ${args.length ? JSON.stringify(args) : ''}`]);
      return originalDebug(message, ...args);
    };
    
    logger.info = (message: string, ...args: any[]) => {
      setLogMessages(prev => [...prev, `[INFO] ${message} ${args.length ? JSON.stringify(args) : ''}`]);
      return originalInfo(message, ...args);
    };
    
    logger.warn = (message: string, ...args: any[]) => {
      setLogMessages(prev => [...prev, `[WARN] ${message} ${args.length ? JSON.stringify(args) : ''}`]);
      return originalWarn(message, ...args);
    };
    
    logger.error = (message: string, ...args: any[]) => {
      setLogMessages(prev => [...prev, `[ERROR] ${message} ${args.length ? JSON.stringify(args) : ''}`]);
      return originalError(message, ...args);
    };
    
    // Clean up
    return () => {
      logger.debug = originalDebug;
      logger.info = originalInfo;
      logger.warn = originalWarn;
      logger.error = originalError;
    };
  }, []);

  // Initialize selected tests
  useEffect(() => {
    setSelectedTests(diagnosticTests.map(test => test.name));
  }, []);
  
  // Run selected diagnostic tests
  const runDiagnostics = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogMessages([]);
    
    // Initialize results with pending status
    const initialResults = selectedTests.map(testName => ({
      test: testName,
      status: 'pending' as StatusType,
      result: null
    }));
    
    setResults(initialResults);
    
    // Run each test sequentially
    for (const testName of selectedTests) {
      // Find the test
      const test = diagnosticTests.find(t => t.name === testName);
      if (!test) continue;
      
      // Update status to running
      setResults(prev => prev.map(r => 
        r.test === testName ? { ...r, status: 'running' as StatusType, startTime: Date.now() } : r
      ));
      
      try {
        // Run the test
        const result = await test.run();
        
        // Update results
        const endTime = Date.now();
        const startTime = results.find(r => r.test === testName)?.startTime || endTime;
        
        setResults(prev => prev.map(r => 
          r.test === testName ? { 
            ...r, 
            status: 'success' as StatusType, 
            result, 
            endTime,
            duration: endTime - startTime
          } : r
        ));
      } catch (error) {
        // Update with error
        const endTime = Date.now();
        const startTime = results.find(r => r.test === testName)?.startTime || endTime;
        
        setResults(prev => prev.map(r => 
          r.test === testName ? { 
            ...r, 
            status: 'error' as StatusType, 
            result: null, 
            error: error instanceof Error ? error.message : String(error),
            endTime,
            duration: endTime - startTime
          } : r
        ));
      }
    }
    
    setIsRunning(false);
  };
  
  // Toggle test selection
  const toggleTestSelection = (testName: string) => {
    if (selectedTests.includes(testName)) {
      setSelectedTests(prev => prev.filter(t => t !== testName));
    } else {
      setSelectedTests(prev => [...prev, testName]);
    }
  };
  
  // Select/deselect all tests
  const toggleAllTests = () => {
    if (selectedTests.length === diagnosticTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(diagnosticTests.map(t => t.name));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">System Diagnostics</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Selection</h2>
        <div className="flex items-center mb-2">
          <button 
            className="mr-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={toggleAllTests}
          >
            {selectedTests.length === diagnosticTests.length ? 'Deselect All' : 'Select All'}
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            onClick={runDiagnostics}
            disabled={isRunning || selectedTests.length === 0}
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {diagnosticTests.map(test => (
            <div key={test.name} className="flex items-center">
              <input 
                type="checkbox"
                id={`test-${test.name}`}
                checked={selectedTests.includes(test.name)}
                onChange={() => toggleTestSelection(test.name)}
                className="mr-2"
              />
              <label htmlFor={`test-${test.name}`} className="cursor-pointer">
                {test.description}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <div className="border rounded shadow-sm">
            {results.map(result => (
              <div key={result.test} className="p-4 border-b last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">
                    {diagnosticTests.find(t => t.name === result.test)?.description || result.test}
                  </h3>
                  <div className={`px-2 py-1 rounded text-sm ${
                    result.status === 'pending' ? 'bg-gray-200' :
                    result.status === 'running' ? 'bg-blue-200 text-blue-800' :
                    result.status === 'success' ? 'bg-green-200 text-green-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {result.status}
                    {result.duration && ` (${result.duration}ms)`}
                  </div>
                </div>
                
                {result.status === 'success' && (
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                )}
                
                {result.status === 'error' && (
                  <div className="text-red-600 bg-red-50 p-2 rounded">
                    {result.error}
                  </div>
                )}
              </div>
            ))}
            
            {results.length === 0 && (
              <div className="p-4 text-gray-500 italic">
                No tests run yet. Select tests and click "Run Diagnostics".
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Log Messages</h2>
          <div className="border rounded shadow-sm bg-gray-100 p-2">
            <pre className="text-xs overflow-auto max-h-96">
              {logMessages.length > 0 ? 
                logMessages.map((log, i) => <div key={i}>{log}</div>) : 
                <span className="text-gray-500 italic">No log messages captured yet.</span>
              }
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
