import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/core/db/index';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';

/**
 * Repository for refresh tokens
 */
export class RefreshTokenRepository extends PrismaRepository<RefreshToken, string> implements IRefreshTokenRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // 'refreshToken' is the name of the model in Prisma
    super(prisma, 'refreshToken', logger, errorHandler);
    
    this.logger.debug('Initialized RefreshTokenRepository');
  }

  /**
   * Find a token by its string value
   * 
   * @param token - Token string
   * @returns Promise with token or null
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token }
      });
      
      return refreshToken ? this.mapToDomainEntity(refreshToken) : null;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.findByToken', { error });
      throw this.handleError(error);
    }
  }

  /**
  * Find all tokens for a user
  * 
  * @param userId - User ID
  * @param activeOnly - Only active tokens
  * @returns Promise with tokens
  */
  async findByUserId(userId: number, activeOnly?: boolean): Promise<RefreshToken[]> {
    try {
      const where: any = { userId };
      
      if (activeOnly) {
        where.revokedAt = null;
      }
      
      const refreshTokens = await this.prisma.refreshToken.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      
      return refreshTokens.map(token => this.mapToDomainEntity(token));
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.findByUserId', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete all tokens for a user
   * 
   * @param userId - User ID
   * @returns Promise with count of deleted tokens
   */
  async deleteAllForUser(userId: number): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { userId }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.deleteAllForUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete expired tokens
   * 
   * @returns Promise with count of deleted tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.deleteExpiredTokens', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Process criteria for queries
   * 
   * @param criteria - Query criteria
   * @returns Processed criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    if (criteria.isRevoked !== undefined) {
      processedCriteria.revokedAt = criteria.isRevoked ? { not: null } : null;
    }
    
    // Pass through other criteria
    Object.entries(criteria).forEach(([key, value]) => {
      if (key !== 'isRevoked') {
        processedCriteria[key] = value;
      }
    });
    
    return processedCriteria;
  }

  /**
   * Revoke a token
   * 
   * @param token - Token string
   * @param ipAddress - IP address of revocation
   * @param replacedByToken - Token replacing this token
   * @returns Revoked token
   */
  async revokeToken(token: string, ipAddress?: string, replacedByToken?: string): Promise<RefreshToken> {
    try {
      const updateData: any = {
        revokedAt: new Date(),
      };
      
      if (ipAddress) {
        updateData.revokedByIp = ipAddress;
      }
      
      if (replacedByToken) {
        updateData.replacedByToken = replacedByToken;
      }
      
      // Use token field for the query, not id
      const updatedToken = await this.prisma.refreshToken.update({
        where: { token: token },
        data: updateData
      });
      
      return this.mapToDomainEntity(updatedToken);
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.revokeToken', { error, token });
      throw this.handleError(error);
    }
  }
  
  /**
   * Revoke all tokens for a user
   * 
   * @param userId - User ID
   * @returns Count of revoked tokens
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.updateMany({
        where: { 
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.revokeAllUserTokens', { error, userId });
      throw this.handleError(error);
    }
  }
  
  /**
   * Create a new token with automatic revocation of the old token
   * 
   * @param token - New token
   * @param oldToken - Old token (optional)
   * @param ipAddress - IP address
   * @returns Created token
   */
  async createWithRotation(token: RefreshToken, oldToken?: string, ipAddress?: string): Promise<RefreshToken> {
    try {
      // Start a transaction to ensure both operations complete
      return await this.prisma.$transaction(async (tx) => {
        // If there's an old token, revoke it first
        if (oldToken) {
          await tx.refreshToken.update({
            where: { token: oldToken },
            data: {
              revokedAt: new Date(),
              revokedByIp: ipAddress,
              replacedByToken: token.token
            }
          });
        }
        
        // Create the new token
        const data = this.mapToORMEntity(token);
        const createdToken = await tx.refreshToken.create({
          data
        });
        
        return this.mapToDomainEntity(createdToken);
      });
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.createWithRotation', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): RefreshToken {
    if (!ormEntity) {
      return null as any;
    }
    
    return new RefreshToken({
      token: ormEntity.token,
      userId: ormEntity.userId,
      expiresAt: ormEntity.expiresAt,
      createdAt: ormEntity.createdAt,
      createdByIp: ormEntity.createdByIp,
      revokedAt: ormEntity.revokedAt,
      revokedByIp: ormEntity.revokedByIp,
      isRevoked: ormEntity.revokedAt !== null,
      replacedByToken: ormEntity.replacedByToken
    });
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<RefreshToken>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined && key !== 'updatedAt') {
        result[key] = value;
      }
    });
    
    return result;
  }

  /**
   * Implementation of activity logging
   * 
   * @param userId - User ID
   * @param actionType - Action type
   * @param details - Details
   * @param ipAddress - IP address
   * @returns Promise with log result
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string, 
    ipAddress?: string
  ): Promise<any> {
    try {
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      return null;
    }
  }
}