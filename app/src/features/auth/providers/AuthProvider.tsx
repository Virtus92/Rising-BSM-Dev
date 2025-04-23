'use client';

import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserDto } from '@/domain/dtos/UserDtos';
import { LoginDto, RegisterDto } from '@/domain/dtos/AuthDtos';
import { UserRole } from '@/domain/enums/UserEnums';

// Import AuthClient
import AuthClient from '@/infrastructure/auth/AuthClient';
// TokenManager will be dynamically imported when needed

// More robust global state tracking with proper types
const AUTH_PROVIDER_STATE_KEY = '__AUTH_PROVIDER_STATE';
const AUTH_PROVIDER_MOUNT_KEY = '__AUTH_PROVIDER_MOUNTED';

// Global state for authentication status tracking
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

export type AuthRole = UserRole;

export interface RegisterFormData extends RegisterDto {
  confirmPassword: string;
}

export interface User extends UserDto {}

interface AuthContextType {
  user: UserDto | null;
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
  // Instance identity tracking for better debugging and error handling
  const instanceIdRef = useRef<string>(`auth-provider-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const [isFirstMount, setIsFirstMount] = useState<boolean>(true);
  
  // Single instance enforcement and mount tracking with proper cleanup
  useEffect(() => {
    // Track globally to prevent multiple providers
    if (typeof window !== 'undefined') {
      const mountRegistry = (window as any)[AUTH_PROVIDER_MOUNT_KEY];
      const instanceId = instanceIdRef.current;
      
      // Check if this instance is already registered (handles React 18 strict mode double-mount)
      if (mountRegistry.activeProviders && mountRegistry.activeProviders.has(instanceId)) {
        console.log(`AuthProvider already registered (instance: ${instanceId})`);
        return; // Exit early if already registered
      }
      
      // Register this instance
      mountRegistry.instances = (mountRegistry.instances || 0) + 1;
      mountRegistry.mountTimes.push(Date.now());
      
      // Add to active providers tracking
      if (mountRegistry.activeProviders) {
        mountRegistry.activeProviders.add(instanceId);
      }
      
      // Track in global state 
      if ((window as any)[AUTH_PROVIDER_STATE_KEY]) {
        (window as any)[AUTH_PROVIDER_STATE_KEY].activeInstances[instanceId] = Date.now();
      }
      
      // Warn if multiple instances
      if (mountRegistry.instances > 1) {
        console.warn(`Multiple AuthProvider instances detected (${mountRegistry.instances}) - this may cause issues!`);
        // In development, show more details about the instances
        if (process.env.NODE_ENV === 'development') {
          console.warn('Active instances:', mountRegistry.activeProviders);
        }
      } else {
        console.log(`AuthProvider mounted (instance: ${instanceId})`);
      }
      
      // Set global flag
      (window as any)[AUTH_PROVIDER_STATE_KEY].mounted = true;
      
      // Initialize authentication system
      const initAuth = async () => {
        try {
          // Import and initialize in sequence
          const { ClientTokenManager } = await import('@/infrastructure/auth/ClientTokenManager');
          const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
          
          // First initialize client token manager
          await ClientTokenManager.initialize();
          
          // Then synchronize tokens to ensure consistency
          await TokenManager.synchronizeTokens(true);
          
          console.log(`AuthProvider: Authentication system initialized (instance: ${instanceId})`);
        } catch (initError) {
          console.error(`AuthProvider: Error initializing auth system (instance: ${instanceId}):`, initError);
        }
      };
      
      // Only initialize on first mount
      if (isFirstMount) {
        initAuth();
      }
    }
    
    // First mount detection for initialization logic
    if (isFirstMount) {
      setIsFirstMount(false);
    }
    
    return () => {
      // Clean up on unmount
      if (typeof window !== 'undefined') {
        const mountRegistry = (window as any)[AUTH_PROVIDER_MOUNT_KEY];
        const instanceId = instanceIdRef.current;
        
        // Remove from active providers tracking
        if (mountRegistry.activeProviders) {
          mountRegistry.activeProviders.delete(instanceId);
        }
        
        // Remove from global state
        if ((window as any)[AUTH_PROVIDER_STATE_KEY]?.activeInstances) {
          delete (window as any)[AUTH_PROVIDER_STATE_KEY].activeInstances[instanceId];
        }
        
        // Update instance count
        mountRegistry.instances = Math.max(0, mountRegistry.instances - 1);
        console.log(`AuthProvider unmounted (instance: ${instanceId}, remaining: ${mountRegistry.instances})`);
        
        // Only clear global flag if this is the last instance
        if (mountRegistry.instances === 0) {
          (window as any)[AUTH_PROVIDER_STATE_KEY].mounted = false;
        }
      }
    };
  }, [isFirstMount]);

  // Global state helper with proper typing
  const globalAuthState = typeof window !== 'undefined' ? (window as any)[AUTH_PROVIDER_STATE_KEY] : null;
  
  // Normal React state
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Helper function to check if a path is public (no authentication required)
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
    
    // For debugging only
    if (isPublic) {
      console.log(`AuthProvider: Path '${path}' is public`);
    }
    
    return isPublic;
  }, []);

  // Track whether we're currently fetching user data
  const isFetchingUserRef = useRef(false);
  // Ref for preventing concurrent auth status change processing
  const isProcessingAuthEventRef = useRef(false);
  // Track the last checked path
  const lastCheckedPathRef = useRef<string | null>(null);
  // Track when the last refresh happened to prevent excessive refreshes
  const lastRefreshTimeRef = useRef<number>(0);
  // Track login attempts to prevent rapid fires
  const lastLoginAttemptRef = useRef<number>(0);
  
  // Helper function for authentication checking with improved reliability, deduplication, and timeout handling
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    // Generate a unique ID for this refresh attempt for better logging and debugging
    const refreshId = `refresh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    try {
      console.log(`AuthProvider [${instanceIdRef.current}]: Refreshing authentication (${refreshId})`);
      
      // Check for existing global refresh operation
      if (typeof window !== 'undefined' && (window as any).__GLOBAL_AUTH_REFRESH_INFO) {
        const globalRefresh = (window as any).__GLOBAL_AUTH_REFRESH_INFO;
        
        // If a recent refresh was successful, reuse that result
        const RECENT_SUCCESS_INTERVAL = 2000; // 2 seconds
        if (globalRefresh.lastSuccessTime && 
            Date.now() - globalRefresh.lastSuccessTime < RECENT_SUCCESS_INTERVAL) {
          console.log(`AuthProvider: Using recent successful refresh result (${refreshId})`);
          return true;
        }
        
        // If another refresh is in progress, wait for it instead of starting a new one
        if (globalRefresh.inProgress && globalRefresh.currentPromise) {
          console.log(`AuthProvider: Another refresh is in progress, waiting for it (${refreshId})`);
          try {
            return await globalRefresh.currentPromise;
          } catch (error) {
            console.warn(`AuthProvider: Waiting for existing refresh failed (${refreshId}):`, error);
            // Continue with our own refresh attempt
          }
        }
      }
      
      // Prevent concurrent auth refreshes
      if (isFetchingUserRef.current) {
        console.log(`AuthProvider: Already refreshing auth, skipping duplicate call (${refreshId})`);
        return !!user; // Return current auth state
      }
      
      // Rate limit refreshes to prevent flooding
      const now = Date.now();
      const MIN_REFRESH_INTERVAL = 2000; // Increased to 2 seconds between refreshes
      
      if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
        console.log(`AuthProvider: Refresh attempt too frequent, using cached state (${refreshId})`);
        return !!user;
      }
      
      // Update refresh timestamp
      lastRefreshTimeRef.current = now;
      
      // Update global state if available
      if (globalAuthState) {
        globalAuthState.lastRefreshTime = now;
        globalAuthState.lastRefreshId = refreshId;
      }
      
      // Set up global refresh tracking
      if (typeof window !== 'undefined') {
        if (!(window as any).__GLOBAL_AUTH_REFRESH_INFO) {
          (window as any).__GLOBAL_AUTH_REFRESH_INFO = {
            inProgress: false,
            lastAttemptTime: 0,
            lastSuccessTime: 0,
            currentPromise: null
          };
        }
        
        (window as any).__GLOBAL_AUTH_REFRESH_INFO.inProgress = true;
        (window as any).__GLOBAL_AUTH_REFRESH_INFO.lastAttemptTime = now;
      }
      
      // Set fetching flag to prevent concurrent requests
      isFetchingUserRef.current = true;
      
      // Create a promise that will timeout after 10 seconds
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Authentication refresh timeout'));
        }, 10000); // 10 second timeout
      });
      
      // Create the main refresh promise
      // Store the promise globally to allow other components to wait for it
      const refreshPromise = (async () => {
        try {
          // First ensure tokens are properly synchronized
          try {
            // Import modules dynamically to avoid circular dependencies
            const tokenManagerModule = await import('@/infrastructure/auth/TokenManager');
            const clientTokenManagerModule = await import('@/infrastructure/auth/ClientTokenManager');
            
            const TokenManager = tokenManagerModule.TokenManager;
            const ClientTokenManager = clientTokenManagerModule.ClientTokenManager;
            
            // Initialize the ClientTokenManager first
            await ClientTokenManager.initialize();
            
            // Synchronize tokens before any API calls
            console.log(`AuthProvider: Synchronizing tokens (${refreshId})`);
            const syncResult = await TokenManager.synchronizeTokens(true);
            console.log(`AuthProvider: Token synchronization result: ${syncResult} (${refreshId})`);
          } catch (syncError) {
            console.warn(`AuthProvider: Error synchronizing tokens (${refreshId}):`, syncError);
            // Continue despite synchronization error
          }
          
          // First check if we have a valid auth token by checking cookies and localStorage
          const hasAuthToken = !!localStorage.getItem('auth_token_backup');
          const hasRefreshToken = !!localStorage.getItem('refresh_token_backup');
          
          console.log(`AuthProvider: Token status check - auth: ${hasAuthToken}, refresh: ${hasRefreshToken} (${refreshId})`);
          
          // Get current user data with better error handling
          console.log(`AuthProvider: Attempting to get current user (${refreshId})`);
          const response = await AuthClient.getCurrentUser();
          
          if (response.success) {
            if (response.data) {
              console.log(`AuthProvider [${instanceIdRef.current}]: User authenticated successfully (${refreshId})`);
              setUser(response.data);
              
              // Also update global state
              if (globalAuthState) {
                globalAuthState.userProfile = { ...response.data };
                globalAuthState.sessionExpired = false;
              }
              
              return true;
            } else if (response.requiresUserFetch) {
              // Handle partial authentication (token valid but no user data)
              console.log(`AuthProvider: Authenticated but retrieving user data failed (${refreshId})`);
            }
          }
          
          // If no user data or requiresUserFetch, try token refresh
          console.log(`AuthProvider: No user data, attempting token refresh (${refreshId})`);
          
          // Explicit token refresh with ClientTokenManager
          const refreshSuccess = await ClientTokenManager.refreshAccessToken();
          
          if (refreshSuccess) {
            // After successful refresh, synchronize tokens again to ensure consistency
            await TokenManager.synchronizeTokens(true);
            
            // Get user data again after token refresh
            console.log(`AuthProvider: Token refreshed, getting user data (${refreshId})`);
            const newUserResponse = await AuthClient.getCurrentUser();
            
            if (newUserResponse.success && newUserResponse.data) {
              console.log(`AuthProvider [${instanceIdRef.current}]: User authenticated after token refresh (${refreshId})`);
              setUser(newUserResponse.data);
              
              // Also update global state
              if (globalAuthState) {
                globalAuthState.userProfile = { ...newUserResponse.data };
                globalAuthState.sessionExpired = false;
              }
              
              // Explicit notification of authentication success
              await TokenManager.notifyAuthChange(true);
              
              return true;
            }
          }
          
          // If we get here, authentication failed despite refresh attempts
          console.log(`AuthProvider [${instanceIdRef.current}]: Authentication refresh failed (${refreshId})`);
          setUser(null);
          
          // Update global state
          if (globalAuthState) {
            globalAuthState.userProfile = null;
            globalAuthState.sessionExpired = true;
          }
          
          // Explicit notification of authentication change
          await TokenManager.notifyAuthChange(false);
          
          return false;
        } finally {
          // Always clear fetching flag on completion
          setTimeout(() => {
            isFetchingUserRef.current = false;
          }, 300);
        }
      })();
      
      // Use Promise.race to handle timeouts
      // Store the promise globally
      if (typeof window !== 'undefined' && (window as any).__GLOBAL_AUTH_REFRESH_INFO) {
        (window as any).__GLOBAL_AUTH_REFRESH_INFO.currentPromise = Promise.race([refreshPromise, timeoutPromise]);
      }
      
      try {
        const result = await Promise.race([refreshPromise, timeoutPromise]);
        
        // Store successful result in global state
        if (result && typeof window !== 'undefined' && (window as any).__GLOBAL_AUTH_REFRESH_INFO) {
          (window as any).__GLOBAL_AUTH_REFRESH_INFO.lastSuccessTime = Date.now();
        }
        
        return result;
      } catch (raceError) {
        if (raceError instanceof Error && raceError.message === 'Authentication refresh timeout') {
          console.warn(`AuthProvider: Authentication refresh timed out (${refreshId})`);
          
          // Clear fetching flag on timeout
          setTimeout(() => {
            isFetchingUserRef.current = false;
          }, 100);
        }
        throw raceError;
      } finally {
        // Clear global refresh state
        if (typeof window !== 'undefined' && (window as any).__GLOBAL_AUTH_REFRESH_INFO) {
          setTimeout(() => {
            if ((window as any).__GLOBAL_AUTH_REFRESH_INFO) {
              (window as any).__GLOBAL_AUTH_REFRESH_INFO.inProgress = false;
              (window as any).__GLOBAL_AUTH_REFRESH_INFO.currentPromise = null;
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error(`AuthProvider [${instanceIdRef.current}]: Authentication refresh error (${refreshId}):`, error);
      
      // Clear fetching flag on error
      isFetchingUserRef.current = false;
      
      // Reset user state
      setUser(null);
      
      // Update global state
      if (globalAuthState) {
        globalAuthState.userProfile = null;
        globalAuthState.error = error instanceof Error ? error.message : 'Authentication refresh failed';
      }
      
      // Update auth status even in case of error
      try {
        const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
        await TokenManager.notifyAuthChange(false);
      } catch (notifyError) {
        console.error(`Failed to notify about auth change (${refreshId}):`, notifyError);
      }
      
      // Clear global refresh state on error
      if (typeof window !== 'undefined' && (window as any).__GLOBAL_AUTH_REFRESH_INFO) {
        (window as any).__GLOBAL_AUTH_REFRESH_INFO.inProgress = false;
        (window as any).__GLOBAL_AUTH_REFRESH_INFO.currentPromise = null;
      }
      
      return false;
    }
  }, [user, globalAuthState, instanceIdRef]);

  // Simplified path-related authentication check with better deduplication
  useEffect(() => {
    // Don't do anything if there's no pathname
    if (!pathname) return;
    
    // Skip if we've already checked this exact path recently (within 200ms)
    if (pathname === lastCheckedPathRef.current && Date.now() - lastRefreshTimeRef.current < 200) {
      return;
    }
    
    // Update the ref with current path and timestamp
    lastCheckedPathRef.current = pathname;
    lastRefreshTimeRef.current = Date.now();
    
    // Track checked paths for debugging
    if (globalAuthState) {
      globalAuthState.authPaths[pathname] = Date.now();
    }
    
    // Skip authentication check for public paths
    if (isPublicPath(pathname)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`AuthProvider [${instanceIdRef.current}]: Public path, skipping auth check: ${pathname}`);
      }
      setIsLoading(false);
      return;
    }
    
    // Authentication check for protected paths
    const checkAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`AuthProvider [${instanceIdRef.current}]: Checking auth for protected path: ${pathname}`);
        }
        
        // Prevent concurrent auth checks using the ref
        if (isFetchingUserRef.current) {
          console.log('AuthProvider: Auth check already in progress, waiting...');
          // Wait and then check the user state
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // If we have a user after waiting, we're good
          if (user) {
            setIsLoading(false);
            return;
          }
        }
        
        // Mark that we're checking auth
        isFetchingUserRef.current = true;
        
        // Perform the actual auth check
        const isAuthed = await refreshAuth();
        
        // Clear the fetching flag
        isFetchingUserRef.current = false;
        
        if (!isAuthed) {
          console.log(`AuthProvider [${instanceIdRef.current}]: Access denied, redirecting to login`);
          // Update global state if available
          if (globalAuthState) {
            globalAuthState.sessionExpired = true;
            globalAuthState.userProfile = null;
          }
          
          // Create a clean returnUrl
          const returnUrl = encodeURIComponent(pathname);
          
          // Clear tokens to ensure clean login state
          try {
            const { ClientTokenManager } = await import('@/infrastructure/auth/ClientTokenManager');
            ClientTokenManager.clearTokens();
          } catch (clearError) {
            console.warn('Error clearing tokens during auth failure:', clearError);
          }
          
          // Use a safe redirect
          setTimeout(() => {
            router.push(`/auth/login?returnUrl=${returnUrl}&session=expired`);
          }, 100);
        }
      } catch (error) {
        console.error(`AuthProvider [${instanceIdRef.current}]: Auth check error:`, error);
        setUser(null);
        
        // Update global state if available
        if (globalAuthState) {
          globalAuthState.error = error instanceof Error ? error.message : 'Authentication check failed';
          globalAuthState.sessionExpired = true;
          globalAuthState.userProfile = null;
        }
        
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/auth/login?returnUrl=${returnUrl}&error=auth_check`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname, isPublicPath, refreshAuth, router, globalAuthState, user]);

  // Login function with improved error handling and rate limiting
  const login = async (credentials: LoginDto): Promise<void> => {
    try {
      // Simple rate limiting to prevent rapid login attempts
      const now = Date.now();
      const MIN_LOGIN_INTERVAL = 1000; // 1 second between login attempts
      
      if (now - lastLoginAttemptRef.current < MIN_LOGIN_INTERVAL) {
        throw new Error('Please wait before trying again');
      }
      
      // Update attempt timestamp
      lastLoginAttemptRef.current = now;
      
      // Update global state if available
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
      
      // Clear any existing tokens before attempting login
      const { ClientTokenManager } = await import('@/infrastructure/auth/ClientTokenManager');
      ClientTokenManager.clearTokens();
      
      // Import TokenManager here to use synchronizeTokens
      const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
      // Synchronize any existing tokens before login attempt
      TokenManager.synchronizeTokens(true);
      
      // Perform login - cookies are set by the server
      const response = await AuthClient.login(credentials);
      
      if (!response.success) {
        // Handle error response in structured format
        console.error('Login response error:', response);
        throw new Error(response.message || `Login failed with status ${response.statusCode || 'unknown'}`);
      }
      
      console.log('Login successful, fetching user data');
      
      // For successful login we set the user directly if available in the response
      // This helps with some server implementations that return the user directly
      if (response.data && response.data.user) {
        console.log('Found user data in login response, setting directly:', response.data.user);
        setUser(response.data.user);
        
        // Also update global state if available
        if (globalAuthState) {
          globalAuthState.userProfile = { ...response.data.user };
          globalAuthState.sessionExpired = false;
        }
        
        // Redirect immediately since we already have user data
        setTimeout(() => {
          // Ensure token synchronization before navigation
          import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
            TokenManager.synchronizeTokens(true);
            
            // Wait for token sync to complete
            setTimeout(() => {
              const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
                decodeURIComponent(returnUrl) : '/dashboard';
              
              console.log('Navigating to:', redirectPath);
              
              // Use Next.js router instead of direct navigation
              router.push(redirectPath);
            }, 300);
          }).catch(err => {
            // In case of error, still redirect
            const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
              decodeURIComponent(returnUrl) : '/dashboard';
            
            console.log('Navigating to:', redirectPath);
            router.push(redirectPath);
          });
        }, 300);
        
        return; // Early return to skip refreshAuth
      } else if (response.data && (response.data.id || response.data.email)) {
        console.log('Found direct user data in login response:', response.data);
        setUser(response.data);
        
        // Also update global state if available
        if (globalAuthState) {
          globalAuthState.userProfile = { ...response.data };
          globalAuthState.sessionExpired = false;
        }
        
        // Redirect immediately since we already have user data
        setTimeout(() => {
          // Ensure token synchronization before navigation
          import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
            TokenManager.synchronizeTokens(true);
            
            // Wait for token sync to complete
            setTimeout(() => {
              const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
                decodeURIComponent(returnUrl) : '/dashboard';
              
              console.log('Navigating to:', redirectPath);
              
              // Use Next.js router instead of direct navigation
              router.push(redirectPath);
            }, 300);
          }).catch(err => {
            // In case of error, still redirect
            const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
              decodeURIComponent(returnUrl) : '/dashboard';
            
            console.log('Navigating to:', redirectPath);
            router.push(redirectPath);
          });
        }, 300);
        
        return; // Early return to skip refreshAuth
      }
      
      // On successful login, check if we received user data
      console.log('Login successful, checking for user data');
      
      if (response.success && response.data && response.data.user) {
        console.log('User data found in login response');
        
        // Use the user data from the response
        setUser(response.data.user);
        
        // Notify auth change with the proper user data
        await import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
          TokenManager.notifyAuthChange(true);
        });
        
        // Delay navigation to ensure state is updated
        setTimeout(() => {
          const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
            decodeURIComponent(returnUrl) : '/dashboard';
          
          console.log('Navigating to:', redirectPath);
          
          // Use Next.js router instead of direct navigation
          router.push(redirectPath);
        }, 500); // Increased delay to ensure everything is settled
        
        return;
      }
      
      // If login response indicates that a user fetch is needed, retrieve it now
      if (response.requiresUserFetch) {
        console.log('No user data in login response, retrieving user profile');
        
        // Longer wait to ensure token is set by the server
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Make multiple attempts with exponential backoff
          let attempts = 0;
          const maxAttempts = 3;
          let userResponse = null;
          
          while (attempts < maxAttempts) {
            attempts++;
            console.log(`Attempting to fetch user profile (attempt ${attempts}/${maxAttempts})`);
            
            // Exponential backoff delay
            const delay = Math.pow(2, attempts - 1) * 300;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Try to get the user data
            userResponse = await AuthClient.getCurrentUser();
            console.log(`User profile fetch response (attempt ${attempts}):`, userResponse);
            
            if (userResponse.success && userResponse.data) {
              console.log('User profile retrieved after login');
              setUser(userResponse.data);
              
              // Notify about auth change with proper user data
              await import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
                TokenManager.notifyAuthChange(true);
              });
              
              // After successful login and user fetch, wait to ensure state is updated
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Use NextJS router for navigation
              const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
                decodeURIComponent(returnUrl) : '/dashboard';
              
              console.log('Navigating to:', redirectPath);
              router.push(redirectPath);
              return; // Exit early on success
            }
            
            // If we got 401/403, no point in retrying
            if (userResponse.statusCode === 401 || userResponse.statusCode === 403) {
              console.error('Authentication failed when fetching user profile');
              break;
            }
          }
          
          // If we get here, all attempts failed
          // Try a direct fetch as a last resort
          console.log('Using direct fetch as a last resort');
          
          // Get auth token from cookies
          let authToken = null;
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === 'auth_token') {
                authToken = decodeURIComponent(value);
                break;
              }
            }
          }
          
          if (!authToken) {
            console.error('No auth token found for direct fetch');
            throw new Error('Authentication token not available');
          }
          
          // Make direct fetch request
          const apiResponse = await fetch('/api/users/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (apiResponse.ok) {
            const userData = await apiResponse.json();
            if (userData && (userData.data || userData.id)) {
              // Extract user data from response
              const userInfo = userData.data || userData;
              console.log('User profile retrieved via direct fetch');
              setUser(userInfo);
              
              // Notify about auth change
              await import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
                TokenManager.notifyAuthChange(true);
              });
              
              // Use Next.js router for navigation
              console.log('Navigating to dashboard');
              const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
                decodeURIComponent(returnUrl) : '/dashboard';
              router.push(redirectPath);
              return;
            }
          }
          
          console.error('Failed to retrieve user profile via direct fetch');
          throw new Error('Login successful but profile retrieval failed');
        } catch (profileError) {
          console.error('User profile retrieval failed:', profileError);
          throw new Error('Authentication successful but profile unavailable');
        }
      }
      
      // Handle redirect only once
      // Longer delay for redirect to ensure the auth state is properly updated
      setTimeout(() => {
        // Redirect to return URL or dashboard
        const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
          decodeURIComponent(returnUrl) : '/dashboard';
        
        console.log('Navigating to:', redirectPath);
        
        // Use Next.js router
        router.push(redirectPath);
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      
      // Set auth error for UI feedback
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthError(errorMessage);
      
      // Update global state if available
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
      
      // After successful registration, redirect to login page
      router.push('/auth/login?registered=true');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function with improved cleanup
  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out user...');
      
      // Update global state if available
      if (globalAuthState) {
        globalAuthState.lastLogoutTime = Date.now();
        globalAuthState.userProfile = null;
        globalAuthState.sessionExpired = false;
      }
      
      // Delete user status client-side first for immediate UI feedback
      setUser(null);
      
      // Import and use ClientTokenManager to clear tokens
      const { ClientTokenManager } = await import('@/infrastructure/auth/ClientTokenManager');
      ClientTokenManager.clearTokens();
      
      // Call logout endpoint - server deletes cookies
      await AuthClient.logout();
      
      // Also notify TokenManager about logout
      const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
      TokenManager.notifyLogout();
      
      console.log('Logout successful, redirecting to login page');
      // Redirect to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even on error, force logout on client side
      setUser(null);
      
      // Force clear cookies and localStorage
      if (typeof document !== 'undefined') {
        // Clear auth cookies
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Clear localStorage items
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_backup');
        localStorage.removeItem('refresh_token_backup');
      }
      
      router.push('/auth/login');
    }
  };

  // Event listener for auth status changes - optimized implementation with better cleanup
  useEffect(() => {
    // Reference to the handler for proper cleanup
    let authChangeHandler: EventListener | null = null;
    
    // Setup auth event listener if it doesn't already exist
    if (typeof window !== 'undefined') {
      // Set minimum delay between processing auth events
      const MIN_EVENT_INTERVAL = 500; // milliseconds
      let lastProcessedTime = 0;
      
      // Create a properly typed handler function
      authChangeHandler = ((evt: Event) => {
        if (evt instanceof CustomEvent) {
          const customEvent = evt as CustomEvent<{ isAuthenticated: boolean }>;
          const { isAuthenticated } = customEvent.detail;
          const now = Date.now();
          
          // Skip rapid-fire events
          if (now - lastProcessedTime < MIN_EVENT_INTERVAL) {
            console.debug(`AuthProvider [${instanceIdRef.current}]: Auth event throttled - minimum interval not met`);
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
                  // Update user data on authentication - use the reference to avoid stale closures
                  refreshAuth().catch(error => {
                    console.error(`AuthProvider [${instanceIdRef.current}]: Error refreshing auth after status change:`, error);
                  });
                }
              } else {
                // Clear user data on logout
                setUser(null);
              }
            } catch (error) {
              console.error(`AuthProvider [${instanceIdRef.current}]: Error handling auth status change:`, error);
            } finally {
              // Reset processing flag with slight delay
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
    
    // Return cleanup function that properly removes the listener
    return () => {
      if (typeof window !== 'undefined' && authChangeHandler) {
        window.removeEventListener('auth_status_changed', authChangeHandler);
        console.debug(`AuthProvider [${instanceIdRef.current}]: Removed auth status listener`);
      }
    };
  }, [refreshAuth, user, instanceIdRef]);

  
  // Add a safety timer to ensure flags don't get stuck and synchronize state
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
      
      // Check for token synchronization if we have a user but no valid cookie
      if (user && typeof document !== 'undefined') {
        // More comprehensive cookie check
        const cookies = document.cookie.split(';');
        const authCookiePattern = /^(auth_token|accessToken|auth_token_access|access_token)=/;
        const hasAuthCookie = cookies.some(c => authCookiePattern.test(c.trim()));
        
        // Check for inconsistency but limit correction attempts
        if (!hasAuthCookie && Date.now() - lastRefreshTimeRef.current > 30000) {
          // Only try to fix inconsistency every 30 seconds
          console.log('Auth state inconsistency detected: User exists but no auth cookie - attempting repair');
          lastRefreshTimeRef.current = Date.now(); // Reset refresh time
          
          // Try to synchronize tokens with improved error handling
          try {
            // Check if tokens exist in localStorage before trying to sync
            const hasAuthTokenBackup = localStorage.getItem('auth_token_backup');
            
            if (hasAuthTokenBackup) {
              import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
                TokenManager.synchronizeTokens(true);
              }).catch(err => {
                console.error('Error synchronizing tokens during consistency check:', err);
              });
            } else {
              // Serious inconsistency - logged in with no token backup
              console.warn('No auth token backup found despite user being logged in - will refresh auth');
              refreshAuth();
            }
          } catch (err) {
            console.error('Error during token consistency check:', err);
          }
        }
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
