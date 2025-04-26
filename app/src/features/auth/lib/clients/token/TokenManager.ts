/**
 * Token Management-Service for client-side authentication
 * This class handles token validation and integration with HTTP-only cookies set by the server
 */
import { jwtDecode } from 'jwt-decode';
import { TokenPayloadDto } from '@/domain/dtos/AuthDtos';
import { getLogger } from '@/core/logging';

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
  
  // Track synchronization to prevent parallel sync attempts
  private static isSynchronizing = false;
  private static syncPromise: Promise<boolean> | null = null;
  
  /**
   * Synchronizes tokens between localStorage backups and cookies
   * This helps recover from scenarios where cookies aren't properly set
   * 
   * @param forceSync Force synchronization even if it would normally be skipped
   * @returns Promise resolving to true if synchronization made changes
   */
  static synchronizeTokens(forceSync: boolean = false): Promise<boolean> {
    // Don't bother with synchronization in non-browser environments
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.resolve(false);
    }
    
    const logger = getLogger();
    logger.debug('Synchronizing tokens between localStorage and cookies');
    
    // Use global state to prevent concurrent synchronization across module instances
    if (typeof window !== 'undefined' && (window as any).__AUTH_TOKEN_STATE) {
      if ((window as any).__AUTH_TOKEN_STATE.synchronizing) {
        logger.debug('Token sync already in progress (via global state), reusing promise');
        return this.syncPromise || Promise.resolve(false);
      }
      (window as any).__AUTH_TOKEN_STATE.synchronizing = true;
    }
    
    // Prevent concurrent synchronization attempts
    if (this.isSynchronizing) {
      logger.debug('Token sync already in progress, reusing promise');
      return this.syncPromise || Promise.resolve(false);
    }
    
    // Access global state for tracking
    const globalState = (window as any).__API_CLIENT_STATE;
    
    // Use a throttle mechanism to prevent excessive synchronization
    const now = Date.now();
    const lastSyncTime = parseInt(localStorage.getItem('token_sync_timestamp') || '0', 10);
    const minSyncInterval = 2000; // 2 seconds
    
    // Skip synchronization if it was done recently, unless forced
    if (!forceSync && (now - lastSyncTime < minSyncInterval)) {
      logger.debug('Skipping token synchronization - recently performed');
      return Promise.resolve(false);
    }
    
    // Mark as synchronizing
    this.isSynchronizing = true;
    
    // Create and store the sync promise
    this.syncPromise = this._synchronizeTokensInternal().finally(() => {
      // Reset synchronizing state after a delay
      setTimeout(() => {
        this.isSynchronizing = false;
        this.syncPromise = null;
        
        // Reset global state as well
        if (typeof window !== 'undefined' && (window as any).__AUTH_TOKEN_STATE) {
          (window as any).__AUTH_TOKEN_STATE.synchronizing = false;
          (window as any).__AUTH_TOKEN_STATE.lastSyncTime = Date.now();
        }
      }, 300);
    });
    
    return this.syncPromise;
  }
  
  /**
   * Internal implementation of token synchronization
   * @returns Promise resolving to true if changes were made
   */
  private static async _synchronizeTokensInternal(): Promise<boolean> {
    // Track if any changes were made
    let changesMade = false;
    
    const logger = getLogger();
    // Access global state for tracking
    const globalState = (window as any).__API_CLIENT_STATE;
    
    const now = Date.now();
    
    try {
      // Check for backup tokens in localStorage
      const authTokenBackup = localStorage.getItem('auth_token_backup');
      const refreshTokenBackup = localStorage.getItem('refresh_token_backup');
      
      // Parse all cookies into a more reliable format
      const cookiesMap = new Map<string, string>();
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name) cookiesMap.set(name, value);
      });
      
      // Define all possible cookie names for better compatibility
      const authCookieNames = ['auth_token', 'auth_token_access', 'access_token', 'accessToken'];
      const refreshCookieNames = ['refresh_token', 'refresh_token_access', 'refresh', 'refreshToken'];
      
      // Check each possible cookie name
      const authCookiesFound = authCookieNames.filter(name => cookiesMap.has(name));
      const refreshCookiesFound = refreshCookieNames.filter(name => cookiesMap.has(name));
      
      const hasAuthCookie = authCookiesFound.length > 0;
      const hasRefreshCookie = refreshCookiesFound.length > 0;
      
      // Also check the domain to detect potential cookie domain issues
      const domain = window.location.hostname;
      const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
      
      logger.debug('Token status during synchronization', {
        hasAuthCookie,
        hasRefreshCookie,
        authCookiesFound,
        refreshCookiesFound,
        hasAuthBackup: !!authTokenBackup,
        hasRefreshBackup: !!refreshTokenBackup,
        domain,
        isLocalhost
      });
      
      // Check if auth token backup is valid
      let isValidAuthBackup = false;
      let tokenExpiration = 0;
      if (authTokenBackup) {
        try {
          // Attempt to decode the token to verify it's valid JWT format
          const decoded = jwtDecode(authTokenBackup);
          isValidAuthBackup = !!(decoded && decoded.exp && decoded.sub);
          
          // Also check if it's expired
          if (isValidAuthBackup && decoded.exp) {
            tokenExpiration = decoded.exp * 1000;
            isValidAuthBackup = tokenExpiration > Date.now();
            
            // Log the token expiration status
            const expiresIn = Math.max(0, Math.floor((tokenExpiration - Date.now()) / 1000));
            logger.debug('Auth token backup expiration check', {
              isValidAuthBackup,
              expiresIn: `${expiresIn} seconds`,
              tokenExpiration: new Date(tokenExpiration).toISOString()
            });
          }
        } catch (decodeError) {
          logger.warn('Auth token backup is not a valid JWT token', { error: decodeError });
          isValidAuthBackup = false;
        }
      }
      
      // If we have backup but no cookie, set temporary client-side cookies
      // This will help until the next API call refreshes them properly
      if (authTokenBackup && !hasAuthCookie && isValidAuthBackup) {
        logger.debug('Setting auth_token cookie from backup');
        
        // Calculate appropriate expiration
        const maxAge = tokenExpiration > 0 
          ? Math.max(0, Math.floor((tokenExpiration - Date.now()) / 1000)) 
          : 3600; // Default to 1 hour if we can't determine expiration
        
        // Set secure flag for production environments
        const secure = !isLocalhost ? 'Secure;' : '';
        
        try {
          // Set multiple cookie variants for backward compatibility
          // Using try-catch to prevent failures from cookie restrictions
          document.cookie = `auth_token=${authTokenBackup};path=/;max-age=${maxAge};${secure}SameSite=Lax`;
          document.cookie = `auth_token_access=${authTokenBackup};path=/;max-age=${maxAge};${secure}SameSite=Lax`;
          document.cookie = `accessToken=${authTokenBackup};path=/;max-age=${maxAge};${secure}SameSite=Lax`;
          // Also set access_token for some implementations
          document.cookie = `access_token=${authTokenBackup};path=/;max-age=${maxAge};${secure}SameSite=Lax`;
          
          // Verify cookies were set
          const cookiesAfter = document.cookie;
          const hasAuthTokenAfter = cookiesAfter.includes('auth_token=');
          
          if (!hasAuthTokenAfter) {
            logger.warn('Failed to set auth_token cookie from backup - may be due to browser restrictions');
            // Still consider this a change attempt even if it failed
          }
          
          changesMade = true;
        } catch (cookieError) {
          logger.warn('Error setting cookies from backup:', { error: cookieError });
          // Continue despite cookie setting errors
          changesMade = true; // Still consider it a change attempt
        }
      }
      
      if (refreshTokenBackup && !hasRefreshCookie) {
        logger.debug('Setting refresh_token cookie from backup');
        
        // Set secure flag for production environments
        const secure = !isLocalhost ? 'Secure;' : '';
        
        try {
          // Set multiple cookie variants with a longer expiration time
          document.cookie = `refresh_token=${refreshTokenBackup};path=/;max-age=86400;${secure}SameSite=Lax`;
          document.cookie = `refresh_token_access=${refreshTokenBackup};path=/;max-age=86400;${secure}SameSite=Lax`;
          document.cookie = `refreshToken=${refreshTokenBackup};path=/;max-age=86400;${secure}SameSite=Lax`;
          document.cookie = `refresh=${refreshTokenBackup};path=/;max-age=86400;${secure}SameSite=Lax`;
          
          // Verify cookies were set
          const cookiesAfter = document.cookie;
          const hasRefreshTokenAfter = cookiesAfter.includes('refresh_token=') || 
                                    cookiesAfter.includes('refresh_token_access=');
          
          if (!hasRefreshTokenAfter) {
            logger.warn('Failed to set refresh token cookies from backup - may be due to browser restrictions');
          }
          
          changesMade = true;
        } catch (cookieError) {
          logger.warn('Error setting refresh token cookies:', { error: cookieError });
          // Continue despite cookie setting errors
          changesMade = true; // Still consider it a change attempt
        }
      }
      
      // Also synchronize in the reverse direction - if we have cookies but no backup
      if ((!authTokenBackup || !isValidAuthBackup) && hasAuthCookie) {
        // Check all possible auth cookie names
        let authToken = null;
        for (const cookieName of authCookieNames) {
          const value = cookiesMap.get(cookieName);
          if (value) {
            authToken = value;
            logger.debug(`Found auth token in ${cookieName} cookie`);
            break;
          }
        }
        
        if (authToken) {
          logger.debug('Setting localStorage backup from cookie');
          localStorage.setItem('auth_token_backup', authToken);
          localStorage.setItem('auth_token', authToken); // Legacy compatibility
          changesMade = true;
        }
      }
      
      if (!refreshTokenBackup && hasRefreshCookie) {
        // Check all possible refresh cookie names
        let refreshToken = null;
        for (const cookieName of refreshCookieNames) {
          const value = cookiesMap.get(cookieName);
          if (value) {
            refreshToken = value;
            logger.debug(`Found refresh token in ${cookieName} cookie`);
            break;
          }
        }
        
        if (refreshToken) {
          logger.debug('Setting refresh token backup from cookie');
          localStorage.setItem('refresh_token_backup', refreshToken);
          changesMade = true;
        }
      }
      
      // If auth_token in localStorage is undefined but we have a backup,
      // update it to maintain compatibility with any legacy code
      if (authTokenBackup && isValidAuthBackup && 
          (localStorage.getItem('auth_token') === 'undefined' || localStorage.getItem('auth_token') === null)) {
        logger.debug('Fixing undefined/missing auth_token in localStorage');
        localStorage.setItem('auth_token', authTokenBackup);
        changesMade = true;
      }
      
      // Record authentication timestamp if we have either cookie or backup token
      if ((hasAuthCookie || (authTokenBackup && isValidAuthBackup)) && !localStorage.getItem('auth_timestamp')) {
        localStorage.setItem('auth_timestamp', Date.now().toString());
        changesMade = true;
      }
      
      // Update the last sync timestamp
      localStorage.setItem('token_sync_timestamp', now.toString());
      
      // Update global state if available
      if (globalState && globalState.tokens) {
        globalState.tokens.lastSync = now;
        globalState.tokens.hasAuth = hasAuthCookie || (authTokenBackup && isValidAuthBackup);
        globalState.tokens.hasRefresh = hasRefreshCookie || !!refreshTokenBackup;
      }
      
      return changesMade;
    } catch (error) {
      logger.error('Error synchronizing tokens:', { error });
      return false; // Return false on error
    }
  }
  
  /**
   * Notifies the application about authentication state changes
   * Note: Actual tokens are managed by HTTP-only cookies set by the server
   * 
   * @param isAuthenticated - Whether the user is authenticated
   */
  private static isNotifying: boolean = false;
  private static notificationTimeout: any = null;
  private static lastEventTime = 0;
  private static readonly MIN_EVENT_INTERVAL = 300;
  private static readonly AUTH_COOLDOWN = 2000; // 2 second cooldown after auth changes

  public static getLastAuthChangeTime(): number {
    // Use global state if available for better reliability across module instances
    if (typeof window !== 'undefined' && (window as any).__AUTH_TOKEN_STATE) {
      return Math.max(this.lastAuthChange, (window as any).__AUTH_TOKEN_STATE.lastAuthChange || 0);
    }
    return this.lastAuthChange;
  }
  private static notificationDebounceTimer: any = null;
  private static pendingNotifications: Array<{isAuthenticated: boolean, timestamp: number}> = [];
  public static lastAuthChange = 0;
  
  // Initialize global state for tracking
  static {
    if (typeof window !== 'undefined') {
      // Create global state for the auth system if it doesn't exist yet
      if (!(window as any).__AUTH_TOKEN_STATE) {
        (window as any).__AUTH_TOKEN_STATE = {
          initialized: false,
          lastAuthChange: 0,
          synchronizing: false,
          lastSyncTime: 0
        };
      }
    }
  }
  
  /**
   * Notifies the application about authentication state changes
   * Uses debouncing and queuing to ensure all state changes are processed
   *
   * @param isAuthenticated - Whether the user is authenticated
   */
  static async notifyAuthChange(isAuthenticated: boolean): Promise<void> {
    const logger = getLogger();
    const now = Date.now();
    
    // Record the time of this auth change
    this.lastAuthChange = now;
    
    // Update global state if available
    if (typeof window !== 'undefined' && (window as any).__AUTH_TOKEN_STATE) {
      (window as any).__AUTH_TOKEN_STATE.lastAuthChange = now;
    }
    
    // Synchronize tokens on auth change to ensure consistency
    await this.synchronizeTokens(true);
    
    // Add to pending notifications queue
    this.pendingNotifications.push({isAuthenticated, timestamp: now});
    logger.debug('Added auth change to queue', {
      isAuthenticated,
      queueLength: this.pendingNotifications.length
    });

    // Skip if in cooldown period or too soon after previous event
    if (now - this.lastEventTime < this.MIN_EVENT_INTERVAL) {
      logger.debug('Auth change notification throttled - will process later');
      // Clear any existing debounce timer
      if (this.notificationDebounceTimer) {
        clearTimeout(this.notificationDebounceTimer);
      }
      
      // Set up a new debounce timer
      return new Promise(resolve => {
        this.notificationDebounceTimer = setTimeout(() => {
          logger.debug('Processing delayed auth change notification');
          this.processAuthChangeQueue().then(resolve);
        }, this.MIN_EVENT_INTERVAL + 50);
      });
    }
    
    // Clear any pending timers
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    if (this.notificationDebounceTimer) {
      clearTimeout(this.notificationDebounceTimer);
    }
    
    // Process the queue immediately
    return this.processAuthChangeQueue();
  }
  
  /**
   * Process the authentication change notification queue
   * @returns Promise that resolves when processing is complete
   */
  private static async processAuthChangeQueue(): Promise<void> {
    const logger = getLogger();
    
    // If no notifications, do nothing
    if (this.pendingNotifications.length === 0) {
      return;
    }
    
    // Get the most recent notification from queue
    const latestNotification = this.pendingNotifications.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );
    
    // Clear queue
    this.pendingNotifications = [];
    
    // Skip if already notifying
    if (this.isNotifying) {
      logger.debug('Auth change notification delayed - already notifying');
      return new Promise(resolve => {
        this.notificationTimeout = setTimeout(() => {
          this.isNotifying = false;
          this.processAuthChangeQueue().then(resolve);
        }, 300);
      });
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
  private static refreshPromise: Promise<boolean> | null = null;
  private static refreshCallbacks: Array<(success: boolean) => void> = [];
  private static lastRefreshAttempt = 0;
  private static failedRefreshCount = 0;
  private static readonly REFRESH_COOLDOWN = 3000; // 3 seconds between refresh attempts
  private static readonly MAX_FAILED_REFRESH = 3; // Maximum consecutive failed refreshes

  /**
   * Refresh the access token
   * Uses a centralized approach to prevent parallel token refresh attempts
   * @returns Promise resolving to true if refresh was successful
   */
  static async refreshAccessToken(): Promise<boolean> {
    const logger = getLogger();
    
    try {
      // Access global state if available
      const globalState = typeof window !== 'undefined' ? (window as any).__API_CLIENT_STATE : null;
      
      // Prevent multiple refresh attempts at the same time
      if (this.isRefreshing) {
        logger.debug('Already refreshing token, returning existing promise');
        
        if (this.refreshPromise) {
          return this.refreshPromise;
        }
        
        // Wait for the existing refresh operation to complete
        return await new Promise((resolve) => {
          this.refreshCallbacks.push((success: boolean) => resolve(success));
        });
      }
      
      // Set refreshing flag to prevent multiple simultaneous requests
      this.isRefreshing = true;
      
      // Check if the refresh token request was made recently (prevent rapid retries)
      const now = Date.now();
      if (this.lastRefreshAttempt && (now - this.lastRefreshAttempt) < this.REFRESH_COOLDOWN) {
        logger.debug('Token refresh attempted too recently, skipping');
        this.isRefreshing = false;
        return false;
      }
      
      this.lastRefreshAttempt = now;
      logger.debug('Attempting to refresh token');
      
      // Update global state if available
      if (globalState) {
        globalState.tokenRefreshInProgress = true;
        globalState.lastTokenRefreshAttempt = now;
      }
      
      // First ensure tokens are synchronized to avoid unnecessary refresh failures
      this.synchronizeTokens(true);
      
      // Create and store the refresh promise
      this.refreshPromise = this._refreshAccessTokenImpl().finally(() => {
        // Clear flags and reset callbacks after completion
        setTimeout(() => {
          this.isRefreshing = false;
          this.refreshPromise = null;
          
          // Update global state
          if (globalState) {
            globalState.tokenRefreshInProgress = false;
          }
        }, 500);
      });
      
      // Execute callbacks when the promise resolves
      this.refreshPromise.then(success => {
        const callbacks = [...this.refreshCallbacks];
        this.refreshCallbacks = [];
        callbacks.forEach(callback => callback(success));
        
        // Update global state with result
        if (globalState) {
          globalState.lastTokenRefreshResult = success;
          globalState.lastTokenRefreshTime = Date.now();
        }
      });
      
      return this.refreshPromise;
    } catch (error) {
      logger.error('Token refresh outer error:', { error });
      this.isRefreshing = false;
      this.refreshPromise = null;
      
      // Update global state on error
      if (typeof window !== 'undefined' && (window as any).__API_CLIENT_STATE) {
        (window as any).__API_CLIENT_STATE.tokenRefreshInProgress = false;
        (window as any).__API_CLIENT_STATE.lastTokenRefreshResult = false;
        (window as any).__API_CLIENT_STATE.lastTokenRefreshError = error instanceof Error ? error.message : String(error);
      }
      
      return false;
    }
  }
  
  /**
   * Implementation of the token refresh logic
   * Separated to allow for cleaner promise handling
   * @returns Promise resolving to true if token refresh was successful
   */
  private static async _refreshAccessTokenImpl(): Promise<boolean> {
    const logger = getLogger();
    
    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // Check if we have a refresh token in cookie or storage
      const refreshTokenCookieExists = await this.checkForRefreshToken();
      
      if (!refreshTokenCookieExists) {
        logger.warn('No refresh token available, refresh not possible');
        return false;
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
          
          // Get refresh token from backup if available
          const refreshTokenBackup = localStorage.getItem('refresh_token_backup');
          
          // Body that can be sent with refresh request
          const requestBody = refreshTokenBackup ? 
            JSON.stringify({ refreshToken: refreshTokenBackup }) : 
            undefined;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          try {
            const response = await fetch(refreshUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Retry-Count': currentRetry.toString()
              },
              credentials: 'include',
              signal: controller.signal,
              body: requestBody
            });
            
            clearTimeout(timeoutId);
            
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
                  
                  // Extract tokens with better error handling and fallbacks
                  let accessToken = null;
                  let refreshToken = null;
                  
                  if (data.data && data.data.accessToken) {
                    accessToken = data.data.accessToken;
                    refreshToken = data.data.refreshToken;
                  } else if (data.accessToken) {
                    accessToken = data.accessToken;
                    refreshToken = data.refreshToken;
                  } else if (data.token) {
                    // Legacy format support
                    accessToken = data.token;
                  }
                  
                  // If we got an access token, save it and refresh state
                  if (accessToken) {
                    logger.debug('Saving token backup from refresh response');
                    localStorage.setItem('auth_token_backup', accessToken);
                    localStorage.setItem('auth_token', accessToken); // Legacy compatibility
                    
                    if (refreshToken) {
                      localStorage.setItem('refresh_token_backup', refreshToken);
                    }
                    
                    // Synchronize one more time to ensure cookies are properly set
                    this.synchronizeTokens(true);
                    
                    // Record authentication timestamp
                    localStorage.setItem('auth_timestamp', Date.now().toString());
                    
                    // Reset failed count on success
                    this.failedRefreshCount = 0;
                    
                    // Verify the tokens were saved in localStorage
                    const savedAccessToken = localStorage.getItem('auth_token_backup');
                    if (!savedAccessToken) {
                      logger.warn('Failed to save access token in localStorage');
                    }
                    
                    // Check if the cookies were properly set
                    const cookieCheck = document.cookie.includes('auth_token=');
                    if (!cookieCheck) {
                      logger.warn('Auth token cookie not set after refresh, using API calls will likely fail');
                      
                      // Attempt to set the cookie manually as a last resort
                      document.cookie = `auth_token=${accessToken};path=/;max-age=3600;SameSite=Lax`;
                    }
                    
                    // Dispatch event for successful refresh
                    this.notifyAuthChange(true);
                    return true;
                  } else {
                    // Successful response but no token, log a warning
                    logger.warn('Token refresh response success but no token returned');
                  }
                } else {
                  logger.warn('Token refresh response not successful:', { data });
                }
                
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
                  
                  // Still synchronize tokens to capture any cookies
                  this.synchronizeTokens(true);
                  
                  // Update auth state with delay
                  setTimeout(() => {
                    this.notifyAuthChange(true);
                  }, 50);
                  
                  // Reset failed count on success
                  this.failedRefreshCount = 0;
                  
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
              // Handle error responses
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
                
                // Increment failed count for consecutive tracking
                this.failedRefreshCount++;
                
                // Redirect to login page if token refresh fails completely and too many failures
                if (this.failedRefreshCount >= this.MAX_FAILED_REFRESH && typeof window !== 'undefined') {
                  logger.debug(`Too many failed token refresh attempts (${this.failedRefreshCount}), redirecting to login`);
                  
                  // Add a slight delay to avoid immediate redirect
                  setTimeout(() => {
                    // Clear failed count after redirecting
                    this.failedRefreshCount = 0;
                    
                    // Redirect with current path as return URL
                    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
                  }, 300);
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
            clearTimeout(timeoutId);
            
            const abortError = error as Error;
            if (abortError && abortError.name === 'AbortError') {
              logger.warn('Token refresh request timed out');
            } else {
              throw error; // Re-throw non-abort errors
            }
            
            if (currentRetry === maxRetries) break;
            currentRetry++;
            const delay = Math.pow(2, currentRetry) * 400; // Longer delay after timeout
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
      // Increment failed refresh count for potential redirect on subsequent attempts
      this.failedRefreshCount++;
      logger.debug(`Token refresh failed after all attempts. Failed count: ${this.failedRefreshCount}`);
      
      // If we've failed too many times, redirect to login
      if (this.failedRefreshCount >= this.MAX_FAILED_REFRESH && typeof window !== 'undefined') {
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
      logger.error('Token refresh implementation error:', { error });
      
      // Increment failed count
      this.failedRefreshCount++;
      
      // After multiple consecutive failures, redirect to login
      if (this.failedRefreshCount >= this.MAX_FAILED_REFRESH && typeof window !== 'undefined') {
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
   * Check if refresh token exists in cookie or localStorage backup
   * Creates a cookie from backup if needed
   * @returns True if refresh token is available
   */
  private static async checkForRefreshToken(): Promise<boolean> {
    const logger = getLogger();
    
    if (typeof document === 'undefined') {
      return false;
    }
    
    // Look for refresh token cookie - more comprehensive check
    const refreshCookieNames = ['refresh_token', 'refresh_token_access', 'refreshToken', 'refresh'];
    const cookieMap = new Map<string, string>();
    
    // Parse cookies more reliably
    document.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim(); // Handle values that might contain =
        if (name && value) {
          cookieMap.set(name, value);
        }
      }
    });
    
    // Check if any refresh token cookie exists
    const refreshCookie = refreshCookieNames.find(name => cookieMap.has(name));
    
    if (refreshCookie) {
      logger.debug(`Found refresh token in cookie: ${refreshCookie}`);
      return true;
    }
    
    // If no cookie, check localStorage backup
    const refreshTokenBackup = localStorage.getItem('refresh_token_backup');
    if (refreshTokenBackup) {
      logger.debug('Creating refresh_token cookie from backup');
      
      // Ensure proper cookie format with attributes
      const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
      document.cookie = `refresh_token=${refreshTokenBackup};Path=/;${secure}Max-Age=86400;SameSite=Lax`;
      
      // Verify cookie was successfully set
      const cookieSet = document.cookie.split(';').some(c => 
        c.trim().startsWith('refresh_token='));
      
      logger.debug('Refresh token cookie creation result:', { success: cookieSet });
      return cookieSet;
    }
    
    logger.warn('No refresh token found in cookies or localStorage');
    return false;
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