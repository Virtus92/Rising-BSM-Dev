import { PrismaClient } from '@prisma/client';
import { ISettingsService } from '../interfaces/ISettingsService';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';

/**
 * Service für die Verwaltung von Systemeinstellungen
 */
export class SettingsService implements ISettingsService {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Holt alle Systemeinstellungen
   */
  async getAllSettings() {
    try {
      this.logger.debug('SettingsService.getAllSettings');
      
      return await this.prisma.systemSettings.findMany({
        orderBy: {
          key: 'asc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'SettingsService.getAllSettings');
    }
  }

  /**
   * Holt eine bestimmte Systemeinstellung anhand des Schlüssels
   */
  async getSettingByKey(key: string) {
    try {
      this.logger.debug('SettingsService.getSettingByKey', { key });
      
      return await this.prisma.systemSettings.findUnique({
        where: { key }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'SettingsService.getSettingByKey');
    }
  }

  /**
   * Aktualisiert eine Systemeinstellung
   */
  async updateSetting(key: string, value: string, description?: string) {
    try {
      this.logger.debug('SettingsService.updateSetting', { key });
      
      // Prüfen, ob die Einstellung existiert
      const existingSetting = await this.prisma.systemSettings.findUnique({
        where: { key }
      });
      
      if (!existingSetting) {
        throw this.errorHandler.createError(`Einstellung mit dem Schlüssel "${key}" nicht gefunden`, 404);
      }
      
      // Einstellungsdaten validieren
      const validationResult = this.validateSettingData({ key, value, description });
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Einstellung aktualisieren
      return await this.prisma.systemSettings.update({
        where: { key },
        data: {
          value,
          description: description !== undefined ? description : undefined,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'SettingsService.updateSetting');
    }
  }

  /**
   * Aktualisiert mehrere Systemeinstellungen auf einmal
   */
  async updateMultipleSettings(settings: Array<{ key: string; value: string; description?: string }>) {
    try {
      this.logger.debug('SettingsService.updateMultipleSettings', { count: settings.length });
      
      const updatedSettings = [];
      
      // Einstellungen einzeln aktualisieren
      for (const setting of settings) {
        const { key, value, description } = setting;
        
        try {
          // Validieren und Aktualisieren der Einstellung
          const validationResult = this.validateSettingData(setting);
          if (!validationResult.isValid) {
            this.logger.warn(`Validierungsfehler für Einstellung "${key}"`, validationResult.errors);
            continue;
          }
          
          const updatedSetting = await this.prisma.systemSettings.update({
            where: { key },
            data: {
              value,
              description: description !== undefined ? description : undefined,
              updatedAt: new Date()
            }
          });
          
          updatedSettings.push(updatedSetting);
        } catch (error) {
          this.logger.error(`Fehler beim Aktualisieren der Einstellung "${key}"`, error);
        }
      }
      
      return updatedSettings;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'SettingsService.updateMultipleSettings');
    }
  }

  /**
   * Erstellt eine neue Systemeinstellung
   */
  async createSetting(key: string, value: string, description?: string) {
    try {
      this.logger.debug('SettingsService.createSetting', { key });
      
      // Prüfen, ob die Einstellung bereits existiert
      const existingSetting = await this.prisma.systemSettings.findUnique({
        where: { key }
      });
      
      if (existingSetting) {
        throw this.errorHandler.createError(`Einstellung mit dem Schlüssel "${key}" existiert bereits`, 400);
      }
      
      // Einstellungsdaten validieren
      const validationResult = this.validateSettingData({ key, value, description });
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Einstellung erstellen
      return await this.prisma.systemSettings.create({
        data: {
          key,
          value,
          description,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'SettingsService.createSetting');
    }
  }

  /**
   * Löscht eine Systemeinstellung
   */
  async deleteSetting(key: string) {
    try {
      this.logger.debug('SettingsService.deleteSetting', { key });
      
      // Prüfen, ob die Einstellung existiert
      const existingSetting = await this.prisma.systemSettings.findUnique({
        where: { key }
      });
      
      if (!existingSetting) {
        throw this.errorHandler.createError(`Einstellung mit dem Schlüssel "${key}" nicht gefunden`, 404);
      }
      
      // Einstellung löschen
      await this.prisma.systemSettings.delete({
        where: { key }
      });
      
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'SettingsService.deleteSetting');
    }
  }

  /**
   * Validiert Einstellungsdaten
   */
  validateSettingData(data: { key: string; value: string; description?: string }): { isValid: boolean; errors?: any } {
    const validationRules = {
      key: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9_\-.]+$/
      },
      value: {
        required: true,
        type: 'string'
      },
      description: {
        type: 'string'
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }
}
