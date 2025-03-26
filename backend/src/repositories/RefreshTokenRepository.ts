import { BaseRepository } from '../core/BaseRepository.js';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository.js';
import { RefreshToken } from '../entities/RefreshToken.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import { QueryOptions, FilterCriteria } from 'src/interfaces/IBaseRepository.js';

/**
 * Implementation of IRefreshTokenRepository for database operations.
 * Handles CRUD operations for refresh tokens.
 */
export class RefreshTokenRepository extends BaseRepository<RefreshToken, string> implements IRefreshTokenRepository {
  protected buildQueryOptions(_options?: QueryOptions) {
      throw new Error('Method not implemented.');
  }
  protected processCriteria(_criteria: FilterCriteria) {
      throw new Error('Method not implemented.');
  }
  /**
   * Creates a new RefreshTokenRepository instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // Pass model reference to BaseRepository
    super(prisma.refreshToken, logger, errorHandler);
    
    this.logger.debug('Initialized RefreshTokenRepository');
  }

  /**
   * Find refresh token by token string
   * 
   * @param token - Token string
   * @returns Promise with refresh token or null
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token }
      });
      
      return refreshToken ? this.mapToDomainEntity(refreshToken) : null;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.findByToken', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Find all refresh tokens for a user
   * 
   * @param userId - User ID
   * @returns Promise with array of refresh tokens
   */
  async findByUserId(userId: number): Promise<RefreshToken[]> {
    try {
      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId }
      });
      
      return tokens.map(token => this.mapToDomainEntity(token));
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.findByUserId', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new refresh token
   * 
   * @param data - Refresh token data
   * @returns Promise with created refresh token
   */
  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    try {
      const refreshToken = await this.prisma.refreshToken.create({
        data: this.mapToORMEntity(data)
      });
      
      return this.mapToDomainEntity(refreshToken);
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.create', error instanceof Error ? error : String(error), { userId: data.userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete a refresh token
   * 
   * @param token - Token string
   * @returns Promise with boolean indicating success
   */
  async deleteToken(token: string): Promise<boolean> {
    try {
      await this.prisma.refreshToken.delete({
        where: { token }
      });
      
      return true;
    } catch (error: any) {
      if (error?.code === 'P2025') { // Record not found error code
        return false;
      }
      this.logger.error('Error in RefreshTokenRepository.deleteToken', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Delete all refresh tokens for a user
   * 
   * @param userId - User ID
   * @returns Promise with number of tokens deleted
   */
  async deleteAllForUser(userId: number): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { userId }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.deleteAllForUser', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete expired tokens
   * 
   * @returns Promise with number of tokens deleted
   */
  async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await this.prisma.refreshToken.deleteMany({
        where: { expires: { lte: now } }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.deleteExpired', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Replace an old token with a new one (for token rotation)
   * 
   * @param oldToken - Old token string
   * @param newTokenData - New token data
   * @returns Promise with new refresh token
   */
  async rotateToken(oldToken: string, newTokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    try {
      // Start a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Delete the old token
        await prisma.refreshToken.delete({
          where: { token: oldToken }
        });
        
        // Create the new token
        const newToken = await prisma.refreshToken.create({
          data: this.mapToORMEntity(newTokenData)
        });
        
        return this.mapToDomainEntity(newToken);
      });
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.rotateToken', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Prisma handles transactions differently, so we don't need to do anything here
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(): Promise<void> {
    // Prisma handles transactions differently, so we don't need to do anything here
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // Prisma handles transactions differently, so we don't need to do anything here
  }

  /**
   * Execute a query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Promise with query result
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    try {
      switch (operation) {
        case 'findAll':
          return await this.prisma.refreshToken.findMany(args[0]);
          
        case 'findById':
          return await this.prisma.refreshToken.findUnique({
            where: { token: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await this.prisma.refreshToken.findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await this.prisma.refreshToken.findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await this.prisma.refreshToken.create({
            data: args[0]
          });
          
        case 'update':
          return await this.prisma.refreshToken.update({
            where: { token: args[0] },
            data: args[1]
          });
          
        case 'delete':
          return await this.prisma.refreshToken.delete({
            where: { token: args[0] }
          });
          
        case 'count':
          return await this.prisma.refreshToken.count({
            where: args[0]
          });
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      this.logger.error(`Error executing query: ${operation}`, error instanceof Error ? error : String(error));
      throw error;
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
      isRevoked: ormEntity.isRevoked,
      revokedAt: ormEntity.revokedAt,
      revokedByIp: ormEntity.revokedByIp,
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
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    return result;
  }

  /**
   * Check if error is a unique constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a unique constraint violation
   */
  protected isUniqueConstraintError(error: any): boolean {
    return error.code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    return error.code === 'P2003';
  }
}