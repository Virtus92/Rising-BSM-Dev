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

// Simple flag to check for duplicate mounts
let isAuthProviderMounted = false;

// Event handler reference for proper cleanup
const eventHandlerMap = new Map();

if (typeof window !== 'undefined') {
  if (typeof (window as any).__AUTH_PROVIDER_MOUNTED === 'undefined') {
    (window as any).__AUTH_PROVIDER_MOUNTED = false;
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
  // Simple mount check
  useEffect(() => {
    // Check if another provider is already mounted
    if (isAuthProviderMounted || (typeof window !== 'undefined' && (window as any).__AUTH_PROVIDER_MOUNTED)) {
      console.warn('Multiple AuthProvider instances detected - this may cause issues!');
    } else {
      console.log('AuthProvider mounted.');
      isAuthProviderMounted = true;
      
      if (typeof window !== 'undefined') {
        (window as any).__AUTH_PROVIDER_MOUNTED = true;
      }
    }
    
    return () => {
      // Clean up on unmount
      isAuthProviderMounted = false;
      if (typeof window !== 'undefined') {
        (window as any).__AUTH_PROVIDER_MOUNTED = false;
      }
      console.log('AuthProvider unmounted.');
    };
  }, []);

  // Normal React state
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Helper function for authentication checking
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('AuthProvider: Refreshing authentication');
      
      // Prevent concurrent auth refreshes
      if (isFetchingUserRef.current) {
        console.log('AuthProvider: Already refreshing auth, skipping duplicate call');
        return !!user; // Return current auth state
      }
      
      isFetchingUserRef.current = true;
      
      // Get current user data
      const response = await AuthClient.getCurrentUser();
      
      if (response.success) {
        if (response.data) {
          console.log('AuthProvider: User authenticated successfully');
          setUser(response.data);
          return true;
        } else if (response.requiresUserFetch) {
          // We need to fetch user data in a more robust way
          console.log('AuthProvider: Authenticated but no user data yet, making direct API call');
          
          // Make a direct fetch with proper authorization
          // Try a more robust approach to fetch user data
          try {
            // Get token from cookie if available (client-side only)
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
            
            // Enhanced request with authorization header
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            };
            
            if (authToken) {
              headers['Authorization'] = `Bearer ${authToken}`;
              console.log('AuthProvider: Adding token to Authorization header');
            }
            
            // Make the authenticated request
            console.log('AuthProvider: Making direct fetch to /api/users/me');
            const apiResponse = await fetch('/api/users/me', {
              method: 'GET',
              credentials: 'include',
              headers
            });
            
            if (apiResponse.ok) {
              const userData = await apiResponse.json();
              console.log('AuthProvider: Raw API response:', userData);
              
              // Handle various response formats
              let user = null;
              if (userData && userData.data) {
                user = userData.data;
              } else if (userData && userData.success && !userData.data) {
                // Some APIs may include user data at the top level
                const { success, message, timestamp, ...possibleUser } = userData;
                if (possibleUser.id || possibleUser.email) {
                  user = possibleUser;
                }
              } else if (userData && (userData.id || userData.email)) {
                user = userData;
              }
              
              if (user) {
                console.log('AuthProvider: Successfully retrieved user data on second attempt');
                setUser(user);
                return true;
              }
            }
          } catch (apiError) {
            console.warn('AuthProvider: Failed to get user data on second attempt', apiError);
          }
          
          // If we still don't have user data, this is an application error
          console.error('AuthProvider: Critical error - authenticated but cannot retrieve user profile');
          throw new Error('Authentication successful but user profile unavailable. Contact system administrator.');
        }
      }
      
      // If no user data, try token refresh
      console.log('AuthProvider: No user data, attempting token refresh');
      const refreshResponse = await AuthClient.refreshToken();
      
      if (refreshResponse.success) {
        // After successful refresh, get user data again
        const newUserResponse = await AuthClient.getCurrentUser();
        
        if (newUserResponse.success) {
          if (newUserResponse.data) {
            console.log('AuthProvider: User fetched after token refresh');
            setUser(newUserResponse.data);
            return true;
          } else if (newUserResponse.requiresUserFetch) {
            // Need to properly handle token refresh and user data retrieval
            console.log('AuthProvider: Attempting to properly fetch user after token refresh');
            
            // Robust direct user fetch with token in header
            try {
              // Get token from cookie if available (client-side only)
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
                throw new Error('No authentication token available after token refresh');
              }
              
              const apiResponse = await fetch('/api/users/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                  'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
              });
              
              if (apiResponse.ok) {
                const userData = await apiResponse.json();
                if (userData && userData.data) {
                  console.log('AuthProvider: Successfully retrieved user data after token refresh');
                  setUser(userData.data);
                  return true;
                }
              }
              
              // Log detailed error information
              console.error('AuthProvider: Failed to fetch user data after token refresh', {
                status: apiResponse.status,
                statusText: apiResponse.statusText
              });
              
              throw new Error(`User data fetch failed with status ${apiResponse.status}`);
            } catch (error) {
              console.error('AuthProvider: User fetch error after token refresh', error);
              throw new Error('Authentication refresh successful but user profile unavailable');
            }
          }
        }
      }
      
      // If refresh fails or no user data
      console.log('AuthProvider: Authentication refresh failed');
      setUser(null);
      
      // Explicit notification of authentication change
      await import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
        TokenManager.notifyAuthChange(false);
      });
      
      return false;
    } catch (error) {
      console.error('AuthProvider: Authentication refresh error:', error);
      setUser(null);
      
      // Update auth status even in case of error
      await import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
        TokenManager.notifyAuthChange(false);
      });
      
      return false;
    } finally {
      // Clear fetching flag regardless of outcome
      setTimeout(() => {
        isFetchingUserRef.current = false;
      }, 300);
    }
  }, []);

  // Simplified path-related authentication check
  useEffect(() => {
    // Don't do anything if there's no pathname
    if (!pathname) return;
    
    // Skip if we've already checked this exact path
    if (pathname === lastCheckedPathRef.current) return;
    
    // Update the ref with current path
    lastCheckedPathRef.current = pathname;
    
    // Skip authentication check for public paths
    if (isPublicPath(pathname)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider: Public path, skipping auth check:', pathname);
      }
      setIsLoading(false);
      return;
    }
    
    // Authentication check for protected paths
    const checkAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthProvider: Checking auth for protected path:', pathname);
        }
        
        const isAuthed = await refreshAuth();
        
        if (!isAuthed) {
          console.log('AuthProvider: Access denied, redirecting to login');
          const returnUrl = encodeURIComponent(pathname);
          setTimeout(() => {
            router.push(`/auth/login?returnUrl=${returnUrl}`);
          }, 100);
        }
      } catch (error) {
        console.error('AuthProvider: Auth check error:', error);
        setUser(null);
        
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/auth/login?returnUrl=${returnUrl}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname, isPublicPath, refreshAuth, router]);

  // Login function
  const login = async (credentials: LoginDto): Promise<void> => {
    try {
      setIsLoading(true);
      
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
      
      // Import TokenManager here to use synchronizeTokens
      await import('@/infrastructure/auth/TokenManager').then(({ TokenManager }) => {
        // Synchronize any existing tokens before login attempt
        TokenManager.synchronizeTokens();
      });
      
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
        
        // Redirect immediately since we already have user data
        setTimeout(() => {
          const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
            decodeURIComponent(returnUrl) : '/dashboard';
          
          console.log('Navigating to:', redirectPath);
          
          // Use Next.js router instead of direct navigation
          router.push(redirectPath);
        }, 300);
        
        return; // Early return to skip refreshAuth
      } else if (response.data && (response.data.id || response.data.email)) {
        console.log('Found direct user data in login response:', response.data);
        setUser(response.data);
        
        // Redirect immediately since we already have user data
        setTimeout(() => {
          const redirectPath = returnUrl && !isPublicPath(returnUrl) ? 
            decodeURIComponent(returnUrl) : '/dashboard';
          
          console.log('Navigating to:', redirectPath);
          
          // Use Next.js router instead of direct navigation
          router.push(redirectPath);
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

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out user...');
      // Call logout endpoint - server deletes cookies
      await AuthClient.logout();
      
      // Delete user status client-side
      setUser(null);
      
      console.log('Logout successful, redirecting to login page');
      // Redirect to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Also delete local state and redirect even in case of API error
      setUser(null);
      router.push('/auth/login');
    }
  };

  // Event listener for auth status changes - optimized implementation
  useEffect(() => {
    // Skip duplicate event listeners - use our Map to track instead of window globals
    if (eventHandlerMap.has('auth_status_changed')) {
      console.log('Auth event listener already registered, skipping duplicate');
      return;
    }
    
    let lastProcessedTime = 0;
    const MIN_EVENT_INTERVAL = 800; // milliseconds - throttle frequency
    
    // Create wrapper function that handles proper type conversion
    const eventHandlerWrapper = ((evt: Event) => {
      if (evt instanceof CustomEvent) {
        const customEvent = evt as CustomEvent<{ isAuthenticated: boolean }>;
        const { isAuthenticated } = customEvent.detail;
        const now = Date.now();
        
        // Throttle events that come too quickly
        if (now - lastProcessedTime < MIN_EVENT_INTERVAL) {
          console.log('Auth event throttled - minimum interval not met');
          return;
        }
        
        // Prevent concurrent processing
        if (isProcessingAuthEventRef.current) {
          console.log('Auth event ignored - already processing');
          return;
        }
        
        console.log('Auth status changed event received:', { isAuthenticated });
        isProcessingAuthEventRef.current = true;
        lastProcessedTime = now;
        
        // Execute authentication logic asynchronously
        (async () => {
          try {
            if (isAuthenticated) {
              // Skip redundant refresh if we already have a user
              if (user) {
                console.log('Already authenticated with user data, skipping refresh');
              } else {
                // Update user data on authentication
                await refreshAuth();
              }
            } else {
              // Clear user data on logout
              setUser(null);
            }
          } catch (error) {
            console.error('Error handling auth status change:', error);
          } finally {
            // Reset processing flag with slight delay
            setTimeout(() => {
              isProcessingAuthEventRef.current = false;
            }, 500);
          }
        })();
      }
    }) as EventListener;
    
    // Store handler reference for proper cleanup
    eventHandlerMap.set('auth_status_changed', eventHandlerWrapper);
    
    // Register event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('auth_status_changed', eventHandlerWrapper);
    }
    
    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        const handler = eventHandlerMap.get('auth_status_changed');
        if (handler) {
          window.removeEventListener('auth_status_changed', handler);
          eventHandlerMap.delete('auth_status_changed');
        }
      }
    };
  }, [refreshAuth, user]);
  
  // Add a safety timer to ensure flags don't get stuck
  useEffect(() => {
    const safetyTimer = setInterval(() => {
      if (isProcessingAuthEventRef.current || isFetchingUserRef.current) {
        console.log('Clearing potentially stuck processing flags');
        isProcessingAuthEventRef.current = false;
        isFetchingUserRef.current = false;
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(safetyTimer);
  }, []);
  
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
