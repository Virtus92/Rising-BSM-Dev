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
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  
  // Track initialization attempts to prevent infinite loops
  const MAX_RETRY_COUNT = 3;

  useEffect(() => {
    // Skip if we've tried too many times
    if (retryCount >= MAX_RETRY_COUNT) {
      console.warn(`DashboardInitializer: Max retry count (${MAX_RETRY_COUNT}) reached, redirecting to login`);
      router.push('/auth/login?error=max_retries');
      return;
    }
    
    // Rate limit initialization attempts
    const now = Date.now();
    if (lastAttemptTime > 0 && now - lastAttemptTime < 2000) {
      console.warn('DashboardInitializer: Attempted to initialize too quickly, delaying');
      const timeoutId = setTimeout(() => {
        setLastAttemptTime(Date.now());
        setRetryCount(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
    
    // Set attempt time
    setLastAttemptTime(now);
    
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
            console.log('DashboardInitializer: Initial authentication check failed, trying to refresh token');
            
            // If authentication failed, try to refresh the token
            try {
              const refreshed = await TokenManager.refreshAccessToken();
              
              if (!refreshed) {
                console.warn('DashboardInitializer: Token refresh failed');
                router.push('/auth/login?session=expired');
                return;
              }
              
              // After refresh, verify again
              const authAfterRefresh = await verifyAuthentication();
              if (!authAfterRefresh) {
                console.warn('DashboardInitializer: Authentication failed even after token refresh');
                router.push('/auth/login?session=expired');
                return;
              }
              
              console.log('DashboardInitializer: Token refresh successful, authentication verified');
            } catch (refreshError) {
              console.error('DashboardInitializer: Error during token refresh:', refreshError);
              router.push('/auth/login?error=refresh');
              return;
            }
          } else {
            console.log('DashboardInitializer: Authentication verified successfully');
          }
        } else {
          console.warn('DashboardInitializer: No authentication tokens found');
          router.push('/auth/login?auth=missing');
        }
      } catch (error) {
        console.error('DashboardInitializer: Error during initialization', 
          error instanceof Error ? error.message : String(error));
        
        // Increment retry count
        setRetryCount(prev => prev + 1);
        
        // If we still have retries left, don't redirect yet
        if (retryCount < MAX_RETRY_COUNT - 1) {
          console.log(`DashboardInitializer: Retrying initialization (attempt ${retryCount + 1}/${MAX_RETRY_COUNT})`);
          setIsInitializing(false); // This will trigger a re-render and retry
          return;
        }
        
        // On bootstrap error after all retries, redirect to login to reset the auth state
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
      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        // Make a direct call to the API to check authentication
        const response = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include',
          signal: controller.signal
        });
        
        // Clear timeout as request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`DashboardInitializer: Authentication check failed with status ${response.status}`);
          return false;
        }
        
        const data = await response.json();
        
        // More detailed checking of response
        if (data.success === true) {
          if (data.data) {
            // Confirm we have actual user data by checking for required fields
            return !!(data.data.id && data.data.email);
          } else if (data.id && data.email) {
            // Some APIs might return user data at the top level
            return true;
          }
        }
        
        console.warn('DashboardInitializer: Authentication check returned invalid user data');
        return false;
      } catch (fetchError) {
        // Clear timeout to prevent memory leaks
        clearTimeout(timeoutId);
        
        // Check if this was an abort error (timeout)
        if (fetchError.name === 'AbortError') {
          console.warn('DashboardInitializer: Authentication check timed out');
        } else {
          throw fetchError; // Re-throw other errors
        }
        
        return false;
      }
    } catch (error) {
      console.error('DashboardInitializer: Error checking authentication', 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  // This component doesn't render anything visible
  return null;
}
