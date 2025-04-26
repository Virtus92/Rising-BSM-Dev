import { BaseService } from '@/core/services/BaseService';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '@/domain/entities/RefreshToken';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors/';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Service for refresh tokens
 */
export class RefreshTokenService extends BaseService<
  RefreshToken,
  Partial<RefreshToken>,
  Partial<RefreshToken>,
  RefreshToken,
  string
> implements IRefreshTokenService {
  /**
   * Constructor
   * 
   * @param repository - Repository for data access
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   */
  constructor(
    protected readonly refreshTokenRepository: IRefreshTokenRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    // Type cast to handle the ID type conversion from string to number
    // IRefreshTokenRepository uses string IDs but BaseRepository expects number IDs
    super(refreshTokenRepository as any, logger, validator, errorHandler);
    
    this.logger.debug('Initialized RefreshTokenService');
  }

  /**
   * Count refresh tokens with optional filtering
   * 
   * @param options Options with filters
   * @returns Number of tokens matching criteria
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const criteria: Record<string, any> = {};
      
      if (options?.filters) {
        if (options.filters.userId) {
          criteria.userId = options.filters.userId;
        }
        
        if (options.filters.isRevoked !== undefined) {
          criteria.isRevoked = options.filters.isRevoked;
        }
        
        if (options.filters.expiresAfter) {
          criteria.expiresAt = { gt: new Date(options.filters.expiresAfter) };
        }
        
        if (options.filters.expiresBefore) {
          criteria.expiresAt = { lt: new Date(options.filters.expiresBefore) };
        }
      }
      
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.count', { error });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find all refresh tokens with pagination and filtering
   * 
   * @param options Service options including pagination and filters
   * @returns Paginated results
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<RefreshToken>> {
    try {
      // Convert service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Add filter criteria if provided in options
      if (options?.filters) {
        repoOptions.criteria = {};
        
        if (options.filters.userId) {
          repoOptions.criteria.userId = options.filters.userId;
        }
        
        if (options.filters.isRevoked !== undefined) {
          repoOptions.criteria.isRevoked = options.filters.isRevoked;
        }
        
        if (options.filters.expiresAfter) {
          repoOptions.criteria.expiresAt = { gt: new Date(options.filters.expiresAfter) };
        }
        
        if (options.filters.expiresBefore) {
          repoOptions.criteria.expiresAt = { lt: new Date(options.filters.expiresBefore) };
        }
      }
      
      // Get tokens from repository
      const result = await this.repository.findAll(repoOptions);
      
      // RefreshToken service returns the entities directly as DTOs
      return {
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findAll`, { 
        error: error instanceof Error ? error.message : String(error),
        options 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find a token by its string value
   * 
   * @param token - Token string
   * @param options - Service options
   * @returns Found token or null
   */
  async findByToken(token: string, options?: ServiceOptions): Promise<RefreshToken | null> {
    try {
      this.logger.debug('Finding refresh token', { token: token.substring(0, 8) + '...' });
      
      return await this.refreshTokenRepository.findByToken(token);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.findByToken', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Find all tokens for a user
   * 
   * @param userId - User ID
   * @param activeOnly - Only active tokens
   * @param options - Service options
   * @returns Found tokens
   */
  async findByUser(userId: number, activeOnly?: boolean, options?: ServiceOptions): Promise<RefreshToken[]> {
    try {
      this.logger.debug(`Finding refresh tokens for user ${userId}`, { activeOnly });
      
      return await this.refreshTokenRepository.findByUserId(userId, activeOnly);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.findByUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Revoke a token
   * 
   * @param token - Token string
   * @param ipAddress - IP address of revocation
   * @param replacedByToken - Token replacing this token
   * @param options - Service options
   * @returns Revoked token
   */
  async revokeToken(
    token: string, 
    ipAddress?: string, 
    replacedByToken?: string, 
    options?: ServiceOptions
  ): Promise<RefreshToken> {
    try {
      this.logger.debug('Revoking refresh token', { token: token.substring(0, 8) + '...' });
      
      // Check if the token exists
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      
      if (!refreshToken) {
        throw this.errorHandler.createNotFoundError('Refresh token not found');
      }
      
      // Check user permissions if user context is available
      if (options?.context?.userId && 
          refreshToken.userId !== options.context.userId && 
          options.context.role !== 'admin') {
        throw this.errorHandler.createForbiddenError('You do not have permission to revoke this token');
      }
      
      // Revoke the token
      return await this.refreshTokenRepository.revokeToken(token, ipAddress, replacedByToken);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.revokeToken', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Revoke all tokens for a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Count of revoked tokens
   */
  async revokeAllUserTokens(userId: number, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.debug(`Revoking all refresh tokens for user ${userId}`);
      
      // Check user permissions if user context is available
      if (options?.context?.userId && 
          userId !== options.context.userId && 
          options.context.role !== 'admin') {
        throw this.errorHandler.createForbiddenError('You do not have permission to revoke tokens for this user');
      }
      
      // Revoke all tokens
      return await this.refreshTokenRepository.revokeAllUserTokens(userId);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.revokeAllUserTokens', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new token with automatic revocation of the old token
   * 
   * @param newToken - New token
   * @param oldToken - Old token (optional)
   * @param ipAddress - IP address
   * @param options - Service options
   * @returns Created token
   */
  async rotateToken(
    newToken: RefreshToken, 
    oldToken?: string, 
    ipAddress?: string, 
    options?: ServiceOptions
  ): Promise<RefreshToken> {
    try {
      this.logger.debug('Rotating refresh token', { 
        userId: newToken.userId,
        oldToken: oldToken ? oldToken.substring(0, 8) + '...' : undefined,
        newToken: newToken.token.substring(0, 8) + '...'
      });
      
      // Validate the new token
      await this.validate(newToken);
      
      // Rotate the token
      return await this.refreshTokenRepository.createWithRotation(newToken, oldToken, ipAddress);
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.rotateToken', { error, userId: newToken.userId });
      throw this.handleError(error);
    }
  }

  /**
   * Clean up expired tokens
   * 
   * @param options - Service options
   * @returns Count of deleted tokens
   */
  async cleanupExpiredTokens(options?: ServiceOptions): Promise<number> {
    try {
      this.logger.info('Cleaning up expired refresh tokens');
      
      // Check if the action is performed by an administrator
      if (options?.context?.role !== 'admin' && !options?.context?.system) {
        throw this.errorHandler.createForbiddenError('Only administrators can clean up expired tokens');
      }
      
      // Clean up expired tokens
      return await this.refreshTokenRepository.deleteExpiredTokens();
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.cleanupExpiredTokens', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Check if a token is valid
   * 
   * @param token - Token string
   * @param options - Service options
   * @returns Whether the token is valid
   */
  async validateToken(token: string, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug('Validating refresh token', { token: token.substring(0, 8) + '...' });
      
      // Get the token
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      
      // Check if the token exists and is active
      if (!refreshToken) {
        return false;
      }
      
      return refreshToken.isActive();
    } catch (error) {
      this.logger.error('Error in RefreshTokenService.validateToken', { error });
      return false;
    }
  }

  /**
   * Convert DTO to entity
   * 
   * @param dto - DTO
   * @returns Entity
   */
  fromDTO(dto: Partial<RefreshToken>): Partial<RefreshToken> {
    if (!dto) {
      return {} as Partial<RefreshToken>;
    }
    
    return {
      token: dto.token,
      userId: dto.userId,
      expiresAt: dto.expiresAt instanceof Date ? dto.expiresAt : new Date(dto.expiresAt || ''),
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt || Date.now()),
      createdByIp: dto.createdByIp,
      revokedAt: dto.revokedAt instanceof Date ? dto.revokedAt : dto.revokedAt ? new Date(dto.revokedAt) : undefined,
      revokedByIp: dto.revokedByIp,
      replacedByToken: dto.replacedByToken,
      isRevoked: dto.isRevoked || false
      // Removed updatedAt as it's not in the RefreshToken schema
    };
  }
  
  /**
   * Convert entity to DTO
   * 
   * @param entity - Entity
   * @returns DTO
   */
  toDTO(entity: RefreshToken): RefreshToken {
    return entity;
  }

  /**
   * Map DTO to entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(
    dto: Partial<RefreshToken>,
    existingEntity?: RefreshToken
  ): Partial<RefreshToken> {
    if (existingEntity) {
      // Update case - tokens are typically not updated
      // Note: RefreshToken model doesn't have an updatedAt field
      return {
        ...dto
      };
    } else {
      // Create case
      return {
        ...dto,
        isRevoked: dto.isRevoked || false,
        createdAt: new Date()
        // Removed updatedAt as it's not in the RefreshToken schema
      };
    }
  }

  /**
   * Get validation schema for creation
   */
  protected getCreateValidationSchema(): any {
    return {
      type: 'object',
      required: ['token', 'userId', 'expiresAt'],
      properties: {
        token: { type: 'string', minLength: 1 },
        userId: { type: 'number', minimum: 1 },
        expiresAt: { type: 'object', instanceof: 'Date' },
        createdByIp: { type: 'string' },
        isRevoked: { type: 'boolean' }
      }
    };
  }

  /**
   * Get validation schema for updates
   */
  protected getUpdateValidationSchema(): any {
    return {
      type: 'object',
      properties: {
        isRevoked: { type: 'boolean' },
        revokedAt: { type: 'object', instanceof: 'Date' },
        revokedByIp: { type: 'string' },
        replacedByToken: { type: 'string' }
      }
    };
  }
}