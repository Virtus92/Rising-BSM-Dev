import { IBaseRepository } from './IBaseRepository.js';
import { RefreshToken } from '../entities/RefreshToken.js';

/**
 * IRefreshTokenRepository
 * 
 * Repository interface for RefreshToken entity operations.
 * Extends the base repository interface with refresh token-specific methods.
 */
export interface IRefreshTokenRepository extends IBaseRepository<RefreshToken, string> {
  /**
   * Create a new refresh token
   * 
   * @param tokenData - Refresh token data
   * @returns Promise with created refresh token
   */
  createRefreshToken(tokenData: Partial<RefreshToken>): Promise<RefreshToken>;
  
  /**
   * Find refresh token by token string
   * 
   * @param token - Token string
   * @returns Promise with refresh token or null
   */
  findByToken(token: string): Promise<RefreshToken | null>;
  
  /**
   * Find all refresh tokens for a user
   * 
   * @param userId - User ID
   * @returns Promise with array of refresh tokens
   */
  findByUserId(userId: number): Promise<RefreshToken[]>;
  
  /**
   * Delete a refresh token
   * 
   * @param token - Token string
   * @returns Promise with boolean indicating success
   */
  deleteToken(token: string): Promise<boolean>;
  
  /**
   * Delete all refresh tokens for a user
   * 
   * @param userId - User ID
   * @returns Promise with number of tokens deleted
   */
  deleteAllForUser(userId: number): Promise<number>;
  
  /**
   * Delete expired tokens
   * 
   * @returns Promise with number of tokens deleted
   */
  deleteExpired(): Promise<number>;
  
  /**
   * Replace an old token with a new one (for token rotation)
   * 
   * @param oldToken - Old token string
   * @param newTokenData - New token data
   * @returns Promise with new refresh token
   */
  rotateToken(oldToken: string, newTokenData: Partial<RefreshToken>): Promise<RefreshToken>;
}