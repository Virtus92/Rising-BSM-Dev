import { PrismaClient } from '@prisma/client';
import { IProfileService } from '../interfaces/IProfileService';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';

/**
 * Service für die Verwaltung von Benutzerprofilen
 */
export class ProfileService implements IProfileService {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Holt das Profil eines Benutzers
   */
  async getProfile(userId: number) {
    try {
      this.logger.debug('ProfileService.getProfile', { userId });
      
      // Benutzerdaten abrufen
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true
        }
      });
      
      if (!user) {
        throw this.errorHandler.createError('Benutzer nicht gefunden', 404);
      }
      
      // Benutzereinstellungen abrufen
      let settings = await this.prisma.userSettings.findUnique({
        where: { userId }
      });
      
      // Standardeinstellungen erstellen, falls keine Einstellungen vorhanden sind
      if (!settings) {
        settings = await this.prisma.userSettings.create({
          data: {
            userId,
            darkMode: false,
            emailNotifications: true,
            pushNotifications: false,
            language: 'de',
            notificationInterval: 'immediate'
          }
        });
      }
      
      // Letzte Benutzeraktivitäten abrufen
      const activities = await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10
      });
      
      return {
        user,
        settings,
        activities
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProfileService.getProfile');
    }
  }

  /**
   * Aktualisiert das Profil eines Benutzers
   */
  async updateProfile(userId: number, data: any) {
    try {
      this.logger.debug('ProfileService.updateProfile', { userId });
      
      // Prüfen, ob der Benutzer existiert
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true }
      });
      
      if (!user) {
        throw this.errorHandler.createError('Benutzer nicht gefunden', 404);
      }
      
      // Validieren der Eingabedaten
      const validationResult = this.validateProfileData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Prüfen, ob eine E-Mail-Adresse aktualisiert wird und ob sie bereits existiert
      if (data.email && data.email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: data.email }
        });
        
        if (existingUser) {
          throw this.errorHandler.createError('E-Mail-Adresse wird bereits verwendet', 400);
        }
      }
      
      // Profildaten aktualisieren
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          email: data.email !== undefined ? data.email : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true
        }
      });
      
      // Benutzaktivität loggen
      await this.logUserActivity(userId, 'Profil aktualisiert');
      
      return updatedUser;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProfileService.updateProfile');
    }
  }

  /**
   * Aktualisiert die Profileinstellungen eines Benutzers
   */
  async updateSettings(userId: number, settings: any) {
    try {
      this.logger.debug('ProfileService.updateSettings', { userId });
      
      // Prüfen, ob der Benutzer existiert
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        throw this.errorHandler.createError('Benutzer nicht gefunden', 404);
      }
      
      // Validieren der Eingabedaten
      const validationResult = this.validateSettingsData(settings);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Prüfen, ob Einstellungen existieren
      const existingSettings = await this.prisma.userSettings.findUnique({
        where: { userId }
      });
      
      let updatedSettings;
      
      if (existingSettings) {
        // Einstellungen aktualisieren
        updatedSettings = await this.prisma.userSettings.update({
          where: { userId },
          data: {
            darkMode: settings.darkMode !== undefined ? settings.darkMode : undefined,
            emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : undefined,
            pushNotifications: settings.pushNotifications !== undefined ? settings.pushNotifications : undefined,
            language: settings.language !== undefined ? settings.language : undefined,
            notificationInterval: settings.notificationInterval !== undefined ? settings.notificationInterval : undefined,
            updatedAt: new Date()
          }
        });
      } else {
        // Einstellungen erstellen
        updatedSettings = await this.prisma.userSettings.create({
          data: {
            userId,
            darkMode: settings.darkMode !== undefined ? settings.darkMode : false,
            emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : true,
            pushNotifications: settings.pushNotifications !== undefined ? settings.pushNotifications : false,
            language: settings.language !== undefined ? settings.language : 'de',
            notificationInterval: settings.notificationInterval !== undefined ? settings.notificationInterval : 'immediate'
          }
        });
      }
      
      // Benutzaktivität loggen
      await this.logUserActivity(userId, 'Einstellungen aktualisiert');
      
      return updatedSettings;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProfileService.updateSettings');
    }
  }

  /**
   * Ändert das Profilbild eines Benutzers
   */
  async updateProfilePicture(userId: number, pictureUrl: string) {
    try {
      this.logger.debug('ProfileService.updateProfilePicture', { userId });
      
      // Prüfen, ob der Benutzer existiert
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        throw this.errorHandler.createError('Benutzer nicht gefunden', 404);
      }
      
      // Profilbild aktualisieren
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: pictureUrl,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          profilePicture: true
        }
      });
      
      // Benutzaktivität loggen
      await this.logUserActivity(userId, 'Profilbild aktualisiert');
      
      return updatedUser;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProfileService.updateProfilePicture');
    }
  }

  /**
   * Holt die letzten Aktivitäten eines Benutzers
   */
  async getUserActivities(userId: number, limit = 10) {
    try {
      this.logger.debug('ProfileService.getUserActivities', { userId, limit });
      
      // Prüfen, ob der Benutzer existiert
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        throw this.errorHandler.createError('Benutzer nicht gefunden', 404);
      }
      
      // Aktivitäten abrufen
      const activities = await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      });
      
      return activities;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProfileService.getUserActivities');
    }
  }

  /**
   * Fügt eine Benutzeraktivität hinzu
   */
  async logUserActivity(userId: number, activity: string, ipAddress?: string) {
    try {
      this.logger.debug('ProfileService.logUserActivity', { userId, activity });
      
      await this.prisma.userActivity.create({
        data: {
          userId,
          activity,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Fehler beim Logging sollten den normalen Betrieb nicht unterbrechen
      this.logger.error('Fehler beim Loggen einer Benutzeraktivität', error);
    }
  }

  /**
   * Validiert Profildaten
   */
  validateProfileData(data: any): { isValid: boolean; errors?: any } {
    const validationRules = {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      email: {
        type: 'email'
      },
      phone: {
        type: 'string',
        maxLength: 30
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }

  /**
   * Validiert Einstellungsdaten
   */
  validateSettingsData(data: any): { isValid: boolean; errors?: any } {
    const validationRules = {
      darkMode: {
        type: 'boolean'
      },
      emailNotifications: {
        type: 'boolean'
      },
      pushNotifications: {
        type: 'boolean'
      },
      language: {
        type: 'string',
        enum: ['de', 'en']
      },
      notificationInterval: {
        type: 'string',
        enum: ['immediate', 'daily', 'weekly']
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }
}
