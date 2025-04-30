'use client';

import React, { useEffect } from 'react';
import DashboardLayout from '@/shared/layouts/dashboard/DashboardLayout';
import DashboardInitializer from './DashboardInitializer';
import ErrorBoundary from '@/shared/components/error/ErrorBoundary';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getItem } from '@/shared/utils/storage/cookieStorage';

export default function AppDashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { refreshAuth } = useAuth();
  
  // Check for check_auth_local cookie which indicates we should use localStorage tokens
  useEffect(() => {
    const checkCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('check_auth_local='));
    
    if (checkCookie) {
      console.log('Dashboard layout detected check_auth_local cookie, refreshing auth state');
      
      // Clear the cookie immediately to prevent infinite loops
      document.cookie = 'check_auth_local=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Check localStorage for tokens
      const hasAuthToken = !!getItem('auth_token_backup');
      const hasRefreshToken = !!getItem('refresh_token_backup');
      
      if (hasAuthToken || hasRefreshToken) {
        console.log('Found tokens in localStorage, refreshing auth state');
        refreshAuth();
      }
    }
  }, [refreshAuth]);
  
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
