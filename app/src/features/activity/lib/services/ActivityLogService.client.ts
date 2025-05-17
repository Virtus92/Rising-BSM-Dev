'use client';
/**
 * Client-side Activity Log Service Implementation
 */
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ActivityLog } from '@/domain/entities/ActivityLog';
import { LogActionType } from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Client-side ActivityLogService implementation
 * This service uses API endpoints for all operations
 */
export class ActivityLogService implements IActivityLogService {
  /**
   * Creates a new log entry
   */
  async createLog(
    entityType: EntityType,
    entityId: number,
    userId: number | undefined,
    action: string,
    details?: Record<string, any>,
    options?: ServiceOptions
  ): Promise<ActivityLogDto> {
    try {
      const response = await fetch('/api/log/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, userId, action, details }),
      });
      
      if (!response.ok) {
        console.error('Error creating log:', await response.text());
        throw new Error('Failed to create activity log');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error in ActivityLogService.createLog:', error);
      // Return a placeholder entry
      return {
        id: 0,
        userId,
        action,
        entityType,
        entityId,
        details: typeof details === 'string' ? JSON.parse(details) : details || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }
  
  /**
   * Finds logs for a specific entity
   */
  async findByEntity(entityType: EntityType, entityId: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    return this.getEntityActivity(entityType, entityId, options?.limit);
  }
  
  /**
   * Finds logs for a specific user
   */
  async findByUser(userId: number, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    return this.getUserActivity(userId, limit);
  }
  
  /**
   * Finds logs for a specific action
   */
  async findByAction(action: string, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      const url = new URL('/api/activity/action', window.location.origin);
      url.searchParams.append('action', action);
      if (limit) url.searchParams.append('limit', String(limit));
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error fetching activity by action:', await response.text());
        return [];
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error in ActivityLogService.findByAction:', error);
      return [];
    }
  }
  
  /**
   * Gets the latest logs
   */
  async getLatest(limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    return this.getRecentActivity(limit || 10);
  }
  
  /**
   * Deletes logs for a specific entity
   */
  async deleteByEntity(entityType: EntityType, entityId: number, options?: ServiceOptions): Promise<number> {
    try {
      const url = new URL('/api/activity/entity', window.location.origin);
      url.searchParams.append('entityType', String(entityType));
      url.searchParams.append('entityId', String(entityId));
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error deleting activity by entity:', await response.text());
        return 0;
      }
      
      const result = await response.json();
      return result.data?.count || 0;
    } catch (error) {
      console.error('Error in ActivityLogService.deleteByEntity:', error);
      return 0;
    }
  }
  
  /**
   * Cleans up old logs
   */
  async cleanupOldLogs(olderThan: Date, options?: ServiceOptions): Promise<number> {
    try {
      const url = new URL('/api/activity/cleanup', window.location.origin);
      url.searchParams.append('olderThan', olderThan.toISOString());
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error cleaning up old logs:', await response.text());
        return 0;
      }
      
      const result = await response.json();
      return result.data?.count || 0;
    } catch (error) {
      console.error('Error in ActivityLogService.cleanupOldLogs:', error);
      return 0;
    }
  }
  
  /**
   * Searches logs
   */
  async searchLogs(
    searchText: string,
    filters?: {
      entityType?: EntityType;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    },
    options?: ServiceOptions
  ): Promise<PaginationResult<ActivityLogDto>> {
    try {
      const url = new URL('/api/activity/search', window.location.origin);
      url.searchParams.append('q', searchText);
      
      if (filters) {
        if (filters.entityType) url.searchParams.append('entityType', String(filters.entityType));
        if (filters.userId) url.searchParams.append('userId', String(filters.userId));
        if (filters.startDate) url.searchParams.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) url.searchParams.append('endDate', filters.endDate.toISOString());
        if (filters.actions && filters.actions.length > 0) {
          filters.actions.forEach(action => url.searchParams.append('action', action));
        }
      }
      
      if (options?.page) url.searchParams.append('page', String(options.page));
      if (options?.limit) url.searchParams.append('limit', String(options.limit));
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error searching logs:', await response.text());
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
      
      const result = await response.json();
      return result.data || {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error in ActivityLogService.searchLogs:', error);
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
  /**
   * Log activity action
   */
  async logActivity(
    userId: number,
    action: LogActionType,
    entityType: EntityType,
    entityId: number,
    details?: Record<string, any>,
    options?: ServiceOptions
  ): Promise<ActivityLogDto> {
    try {
      const response = await fetch('/api/log/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, entityType, entityId, details }),
      });
      
      if (!response.ok) {
        console.error('Error logging activity:', await response.text());
        throw new Error('Failed to log activity');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error in ActivityLogService.logActivity:', error);
      // Return a placeholder entry
      return {
        id: 0,
        userId,
        action,
        entityType,
        entityId,
        details: typeof details === 'string' ? JSON.parse(details) : details || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get activity logs for a user
   */
  async getUserActivity(userId: number, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      const url = new URL(`/api/users/${userId}/activity`, window.location.origin);
      if (limit) url.searchParams.append('limit', String(limit));
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error fetching user activity:', await response.text());
        return [];
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error in ActivityLogService.getUserActivity:', error);
      return [];
    }
  }
  
  /**
   * Get activity logs for an entity
   */
  async getEntityActivity(
    entityType: string,
    entityId: number,
    limit?: number,
    options?: ServiceOptions
  ): Promise<ActivityLogDto[]> {
    try {
      const url = new URL(`/api/activity/entity`, window.location.origin);
      url.searchParams.append('entityType', entityType);
      url.searchParams.append('entityId', String(entityId));
      if (limit) url.searchParams.append('limit', String(limit));
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error fetching entity activity:', await response.text());
        return [];
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error in ActivityLogService.getEntityActivity:', error);
      return [];
    }
  }
  
  /**
   * Get all activity logs with pagination
   */
  async getAllActivity(options?: ServiceOptions): Promise<PaginationResult<ActivityLogDto>> {
    try {
      const url = new URL('/api/activity', window.location.origin);
      if (options?.page) url.searchParams.append('page', String(options.page));
      if (options?.limit) url.searchParams.append('limit', String(options.limit));
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error fetching all activity:', await response.text());
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
      
      const result = await response.json();
      return result.data || {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error in ActivityLogService.getAllActivity:', error);
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
  
  /**
   * Get recent activity logs
   */
  async getRecentActivity(limit: number = 10, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      const url = new URL('/api/activity/recent', window.location.origin);
      url.searchParams.append('limit', String(limit));
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error fetching recent activity:', await response.text());
        return [];
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error in ActivityLogService.getRecentActivity:', error);
      return [];
    }
  }

  /**
   * Method stubs for IBaseService interface
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<ActivityLogDto>> {
    return this.getAllActivity(options);
  }

  async getById(id: number, options?: ServiceOptions): Promise<ActivityLogDto | null> {
    try {
      const response = await fetch(`/api/activity/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error fetching activity by ID:', await response.text());
        return null;
      }
      
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error(`Error in ActivityLogService.getById(${id}):`, error);
      return null;
    }
  }

  async create(data: Partial<ActivityLog>, options?: ServiceOptions): Promise<ActivityLogDto> {
    try {
      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        console.error('Error creating activity log:', await response.text());
        throw new Error('Failed to create activity log');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error in ActivityLogService.create:', error);
      // Return a placeholder entry
      return {
        id: 0,
        userId: data.userId || 0,
        action: data.action || "OTHER",
        entityType: data.entityType || EntityType.USER,
        entityId: data.entityId || 0,
        details: data.details || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // These methods aren't typically needed for activity logs on client side
  async update(id: number, data: Partial<ActivityLog>, options?: ServiceOptions): Promise<ActivityLogDto> {
    console.warn('ActivityLogService.update called on client-side - not implemented');
    throw new Error('Method not implemented on client side');
  }

  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    console.warn('ActivityLogService.delete called on client-side - not implemented');
    throw new Error('Method not implemented on client side');
  }

  async validate(data: any, isUpdate?: boolean, entityId?: number): Promise<any> {
    console.warn('ActivityLogService.validate called on client-side - not implemented');
    return { isValid: true };
  }

  async transaction<T>(callback: (service: IActivityLogService) => Promise<T>): Promise<T> {
    // No transaction support on client side, just execute the callback with this instance
    return callback(this);
  }

  toDTO(entity: ActivityLog): ActivityLogDto {
    return {
      id: entity.id,
      userId: entity.userId,
      action: entity.action,
      entityType: entity.entityType,
      entityId: entity.entityId,
      details: typeof entity.details === 'string' 
        ? entity.details 
        : entity.details || {},
      createdAt: entity.createdAt instanceof Date 
        ? entity.createdAt.toISOString() 
        : String(entity.createdAt),
      updatedAt: entity.updatedAt instanceof Date 
        ? entity.updatedAt.toISOString() 
        : String(entity.updatedAt)
    };
  }

  fromDTO(dto: Partial<ActivityLog>): Partial<ActivityLog> {
    return {
      id: dto.id,
      userId: dto.userId,
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      details: typeof dto.details === 'string' ? JSON.parse(dto.details) : dto.details,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt instanceof Date ? dto.updatedAt : dto.updatedAt ? new Date(dto.updatedAt) : new Date()
    };
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    console.warn('ActivityLogService.findByCriteria called on client-side - returning empty array');
    return [];
  }

  async bulkUpdate(ids: number[], data: Partial<ActivityLog>, options?: ServiceOptions): Promise<number> {
    console.warn('ActivityLogService.bulkUpdate called on client-side - not implemented');
    return 0;
  }

  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const url = new URL('/api/activity/count', window.location.origin);
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.error('Error fetching activity count:', await response.text());
        return 0;
      }
      
      const result = await response.json();
      return result.data?.count || 0;
    } catch (error) {
      console.error('Error in ActivityLogService.count:', error);
      return 0;
    }
  }

  async search(searchText: string, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    console.warn('ActivityLogService.search called on client-side - not implemented');
    return [];
  }

  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const activityLog = await this.getById(id, options);
      return !!activityLog;
    } catch {
      return false;
    }
  }

  getRepository(): any {
    console.warn('ActivityLogService.getRepository called on client-side - not applicable');
    return null;
  }

  async findAll(options?: ServiceOptions): Promise<PaginationResult<ActivityLogDto>> {
    return this.getAllActivity(options);
  }
}