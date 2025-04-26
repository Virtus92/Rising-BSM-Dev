'use client';

import { INotificationService } from '@/domain/services/INotificationService';
import { Notification } from '@/domain/entities/Notification';
import { 
  NotificationResponseDto,
  NotificationFilterParamsDto,
  CreateNotificationDto,
  UpdateNotificationDto,
  ReadAllNotificationsResponseDto,
  DeleteAllNotificationsResponseDto
} from '@/domain/dtos/NotificationDtos';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { IErrorHandler } from '@/core/errors';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';

/**
 * Client-side service for managing notifications
 * Implements the full INotificationService interface
 */
export class NotificationService implements INotificationService {
  constructor(
    protected readonly repository: INotificationRepository,
    protected readonly logger: ILoggingService,
    protected readonly validator: IValidationService,
    protected readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized NotificationService');
  }

  /**
   * Gets the repository instance
   * This allows direct repository access when needed for specific operations
   * 
   * @returns The repository instance
   */
  getRepository(): INotificationRepository {
    return this.repository;
  }

  /**
   * Get all entities with pagination
   * @param options Service options
   * @returns Paginated results
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<NotificationResponseDto>> {
    try {
      // Map service options to API parameters
      const params: any = {};
      
      if (options?.filters) {
        const { page, limit, unreadOnly, search, sortBy, sortDirection, userId } = options.filters;
        
        if (page !== undefined) params.page = page;
        if (limit !== undefined) params.limit = limit;
        if (unreadOnly !== undefined) params.unreadOnly = unreadOnly;
        if (search !== undefined && search !== '') params.search = search;
        if (sortBy !== undefined) params.sortBy = sortBy;
        if (sortDirection !== undefined) params.sortDirection = sortDirection;
        if (userId !== undefined) params.userId = userId;
      }
      
      // Use repository method
      const result = await this.repository.findAll(params);
      
      // Map entities to DTOs
      const dtos = result.data.map(entity => this.toDTO(entity));
      
      return {
        data: dtos,
        pagination: result.pagination
      };
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.getAll:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Get an entity by ID
   * @param id Entity ID
   * @param options Service options
   * @returns Entity or null if not found
   */
  async getById(id: number, options?: ServiceOptions): Promise<NotificationResponseDto | null> {
    try {
      const notification = await this.repository.findById(id);
      return notification ? this.toDTO(notification) : null;
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.getById:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new entity
   * @param data Entity data
   * @param options Service options
   * @returns Created entity
   */
  async create(data: CreateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      const entity = this.fromDTO(data);
      const createdNotification = await this.repository.create(entity);
      return this.toDTO(createdNotification);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.create:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an entity
   * @param id Entity ID
   * @param data Update data
   * @param options Service options
   * @returns Updated entity
   */
  async update(id: number, data: UpdateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      const entity = this.fromDTO(data);
      const updatedNotification = await this.repository.update(id, entity);
      return this.toDTO(updatedNotification);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.update:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete an entity
   * @param id Entity ID
   * @param options Service options
   * @returns Whether deletion was successful
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.delete:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Find entities matching criteria
   * @param criteria Search criteria
   * @param options Service options
   * @returns Matching entities
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<NotificationResponseDto[]> {
    try {
      const entities = await this.repository.findByCriteria(criteria);
      return entities.map(entity => this.toDTO(entity));
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.findByCriteria:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Find all entities
   * @param options Service options
   * @returns Paginated results
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<NotificationResponseDto>> {
    return this.getAll(options);
  }

  /**
   * Count entities matching criteria
   * @param criteria Search criteria
   * @param options Service options
   * @returns Count of matching entities
   */
  async count(criteria?: Record<string, any>, options?: ServiceOptions): Promise<number> {
    try {
      return await this.repository.count(criteria);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.count:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Check if an entity exists
   * @param id Entity ID
   * @param options Service options
   * @returns Whether entity exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.repository.exists(id);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.exists:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Check if entities matching criteria exist
   * @param criteria Search criteria
   * @param options Service options
   * @returns Whether matching entities exist
   */
  async existsByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<boolean> {
    try {
      return await this.repository.existsByCriteria(criteria);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.existsByCriteria:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Search for entities
   * @param term Search term
   * @param options Service options
   * @returns Matching entities
   */
  async search(term: string, options?: ServiceOptions): Promise<NotificationResponseDto[]> {
    try {
      const entities = await this.repository.search({ term });
      return entities.map(entity => this.toDTO(entity));
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.search:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Validate data
   * @param data Data to validate
   * @param schema Validation schema
   * @returns Validation result
   */
  async validate(data: any, schema?: any): Promise<any> {
    try {
      const validationSchema = schema || this.getCreateValidationSchema();
      return this.validator.validate(data, validationSchema);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.validate:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Execute a transaction
   * @param callback Transaction callback
   * @param context Transaction context
   * @returns Transaction result
   */
  async transaction<T>(callback: (service: INotificationService) => Promise<T>, context?: any): Promise<T> {
    return callback(this);
  }

  /**
   * Update multiple entities
   * @param ids Entity IDs
   * @param data Update data
   * @param options Service options
   * @returns Number of updated entities
   */
  async bulkUpdate(ids: number[], data: UpdateNotificationDto, options?: ServiceOptions): Promise<number> {
    try {
      const entity = this.fromDTO(data);
      return await this.repository.bulkUpdate(ids, entity);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.bulkUpdate:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Find notifications for a user
   * @param userId User ID
   * @param unreadOnly Whether to return only unread notifications
   * @param limit Maximum number of notifications to return
   * @param options Service options
   * @returns Notifications
   */
  async findByUser(userId: number, unreadOnly?: boolean, limit?: number, options?: ServiceOptions): Promise<NotificationResponseDto[]> {
    try {
      const entities = await this.repository.findByUser(userId, unreadOnly, limit);
      return entities.map(entity => this.toDTO(entity));
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.findByUser:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark a notification as read
   * @param id Notification ID
   * @param options Service options
   * @returns Updated notification
   */
  async markAsRead(id: number, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      const updatedNotification = await this.repository.markAsRead(id);
      return this.toDTO(updatedNotification);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.markAsRead:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark all notifications for a user as read
   * @param userId User ID
   * @param options Service options
   * @returns Result
   */
  async markAllAsRead(userId: number, options?: ServiceOptions): Promise<ReadAllNotificationsResponseDto> {
    try {
      const count = await this.repository.markAllAsRead(userId);
      return { count };
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.markAllAsRead:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete all notifications for a user
   * @param userId User ID
   * @param options Service options
   * @returns Result
   */
  async deleteAllForUser(userId: number, options?: ServiceOptions): Promise<DeleteAllNotificationsResponseDto> {
    try {
      const count = await this.repository.deleteAllForUser(userId);
      return { count };
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.deleteAllForUser:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Count unread notifications for a user
   * @param userId User ID
   * @param options Service options
   * @returns Count
   */
  async countUnread(userId: number, options?: ServiceOptions): Promise<number> {
    try {
      return await this.repository.countUnread(userId);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.countUnread:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a notification
   * @param data Notification data
   * @param options Service options
   * @returns Created notification
   */
  async createNotification(data: CreateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    return this.create(data, options);
  }

  /**
   * Create notifications for multiple users
   * @param userIds User IDs
   * @param title Notification title
   * @param message Notification message
   * @param type Notification type
   * @param referenceData Reference data
   * @param options Service options
   * @returns Created notifications
   */
  async createNotificationForMultipleUsers(
    userIds: number[],
    title: string,
    message: string,
    type: NotificationType,
    referenceData?: {
      customerId?: number;
      appointmentId?: number;
      contactRequestId?: number;
      link?: string;
    },
    options?: ServiceOptions
  ): Promise<NotificationResponseDto[]> {
    try {
      const notifications = await this.repository.createForMultipleUsers(
        userIds,
        {
          title,
          message,
          type,
          ...referenceData
        }
      );
      return notifications.map(notification => this.toDTO(notification));
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.createNotificationForMultipleUsers:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Find notifications with filtering
   * @param filters Filters
   * @param options Service options
   * @returns Paginated notifications
   */
  async findNotifications(filters: NotificationFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<NotificationResponseDto>> {
    try {
      const result = await this.repository.findNotifications(filters);
      return {
        data: result.data.map(notification => this.toDTO(notification)),
        pagination: result.pagination
      };
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.findNotifications:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Clean up old notifications
   * @param olderThan Date threshold
   * @param options Service options
   * @returns Number of deleted notifications
   */
  async cleanupOldNotifications(olderThan: Date, options?: ServiceOptions): Promise<number> {
    try {
      return await this.repository.deleteOldNotifications(olderThan);
    } catch (error: unknown) {
      this.logger.error('Error in NotificationService.cleanupOldNotifications:', error as Error);
      throw this.handleError(error);
    }
  }

  /**
   * Convert entity to DTO
   * @param entity Entity
   * @returns DTO
   */
  toDTO(entity: Notification): NotificationResponseDto {
    if (!entity) {
      return null as any;
    }

    return {
      id: entity.id,
      userId: entity.userId || 0,
      title: entity.title || '',
      message: entity.message || '',
      content: entity.message || '', // Ensure content is always populated
      type: entity.type,
      isRead: entity.isRead || false,
      customerId: entity.customerId,
      appointmentId: entity.appointmentId,
      contactRequestId: entity.contactRequestId,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt || new Date().toISOString(),
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt || new Date().toISOString(),
      formattedDate: entity.createdAt instanceof Date ? this.formatDate(entity.createdAt) : 
                    typeof entity.createdAt === 'string' ? (entity.createdAt as string).split('T')[0].split('-').reverse().join('.') : 
                    new Date().toLocaleDateString()
    };
  }

  /**
   * Convert DTO to entity
   * @param dto DTO
   * @returns Entity
   */
  fromDTO(dto: CreateNotificationDto | UpdateNotificationDto): Partial<Notification> {
    if (!dto) {
      return null as any;
    }

    if ('isRead' in dto) {
      // Update DTO
      const updateDto = dto as UpdateNotificationDto;
      return {
        title: updateDto.title,
        message: updateDto.message,
        isRead: updateDto.isRead,
        updatedAt: new Date()
      };
    } else {
      // Create DTO
      const createDto = dto as CreateNotificationDto;
      return {
        userId: createDto.userId,
        title: createDto.title,
        message: createDto.message,
        type: createDto.type,
        isRead: false,
        customerId: createDto.customerId,
        appointmentId: createDto.appointmentId,
        contactRequestId: createDto.contactRequestId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Format a date for display
   * @param date Date
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    try {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error: unknown) {
      return date.toISOString();
    }
  }

  /**
   * Get create validation schema
   * @returns Validation schema
   */
  private getCreateValidationSchema(): any {
    return {
      type: 'object',
      required: ['userId', 'title', 'type'],
      properties: {
        userId: { type: 'number', minimum: 1 },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        message: { type: 'string', maxLength: 1000 },
        type: { type: 'string', enum: Object.values(NotificationType) },
        customerId: { type: 'number', minimum: 1 },
        appointmentId: { type: 'number', minimum: 1 },
        contactRequestId: { type: 'number', minimum: 1 },
        link: { type: 'string', maxLength: 500 }
      }
    };
  }

  /**
   * Handle error
   * @param error Error
   * @returns Handled error
   */
  private handleError(error: unknown): Error {
    // Pass the Error object directly
    if (error instanceof Error) {
      return error; // Return Error objects directly
    } else if (typeof error === 'string') {
      return this.errorHandler.createError(error);
    } else {
      // Convert all other types to string
      return this.errorHandler.createError(String(error));
    }
  }
}