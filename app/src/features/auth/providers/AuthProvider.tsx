'use client';

import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserDto } from '@/domain/dtos/UserDtos';
import { LoginDto, RegisterDto } from '@/domain/dtos/AuthDtos';
import { UserRole } from '@/domain/enums/UserEnums';
import { getItem, setItem } from '@/shared/utils/storage/cookieStorage';

// Import from auth module
import AuthClient from '@/features/auth/lib/clients/AuthClient';
import { TokenManager } from '@/features/auth/lib/clients/token';
import { initializeAuth, isAuthenticated as checkAuthenticated } from '@/features/auth/utils/authUtils';
import { tokenUserToDto } from '@/features/auth/lib/clients/token/UserDtoAdapter';

// Global state tracking with proper types
const AUTH_PROVIDER_STATE_KEY = '__AUTH_PROVIDER_STATE';
const AUTH_PROVIDER_MOUNT_KEY = '__AUTH_PROVIDER_MOUNTED';

// Initialize global state for tracking
if (typeof window !== 'undefined') {
  if (typeof (window as any)[AUTH_PROVIDER_STATE_KEY] === 'undefined') {
    (window as any)[AUTH_PROVIDER_STATE_KEY] = {
      mounted: false,
      lastLoginTime: 0,
      lastLogoutTime: 0,
      lastRefreshTime: 0,
      userProfile: null,
      error: null,
      sessionExpired: false,
      instanceCount: 0,
      activeInstances: {},
      authPaths: {}
    };
  }
  
  // Initialize mount tracking
  if (typeof (window as any)[AUTH_PROVIDER_MOUNT_KEY] === 'undefined') {
    (window as any)[AUTH_PROVIDER_MOUNT_KEY] = {
      instances: 0,
      mountTimes: [],
      activeProviders: new Set()
    };
  }
}

/**
 * Custom authentication error class for proper error reporting
 */
class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'AUTHENTICATION_ERROR',
    public readonly details?: any,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export type AuthRole = UserRole;

export interface RegisterFormData extends RegisterDto {
  confirmPassword: string;
}

export interface AuthUser extends UserDto {}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshAuth: async () => false,
});

// List of paths that don't need auth checking
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/',
  '/public'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Instance identity tracking for better debugging
  const instanceIdRef = useRef<string>(`auth-provider-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Create a stable ID that won't change with React 18 double-mounting
  const stableId = useMemo(() => instanceIdRef.current, []);
  
  const [isFirstMount, setIsFirstMount] = useState<boolean>(true);
  
  // Prevent React 18 double-initialization issue
  const isRegisteredRef = useRef<boolean>(false);
  
  // Mount tracking with proper cleanup
  useEffect(() => {
    // Skip registration if already done (for React 18 strict mode)
    if (isRegisteredRef.current) {
      console.log(`AuthProvider already registered in this render cycle (instance: ${stableId})`);
      return;
    }
    
    // Mark as registered for this render cycle
    isRegisteredRef.current = true;
    
    // Track globally to prevent multiple providers
    if (typeof window !== 'undefined') {
      const mountRegistry = (window as any)[AUTH_PROVIDER_MOUNT_KEY];
      
      // Check if already registered
      if (mountRegistry.activeProviders && mountRegistry.activeProviders.has(stableId)) {
        console.log(`AuthProvider already registered (instance: ${stableId})`);
        return; // Exit early if already registered
      }
      
      // Register this instance
      mountRegistry.instances = (mountRegistry.instances || 0) + 1;
      mountRegistry.mountTimes.push(Date.now());
      
      // Add to active providers tracking
      if (mountRegistry.activeProviders) {
        mountRegistry.activeProviders.add(stableId);
      }
      
      // Track in global state 
      if ((window as any)[AUTH_PROVIDER_STATE_KEY]) {
        (window as any)[AUTH_PROVIDER_STATE_KEY].activeInstances[stableId] = Date.now();
      }
      
      // Warn if multiple instances
      if (mountRegistry.instances > 1) {
        console.warn(`Multiple AuthProvider instances detected (${mountRegistry.instances}) - this may cause issues!`);
        
        if (process.env.NODE_ENV === 'development') {
          console.warn('Active instances:', mountRegistry.activeProviders);
        }
      } else {
        console.log(`AuthProvider mounted (instance: ${stableId})`);
      }
      
      // Set global flag
      (window as any)[AUTH_PROVIDER_STATE_KEY].mounted = true;
      
      // Initialize authentication with improved coordination
      if (isFirstMount) {
        // Check if this is really the first render after considering stored state
        const authInitialized = typeof localStorage !== 'undefined' ? 
          getItem('auth_init_completed') === 'true' : false;
        
        if (authInitialized) {
          console.log(`AuthProvider: Using cached auth initialization (instance: ${stableId})`);
        } else {
          console.log(`AuthProvider: First mount, initializing auth (instance: ${stableId})`);
          
          initializeAuth({
            source: `AuthProvider-${stableId}`,
            detectDuplicates: true
          })
          .then(() => {
            // Store initialization state
            try {
              setItem('auth_init_completed', 'true');
              setItem('auth_init_timestamp', Date.now().toString());
            } catch (e) {
              console.warn('Failed to store auth initialization state:', e);
            }
          })
          .catch(error => {
            console.error(`AuthProvider: Error initializing auth system (instance: ${instanceIdRef}):`, error);
          });
        }
      }
    }
    
    // First mount detection for initialization logic
    if (isFirstMount) {
      setIsFirstMount(false);
    }
    
    return () => {
      // Clean up on unmount - but only if we actually registered
      if (typeof window !== 'undefined' && isRegisteredRef.current) {
        const mountRegistry = (window as any)[AUTH_PROVIDER_MOUNT_KEY];
        
        // Remove from active providers tracking
        if (mountRegistry && mountRegistry.activeProviders) {
          mountRegistry.activeProviders.delete(stableId);
        }
        
        // Remove from global state
        if ((window as any)[AUTH_PROVIDER_STATE_KEY]?.activeInstances) {
          delete (window as any)[AUTH_PROVIDER_STATE_KEY].activeInstances[stableId];
        }
        
        // Update instance count
        if (mountRegistry) {
          mountRegistry.instances = Math.max(0, (mountRegistry.instances || 1) - 1);
          console.log(`AuthProvider unmounted (instance: ${stableId}, remaining: ${mountRegistry.instances})`);
        }
        
        // Only clear global flag if this is the last instance
        if (mountRegistry && mountRegistry.instances === 0) {
          if ((window as any)[AUTH_PROVIDER_STATE_KEY]) {
            (window as any)[AUTH_PROVIDER_STATE_KEY].mounted = false;
          }
        }
      }
    };
  }, [isFirstMount]);

  // Access global state with proper typing
  const globalAuthState = typeof window !== 'undefined' ? (window as any)[AUTH_PROVIDER_STATE_KEY] : null;
  
  // React state for user and loading status
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if a path is public (no authentication required)
  const isPublicPath = useCallback((path: string | null): boolean => {
    if (!path) return false;
    
    // Normalize path (remove query parameters, lowercase)
    const normalizedPath = path.split('?')[0].toLowerCase();
    
    // Check if path matches exactly or starts with a public path prefix
    const isPublic = PUBLIC_PATHS.some(publicPath => {
      const normalizedPublicPath = publicPath.toLowerCase();
      return normalizedPath === normalizedPublicPath || 
             normalizedPath.startsWith(`${normalizedPublicPath}/`) ||
             normalizedPath.startsWith('/api/');
    });
    
    if (isPublic) {
      console.log(`AuthProvider: Path '${path}' is public`);
    }
    
    return isPublic;
  }, []);

  // Tracking and rate limiting state
  const isFetchingUserRef = useRef(false);
  const isProcessingAuthEventRef = useRef(false);
  const lastCheckedPathRef = useRef<string | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const lastSuccessfulRefreshTimeRef = useRef<number>(0);
  const lastLoginAttemptRef = useRef<number>(0);
  
  // Rate limiting constants
  const MINIMUM_REFRESH_INTERVAL = 5000; // 5 seconds
  const RECENT_SUCCESS_INTERVAL = 10000; // 10 seconds
  
  // Refresh authentication with improved coordination and deduplication
  const refreshAuth = useCallback(async (options: { force?: boolean } = {}): Promise<boolean> => {
    // Generate a unique ID for this refresh attempt for tracking
    const refreshId = `refresh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    try {
      // Check if we've recently done a successful refresh and have a user - common case optimization
      const now = Date.now();
      const hasRecentSuccess = now - lastSuccessfulRefreshTimeRef.current < RECENT_SUCCESS_INTERVAL;
      
      // Skip the optimization if force=true
      if (!options.force && hasRecentSuccess && user) {
        console.log(`AuthProvider [${instanceIdRef.current}]: Using recent successful auth (within ${RECENT_SUCCESS_INTERVAL}ms)`);
        return true;
      }
      
      // Create a static key for this refresh attempt for deduplication
      const dedupeKey = `auth_refresh_${Math.floor(now / 1000)}`;
      
      // First check for in-progress refreshes using global window state for sharing across components
      if (typeof window !== 'undefined') {
        // Initialize global state if needed
        if (!(window as any).__GLOBAL_AUTH_REFRESH_INFO) {
          (window as any).__GLOBAL_AUTH_REFRESH_INFO = {
            inProgress: false,
            lastAttemptTime: 0,
            lastSuccessTime: 0,
            currentPromise: null,
            activeRefreshes: {}
          };
        }
        
        const globalRefresh = (window as any).__GLOBAL_AUTH_REFRESH_INFO;
        
        // Check for very recent successful refresh (2 seconds)
        const ULTRA_RECENT_SUCCESS = 2000; // 2 seconds
        if (globalRefresh.lastSuccessTime && 
            now - globalRefresh.lastSuccessTime < ULTRA_RECENT_SUCCESS) {
          console.log(`AuthProvider: Using recent global refresh result (${refreshId})`);
          // Update local success time
          lastSuccessfulRefreshTimeRef.current = globalRefresh.lastSuccessTime;
          return true;
        }
        
        // Check if we're already refreshing with the same deduplication key
        if (globalRefresh.activeRefreshes && globalRefresh.activeRefreshes[dedupeKey]) {
          console.log(`AuthProvider: Already refreshing auth with same key, reusing promise (${refreshId})`);
          try {
            // Wait for the existing operation and reuse result
            return await globalRefresh.activeRefreshes[dedupeKey];
          } catch (error) {
            console.warn(`AuthProvider: Reused refresh promise failed (${refreshId}):`, error as Error);
            // Continue to refresh ourselves if the shared promise failed
          }
        }
        
        // If another refresh is in progress, wait for it
        if (globalRefresh.inProgress && globalRefresh.currentPromise) {
          console.log(`AuthProvider: Another refresh is in progress, waiting for it (${refreshId})`);
          try {
            return await globalRefresh.currentPromise;
          } catch (error) {
            console.warn(`AuthProvider: Waiting for existing refresh failed (${refreshId}):`, error as Error);
            // Continue to refresh ourselves if the shared promise failed
          }
        }
      }
      
      // Local instance checks
      
      // Prevent concurrent auth refreshes in this component instance
      if (isFetchingUserRef.current) {
        console.log(`AuthProvider: Already refreshing auth in this component, skipping duplicate call (${refreshId})`);
        return !!user; // Return current auth state
      }
      
      // Rate limit refreshes to prevent flooding from this component instance
      if (now - lastRefreshTimeRef.current < MINIMUM_REFRESH_INTERVAL) {
        console.log(`AuthProvider: Refresh attempt too frequent, using cached state (${refreshId})`);
        return !!user;
      }
      
      // If we got here, we're going to perform the refresh
      console.log(`AuthProvider [${instanceIdRef.current}]: Refreshing authentication (${refreshId})`);
      
      // Update refresh timestamp
      lastRefreshTimeRef.current = now;
      
      // Update global state if available
      if (globalAuthState) {
        globalAuthState.lastRefreshTime = now;
        globalAuthState.lastRefreshId = refreshId;
      }
      
      // Set up global refresh tracking
      let globalRefresh: any = null;
      if (typeof window !== 'undefined') {
        globalRefresh = (window as any).__GLOBAL_AUTH_REFRESH_INFO;
        globalRefresh.inProgress = true;
        globalRefresh.lastAttemptTime = now;
      }
      
      // Set fetching flag to prevent concurrent requests
      isFetchingUserRef.current = true;
      
      // Create a cleanup function for global state
      const cleanupGlobalState = (result: boolean) => {
        if (typeof window !== 'undefined' && (window as any).__GLOBAL_AUTH_REFRESH_INFO) {
          const globalState = (window as any).__GLOBAL_AUTH_REFRESH_INFO;
          // Update success time on success
          if (result) {
            globalState.lastSuccessTime = Date.now();
          }
          // Clear in-progress flag
          globalState.inProgress = false;
          globalState.currentPromise = null;
          // Clear from active refreshes
          if (globalState.activeRefreshes && globalState.activeRefreshes[dedupeKey]) {
            delete globalState.activeRefreshes[dedupeKey];
          }
        }
      };
      
      // Create the main refresh promise
      const refreshPromise = (async () => {
        try {
          // First ensure tokens are properly synchronized
          await TokenManager.synchronizeTokens(true);
          
          // First check if we have a valid auth token
          const hasAuthToken = !!getItem('auth_token_backup');
          const hasRefreshToken = !!getItem('refresh_token_backup');
          
          console.log(`AuthProvider: Token status check - auth: ${hasAuthToken}, refresh: ${hasRefreshToken} (${refreshId})`);
          
          // First try to get the current user if we have an auth token
          if (hasAuthToken) {
            console.log(`AuthProvider: Attempting to get current user (${refreshId})`);
            try {
              const response = await AuthClient.getCurrentUser();
              
              // Handle timeout case - no fallback, throw error
              if (response.timeoutOccurred && response.statusCode === 408) {
                throw new AuthenticationError(
                  `Authentication API timed out with status ${response.statusCode}`,
                  'API_TIMEOUT',
                  { refreshId, response },
                  408
                );
              }
              
              // Check if the response has data even if success is not explicitly true
              // This handles cases where the API response format might be inconsistent
              if ((response.success && response.data) ||
                  (!response.success && response.data && response.data.id)) {
                // Extract user data, normalizing between different response formats
                const userData = response.data;
                console.log(`AuthProvider [${instanceIdRef.current}]: User authenticated successfully (${refreshId})`);
                setUser(userData);
                
                // Update successful refresh timestamp
                lastSuccessfulRefreshTimeRef.current = Date.now();
                
                // Update global state
                if (globalAuthState) {
                  globalAuthState.userProfile = { ...userData };
                  globalAuthState.sessionExpired = false;
                  globalAuthState.lastSuccessfulRefresh = lastSuccessfulRefreshTimeRef.current;
                }
                
                return true;
              } else if (response.statusCode === 401 || response.statusCode === 403) {
                // Authentication failed - throw error instead of continuing silently
                throw new AuthenticationError(
                  `Authentication failed with status ${response.statusCode}`,
                  'AUTH_FAILURE',
                  { response, refreshId },
                  response.statusCode || 401
                );
              } else if (response.statusCode !== undefined && response.statusCode >= 500) {
                // Server error - throw error instead of maintaining session
                throw new AuthenticationError(
                  `Server error (${response.statusCode}) during authentication check`,
                  'SERVER_ERROR',
                  { response, refreshId },
                  response.statusCode
                );
              }
            } catch (userError) {
              // Network or parsing error - throw error instead of silent fallback
              if (!(userError instanceof AuthenticationError)) {
                throw new AuthenticationError(
                  `Error fetching current user: ${userError instanceof Error ? userError.message : String(userError)}`,
                  'NETWORK_ERROR',
                  { originalError: userError, refreshId },
                  500
                );
              }
              throw userError;
            }
          }
          
          // If no user data or no auth token, try token refresh
          if (hasRefreshToken) {
            console.log(`AuthProvider: Attempting token refresh (${refreshId})`);
            
            // Use TokenManager for token refresh
            const refreshSuccess = await TokenManager.refreshAccessToken();
            
            if (refreshSuccess) {
              // After successful refresh, synchronize tokens again
              await TokenManager.synchronizeTokens(true);
              
              // Get user data again after token refresh
              console.log(`AuthProvider: Token refreshed, getting user data (${refreshId})`);
              const newUserResponse = await AuthClient.getCurrentUser();
              
              if (newUserResponse.success && newUserResponse.data) {
                console.log(`AuthProvider [${instanceIdRef.current}]: User authenticated after token refresh (${refreshId})`);
                setUser(newUserResponse.data);
                
                // Update successful refresh timestamp
                lastSuccessfulRefreshTimeRef.current = Date.now();
                
                // Update global state
                if (globalAuthState) {
                  globalAuthState.userProfile = { ...newUserResponse.data };
                  globalAuthState.sessionExpired = false;
                  globalAuthState.lastSuccessfulRefresh = lastSuccessfulRefreshTimeRef.current;
                }
                
                // Notify about authentication success
                TokenManager.notifyAuthChange?.(true);
                
                return true;
              }
              // Failed to get user after token refresh - throw error
              throw new AuthenticationError(
                `Failed to retrieve user data after token refresh`,
                'USER_FETCH_AFTER_REFRESH_FAILED',
                { response: newUserResponse, refreshId }
              );
            }
            // Token refresh failed - throw error
            throw new AuthenticationError(
              `Token refresh failed`,
              'TOKEN_REFRESH_FAILED',
              { refreshId }
            );
          }
          
          // No auth token and no refresh token - authentication failed
          throw new AuthenticationError(
            `No valid authentication tokens found`,
            'NO_AUTH_TOKENS',
            { refreshId }
          );
        } catch (error) {
          // Add special handling for revoked refresh token errors
          // This prevents refresh token loops by clearing tokens when a token has been revoked
          if (error instanceof Error && 
              (error.message.includes('revoked') || 
               error.message.includes('Refresh token has been revoked') ||
               (error as any)?.code === 'AUTHENTICATION_REQUIRED')) {
            
            console.warn(`AuthProvider [${instanceIdRef.current}]: Detected revoked refresh token, clearing tokens to prevent loops (${refreshId})`);
            
            // Clear all tokens to break the loop
            try {
              await TokenManager.clearTokens();
            } catch (clearError) {
              console.error('Error clearing tokens after revoked token detection:', clearError);
            }
            
            // Update global state to indicate session expiry
            if (globalAuthState) {
              globalAuthState.sessionExpired = true;
            }
          }
          
          // Re-throw the error to be handled by the caller
          throw error;
        } finally {
          // Clear fetching flag with a slight delay to prevent race conditions
          setTimeout(() => {
            isFetchingUserRef.current = false;
          }, 300);
        }
      })();
      
      // Store the promise globally for deduplication
      if (typeof window !== 'undefined' && globalRefresh) {
        globalRefresh.currentPromise = refreshPromise;
        // Store in active refreshes with deduplication key
        if (!globalRefresh.activeRefreshes) {
          globalRefresh.activeRefreshes = {};
        }
        globalRefresh.activeRefreshes[dedupeKey] = refreshPromise;
      }
      
      try {
        const result = await refreshPromise;
        cleanupGlobalState(result);
        return result;
      } catch (error) {
        cleanupGlobalState(false);
        throw error;
      }
    } catch (error) {
      console.error(`AuthProvider [${instanceIdRef.current}]: Authentication refresh error (${refreshId}):`, error as Error);
      
      // Clear fetching flag
      isFetchingUserRef.current = false;
      
      // Always reset user state on authentication errors
      setUser(null);
      
      // Clear successful refresh timestamp
      lastSuccessfulRefreshTimeRef.current = 0;
      
      // Update global state
      if (globalAuthState) {
        globalAuthState.userProfile = null;
        globalAuthState.error = error instanceof Error ? error.message : 'Authentication refresh failed';
        globalAuthState.lastSuccessfulRefresh = 0;
        globalAuthState.sessionExpired = true;
      }
      
      // Update auth status even in case of error
      try {
        TokenManager.notifyAuthChange?.(false);
      } catch (notifyError) {
        console.error(`Failed to notify about auth change (${refreshId}):`, notifyError);
      }
      
      // Clear global refresh state
      if (typeof window !== 'undefined' && (window as any).__GLOBAL_AUTH_REFRESH_INFO) {
        (window as any).__GLOBAL_AUTH_REFRESH_INFO.inProgress = false;
        (window as any).__GLOBAL_AUTH_REFRESH_INFO.currentPromise = null;
      }
      
      throw error;
    }
  }, [user, globalAuthState, instanceIdRef]);

  // Path-based authentication check with improved error handling
  useEffect(() => {
    // Skip if no pathname
    if (!pathname) return;
    
    // Create a debounced check with unique ID
    const checkId = `check-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Check if we've already validated this path recently (use a longer window of 1000ms)
    const pathCheckDelay = 1000;
    if (pathname === lastCheckedPathRef.current && 
        Date.now() - lastRefreshTimeRef.current < pathCheckDelay) {
      console.debug(`AuthProvider: Skipping duplicate auth check for ${pathname} (${checkId})`);
      return;
    }
    
    // Update with current path
    lastCheckedPathRef.current = pathname;
    lastRefreshTimeRef.current = Date.now();
    
    // Track checked paths in global state
    if (globalAuthState) {
      globalAuthState.authPaths[pathname] = Date.now();
    }
    
    // Skip for public paths
    if (isPublicPath(pathname)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`AuthProvider [${instanceIdRef.current}]: Public path, skipping auth check: ${pathname}`);
      }
      setIsLoading(false);
      return;
    }
    
    // Check auth for protected paths with debouncing
    let authCheckTimeoutId: NodeJS.Timeout | null = null;
    
    const checkAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`AuthProvider [${instanceIdRef.current}]: Checking auth for protected path: ${pathname} (${checkId})`);
        }
        
        // If we already have a user and checked auth recently, skip the check
        if (user && Date.now() - lastSuccessfulRefreshTimeRef.current < 10000) {
          console.debug(`AuthProvider: Using recent auth validation for ${pathname}`);
          setIsLoading(false);
          return;
        }
        
        // Prevent concurrent checks
        if (isFetchingUserRef.current) {
          console.log(`AuthProvider: Auth check already in progress, waiting... (${checkId})`);
          // Wait for the existing check to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // If we have a user after waiting, we're good
          if (user) {
            setIsLoading(false);
            return;
          }
        }
        
        // Mark that we're checking auth - with a safety mechanism
        isFetchingUserRef.current = true;
        // Set a safety timeout to clear the flag if something goes wrong
        const safetyTimeoutId = setTimeout(() => {
          isFetchingUserRef.current = false;
        }, 5000);
        
        try {
          // Perform the auth check - will throw errors instead of falling back
          const isAuthed = await refreshAuth();
          
          // Clear the safety timeout
          clearTimeout(safetyTimeoutId);
          
          // Clear the fetching flag
          isFetchingUserRef.current = false;
          
          // Set loading false regardless of auth result
          setIsLoading(false);
          
          // If refresh succeeded and we have a user, we can stay on the current page
          if (isAuthed && user) {
            console.log(`AuthProvider [${instanceIdRef.current}]: Authentication successful for ${pathname} (${checkId})`);
            return;
          }
          
          // Only redirect if we don't have a user and authentication explicitly failed
          if (!isAuthed && !user) {
            console.log(`AuthProvider [${instanceIdRef.current}]: Access denied, redirecting to login (${checkId})`);
            // Update global state
            if (globalAuthState) {
              globalAuthState.sessionExpired = true;
              globalAuthState.userProfile = null;
            }
            
            // Create a clean returnUrl
            const returnUrl = encodeURIComponent(pathname);
            
            // Clear tokens
            try {
              TokenManager.clearTokens();
            } catch (clearError) {
              console.warn('Error clearing tokens during auth failure:', clearError);
            }
            
            // Redirect to login (using a timeout for better user experience)
            setTimeout(() => {
              router.push(`/auth/login?returnUrl=${returnUrl}&session=expired`);
            }, 100);
          }
        } catch (innerError) {
          // Clear the safety timeout
          clearTimeout(safetyTimeoutId);
          
          // Clear fetching flag on error
          isFetchingUserRef.current = false;
          
          // Re-throw to outer catch
          throw innerError;
        }
      } catch (error) {
        console.error(`AuthProvider [${instanceIdRef.current}]: Auth check error (${checkId}):`, error as Error);
        
        // Always redirect on error - don't maintain sessions on error
        setUser(null);
        
        // Update global state
        if (globalAuthState) {
          globalAuthState.error = error instanceof Error ? error.message : 'Authentication check failed';
          globalAuthState.sessionExpired = true;
          globalAuthState.userProfile = null;
        }
        
        const returnUrl = encodeURIComponent(pathname);
        const errorMsg = error instanceof Error ? encodeURIComponent(error.message) : 'auth_error';
        router.push(`/auth/login?returnUrl=${returnUrl}&error=${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Use a small delay before checking auth to prevent rapid checks during navigation
    authCheckTimeoutId = setTimeout(() => {
      checkAuth();
    }, 50); // Small delay to debounce multiple rapid path changes
    
    // Clean up timeout on unmount or path change
    return () => {
      if (authCheckTimeoutId) {
        clearTimeout(authCheckTimeoutId);
      }
    };
  }, [pathname, isPublicPath, refreshAuth, router, globalAuthState, user]);

  // Login function with improved coordination
  const login = async (credentials: LoginDto): Promise<void> => {
    try {
      // Rate limit login attempts
      const now = Date.now();
      const MIN_LOGIN_INTERVAL = 1000; // 1 second between attempts
      
      if (now - lastLoginAttemptRef.current < MIN_LOGIN_INTERVAL) {
        throw new Error('Please wait before trying again');
      }
      
      // Update attempt timestamp
      lastLoginAttemptRef.current = now;
      
      // Update global state
      if (globalAuthState) {
        globalAuthState.lastLoginTime = now;
        globalAuthState.error = null;
      }
      
      setIsLoading(true);
      setAuthError(null);
      
      // Get return URL from query parameters
      let returnUrl = typeof window !== 'undefined' ? 
        new URLSearchParams(window.location.search).get('returnUrl') : null;
      
      // Fix malformed returnUrl
      if (returnUrl) {
        // Replace double /api/api/ 
        returnUrl = returnUrl.replace(/\/api\/api\//g, '/api/');
        
        // If URL points to auth endpoints, redirect to dashboard
        if (returnUrl.startsWith('/api/auth/') || returnUrl.startsWith('/auth/')) {
          console.log('Fixing auth-related returnUrl:', returnUrl);
          returnUrl = '/dashboard';
        }
        
        console.log('Using returnUrl:', returnUrl);
      }
      
      console.log('Login attempt with returnUrl:', returnUrl);
      
      // Clear existing tokens
      TokenManager.clearTokens();
      
      // Ensure tokens are synchronized
      await TokenManager.synchronizeTokens(true);
      
      // Perform login
      const response = await AuthClient.login(credentials);
      
      if (!response.success) {
        console.error('Login response error:', response);
        throw new Error(response.message || `Login failed with status ${response.statusCode || 'unknown'}`);
      }
      
      console.log('Login successful, fetching user data');
      
      // Set user data if available in the response
      if (response.data && response.data.user) {
        console.log('Found user data in login response, setting directly:', response.data.user);
        setUser(response.data.user);
        
        // Update global state
        if (globalAuthState) {
          globalAuthState.userProfile = { ...response.data.user };
          globalAuthState.sessionExpired = false;
        }
        
        // Redirect after ensuring tokens are synchronized
        setTimeout(async () => {
          // Synchronize tokens before navigation
          await TokenManager.synchronizeTokens(true);
          
          // Wait for sync to complete
          setTimeout(() => {
            const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
              decodeURIComponent(returnUrl) : '/dashboard';
            
            console.log('Navigating to:', redirectPath);
            router.push(redirectPath);
          }, 300);
        }, 300);
        
        return;
      } else if (response.data && (response.data.id || response.data.email)) {
        console.log('Found direct user data in login response:', response.data);
        setUser(response.data);
        
        // Update global state
        if (globalAuthState) {
          globalAuthState.userProfile = { ...response.data };
          globalAuthState.sessionExpired = false;
        }
        
        // Redirect after ensuring tokens are synchronized
        setTimeout(async () => {
          // Synchronize tokens before navigation
          await TokenManager.synchronizeTokens(true);
          
          // Wait for sync to complete
          setTimeout(() => {
            const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
              decodeURIComponent(returnUrl) : '/dashboard';
            
            console.log('Navigating to:', redirectPath);
            router.push(redirectPath);
          }, 300);
        }, 300);
        
        return;
      }
      
      // If login requires user fetch
      if (response.requiresUserFetch) {
        console.log('No user data in login response, retrieving user profile');
        
        // Wait for token to be set by the server
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Get user data - with limited retries
          let userResponse = null;
          userResponse = await AuthClient.getCurrentUser();
          
          if (userResponse.success && userResponse.data) {
            console.log('User profile retrieved after login');
            setUser(userResponse.data);
            
            // Notify about auth change
            TokenManager.notifyAuthChange?.(true);
            
            // Wait to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Redirect
            const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
              decodeURIComponent(returnUrl) : '/dashboard';
            
            console.log('Navigating to:', redirectPath);
            router.push(redirectPath);
            return;
          }
          
          // If we got 401/403, throw error
          if (userResponse.statusCode === 401 || userResponse.statusCode === 403) {
            console.error('Authentication failed when fetching user profile');
            throw new Error(`Authentication failed when fetching user profile: ${userResponse.message || 'Unknown error'}`);
          }
          
          // No success, no clear error - throw generic error
          throw new Error('Failed to retrieve user profile after login');
        } catch (profileError) {
          console.error('User profile retrieval failed:', profileError);
          throw new Error('Authentication successful but profile unavailable');
        }
      }
      
      // No explicit error but no user data either - throw error
      throw new Error('Login succeeded but user data unavailable');
    } catch (error) {
      console.error('Login error:', error as Error);
      
      // Set error for UI feedback
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthError(errorMessage);
      
      // Update global state
      if (globalAuthState) {
        globalAuthState.error = errorMessage;
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Registration function
  const register = async (userData: RegisterDto): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await AuthClient.register(userData);
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      // Redirect to login after successful registration
      router.push('/auth/login?registered=true');
    } catch (error) {
      console.error('Registration error:', error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function with improved cleanup
  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out user...');
      
      // Update global state
      if (globalAuthState) {
        globalAuthState.lastLogoutTime = Date.now();
        globalAuthState.userProfile = null;
        globalAuthState.sessionExpired = false;
      }
      
      // Delete user status client-side first for immediate UI feedback
      setUser(null);
      
      // Clear tokens
      TokenManager.clearTokens();
      
      // Call logout endpoint - server deletes cookies
      await AuthClient.logout();
      
      // Notify about logout
      TokenManager.notifyAuthChange(false);
      console.log('User logged out successfully');
      
      console.log('Logout successful, redirecting to login page');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error as Error);
      
      // Force logout on client side even on error
      setUser(null);
      TokenManager.clearTokens();
      router.push('/auth/login');
    }
  };

  // Listen for auth status changes
  useEffect(() => {
    let authChangeHandler: EventListener | null = null;
    
    if (typeof window !== 'undefined') {
      const MIN_EVENT_INTERVAL = 500; // milliseconds
      let lastProcessedTime = 0;
      
      authChangeHandler = ((evt: Event) => {
        if (evt instanceof CustomEvent) {
          const customEvent = evt as CustomEvent<{ isAuthenticated: boolean }>;
          const { isAuthenticated } = customEvent.detail;
          const now = Date.now();
          
          // Skip rapid-fire events
          if (now - lastProcessedTime < MIN_EVENT_INTERVAL) {
            console.debug(`AuthProvider [${instanceIdRef.current}]: Auth event throttled`);
            return;
          }
          
          // Prevent concurrent processing
          if (isProcessingAuthEventRef.current) {
            console.debug(`AuthProvider [${instanceIdRef.current}]: Auth event ignored - already processing`);
            return;
          }
          
          console.debug(`AuthProvider [${instanceIdRef.current}]: Auth status changed event: ${isAuthenticated ? 'authenticated' : 'logged out'}`);
          isProcessingAuthEventRef.current = true;
          lastProcessedTime = now;
          
          // Use requestAnimationFrame to avoid blocking the main thread
          requestAnimationFrame(() => {
            try {
              if (isAuthenticated) {
                // Skip redundant refresh if we already have a user
                if (user) {
                  console.debug(`AuthProvider [${instanceIdRef.current}]: Already authenticated with user data, no action needed`);
                } else {
                  // Update user data on authentication
                  refreshAuth().catch(error => {
                    console.error(`AuthProvider [${instanceIdRef.current}]: Error refreshing auth after status change:`, error as Error);
                  });
                }
              } else {
                // Clear user data on logout
                setUser(null);
              }
            } catch (error) {
              console.error(`AuthProvider [${instanceIdRef.current}]: Error handling auth status change:`, error as Error);
            } finally {
              // Reset processing flag
              setTimeout(() => {
                isProcessingAuthEventRef.current = false;
              }, 300);
            }
          });
        }
      }) as EventListener;
      
      // Register the event listener
      window.addEventListener('auth_status_changed', authChangeHandler);
      console.debug(`AuthProvider [${instanceIdRef.current}]: Registered auth status listener`);
    }
    
    // Clean up listener
    return () => {
      if (typeof window !== 'undefined' && authChangeHandler) {
        window.removeEventListener('auth_status_changed', authChangeHandler);
        console.debug(`AuthProvider [${instanceIdRef.current}]: Removed auth status listener`);
      }
    };
  }, [refreshAuth, user, instanceIdRef]);

  // Safety timer to ensure flags don't get stuck
  useEffect(() => {
    const safetyTimer = setInterval(() => {
      // Clear potentially stuck flags
      if (isProcessingAuthEventRef.current || isFetchingUserRef.current) {
        console.log('Clearing potentially stuck processing flags');
        isProcessingAuthEventRef.current = false;
        isFetchingUserRef.current = false;
      }
      
      // Synchronize global state with local state
      if (globalAuthState && user) {
        globalAuthState.userProfile = { ...user };
      } else if (globalAuthState && !user) {
        globalAuthState.userProfile = null;
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(safetyTimer);
  }, [user, globalAuthState]);
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        register, 
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for using the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // In development, provide more helpful error message
  if (process.env.NODE_ENV !== 'production' && !context) {
    console.warn(
      'useAuth hook was used outside of AuthProvider. ' +
      'Make sure to wrap your component tree with AuthProvider.'
    );
    
    // Return a default implementation to prevent app crashes
    // This helps during development but still makes the issue visible in console
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => { throw new Error('Auth provider not available'); },
      register: async () => { throw new Error('Auth provider not available'); },
      logout: async () => { console.warn('Logout called outside AuthProvider'); },
      refreshAuth: async () => false
    };
  }
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
