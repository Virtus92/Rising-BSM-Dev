'use client';

/**
 * Authentication client service
 * Provides client-side authentication functionality using HTTP-only cookies
 * for secure token storage and CSRF protection
 */

import ApiClient from '@/infrastructure/clients/ApiClient';
import { UserDto } from '@/domain/dtos/UserDtos';
import { LoginDto, RegisterDto, ResetPasswordDto } from '@/domain/dtos/AuthDtos';
import { TokenManager } from './TokenManager';

// GLOBAL REQUEST CACHE to deduplicate auth API calls
// This is critically important to prevent race conditions with cookies
let GLOBAL_AUTH_REQUESTS: { [key: string]: Promise<any> | undefined } = {};

// For debugging
if (typeof window !== 'undefined') {
  (window as any).__AUTH_PENDING_REQUESTS = GLOBAL_AUTH_REQUESTS;
}

export class AuthClient {
  private static readonly basePath = "/api/auth";
  
  /**
   * Helper method to deduplicate requests
   * @param key Request identifier key
   * @param requestFn The function that makes the actual request
   * @returns Promise with result
   */
  private static deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If there's already a pending request with this key, return it
    if ( GLOBAL_AUTH_REQUESTS[key]) {
      console.log(`AuthClient: Reusing pending request for ${key}`);
      return GLOBAL_AUTH_REQUESTS[key] as Promise<T>;
    }
    
    console.log(`AuthClient: Creating new request for ${key}`);
    
    // Create a new request and store it
    const promise = requestFn().finally(() => {
      // Clean up after request is complete, with slight delay to prevent race conditions
      setTimeout(() => {
        delete GLOBAL_AUTH_REQUESTS[key];
        console.log(`AuthClient: Cleaned up request for ${key}`);
      }, 100);
    });
    
    GLOBAL_AUTH_REQUESTS[key] = promise;
    return promise;
  }

  /**
   * Register a new user
   * @param userData - Registration data
   */
  static async register(userData: RegisterDto) {
    return ApiClient.post<UserDto>(`${this.basePath}/register`, userData);
  }

  /**
   * User login
   * @param credentials - Login credentials
   */
  static async login(credentials: LoginDto) {
    // Generate a unique request key that includes timestamp to ensure uniqueness 
    // across multiple login attempts with the same credentials
    const requestKey = `login-${credentials.email}-${Date.now()}`;
    const requestId = `auth-login-${Math.random().toString(36).substring(2, 9)}`;
    
    return this.deduplicate(requestKey, async () => {
      try {
        console.log(`AuthClient: Login attempt (${requestId})`);
        
        // Skip if in cooldown period
        let lastAuthChange = 0;
        try {
          // Safely attempt to get the last auth change time
          if (typeof window !== 'undefined' && (window as any).__AUTH_PROVIDER_STATE_KEY) {
            lastAuthChange = (window as any).__AUTH_PROVIDER_STATE_KEY.lastLoginTime || 0;
          }
        } catch (e) {
          console.warn(`AuthClient: Error checking last auth change time (${requestId})`, e);
        }
        
        if (lastAuthChange && Date.now() - lastAuthChange < 1000) {
          console.warn(`AuthClient: Login attempt too soon after previous auth change (${requestId})`);
          return {
            success: false,
            message: 'Login attempt too soon after previous auth change',
            data: null
          };
        }
        
        // Clear any existing tokens before attempting login
        try {
          const { ClientTokenManager } = await import('./ClientTokenManager');
          ClientTokenManager.clearTokens();
          
          // Import TokenManager here to use synchronizeTokens
          const { TokenManager } = await import('./TokenManager');
          // Synchronize any existing tokens before login attempt to ensure clean state
          await TokenManager.synchronizeTokens(true);
        } catch (tokenError) {
          console.warn(`AuthClient: Error clearing/synchronizing tokens before login (${requestId})`, tokenError);
          // Continue with login attempt even if token operations fail
        }
        
        console.log(`AuthClient: Sending login request (${requestId})`);
        
        // Force a direct fetch to avoid potential issues with the ApiClient
        // This creates a cleaner request for the login endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
          const response = await fetch(`${this.basePath}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'X-Request-ID': requestId
            },
            credentials: 'include',
            body: JSON.stringify(credentials),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error(`AuthClient: Login HTTP error: ${response.status} (${requestId})`);
            let errorMessage = `Login failed with status ${response.status}`;
            let errorDetails = {};
            
            try {
              // Try to parse response as JSON
              const errorData = await response.json();
              errorDetails = errorData;
              if (errorData && errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData && errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData && typeof errorData === 'string') {
                errorMessage = errorData;
              }
              console.error(`AuthClient: Login error details (${requestId}):`, errorData);
            } catch (e) {
              // If not JSON, try to get as text
              try {
                const errorText = await response.text();
                if (errorText && errorText.length > 0) {
                  errorMessage = errorText;
                  errorDetails = { text: errorText };
                }
              } catch (textError) {
                // If all else fails, use the default message
                errorDetails = { parseError: 'Could not parse error response' };
              }
            }
            
            // For 401 unauthorized errors, provide a more specific message
            if (response.status === 401) {
              return {
                success: false,
                message: 'Invalid email or password',
                data: null,
                statusCode: 401,
                details: errorDetails
              };
            }
            
            // Return structured error response instead of throwing
            return {
              success: false,
              message: errorMessage,
              data: null,
              statusCode: response.status,
              details: errorDetails
            };
          }
          
          // If we reach here, the response was OK (status code 2xx)
          const data = await response.json();
          console.log(`AuthClient: Login response received (${requestId})`);
          
          // Extract user data from different response formats
          let userData = null;
          if (data.data && data.data.user) {
            userData = data.data.user;
          } else if (data.user) {
            userData = data.user;
          } else if (data.data && (data.data.id || data.data.email)) {
            userData = data.data;
          } else if (data.id || data.email) {
            userData = data;
          }
          
          // Store tokens in localStorage as backups
          // This is critically important for auth recovery
          try {
            console.log(`AuthClient: Saving token backups (${requestId})`);
            // Save token backups if they exist in the response
            if (data.data) {
              if (data.data.accessToken) {
                localStorage.setItem('auth_token_backup', data.data.accessToken);
                // Also set auth_token for legacy compatibility
                localStorage.setItem('auth_token', data.data.accessToken);
              }
              
              if (data.data.refreshToken) {
                localStorage.setItem('refresh_token_backup', data.data.refreshToken);
              }
            } else if (data.accessToken) {
              localStorage.setItem('auth_token_backup', data.accessToken);
              localStorage.setItem('auth_token', data.accessToken);
              
              if (data.refreshToken) {
                localStorage.setItem('refresh_token_backup', data.refreshToken);
              }
            } else if (data.token) {
              localStorage.setItem('auth_token_backup', data.token);
              localStorage.setItem('auth_token', data.token);
            }
            
            // Record authentication timestamp
            localStorage.setItem('auth_timestamp', Date.now().toString());
          } catch (storageError) {
            console.warn(`AuthClient: Error saving token backups (${requestId}):`, storageError);
          }
          
          // Synchronize tokens right after login to ensure consistent state
          await TokenManager.synchronizeTokens(true);
          
          // Notify about successful authentication with a slight delay to avoid race conditions
          await TokenManager.notifyAuthChange(true);
          
          console.log(`AuthClient: Login process completed (${requestId})`);
          
          // Always include requiresUserFetch flag to let the caller know if a user fetch is required
          return {
            success: true,
            message: 'Login successful',
            data: userData || data,
            // Add a flag to indicate whether we got user data
            hasUserData: !!userData,
            // Add a flag to tell the caller a user fetch is needed if we didn't get user data
            requiresUserFetch: !userData
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Check if this is a timeout error
          if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
            console.error(`AuthClient: Login request timed out (${requestId})`);
            return {
              success: false,
              message: 'Login request timed out. Please try again.',
              data: null,
              statusCode: 408 // Request Timeout
            };
          }
          
          // Handle general fetch errors
          console.error(`AuthClient: Login fetch error (${requestId}):`, fetchError);
          return {
            success: false,
            message: fetchError instanceof Error ? fetchError.message : 'Login request failed',
            data: null,
            statusCode: 0 // Generic error
          };
        }
      } catch (error) {
        console.error(`AuthClient: Login error (${requestId}):`, error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Login failed - system error',
          data: null
        };
      }
    });
  }

  /**
   * User logout
   * Clears authentication cookies
   */
  static async logout() {
    const requestKey = `logout-${Date.now()}`;
    
    return this.deduplicate(requestKey, async () => {
      try {
        // Clear localStorage tokens first for immediate effect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_backup');
          localStorage.removeItem('refresh_token_backup');
        }
        
        // Fix the path to prevent double /api/ prefix
        // ApiClient already adds the /api prefix, so we need to remove it from our path
        // The server will clear the auth cookies
        const logoutPath = this.basePath.startsWith('/api') 
          ? this.basePath.substring(4) + '/logout' 
          : this.basePath + '/logout';
        
        console.log(`AuthClient: Using logout path: ${logoutPath}`);
        const response = await ApiClient.post(logoutPath);
        
        // Notify about logout with slight delay
        setTimeout(() => {
          TokenManager.notifyLogout();
        }, 50);
        
        return response;
      } catch (error) {
        console.error('Logout error:', error);
        
        // Even if the API call fails, we should still notify about logout
        setTimeout(() => {
          TokenManager.notifyLogout();
        }, 50);
        
        return {
          success: true,
          message: 'Logged out client-side',
          data: null
        };
      }
    });
  }

  /**
   * Reset password using token from email
   */
  static async resetPassword(token: string, newPassword: string, confirmPassword?: string) {
    const data: ResetPasswordDto = {
      email: "", // This will be filled by the backend based on the token
      token,
      password: newPassword,
      confirmPassword: confirmPassword || newPassword
    };
    
    return ApiClient.post(`${this.basePath}/reset-password`, data);
  }

  /**
   * Forgot password - request password reset via email
   */
  static async forgotPassword(email: string) {
    return ApiClient.post(`${this.basePath}/forgot-password`, { email });
  }

  /**
   * Change password for logged in user
   */
  static async changePassword(oldPassword: string, newPassword: string, confirmPassword?: string) {
    return ApiClient.post(`${this.basePath}/change-password`, {
      oldPassword,
      newPassword,
      confirmPassword: confirmPassword || newPassword
    });
  }

  /**
   * Validate reset token
   */
  static async validateResetToken(token: string) {
    return ApiClient.post(`${this.basePath}/validate-token`, { token });
  }

  /**
   * Get current user
   * Uses cookies for authentication
   */
  static async getCurrentUser() {
    const requestId = `get-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    return this.deduplicate('getCurrentUser', async () => {
      try {
        console.log(`AuthClient: Getting current user (${requestId})`);
        
        // Skip if in cooldown period
        let lastAuthChange = 0;
        try {
        // Safely attempt to get the last auth change time
        if (typeof window !== 'undefined' && (window as any).__AUTH_PROVIDER_STATE_KEY) {
        lastAuthChange = (window as any).__AUTH_PROVIDER_STATE_KEY.lastLoginTime || 0;
        }
        } catch (e) {
        console.warn(`AuthClient: Error checking last auth change time (${requestId})`, e);
        }
        
        if (lastAuthChange && Date.now() - lastAuthChange < 1000) {
          console.warn(`AuthClient: User fetch skipped - in cooldown (${requestId})`);
        return {
          success: false,
          message: 'User fetch skipped - in cooldown',
          data: null
        };
      }
      
      // Synchronize tokens to ensure cookies are set correctly
      try {
        const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
        await TokenManager.synchronizeTokens(true);
      } catch (syncError) {
        console.warn(`AuthClient: Error synchronizing tokens during user fetch (${requestId})`, syncError);
        // Continue despite synchronization error
      }
        
        // Add a debounce check to prevent excessive calls
        const now = Date.now();
        const lastFetchTime = (this as any)._lastUserFetchTime || 0;
        
        if (now - lastFetchTime < 500) { // 500ms debounce
          console.log(`AuthClient: User fetch throttled - too frequent (${requestId})`);
          return {
            success: false,
            data: null,
            message: 'Request throttled - too frequent',
            statusCode: 429
          };
        }
        
        // Update the last fetch time
        (this as any)._lastUserFetchTime = now;
        
        // Get auth token for explicit inclusion
        let authToken = null;
        if (typeof document !== 'undefined') {
          // Try all possible token cookie names for compatibility
          const tokenCookieNames = ['auth_token_access', 'auth_token', 'access_token', 'accessToken'];
          const cookies = document.cookie.split(';');
          
          for (const cookieName of tokenCookieNames) {
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === cookieName && value) {
                try {
                  authToken = decodeURIComponent(value);
                  console.log(`AuthClient: Found token in ${cookieName} cookie (${requestId})`);
                  break;
                } catch (e) {
                  console.warn(`AuthClient: Error decoding ${cookieName} cookie value (${requestId}):`, e);
                }
              }
            }
            if (authToken) break; // Stop looking if we found a token
          }
        }
        
        // If no token in cookies, check for backup in localStorage
        if (!authToken && typeof window !== 'undefined') {
          const tokenBackup = localStorage.getItem('auth_token_backup');
          if (tokenBackup) {
            console.log(`AuthClient: Using token from localStorage backup (${requestId})`);
            authToken = tokenBackup;
            
            // Set it as a cookie so it will be sent with future requests
            try {
              document.cookie = `auth_token=${tokenBackup};path=/;max-age=3600`;
              document.cookie = `auth_token_access=${tokenBackup};path=/;max-age=3600`;
            } catch (cookieError) {
              console.warn(`AuthClient: Failed to set token cookie from backup (${requestId}):`, cookieError);
            }
          }
        }
        
        if (!authToken) {
          console.warn(`AuthClient: No token found in cookies or localStorage - auth will fail (${requestId})`);
        }
        
        // The API endpoint for the current user
        const userEndpoint = '/api/users/me';
        console.log(`AuthClient: Using endpoint: ${userEndpoint} (${requestId})`);
        
        // Comprehensive headers to ensure proper authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Request-ID': requestId
        };
        
        // Always add token to Authorization header when available
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
          console.log(`AuthClient: Added token to Authorization header (${requestId})`);
        }
        
        // Add timeout protection for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        try {
          const response = await fetch(userEndpoint, {
            method: 'GET',
            headers,
            credentials: 'include', // Important for cookies
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.warn(`AuthClient: Failed to get current user: ${response.status} (${requestId})`);
            return {
              success: false,
              data: null,
              message: `Could not fetch user profile: ${response.status}`,
              statusCode: response.status
            };
          }
          
          const data = await response.json();
          console.log(`AuthClient: User response received (${requestId})`);
          
          // Handle different response formats
          // Check for empty or malformed response
          if (!data || Object.keys(data).length === 0) {
            console.warn(`AuthClient: Empty response received (${requestId})`);
            return {
              success: true,
              data: null,
              message: 'Empty but authenticated response',
              requiresUserFetch: true,
              statusCode: 200
            };
          }
          
          // Extract user data with improved handling
          let userData = null;
          
          // Handle various response formats
          if (data.data && typeof data.data === 'object') {
            userData = data.data;
            console.log(`AuthClient: Using data field from response (${requestId})`);
          } else if (data.user && typeof data.user === 'object') {
            userData = data.user;
            console.log(`AuthClient: Using user field from response (${requestId})`);
          } else if (data.success && (data.id || data.email)) {
            // User data at top level
            const tempData = {...data};
            ['success', 'message', 'timestamp', 'errorCode', 'errors'].forEach(key => {
              if (key in tempData) delete tempData[key];
            });
            
            userData = tempData;
            console.log(`AuthClient: Extracted user data from top level (${requestId})`);
          } else if (data.id || data.email) {
            // Direct user data format
            userData = data;
            console.log(`AuthClient: Using direct data as user data (${requestId})`);
          }
          
          if (userData && (userData.id || userData.email)) {
            console.log(`AuthClient: Current user fetched successfully (${requestId})`);
            return {
              success: true,
              data: userData,
              message: 'User profile loaded',
              statusCode: 200
            };
          } else {
            console.warn(`AuthClient: No valid user data in response (${requestId})`);
            return {
              success: false,
              data: null,
              message: 'No valid user data received',
              statusCode: 204
            };
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Check for timeout
          if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
            console.error(`AuthClient: User fetch request timed out (${requestId})`);
            return {
              success: false,
              data: null,
              message: 'Request timed out',
              statusCode: 408 // Request Timeout
            };
          }
          
          console.error(`AuthClient: Error fetching user (${requestId}):`, fetchError);
          return {
            success: false,
            data: null,
            message: fetchError instanceof Error ? fetchError.message : 'Network error',
            statusCode: 0
          };
        }
      } catch (error) {
        console.error(`AuthClient: Error in getCurrentUser (${requestId}):`, error);
        return {
          success: false,
          data: null,
          message: 'Authentication error',
          statusCode: 401
        };
      }
    });
  }

  /**
   * Refresh authentication token
   * Uses refresh token cookie to get a new access token with improved reliability and error handling
   */
  static async refreshToken() {
    // Generate a unique request ID for tracking
    const requestId = `refresh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    return this.deduplicate('refreshToken', async () => {
      try {
        console.log(`AuthClient: Attempting token refresh (${requestId})`);
        
        // First ensure tokens are synchronized properly
        await import('@/infrastructure/auth/TokenManager')
          .then(({ TokenManager }) => TokenManager.synchronizeTokens(true))
          .catch(syncError => {
            console.warn(`AuthClient: Token synchronization error during refresh (${requestId}):`, syncError);
            // Continue despite sync error - the refresh may still work
          });
        
        // Check for refresh token in cookies
        let hasRefreshToken = false;
        if (typeof document !== 'undefined') {
          const refreshCookieNames = ['refresh_token', 'refresh', 'refresh_token_access'];
          const cookies = document.cookie.split(';');
          hasRefreshToken = cookies.some(cookie => {
            const [name] = cookie.trim().split('=');
            return refreshCookieNames.includes(name);
          });
          
          console.log(`AuthClient: Refresh token cookie check: ${hasRefreshToken ? 'Found' : 'Not found'} (${requestId})`);
        }
        
        // Check for backup in localStorage if no cookie found
        let refreshTokenBackup = null;
        if (!hasRefreshToken && typeof localStorage !== 'undefined') {
          refreshTokenBackup = localStorage.getItem('refresh_token_backup');
          if (refreshTokenBackup) {
            console.log(`AuthClient: Using refresh token from localStorage backup (${requestId})`);
            
            // Set it as a cookie to use with the request
            document.cookie = `refresh_token=${refreshTokenBackup};path=/;max-age=86400;SameSite=Lax`;
            document.cookie = `refresh_token_access=${refreshTokenBackup};path=/;max-age=86400;SameSite=Lax`;
            hasRefreshToken = true;
          }
        }
        
        if (!hasRefreshToken && !refreshTokenBackup) {
          console.warn(`AuthClient: No refresh token available, refresh not possible (${requestId})`);
          return {
            success: false,
            message: 'No refresh token available',
            data: null
          };
        }
        
        // Set up timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        // Set up headers with additional diagnostic information
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-ID': requestId,
          'X-Refresh-Request': 'true',
          'X-Client-Time': new Date().toISOString()
        };
        
        // Create the request body - include refresh token from backup if available
        const requestBody = refreshTokenBackup ? JSON.stringify({ refreshToken: refreshTokenBackup }) : undefined;
        
        try {
          // Add a cache buster to prevent caching issues
          const refreshUrl = `${this.basePath}/refresh?_=${Date.now()}`;
          console.log(`AuthClient: Making token refresh request to ${refreshUrl} (${requestId})`);
          
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers,
            credentials: 'include', // Important for cookies
            body: requestBody,
            signal: controller.signal
          });
          
          // Clear timeout as request completed
          clearTimeout(timeoutId);
          
          // Log response details for debugging
          console.log(`AuthClient: Refresh response status: ${response.status} (${requestId})`);
          
          // For debugging, log available cookies after refresh attempt
          if (typeof document !== 'undefined') {
            const cookiesAfter = document.cookie;
            console.log(`AuthClient: Cookies after refresh attempt (${requestId}):`, {
              cookieCount: cookiesAfter.split(';').length,
              hasAuthToken: cookiesAfter.includes('auth_token='),
              hasRefreshToken: cookiesAfter.includes('refresh_token=')
            });
          }
          
          if (response.ok) {
            // Handle successful response
            try {
              const data = await response.json();
              
              if (data && (data.success || data.data)) {
                console.log(`AuthClient: Token refresh successful (${requestId})`);
                
                // Extract tokens with better error handling and fallbacks
                let accessToken = null;
                let refreshToken = null;
                let expiresIn = 3600; // Default to 1 hour if not specified
                
                if (data.data && data.data.accessToken) {
                  accessToken = data.data.accessToken;
                  refreshToken = data.data.refreshToken;
                  expiresIn = data.data.expiresIn || expiresIn;
                } else if (data.accessToken) {
                  accessToken = data.accessToken;
                  refreshToken = data.refreshToken;
                  expiresIn = data.expiresIn || expiresIn;
                } else if (data.token) {
                  // Legacy format support
                  accessToken = data.token;
                }
                
                // Store tokens as backups in localStorage
                if (accessToken && typeof localStorage !== 'undefined') {
                  console.log(`AuthClient: Saving token backups from refresh response (${requestId})`);
                  localStorage.setItem('auth_token_backup', accessToken);
                  localStorage.setItem('auth_token', accessToken); // For legacy compatibility
                  
                  if (refreshToken) {
                    localStorage.setItem('refresh_token_backup', refreshToken);
                  }
                  
                  // Store expiration information
                  const expirationTime = Date.now() + (expiresIn * 1000);
                  localStorage.setItem('auth_expires_at', new Date(expirationTime).toISOString());
                  localStorage.setItem('auth_timestamp', Date.now().toString());
                }
                
                // Notify about successful refresh after slight delay
                setTimeout(async () => {
                  try {
                    const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
                    await TokenManager.synchronizeTokens(true);
                    await TokenManager.notifyAuthChange(true);
                  } catch (notifyError) {
                    console.warn(`AuthClient: Error notifying about token refresh (${requestId}):`, notifyError);
                  }
                }, 100);
                
                return {
                  success: true,
                  message: 'Authentication refreshed successfully',
                  data: {
                    accessToken,
                    refreshToken,
                    expiresIn
                  }
                };
              } else {
                console.warn(`AuthClient: Refresh response indicated success but had invalid data format (${requestId})`);
                console.log(`AuthClient: Refresh response data:`, data);
                
                // Check for valid cookies set by the server despite JSON formatting issues
                if (typeof document !== 'undefined') {
                  const cookiesAfter = document.cookie;
                  if (cookiesAfter.includes('auth_token=')) {
                    console.log(`AuthClient: Found auth_token cookie despite parsing issues (${requestId})`);
                    
                    // Try to synchronize tokens after slight delay
                    setTimeout(async () => {
                      try {
                        const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
                        await TokenManager.synchronizeTokens(true);
                        await TokenManager.notifyAuthChange(true);
                      } catch (syncError) {
                        console.warn(`AuthClient: Error syncing tokens after refresh (${requestId}):`, syncError);
                      }
                    }, 100);
                    
                    return {
                      success: true,
                      message: 'Authentication cookies refreshed successfully',
                      data: null
                    };
                  }
                }
              }
            } catch (parseError) {
              console.warn(`AuthClient: Error parsing token refresh response (${requestId}):`, parseError);
              
              // Even with parsing error, if status was OK, consider it successful
              if (response.status >= 200 && response.status < 300) {
                console.log(`AuthClient: Token refresh succeeded despite parsing error (${requestId})`);
                
                // Attempt token synchronization to capture any cookies that were set
                setTimeout(async () => {
                  try {
                    const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
                    await TokenManager.synchronizeTokens(true);
                    await TokenManager.notifyAuthChange(true);
                  } catch (syncError) {
                    console.warn(`AuthClient: Error syncing tokens after refresh with parsing error (${requestId}):`, syncError);
                  }
                }, 100);
                
                return {
                  success: true,
                  message: 'Authentication refreshed',
                  data: null
                };
              }
            }
          }
          
          // If we reach here, the refresh failed
          try {
            // Try to get more information from the error response
            const errorText = await response.text();
            console.warn(`AuthClient: Token refresh failed (${requestId}): ${response.status}`, { responseText: errorText.substring(0, 200) });
          } catch (textError) {
            // If we can't even read the error response
            console.warn(`AuthClient: Token refresh failed with status ${response.status} (${requestId})`);
          }
          
          // For 401/403 responses, consider this a permanent auth failure
          if (response.status === 401 || response.status === 403) {
            // Clear tokens on auth failure
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('auth_token_backup');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token_backup');
            }
            
            // Notify about logout
            setTimeout(async () => {
              try {
                const { TokenManager } = await import('@/infrastructure/auth/TokenManager');
                await TokenManager.notifyAuthChange(false);
              } catch (notifyError) {
                console.warn(`AuthClient: Error notifying about auth failure (${requestId}):`, notifyError);
              }
            }, 100);
          }
          
          return {
            success: false,
            message: `Failed to refresh authentication: ${response.status}`,
            data: null,
            statusCode: response.status
          };
        } catch (fetchError) {
          // Always clear timeout
          clearTimeout(timeoutId);
          
          // Check for abort (timeout) errors
          if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
            console.warn(`AuthClient: Token refresh request timed out (${requestId})`);
            return {
              success: false,
              message: 'Token refresh request timed out',
              data: null,
              statusCode: 408 // Request Timeout
            };
          }
          
          // Handle network errors
          console.error(`AuthClient: Error during token refresh (${requestId}):`, fetchError);
          return {
            success: false,
            message: fetchError instanceof Error ? fetchError.message : 'Failed to refresh authentication',
            data: null,
            error: fetchError
          };
        }
      } catch (error) {
        console.error(`AuthClient: Token refresh outer error (${requestId}):`, error);
        return {
          success: false,
          message: 'Failed to refresh authentication due to client error',
          data: null,
          error
        };
      }
    });
  }
}

// Export the AuthClient class as default
export default AuthClient;
