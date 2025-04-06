import { PrismaClient } from '@prisma/client';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * Repository für die Verwaltung von Benachrichtigungen
 */
export class NotificationRepository implements INotificationRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}

  /**
   * Erstellt eine neue Benachrichtigung
   */
  async create(data: any) {
    try {
      this.logger.debug('NotificationRepository.create', { title: data.title });
      
      return await this.prisma.notification.create({
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.create');
    }
  }

  /**
   * Findet eine Benachrichtigung anhand ihrer ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('NotificationRepository.findById', { id });
      
      return await this.prisma.notification.findUnique({
        where: { id }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.findById');
    }
  }

  /**
   * Findet alle Benachrichtigungen für einen Benutzer
   */
  async findByUser(userId: number, options: {
    read?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      this.logger.debug('NotificationRepository.findByUser', { userId, options });
      
      const where: any = { userId };
      
      if (options.read !== undefined) {
        where.read = options.read;
      }
      
      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: [
          { read: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: options.offset || 0,
        take: options.limit || 50
      });
      
      const total = await this.prisma.notification.count({ where });
      
      return {
        notifications,
        total
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.findByUser');
    }
  }

  /**
   * Markiert Benachrichtigungen als gelesen
   */
  async markAsRead(ids: number[]) {
    try {
      this.logger.debug('NotificationRepository.markAsRead', { ids });
      
      if (ids.length === 0) {
        return 0;
      }
      
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: ids },
          read: false
        },
        data: {
          read: true,
          updatedAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.markAsRead');
    }
  }

  /**
   * Markiert alle Benachrichtigungen eines Benutzers als gelesen
   */
  async markAllAsRead(userId: number) {
    try {
      this.logger.debug('NotificationRepository.markAllAsRead', { userId });
      
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true,
          updatedAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.markAllAsRead');
    }
  }

  /**
   * Löscht Benachrichtigungen
   */
  async delete(ids: number[]) {
    try {
      this.logger.debug('NotificationRepository.delete', { ids });
      
      if (ids.length === 0) {
        return 0;
      }
      
      const result = await this.prisma.notification.deleteMany({
        where: {
          id: { in: ids }
        }
      });
      
      return result.count;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.delete');
    }
  }

  /**
   * Löscht alle Benachrichtigungen eines Benutzers
   */
  async deleteAll(userId: number) {
    try {
      this.logger.debug('NotificationRepository.deleteAll', { userId });
      
      const result = await this.prisma.notification.deleteMany({
        where: { userId }
      });
      
      return result.count;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.deleteAll');
    }
  }

  /**
   * Zählt ungelesene Benachrichtigungen eines Benutzers
   */
  async countUnread(userId: number) {
    try {
      this.logger.debug('NotificationRepository.countUnread', { userId });
      
      return await this.prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.countUnread');
    }
  }

  /**
   * Erstellt System-Benachrichtigungen für alle Benutzer mit bestimmten Rollen
   */
  async createSystemNotifications(data: any, roles?: string[]) {
    try {
      this.logger.debug('NotificationRepository.createSystemNotifications', { roles });
      
      // Benutzer-IDs basierend auf Rollen abrufen
      const whereClause = roles && roles.length > 0
        ? { role: { in: roles } }
        : {};
      
      const users = await this.prisma.user.findMany({
        where: {
          ...whereClause,
          status: 'active'
        },
        select: { id: true }
      });
      
      const userIds = users.map(user => user.id);
      if (userIds.length === 0) {
        return 0;
      }
      
      // Benachrichtigungsdaten vorbereiten
      const notificationData = userIds.map(userId => ({
        userId,
        title: data.title,
        message: data.message,
        description: data.description,
        type: data.type || 'system',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: data.createdBy
      }));
      
      // Batch-Insert durchführen
      const result = await this.prisma.$transaction(
        notificationData.map(notifData => 
          this.prisma.notification.create({ data: notifData })
        )
      );
      
      return result.length;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationRepository.createSystemNotifications');
    }
  }
}
