'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApi } from '@/infrastructure/api/ApiInitializer';

/**
 * This component initializes the dashboard by ensuring the authentication state is properly set
 * It runs synchronization of tokens and verifies authentication on dashboard load
 */
export default function DashboardInitializer() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function initializeDashboard() {
      try {
        // Initialize API client first
        await initializeApi();
        
        // Import TokenManager for token synchronization
        const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
        
        // Synchronize tokens between localStorage and cookies
        await TokenManager.synchronizeTokens();
        
        // Check if we have any auth tokens
        let hasToken = false;
        
        // Check cookies in a more consistent way
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
        
        // Call the bootstrap API endpoint for server-side checks
        const bootstrapResponse = await fetch('/api/bootstrap', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Include credentials to send cookies
          credentials: 'include'
        });

        if (!bootstrapResponse.ok) {
          throw new Error(`Bootstrap failed with status: ${bootstrapResponse.status}`);
        }

        const bootstrapData = await bootstrapResponse.json();
        if (!bootstrapData.success) {
          throw new Error(bootstrapData.message || 'Unknown bootstrap error');
        }
        
        // If we have tokens, verify authentication
        if (hasToken) {
          // Use a direct authentication check
          const authOk = await verifyAuthentication();
          
          if (!authOk) {
            // If authentication failed, try to refresh the token
            const refreshed = await TokenManager.refreshAccessToken();
            
            if (!refreshed) {
              router.push('/auth/login?session=expired');
              return;
            }
            
            // After refresh, verify again
            const authAfterRefresh = await verifyAuthentication();
            if (!authAfterRefresh) {
              router.push('/auth/login?session=expired');
              return;
            }
          }
        } else {
          router.push('/auth/login?auth=missing');
        }
      } catch (error) {
        console.error('DashboardInitializer: Error during initialization', 
          error instanceof Error ? error.message : String(error));
        
        // On bootstrap error, redirect to login to reset the auth state
        router.push('/auth/login?error=init');
      } finally {
        setIsInitializing(false);
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
        return false;
      }
      
      const data = await response.json();
      return data.success === true && !!data.data;
    } catch (error) {
      console.error('DashboardInitializer: Error checking authentication', 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  // This component doesn't render anything visible
  return null;
}
