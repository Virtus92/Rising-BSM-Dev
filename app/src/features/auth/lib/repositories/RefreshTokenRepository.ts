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
   * @param token - Token to find
   * @returns Promise with token or null
   */
  async findByToken(token: string): Promise<RefreshToken> {
    try {
      // Validate token before any database operations
      if (!token || typeof token !== 'string' || token.length < 20) {
        this.logger.warn('Invalid refresh token format in findByToken', { 
          tokenFormat: typeof token, 
          tokenLength: token?.length 
        });
        throw this.errorHandler.createValidationError(
          'Invalid refresh token format',
          ['Token must be a valid string of sufficient length']
        );
      }

      // Use a more robust approach with proper error handling and a longer timeout
      try {
        // Set up an AbortController for the query
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          this.logger.warn('Timeout in RefreshTokenRepository.findByToken', { tokenPrefix: token.substring(0, 8) });
        }, 10000); // 10 second timeout - more generous

        // Execute the query with the abort signal
        const result = await this.prisma.refreshToken.findUnique({
          where: { token },
          // Use a select clause to limit the data returned for performance
          select: {
            token: true,
            userId: true,
            expiresAt: true,
            createdAt: true,
            createdByIp: true,
            revokedAt: true,
            revokedByIp: true,
            replacedByToken: true
          }
        });

        // Clear the timeout as we got a result
        clearTimeout(timeoutId);

        if (!result) {
          throw this.errorHandler.createNotFoundError(
            `Refresh token not found`
          );
        }
        
        return this.mapToDomainEntity(result);
      } catch (queryError) {
        if ((queryError as Error).name === 'AbortError') {
          this.logger.error('Query aborted due to timeout in RefreshTokenRepository.findByToken', { 
            tokenPrefix: token.substring(0, 8)
          });
          throw this.errorHandler.createBadRequestError(
            'Query timed out while searching for refresh token'
          );
        }
        
        // Rethrow other errors to be handled by the outer catch
        throw queryError;
      }
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.findByToken', { 
        error, 
        tokenPart: token ? token.substring(0, 8) + '...' : 'null'
      });
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
      
      // Filter out any null values that might be returned from mapToDomainEntity
      return refreshTokens
        .map(token => this.mapToDomainEntity(token))
        .filter((token): token is RefreshToken => token !== null);
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
   * Delete tokens based on criteria
   * 
   * @param criteria - Filter criteria
   * @returns Promise with count of deleted tokens
   */
  async deleteMany(criteria: Record<string, any> = {}): Promise<number> {
    try {
      const processedCriteria = this.processCriteria(criteria);
      
      this.logger.debug('Deleting tokens with criteria', { criteria: JSON.stringify(processedCriteria) });
      
      const result = await this.prisma.refreshToken.deleteMany({
        where: processedCriteria
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.deleteMany', { error, criteria });
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
    
    // Handle empty criteria
    if (!criteria || Object.keys(criteria).length === 0) {
      return {};
    }
    
    // Create a copy to avoid mutating the original
    const criteriaCopy = { ...criteria };
    
    // Handle specific fields that need special processing
    if (criteriaCopy.isRevoked !== undefined) {
      processedCriteria.revokedAt = criteriaCopy.isRevoked ? { not: null } : null;
      delete criteriaCopy.isRevoked;
    }
    
    // Handle token as primary key if present
    if (criteriaCopy.id !== undefined) {
      // If id is provided, determine whether it's a token string
      if (typeof criteriaCopy.id === 'string' && criteriaCopy.id.length > 8) {
        // If id looks like a token string, use it as token
        this.logger.debug('Using ID as token in processCriteria', { idPrefix: criteriaCopy.id.substring(0, 8) });
        processedCriteria.token = criteriaCopy.id;
      } else if (criteriaCopy.token === undefined) {
        // Only add a token condition if one isn't already specified
        this.logger.warn('ID provided for RefreshToken is not a valid token string', { id: criteriaCopy.id });
      }
      
      // Always remove id from criteria to prevent conflicts
      delete criteriaCopy.id;
    }
    
    // Pass through other criteria
    Object.entries(criteriaCopy).forEach(([key, value]) => {
      processedCriteria[key] = value;
    });
    
    return processedCriteria;
  }
  
  /**
   * Override the update method to handle string tokens correctly
   * 
   * @param id - The token string that serves as the primary key
   * @param data - Data to update
   * @returns Updated entity
   */
  async update(id: string, data: Partial<RefreshToken>): Promise<RefreshToken> {
    try {
      if (!id || typeof id !== 'string') {
        throw this.errorHandler.createValidationError(
          'Invalid refresh token identifier',
          ['Token identifier must be a valid string']
        );
      }
      
      this.logger.debug('Updating refresh token', { 
        tokenIdPrefix: id.length > 8 ? id.substring(0, 8) : id 
      });
      
      // Always use token as the primary key for refresh tokens
      // Prepare the data for update
      const entityData = this.mapToORMEntity(data);
      
      // Perform the update using token as the primary key
      try {
        const result = await this.prisma.refreshToken.update({
          where: { token: id },
          data: entityData
        });
        
        return this.mapToDomainEntity(result);
      } catch (prismaError) {
        if ((prismaError as any).code === 'P2025') {
          throw this.errorHandler.createNotFoundError(`Refresh token not found: ${id.substring(0, 8)}...`);
        }
        throw prismaError;
      }
    } catch (error) {
      this.logger.error('Error updating refresh token', { 
        error, 
        idType: typeof id,
        idLength: typeof id === 'string' ? id.length : 'N/A'
      });
      
      throw this.handleError(error);
    }
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
      // First check if token exists
      const existingToken = await this.prisma.refreshToken.findUnique({
        where: { token }
      });
      
      if (!existingToken) {
        throw this.errorHandler.createNotFoundError(
          `Cannot revoke token - token not found`
        );
      }

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
      // Validate the token before attempting to create it
      if (!token || !token.token || typeof token.token !== 'string' || token.token.length < 20) {
        throw this.errorHandler.createValidationError(
          'Invalid token for creation',
          ['New token must be a valid token instance with proper token string']
        );
      }

      // Check if the token already exists to prevent unique constraint violations
      try {
        const existingToken = await this.prisma.refreshToken.findUnique({
          where: { token: token.token },
          select: { token: true } // Only select the token field for efficiency
        });
        
        if (existingToken) {
          this.logger.warn('Token already exists, generating a new unique token', {
            tokenPrefix: token.token.substring(0, 8)
          });
          
          // Generate a new unique token value
          const timestamp = Date.now();
          const randomPart = crypto.randomUUID().replace(/-/g, '');
          token.token = `${randomPart}-${timestamp}-${token.userId}`;
          
          this.logger.debug('Generated new unique token', {
            newTokenPrefix: token.token.substring(0, 8)
          });
        }
      } catch (checkError) {
        this.logger.warn('Error checking if token exists, continuing with token creation', {
          error: checkError
        });
        // Continue despite the error to attempt the transaction
      }
      
      // Use retry mechanism for handling potential concurrent token creations
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          // Start a transaction to ensure both operations complete
          return await this.prisma.$transaction(async (tx) => {
            // If there's an old token, revoke it first
            if (oldToken) {
              try {
                await tx.refreshToken.update({
                  where: { token: oldToken },
                  data: {
                    revokedAt: new Date(),
                    revokedByIp: ipAddress || '',
                    replacedByToken: token.token
                  }
                });
              } catch (revocationError) {
                // Log the error but continue with creating the new token
                this.logger.warn('Failed to revoke old token during rotation', { 
                  error: revocationError, 
                  oldToken: oldToken.substring(0, 8) 
                });
                // We don't throw here as we still want to create the new token
              }
            }
            
            // Create the new token, ensuring we only include fields defined in the Prisma schema
            // Extract only the properties that exist in the RefreshToken Prisma model
            const { token: tokenValue, userId, expiresAt, createdAt, createdByIp, isRevoked, replacedByToken } = token.toObject();
            
            const createdToken = await tx.refreshToken.create({
              data: {
                token: tokenValue,
                userId,
                expiresAt,
                createdAt,
                createdByIp: createdByIp || '',
                isRevoked: isRevoked || false,
                replacedByToken: replacedByToken || null
              }
            });
            
            const mappedToken = this.mapToDomainEntity(createdToken);
            if (!mappedToken) {
              throw new Error('Failed to map created token to domain entity');
            }
            
            return mappedToken;
          });
        } catch (txError: any) {
          // Check if error is a unique constraint violation
          if (txError.code === 'P2002' || 
              (txError.name === 'PrismaClientKnownRequestError' && txError.code === 'P2002') ||
              txError.message?.includes('Unique constraint')) {
            
            retryCount++;
            
            if (retryCount <= maxRetries) {
              this.logger.warn(`Token collision detected, retrying (${retryCount}/${maxRetries})`, {
                tokenPrefix: token.token.substring(0, 8)
              });
              
              // Generate a new unique token value for retry
              const timestamp = Date.now();
              const randomPart = crypto.randomUUID().replace(/-/g, '');
              token.token = `${randomPart}-${timestamp}-${token.userId}-${retryCount}`;
              
              // Add a small delay before retrying to reduce collision probability
              await new Promise(resolve => setTimeout(resolve, 50 * retryCount));
              continue;
            }
          }
          
          // If we've exhausted retries or it's not a unique constraint error, rethrow
          throw txError;
        }
      }
      
      // This should never be reached due to the while loop logic
      throw new Error('Failed to create token after maximum retries');
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
      throw new Error('Cannot map null or undefined entity to RefreshToken');
    }
    
    // Create a properly structured RefreshToken entity
    const refreshToken = new RefreshToken({
      token: ormEntity.token,
      userId: ormEntity.userId,
      expiresAt: ormEntity.expiresAt,
      createdAt: ormEntity.createdAt,
      createdByIp: ormEntity.createdByIp || '',
      revokedAt: ormEntity.revokedAt,
      revokedByIp: ormEntity.revokedByIp || '',
      isRevoked: ormEntity.revokedAt !== null,
      replacedByToken: ormEntity.replacedByToken || ''
    });
    
    // Validate that the token is present
    if (!refreshToken.token) {
      this.logger.warn('Mapped RefreshToken entity has no token value', { entityData: JSON.stringify(ormEntity) });
    }
    
    return refreshToken;
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<RefreshToken>): any {
    // Only include fields that are defined in the Prisma schema
    const validFields = [
      'token', 'userId', 'expiresAt', 'createdAt', 'createdByIp', 
      'isRevoked', 'revokedAt', 'revokedByIp', 'replacedByToken'
    ];
    
    const result: Record<string, any> = {};
    
    // Filter to only include valid fields and non-undefined values
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined && validFields.includes(key)) {
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
          details: details || '',
          ipAddress: ipAddress || '',
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in RefreshTokenRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      // Return empty object instead of null
      return {};
    }
  }
}