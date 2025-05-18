'use client';

/**
 * Dashboard Layout
 * 
 * Provides centralized layout for dashboard pages and handles authentication
 * verification. Uses AppInitializer for proper initialization sequence.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getLogger } from '@/core/logging';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import DashboardSidebar from '@/features/dashboard/components/DashboardSidebar';
import AppInitializer from '@/features/app/components/AppInitializer';

// Import the Permission Debugger component
import { PermissionDebugger } from '@/features/permissions/components/PermissionDebugger';

// Logger instance
const logger = getLogger();

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth state
  const { isAuthenticated, isInitialized: authInitialized, user } = useAuth();
  const router = useRouter();
  // State for mobile sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Handle authentication status - let AppInitializer handle the sequence
  useEffect(() => {
    // Redirect to login if not authenticated once auth is initialized
    if (authInitialized && !isAuthenticated) {
      logger.warn('User not authenticated, redirecting to login');
      router.push('/auth/login?returnUrl=/dashboard');
    }
  }, [authInitialized, isAuthenticated, router]);
  
  // Use AppInitializer with debug option enabled for better visibility
  return (
    <AppInitializer
      options={{ debug: true }} // Enable debug mode to see initialization phases
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading dashboard...
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Initializing dashboard and permissions...
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Mobile sidebar */}
        <div className={`fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <DashboardSidebar />
        </div>
        
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block md:fixed md:top-0 md:left-0 md:bottom-0 md:w-64">
          <DashboardSidebar />
        </div>
        
        {/* Main content area */}
        <div className="md:pl-64">
          <DashboardHeader setSidebarOpen={setSidebarOpen} />
          
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
        
        {/* Add Permission Debugger - REMOVE IN PRODUCTION */}
        <PermissionDebugger />
      </div>
    </AppInitializer>
  );
}