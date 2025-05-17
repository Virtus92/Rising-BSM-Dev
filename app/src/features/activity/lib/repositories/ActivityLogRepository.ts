import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IActivityLogRepository } from '@/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/domain/entities/ActivityLog';
import { EntityType } from '@/domain/enums/EntityTypes';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Implementation of the ActivityLogRepository
 * 
 * Manages activity log persistence with Prisma ORM
 */
export class ActivityLogRepository extends PrismaRepository<ActivityLog, number> implements IActivityLogRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler service
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // 'userActivity' is the model name in Prisma
    super(prisma, 'userActivity', logger, errorHandler);
    
    this.logger.debug('Initialized ActivityLogRepository');
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
    // Map domain entity properties to Prisma entity properties
    if (criteria.userId !== undefined) {
      processedCriteria.userId = criteria.userId;
    }
    
    // Since entityType might not exist as a direct field in the Prisma schema,
    // we handle it through the details JSON field
    if (criteria.entityType !== undefined) {
      processedCriteria.details = {
        contains: `"entityType":"${criteria.entityType}"`
      };
    }
    
    // Since entityId might not exist as a direct field in the Prisma schema,
    // we handle it through the details JSON field similarly to entityType
    if (criteria.entityId !== undefined) {
      // If details already has conditions, we need to merge them
      if (processedCriteria.details) {
        // This is a simplistic approach; consider using a more robust JSON filter if available
        processedCriteria.details.contains = processedCriteria.details.contains + `,"entityId":${criteria.entityId}`;
      } else {
        processedCriteria.details = {
          contains: `"entityId":${criteria.entityId}`
        };
      }
    }
    
    if (criteria.action !== undefined) {
      processedCriteria.activity = criteria.action;
    }
    
    if (criteria.createdAt !== undefined) {
      processedCriteria.timestamp = criteria.createdAt;
    }
    
    // Handle search in details or action
    if (criteria.search) {
      processedCriteria.OR = [
        { details: { contains: criteria.search, mode: 'insensitive' } },
        { activity: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    
    // Date range filtering
    if (criteria.startDate || criteria.endDate) {
      processedCriteria.timestamp = processedCriteria.timestamp || {};
      
      if (criteria.startDate) {
        processedCriteria.timestamp.gte = new Date(criteria.startDate);
      }
      
      if (criteria.endDate) {
        processedCriteria.timestamp.lte = new Date(criteria.endDate);
      }
    }
    
    return processedCriteria;
  }

  /**
   * Find log entries for a specific entity
   * 
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @returns Promise with log entries
   */
  async findByEntity(entityType: EntityType, entityId: number): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        where: {
          // Use the details field for entityType and entityId since they may not exist as direct fields
          details: {
            contains: JSON.stringify({ entityType, entityId }).slice(1, -1) // Remove outer braces for partial match
          }
        },
        orderBy: { timestamp: 'desc' } // Fixed field name
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findByEntity', { error, entityType, entityId });
      throw this.handleError(error);
    }
  }

  /**
   * Find log entries for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @returns Promise with log entries
   */
  async findByUser(userId: number, limit?: number): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' }, // Fixed field name
        take: limit
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findByUser', { error, userId, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Find log entries for a specific action
   * 
   * @param action - Action type
   * @param limit - Maximum number of results
   * @returns Promise with log entries
   */
  async findByAction(action: string, limit?: number): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        where: { activity: action },
        orderBy: { timestamp: 'desc' }, // Fixed field name
        take: limit
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findByAction', { error, action, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Find the latest log entries
   * 
   * @param limit - Maximum number of results
   * @returns Promise with latest log entries
   */
  async findLatest(limit: number = 10): Promise<ActivityLog[]> {
    try {
      const logs = await this.prisma.userActivity.findMany({
        orderBy: { timestamp: 'desc' }, // Fixed field name
        take: limit
      });
      
      return logs.map(log => this.mapToDomainEntity(log));
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.findLatest', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new log entry
   * 
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param userId - User ID
   * @param action - Action type
   * @param details - Details
   * @returns Promise with created log entry
   */
  async createLog(
    entityType: EntityType,
    entityId: number,
    userId: number | undefined,
    action: string,
    details?: Record<string, any>
  ): Promise<ActivityLog> {
    try {
      this.logger.debug(`Creating activity log: ${action} for ${entityType} ${entityId}`);
      
      // Load user if available
      let userName = 'System';
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });
        if (user) {
          userName = user.name;
        }
      }
      
      // Create the log entry
      const log = await this.prisma.userActivity.create({
        data: {
          // Use object with proper Prisma schema fields, ensuring userId is never undefined
          userId: userId || 0, // Default to 0 if userId is undefined
          activity: action,
          // Store entity information in the details field since it doesn't exist as direct fields
          details: JSON.stringify({
            entityType,
            entityId,
            ...(details ? details : {})
          }),
          timestamp: new Date()
        }
      });
      
      // Convert to domain entity
      return this.mapToDomainEntity({
        ...log,
        userName
      });
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.createLog', { 
        error, 
        entityType, 
        entityId, 
        userId, 
        action 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Delete all log entries for a specific entity
   * 
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @returns Promise with number of deleted entries
   */
  async deleteByEntity(entityType: EntityType, entityId: number): Promise<number> {
    try {
      // First find all matching records using the details field
      const logs = await this.prisma.userActivity.findMany({
        where: {
          details: {
            contains: JSON.stringify({ entityType, entityId }).slice(1, -1)
          }
        },
        select: { id: true }
      });
      
      // Then delete them by ID if any were found
      if (logs.length === 0) {
        return 0;
      }
      
      const result = await this.prisma.userActivity.deleteMany({
        where: {
          id: { in: logs.map(log => log.id) }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.deleteByEntity', { error, entityType, entityId });
      throw this.handleError(error);
    }
  }

  /**
   * Delete old log entries
   * 
   * @param olderThan - Date before which entries should be deleted
   * @returns Promise with number of deleted entries
   */
  async deleteOldLogs(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.userActivity.deleteMany({
        where: {
          timestamp: { // Fixed field name
            lt: olderThan
          }
        }
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.deleteOldLogs', { error, olderThan });
      throw this.handleError(error);
    }
  }

  /**
   * Search in log entries
   * 
   * @param searchText - Search term
   * @param filters - Filter options
   * @returns Promise with found log entries and pagination
   */
  async searchLogs(
    searchText: string,
    filters?: {
      entityType?: EntityType;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    }
  ): Promise<PaginationResult<ActivityLog>> {
    try {
      // Build WHERE conditions
      const where: any = {};
      
      // Add search text
      if (searchText) {
        where.OR = [
          { details: { contains: searchText, mode: 'insensitive' } },
          { activity: { contains: searchText, mode: 'insensitive' } }
        ];
      }
      
      // Add filter criteria
      if (filters) {
        if (filters.entityType) {
          // Handle entityType through the details field
          if (!where.OR) {
            where.OR = [];
          }
          where.OR.push({ 
            details: { 
              contains: `"entityType":"${filters.entityType}"` 
            } 
          });
        }
        
        if (filters.userId) {
          where.userId = filters.userId;
        }
        
        if (filters.actions && filters.actions.length > 0) {
          where.activity = { in: filters.actions };
        }
        
        // Add date range
        if (filters.startDate || filters.endDate) {
          where.timestamp = {}; // Fixed field name
          
          if (filters.startDate) {
            where.timestamp.gte = filters.startDate;
          }
          
          if (filters.endDate) {
            where.timestamp.lte = filters.endDate;
          }
        }
      }
      
      // Calculate pagination
      const page = 1; // Default page
      const limit = 20; // Default limit
      const skip = (page - 1) * limit;
      
      // Execute queries
      const [total, logs] = await Promise.all([
        // Count query for total
        this.prisma.userActivity.count({ where }),
        // Data query with pagination
        this.prisma.userActivity.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' }, // Fixed field name
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        })
      ]);
      
      // Map to domain entities
      const data = logs.map(log => {
        // Add username if available
        const logWithUserName = {
          ...log,
          userName: log.user?.name || 'System'
        };
        
        return this.mapToDomainEntity(logWithUserName);
      });
      
      // Calculate pagination information
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.searchLogs', { error, searchText, filters });
      throw this.handleError(error);
    }
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
      this.logger.info(`Logging activity for user ${userId}: ${actionType}`);
      
      return await this.createLog(
        EntityType.USER,
        userId,
        userId,
        actionType,
        details ? { details, ipAddress } : { ipAddress }
      );
    } catch (error) {
      this.logger.error('Error in ActivityLogRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      return null;
    }
  }

  /**
   * Map an ORM entity to a domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  /**
   * Extract EntityType from the details field
   * 
   * @param ormEntity - ORM entity
   * @returns EntityType or undefined
   */
  private extractEntityTypeFromDetails(ormEntity: any): EntityType | undefined {
    if (!ormEntity.details) {
      return undefined;
    }
    
    try {
      const details = typeof ormEntity.details === 'string'
        ? JSON.parse(ormEntity.details)
        : ormEntity.details;
      
      if (details.entityType) {
        return details.entityType as EntityType;
      }
      
      return undefined;
    } catch (e) {
      return undefined;
    }
  }
  
  /**
   * Extract EntityId from the details field
   * 
   * @param ormEntity - ORM entity
   * @returns EntityId or undefined
   */
  private extractEntityIdFromDetails(ormEntity: any): number | undefined {
    if (!ormEntity.details) {
      return undefined;
    }
    
    try {
      const details = typeof ormEntity.details === 'string'
        ? JSON.parse(ormEntity.details)
        : ormEntity.details;
      
      if (details.entityId) {
        return details.entityId as number;
      }
      
      return undefined;
    } catch (e) {
      return undefined;
    }
  }

  protected mapToDomainEntity(ormEntity: any): ActivityLog {
    if (!ormEntity) {
      throw new Error('Cannot map null or undefined ORM entity to ActivityLog');
    }
    
    // Parse details from JSON string if available
    let details: Record<string, any> | undefined;
    if (ormEntity.details) {
      try {
        details = typeof ormEntity.details === 'string' 
          ? JSON.parse(ormEntity.details) 
          : ormEntity.details;
        
        // Remove entityType and entityId from details if they exist
        // as they will be set as separate properties
        if (details) {
          const { entityType, entityId, ...restDetails } = details;
          details = restDetails;
        }
      } catch (e) {
        // For JSON parsing errors, use the string as details
        details = { text: ormEntity.details };
      }
    }
    
    return new ActivityLog({
      id: ormEntity.id,
      // Extract entityType and entityId from details if not available directly
      entityType: ormEntity.type || this.extractEntityTypeFromDetails(ormEntity) || EntityType.USER,
      entityId: ormEntity.entityId || this.extractEntityIdFromDetails(ormEntity) || 0,
      userId: ormEntity.userId,
      action: ormEntity.activity,
      details,
      createdAt: ormEntity.timestamp || new Date(), // Fixed field name
      updatedAt: ormEntity.timestamp || new Date() // Fixed field name
    });
  }

  /**
   * Map a domain entity to an ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<ActivityLog>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    // Map properties
    if (domainEntity.entityType !== undefined) result.type = domainEntity.entityType; // Fixed field name
    if (domainEntity.entityId !== undefined) result.entityId = domainEntity.entityId;
    if (domainEntity.userId !== undefined) result.userId = domainEntity.userId;
    if (domainEntity.action !== undefined) result.activity = domainEntity.action;
    
    // Convert details to JSON if available
    if (domainEntity.details !== undefined) {
      result.details = typeof domainEntity.details === 'string' 
        ? domainEntity.details 
        : JSON.stringify(domainEntity.details);
    }
    
    // Set timestamp
    const timestamp = new Date();
    if (domainEntity.createdAt) {
      result.timestamp = domainEntity.createdAt;
    } else if (!result.id) {
      result.timestamp = timestamp;
    }
    
    return result;
  }
}