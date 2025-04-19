'use client';

import { AuthClientService } from '@/infrastructure/clients/AuthClientService';
import Cookies from 'js-cookie';

/**
 * Client-side token manager
 * Avoids using server-only crypto modules
 */
export class ClientTokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly EXPIRES_AT_KEY = 'expiresAt';
  
  /**
   * Set both access and refresh tokens with expiry
   */
  static setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    
    // Store in cookies securely
    Cookies.set(this.ACCESS_TOKEN_KEY, accessToken, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    Cookies.set(this.REFRESH_TOKEN_KEY, refreshToken, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    Cookies.set(this.EXPIRES_AT_KEY, expiresAt, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }
  
  /**
   * Get current access token
   */
  static getAccessToken(): string | null {
    return Cookies.get(this.ACCESS_TOKEN_KEY) || null;
  }
  
  /**
   * Get current refresh token
   */
  static getRefreshToken(): string | null {
    return Cookies.get(this.REFRESH_TOKEN_KEY) || null;
  }
  
  /**
   * Clear all auth tokens
   */
  static clearTokens() {
    Cookies.remove(this.ACCESS_TOKEN_KEY);
    Cookies.remove(this.REFRESH_TOKEN_KEY);
    Cookies.remove(this.EXPIRES_AT_KEY);
  }
  
  /**
   * Check if the access token is expired
   */
  static isTokenExpired(): boolean {
    const expiresAt = Cookies.get(this.EXPIRES_AT_KEY);
    if (!expiresAt) return true;
    
    const expiryTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    
    // Add a 5-second buffer to avoid edge cases
    return currentTime >= expiryTime - 5000;
  }
  
  /**
   * Refresh the access token using the refresh token
   */
  static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    
    try {
      const response = await AuthClientService.refreshToken(refreshToken);
      
      if (response.success && response.data) {
        this.setTokens(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.expiresIn
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
  
  /**
   * Checks if the user is logged in (has valid tokens)
   */
  static async isLoggedIn(): Promise<boolean> {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;
    
    // If token is expired, try to refresh it
    if (this.isTokenExpired()) {
      return await this.refreshAccessToken();
    }
    
    return true;
  }
  
  /**
   * Logs out the user by clearing tokens and calling the logout API
   */
  static async logout(allDevices: boolean = false): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    
    // Clear tokens first for immediate UI feedback
    this.clearTokens();
    
    // Call the logout API if we have a refresh token
    if (refreshToken) {
      try {
        const response = await AuthClientService.logout(refreshToken, allDevices);
        return response.success;
      } catch (error) {
        console.error('Error during logout:', error);
        return false;
      }
    }
    
    return true;
  }
}