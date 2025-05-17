'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Database, Code, ServerCrash } from 'lucide-react';

interface Props {
  /**
   * Component to render as children
   */
  children: ReactNode;
  
  /**
   * Optional fallback UI to render on error
   * If not provided, a default error message will be shown
   */
  fallback?: ReactNode;
  
  /**
   * Whether to display a detailed error message
   * Default is true
   */
  showDetails?: boolean;
}

interface State {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * The error that occurred, if any
   */
  error: Error | null;
}

/**
 * Error boundary specifically designed to catch server code usage in client components
 * 
 * This component will detect errors related to using server-only code in client components,
 * such as directly accessing Prisma in the browser, and display a helpful error message.
 */
export class ServerCodeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };
  
  /**
   * Catch errors during rendering
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  /**
   * Log error details to console
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Server code error in client component:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }
  
  /**
   * Determine if the error is related to server code usage
   */
  isServerCodeError(): boolean {
    const { error } = this.state;
    
    if (!error) return false;
    
    // Check for common server code error patterns
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    return (
      // Prisma errors
      errorMessage.includes('prisma') ||
      errorName.includes('prisma') ||
      
      // Server-only errors
      errorMessage.includes('server-only') ||
      errorMessage.includes('cannot be imported from a client component') ||
      
      // Database-related errors
      errorMessage.includes('database') ||
      errorMessage.includes('db connection') ||
      
      // Next.js server component errors
      errorMessage.includes('server component') ||
      errorMessage.includes('client reference') ||
      
      // Other common patterns
      stack.includes('getsourcefileorerror') ||
      errorMessage.includes('dynamic server usage')
    );
  }
  
  render() {
    const { children, fallback, showDetails = true } = this.props;
    const { hasError, error } = this.state;
    
    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }
      
      // Check if this is a server code error
      const isServerError = this.isServerCodeError();
      
      // Select the appropriate icon and message
      let Icon = AlertTriangle;
      let title = "Something went wrong";
      let message = "An unexpected error occurred.";
      
      if (isServerError) {
        Icon = Database;
        title = "Server Code in Client Component";
        message = "This component is trying to use server-only code (like Prisma or direct database access) in a client component.";
      }
      
      return (
        <div className="p-4 my-4 border rounded-md bg-red-50 border-red-200 text-red-800">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          
          <div className="mb-4 text-sm">
            <p>{message}</p>
            
            {isServerError && (
              <ul className="mt-2 list-disc list-inside">
                <li>Check for imports of server-only packages</li>
                <li>Use API clients instead of direct database access</li>
                <li>Use the service factory to get the right implementation</li>
                <li>See ARCHITECTURE.md for proper patterns</li>
              </ul>
            )}
          </div>
          
          {showDetails && error && (
            <div className="mt-4 p-3 bg-red-100 rounded-md text-xs overflow-auto max-h-48">
              <div className="font-semibold mb-1">{error.name}: {error.message}</div>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
            </div>
          )}
          
          {isServerError && (
            <div className="mt-4 p-3 bg-amber-100 text-amber-800 rounded-md text-sm">
              <strong>Solution:</strong> Use the service factory to get the client-side implementation:
              <pre className="mt-2 p-2 bg-amber-50 rounded">
{`// CORRECT
import { getPermissionService } from '@/core/factories';

// Get client-side implementation
const permissionService = getPermissionService();`}
              </pre>
              
              <div className="mt-2 font-semibold">Instead of:</div>
              <pre className="mt-1 p-2 bg-amber-50 rounded">
{`// INCORRECT
import { permissionService } from '@/features/permissions/lib/services/PermissionService';
// ❌ This imports server-only code directly`}
              </pre>
            </div>
          )}
        </div>
      );
    }
    
    return children;
  }
}

export default ServerCodeErrorBoundary;
