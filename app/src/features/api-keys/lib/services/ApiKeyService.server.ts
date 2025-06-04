import 'server-only';

import { BaseService } from '@/core/services/BaseService';
import { IApiKeyService } from '@/domain/services/IApiKeyService';
import { IApiKeyRepository } from '@/domain/repositories/IApiKeyRepository';
import { ApiKey, ApiKeyType, ApiKeyStatus, ApiKeyEnvironment } from '@/domain/entities/ApiKey';
import { 
  CreateApiKeyDto, 
  UpdateApiKeyDto, 
  ApiKeyResponseDto,
  CreateApiKeyResponseDto,
  ApiKeyFilterParamsDto,
  ApiKeyValidationDto,
  UpdateApiKeyPermissionsDto,
  RevokeApiKeyDto,
  ApiKeyUsageStatsDto,
  BulkApiKeyOperationDto,
  BulkApiKeyOperationResultDto,
  ApiKeyPermissionCheckDto,
  ApiKeyPermissionCheckResultDto
} from '@/domain/dtos/ApiKeyDtos';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';
import { AppError } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getValidationService } from '@/core/validation';
import { getPermissionService } from '@/core/factories/serviceFactory.server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ApiKeyGenerator } from '@/core/security/api-key-utils';

const logger = getLogger();
const errorHandler = getErrorHandler();
const validationService = getValidationService();

/**
 * API Key Service Implementation
 * 
 * Handles all business logic for API key management including
 * creation, validation, permission management, and usage tracking.
 */
export class ApiKeyService extends BaseService<ApiKey, CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto, number> implements IApiKeyService {
  constructor(private readonly apiKeyRepository: IApiKeyRepository) {
    super(apiKeyRepository, logger, validationService, errorHandler);
    logger.debug('ApiKeyService initialized');
  }

  /**
   * Create a new API key with permissions
   */
  async createApiKey(data: CreateApiKeyDto, options?: ServiceOptions): Promise<CreateApiKeyResponseDto> {
    try {
      logger.info('Creating new API key', { name: data.name, type: data.type, environment: data.environment });

      // Validate user permissions
      if (options?.userId) {
        const canCreate = await this.canCreateApiKeys(options.userId, options);
        if (!canCreate) {
          throw new AppError('Permission denied: Cannot create API keys', 403);
        }
      }

      // Validate name uniqueness
      const isNameUnique = await this.apiKeyRepository.isNameUnique(data.name);
      if (!isNameUnique) {
        throw new AppError('API key name must be unique', 400);
      }

      // Generate the API key
      const keyData = this.generateApiKey(data.environment);

      // Create the API key entity
      const apiKey = new ApiKey({
        name: data.name,
        description: data.description,
        keyPrefix: keyData.keyPrefix,
        keyHash: keyData.keyHash,
        keyPreview: keyData.keyPreview,
        type: data.type,
        status: ApiKeyStatus.ACTIVE,
        environment: data.environment,
        expiresAt: data.expiresAt,
        usageCount: 0,
        createdBy: options?.userId || 0
      });

      // Save to database
      const savedApiKey = await this.apiKeyRepository.create(apiKey);

      // Set permissions for standard keys
      if (data.type === ApiKeyType.STANDARD && data.permissions && data.permissions.length > 0) {
        await this.apiKeyRepository.updateApiKeyPermissions(
          savedApiKey.id!,
          data.permissions,
          options?.userId
        );
      }

      // Get the saved key with permissions
      const responseDto = await this.mapToResponseDto(savedApiKey);

      return {
        apiKey: responseDto,
        plainTextKey: keyData.plainTextKey,
        securityWarning: 'This is the only time you will see the full API key. Please store it securely.'
      };

    } catch (error) {
      logger.error('Error creating API key', { error, data });
      throw error instanceof AppError ? error : new AppError(`Failed to create API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate an API key and return its information
   */
  async validateApiKey(keyHash: string, options?: ServiceOptions): Promise<ApiKeyValidationDto> {
    try {
      const apiKey = await this.apiKeyRepository.findByKeyHash(keyHash);

      if (!apiKey) {
        return {
          valid: false,
          reason: 'API key not found'
        };
      }

      // Check if key is active
      if (!apiKey.isActive()) {
        return {
          valid: false,
          reason: apiKey.status === ApiKeyStatus.REVOKED ? 'API key has been revoked' : 'API key is not active',
          revokedReason: apiKey.revokedReason,
          isExpired: apiKey.isExpired()
        };
      }

      // Get permissions for standard keys
      let permissions: string[] = [];
      if (apiKey.type === ApiKeyType.STANDARD) {
        permissions = await this.apiKeyRepository.getApiKeyPermissions(apiKey.id!);
      } else {
        // Admin keys have all permissions
        permissions = Object.values(SystemPermission);
      }

      // Update usage tracking (don't fail if this fails)
      try {
        await this.apiKeyRepository.updateUsage(keyHash);
      } catch (error) {
        logger.warn('Failed to update API key usage', { error, keyHash: keyHash.substring(0, 8) + '...' });
      }

      return {
        valid: true,
        apiKeyId: apiKey.id!,
        permissions,
        type: apiKey.type,
        environment: apiKey.environment
      };

    } catch (error) {
      logger.error('Error validating API key', { error, keyHash: keyHash.substring(0, 8) + '...' });
      return {
        valid: false,
        reason: 'Validation error occurred'
      };
    }
  }

  /**
   * Update API key permissions (standard keys only)
   */
  async updateApiKeyPermissions(data: UpdateApiKeyPermissionsDto, options?: ServiceOptions): Promise<boolean> {
    try {
      // Verify ownership or admin permissions
      if (options?.userId) {
        const canManage = await this.verifyOwnership(data.apiKeyId, options.userId, options) || 
                         await this.canManageApiKeys(options.userId, options);
        if (!canManage) {
          throw new AppError('Permission denied: Cannot manage this API key', 403);
        }
      }

      // Get the API key
      const apiKey = await this.apiKeyRepository.findById(data.apiKeyId);
      if (!apiKey) {
        throw new AppError('API key not found', 404);
      }

      // Only standard keys can have custom permissions
      if (apiKey.type !== ApiKeyType.STANDARD) {
        throw new AppError('Cannot modify permissions for admin keys', 400);
      }

      return await this.apiKeyRepository.updateApiKeyPermissions(
        data.apiKeyId,
        data.permissions,
        options?.userId
      );

    } catch (error) {
      logger.error('Error updating API key permissions', { error, data });
      throw error instanceof AppError ? error : new AppError(`Failed to update API key permissions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: number, data: RevokeApiKeyDto, options?: ServiceOptions): Promise<boolean> {
    try {
      // Verify ownership or admin permissions
      if (options?.userId) {
        const canManage = await this.verifyOwnership(apiKeyId, options.userId, options) || 
                         await this.canManageApiKeys(options.userId, options);
        if (!canManage) {
          throw new AppError('Permission denied: Cannot revoke this API key', 403);
        }
      }

      return await this.apiKeyRepository.revokeApiKey(
        apiKeyId,
        options?.userId || 0,
        data.reason
      );

    } catch (error) {
      logger.error('Error revoking API key', { error, apiKeyId, data });
      throw error instanceof AppError ? error : new AppError(`Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get API keys with filtering and pagination
   */
  async findApiKeys(filters: ApiKeyFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<ApiKeyResponseDto>> {
    try {
      // If user is not admin, only show their own keys
      if (options?.userId && !await this.canManageApiKeys(options.userId, options)) {
        filters.createdBy = options.userId;
      }

      const result = await this.apiKeyRepository.findApiKeys(filters);

      const responseDtos = await Promise.all(
        result.data.map(apiKey => this.mapToResponseDto(apiKey))
      );

      return {
        data: responseDtos,
        pagination: result.pagination
      };

    } catch (error) {
      logger.error('Error finding API keys', { error, filters });
      throw new AppError(`Failed to find API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update API key usage information
   */
  async updateUsage(keyHash: string, ipAddress?: string, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.apiKeyRepository.updateUsage(keyHash, ipAddress);
    } catch (error) {
      logger.error('Error updating usage', { error, keyHash: keyHash.substring(0, 8) + '...', ipAddress });
      // Don't throw error for usage tracking
      return false;
    }
  }

  /**
   * Get permissions assigned to an API key
   */
  async getApiKeyPermissions(apiKeyId: number, options?: ServiceOptions): Promise<string[]> {
    try {
      return await this.apiKeyRepository.getApiKeyPermissions(apiKeyId);
    } catch (error) {
      logger.error('Error getting API key permissions', { error, apiKeyId });
      throw new AppError(`Failed to get API key permissions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if an API key has a specific permission
   */
  async checkPermission(data: ApiKeyPermissionCheckDto, options?: ServiceOptions): Promise<ApiKeyPermissionCheckResultDto> {
    try {
      const validation = await this.validateApiKey(data.keyHash, options);
      
      if (!validation.valid) {
        return {
          hasPermission: false,
          keyValid: false,
          reason: validation.reason
        };
      }

      // Admin keys have all permissions
      if (validation.type === ApiKeyType.ADMIN) {
        return {
          hasPermission: true,
          keyValid: true
        };
      }

      // Check if standard key has the permission
      const hasPermission = validation.permissions?.includes(data.permission) || false;
      
      return {
        hasPermission,
        keyValid: true,
        reason: hasPermission ? undefined : 'API key does not have this permission'
      };

    } catch (error) {
      logger.error('Error checking API key permission', { error, data });
      return {
        hasPermission: false,
        keyValid: false,
        reason: 'Permission check failed'
      };
    }
  }

  /**
   * Activate an API key
   */
  async activateApiKey(apiKeyId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      if (options?.userId) {
        const canManage = await this.verifyOwnership(apiKeyId, options.userId, options) || 
                         await this.canManageApiKeys(options.userId, options);
        if (!canManage) {
          throw new AppError('Permission denied: Cannot activate this API key', 403);
        }
      }

      return await this.apiKeyRepository.activateApiKey(apiKeyId, options?.userId || 0);

    } catch (error) {
      logger.error('Error activating API key', { error, apiKeyId });
      throw error instanceof AppError ? error : new AppError(`Failed to activate API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Deactivate an API key
   */
  async deactivateApiKey(apiKeyId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      if (options?.userId) {
        const canManage = await this.verifyOwnership(apiKeyId, options.userId, options) || 
                         await this.canManageApiKeys(options.userId, options);
        if (!canManage) {
          throw new AppError('Permission denied: Cannot deactivate this API key', 403);
        }
      }

      return await this.apiKeyRepository.deactivateApiKey(apiKeyId, options?.userId || 0);

    } catch (error) {
      logger.error('Error deactivating API key', { error, apiKeyId });
      throw error instanceof AppError ? error : new AppError(`Failed to deactivate API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update API key expiration
   */
  async updateExpiration(apiKeyId: number, expiresAt: Date | null, options?: ServiceOptions): Promise<boolean> {
    try {
      if (options?.userId) {
        const canManage = await this.verifyOwnership(apiKeyId, options.userId, options) || 
                         await this.canManageApiKeys(options.userId, options);
        if (!canManage) {
          throw new AppError('Permission denied: Cannot update this API key', 403);
        }
      }

      return await this.apiKeyRepository.updateExpiration(apiKeyId, expiresAt, options?.userId || 0);

    } catch (error) {
      logger.error('Error updating API key expiration', { error, apiKeyId, expiresAt });
      throw error instanceof AppError ? error : new AppError(`Failed to update API key expiration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(options?: ServiceOptions): Promise<ApiKeyUsageStatsDto> {
    try {
      const stats = await this.apiKeyRepository.getUsageStats();
      const recentlyUsed = await this.apiKeyRepository.getRecentlyUsedKeys(10);
      const unusedKeys = await this.apiKeyRepository.findUnusedKeys(30);

      const recentlyUsedDtos = await Promise.all(
        recentlyUsed.map(key => this.mapToResponseDto(key))
      );

      const unusedKeyDtos = await Promise.all(
        unusedKeys.map(key => this.mapToResponseDto(key))
      );

      return {
        ...stats,
        recentlyUsed: recentlyUsedDtos,
        unusedKeys: unusedKeyDtos
      };

    } catch (error) {
      logger.error('Error getting usage stats', { error });
      throw new AppError(`Failed to get usage statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Perform bulk operations on multiple API keys
   */
  async bulkOperation(data: BulkApiKeyOperationDto, options?: ServiceOptions): Promise<BulkApiKeyOperationResultDto> {
    try {
      // Verify permissions for each key
      if (options?.userId) {
        for (const apiKeyId of data.apiKeyIds) {
          const canManage = await this.verifyOwnership(apiKeyId, options.userId, options) || 
                           await this.canManageApiKeys(options.userId, options);
          if (!canManage) {
            throw new AppError(`Permission denied: Cannot manage API key ${apiKeyId}`, 403);
          }
        }
      }

      let successful = 0;
      const failures: Array<{ apiKeyId: number; error: string }> = [];

      for (const apiKeyId of data.apiKeyIds) {
        try {
          let result = false;
          
          switch (data.operation) {
            case 'activate':
              result = await this.apiKeyRepository.activateApiKey(apiKeyId, options?.userId || 0);
              break;
            case 'deactivate':
              result = await this.apiKeyRepository.deactivateApiKey(apiKeyId, options?.userId || 0);
              break;
            case 'revoke':
              result = await this.apiKeyRepository.revokeApiKey(apiKeyId, options?.userId || 0, data.reason);
              break;
          }

          if (result) {
            successful++;
          } else {
            failures.push({ apiKeyId, error: 'Operation failed' });
          }
        } catch (error) {
          failures.push({ 
            apiKeyId, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return {
        successful,
        failed: failures.length,
        failures,
        total: data.apiKeyIds.length
      };

    } catch (error) {
      logger.error('Error performing bulk operation', { error, data });
      throw error instanceof AppError ? error : new AppError(`Failed to perform bulk operation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys that are expiring soon
   */
  async findExpiringSoon(days: number = 7, options?: ServiceOptions): Promise<ApiKeyResponseDto[]> {
    try {
      const apiKeys = await this.apiKeyRepository.findExpiringSoon(days);
      return await Promise.all(apiKeys.map(key => this.mapToResponseDto(key)));
    } catch (error) {
      logger.error('Error finding expiring keys', { error, days });
      throw new AppError(`Failed to find expiring keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find unused API keys
   */
  async findUnusedKeys(days: number = 30, options?: ServiceOptions): Promise<ApiKeyResponseDto[]> {
    try {
      const apiKeys = await this.apiKeyRepository.findUnusedKeys(days);
      return await Promise.all(apiKeys.map(key => this.mapToResponseDto(key)));
    } catch (error) {
      logger.error('Error finding unused keys', { error, days });
      throw new AppError(`Failed to find unused keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a new API key (without saving to database)
   */
  generateApiKey(environment: 'production' | 'development'): {
    plainTextKey: string;
    keyHash: string;
    keyPrefix: string;
    keyPreview: string;
  } {
    // Use the standardized ApiKeyGenerator from core security
    return ApiKeyGenerator.generateApiKey(environment);
  }

  /**
   * Validate API key format
   */
  validateKeyFormat(apiKey: string): boolean {
    // Use the standardized ApiKeyGenerator validation
    return ApiKeyGenerator.isValidFormat(apiKey);
  }

  /**
   * Hash an API key for secure storage
   */
  hashApiKey(plainTextKey: string): string {
    // Use the standardized ApiKeyGenerator hashing
    return ApiKeyGenerator.hashApiKey(plainTextKey);
  }

  /**
   * Check if user can create API keys
   */
  async canCreateApiKeys(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const permissionService = getPermissionService();
      const userPermissions = await permissionService.getUserPermissions(userId);
      return userPermissions.permissions?.includes(SystemPermission.API_KEYS_CREATE) || 
             userPermissions.permissions?.includes(SystemPermission.SYSTEM_ADMIN) || 
             false;
    } catch (error) {
      logger.error('Error checking API key creation permissions', { error, userId });
      return false; // Fail closed for security
    }
  }

  /**
   * Check if user can manage API keys
   */
  async canManageApiKeys(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const permissionService = getPermissionService();
      const userPermissions = await permissionService.getUserPermissions(userId);
      return userPermissions.permissions?.includes(SystemPermission.API_KEYS_MANAGE) || 
             userPermissions.permissions?.includes(SystemPermission.API_KEYS_EDIT) ||
             userPermissions.permissions?.includes(SystemPermission.API_KEYS_DELETE) ||
             userPermissions.permissions?.includes(SystemPermission.SYSTEM_ADMIN) || 
             false;
    } catch (error) {
      logger.error('Error checking API key management permissions', { error, userId });
      return false; // Fail closed for security
    }
  }

  /**
   * Get API keys created by a specific user
   */
  async getApiKeysByUser(userId: number, options?: ServiceOptions): Promise<ApiKeyResponseDto[]> {
    try {
      const apiKeys = await this.apiKeyRepository.findByCreator(userId);
      return await Promise.all(apiKeys.map(key => this.mapToResponseDto(key)));
    } catch (error) {
      logger.error('Error getting API keys by user', { error, userId });
      throw new AppError(`Failed to get API keys by user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verify API key ownership
   */
  async verifyOwnership(apiKeyId: number, userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const apiKey = await this.apiKeyRepository.findById(apiKeyId);
      return apiKey?.createdBy === userId;
    } catch (error) {
      logger.error('Error verifying ownership', { error, apiKeyId, userId });
      return false;
    }
  }

  /**
   * Clean up expired and revoked API keys
   */
  async cleanupOldKeys(olderThanDays: number = 90, options?: ServiceOptions): Promise<number> {
    try {
      return await this.apiKeyRepository.cleanupOldKeys(olderThanDays);
    } catch (error) {
      logger.error('Error cleaning up old keys', { error, olderThanDays });
      throw new AppError(`Failed to cleanup old keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Base service implementations
  async create(data: CreateApiKeyDto, options?: ServiceOptions): Promise<ApiKeyResponseDto> {
    const result = await this.createApiKey(data, options);
    return result.apiKey;
  }

  async update(id: number, data: UpdateApiKeyDto, options?: ServiceOptions): Promise<ApiKeyResponseDto> {
    const apiKey = await this.apiKeyRepository.findById(id);
    if (!apiKey) {
      throw new AppError('API key not found', 404);
    }

    // Update fields
    if (data.name !== undefined) apiKey.name = data.name;
    if (data.description !== undefined) apiKey.description = data.description;
    if (data.status !== undefined) apiKey.status = data.status;
    if (data.expiresAt !== undefined) apiKey.expiresAt = data.expiresAt;
    
    apiKey.updatedAt = new Date();
    apiKey.updatedBy = options?.userId;

    const updated = await this.apiKeyRepository.update(id, apiKey);
    return this.mapToResponseDto(updated);
  }

  async findById(id: number, options?: ServiceOptions): Promise<ApiKeyResponseDto | null> {
    const apiKey = await this.apiKeyRepository.findById(id);
    return apiKey ? this.mapToResponseDto(apiKey) : null;
  }

  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    return await this.apiKeyRepository.delete(id);
  }

  /**
   * Implementation of toDTO required by BaseService
   */
  toDTO(entity: ApiKey): ApiKeyResponseDto {
    return {
      id: entity.id!,
      name: entity.name,
      description: entity.description,
      keyPrefix: entity.keyPrefix,
      keyPreview: entity.keyPreview,
      type: entity.type,
      status: entity.status,
      environment: entity.environment,
      expiresAt: entity.expiresAt?.toISOString(),
      lastUsedAt: entity.lastUsedAt?.toISOString(),
      lastUsedIp: entity.lastUsedIp,
      usageCount: entity.usageCount,
      revokedAt: entity.revokedAt?.toISOString(),
      revokedReason: entity.revokedReason,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      createdBy: entity.createdBy,
      permissions: undefined, // Will be populated separately for standard keys
      isActive: entity.isActive(),
      isExpired: entity.isExpired(),
      isExpiringSoon: entity.isExpiringSoon(),
      daysUntilExpiration: entity.getDaysUntilExpiration()
    };
  }

  /**
   * Implementation of toEntity required by BaseService
   */
  protected toEntity(dto: CreateApiKeyDto | UpdateApiKeyDto, existingEntity?: ApiKey): Partial<ApiKey> {
    const entity: Partial<ApiKey> = {};
    
    if ('name' in dto && dto.name) entity.name = dto.name;
    if ('description' in dto) entity.description = dto.description;
    if ('type' in dto && dto.type) entity.type = dto.type;
    if ('environment' in dto && dto.environment) entity.environment = dto.environment;
    if ('expiresAt' in dto) entity.expiresAt = dto.expiresAt;
    if ('status' in dto) entity.status = dto.status;
    
    return entity;
  }

  /**
   * Implementation of getCreateValidationSchema required by BaseService
   */
  protected getCreateValidationSchema(): any {
    return {
      name: { required: true, type: 'string', minLength: 1, maxLength: 255 },
      description: { required: false, type: 'string', maxLength: 1000 },
      type: { required: true, type: 'string', enum: Object.values(ApiKeyType) },
      environment: { required: true, type: 'string', enum: Object.values(ApiKeyEnvironment) },
      expiresAt: { required: false, type: 'date' },
      permissions: { required: false, type: 'array' }
    };
  }

  /**
   * Implementation of getUpdateValidationSchema required by BaseService
   */
  protected getUpdateValidationSchema(): any {
    return {
      name: { required: false, type: 'string', minLength: 1, maxLength: 255 },
      description: { required: false, type: 'string', maxLength: 1000 },
      status: { required: false, type: 'string', enum: Object.values(ApiKeyStatus) },
      expiresAt: { required: false, type: 'date' },
      permissions: { required: false, type: 'array' }
    };
  }

  /**
   * Map API key entity to response DTO with permissions
   */
  private async mapToResponseDto(apiKey: ApiKey): Promise<ApiKeyResponseDto> {
    // Get permissions if it's a standard key
    let permissions: string[] = [];
    if (apiKey.type === ApiKeyType.STANDARD && apiKey.id) {
      try {
        permissions = await this.apiKeyRepository.getApiKeyPermissions(apiKey.id);
      } catch (error) {
        logger.warn('Failed to get permissions for API key', { error, apiKeyId: apiKey.id });
      }
    }

    const baseDto = this.toDTO(apiKey);
    return {
      ...baseDto,
      permissions: apiKey.type === ApiKeyType.STANDARD ? permissions : undefined
    };
  }
}
