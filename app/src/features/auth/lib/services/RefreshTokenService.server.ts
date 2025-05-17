/**
 * RefreshTokenService.server.ts
 * 
 * Server-side implementation of the RefreshTokenService.
 * This service provides refresh token operations on the server side.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { getLogger } from '@/core/logging';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { getRefreshTokenRepository } from '@/core/factories/repositoryFactory.server';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

// Get repository
const refreshTokenRepository = getRefreshTokenRepository();

// Get logger
const logger = getLogger();

/**
 * Server-side implementation of IRefreshTokenService
 * This adapter wraps the repository and implements the service interface
 */
export class RefreshTokenServiceServer implements IRefreshTokenService {
  /**
   * Validate if a token is valid
   * Checks if token exists, is not revoked, and not expired
   */
  async validateToken(token: string, options?: ServiceOptions): Promise<boolean> {
    try {
      // Find the token
      const refreshToken = await refreshTokenRepository.findByToken(token);
      
      // Check if token exists, is not revoked, and not expired
      if (!refreshToken || refreshToken.isRevoked) {
        return false;
      }
      
      // Check if token is not expired
      return new Date() < refreshToken.expiresAt;
    } catch (error) {
      logger.error('Error in validateToken:', error as Error);
      return false;
    }
  }
  findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<RefreshToken[]> {
    throw new Error('Method not implemented.');
  }
  search(searchText: string, options?: ServiceOptions): Promise<RefreshToken[]> {
    throw new Error('Method not implemented.');
  }
  // Refresh token repository methods mapped to service interface
  
  /**
   * Find a token by its string value
   */
  async findByToken(token: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    try {
      return await refreshTokenRepository.findByToken(token);
    } catch (error) {
      logger.error('Error in findByToken:', error as Error);
      return null;
    }
  }
  
  /**
   * Find all tokens for a user
   */
  async findByUser(userId: number, activeOnly?: boolean, options?: ServiceOptions): Promise<RefreshToken[]> {
    try {
      return await refreshTokenRepository.findByUserId(userId, activeOnly);
    } catch (error) {
      logger.error('Error in findByUser:', error as Error);
      return [];
    }
  }
  
  /**
   * Revoke a token
   */
  async revokeToken(token: string, ipAddress?: string, replacedByToken?: string, options?: ServiceOptions): Promise<RefreshToken> {
    try {
      return await refreshTokenRepository.revokeToken(token, ipAddress, replacedByToken);
    } catch (error) {
      logger.error('Error in revokeToken:', error as Error);
      throw error;
    }
  }
  
  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: number, options?: ServiceOptions): Promise<number> {
    try {
      return await refreshTokenRepository.revokeAllUserTokens(userId);
    } catch (error) {
      logger.error('Error in revokeAllUserTokens:', error as Error);
      return 0;
    }
  }
  
  /**
   * Rotate a token
   */
  async rotateToken(token: RefreshToken, oldToken?: string, ipAddress?: string, options?: ServiceOptions): Promise<RefreshToken> {
    try {
      return await refreshTokenRepository.createWithRotation(token, oldToken, ipAddress);
    } catch (error) {
      logger.error('Error in rotateToken:', error as Error);
      throw error;
    }
  }
  
  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(options?: ServiceOptions): Promise<number> {
    try {
      return await refreshTokenRepository.deleteExpiredTokens();
    } catch (error) {
      logger.error('Error in cleanupExpiredTokens:', error as Error);
      return 0;
    }
  }
  
  /**
   * Create a new refresh token
   */
  async createRefreshToken(userId: number): Promise<RefreshToken> {
    try {
      // Generate a more robust unique token with multiple entropy sources
      const timestamp = Date.now();
      const randomId = crypto.randomUUID().replace(/-/g, '');
      const userIdComponent = userId.toString(36);
      
      // Add timestamp and user-specific information to ensure uniqueness
      const tokenValue = `${randomId}-${timestamp}-${userIdComponent}`;
      
      logger.debug('Generated refresh token', { 
        userId, 
        tokenLength: tokenValue.length,
        tokenPrefix: tokenValue.substring(0, 8)
      });
      
      // Create a new token with only valid Prisma fields
      // Omit id and updatedAt which are not in the RefreshToken Prisma model
      return await refreshTokenRepository.create({
        userId,
        token: tokenValue,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isRevoked: false,
        createdAt: new Date()
        // Do not include updatedAt or id as they're not in the Prisma schema
      });
    } catch (error) {
      logger.error('Error in createRefreshToken:', error as Error);
      throw error;
    }
  }
  
  /**
   * Delete a refresh token
   */
  async deleteRefreshToken(token: string): Promise<boolean> {
    try {
      // Find token first
      const refreshToken = await refreshTokenRepository.findByToken(token);
      
      if (!refreshToken) {
        return false;
      }
      
      // Delete token
      await refreshTokenRepository.delete(refreshToken.id.toString());
      return true;
    } catch (error) {
      logger.error('Error in deleteRefreshToken:', error as Error);
      return false;
    }
  }
  
  // IBaseService implementation
  
  /**
   * Create a new entity
   */
  async create(entity: Partial<RefreshToken>, options?: ServiceOptions): Promise<RefreshToken> {
    return await refreshTokenRepository.create(entity);
  }
  
  /**
   * Update an entity
   */
  async update(id: string, entity: Partial<RefreshToken>, options?: ServiceOptions): Promise<RefreshToken> {
    return await refreshTokenRepository.update(id, entity);
  }
  
  /**
   * Delete an entity
   */
  async delete(id: string, options?: ServiceOptions): Promise<boolean> {
    try {
      await refreshTokenRepository.delete(id);
      return true;
    } catch (error) {
      logger.error('Error in delete:', error as Error);
      return false;
    }
  }
  
  /**
   * Find all entities with pagination
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<RefreshToken>> {
    return await refreshTokenRepository.findAll(options?.filters);
  }
  
  /**
   * Find entity by ID
   */
  async getById(id: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    return await refreshTokenRepository.findById(id);
  }
  
  /**
   * Find entity by ID (alias)
   */
  async findById(id: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    return await this.getById(id, options);
  }
  
  /**
   * Count entities
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    return await refreshTokenRepository.count(options?.filters);
  }
  
  /**
   * Get all entities
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<RefreshToken>> {
    return await this.findAll(options);
  }
  
  /**
   * Validate entity
   */
  async validate(data: any, isUpdate?: boolean, entityId?: number): Promise<any> {
    // Basic validation
    if (!data) {
      return { valid: false, errors: ['Data is required'] };
    }
    
    return { valid: true, errors: [] };
  }
  
  /**
   * Execute transaction
   */
  async transaction<T>(callback: (service: any) => Promise<T>): Promise<T> {
    // For simplicity, we're just executing the callback without a transaction
    return callback(this);
  }
  
  /**
   * Bulk update entities
   */
  async bulkUpdate(ids: string[], data: Partial<RefreshToken>, options?: ServiceOptions): Promise<number> {
    let count = 0;
    for (const id of ids) {
      try {
        await this.update(id, data, options);
        count++;
      } catch (error) {
        logger.error(`Error updating entity with ID ${id}:`, error as Error);
      }
    }
    return count;
  }
  
  /**
   * Convert entity to DTO
   */
  toDTO(entity: RefreshToken): RefreshToken {
    return entity;
  }
  
  /**
   * Convert DTO to entity
   */
  fromDTO(dto: Partial<RefreshToken>): Partial<RefreshToken> {
    return dto;
  }
  
 
  
  /**
   * Check if entity exists
   */
  async exists(id: string, options?: ServiceOptions): Promise<boolean> {
    const entity = await this.getById(id, options);
    return !!entity;
  }
  
  /**
   * Get repository
   */
  getRepository(): any {
    return refreshTokenRepository;
  }
}

// Export singleton instance
export const refreshTokenServiceServer = new RefreshTokenServiceServer();

// Default export
export default refreshTokenServiceServer;