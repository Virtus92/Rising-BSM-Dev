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
    
    return this.deduplicate(requestKey, async () => {
      try {
        // Skip if in cooldown period
        const lastAuthChange = TokenManager.getLastAuthChangeTime();
        if (lastAuthChange && Date.now() - lastAuthChange < 1000) {
          return {
            success: false,
            message: 'Login attempt too soon after previous auth change',
            data: null
          };
        }
        
        // Force a direct fetch to avoid potential issues with the ApiClient
        // This creates a cleaner request for the login endpoint
        const response = await fetch(`${this.basePath}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include',
          body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
          console.error('AuthClient: Login HTTP error:', response.status);
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
            console.error('AuthClient: Login error details:', errorData);
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
          console.warn('AuthClient: Error saving token backups:', storageError);
        }
        
        // For status 200, we consider it a success regardless of data.success
        // This accommodates different server response formats
        // Only log if we didn't get user data
        if (!userData) {
          console.log('AuthClient: Login successful but requires user fetch');
        }
        
        // Notify about successful authentication with a slight delay to avoid race conditions
        setTimeout(() => {
          // Synchronize tokens before notifying
          TokenManager.synchronizeTokens();
          TokenManager.notifyAuthChange(true);
        }, 50);
        
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
      } catch (error) {
        console.error('AuthClient: Login error:', error);
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
        
        // The server will clear the auth cookies
        const response = await ApiClient.post(`${this.basePath}/logout`);
        
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
    return ApiClient.post(`${this.basePath}/validate`, { token });
  }

  /**
   * Get current user
   * Uses cookies for authentication
   */
  static async getCurrentUser() {
    return this.deduplicate('getCurrentUser', async () => {
      try {
        // Skip if in cooldown period
        const lastAuthChange = TokenManager.getLastAuthChangeTime();
        if (lastAuthChange && Date.now() - lastAuthChange < 1000) {
          return {
            success: false,
            message: 'User fetch skipped - in cooldown',
            data: null
          };
        }
        
        // Synchronize tokens to ensure cookies are set correctly
        TokenManager.synchronizeTokens();
        
        // Add a debounce check to prevent excessive calls
        const now = Date.now();
        const lastFetchTime = (this as any)._lastUserFetchTime || 0;
        
        if (now - lastFetchTime < 500) { // 500ms debounce
          console.log('AuthClient: User fetch throttled - too frequent');
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
          const tokenCookieNames = ['auth_token_access', 'auth_token', 'access_token'];
          const cookies = document.cookie.split(';');
          
          for (const cookieName of tokenCookieNames) {
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === cookieName && value) {
                try {
                  authToken = decodeURIComponent(value);
                  console.log(`AuthClient: Found token in ${cookieName} cookie`);
                  break;
                } catch (e) {
                  console.warn(`AuthClient: Error decoding ${cookieName} cookie value:`, e);
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
            console.log('AuthClient: Using token from localStorage backup');
            authToken = tokenBackup;
            
            // Set it as a cookie so it will be sent with future requests
            document.cookie = `auth_token=${tokenBackup};path=/;max-age=3600`;
            document.cookie = `auth_token_access=${tokenBackup};path=/;max-age=3600`;
          }
        }
        
        if (!authToken) {
          console.warn('AuthClient: No token found in cookies or localStorage - auth will fail');
        }
        
        // The API endpoint for the current user
        const userEndpoint = '/api/users/me';
        console.log('AuthClient: Using endpoint:', userEndpoint);
        
        // Comprehensive headers to ensure proper authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
        };
        
        // Always add token to Authorization header when available
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
          console.log('AuthClient: Added token to Authorization header');
        }
        
        const response = await fetch(userEndpoint, {
          method: 'GET',
          headers,
          credentials: 'include' // Important for cookies
        });
        
        if (!response.ok) {
          console.warn(`AuthClient: Failed to get current user: ${response.status}`);
          return {
            success: false,
            data: null,
            message: `Could not fetch user profile: ${response.status}`,
            statusCode: response.status
          };
        }
        
        const data = await response.json();
        // Only log if response is unexpected
        if (!data || !data.success) {
          console.log('AuthClient: Unexpected user response:', data);
        }
        
        // Handle different response formats
        // Check for empty or malformed response
        if (!data || Object.keys(data).length === 0) {
          console.log('AuthClient: Empty direct response received with status 200');
          // Don't make another network request, just return with a special flag
          return {
            success: true,
            data: null,
            message: 'Empty but authenticated response',
            requiresUserFetch: true,
            statusCode: 200
          };
        }
        
        // Log the response structure for debugging
        console.log('AuthClient: Response structure:', {
          hasData: !!data.data,
          hasUser: !!(data.user),
          topLevelKeys: Object.keys(data),
          isSuccess: data.success
        });
        
        // Extrahiere Benutzerdaten aus Response mit besserer Format-Erkennung
        let userData = null;
        
        // Log the full response for debugging
        console.log('AuthClient: Detailed response structure analysis:', {
          hasSuccess: 'success' in data,
          isSuccess: data.success,
          hasData: 'data' in data,
          dataType: data.data ? typeof data.data : 'undefined',
          hasUser: 'user' in data,
          hasId: 'id' in data,
          hasEmail: 'email' in data
        });
        
        // Handle various response formats
        if (data.data && typeof data.data === 'object') {
          // Standard API response format
          userData = data.data;
          console.log('AuthClient: Using data field from response');
        } else if (data.user && typeof data.user === 'object') {
          // Some APIs return { user: {...} }
          userData = data.user;
          console.log('AuthClient: Using user field from response');
        } else if (data.success && !data.data && !data.user && (data.id || data.email)) {
          // Some APIs may include the user data at the top level
          // Clone data and remove non-user fields
          const tempData = {...data};
          ['success', 'message', 'timestamp', 'errorCode', 'errors'].forEach(key => {
            if (key in tempData) delete tempData[key];
          });
          
          // Check if remaining data looks like user data
          if (tempData.id || tempData.email) {
            userData = tempData;
            console.log('AuthClient: Extracted user data from top level');
          }
        } else {
          // Last resort: try to use data directly
          userData = data.id || data.email ? data : null;
          
          if (userData) {
            console.log('AuthClient: Using direct data as user data');
          }
        }
        
        // Log what we found
        console.log('AuthClient: Extracted user data:', userData ? 'Found' : 'Not found');
        
        if (userData && (userData.id || userData.email)) {
          console.log('AuthClient: Current user fetched successfully');
          return {
            success: true,
            data: userData,
            message: 'User profile loaded',
            statusCode: 200
          };
        } else {
          console.warn('AuthClient: Received success response but no valid user data');
          return {
            success: false,
            data: null,
            message: 'No valid user data received',
            statusCode: 204
          };
        }
      } catch (error) {
        console.error('AuthClient: Error getting current user:', error);
        // Token is invalid or expired - handled by the server
        return {
          success: false,
          data: null,
          message: 'Not authenticated',
          statusCode: 401
        };
      }
    });
  }

  /**
   * Refresh authentication token
   * Uses refresh token cookie to get a new access token
   */
  static async refreshToken() {
    return this.deduplicate('refreshToken', async () => {
      try {
        console.log('AuthClient: Attempting token refresh');
        
        // Synchronize tokens first to ensure we have the best chance of success
        TokenManager.synchronizeTokens();
        
        // Check browser cookies for refresh_token - skip refresh if not present
        if (typeof document !== 'undefined') {
          // Check for any of the possible refresh token cookie names
          const refreshCookieNames = ['refresh_token', 'refresh', 'refresh_token_access'];
          const hasCookie = document.cookie.split(';').some(cookie => {
            const trimmedCookie = cookie.trim();
            return refreshCookieNames.some(name => trimmedCookie.startsWith(`${name}=`));
          });
          
          // If no cookie but a backup exists, set a cookie from the backup
          if (!hasCookie) {
            const refreshTokenBackup = localStorage.getItem('refresh_token_backup');
            if (refreshTokenBackup) {
              console.log('AuthClient: Setting refresh_token cookie from backup');
              document.cookie = `refresh_token=${refreshTokenBackup};path=/;max-age=86400`;
            } else {
              console.warn('AuthClient: No refresh token cookie or backup found, skipping refresh');
              return {
                success: false,
                message: 'No refresh token available',
                data: null
              };
            }
          }
        }
        
        // Add a retry mechanism for token refresh
        const maxRetries = 2;
        let currentRetry = 0;
        let lastError = null;
        
        while (currentRetry <= maxRetries) {
          try {
            // The server will use the refresh_token cookie to issue a new auth token
            const response = await fetch(`${this.basePath}/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'X-Retry-Count': currentRetry.toString()
              },
              credentials: 'include'
            });
            
            // If the request was successful, process it and return
            if (response.ok) {
              // Try to parse the response
              try {
                const data = await response.json();
                console.log('AuthClient: Token refresh response:', data);
                
                // Store new tokens as backups in localStorage
                if (data.data) {
                  if (data.data.accessToken) {
                    localStorage.setItem('auth_token_backup', data.data.accessToken);
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
                }
                
                // Record authentication timestamp
                localStorage.setItem('auth_timestamp', Date.now().toString());
                
                // For any 2xx status we consider it successful
                console.log('AuthClient: Token refresh succeeded');
                
                // Update auth state with delay
                setTimeout(() => {
                  TokenManager.notifyAuthChange(true);
                }, 50);
                
                return {
                  success: true,
                  message: 'Authentication refreshed successfully',
                  data: data
                };
              } catch (parseError) {
                console.error('AuthClient: Error parsing refresh token response:', parseError);
                // Even with parsing error, if status was OK, consider it successful
                if (response.status >= 200 && response.status < 300) {
                  console.log('AuthClient: Token refresh succeeded despite parsing error');
                  
                  // Update auth state with delay
                  setTimeout(() => {
                    TokenManager.notifyAuthChange(true);
                  }, 50);
                  
                  return {
                    success: true,
                    message: 'Authentication refreshed',
                    data: null
                  };
                } else {
                  throw new Error('Failed to parse refresh token response');
                }
              }
            } else {
              // Non-OK response
              console.warn(`AuthClient: Token refresh failed with status ${response.status} (attempt ${currentRetry + 1}/${maxRetries + 1})`);
              
              // If we've reached max retries, return failure
              if (currentRetry === maxRetries) {
                return {
                  success: false,
                  message: `Failed to refresh authentication: ${response.status}`,
                  data: null
                };
              }
              
              // Otherwise, wait and retry
              const delay = Math.pow(2, currentRetry) * 300; // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, delay));
              currentRetry++;
            }
          } catch (error) {
            lastError = error;
            console.error(`AuthClient: Token refresh attempt ${currentRetry + 1} error:`, error);
            
            // If we've reached max retries, break out of the loop
            if (currentRetry === maxRetries) {
              break;
            }
            
            // Otherwise, wait and retry
            const delay = Math.pow(2, currentRetry) * 300;
            await new Promise(resolve => setTimeout(resolve, delay));
            currentRetry++;
          }
        }
        
        // If we get here, all retries failed
        return {
          success: false,
          message: 'Failed to refresh authentication after multiple attempts',
          data: null
        };
      } catch (error) {
        console.error('AuthClient: Token refresh outer error:', error);
        return {
          success: false,
          message: 'Failed to refresh authentication',
          data: null
        };
      }
    });
  }
}

// Export the AuthClient class as default
export default AuthClient;
