'use client';

/**
 * AuthService.ts
 *
 * Core authentication service that properly handles token management and authentication state.
 */

import { jwtDecode } from 'jwt-decode';
import { getLogger } from '@/core/logging';
import { EventEmitter } from './EventEmitter';
import { IAuthService } from '@/domain/services/IAuthService';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto,
  RegisterDto
} from '@/domain/dtos/AuthDtos';
import { UserDto } from '@/domain/dtos/UserDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { ApiClient } from '@/core/api/ApiClient';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { AuthError, TokenError } from '@/features/auth/utils/AuthErrorHandler';

// Get logger
const logger = getLogger();

// Constants
const MAX_INITIALIZATION_TIME_MS = 30000; // 30 seconds maximum for initialization to allow for network latency

// Singleton instance key
const AUTH_SERVICE_GLOBAL_KEY = '__AUTH_SERVICE_INSTANCE__';

// Types
export interface TokenInfo {
  token: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
  remainingTimeMs?: number;
}

export interface UserInfo {
  id: number;
  name?: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  profilePicture?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DecodedToken {
  sub: string | number;
  exp: number;
  iat: number;
  name?: string;
  email?: string;
  role: UserRole;
}

export interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: UserInfo | null;
  initializationTime: number;
}

export interface AuthInitOptions {
  force?: boolean;
  skipTokenRefresh?: boolean;
  cleanupLegacy?: boolean;
}

export interface TokenValidationResult {
  valid: boolean;
  errors: string[];
  user?: UserInfo;
  expiresAt?: Date;
  remainingTimeMs?: number;
}

export interface RefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: Date;
  user?: UserInfo;
  error?: string;
}

/**
 * AuthServiceClass - Core authentication service implementation
 */
export class AuthServiceClass implements IAuthService, IRefreshTokenService {
  // State
  private initialized = false;
  private initializing = false;
  private initializationPromise: Promise<boolean> | null = null;
  private authState: AuthState = {
    isAuthenticated: false,
    isInitialized: false,
    user: null,
    initializationTime: 0
  };
  
  // Token management
  private refreshTimeoutId: NodeJS.Timeout | null = null;
  private refreshInProgress = false;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  
  // Instance tracking
  private instanceId: string;
  private initId = '';
  private lastInitTime = 0;
  
  // Event management
  private events: EventEmitter;
  
  constructor() {
    this.events = new EventEmitter();
    this.instanceId = crypto.randomUUID().substring(0, 8);
    
    if (typeof window !== 'undefined') {
      // Clean up any existing event listeners to prevent duplicates
      window.removeEventListener('auth-state-change', this.handleExternalAuthEvent);
      window.removeEventListener('token-refreshed', this.handleExternalTokenEvent);
      
      // Add new event listeners
      window.addEventListener('auth-state-change', this.handleExternalAuthEvent);
      window.addEventListener('token-refreshed', this.handleExternalTokenEvent);
      
      // Register this instance globally
      this.registerGlobalInstance();
    }
  }
  
  /**
   * Gets the instance ID for the current AuthService instance
   */
  public getInstanceId(): string {
    return this.instanceId;
  }
  
  /**
   * Gets the refresh timeout ID for cleanup
   */
  public getRefreshTimeoutId(): NodeJS.Timeout | null {
    return this.refreshTimeoutId;
  }
  
  /**
   * Register this instance globally, cleaning up any existing instance
   */
  private registerGlobalInstance(): void {
    if (typeof window === 'undefined') return;
    
    // Check if we need to clean up an existing instance
    const existingInstance = (window as any)[AUTH_SERVICE_GLOBAL_KEY] as AuthServiceClass;
    if (existingInstance && existingInstance !== this) {
      try {
        // Clean up the old instance
        const prevTimeoutId = existingInstance.getRefreshTimeoutId();
        if (prevTimeoutId !== null) {
          clearTimeout(prevTimeoutId);
        }
        
        // Remove event listeners
        try {
          window.removeEventListener('auth-state-change', existingInstance.handleExternalAuthEvent);
          window.removeEventListener('token-refreshed', existingInstance.handleExternalTokenEvent);
        } catch (e) {
          // Ignore errors
        }
        
        logger.debug('Cleaned up existing AuthService instance', {
          oldInstanceId: existingInstance.getInstanceId(),
          newInstanceId: this.instanceId
        });
      } catch (e: unknown) {
        logger.warn('Error while cleaning up existing AuthService instance', e as Error);
      }
    }
    
    // Register this instance globally
    (window as any)[AUTH_SERVICE_GLOBAL_KEY] = this;
    logger.debug('Registered AuthService instance globally', { instanceId: this.instanceId });
  }
  
  /**
   * Initialize the auth service with proper mutex locking to prevent multiple concurrent initializations
   */
  public async initialize(options: AuthInitOptions = {}): Promise<boolean> {
    // Generate unique initialization ID
    const thisInitId = `${this.instanceId}-${Math.random().toString(36).substring(2, 9)}`;
    this.initId = thisInitId;
    
    // Add debounce for rapid initializations
    if (!options.force && this.lastInitTime > 0 && Date.now() - this.lastInitTime < 1000) {
      logger.debug('Auth initialization debounced (too frequent)', { 
        initId: thisInitId,
        msSinceLastInit: Date.now() - this.lastInitTime
      });
      return this.initialized;
    }
    
    // Check if already initialized and not forced
    if (this.initialized && !options.force) {
      logger.debug('Auth already initialized, skipping', { initId: thisInitId });
      return true;
    }
    
    // Import the SingletonRegistry for mutex locking
    // Using dynamic import to avoid circular dependencies
    const { default: SingletonRegistry } = await import('./AuthServiceSingleton');
    
    // Try to acquire initialization lock with proper timeout
    let releaseLock: (() => void) | null = null;
    
    try {
      // First check if we can acquire the global initialization lock
      releaseLock = await SingletonRegistry.acquireInitLock('auth_service_init', MAX_INITIALIZATION_TIME_MS);
      
      // Lock acquired, we can proceed with initialization
      this.initializing = true;
      
      // Create a timeout promise to ensure initialization doesn't hang
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Auth initialization timed out after ${MAX_INITIALIZATION_TIME_MS}ms`));
        }, MAX_INITIALIZATION_TIME_MS);
      });
      
      // Create the initialization promise
      const initProcess = this.performInitialization(options, thisInitId);
      
      // Store the promise for other requests to use
      this.initializationPromise = initProcess;
      
      // Race against the timeout
      const result = await Promise.race([initProcess, timeoutPromise]);
      
      // Update state based on result
      this.initialized = result;
      
      // Broadcast initialization completion
      if (result && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-initialized', { 
          detail: { timestamp: Date.now(), success: true, instanceId: this.instanceId } 
        }));
      }
      
      return result;
    } catch (error) {
      logger.error('Auth initialization failed', { 
        initId: thisInitId, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return false;
    } finally {
      // Always clean up state
      this.initializing = false;
      this.initializationPromise = null;
      this.lastInitTime = Date.now();
      
      // Always release the lock if we acquired it
      if (releaseLock) {
        releaseLock();
      }
    }
  }
  
  /**
   * Core initialization logic with proper error handling
   */
  private async performInitialization(options: AuthInitOptions = {}, initId: string): Promise<boolean> {
    try {
      logger.info('AuthService: Initializing with options', { 
        initId, 
        options,
        instanceId: this.instanceId,
        isHmr: typeof module !== 'undefined' && !!(module as any).hot
      });
      
      // Clean up legacy storage if needed
      if (options.cleanupLegacy && typeof window !== 'undefined') {
        this.clearLegacyTokenStorage();
        logger.debug('Cleared legacy storage', { initId });
      }
      
      // Reset auth state by default
      this.updateAuthState({
        isAuthenticated: false,
        user: null
      });
      
      // Attempt to get token
      const token = await this.getToken();
      
      if (!token) {
        logger.info('No authentication token available', { initId });
      } else {
        logger.debug('Token retrieved, length: ' + token.length, { initId });
        
        try {
          // Verify token format
          if (typeof token !== 'string' || !token.includes('.') || token.split('.').length !== 3) {
            throw new Error('Invalid token format during initialization');
          }
          
          // Decode user from token
          const user = this.decodeUserFromToken(token);
          if (!user) {
            throw new Error('Failed to decode user from token');
          }
          
          logger.debug('Successfully decoded user from token', { 
            initId,
            userId: user.id,
            role: user.role
          });
          
          // Basic token validation - just check expiration
          try {
            const decoded = jwtDecode<{ exp: number }>(token);
            const expiresAt = decoded.exp * 1000;
            const isExpired = Date.now() >= expiresAt;
            
            if (isExpired) {
              logger.warn('Token is expired', { initId });
              // Keep auth state as unauthenticated
              this.updateAuthState({
                isAuthenticated: false,
                user: null
              });
            } else {
              // Update auth state with valid token
              this.updateAuthState({
                isAuthenticated: true,
                user: user
              });
              
              logger.info('Successfully authenticated user', { 
                initId, 
                userId: user.id, 
                role: user.role
              });
              
              // Setup refresh timer for valid tokens
              if (!options.skipTokenRefresh) {
                try {
                  await this.setupRefreshTimer();
                } catch (refreshError) {
                  logger.error('Failed to setup refresh timer', {
                    error: refreshError instanceof Error ? refreshError.message : String(refreshError),
                    initId
                  });
                  // Continue even if refresh timer setup fails
                }
              }
            }
          } catch (tokenError) {
            logger.warn('Token validation error', {
              error: tokenError instanceof Error ? tokenError.message : String(tokenError),
              initId
            });
            // Keep auth state as unauthenticated
            this.updateAuthState({
              isAuthenticated: false,
              user: null
            });
          }
        } catch (tokenError) {
          logger.error('Token processing error', {
            error: tokenError instanceof Error ? tokenError.message : String(tokenError),
            stack: tokenError instanceof Error ? tokenError.stack : undefined,
            initId
          });
          
          // Keep auth state as unauthenticated
          this.updateAuthState({
            isAuthenticated: false,
            user: null
          });
        }
      }
      
      // Mark as initialized and update state
      this.initialized = true;
      this.updateAuthState({
        isInitialized: true,
        initializationTime: Date.now()
      });
      
      logger.info('AuthService: Initialized successfully', { 
        initId, 
        isAuthenticated: this.authState.isAuthenticated,
        hasUser: !!this.authState.user
      });
      
      return true;
    } catch (error) {
      logger.error('AuthService: Initialization failed', { 
        initId, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Ensure initialized state is set to false
      this.initialized = false;
      
      // Update auth state
      this.updateAuthState({
        isInitialized: false,
        isAuthenticated: false,
        user: null
      });
      
      return false;
    }
  }
  
  /**
   * Check if auth service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get current auth state
   */
  public getAuthState(): AuthState {
    return { ...this.authState };
  }
  
  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    return this.authState.isAuthenticated;
  }
  
  /**
   * Get current user information
   */
  public getUser(): UserInfo | null {
    return this.authState.user;
  }

    /**
   * Get user service for accessing user data
   */
  public getUserService(): any {
    // In the client context, we don't have direct access to the UserService
    // So we provide a limited implementation that forwards to the API
    return {
      findById: async (id: number) => {
        if (!id) return null;
        
        try {
          const response = await ApiClient.get(`/api/users/${id}`);
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        } catch (error) {
          logger.error('Error in getUserService.findById:', {
            error: error instanceof Error ? error.message : String(error),
            userId: id
          });
          return null;
        }
      },
      // Add any other user service methods needed by the authentication flow
      getCurrentUser: async () => {
        return this.getCurrentUser();
      }
    };
  }
  
  /**
   * Get current user information as a Promise
   */
  public async getUserAsync(): Promise<UserInfo | null> {
    return this.authState.user;
  }
  
  /**
   * Subscribe to auth state changes
   */
  public onAuthStateChange(callback: (state: AuthState) => void): () => void {
    return this.events.on('auth_state_change', callback);
  }
  
  /**
   * Subscribe to token expiring event
   */
  public onTokenExpiring(callback: () => void): () => void {
    return this.events.on('token_expiring', callback);
  }
  
  /**
   * Register token refreshed callback
   */
  public onTokenRefreshed(callback: () => void): () => void {
    return this.events.on('token_refreshed', callback);
  }
  
  /**
   * Get the current access token
   */
  public async getToken(): Promise<string | null> {
    // Check in-memory token first
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    
    // If no valid token in memory, try to get from storage
    if (typeof window !== 'undefined') {
      try {
        // First try to fetch a fresh token from API - most reliable method
        const response = await fetch('/api/auth/token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Extract token from response
          const token = data.data?.token || data.token;
          
          if (token) {
            try {
              // Check expiration
              const decoded = jwtDecode<{ exp: number }>(token);
              const expiresAt = decoded.exp * 1000;
              
              if (Date.now() < expiresAt) {
                // Cache token in memory
                this.token = token;
                this.tokenExpiresAt = expiresAt;
                logger.debug('Using token from API response');
                return token;
              }
            } catch (e) {
              // Invalid token from API - try cookies next
              logger.warn('Invalid token from API response', {
                error: e instanceof Error ? e.message : String(e)
              });
            }
          }
        }
        
        // If API didn't provide a valid token, try to get from cookies
        const cookies = document.cookie.split(';');
        
        // First try js_token which is specifically set for JavaScript access
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'js_token') {
            // js_token is intentionally set as non-HttpOnly for JavaScript access
            const token = decodeURIComponent(value);
            
            // Validate token format
            if (token && token.includes('.') && token.split('.').length === 3) {
              try {
                // Check expiration
                const decoded = jwtDecode<{ exp: number }>(token);
                const expiresAt = decoded.exp * 1000;
                
                if (Date.now() < expiresAt) {
                  // Cache token in memory
                  this.token = token;
                  this.tokenExpiresAt = expiresAt;
                  logger.debug('Using token from js_token cookie');
                  return token;
                }
              } catch (e) {
                // Invalid token, try other sources
                logger.warn('Invalid token in js_token cookie', {
                  error: e instanceof Error ? e.message : String(e)
                });
              }
            }
          }
        }
        
        // Then try auth_token or access_token
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth_token' || name === 'access_token') {
            const token = decodeURIComponent(value);
            
            // Validate token format
            if (token && token.includes('.') && token.split('.').length === 3) {
              try {
                // Check expiration
                const decoded = jwtDecode<{ exp: number }>(token);
                const expiresAt = decoded.exp * 1000;
                
                if (Date.now() < expiresAt) {
                  // Cache token in memory
                  this.token = token;
                  this.tokenExpiresAt = expiresAt;
                  logger.debug(`Using token from ${name} cookie`);
                  return token;
                }
              } catch (e) {
                // Invalid token, continue to next source
                logger.warn(`Invalid token in ${name} cookie`, {
                  error: e instanceof Error ? e.message : String(e)
                });
              }
            }
          }
        }
        
        // Log that no valid token was found anywhere
        logger.warn('No valid token found in API response or cookies');
      } catch (error) {
        logger.error('Error getting token', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
    
    return null;
  }
  
  /**
   * Validate a token
   */
  public async validateToken(token?: string): Promise<boolean> {
    try {
      // If no token provided, use the current token
      const tokenToValidate = token || await this.getToken();
      
      // If no token available, validation fails
      if (!tokenToValidate) {
        logger.debug('No token available for validation');
        return false;
      }
      
      // Check token format
      if (!tokenToValidate.includes('.') || tokenToValidate.split('.').length !== 3) {
        logger.debug('Invalid token format');
        return false;
      }
      
      // Decode token to check expiration
      try {
        const decoded = jwtDecode<{ exp: number }>(tokenToValidate);
        const expiresAt = decoded.exp * 1000;
        
        if (Date.now() >= expiresAt) {
          logger.debug('Token has expired', {
            expiresAt: new Date(expiresAt).toISOString(),
            now: new Date().toISOString()
          });
          return false;
        }
        
        // For client-side validation, a properly formatted, non-expired token is considered valid
        // This is a simpler approach that avoids making unnecessary API calls
        return true;
      } catch (decodeError) {
        logger.error('Error decoding token during validation', {
          error: decodeError instanceof Error ? decodeError.message : String(decodeError)
        });
        return false;
      }
    } catch (error) {
      logger.error('Error validating token', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
  
  /**
   * Get token information including expiration
   */
  public async getTokenInfo(): Promise<TokenInfo> {
    try {
      // Get token first to ensure it's valid and cached
      const token = await this.getToken();
      
      if (!token) {
        return {
          token: null,
          expiresAt: null,
          isExpired: true
        };
      }
      
      // Token exists and is valid
      const expiresAt = new Date(this.tokenExpiresAt);
      const now = Date.now();
      const isExpired = now >= this.tokenExpiresAt;
      const remainingTimeMs = isExpired ? 0 : this.tokenExpiresAt - now;
      
      return {
        token,
        expiresAt,
        isExpired,
        remainingTimeMs
      };
    } catch (error) {
      logger.error('Error in getTokenInfo', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        token: null,
        expiresAt: null,
        isExpired: true
      };
    }
  }
  
  /**
   * Sets up a timer to refresh the token before it expires
   */
  public async setupRefreshTimer(): Promise<void> {
    // Clear any existing refresh timer
    if (this.refreshTimeoutId !== null) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    try {
      // Get token info
      const tokenInfo = await this.getTokenInfo();
      
      // If token is missing or already expired, don't set a timer
      if (!tokenInfo.token || !tokenInfo.expiresAt) {
        logger.debug('No valid token available, cannot schedule refresh');
        return;
      }
      
      const expiresAt = tokenInfo.expiresAt.getTime();
      const now = Date.now();
      
      // Calculate when to refresh - 180 seconds (3 minutes) before expiry for more safety margin
      const refreshTime = Math.max(expiresAt - now - 180000, 0); // Refresh 3 minutes before expiry
      
      // If token is already expired or about to expire, refresh immediately
      if (refreshTime < 10000) { // Less than 10 seconds remaining
        logger.debug('Token is about to expire, refreshing immediately');
        this.events.emit('token_expiring', {});
        this.refreshToken().catch(error => {
          logger.error('Immediate token refresh failed', {
            error: error instanceof Error ? error.message : String(error)
          });
        });
        return;
      }
      
      logger.debug('Scheduling token refresh', {
        tokenExpiresAt: tokenInfo.expiresAt.toISOString(),
        refreshIn: Math.ceil(refreshTime / 1000) + ' seconds',
        instanceId: this.instanceId
      });
      
      // Set up refresh timer
      this.refreshTimeoutId = setTimeout(() => {
        logger.debug('Token refresh timer triggered');
        
        // Emit event
        this.events.emit('token_expiring', {
          expiresAt,
          instanceId: this.instanceId
        });
        
        // Refresh token with retry mechanism
        const performRefresh = async (retryCount = 0, maxRetries = 3) => {
          try {
            const result = await this.refreshToken();
            if (!result.success) {
              throw new Error(result.message || 'Token refresh failed');
            }
            logger.debug('Token refresh succeeded');
          } catch (error) {
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
              logger.warn(`Token refresh failed, retrying in ${delay}ms`, {
                error: error instanceof Error ? error.message : String(error),
                retryCount: retryCount + 1,
                maxRetries
              });
              
              setTimeout(() => performRefresh(retryCount + 1, maxRetries), delay);
            } else {
              logger.error('Token refresh failed after retries', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                retries: retryCount
              });
              
              // Handle authentication failure by redirecting to login
              if (typeof window !== 'undefined') {
                // Only redirect if not on auth page already
                const currentPath = window.location.pathname;
                if (!currentPath.startsWith('/auth/')) {
                  window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}&reason=session_expired`;
                }
              }
            }
          }
        };
        
        // Start the refresh process with retries
        performRefresh();
        
        // Clear reference
        this.refreshTimeoutId = null;
      }, refreshTime);
    } catch (error) {
      logger.error('Error setting up refresh timer', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        instanceId: this.instanceId
      });
    }
  }
  
  /**
   * Parse user information from token
   */
  private decodeUserFromToken(token: string): UserInfo | null {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Validate token expiration
      const expiresAt = new Date(decoded.exp * 1000);
      if (Date.now() >= expiresAt.getTime()) {
        logger.debug('Token is expired in decodeUserFromToken');
        return null;
      }
      
      // Extract user ID from token subject claim
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else {
        userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
          logger.warn('Invalid user ID in token subject claim');
          return null;
        }
      }
      
      // Return user info
      return {
        id: userId,
        name: decoded.name,
        email: decoded.email || '',
        role: decoded.role,
        createdAt: new Date(decoded.iat * 1000),
        updatedAt: new Date(decoded.iat * 1000),
      };
    } catch (error) {
      logger.error('Error decoding token', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }
  
  /**
   * Convert UserInfo to UserDto
   */
  private convertToUserDto(userInfo: UserInfo | null): UserDto | undefined {
    if (!userInfo) return undefined;
    
    return {
      id: userInfo.id,
      name: userInfo.name || '',
      email: userInfo.email,
      role: userInfo.role,
      status: userInfo.status || UserStatus.ACTIVE,
      createdAt: userInfo.createdAt,
      updatedAt: userInfo.updatedAt,
      phone: userInfo.phone,
      profilePicture: userInfo.profilePicture
    };
  }
  
  /**
   * Update auth state and emit events
   */
  public updateAuthState(updates: Partial<AuthState>): void {
    const prevState = { ...this.authState };
    
    // Update state
    this.authState = {
      ...this.authState,
      ...updates
    };
    
    // Detect meaningful changes
    const authChanged = prevState.isAuthenticated !== this.authState.isAuthenticated;
    const userChanged = JSON.stringify(prevState.user) !== JSON.stringify(this.authState.user);
    const initChanged = prevState.isInitialized !== this.authState.isInitialized;
    
    // Emit events if needed
    if (authChanged || userChanged || initChanged) {
      this.events.emit('auth_state_change', this.authState);
      
      // Also dispatch browser event for coordination
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-state-change', { 
          detail: { 
            isAuthenticated: this.authState.isAuthenticated,
            userId: this.authState.user?.id,
            timestamp: Date.now(),
            sourceInstanceId: this.instanceId
          } 
        }));
      }
    }
  }
  
  /**
   * Refresh the token with improved reliability and diagnostics
   */
  public async refreshToken(refreshTokenDto?: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    // Generate a unique request ID to track this operation through logs
    const requestId = crypto.randomUUID().substring(0, 8);
    logger.debug('Token refresh requested', { requestId });
    
    // Prevent concurrent refresh operations
    if (this.refreshInProgress) {
      logger.debug('Token refresh already in progress', { requestId });
      return {
        success: false,
        message: 'Refresh already in progress',
        data: undefined
      };
    }
    
    this.refreshInProgress = true;
    
    try {
      // Check current cookies before cleaning up
      if (typeof document !== 'undefined') {
        const cookieString = document.cookie;
        logger.debug('Cookies before refresh', {
          requestId,
          cookieString
        });
      }
      
      // First clear existing tokens to ensure we get fresh ones
      // This ensures we don't have stale token state
      this.clearTokens();
      
      // Allow a moment for any in-flight token clearing to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call refresh endpoint with proper headers for tracking and cache prevention
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Request-ID': requestId,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      // Log response status for debugging
      logger.debug('Refresh endpoint response received', {
        requestId,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      // Handle non-success response with better error extraction
      if (!response.ok) {
        let errorMessage = 'Token refresh failed';
        let responseData: any = null;
        
        try {
          // Extract full response for better diagnostics
          const responseText = await response.text();
          
          try {
            if (responseText) {
              responseData = JSON.parse(responseText);
              if (responseData?.message) {
                errorMessage = responseData.message;
              } else if (responseData?.error) {
                errorMessage = typeof responseData.error === 'string' ? 
                  responseData.error : 
                  responseData.error.message || errorMessage;
              }
            }
          } catch (parseError) {
            // Non-JSON response, use text directly if it exists
            if (responseText && responseText.length < 100) {
              errorMessage = responseText;
            }
          }
        } catch (e) {
          // Use default error message if response processing fails
          logger.warn('Failed to process error response', {
            error: e instanceof Error ? e.message : String(e),
            requestId
          });
        }
        
        logger.warn('Token refresh failed', { 
          message: errorMessage,
          status: response.status,
          requestId
        });
        
        // Clear auth state
        this.updateAuthState({
          isAuthenticated: false,
          user: null
        });
        
        // Only redirect to login if explicitly requested or for authentication failures
        // This prevents unwanted redirects for temporary server issues
        if (response.status === 401 && typeof window !== 'undefined' && 
            (errorMessage.includes('expired') || errorMessage.includes('revoked') || 
             errorMessage.includes('invalid') || errorMessage.includes('unauthorized'))) {
          
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/auth/')) {
            logger.warn('Authentication required, redirecting to login', { requestId });
            
            // Add a small delay to ensure logs are processed
            setTimeout(() => {
              window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}&reason=session_expired`;
            }, 100);
          }
        }
        
        return {
          success: false,
          message: errorMessage,
          data: undefined
        };
      }
      
      // Check cookies after successful refresh
      if (typeof document !== 'undefined') {
        const cookieString = document.cookie;
        logger.debug('Cookies after refresh', {
          requestId,
          cookieString
        });
      }
      
      // Wait a moment to ensure cookies are properly set
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Fetch the new token with proper headers
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Request-ID': requestId,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      logger.debug('Token fetch response received', {
        requestId,
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        url: tokenResponse.url
      });
      
      if (!tokenResponse.ok) {
        logger.error('Failed to get token after successful refresh', {
          requestId,
          status: tokenResponse.status,
          statusText: tokenResponse.statusText
        });
        
        // Clear auth state
        this.updateAuthState({
          isAuthenticated: false,
          user: null
        });
        
        return {
          success: false,
          message: `Failed to get token after refresh: ${tokenResponse.status} ${tokenResponse.statusText}`,
          data: undefined
        };
      }
      
      // Parse token response with better error handling
      let tokenData;
      try {
        const responseText = await tokenResponse.text();
        if (!responseText) {
          throw new Error('Empty response from token endpoint');
        }
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Error parsing token response', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          requestId
        });
        
        // Clear auth state
        this.updateAuthState({
          isAuthenticated: false,
          user: null
        });
        
        return {
          success: false,
          message: 'Invalid response from token endpoint',
          data: undefined
        };
      }
      
      // Extract token with safety checks
      let token = null;
      
      // Check data.token and root token property
      if (tokenData?.data?.token) {
        token = tokenData.data.token;
      } else if (tokenData?.token) {
        token = tokenData.token;
      }
      
      // If token not found in response, check cookies directly
      if (!token && typeof document !== 'undefined') {
        logger.debug('Token not found in response, checking cookies', { requestId });
        
        // Parse cookies from document.cookie
        const cookies = document.cookie.split(';');
        
        // First try to get token from js_token which is non-HttpOnly
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'js_token') {
            token = decodeURIComponent(value);
            logger.debug('Token found in js_token cookie', { requestId, tokenLength: token.length });
            break;
          } else if (name === 'auth_token' || name === 'access_token') {
            token = decodeURIComponent(value);
            logger.debug(`Token found in ${name} cookie`, { requestId, tokenLength: token.length });
            break;
          }
        }
      }
      
      if (!token) {
        logger.error('No token found in response or cookies after refresh', { requestId });
        
        // Clear auth state
        this.updateAuthState({
          isAuthenticated: false,
          user: null
        });
        
        return {
          success: false,
          message: 'No token found in response',
          data: undefined
        };
      }
      
      // Parse and validate token
      try {
        // Validate token format
        if (typeof token !== 'string' || !token.includes('.') || token.split('.').length !== 3) {
          throw new Error('Invalid token format received from refresh');
        }
        
        // Decode token
        const decoded = jwtDecode<DecodedToken>(token);
        const expiresAt = decoded.exp * 1000;
        
        // Validate expiration
        if (Date.now() >= expiresAt) {
          throw new Error('Received expired token from refresh');
        }
        
        // Store token
        this.token = token;
        this.tokenExpiresAt = expiresAt;
        
        // Extract user info
        const user = this.decodeUserFromToken(token);
        
        if (!user) {
          throw new Error('Failed to decode user from refreshed token');
        }
        
        // Update auth state
        this.updateAuthState({
          isAuthenticated: true,
          user
        });
        
        // Emit token refreshed event
        this.events.emit('token_refreshed', { 
          timestamp: Date.now(),
          requestId 
        });
        
        // Dispatch browser event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('token-refreshed', { 
            detail: { 
              timestamp: Date.now(), 
              instanceId: this.instanceId, 
              sourceInstanceId: this.instanceId,
              requestId
            } 
          }));
        }
        
        // Set up new refresh timer
        await this.setupRefreshTimer();
        
        // Calculate expiration time for response
        const expiresIn = Math.floor((expiresAt - Date.now()) / 1000);
        
        logger.info('Token refresh completed successfully', {
          requestId,
          userId: user.id,
          expiresIn: `${expiresIn}s`
        });
        
        // Return successful response
        return {
          success: true,
          accessToken: token,
          data: {
            token,
            refreshToken: '', // HTTP-only cookie, no direct access
            expiresIn,
            user: this.convertToUserDto(user)
          }
        };
      } catch (tokenError) {
        logger.error('Error processing refreshed token', {
          error: tokenError instanceof Error ? tokenError.message : String(tokenError),
          stack: tokenError instanceof Error ? tokenError.stack : undefined,
          requestId
        });
        
        // Clear auth state
        this.updateAuthState({
          isAuthenticated: false,
          user: null
        });
        
        return {
          success: false,
          message: tokenError instanceof Error ? tokenError.message : 'Invalid token received',
          data: undefined
        };
      }
    } catch (error) {
      logger.error('Error refreshing token', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestId
      });
      
      // Clear tokens and auth state
      this.clearTokens();
      this.updateAuthState({
        isAuthenticated: false,
        user: null
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed',
        data: undefined
      };
    } finally {
      // Always clear the refresh flag
      this.refreshInProgress = false;
    }
  }
  
  /**
   * Create a RefreshTokenResponseDto from the current token
   */
  private async createRefreshResponseFromToken(): Promise<RefreshTokenResponseDto> {
    // Get updated token and user info
    const tokenInfo = await this.getTokenInfo();
    const user = this.authState.user;
    
    if (tokenInfo.token) {
      // Calculate expiration time
      const expiresIn = tokenInfo.expiresAt 
        ? Math.floor((tokenInfo.expiresAt.getTime() - Date.now()) / 1000) 
        : 3600;
      
      return {
        success: true,
        accessToken: tokenInfo.token,
        data: {
          token: tokenInfo.token,
          refreshToken: '', // HTTP-only cookie, no direct access
          expiresIn,
          user: this.convertToUserDto(user)
        }
      };
    }
    
    return {
      success: false,
      message: 'No token available after refresh',
      data: undefined
    };
  }
  
  /**
   * Clear tokens (for logout)
   */
  public clearTokens(): void {
    // Clear memory state
    this.token = null;
    this.tokenExpiresAt = 0;
    
    // Clear the refresh timer
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    // Try to clear cookies by setting expired date
    if (typeof document !== 'undefined') {
      document.cookie = `auth_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `access_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `refresh_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }
  }
  
  /**
   * Clear legacy token storage
   */
  private clearLegacyTokenStorage(): void {
    if (typeof window !== 'undefined') {
      // Remove legacy localStorage keys
      const legacyKeys = [
        'auth_token', 
        'refresh_token',
        'auth_token_backup',
        'refresh_token_backup',
        'token_expires_at',
        'token_refresh_timestamp',
        'token_refresh_failed_count',
        'token_refresh_last_error'
      ];
      
      legacyKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore storage errors
        }
      });
      
      // Clear legacy cookies
      const legacyCookies = [
        'auth_token',
        'auth_token_access',
        'auth_token_backup',
        'refresh_token_backup',
        'auth_expires_at',
        'auth_expires_in',
        'auth_expires_seconds',
        'auth_expires_timestamp',
        'auth_timestamp'
      ];
      
      legacyCookies.forEach(name => {
        try {
          // Clear from all possible paths
          document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
          document.cookie = `${name}=;path=/api/auth/refresh;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
          document.cookie = `${name}=;path=/dashboard;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        } catch (e) {
          // Ignore cookie errors
        }
      });
    }
  }
  
  /**
   * Handle external auth events
   */
  public handleExternalAuthEvent = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const isAuthenticated = customEvent.detail?.isAuthenticated;
    const sourceInstanceId = customEvent.detail?.sourceInstanceId;
    
    // Don't react to self-triggered events
    if (sourceInstanceId === this.instanceId) {
      logger.debug('Ignoring self-triggered auth event');
      return;
    }
    
    // Only react if authentication state has actually changed
    if (isAuthenticated !== undefined && isAuthenticated !== this.authState.isAuthenticated) {
      logger.debug('External auth event received, reinitializing', {
        currentAuthState: this.authState.isAuthenticated,
        newAuthState: isAuthenticated,
        sourceInstanceId
      });
      
      // Update state directly first to prevent flicker
      this.updateAuthState({
        isAuthenticated: !!isAuthenticated,
        user: isAuthenticated ? this.authState.user : null
      });
      
      // Clear any existing refresh timers
      if (this.refreshTimeoutId) {
        clearTimeout(this.refreshTimeoutId);
        this.refreshTimeoutId = null;
      }
      
      // Do a full reinitialization
      this.initialize({ force: true }).catch((error: unknown) => {
        logger.error('Error reinitializing after external auth event', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      });
    }
  };
  
  /**
   * Handle external token events
   */
  public handleExternalTokenEvent = (event: Event): void => {
    logger.debug('External token event received, reinitializing');
    
    // Force reinitialize to get latest token state
    this.initialize({ force: true }).catch((error: unknown) => {
      logger.error('Error reinitializing after external token event', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    });
  };
  
  /**
   * Sign in user with credentials
   */
  public async signIn(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      logger.info('Signing in user', { email });
      
      // First clear tokens
      this.clearTokens();
      
      // Call login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        let errorMsg = 'Invalid credentials';
        try {
          const data = await response.json();
          if (data.message) {
            errorMsg = data.message;
          }
        } catch (e) {
          // Use default error message
        }
        
        logger.warn('Sign in failed', { email, status: response.status });
        return { success: false, message: errorMsg };
      }
      
      // Reinitialize auth service to get fresh token
      await this.initialize({ force: true });
      
      return { success: true };
    } catch (error) {
      logger.error('Error signing in', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return { success: false, message: 'An error occurred during sign in' };
    }
  }
  
  /**
   * Sign out user
   */
  public async signOut(): Promise<boolean> {
    try {
      logger.info('Signing out user');
      
      // Clean up auth state first
      this.updateAuthState({
        isAuthenticated: false,
        user: null
      });
      
      // Clear any refresh timer
      if (this.refreshTimeoutId) {
        clearTimeout(this.refreshTimeoutId);
        this.refreshTimeoutId = null;
      }
      
      // Clear tokens
      this.clearTokens();
      
      // Call logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      return response.ok;
    } catch (error) {
      logger.error('Error signing out', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Ensure auth state is cleared even on error
      this.updateAuthState({
        isAuthenticated: false,
        user: null
      });
      
      return false;
    }
  }
  
  /**
   * Get current user as UserDto
   */
  public async getCurrentUser(): Promise<UserDto> {
    // Return from state if available
    if (this.authState.user) {
      const user = this.convertToUserDto(this.authState.user);
      if (user) {
        return user;
      }
    }
    
    // Otherwise, fetch from API
    try {
      const response = await ApiClient.get('/api/users/me');
      
      if (!response.success || !response.data) {
        throw new Error('User not authenticated');
      }
      
      return response.data;
    } catch (error) {
      logger.error('Error getting current user', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('Failed to get current user');
    }
  }
  
  /**
   * Login with credentials
   */
  public async login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    try {
      const result = await this.signIn(loginDto.email, loginDto.password);
      
      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Authentication failed'
        };
      }
      
      // Get token and user info
      const token = await this.getToken();
      const user = this.getUser();
      
      if (!token || !user) {
        return {
          success: false,
          message: 'Authentication successful but failed to get user information'
        };
      }
      
      // Get token expiration time
      const tokenInfo = await this.getTokenInfo();
      const expiresIn = tokenInfo.expiresAt 
        ? Math.floor((tokenInfo.expiresAt.getTime() - Date.now()) / 1000) 
        : 3600;
      
      return {
        success: true,
        accessToken: token,
        user: this.convertToUserDto(user),
        data: {
          user: this.convertToUserDto(user)!,
          accessToken: token,
          refreshToken: '', // HTTP-only cookie, no direct access
          expiresIn
        },
        accessExpiration: tokenInfo.expiresAt ? tokenInfo.expiresAt.getTime() : undefined,
        refreshExpiration: undefined // Not directly accessible
      };
    } catch (error) {
      logger.error('Login error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }
  
  /**
   * Register a new user
   */
  public async register(registerDto: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify(registerDto)
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || (response.ok ? 'Registration successful' : 'Registration failed'),
        data: response.ok ? data.data : undefined
      };
    } catch (error) {
      logger.error('Registration error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }
  
  /**
   * Process a "Forgot Password" request
   */
  public async forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(forgotPasswordDto)
      });
      
      // Always return success to prevent email enumeration
      return { success: true };
    } catch (error) {
      logger.error('Forgot password error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Still return success to prevent email enumeration
      return { success: true };
    }
  }
  
  /**
   * Validate a reset token
   */
  public async validateResetToken(token: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      logger.error('Token validation error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
  
  /**
   * Reset password with token
   */
  public async resetPassword(resetPasswordDto: ResetPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resetPasswordDto)
      });
      
      return { success: response.ok };
    } catch (error) {
      logger.error('Password reset error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return { success: false };
    }
  }
  
  /**
   * Log out user
   */
  public async logout(userId: number, logoutDto?: LogoutDto, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }> {
    try {
      // Clear local state first
      this.clearTokens();
      this.updateAuthState({
        isAuthenticated: false,
        user: null
      });
      
      // Call server endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...logoutDto,
          userId
        })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        tokenCount: data.tokenCount || 0
      };
    } catch (error) {
      logger.error('Logout error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        tokenCount: 0
      };
    }
  }
  
  /**
   * Verify a token
   */
  public async verifyToken(token: string): Promise<{ valid: boolean; userId?: number; role?: string }> {
    try {
      // First check if token has valid format
      if (!token || !token.includes('.') || token.split('.').length !== 3) {
        return { valid: false };
      }
      
      // Try to decode token
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Check expiration
      const expiresAt = new Date(decoded.exp * 1000);
      if (Date.now() >= expiresAt.getTime()) {
        logger.debug('Token is expired in verifyToken');
        return { valid: false };
      }
      
      // Extract user ID
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else {
        userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
          logger.warn('Invalid user ID in token subject claim');
          return { valid: false };
        }
      }
      
      // Return validation result
      return {
        valid: true,
        userId,
        role: decoded.role
      };
    } catch (error) {
      logger.error('Token verification error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return { valid: false };
    }
  }
  
  /**
   * Generate authentication tokens for a user
   * 
   * @param user - User data
   * @returns Access token and expiration time
   */
  public async generateAuthTokens(user: any): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Get current token info
      const tokenInfo = await this.getTokenInfo();
      
      if (tokenInfo.token) {
        // If we have a valid token, use it
        return {
          accessToken: tokenInfo.token,
          expiresIn: Math.floor((tokenInfo.expiresAt?.getTime() || 0) - Date.now()) / 1000
        };
      }
      
      // Otherwise, attempt to refresh the token
      const refreshResult = await this.refreshToken();
      
      if (refreshResult.success && refreshResult.accessToken) {
        return {
          accessToken: refreshResult.accessToken,
          expiresIn: refreshResult.data?.expiresIn || 3600
        };
      }
      
      throw new Error('Failed to generate auth tokens');
    } catch (error) {
      logger.error('Error generating auth tokens:', error as Error);
      throw error;
    }
  }

  /**
   * Check if user has a specific role
   */
  public async hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean> {
    // If the current user matches the ID, check local role
    if (this.authState.user?.id === userId) {
      return Promise.resolve(this.authState.user.role === role);
    }
    
    // Otherwise, fetch from API
    try {
      const response = await ApiClient.get(`/api/users/${userId}`);
      
      if (!response.success || !response.data) {
        return false;
      }
      
      return response.data.role === role;
    } catch (error) {
      logger.error('Role check error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        role
      });
      return false;
    }
  }
  
  // The rest of the interface methods for IRefreshTokenService
  // These are placeholder implementations that throw errors if called
  
  public async findByToken(token: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public toDTO(entity: RefreshToken): RefreshToken {
    return entity;
  }
  
  public getRepository(): any {
    return null;
  }
  
  public async create(entity: Partial<RefreshToken>, options?: ServiceOptions): Promise<RefreshToken> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async findAll(options?: ServiceOptions): Promise<PaginationResult<RefreshToken>> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async update(id: string, entity: Partial<RefreshToken>, options?: ServiceOptions): Promise<RefreshToken> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async delete(id: string, options?: ServiceOptions): Promise<boolean> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async findById(id: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async findOne(criteria?: Record<string, any>, options?: ServiceOptions): Promise<RefreshToken | null> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async findMany(criteria?: Record<string, any>, options?: ServiceOptions): Promise<RefreshToken[]> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<RefreshToken[]> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async validate(data: any, isUpdate?: boolean, entityId?: number): Promise<any> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async transaction<T>(callback: (service: any) => Promise<T>): Promise<T> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async bulkUpdate(ids: string[], data: Partial<RefreshToken>, options?: ServiceOptions): Promise<number> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public fromDTO(dto: Partial<RefreshToken>): Partial<RefreshToken> {
    return dto;
  }
  
  public async search(searchText: string, options?: ServiceOptions): Promise<RefreshToken[]> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async exists(id: string, options?: ServiceOptions): Promise<boolean> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async findByUser(userId: number, activeOnly?: boolean, options?: ServiceOptions): Promise<RefreshToken[]> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async revokeToken(token: string, ipAddress?: string, replacedByToken?: string, options?: ServiceOptions): Promise<RefreshToken> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async revokeAllUserTokens(userId: number, options?: ServiceOptions): Promise<number> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async rotateToken(token: RefreshToken, oldToken?: string, ipAddress?: string, options?: ServiceOptions): Promise<RefreshToken> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async cleanupExpiredTokens(options?: ServiceOptions): Promise<number> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async createRefreshToken(userId: number): Promise<RefreshToken> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async deleteRefreshToken(token: string): Promise<boolean> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async getAll(options?: ServiceOptions): Promise<PaginationResult<RefreshToken>> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  public async getById(id: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    throw new Error('Not supported on client - use server implementation');
  }
  
  /**
   * Reset auth service to initial state
   * Useful for testing and error recovery
   */
  public resetAuthService(): void {
    // Clear all tokens
    this.clearTokens();
    
    // Reset state
    this.initialized = false;
    this.initializing = false;
    this.initializationPromise = null;
    this.refreshInProgress = false;
    
    // Clear timeout
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    // Reset auth state
    this.updateAuthState({
      isAuthenticated: false,
      isInitialized: false,
      user: null,
      initializationTime: 0
    });
    
    logger.debug('AuthService reset to initial state', { instanceId: this.instanceId });
  }
}

/**
 * Create auth service singleton
 */
const AuthService = new AuthServiceClass();

export default AuthService;