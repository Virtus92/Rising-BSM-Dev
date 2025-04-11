import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaRepository } from './PrismaRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { NotificationType } from '@/domain/enums/CommonEnums';

/**
 * Implementation des NotificationRepository
 * 
 * Verwendet Prisma als ORM.
 */
export class NotificationRepository extends PrismaRepository<Notification, number> implements INotificationRepository {
  /**
   * Konstruktor
   * 
   * @param prisma - Prisma-Client
   * @param logger - Logging-Dienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // 'notification' ist der Name des Modells in Prisma
    super(prisma, 'notification', logger, errorHandler);
    
    this.logger.debug('Initialized NotificationRepository');
  }

  /**
   * Findet Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param unreadOnly - Nur ungelesene Benachrichtigungen
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Benachrichtigungen
   */
  async findByUser(userId: number, unreadOnly: boolean = false, limit: number = 10): Promise<Notification[]> {
    try {
      const where: any = { userId };
      
      if (unreadOnly) {
        where.read = false;
      }
      
      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      return notifications.map(notification => this.mapToDomainEntity(notification));
    } catch (error) {
      this.logger.error('Error in NotificationRepository.findByUser', { error, userId, unreadOnly });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Benachrichtigungen mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefundene Benachrichtigungen mit Paginierung
   */
  async findNotifications(filters: NotificationFilterParamsDto): Promise<PaginationResult<Notification>> {
    try {
      // Baue WHERE-Bedingungen
      const where: any = {};
      
      // Füge Benutzer-ID hinzu, falls vorhanden
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      // Nur ungelesene Benachrichtigungen
      if (filters.unreadOnly) {
        where.read = false;
      }
      
      // Benachrichtigungstyp
      if (filters.type) {
        where.type = filters.type;
      }
      
      // Füge Suchkriterium hinzu
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Füge Datumsbereich hinzu
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }
      
      // Berechne Paginierung
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Bestimme Sortierung
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }
      
      // Führe Abfragen aus
      const [total, notifications] = await Promise.all([
        // Count-Abfrage für Gesamtanzahl
        this.prisma.notification.count({ where }),
        // Daten-Abfrage mit Paginierung
        this.prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy
        })
      ]);
      
      // Mappe auf Domänenentitäten
      const data = notifications.map(notification => this.mapToDomainEntity(notification));
      
      // Berechne Paginierungsinformationen
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
      this.logger.error('Error in NotificationRepository.findNotifications', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Markiert eine Benachrichtigung als gelesen
   * 
   * @param id - Benachrichtigungs-ID
   * @returns Aktualisierte Benachrichtigung
   */
  async markAsRead(id: number): Promise<Notification> {
    try {
      const updatedNotification = await this.prisma.notification.update({
        where: { id },
        data: { 
          read: true,
          updatedAt: new Date()
        }
      });
      
      return this.mapToDomainEntity(updatedNotification);
    } catch (error) {
      this.logger.error('Error in NotificationRepository.markAsRead', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Markiert alle Benachrichtigungen eines Benutzers als gelesen
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl der aktualisierten Benachrichtigungen
   */
  async markAllAsRead(userId: number): Promise<number> {
    try {
      const updateResult = await this.prisma.notification.updateMany({
        where: { 
          userId,
          read: false
        },
        data: { 
          read: true,
          updatedAt: new Date()
        }
      });
      
      return updateResult.count;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.markAllAsRead', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht alle Benachrichtigungen eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl der gelöschten Benachrichtigungen
   */
  async deleteAllForUser(userId: number): Promise<number> {
    try {
      const deleteResult = await this.prisma.notification.deleteMany({
        where: { userId }
      });
      
      return deleteResult.count;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.deleteAllForUser', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht alte Benachrichtigungen
   * 
   * @param olderThan - Datum, vor dem Benachrichtigungen gelöscht werden sollen
   * @returns Anzahl der gelöschten Benachrichtigungen
   */
  async deleteOldNotifications(olderThan: Date): Promise<number> {
    try {
      const deleteResult = await this.prisma.notification.deleteMany({
        where: { 
          createdAt: {
            lt: olderThan
          },
          read: true // Lösche nur gelesene Benachrichtigungen
        }
      });
      
      return deleteResult.count;
    } catch (error) {
      this.logger.error('Error in NotificationRepository.deleteOldNotifications', { error, olderThan });
      throw this.handleError(error);
    }
  }

  /**
   * Zählt ungelesene Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl ungelesener Benachrichtigungen
   */
  async countUnread(userId: number): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: { 
          userId,
          read: false
        }
      });
    } catch (error) {
      this.logger.error('Error in NotificationRepository.countUnread', { error, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt Benachrichtigungen für mehrere Benutzer
   * 
   * @param userIds - Benutzer-IDs
   * @param data - Benachrichtigungsdaten
   * @returns Erstellte Benachrichtigungen
   */
  async createForMultipleUsers(
    userIds: number[], 
    data: Partial<Notification>
  ): Promise<Notification[]> {
    try {
      if (!userIds.length) {
        return [];
      }
      
      // Erstelle ein Array von Benachrichtigungsdaten für jeden Benutzer
      const notifications = userIds.map(userId => ({
        userId,
        title: data.title || '',
        message: data.message || '',
        type: data.type || NotificationType.INFO,
        read: false,
        customerId: data.customerId,
        appointmentId: data.appointmentId,
        contactRequestId: data.contactRequestId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      // Erstelle die Benachrichtigungen in einer Transaktion
      const createdNotifications = await this.prisma.$transaction(
        notifications.map(notificationData => 
          this.prisma.notification.create({
            data: notificationData
          })
        )
      );
      
      return createdNotifications.map(notification => this.mapToDomainEntity(notification));
    } catch (error) {
      this.logger.error('Error in NotificationRepository.createForMultipleUsers', { error, userIds });
      throw this.handleError(error);
    }
  }

  /**
   * Mappt eine ORM-Entität auf eine Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  protected mapToDomainEntity(ormEntity: any): Notification {
    if (!ormEntity) {
      return null as any;
    }
    
    return new Notification({
      id: ormEntity.id,
      userId: ormEntity.userId,
      type: ormEntity.type,
      title: ormEntity.title,
      message: ormEntity.message,
      isRead: ormEntity.read,
      customerId: ormEntity.customerId,
      appointmentId: ormEntity.appointmentId,
      contactRequestId: ormEntity.contactRequestId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
  }

  /**
   * Mappt eine Domänenentität auf eine ORM-Entität
   * 
   * @param domainEntity - Domänenentität
   * @returns ORM-Entität
   */
  protected mapToORMEntity(domainEntity: Partial<Notification>): any {
    // Entferne undefined-Eigenschaften
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    // Setze Zeitstempel für Erstellungen/Aktualisierungen
    if (!result.createdAt && !result.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Implementierung der Aktivitätsprotokollierung
   * 
   * Nicht relevant für Benachrichtigungen, daher eine leere Implementierung.
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    // Für Benachrichtigungen nicht notwendig
    return null;
  }

  /**
   * Verarbeitet Kriterien für das ORM
   * 
   * @param criteria - Filterkriterien
   * @returns ORM-spezifische Kriterien
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const where: any = {};
    
    // Verarbeite jedes Kriterium
    for (const [key, value] of Object.entries(criteria)) {
      // Behandle komplexe Kriterien
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Objekt mit Operatoren wie {eq, gt, lt, etc.}
        const operators: Record<string, any> = {};
        
        for (const [op, opValue] of Object.entries(value)) {
          switch (op) {
            case 'eq':
              operators.equals = opValue;
              break;
            case 'neq':
              operators.not = opValue;
              break;
            case 'gt':
              operators.gt = opValue;
              break;
            case 'gte':
              operators.gte = opValue;
              break;
            case 'lt':
              operators.lt = opValue;
              break;
            case 'lte':
              operators.lte = opValue;
              break;
            case 'contains':
              operators.contains = opValue;
              operators.mode = 'insensitive';
              break;
            case 'startsWith':
              operators.startsWith = opValue;
              break;
            case 'endsWith':
              operators.endsWith = opValue;
              break;
            case 'in':
              operators.in = opValue;
              break;
            case 'notIn':
              operators.notIn = opValue;
              break;
            default:
              // Unbekannter Operator, übergebe ihn einfach
              operators[op] = opValue;
          }
        }
        
        where[key] = operators;
      } else {
        // Einfache Gleichheit
        where[key] = value;
      }
    }
    
    return where;
  }
}
