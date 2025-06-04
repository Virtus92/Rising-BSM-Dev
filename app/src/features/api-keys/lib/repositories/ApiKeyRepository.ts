import 'server-only';

import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IApiKeyRepository } from '@/domain/repositories/IApiKeyRepository';
import { ApiKey, ApiKeyType, ApiKeyStatus, ApiKeyEnvironment } from '@/domain/entities/ApiKey';
import { ApiKeyFilterParamsDto } from '@/domain/dtos/ApiKeyDtos';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';
import { AppError } from '@/core/errors';
import { getPrismaClient } from '@/core/db/prisma/server-client';

const logger = getLogger();
const errorHandler = getErrorHandler();

/**
 * API Key Repository Implementation
 * 
 * Handles all database operations for API keys using Prisma.
 */
export class ApiKeyRepository extends PrismaRepository<ApiKey, number> implements IApiKeyRepository {
  /**
   * Constructor
   */
  constructor() {
    const prisma = getPrismaClient();
    super(prisma, 'apiKey', logger, errorHandler);
    logger.debug('ApiKeyRepository initialized');
  }

  /**
   * Implementation of logActivityImplementation required by PrismaRepository
   */
  protected async logActivityImplementation(
    userId: number,
    actionType: string,
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      // Log activity using the activity log model if it exists
      // For now, we'll just log to console since the ActivityLog model might not be set up
      this.logger.info('API Key Activity', {
        userId,
        actionType,
        details,
        ipAddress,
        timestamp: new Date().toISOString()
      });
      return { logged: true };
    } catch (error) {
      this.logger.error('Failed to log activity', { error, userId, actionType });
      return null; // Activity logging failures should not break the main operation
    }
  }

  /**
   * Implementation of processCriteria required by PrismaRepository
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processed: any = {};
    
    // Convert domain criteria to Prisma where clause
    Object.keys(criteria).forEach(key => {
      const value = criteria[key];
      
      switch (key) {
        case 'search':
          if (value) {
            processed.OR = [
              { name: { contains: value, mode: 'insensitive' } },
              { description: { contains: value, mode: 'insensitive' } }
            ];
          }
          break;
        case 'type':
        case 'status':
        case 'environment':
        case 'createdBy':
          processed[key] = value;
          break;
        default:
          processed[key] = value;
      }
    });
    
    return processed;
  }

  /**
   * Implementation of mapToDomainEntity required by PrismaRepository
   */
  protected mapToDomainEntity(ormEntity: any): ApiKey {
    return new ApiKey({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description,
      keyPrefix: ormEntity.keyPrefix,
      keyHash: ormEntity.keyHash,
      keyPreview: ormEntity.keyPreview,
      type: ormEntity.type as ApiKeyType,
      status: ormEntity.status as ApiKeyStatus,
      environment: ormEntity.environment as ApiKeyEnvironment,
      expiresAt: ormEntity.expiresAt,
      lastUsedAt: ormEntity.lastUsedAt,
      lastUsedIp: ormEntity.lastUsedIp,
      usageCount: ormEntity.usageCount,
      revokedAt: ormEntity.revokedAt,
      revokedBy: ormEntity.revokedBy,
      revokedReason: ormEntity.revokedReason,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
  }

  /**
   * Implementation of mapToORMEntity required by PrismaRepository
   */
  protected mapToORMEntity(domainEntity: Partial<ApiKey>): any {
    const data = domainEntity as any;
    // Remove id for create operations
    const { id, ...createData } = data;
    return createData;
  }

  /**
   * Find an API key by its hash
   */
  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    try {
      const prismaClient = this.prisma;
      
      logger.debug('Finding API key by hash', { keyHash: keyHash.substring(0, 8) + '...' });
      
      const apiKey = await prismaClient.apiKey.findUnique({
        where: { keyHash },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      if (apiKey) {
        logger.debug('Found API key by hash', { 
          id: apiKey.id, 
          name: apiKey.name, 
          type: apiKey.type,
          permissionsCount: apiKey.permissions?.length || 0
        });
      } else {
        logger.debug('API key not found by hash');
      }

      return apiKey ? this.mapToDomainEntity(apiKey) : null;
    } catch (error) {
      logger.error('Error finding API key by hash', { error, keyHash: keyHash.substring(0, 8) + '...' });
      throw new AppError(`Failed to find API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys with filtering and pagination
   */
  async findApiKeys(filters: ApiKeyFilterParamsDto): Promise<PaginationResult<ApiKey>> {
    try {
      const prismaClient = this.prisma;
      
      logger.debug('Finding API keys with filters', { filters });
      
      // Build where clause
      const where: any = {};
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.environment) {
        where.environment = filters.environment;
      }
      
      if (filters.createdBy) {
        where.createdBy = filters.createdBy;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Handle expiration filter
      if (filters.expirationFilter) {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        switch (filters.expirationFilter) {
          case 'expired':
            where.expiresAt = { lt: now };
            break;
          case 'expiring_soon':
            where.expiresAt = { 
              gte: now,
              lte: weekFromNow
            };
            break;
          case 'never_expires':
            where.expiresAt = null;
            break;
        }
      }

      // Build order by clause
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100); // Max 100 items per page
      const skip = (page - 1) * limit;

      logger.debug('Executing API key query', { where, orderBy, page, limit, skip });

      // Execute queries
      const [items, total] = await Promise.all([
        prismaClient.apiKey.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            },
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }),
        prismaClient.apiKey.count({ where })
      ]);

      logger.debug('API key query results', { 
        itemCount: items.length, 
        total, 
        itemsWithPermissions: items.filter(item => item.permissions && item.permissions.length > 0).length
      });

      const domainEntities = items.map((item: any) => {
        logger.debug('Mapping API key item', { 
          id: item.id, 
          name: item.name, 
          type: item.type,
          permissionsCount: item.permissions?.length || 0,
          permissions: item.permissions?.map((p: any) => p.permission?.code) || []
        });
        return this.mapToDomainEntity(item);
      });

      return {
        data: domainEntities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding API keys with filters', { error, filters });
      throw new AppError(`Failed to find API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys by creator user ID
   */
  async findByCreator(userId: number): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const apiKeys = await prismaClient.apiKey.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding API keys by creator', { error, userId });
      throw new AppError(`Failed to find API keys by creator: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys by type
   */
  async findByType(type: ApiKeyType): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const apiKeys = await prismaClient.apiKey.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding API keys by type', { error, type });
      throw new AppError(`Failed to find API keys by type: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys by status
   */
  async findByStatus(status: ApiKeyStatus): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const apiKeys = await prismaClient.apiKey.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding API keys by status', { error, status });
      throw new AppError(`Failed to find API keys by status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys by environment
   */
  async findByEnvironment(environment: ApiKeyEnvironment): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const apiKeys = await prismaClient.apiKey.findMany({
        where: { environment },
        orderBy: { createdAt: 'desc' }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding API keys by environment', { error, environment });
      throw new AppError(`Failed to find API keys by environment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys that are expiring soon
   */
  async findExpiringSoon(days: number): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const apiKeys = await prismaClient.apiKey.findMany({
        where: {
          status: ApiKeyStatus.ACTIVE,
          expiresAt: {
            gte: now,
            lte: futureDate
          }
        },
        orderBy: { expiresAt: 'asc' }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding expiring API keys', { error, days });
      throw new AppError(`Failed to find expiring API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find API keys that haven't been used recently
   */
  async findUnusedKeys(days: number): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const apiKeys = await prismaClient.apiKey.findMany({
        where: {
          status: ApiKeyStatus.ACTIVE,
          OR: [
            { lastUsedAt: null },
            { lastUsedAt: { lt: cutoffDate } }
          ]
        },
        orderBy: { lastUsedAt: 'asc' }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding unused API keys', { error, days });
      throw new AppError(`Failed to find unused API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find expired API keys
   */
  async findExpiredKeys(): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const now = new Date();

      const apiKeys = await prismaClient.apiKey.findMany({
        where: {
          expiresAt: { lt: now }
        },
        orderBy: { expiresAt: 'desc' }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding expired API keys', { error });
      throw new AppError(`Failed to find expired API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update API key usage information
   */
  async updateUsage(keyHash: string, ipAddress?: string): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      const updateData: any = {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 }
      };
      
      if (ipAddress) {
        updateData.lastUsedIp = ipAddress;
      }

      const result = await prismaClient.apiKey.updateMany({
        where: { keyHash },
        data: updateData
      });

      return result.count > 0;
    } catch (error) {
      logger.error('Error updating API key usage', { error, keyHash: keyHash.substring(0, 8) + '...', ipAddress });
      // Don't throw error for usage tracking - it shouldn't break the request
      return false;
    }
  }

  /**
   * Get API key permissions
   */
  async getApiKeyPermissions(apiKeyId: number): Promise<string[]> {
    try {
      const prismaClient = this.prisma;
      
      logger.debug('Fetching permissions for API key', { apiKeyId });
      
      const permissions = await prismaClient.apiKeyPermission.findMany({
        where: { apiKeyId },
        include: {
          permission: true
        }
      });
      
      const permissionCodes = permissions.map((p: any) => p.permission.code);
      
      logger.debug('Retrieved API key permissions from database', { 
        apiKeyId, 
        rawCount: permissions.length,
        permissionCodes,
        rawPermissions: permissions.map(p => ({ id: p.id, permissionId: p.permissionId, code: p.permission.code }))
      });

      return permissionCodes;
    } catch (error) {
      logger.error('Error getting API key permissions', { error, apiKeyId });
      throw new AppError(`Failed to get API key permissions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update API key permissions
   */
  async updateApiKeyPermissions(apiKeyId: number, permissions: string[], grantedBy?: number): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      logger.debug('Updating API key permissions', { apiKeyId, permissions, grantedBy });
      
      await prismaClient.$transaction(async (tx: any) => {
        // Remove existing permissions
        const deleteResult = await tx.apiKeyPermission.deleteMany({
          where: { apiKeyId }
        });
        logger.debug('Deleted existing permissions', { apiKeyId, deletedCount: deleteResult.count });
        
        // Get permission IDs
        const permissionRecords = await tx.permission.findMany({
          where: { code: { in: permissions } },
          select: { id: true, code: true }
        });
        
        logger.debug('Found permission records', { 
          requestedPermissions: permissions,
          foundPermissions: permissionRecords.map(p => p.code),
          missingPermissions: permissions.filter(p => !permissionRecords.some(pr => pr.code === p))
        });
        
        // Create new permissions
        if (permissionRecords.length > 0) {
          const permissionData = permissionRecords.map((p: any) => ({
            apiKeyId,
            permissionId: p.id,
            grantedBy
          }));
          
          const createResult = await tx.apiKeyPermission.createMany({
            data: permissionData
          });
          
          logger.debug('Created new permissions', { apiKeyId, createdCount: createResult.count, permissionData });
        }
      });

      logger.debug('Successfully updated API key permissions', { apiKeyId, permissions });
      return true;
    } catch (error) {
      logger.error('Error updating API key permissions', { error, apiKeyId, permissions });
      throw new AppError(`Failed to update API key permissions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a permission to an API key
   */
  async addApiKeyPermission(apiKeyId: number, permissionCode: string, grantedBy?: number): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      // Get permission ID
      const permission = await prismaClient.permission.findUnique({
        where: { code: permissionCode }
      });
      
      if (!permission) {
        throw new AppError(`Permission '${permissionCode}' not found`);
      }
      
      // Create permission assignment
      await prismaClient.apiKeyPermission.create({
        data: {
          apiKeyId,
          permissionId: permission.id,
          grantedBy
        }
      });

      return true;
    } catch (error) {
      logger.error('Error adding API key permission', { error, apiKeyId, permissionCode });
      throw new AppError(`Failed to add API key permission: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a permission from an API key
   */
  async removeApiKeyPermission(apiKeyId: number, permissionCode: string): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      // Get permission ID
      const permission = await prismaClient.permission.findUnique({
        where: { code: permissionCode }
      });
      
      if (!permission) {
        return false; // Permission doesn't exist, consider it already removed
      }
      
      // Remove permission assignment
      const result = await prismaClient.apiKeyPermission.deleteMany({
        where: {
          apiKeyId,
          permissionId: permission.id
        }
      });

      return result.count > 0;
    } catch (error) {
      logger.error('Error removing API key permission', { error, apiKeyId, permissionCode });
      throw new AppError(`Failed to remove API key permission: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if an API key has a specific permission
   */
  async hasPermission(apiKeyId: number, permissionCode: string): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      const permission = await prismaClient.apiKeyPermission.findFirst({
        where: {
          apiKeyId,
          permission: {
            code: permissionCode
          }
        }
      });

      return !!permission;
    } catch (error) {
      logger.error('Error checking API key permission', { error, apiKeyId, permissionCode });
      return false;
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: number, revokedBy: number, reason?: string): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      const result = await prismaClient.apiKey.update({
        where: { id: apiKeyId },
        data: {
          status: ApiKeyStatus.REVOKED,
          revokedAt: new Date(),
          revokedBy,
          revokedReason: reason,
          updatedAt: new Date(),
          updatedBy: revokedBy
        }
      });

      return !!result;
    } catch (error) {
      logger.error('Error revoking API key', { error, apiKeyId, revokedBy });
      throw new AppError(`Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Activate an API key
   */
  async activateApiKey(apiKeyId: number, updatedBy: number): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      const result = await prismaClient.apiKey.update({
        where: { 
          id: apiKeyId,
          status: { not: ApiKeyStatus.REVOKED } // Can't activate revoked keys
        },
        data: {
          status: ApiKeyStatus.ACTIVE,
          updatedAt: new Date(),
          updatedBy
        }
      });

      return !!result;
    } catch (error) {
      logger.error('Error activating API key', { error, apiKeyId, updatedBy });
      throw new AppError(`Failed to activate API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Deactivate an API key
   */
  async deactivateApiKey(apiKeyId: number, updatedBy: number): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      const result = await prismaClient.apiKey.update({
        where: { 
          id: apiKeyId,
          status: { not: ApiKeyStatus.REVOKED } // Can't deactivate revoked keys
        },
        data: {
          status: ApiKeyStatus.INACTIVE,
          updatedAt: new Date(),
          updatedBy
        }
      });

      return !!result;
    } catch (error) {
      logger.error('Error deactivating API key', { error, apiKeyId, updatedBy });
      throw new AppError(`Failed to deactivate API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update API key expiration
   */
  async updateExpiration(apiKeyId: number, expiresAt: Date | null, updatedBy: number): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      const result = await prismaClient.apiKey.update({
        where: { id: apiKeyId },
        data: {
          expiresAt,
          updatedAt: new Date(),
          updatedBy
        }
      });

      return !!result;
    } catch (error) {
      logger.error('Error updating API key expiration', { error, apiKeyId, expiresAt, updatedBy });
      throw new AppError(`Failed to update API key expiration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get usage statistics for all API keys
   */
  async getUsageStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    revokedKeys: number;
    expiredKeys: number;
    expiringSoonKeys: number;
    adminKeys: number;
    standardKeys: number;
    totalUsage: number;
  }> {
    try {
      const prismaClient = this.prisma;
      
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [
        totalKeys,
        activeKeys,
        inactiveKeys,
        revokedKeys,
        expiredKeys,
        expiringSoonKeys,
        adminKeys,
        standardKeys,
        usageAggregate
      ] = await Promise.all([
        prismaClient.apiKey.count(),
        prismaClient.apiKey.count({ where: { status: ApiKeyStatus.ACTIVE } }),
        prismaClient.apiKey.count({ where: { status: ApiKeyStatus.INACTIVE } }),
        prismaClient.apiKey.count({ where: { status: ApiKeyStatus.REVOKED } }),
        prismaClient.apiKey.count({ where: { expiresAt: { lt: now } } }),
        prismaClient.apiKey.count({ 
          where: { 
            expiresAt: { gte: now, lte: weekFromNow },
            status: ApiKeyStatus.ACTIVE
          } 
        }),
        prismaClient.apiKey.count({ where: { type: ApiKeyType.ADMIN } }),
        prismaClient.apiKey.count({ where: { type: ApiKeyType.STANDARD } }),
        prismaClient.apiKey.aggregate({
          _sum: { usageCount: true }
        })
      ]);

      return {
        totalKeys,
        activeKeys,
        inactiveKeys,
        revokedKeys,
        expiredKeys,
        expiringSoonKeys,
        adminKeys,
        standardKeys,
        totalUsage: usageAggregate._sum.usageCount || 0
      };
    } catch (error) {
      logger.error('Error getting usage statistics', { error });
      throw new AppError(`Failed to get usage statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get most recently used API keys
   */
  async getRecentlyUsedKeys(limit: number): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const apiKeys = await prismaClient.apiKey.findMany({
        where: {
          lastUsedAt: { not: null }
        },
        orderBy: { lastUsedAt: 'desc' },
        take: limit
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error getting recently used keys', { error, limit });
      throw new AppError(`Failed to get recently used keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Bulk update API key status
   */
  async bulkUpdateStatus(apiKeyIds: number[], status: ApiKeyStatus, updatedBy: number, reason?: string): Promise<number> {
    try {
      const prismaClient = this.prisma;
      
      const updateData: any = {
        status,
        updatedAt: new Date(),
        updatedBy
      };
      
      if (status === ApiKeyStatus.REVOKED) {
        updateData.revokedAt = new Date();
        updateData.revokedBy = updatedBy;
        if (reason) {
          updateData.revokedReason = reason;
        }
      }

      const result = await prismaClient.apiKey.updateMany({
        where: { 
          id: { in: apiKeyIds },
          // Don't allow changing status of already revoked keys unless we're revoking
          ...(status !== ApiKeyStatus.REVOKED && { status: { not: ApiKeyStatus.REVOKED } })
        },
        data: updateData
      });

      return result.count;
    } catch (error) {
      logger.error('Error bulk updating API key status', { error, apiKeyIds, status, updatedBy });
      throw new AppError(`Failed to bulk update API key status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up old API keys
   */
  async cleanupOldKeys(olderThanDays: number): Promise<number> {
    try {
      const prismaClient = this.prisma;
      
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      const result = await prismaClient.apiKey.deleteMany({
        where: {
          OR: [
            {
              status: ApiKeyStatus.REVOKED,
              revokedAt: { lt: cutoffDate }
            },
            {
              expiresAt: { lt: cutoffDate }
            }
          ]
        }
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old API keys', { error, olderThanDays });
      throw new AppError(`Failed to clean up old API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search API keys by text
   */
  async search(searchText: string, limit: number = 50): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const apiKeys = await prismaClient.apiKey.findMany({
        where: {
          OR: [
            { name: { contains: searchText, mode: 'insensitive' } },
            { description: { contains: searchText, mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error searching API keys', { error, searchText, limit });
      throw new AppError(`Failed to search API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Count API keys by criteria
   */
  async countByCriteria(criteria: Partial<{
    type: ApiKeyType;
    status: ApiKeyStatus;
    environment: ApiKeyEnvironment;
    createdBy: number;
  }>): Promise<number> {
    try {
      const prismaClient = this.prisma;
      
      const where: any = {};
      
      if (criteria.type) where.type = criteria.type;
      if (criteria.status) where.status = criteria.status;
      if (criteria.environment) where.environment = criteria.environment;
      if (criteria.createdBy) where.createdBy = criteria.createdBy;

      return await prismaClient.apiKey.count({ where });
    } catch (error) {
      logger.error('Error counting API keys by criteria', { error, criteria });
      throw new AppError(`Failed to count API keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if API key name is unique
   */
  async isNameUnique(name: string, excludeId?: number): Promise<boolean> {
    try {
      const prismaClient = this.prisma;
      
      const where: any = { name };
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const count = await prismaClient.apiKey.count({ where });
      return count === 0;
    } catch (error) {
      logger.error('Error checking API key name uniqueness', { error, name, excludeId });
      throw new AppError(`Failed to check name uniqueness: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get API keys created in a date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ApiKey[]> {
    try {
      const prismaClient = this.prisma;
      
      const apiKeys = await prismaClient.apiKey.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return apiKeys.map((key: any) => this.mapToDomainEntity(key));
    } catch (error) {
      logger.error('Error finding API keys by date range', { error, startDate, endDate });
      throw new AppError(`Failed to find API keys by date range: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get API key usage history
   */
  async getUsageHistory(apiKeyId: number, days: number): Promise<Array<{
    date: Date;
    usageCount: number;
    lastUsedIp?: string;
  }>> {
    try {
      // This is a simplified implementation
      // In a real application, you'd want to track usage history in a separate table
      const prismaClient = this.prisma;
      
      const apiKey = await prismaClient.apiKey.findUnique({
        where: { id: apiKeyId },
        select: { usageCount: true, lastUsedAt: true, lastUsedIp: true }
      });

      if (!apiKey) {
        return [];
      }

      // For now, return the current usage as a single data point
      // TODO: Implement proper usage history tracking
      return [{
        date: apiKey.lastUsedAt || new Date(),
        usageCount: apiKey.usageCount,
        lastUsedIp: apiKey.lastUsedIp || undefined
      }];
    } catch (error) {
      logger.error('Error getting API key usage history', { error, apiKeyId, days });
      throw new AppError(`Failed to get usage history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the Prisma model name for this repository
   */
  protected getModelName(): string {
    return 'apiKey';
  }
}
