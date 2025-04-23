'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApi, isApiInitialized } from '@/infrastructure/api/ApiInitializer';
import { useAuth } from '@/features/auth/providers/AuthProvider';

// Global dashboard initialization state tracking with improved structure
const DASHBOARD_STATE_KEY = '__DASHBOARD_INIT_STATE';

if (typeof window !== 'undefined' && typeof (window as any)[DASHBOARD_STATE_KEY] === 'undefined') {
  (window as any)[DASHBOARD_STATE_KEY] = {
    initialized: false,
    inProgress: false,
    lastAttempt: 0,
    error: null,
    retryCount: 0,
    instanceCount: 0,
    lastSuccessTime: 0,
    // Track initialization checkpoints for better debugging
    checkpoints: {
      apiInitialized: false,
      tokensSynchronized: false,
      authVerified: false
    }
  };
}

// Import TokenManager and ClientTokenManager directly to avoid dynamic imports
import { TokenManager } from '@/infrastructure/auth/TokenManager';
import { ClientTokenManager } from '@/infrastructure/auth/ClientTokenManager';

/**
 * This component initializes the dashboard by ensuring the authentication state is properly set
 * It runs synchronization of tokens and verifies authentication on dashboard load
 */
export default function DashboardInitializer() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const initializationCompletedRef = useRef(false);
  
  // Get global state reference
  const globalDashboardState = typeof window !== 'undefined' ? (window as any).__DASHBOARD_INIT_STATE : null;
  const globalAuthState = typeof window !== 'undefined' ? (window as any).__AUTH_PROVIDER_STATE : null;
  const globalApiState = typeof window !== 'undefined' ? (window as any).__API_CLIENT_STATE : null;
  
  // Track initialization attempts to prevent infinite loops
  const MAX_RETRY_COUNT = 3;

  // Instance identity to prevent duplication issues
  const instanceIdRef = useRef<string>(`dashboard-init-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const initializationAttemptsRef = useRef<number>(0);
  
  // Deduplicate initialization attempts
  useEffect(() => {
    // Register this instance
    if (globalDashboardState) {
      globalDashboardState.instanceCount = (globalDashboardState.instanceCount || 0) + 1;
      console.debug(`DashboardInitializer: Instance ${instanceIdRef.current} registered (total: ${globalDashboardState.instanceCount})`);
    }
    
    return () => {
      // Unregister on unmount
      if (globalDashboardState) {
        globalDashboardState.instanceCount = Math.max(0, (globalDashboardState.instanceCount || 0) - 1);
        console.debug(`DashboardInitializer: Instance ${instanceIdRef.current} unregistered (remaining: ${globalDashboardState.instanceCount})`);
      }
    };
  }, []);
  
  // Main initialization logic with improved race condition handling and timeouts
  useEffect(() => {
    // Generate a unique ID for this initialization attempt to help with debugging
    const currentInitId = `init-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    
    // Skip if we've already successfully initialized
    if (initializationCompletedRef.current || 
        (globalDashboardState && globalDashboardState.initialized)) {
      console.log(`DashboardInitializer: Already initialized, skipping (${currentInitId})`);
      setIsInitializing(false); // Ensure loading state is cleared
      return;
    }
    
    // Skip if we've tried too many times
    if (retryCount >= MAX_RETRY_COUNT) {
      console.warn(`DashboardInitializer: Max retry count (${MAX_RETRY_COUNT}) reached, redirecting to login (${currentInitId})`);
      // Clear any existing tokens before redirecting to ensure clean login state
      try {
        import('@/infrastructure/auth/ClientTokenManager').then(({ ClientTokenManager }) => {
          ClientTokenManager.clearTokens();
          setTimeout(() => {
            router.push('/auth/login?error=max_retries');
          }, 100);
        });
      } catch (e) {
        router.push('/auth/login?error=max_retries');
      }
      return;
    }
    
    // Rate limit initialization attempts with clear logging
    const now = Date.now();
    if (lastAttemptTime > 0 && now - lastAttemptTime < 2000) {
      const delayMs = 2000;
      console.warn(`DashboardInitializer: Attempted to initialize too quickly, delaying for ${delayMs}ms (${currentInitId})`);
      const timeoutId = setTimeout(() => {
        setLastAttemptTime(Date.now());
        setRetryCount(prev => prev + 1);
      }, delayMs);
      return () => clearTimeout(timeoutId);
    }
    
    // Set attempt time and track it
    setLastAttemptTime(now);
    initializationAttemptsRef.current++;
    
    // Log initialization attempt for better debugging
    console.log(`DashboardInitializer: Starting initialization (${currentInitId}), attempt #${initializationAttemptsRef.current}`);
    
    // Track in-progress initializations with timeouts to prevent stuck state
    let initTimeoutId: NodeJS.Timeout | null = null;
    
    // Check if another instance is already in progress
    if (globalDashboardState && globalDashboardState.inProgress) {
      console.log(`DashboardInitializer: Another initialization in progress, waiting... (${currentInitId})`);
      // Set a timeout to check later
      const checkTimeout = setTimeout(() => {
        // If still initializing after timeout, try to take over
        if (globalDashboardState && globalDashboardState.inProgress) {
          const timeSinceLastAttempt = Date.now() - globalDashboardState.lastAttempt;
          if (timeSinceLastAttempt > 5000) { // If stuck for 5+ seconds
            console.warn(`DashboardInitializer: Taking over from stuck initialization (${currentInitId})`);
            // Clear stuck state
            if (globalDashboardState) {
              globalDashboardState.inProgress = false;
            }
            // Trigger retry
            setRetryCount(prev => prev + 1);
          }
        }
      }, 5000);
      return () => clearTimeout(checkTimeout);
    }
    
    // Start initialization with timeout protection
    initTimeoutId = setTimeout(() => {
      console.warn(`DashboardInitializer: Initialization timeout (${currentInitId})`);
      if (globalDashboardState) {
        globalDashboardState.inProgress = false;
      }
      setRetryCount(prev => prev + 1); // Trigger a retry
    }, 20000); // 20 second timeout - increased from 15s for more reliability
    
    // Ensure the global state is properly updated
    if (globalDashboardState) {
      globalDashboardState.inProgress = true;
      globalDashboardState.lastAttempt = now;
      globalDashboardState.currentInitId = currentInitId;
      globalDashboardState.checkpoints = {
        apiInitialized: false,
        tokensSynchronized: false,
        authVerified: false
      };
    }
    
    // Start initialization
    initializeDashboard(currentInitId, initTimeoutId).catch(error => {
      console.error(`DashboardInitializer: Unhandled error during initialization (${currentInitId}):`, error);
      
      // Clear timeout
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
      }
      
      // Clear in-progress flag
      if (globalDashboardState) {
        globalDashboardState.inProgress = false;
      }
      
      // Trigger retry if not exceeding max retries
      if (retryCount < MAX_RETRY_COUNT) {
        setRetryCount(prev => prev + 1);
      } else {
        // Redirect to login on too many failures
        router.push('/auth/login?error=init_error');
      }
    });
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
      }
      
      // Clean up global state on unmount
      if (globalDashboardState && globalDashboardState.currentInitId === currentInitId) {
        globalDashboardState.inProgress = false;
      }
    };
    
  // Initialize the dashboard with improved error handling and token synchronization
  async function initializeDashboard(initId: string, timeoutId: NodeJS.Timeout | null) {
    // Prevent concurrent initializations - verify global state is properly set
    if (globalDashboardState) {
      if (!globalDashboardState.inProgress || globalDashboardState.currentInitId !== initId) {
        // Make sure state is consistent
        globalDashboardState.inProgress = true;
        globalDashboardState.lastAttempt = Date.now();
        globalDashboardState.retryCount = retryCount;
        globalDashboardState.currentInitId = initId;
      }
    }
    
    try {
      // Set loading state
      setIsInitializing(true);
      
      // Record checkpoint - Start initialization
      if (globalDashboardState?.checkpoints) {
        globalDashboardState.checkpoints.apiInitialized = false;
        globalDashboardState.checkpoints.tokensSynchronized = false;
        globalDashboardState.checkpoints.authVerified = false;
      }
      
      // Initialize API client using the central ApiInitializer service
      console.log(`DashboardInitializer: Initializing API client (${initId})`);
      await initializeApi({
        force: false, // Don't force initialization unless necessary
        autoRefreshToken: true,
        handleImbalancedTokens: true, // Handle case where refresh token exists but auth token doesn't
        source: `dashboard-initializer-${initId}`,
        timeout: 10000, // 10 second timeout for API initialization
        headers: {
          'X-Client-Init': 'dashboard',
          'X-Init-ID': initId,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      // Record checkpoint - API initialized
      if (globalDashboardState?.checkpoints) {
        globalDashboardState.checkpoints.apiInitialized = true;
      }
      
      // Force synchronize tokens to ensure consistent state
      console.log(`DashboardInitializer: Synchronizing tokens... (${initId})`);
      
      try {
        const syncResult = await TokenManager.synchronizeTokens(true);
        console.log(`DashboardInitializer: Token synchronization result: ${JSON.stringify({ syncResult })} (${initId})`);
        
        // Record checkpoint - tokens synchronized
        if (globalDashboardState?.checkpoints) {
          globalDashboardState.checkpoints.tokensSynchronized = true;
        }

        // Check for token availability and consistency
        const hasAuthTokenBackup = !!localStorage.getItem('auth_token_backup');
        const hasRefreshTokenBackup = !!localStorage.getItem('refresh_token_backup');
        
        // Also check cookies for better diagnostics
        let authCookieFound = false;
        let refreshCookieFound = false;
        
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          authCookieFound = cookies.some(c => 
            c.trim().startsWith('auth_token=') || 
            c.trim().startsWith('accessToken=') || 
            c.trim().startsWith('auth_token_access='));
            
          refreshCookieFound = cookies.some(c => 
            c.trim().startsWith('refresh_token=') ||
            c.trim().startsWith('refreshToken=') ||
            c.trim().startsWith('refresh_token_access='));
            
          console.log(`DashboardInitializer: Cookie check results: ${JSON.stringify({ 
            hasAuthCookie: authCookieFound, 
            hasRefreshCookie: refreshCookieFound,
            cookieCount: cookies.length
          })}`);
        }
        
        // Check if we need to recover from an inconsistent state
        if ((!hasAuthTokenBackup && hasRefreshTokenBackup) || (!authCookieFound && refreshCookieFound)) {
          console.log(`DashboardInitializer: Found refresh token without auth token, attempting recovery (${initId})`);
          try {
            // Try to refresh the token to recover
            const refreshResult = await ClientTokenManager.refreshAccessToken();
            console.log(`DashboardInitializer: Token recovery attempt result: ${refreshResult} (${initId})`);
            
            // Synchronize again after recovery attempt
            await TokenManager.synchronizeTokens(true);
          } catch (recoveryError) {
            console.warn(`DashboardInitializer: Error during token recovery (${initId}):`, recoveryError);
          }
        }
      } catch (syncError) {
        console.warn(`DashboardInitializer: Error during token synchronization (${initId}):`, syncError);
        // Continue despite synchronization error - we'll check auth later
      }

      
      // Validate authentication tokens with improved reliability
      try {
        // Create a unique request ID for better tracking
        const authCheckId = `auth-check-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        // First try to synchronize with API endpoints for fresh token state 
        try {
          await ClientTokenManager.isLoggedIn(); // This will refresh tokens if needed
        } catch (loginCheckError) {
          console.warn(`DashboardInitializer: Error checking login status (${initId}):`, loginCheckError);
          // Continue with validation despite error
        }
        
        const hasToken = await hasValidAuthToken();
        
        // Log the token check result with debugging details
        console.log(`DashboardInitializer: Authentication token check: ${JSON.stringify({ 
          hasToken,
          hasAuthBackup: !!localStorage.getItem('auth_token_backup'),
          hasRefreshBackup: !!localStorage.getItem('refresh_token_backup'),
          authCheckId
        })} (${initId})`);
        
        // Record authentication check in global state
        if (globalDashboardState?.checkpoints) {
          globalDashboardState.checkpoints.authVerified = true;
        }
        
        // Call the bootstrap API endpoint for server-side initialization
        try {
          console.log(`DashboardInitializer: Calling bootstrap API (${initId})`);
          
          // Use AbortController for request timeout
          const controller = new AbortController();
          const bootstrapTimeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
          
          // Prepare authorization header if we have a token
          let authHeader = {};
          const accessToken = localStorage.getItem('auth_token_backup');
          if (accessToken) {
            authHeader = { 'Authorization': `Bearer ${accessToken}` };
          }
          
          // Make the bootstrap API call with more detailed headers
          const bootstrapResponse = await fetch('/api/bootstrap', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Client-Source': 'dashboard-initializer',
              'X-Init-ID': initId,
              'X-Auth-Check-ID': authCheckId,
              'X-Request-ID': `${initId}-${Date.now()}`,
              ...authHeader
            },
            credentials: 'include', // Include cookies
            signal: controller.signal
          });
          
          clearTimeout(bootstrapTimeoutId);

          if (bootstrapResponse.ok) {
            try {
              const bootstrapData = await bootstrapResponse.json();
              console.log(`DashboardInitializer: Bootstrap API successful (${initId})`);
              
              // If the bootstrap response contains auth/user information, extract it
              if (bootstrapData && bootstrapData.user) {
                console.log(`DashboardInitializer: Bootstrap response contains user data (${initId})`);
                // We could use this user data to update the auth state if needed
              }
            } catch (parseError) {
              console.warn(`DashboardInitializer: Error parsing bootstrap response (${initId}):`, parseError);
              // Non-critical error - continue with client-side checks
            }
          } else {
            console.warn(`Bootstrap API failed with status: ${bootstrapResponse.status} (${initId})`);
            
            // Check for auth failure specifically
            if (bootstrapResponse.status === 401 || bootstrapResponse.status === 403) {
              console.warn(`DashboardInitializer: Bootstrap API returned auth failure ${bootstrapResponse.status} (${initId})`);
              // Force clear tokens to ensure clean state
              await ClientTokenManager.clearTokens();
            }
            
            // Non-critical error - continue with client-side checks
          }
        } catch (bootstrapError) {
          // Check if it's an abort error
          if (bootstrapError instanceof DOMException && bootstrapError.name === 'AbortError') {
            console.warn(`DashboardInitializer: Bootstrap API timeout (${initId}), continuing with client checks`);
          } else {
            console.warn(`DashboardInitializer: Bootstrap API error (${initId}), continuing with client checks:`, 
              bootstrapError instanceof Error ? bootstrapError.message : String(bootstrapError));
          }
          // Non-critical error - continue with client-side auth verification
        }
        
      } catch (authValidationError) {
        console.error(`DashboardInitializer: Error validating authentication (${initId}):`, authValidationError);
        // If validation completely fails, assume no token
      }
      
      // Get the token status again after all checks and potential recovery attempts
      const hasToken = await hasValidAuthToken();
      
      // Verify authentication with detailed logging
      console.log(`DashboardInitializer: Verifying authentication (${initId}) - hasToken: ${hasToken}`);
      if (hasToken) {
        // Try to verify authentication through the AuthProvider first
        let authAttempt;
        try {
          // Use AbortController for auth timeout
          const controller = new AbortController();
          const authTimeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          // Create a promise that will abort after timeout
          const authPromise = refreshAuth();
          
          // Race between auth and timeout
          authAttempt = await Promise.race([
            authPromise,
            new Promise<boolean>((_, reject) => {
              setTimeout(() => {
                reject(new Error('Authentication verification timeout'));
              }, 5000);
            })
          ]);
          
          clearTimeout(authTimeoutId);
        } catch (refreshError) {
          console.warn(`DashboardInitializer: AuthProvider refresh error (${initId}):`, refreshError);
          authAttempt = false;
        }
        
        if (authAttempt) {
          console.log(`DashboardInitializer: Authentication verified successfully via AuthProvider (${initId})`);
          markInitializationComplete(initId, timeoutId);
          return;
        }

        // If AuthProvider verification failed, try to refresh the token directly
        console.log(`DashboardInitializer: AuthProvider verification failed, trying direct token refresh (${initId})`);
        const tokenRefreshed = await ClientTokenManager.refreshAccessToken();
        
        if (tokenRefreshed) {
        console.log(`DashboardInitializer: Token refreshed successfully (${initId})`);
        
        // Verify authentication after refresh
        const authAfterRefresh = await verifyAuthentication();
        if (authAfterRefresh) {
        console.log(`DashboardInitializer: Authentication verified after token refresh (${initId})`);
        markInitializationComplete(initId, timeoutId);
        return;
        }
        }
        
        // If we get here, all auth verification attempts failed
        console.warn(`DashboardInitializer: All authentication verification attempts failed (${initId})`);
        await ClientTokenManager.clearTokens(); // Clean up tokens
        router.push('/auth/login?session=expired');
        return;
      } else {
        console.warn(`DashboardInitializer: No valid authentication tokens found (${initId})`);
        router.push('/auth/login?auth=missing');
        return;
      }
    } catch (error) {
      console.error(`DashboardInitializer: Error during initialization (${initId})`, 
        error instanceof Error ? error.message : String(error));
      
      // Record error in global state
      if (globalDashboardState) {
        globalDashboardState.error = error instanceof Error ? 
          error.message : 'Initialization error';
        globalDashboardState.inProgress = false;
      }
      
      // Set error state for UI feedback
      setInitError(error instanceof Error ? error : new Error(String(error)));
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // If we still have retries left, don't redirect yet
      if (retryCount < MAX_RETRY_COUNT - 1) {
        console.log(`DashboardInitializer: Retrying initialization (attempt ${retryCount + 1}/${MAX_RETRY_COUNT}) (${initId})`);
        setIsInitializing(false); // This will trigger a re-render and retry
        return;
      }
      
      // On bootstrap error after all retries, redirect to login to reset the auth state
      router.push('/auth/login?error=init');
    } finally {
      // Clear init timeout if it exists to prevent spurious retries
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Always ensure we update state to prevent UI from getting stuck
      setIsInitializing(false);
      
      // Update global state when we're done
      if (globalDashboardState) {
        globalDashboardState.inProgress = false;
      }
    }
  }
    
    // Helper function to mark initialization as complete
    function markInitializationComplete(initId: string, timeoutId: NodeJS.Timeout | null) {
      // Clear any timeout to prevent race conditions
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Skip if already completed to prevent duplicate work
      if (initializationCompletedRef.current) {
        console.log(`DashboardInitializer: Already marked as complete (${initId})`);
        return;
      }
      
      // Update ref
      initializationCompletedRef.current = true;
      
      // Update global state with more detailed information
      if (globalDashboardState) {
        globalDashboardState.initialized = true;
        globalDashboardState.inProgress = false;
        globalDashboardState.error = null;
        globalDashboardState.lastSuccessTime = Date.now();
        globalDashboardState.completedInitId = initId;
      }
      
      // Update component state
      setIsInitializing(false);
      
      console.log(`DashboardInitializer: Initialization completed successfully (${initId})`);
      
      // Perform a final token synchronization to ensure everything is consistent
      setTimeout(async () => {
        try {
          await TokenManager.synchronizeTokens(true);
          console.log(`DashboardInitializer: Final token synchronization completed (${initId})`);
        } catch (finalSyncError) {
          console.warn(`DashboardInitializer: Final token synchronization failed (${initId}):`, finalSyncError);
          // Non-critical error - the app can still function
        }
      }, 500);
    }
    
  // Helper function to check if we have a valid auth token with better reliability and recovery
  async function hasValidAuthToken(): Promise<boolean> {
    try {
      const checkId = `token-check-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      console.log(`DashboardInitializer: Starting auth token check (${checkId})`);
      
      // First ensure tokens are synchronized properly
      await TokenManager.synchronizeTokens(true);

      // Check cookies for tokens - comprehensive check with better detection
      const cookies = document.cookie.split(';').map(c => c.trim());
      const authCookieNames = ['auth_token', 'auth_token_access', 'access_token', 'accessToken'];
      const refreshCookieNames = ['refresh_token', 'refresh_token_access', 'refresh', 'refreshToken'];
      
      // Parse cookies into a Map for more reliable checking - handle URL encoded values
      const cookieMap = new Map<string, string>();
      cookies.forEach(cookie => {
        const parts = cookie.split('=');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          // Join in case value contains = characters
          const value = parts.slice(1).join('='); 
          
          // Try to URL decode if necessary
          try {
            // Store both raw and decoded values to ensure we catch all cases
            cookieMap.set(name, value);
            const decodedValue = decodeURIComponent(value);
            if (decodedValue !== value) {
              cookieMap.set(`${name}_decoded`, decodedValue);
            }
          } catch (decodeError) {
            // If decode fails, still store the raw value
            cookieMap.set(name, value);
          }
        }
      });
      
      // Check for auth and refresh cookies with improved detection
      const authCookieFound = authCookieNames.some(name => cookieMap.has(name));
      const refreshCookieFound = refreshCookieNames.some(name => cookieMap.has(name));
      
      // Also check localStorage backups with reliable extraction
      let authTokenBackup = null;
      let refreshTokenBackup = null;
      
      try {
        authTokenBackup = localStorage.getItem('auth_token_backup');
        refreshTokenBackup = localStorage.getItem('refresh_token_backup');
      } catch (storageError) {
        console.warn('DashboardInitializer: Error accessing localStorage:', storageError);
      }
      
      // Log token state for debugging - comprehensive view
      console.log('DashboardInitializer: Token check results:', {
        checkId,
        cookies: {
          hasAuthCookie: authCookieFound,
          hasRefreshCookie: refreshCookieFound,
          cookieCount: cookies.length,
          authCookieNames: authCookieNames.filter(name => cookieMap.has(name)),
          refreshCookieNames: refreshCookieNames.filter(name => cookieMap.has(name))
        },
        localStorage: {
          hasAuthBackup: !!authTokenBackup,
          hasRefreshBackup: !!refreshTokenBackup
        },
        timestamp: new Date().toISOString()
      });
      
      // First, try to verify existing token with server validation
      if (authCookieFound || authTokenBackup) {
        try {
          // Create timeout protection
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          // Prepare headers with token if available
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Request-ID': `${checkId}-validate-${Date.now()}`,
            'X-Check-ID': checkId
          };
          
          // Include token in Authorization header if available in localStorage
          if (authTokenBackup) {
            headers['Authorization'] = `Bearer ${authTokenBackup}`;
          }
          
          // Try to validate the token using the validate endpoint
          const validationResponse = await fetch('/api/auth/validate', {
            method: 'GET',
            headers,
            credentials: 'include',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (validationResponse.ok) {
            try {
              // Parse response to check for complete validation
              const validationData = await validationResponse.json();
              
              if (validationData && validationData.success) {
                console.log('DashboardInitializer: Auth token validated successfully');
                return true;
              }
              
              console.warn('DashboardInitializer: Token validation response was OK but validation data indicates failure');
            } catch (parseError) {
              // Even if parsing fails, a 200 OK is still a good sign
              console.warn('DashboardInitializer: Error parsing token validation response:', parseError);
              console.log('DashboardInitializer: Considering token valid based on HTTP status 200');
              return true;
            }
          } else {
            console.warn(`DashboardInitializer: Token validation failed with status ${validationResponse.status}`);
            
            // Special handling for 401/403 responses
            if (validationResponse.status === 401 || validationResponse.status === 403) {
              console.warn('DashboardInitializer: Token validation indicates expired or invalid token');
            }
          }
        } catch (validationError) {
          // Check if this was a timeout
          if (validationError instanceof DOMException && validationError.name === 'AbortError') {
            console.warn('DashboardInitializer: Auth token validation timed out');
          } else {
            console.warn('DashboardInitializer: Auth token validation failed, continuing with refresh check:', validationError);
          }
        }
      }
      
      // If auth validation failed but we have a refresh token, try to refresh
      if (refreshCookieFound || refreshTokenBackup) {
        console.log(`DashboardInitializer: Found refresh token, attempting refresh (${checkId})`);
        
        try {
          // Attempt token refresh
          const refreshed = await ClientTokenManager.refreshAccessToken();
          
          if (refreshed) {
            console.log(`DashboardInitializer: Token refreshed successfully (${checkId})`);
            return true;
          }
          
          console.warn(`DashboardInitializer: Token refresh failed (${checkId})`);
        } catch (refreshError) {
          console.warn(`DashboardInitializer: Error refreshing token (${checkId}):`, refreshError);
        }
      }
      
      // Check if we have auth token after all attempts
      const finalAuthCheck = authCookieFound || !!authTokenBackup || 
                             !!localStorage.getItem('auth_token_backup');
                             
      if (finalAuthCheck) {
        console.log(`DashboardInitializer: Found auth token after all checks (${checkId})`);
        return true;
      }
      
      // No auth or refresh tokens found or refresh failed
      console.warn(`DashboardInitializer: No valid authentication tokens found (${checkId})`);
      return false;
    } catch (error) {
      console.error('DashboardInitializer: Error checking auth tokens:', 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  }, [router, refreshAuth, retryCount]);
  
  // Function to verify authentication by making a call to /api/users/me
  // This uses a direct fetch to bypass potential API client initialization issues
  async function verifyAuthentication(): Promise<boolean> {
    try {
      // Add request timeout with longer timeout for potential network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout
      
      try {
        // First try the direct token validation endpoint
        try {
          console.log('DashboardInitializer: Validating auth token directly');
          const validationResponse = await fetch('/api/auth/validate', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            credentials: 'include',
            signal: controller.signal
          });
          
          if (validationResponse.ok) {
            const validationData = await validationResponse.json();
            if (validationData.success) {
              console.log('DashboardInitializer: Token validation successful');
              // Token is valid but we still need to get the user data
              // We'll continue to the user data fetch
            }
          } else {
            console.warn('DashboardInitializer: Token validation failed with status', validationResponse.status);
            // Token validation failed but we'll still try the user fetch as fallback
          }
        } catch (validationError) {
          console.warn('DashboardInitializer: Token validation error:', validationError);
          // Continue to user fetch as fallback
        }
        
        // Make a direct call to the API to check authentication and get user data
        const response = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
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
        const error = fetchError as Error;
        if (error && error.name === 'AbortError') {
        console.warn('DashboardInitializer: Authentication check timed out');
        } else {
        console.error('DashboardInitializer: Error during authentication check:', error);
        // We'll try one more approach - checking with the AuthProvider
        try {
        // Use the refreshAuth from props instead of a new hook call
        const refreshResult = await refreshAuth();
        return refreshResult;
        } catch (authProviderError) {
        console.error('DashboardInitializer: Auth provider refresh failed:', authProviderError);
        throw fetchError; // Re-throw the original error
        }
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
