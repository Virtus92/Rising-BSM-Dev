'use client';
/**
 * Client-side Refresh Token Service Implementation
 */
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { RefreshTokenDto } from '@/domain/dtos/AuthDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { getLogger } from '@/core/logging';
import { tokenManager } from '../token/TokenManager';

const logger = getLogger();

/**
 * Client-side RefreshTokenService implementation
 * This service uses the TokenManager for client-side token operations
 */
export class RefreshTokenService implements IRefreshTokenService {
  /**
   * Create a new refresh token
   */
  async createToken(userId: number, token: string, expiresAt: Date, options?: ServiceOptions): Promise<RefreshToken> {
    // In client-side, we don't create tokens directly but store them
    logger.debug('Client-side RefreshTokenService.createToken - storing token');
    
    // Store the token
    const refreshToken = token || await tokenManager.getRefreshToken() || '';
    if (refreshToken) {
      await tokenManager.setRefreshToken(refreshToken);
    }
    
    // Return a proper RefreshToken instance
    return new RefreshToken({
      id: 0,
      userId,
      token,
      expiresAt,
      isRevoked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  /**
   * Find a refresh token by its token value
   */
  async findByToken(token: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    logger.debug('Client-side RefreshTokenService.findByToken - checking local token');
    
    // Get the client-side stored token
    const storedToken = await tokenManager.getRefreshToken();
    if (storedToken && storedToken === token) {
      // Return a proper RefreshToken instance
      return new RefreshToken({
        id: 0,
        userId: 0, // We don't know the userId client-side
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Placeholder expiry
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return null;
  }
  
  /**
   * Revoke a refresh token
   */
  async revokeToken(token: string, ipAddress?: string, replacedByToken?: string, options?: ServiceOptions): Promise<RefreshToken> {
    logger.debug('Client-side RefreshTokenService.revokeToken - clearing token');
    
    // Clear the token from client storage
    await tokenManager.clearTokens();
    
    // Return a revoked token instance
    return new RefreshToken({
      id: 0,
      userId: 0,
      token,
      expiresAt: new Date(),
      isRevoked: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: number, options?: ServiceOptions): Promise<number> {
    logger.debug('Client-side RefreshTokenService.revokeAllForUser - clearing tokens');
    
    // Clear all tokens from client storage
    await tokenManager.clearTokens();
    
    return 1; // Return 1 as if we revoked one token
  }
  
  /**
   * Check if a token is valid
   */
  async validateToken(token: string, options?: ServiceOptions): Promise<boolean> {
    logger.debug('Client-side RefreshTokenService.isTokenValid - checking token');
    
    // Get the client-side stored token
    const storedToken = await tokenManager.getRefreshToken();
    
    // Check if tokens match
    return storedToken === token;
  }
  
  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(options?: ServiceOptions): Promise<number> {
    logger.debug('Client-side RefreshTokenService.cleanupExpiredTokens - not applicable');
    
    // Check if current token is expired
    const tokenInfo = await tokenManager.getTokenInfo();
    
    if (tokenInfo?.isExpired) {
      await tokenManager.clearTokens();
      return 1;
    }
    
    return 0;
  }
  
  /**
   * Find all tokens for a user
   */
  async findByUser(userId: number, activeOnly?: boolean, options?: ServiceOptions): Promise<RefreshToken[]> {
    logger.debug(`Client-side RefreshTokenService.findByUser - not fully supported on client`);
    // On client side, we can only check if current token belongs to user
    const token = await tokenManager.getRefreshToken();
    
    if (!token) return [];
    
    return [new RefreshToken({
      id: 0,
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })];
  }
  
  /**
   * Rotate token - replace old with new
   */
  async rotateToken(newToken: RefreshToken, oldToken?: string, ipAddress?: string, options?: ServiceOptions): Promise<RefreshToken> {
    logger.debug('Client-side RefreshTokenService.rotateToken - replacing token');
    
    // Store the new token
    await tokenManager.setRefreshToken(newToken.token);
    
    return newToken;
  }

  /**
   * Method stubs for IBaseService interface
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<RefreshToken>> {
    logger.warn('RefreshTokenService.getAll called on client-side - not applicable');
    return {
      data: [],
      pagination: {
        page: options?.page || 1,
        limit: options?.limit || 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  async getById(id: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    logger.warn('RefreshTokenService.getById called on client-side - not applicable');
    return null;
  }

  async create(data: Partial<RefreshToken>, options?: ServiceOptions): Promise<RefreshToken> {
    logger.warn('RefreshTokenService.create called on client-side - not applicable');
    
    if (data.token && data.userId) {
      return this.createToken(data.userId, data.token, data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }
    
    throw new Error('Unable to create refresh token with missing data');
  }

  async update(id: string, data: Partial<RefreshToken>, options?: ServiceOptions): Promise<RefreshToken> {
    logger.warn('RefreshTokenService.update called on client-side - not applicable');
    throw new Error('Method not applicable on client side');
  }

  async delete(id: string, options?: ServiceOptions): Promise<boolean> {
    logger.warn('RefreshTokenService.delete called on client-side - not applicable');
    
    // Clear client-side tokens
    await tokenManager.clearTokens();
    return true;
  }

  async validate(data: any, isUpdate?: boolean, entityId?: number): Promise<any> {
    logger.warn('RefreshTokenService.validate called on client-side - not applicable');
    return { isValid: true };
  }

  async transaction<T>(callback: (service: IRefreshTokenService) => Promise<T>): Promise<T> {
    // No transaction support on client side, just execute the callback
    return callback(this);
  }

  // Non-applicable methods
  toDTO(entity: RefreshToken): RefreshToken {
    return entity;
  }

  fromDTO(dto: any): Partial<RefreshToken> {
    return dto;
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<RefreshToken[]> {
    logger.warn('RefreshTokenService.findByCriteria called on client-side - not applicable');
    return [];
  }

  async bulkUpdate(ids: string[], data: Partial<RefreshToken>, options?: ServiceOptions): Promise<number> {
    logger.warn('RefreshTokenService.bulkUpdate called on client-side - not applicable');
    return 0;
  }

  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    logger.warn('RefreshTokenService.count called on client-side - not applicable');
    return 0;
  }

  async search(searchText: string, options?: ServiceOptions): Promise<RefreshToken[]> {
    logger.warn('RefreshTokenService.search called on client-side - not applicable');
    return [];
  }

  async exists(id: string, options?: ServiceOptions): Promise<boolean> {
    logger.warn('RefreshTokenService.exists called on client-side - not applicable');
    return false;
  }

  getRepository(): any {
    logger.warn('RefreshTokenService.getRepository called on client-side - not applicable');
    return null;
  }

  async findAll(options?: ServiceOptions): Promise<PaginationResult<RefreshToken>> {
    logger.warn('RefreshTokenService.findAll called on client-side - not applicable');
    return {
      data: [],
      pagination: {
        page: options?.page || 1,
        limit: options?.limit || 10,
        total: 0,
        totalPages: 0
      }
    };
  }
}