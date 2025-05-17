'use client';

/**
 * Dashboard Layout
 * 
 * Provides centralized initialization for authentication, API client,
 * and permission service before rendering child components.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getLogger } from '@/core/logging';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import DashboardSidebar from '@/features/dashboard/components/DashboardSidebar';

// Logger instance
const logger = getLogger();

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth state
  const { isAuthenticated, isInitialized: authInitialized, user } = useAuth();
  const router = useRouter();
  // State for mobile sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Simplified dashboard layout - only handles authentication status, not initialization
  useEffect(() => {
    // Redirect to login if not authenticated once auth is initialized
    if (authInitialized && !isAuthenticated) {
      logger.warn('User not authenticated, redirecting to login');
      router.push('/auth/login?returnUrl=/dashboard');
    }
  }, [authInitialized, isAuthenticated, router]);
  
  // Render the dashboard layout with header and sidebar
  return (
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
    </div>
  );
}