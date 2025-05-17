'use client';

/**
 * AuthServiceRegistry.ts
 * 
 * This singleton registry allows accessing the AuthService instance
 * from different modules without creating import cycles.
 * It serves as a mediator between components that need authentication
 * functions without direct coupling.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Types for the AuthService interface
export interface AuthUserInfo {
  id: number;
  email: string;
  name?: string;
  role?: string;
}

/**
 * AuthServiceRegistry - Singleton registry for the AuthService instance
 * to break circular dependencies and allow different parts of the system
 * to access auth functions without direct imports.
 */
class AuthServiceRegistry {
  private authService: any = null;
  private isRegistered = false;

  /**
   * Register the AuthService instance
   */
  public register(service: any): void {
    if (this.isRegistered && this.authService) {
      logger.debug('AuthService already registered, replacing instance');
    }
    
    this.authService = service;
    this.isRegistered = true;
    
    logger.debug('AuthService registered in registry');
  }

  /**
   * Check if AuthService is registered
   */
  public isServiceRegistered(): boolean {
    return this.isRegistered && !!this.authService;
  }

  /**
   * Get the current user from AuthService
   */
  public getCurrentUser(): AuthUserInfo | null {
    if (!this.isServiceRegistered()) {
      return null;
    }
    
    try {
      // Call getUser method if it exists
      if (typeof this.authService.getUser === 'function') {
        return this.authService.getUser();
      }
      return null;
    } catch (error) {
      logger.error('Error getting user from AuthService:', error as Error);
      return null;
    }
  }

  /**
   * Get token from AuthService
   */
  public async getToken(): Promise<string | null> {
    if (!this.isServiceRegistered()) {
      return null;
    }
    
    try {
      // Call getToken method if it exists
      if (typeof this.authService.getToken === 'function') {
        return await this.authService.getToken();
      }
      return null;
    } catch (error) {
      logger.error('Error getting token from AuthService:', error as Error);
      return null;
    }
  }

  /**
   * Refresh token via AuthService
   */
  public async refreshToken(): Promise<boolean> {
    if (!this.isServiceRegistered()) {
      return false;
    }
    
    try {
      // Call refreshToken method if it exists
      if (typeof this.authService.refreshToken === 'function') {
        const result = await this.authService.refreshToken();
        return result?.success === true;
      }
      return false;
    } catch (error) {
      logger.error('Error refreshing token via AuthService:', error as Error);
      return false;
    }
  }

  /**
   * Clear the registry
   */
  public clear(): void {
    this.authService = null;
    this.isRegistered = false;
    logger.debug('AuthService registry cleared');
  }
}

// Export singleton instance
const authServiceRegistry = new AuthServiceRegistry();
export default authServiceRegistry;
