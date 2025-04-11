'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This component initializes the dashboard by ensuring the authentication state is properly set
 * It runs synchronization of tokens and verifies authentication on dashboard load
 */
export default function DashboardInitializer() {
  const router = useRouter();

  useEffect(() => {
    async function initializeDashboard() {
      console.log('DashboardInitializer: Starting initialization');

      try {
        // Import TokenManager for token synchronization
        const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
        
        // Synchronize tokens between localStorage and cookies
        TokenManager.synchronizeTokens();
        
        // Check if we have any auth tokens
        let hasToken = false;
        
        // Check cookies
        const cookies = document.cookie.split(';').map(c => c.trim());
        hasToken = cookies.some(c => 
          c.startsWith('auth_token=') || 
          c.startsWith('auth_token_access=') || 
          c.startsWith('refresh_token=')
        );
        
        // If no tokens in cookies, check localStorage backup
        if (!hasToken) {
          const tokenBackup = localStorage.getItem('auth_token_backup');
          if (tokenBackup) {
            console.log('DashboardInitializer: Using token backup');
            hasToken = true;
            
            // Set cookies from backup
            document.cookie = `auth_token=${tokenBackup};path=/;max-age=3600`;
            document.cookie = `auth_token_access=${tokenBackup};path=/;max-age=3600`;
            
            const refreshTokenBackup = localStorage.getItem('refresh_token_backup');
            if (refreshTokenBackup) {
              document.cookie = `refresh_token=${refreshTokenBackup};path=/;max-age=86400`;
            }
          }
        }
        
        // If we have tokens, verify authentication
        if (hasToken) {
          console.log('DashboardInitializer: Found tokens, verifying authentication');
          
          // Use a direct authentication check
          const authOk = await verifyAuthentication();
          
          if (!authOk) {
            console.error('DashboardInitializer: Authentication verification failed');
            // If authentication failed, try to refresh the token
            const refreshed = await TokenManager.refreshAccessToken();
            
            if (!refreshed) {
              console.error('DashboardInitializer: Token refresh failed, redirecting to login');
              router.push('/auth/login?session=expired');
              return;
            }
            
            // After refresh, verify again
            const authAfterRefresh = await verifyAuthentication();
            if (!authAfterRefresh) {
              console.error('DashboardInitializer: Authentication still failed after refresh');
              router.push('/auth/login?session=expired');
              return;
            }
          }
          
          console.log('DashboardInitializer: Authentication verified');
        } else {
          console.error('DashboardInitializer: No tokens found, redirecting to login');
          router.push('/auth/login?auth=missing');
        }
      } catch (error) {
        console.error('DashboardInitializer: Error during initialization', error);
        // Don't redirect on error - let the app's normal auth flow handle it
      }
    }
    
    initializeDashboard();
  }, [router]);
  
  // Function to verify authentication by making a call to /api/users/me
  async function verifyAuthentication(): Promise<boolean> {
    try {
      // Make a direct call to the API to check authentication
      const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('DashboardInitializer: Authentication check failed', response.status);
        return false;
      }
      
      const data = await response.json();
      return data.success === true && !!data.data;
    } catch (error) {
      console.error('DashboardInitializer: Error checking authentication', error);
      return false;
    }
  }

  // This component doesn't render anything
  return null;
}
