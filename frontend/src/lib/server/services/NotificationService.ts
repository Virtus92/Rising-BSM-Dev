import { INotificationService } from '../interfaces/INotificationService';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';

/**
 * Service für die Verwaltung von Benachrichtigungen
 */
export class NotificationService implements INotificationService {
  constructor(
    private notificationRepository: INotificationRepository,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Erstellt eine neue Benachrichtigung für einen Benutzer
   */
  async createForUser(userId: number, data: {
    title: string;
    message: string;
    type: string;
    referenceId?: number;
    referenceType?: string;
    description?: string;
  }) {
    try {
      this.logger.debug('NotificationService.createForUser', { userId, title: data.title });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateNotificationData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Benachrichtigung erstellen
      const notification = await this.notificationRepository.create({
        userId,
        title: data.title,
        message: data.message,
        description: data.description,
        type: data.type,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return notification;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.createForUser');
    }
  }

  /**
   * Erstellt Benachrichtigungen für mehrere Benutzer
   */
  async createForUsers(userIds: number[], data: {
    title: string;
    message: string;
    type: string;
    referenceId?: number;
    referenceType?: string;
    description?: string;
  }) {
    try {
      this.logger.debug('NotificationService.createForUsers', { userCount: userIds.length, title: data.title });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateNotificationData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Bei leerer Benutzer-Liste nichts tun
      if (userIds.length === 0) {
        return [];
      }
      
      // Benachrichtigungen für jeden Benutzer erstellen
      const notifications = [];
      for (const userId of userIds) {
        const notification = await this.notificationRepository.create({
          userId,
          title: data.title,
          message: data.message,
          description: data.description,
          type: data.type,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.createForUsers');
    }
  }

  /**
   * Erstellt eine System-Benachrichtigung für alle Benutzer
   */
  async createSystemNotification(data: {
    title: string;
    message: string;
    type: string;
    description?: string;
  }, roles?: string[]) {
    try {
      this.logger.debug('NotificationService.createSystemNotification', { 
        title: data.title, 
        roles: roles?.join(', ') 
      });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateNotificationData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // System-Benachrichtigungen erstellen
      const count = await this.notificationRepository.createSystemNotifications({
        title: data.title,
        message: data.message,
        description: data.description,
        type: data.type || 'system'
      }, roles);
      
      return count;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.createSystemNotification');
    }
  }

  /**
   * Holt eine Benachrichtigung anhand ihrer ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('NotificationService.findById', { id });
      
      return await this.notificationRepository.findById(id);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.findById');
    }
  }

  /**
   * Holt alle Benachrichtigungen für einen Benutzer
   */
  async findByUser(userId: number, options?: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }) {
    try {
      this.logger.debug('NotificationService.findByUser', { userId, options });
      
      return await this.notificationRepository.findByUser(userId, options);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.findByUser');
    }
  }

  /**
   * Markiert Benachrichtigungen als gelesen
   */
  async markAsRead(ids: number[]) {
    try {
      this.logger.debug('NotificationService.markAsRead', { ids });
      
      if (!ids || ids.length === 0) {
        return 0;
      }
      
      return await this.notificationRepository.markAsRead(ids);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.markAsRead');
    }
  }

  /**
   * Markiert alle Benachrichtigungen eines Benutzers als gelesen
   */
  async markAllAsRead(userId: number) {
    try {
      this.logger.debug('NotificationService.markAllAsRead', { userId });
      
      return await this.notificationRepository.markAllAsRead(userId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.markAllAsRead');
    }
  }

  /**
   * Löscht Benachrichtigungen
   */
  async delete(ids: number[]) {
    try {
      this.logger.debug('NotificationService.delete', { ids });
      
      if (!ids || ids.length === 0) {
        return 0;
      }
      
      return await this.notificationRepository.delete(ids);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.delete');
    }
  }

  /**
   * Löscht alle Benachrichtigungen eines Benutzers
   */
  async deleteAll(userId: number) {
    try {
      this.logger.debug('NotificationService.deleteAll', { userId });
      
      return await this.notificationRepository.deleteAll(userId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.deleteAll');
    }
  }

  /**
   * Zählt ungelesene Benachrichtigungen eines Benutzers
   */
  async countUnread(userId: number) {
    try {
      this.logger.debug('NotificationService.countUnread', { userId });
      
      return await this.notificationRepository.countUnread(userId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.countUnread');
    }
  }

  /**
   * Erstellt eine Benachrichtigung für ein Projekt
   */
  async createProjectNotification(projectId: number, title: string, message: string, createdBy?: number) {
    try {
      this.logger.debug('NotificationService.createProjectNotification', { projectId, title });
      
      // Projektdaten abrufen, um die relevanten Benutzer zu identifizieren
      const project = await this.notificationRepository['prisma'].project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          createdBy: true,
          customer: {
            select: {
              id: true
            }
          }
        }
      });
      
      if (!project) {
        throw this.errorHandler.createError('Projekt nicht gefunden', 404);
      }
      
      // Admin und Manager finden, um sie zu benachrichtigen
      const adminsAndManagers = await this.notificationRepository['prisma'].user.findMany({
        where: {
          role: { in: ['admin', 'manager'] },
          status: 'active'
        },
        select: { id: true }
      });
      
      const userIds = adminsAndManagers.map(user => user.id);
      
      // Projektersteller hinzufügen, falls noch nicht in der Liste
      if (project.createdBy && !userIds.includes(project.createdBy)) {
        userIds.push(project.createdBy);
      }
      
      // Bei leerer Benutzer-Liste nichts tun
      if (userIds.length === 0) {
        return null;
      }
      
      // Benachrichtigungen erstellen
      const notifications = await this.createForUsers(userIds, {
        title,
        message,
        type: 'project',
        referenceId: projectId,
        referenceType: 'project'
      });
      
      return notifications;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.createProjectNotification');
    }
  }

  /**
   * Erstellt eine Benachrichtigung für einen Termin
   */
  async createAppointmentNotification(appointmentId: number, title: string, message: string, createdBy?: number) {
    try {
      this.logger.debug('NotificationService.createAppointmentNotification', { appointmentId, title });
      
      // Termindaten abrufen, um die relevanten Benutzer zu identifizieren
      const appointment = await this.notificationRepository['prisma'].appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          title: true,
          createdBy: true,
          project: {
            select: {
              id: true,
              createdBy: true
            }
          }
        }
      });
      
      if (!appointment) {
        throw this.errorHandler.createError('Termin nicht gefunden', 404);
      }
      
      // Admin und Manager finden, um sie zu benachrichtigen
      const adminsAndManagers = await this.notificationRepository['prisma'].user.findMany({
        where: {
          role: { in: ['admin', 'manager'] },
          status: 'active'
        },
        select: { id: true }
      });
      
      const userIds = adminsAndManagers.map(user => user.id);
      
      // Terminersteller hinzufügen, falls noch nicht in der Liste
      if (appointment.createdBy && !userIds.includes(appointment.createdBy)) {
        userIds.push(appointment.createdBy);
      }
      
      // Projektersteller hinzufügen, falls vorhanden und noch nicht in der Liste
      if (appointment.project?.createdBy && !userIds.includes(appointment.project.createdBy)) {
        userIds.push(appointment.project.createdBy);
      }
      
      // Bei leerer Benutzer-Liste nichts tun
      if (userIds.length === 0) {
        return null;
      }
      
      // Benachrichtigungen erstellen
      const notifications = await this.createForUsers(userIds, {
        title,
        message,
        type: 'appointment',
        referenceId: appointmentId,
        referenceType: 'appointment'
      });
      
      return notifications;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'NotificationService.createAppointmentNotification');
    }
  }

  /**
   * Validiert Benachrichtigungsdaten
   */
  validateNotificationData(data: any): { isValid: boolean; errors?: any } {
    const validationRules = {
      title: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      message: {
        required: true,
        type: 'string',
        minLength: 2
      },
      type: {
        required: true,
        type: 'string',
        enum: ['system', 'project', 'appointment', 'customer', 'user', 'info', 'warning', 'error']
      },
      referenceId: {
        type: 'number'
      },
      referenceType: {
        type: 'string'
      },
      description: {
        type: 'string'
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }
}
