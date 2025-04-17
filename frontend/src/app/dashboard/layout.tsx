'use client';

import React, { useEffect } from 'react';
import DashboardLayout from '@/shared/layouts/dashboard/DashboardLayout';
import DashboardInitializer from './DashboardInitializer';
import ErrorBoundary from '@/shared/components/error/ErrorBoundary';

export default function AppDashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Force page reload if needed
  useEffect(() => {
    // After auth provider wraps this component, ensure we're on the client
    if (typeof window !== 'undefined') {
      // If there's a navigation error or dashboard is not loading properly,
      // this will ensure a fresh load if requested via a query parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reload') === 'true') {
        // Remove the reload parameter to prevent reload loops
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        console.log('Forced dashboard reload via parameter');
      }
    }
  }, []);
  
  return (
    <>
      <DashboardInitializer />
      <ErrorBoundary>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </ErrorBoundary>
    </>
  );
}
