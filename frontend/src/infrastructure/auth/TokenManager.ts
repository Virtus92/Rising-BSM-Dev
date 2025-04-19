/**
 * Token Management-Service for client-side authentication
 * This class handles token validation and integration with HTTP-only cookies set by the server
 */
import { jwtDecode } from 'jwt-decode';
import { TokenPayloadDto } from '@/domain/dtos/AuthDtos';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * Service for managing auth tokens in the browser
 * Works with HTTP-only cookies set by the server
 */
export class TokenManager {
  /**
   * Initializes the TokenManager and checks authentication status
   * 
   * @param autoRefresh - Whether to automatically refresh expired tokens
   * @returns Promise that returns true if a valid token is present
   */
  static async initialize(autoRefresh: boolean = true): Promise<boolean> {
    const logger = getLogger();
    logger.debug('Initializing TokenManager');
    
    // First synchronize tokens between localStorage and cookies to recover from issues
    this.synchronizeTokens();
    
    // Since we work with HTTP-only cookies, we need to make an API call
    // to check if we're authenticated
    if (autoRefresh) {
      logger.debug('Attempting to verify authentication');
      try {
        // Check authentication by calling /api/users/me
        const response = await fetch('/api/users/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        // If we get a 200 response, we're authenticated
        if (response.ok) {
          logger.debug('User is authenticated');
          return true;
        }
        
        // For 401 or other errors, try a token refresh
        logger.debug('User not authenticated with current token, attempting refresh');
        return await this.refreshAccessToken();
      } catch (error) {
        logger.error('Error checking authentication:', { error });
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Synchronizes tokens between localStorage backups and cookies
   * This helps recover from scenarios where cookies aren't properly set
   */
  static synchronizeTokens(): void {
    // Only run in client-side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    const logger = getLogger();
    logger.debug('Synchronizing tokens between localStorage and cookies');
    
    try {
      // Check for backup tokens in localStorage
      const authTokenBackup = localStorage.getItem('auth_token_backup');
      const refreshTokenBackup = localStorage.getItem('refresh_token_backup');
      
      // Parse all cookies into a more reliable format
      const cookies = {};
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name) cookies[name] = value;
      });
      
      // More reliable cookie detection
      const hasAuthCookie = 'auth_token' in cookies || 'auth_token_access' in cookies;
      const hasRefreshCookie = 'refresh_token' in cookies || 'refresh_token_access' in cookies;
      
      logger.debug('Token status during synchronization', {
        hasAuthCookie,
        hasRefreshCookie,
        hasAuthBackup: !!authTokenBackup,
        hasRefreshBackup: !!refreshTokenBackup
      });
      
      // If we have backup but no cookie, set temporary client-side cookies
      // This will help until the next API call refreshes them properly
      if (authTokenBackup && !hasAuthCookie) {
        logger.debug('Setting auth_token cookie from backup');
        // Set multiple cookie variants for backward compatibility
        document.cookie = `auth_token=${authTokenBackup};path=/;max-age=3600;SameSite=Lax`;
        document.cookie = `auth_token_access=${authTokenBackup};path=/;max-age=3600;SameSite=Lax`;
      }
      
      if (refreshTokenBackup && !hasRefreshCookie) {
        logger.debug('Setting refresh_token cookie from backup');
        document.cookie = `refresh_token=${refreshTokenBackup};path=/;max-age=86400;SameSite=Lax`;
        document.cookie = `refresh_token_access=${refreshTokenBackup};path=/;max-age=86400;SameSite=Lax`;
      }
      
      // Also synchronize in the reverse direction - if we have cookies but no backup
      if (!authTokenBackup && hasAuthCookie) {
        const authToken = cookies['auth_token'] || cookies['auth_token_access'];
        if (authToken) {
          logger.debug('Setting localStorage backup from cookie');
          localStorage.setItem('auth_token_backup', authToken);
          localStorage.setItem('auth_token', authToken);
        }
      }
      
      if (!refreshTokenBackup && hasRefreshCookie) {
        const refreshToken = cookies['refresh_token'] || cookies['refresh_token_access'];
        if (refreshToken) {
          logger.debug('Setting refresh token backup from cookie');
          localStorage.setItem('refresh_token_backup', refreshToken);
        }
      }
      
      // If auth_token in localStorage is undefined but we have a backup,
      // update it to maintain compatibility with any legacy code
      if (authTokenBackup && localStorage.getItem('auth_token') === 'undefined') {
        logger.debug('Fixing undefined auth_token in localStorage');
        localStorage.setItem('auth_token', authTokenBackup);
      }
      
      // Record authentication timestamp if we have either cookie or backup token
      if ((hasAuthCookie || authTokenBackup) && !localStorage.getItem('auth_timestamp')) {
        localStorage.setItem('auth_timestamp', Date.now().toString());
      }
    } catch (error) {
      logger.error('Error synchronizing tokens:', { error });
    }
  }
  
  /**
   * Notifies the application about authentication state changes
   * Note: Actual tokens are managed by HTTP-only cookies set by the server
   * 
   * @param isAuthenticated - Whether the user is authenticated
   */
  // Debounce flag to prevent multiple auth change notifications in a short period
  private static isNotifying: boolean = false;
  private static notificationTimeout: any = null;
  
  // Set a minimum interval between auth notifications to avoid cascade effects
  private static lastEventTime = 0;
  private static readonly MIN_EVENT_INTERVAL = 300;
  private static readonly AUTH_COOLDOWN = 2000; // 2 second cooldown after auth changes

  public static getLastAuthChangeTime(): number {
    return this.lastAuthChange;
  }
  private static notificationDebounceTimer: any = null;
  private static pendingNotifications: Array<{isAuthenticated: boolean, timestamp: number}> = [];
  public static lastAuthChange = 0;
  
  /**
   * Notifies the application about authentication state changes
   * Uses debouncing and queuing to ensure all state changes are processed
   *
   * @param isAuthenticated - Whether the user is authenticated
   */
  static notifyAuthChange(isAuthenticated: boolean): void {
    const logger = getLogger();
    const now = Date.now();
    
    // Synchronize tokens on auth change to ensure consistency
    this.synchronizeTokens();
    
    // Add to pending notifications queue
    this.pendingNotifications.push({isAuthenticated, timestamp: now});
    logger.debug('Added auth change to queue', {
      isAuthenticated,
      queueLength: this.pendingNotifications.length
    });

    // Skip if in cooldown period or too soon after previous event
    if (now - this.lastAuthChange < this.AUTH_COOLDOWN ||
        now - this.lastEventTime < this.MIN_EVENT_INTERVAL) {
      logger.debug('Auth change notification throttled');
      return;
    }
    
    // Clear any pending timers
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    if (this.notificationDebounceTimer) {
      clearTimeout(this.notificationDebounceTimer);
    }
    
    // Process the queue after debounce delay
    this.notificationDebounceTimer = setTimeout(() => {
      // Get the most recent notification from queue
      const latestNotification = this.pendingNotifications.reduce((latest, current) =>
        current.timestamp > latest.timestamp ? current : latest
      );
      
      // Clear queue
      this.pendingNotifications = [];
      
      // Skip if already notifying
      if (this.isNotifying) {
        logger.debug('Auth change notification delayed - already notifying');
        this.notificationTimeout = setTimeout(() => {
          this.isNotifying = false;
          this.notifyAuthChange(latestNotification.isAuthenticated);
        }, 300);
        return;
      }
      
      // Update timestamp
      this.lastEventTime = Date.now();
      
      // Set notifying flag
      this.isNotifying = true;
      logger.debug('Processing auth state change', {
        isAuthenticated: latestNotification.isAuthenticated
      });
      
      // Dispatch event
      if (typeof window !== 'undefined') {
        try {
          const event = new CustomEvent('auth_status_changed', {
            detail: { isAuthenticated: latestNotification.isAuthenticated }
          });
          window.dispatchEvent(event);
          logger.debug('Auth state change event dispatched');
        } catch (e) {
          logger.error('Failed to dispatch auth event:', { error: e });
        } finally {
          setTimeout(() => {
            this.isNotifying = false;
          }, 500);
        }
      } else {
        this.isNotifying = false;
      }
    }, 150); // Short debounce delay
  }

  static getAccessToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth_token_backup');
    }
    return null;
  }
  
  static clearTokens(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_backup');
      localStorage.removeItem('refresh_token_backup');
    }
    
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  /**
   * Notify about logout (tokens are cleared by the server)
   */
  static notifyLogout(): void {
    // Dispatch event to inform components about logout
    this.notifyAuthChange(false);
    
    // Clear any localStorage backups on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_backup');
      localStorage.removeItem('refresh_token_backup');
    }
  }

  /**
   * Extracts user information from a JWT token
   * This method is useful when a token is extracted from cookies
   * 
   * @param token - JWT token
   * @returns User information or null for invalid token
   */
  static getUserFromToken(token: string): { id: number; name: string; email: string; role: string; iss?: string; aud?: string } | null {
    try {
      const decoded = jwtDecode<TokenPayloadDto>(token);
      
      if (!decoded) {
        return null;
      }
      
      // UserId can be in sub as string or number
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else if (typeof decoded.sub === 'string') {
        userId = parseInt(decoded.sub, 10);
      } else {
        return null;
      }
      
      // Explicitly check for required fields
      if (!decoded.name || !decoded.email || !decoded.role) {
        return null;
      }
      
      if (isNaN(userId)) {
        return null;
      }
      
      return {
        id: userId,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        // Include standard JWT claims if present
        iss: decoded.iss,
        aud: decoded.aud
      };
    } catch (error) {
      getLogger().error('Token decoding failed:', { error });
      return null;
    }
  }

  /**
   * Extracts the expiration date from a JWT token
   * 
   * @param token - JWT token
   * @returns Date object with expiration date or null for invalid token
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwtDecode<TokenPayloadDto>(token);
      
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      // Token expiration time in seconds to Date
      return new Date(decoded.exp * 1000);
    } catch (error) {
      getLogger().error('Token expiration extraction failed:', { error });
      return null;
    }
  }

  /**
   * Checks if a JWT token is expired
   * 
   * @param token - JWT token
   * @param bufferSeconds - Buffer time in seconds to detect early expiration (default: 30s)
   * @returns True if expired, otherwise false
   */
  static isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      
      if (!expiration) {
        return true;
      }
      
      // Consider buffer time to detect early expiration
      const currentTime = new Date();
      const bufferTime = new Date(currentTime.getTime() + bufferSeconds * 1000);
      
      return bufferTime >= expiration;
    } catch (error) {
      getLogger().error('Token validation failed:', { error });
      return true;
    }
  }

  /**
   * Calculates the remaining validity period of a token in milliseconds
   * 
   * @param token - JWT token
   * @returns Remaining time in milliseconds or 0 if expired
   */
  static getTokenRemainingTime(token: string): number {
    try {
      const expiration = this.getTokenExpiration(token);
      
      if (!expiration) {
        return 0;
      }
      
      const currentTime = new Date();
      const remainingTime = expiration.getTime() - currentTime.getTime();
      
      return Math.max(0, remainingTime);
    } catch (error) {
      getLogger().error('Calculation of remaining token time failed:', { error });
      return 0;
    }
  }

  // Flag to track refresh attempts and prevent infinite loops
  private static isRefreshing = false;
  private static refreshCallbacks: Array<(success: boolean) => void> = [];
  private static lastRefreshAttempt = 0;
  private static failedRefreshCount = 0;

  /**
   * Refresh the access token
   */
  static async refreshAccessToken(): Promise<boolean> {
    const logger = getLogger();
    
    try {
      // Prevent multiple refresh attempts at the same time
      if (this.isRefreshing) {
        logger.debug('Already refreshing token, waiting for completion...');
        
        // Wait for the existing refresh operation to complete
        return await new Promise((resolve) => {
          this.refreshCallbacks.push((success: boolean) => resolve(success));
        });
      }
      
      // Set refreshing flag to prevent multiple simultaneous requests
      this.isRefreshing = true;
      
      // Check if the refresh token request was made recently (prevent rapid retries)
      const now = Date.now();
      if (this.lastRefreshAttempt && (now - this.lastRefreshAttempt) < 5000) { // 5 seconds
        logger.debug('Token refresh attempted too recently, skipping');
        this.isRefreshing = false;
        return false;
      }
      
      this.lastRefreshAttempt = now;
      logger.debug('Attempting to refresh token');
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // Enhanced cookie checking with better debugging
      if (typeof document !== 'undefined') {
        // Log all cookies for debugging (without values for security)
        const allCookies = document.cookie.split(';').map(c => c.trim());
        logger.debug('Available cookies during refresh', { 
          cookieCount: allCookies.length,
          cookieNames: allCookies.map(c => c.split('=')[0]) 
        });
        
        const hasCookie = document.cookie.split(';').some(cookie => {
          const trimmedCookie = cookie.trim();
          return trimmedCookie.startsWith('refresh_token=');
        });
        
        if (!hasCookie) {
          // Check if we have a backup in localStorage we can use to create a cookie
          const refreshTokenBackup = localStorage.getItem('refresh_token_backup');
          if (refreshTokenBackup) {
            logger.debug('Creating refresh_token cookie from backup');
            
            // Ensure proper cookie format with attributes
            const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
            document.cookie = `refresh_token=${refreshTokenBackup};Path=/;${secure}Max-Age=86400;SameSite=Lax`;
            
            // Verify cookie was successfully set
            setTimeout(() => {
              const cookieSet = document.cookie.split(';').some(c => 
                c.trim().startsWith('refresh_token='));
              logger.debug('Refresh token cookie creation result', { success: cookieSet });
            }, 0);
          } else {
            logger.warn('No refresh token cookie or backup found, skipping refresh');
            return false;
          }
        }
      }
      
      // Add a retry mechanism for token refresh
      const maxRetries = 2;
      let currentRetry = 0;
      
      while (currentRetry <= maxRetries) {
        try {
          // Direct API call to avoid circular dependencies with cache busting
          const refreshUrl = `/api/auth/refresh?_=${timestamp}`;
          
          // Log cookies before making the API call
          if (typeof document !== 'undefined') {
            const cookieNames = document.cookie.split(';')
              .map(c => c.trim().split('=')[0])
              .filter(Boolean);
            logger.debug('Cookies available before refresh request', { 
              count: cookieNames.length,
              names: cookieNames
            });
          }
          
          logger.debug(`Making token refresh request (attempt ${currentRetry + 1}/${maxRetries + 1})`);
          
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Requested-With': 'XMLHttpRequest', // Helps identify AJAX requests
              'X-Retry-Count': currentRetry.toString()
            },
            credentials: 'include' // Important for cookie handling
          });
          
          // Log response headers for debugging
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
          logger.debug('Refresh response headers', { responseHeaders });
          
          if (response.ok) {
            try {
              const data = await response.json();
              
              if (data && data.success) {
                logger.debug('Token refresh successful');
                
                // If the response includes token data, save backups
                if (data.data && data.data.accessToken) {
                  logger.debug('Saving token backup from refresh response');
                  localStorage.setItem('auth_token_backup', data.data.accessToken);
                  
                  if (data.data.refreshToken) {
                    localStorage.setItem('refresh_token_backup', data.data.refreshToken);
                  }
                }
                
                // Dispatch event for successful refresh
                this.notifyAuthChange(true);
                return true;
              }
              
              logger.warn('Token refresh response not successful:', { data });
              // If this is the last retry, break out
              if (currentRetry === maxRetries) break;
              
              // Otherwise continue to next retry
              currentRetry++;
              const delay = Math.pow(2, currentRetry) * 300; // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } catch (parseError) {
              logger.error('Failed to parse token refresh response:', { parseError });
              
              // Even with parsing error, if status was OK, consider it successful
              if (response.status >= 200 && response.status < 300) {
                logger.debug('Token refresh succeeded despite parsing error');
                
                // Update auth state with delay
                setTimeout(() => {
                  this.notifyAuthChange(true);
                }, 50);
                
                return true;
              }
              
              // If this is the last retry, break out
              if (currentRetry === maxRetries) break;
              
              // Otherwise continue to next retry
              currentRetry++;
              const delay = Math.pow(2, currentRetry) * 300;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            logger.warn(`Token refresh failed: ${response.status} (attempt ${currentRetry + 1}/${maxRetries + 1})`);
            
            // Log response details for debugging
            try {
              const errorText = await response.text();
              logger.warn('Token refresh error details:', { 
                status: response.status, 
                attempt: currentRetry + 1,
                text: errorText.slice(0, 200) // Log first 200 chars to avoid huge logs
              });
            } catch (e) {
              logger.warn('Could not read error response');
            }
            
            // If the server returns 401 or 403, notify about auth change on last attempt
            if ((response.status === 401 || response.status === 403) && currentRetry === maxRetries) {
              this.notifyAuthChange(false);
              
              // Redirect to login page if token refresh fails completely
              if (this.failedRefreshCount >= 2 && typeof window !== 'undefined') {
                logger.debug('Too many failed token refresh attempts, redirecting to login');
                
                // Add a slight delay to avoid immediate redirect
                setTimeout(() => {
                  // Clear failed count after redirecting
                  this.failedRefreshCount = 0;
                  
                  // Redirect with current path as return URL
                  window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
                }, 500);
              } else {
                this.failedRefreshCount++;
              }
            }
            
            // If this is the last retry, break out
            if (currentRetry === maxRetries) break;
            
            // Otherwise continue to next retry
            currentRetry++;
            const delay = Math.pow(2, currentRetry) * 300;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } catch (error) {
          logger.error(`Token refresh attempt ${currentRetry + 1} error:`, { error });
          
          // If this is the last retry, break out
          if (currentRetry === maxRetries) break;
          
          // Otherwise continue to next retry
          currentRetry++;
          const delay = Math.pow(2, currentRetry) * 300;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If we get here, all retries failed
      this.isRefreshing = false;
      this.refreshCallbacks.forEach(callback => callback(false));
      this.refreshCallbacks = [];
      
      // Increment failed refresh count for potential redirect on subsequent attempts
      this.failedRefreshCount++;
      logger.debug(`Token refresh failed after all attempts. Failed count: ${this.failedRefreshCount}`);
      
      // If we've failed too many times, redirect to login
      if (this.failedRefreshCount >= 3 && typeof window !== 'undefined') {
        logger.warn('Too many consecutive refresh failures, redirecting to login');
        
        // Clear the count
        this.failedRefreshCount = 0;
        
        // Redirect after a small delay
        setTimeout(() => {
          window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        }, 300);
      }
      
      return false;
    } catch (error) {
      logger.error('Token refresh outer error:', { error });
      
      // Clear flags and notify callbacks
      this.isRefreshing = false;
      this.refreshCallbacks.forEach(callback => callback(false));
      this.refreshCallbacks = [];
      
      // Increment failed count
      this.failedRefreshCount++;
      
      // After multiple consecutive failures, redirect to login
      if (this.failedRefreshCount >= 3 && typeof window !== 'undefined') {
        logger.warn('Too many token refresh errors, redirecting to login');
        
        // Clear the count
        this.failedRefreshCount = 0;
        
        // Redirect with a delay
        setTimeout(() => {
          window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        }, 300);
      }
      
      return false;
    }
  }

    /**
   * Validates the current access token
   * 
   * @returns Whether the token is valid
   */
    static async validateToken(): Promise<boolean> {
      try {
        // Get the current access token
        const token = TokenManager.getAccessToken();
        
        if (!token) {
          return false;
        }
        
        // Call the validate endpoint to check if token is valid
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          return false;
        }
        
        const data = await response.json();
        return data.success === true;
      } catch (error) {
        console.error('Error validating token:', 
          error instanceof Error ? error.message : String(error));
        return false;
      }
    }

  /**
   * Checks if a user has a specific role or one of multiple roles
   * 
   * @param userRole - Current user role
   * @param requiredRole - Required role(s)
   * @returns True if the user has the required role, otherwise false
   */
  static hasRole(userRole: string, requiredRole: string | string[]): boolean {
    if (!userRole) {
      return false;
    }
    
    // Role weights (higher number = more rights)
    const roleWeights: Record<string, number> = {
      'admin': 100,
      'manager': 75,
      'mitarbeiter': 50,
      'benutzer': 25,
      'gast': 10
    };
    
    // Function to check if a role has enough rights
    const hasEnoughRights = (userRoleWeight: number, requiredRoleWeight: number) => {
      return userRoleWeight >= requiredRoleWeight;
    };
    
    // Weight of the user role
    const userRoleWeight = roleWeights[userRole.toLowerCase()] || 0;
    
    // Check for multiple required roles (OR connection)
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => {
        const requiredRoleWeight = roleWeights[role.toLowerCase()] || 0;
        return hasEnoughRights(userRoleWeight, requiredRoleWeight);
      });
    }
    
    // Check for a single required role
    const requiredRoleWeight = roleWeights[requiredRole.toLowerCase()] || 0;
    return hasEnoughRights(userRoleWeight, requiredRoleWeight);
  }
}
