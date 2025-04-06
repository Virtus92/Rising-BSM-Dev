import { IServiceService } from '../interfaces/IServiceService';
import { IServiceRepository } from '../interfaces/IServiceRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Service für die Verwaltung von Dienstleistungen
 */
export class ServiceService implements IServiceService {
  constructor(
    private serviceRepository: IServiceRepository,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Erstellt einen neuen Service
   */
  async create(data: any, userId: number, userName: string) {
    try {
      this.logger.debug('ServiceService.create', { name: data.name });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateServiceData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Metadaten hinzufügen
      const serviceData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: data.active !== undefined ? data.active : true
      };
      
      // Service erstellen
      const service = await this.serviceRepository.create(serviceData);
      
      // Aktivität loggen
      await this.serviceRepository.logActivity(
        service.id,
        userId,
        userName,
        'create',
        `Service "${service.name}" wurde erstellt`
      );
      
      return service;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceService.create');
    }
  }

  /**
   * Findet einen Service anhand seiner ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('ServiceService.findById', { id });
      
      const service = await this.serviceRepository.findById(id);
      if (!service) {
        throw this.errorHandler.createError('Service nicht gefunden', 404);
      }
      
      return service;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceService.findById');
    }
  }

  /**
   * Findet alle Services mit optionaler Filterung
   */
  async findAll(filters?: any) {
    try {
      this.logger.debug('ServiceService.findAll', filters);
      
      return await this.serviceRepository.findAll(filters);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceService.findAll');
    }
  }

  /**
   * Aktualisiert einen Service
   */
  async update(id: number, data: any, userId: number, userName: string) {
    try {
      this.logger.debug('ServiceService.update', { id });
      
      // Überprüfen, ob der Service existiert
      const existingService = await this.serviceRepository.findById(id);
      if (!existingService) {
        throw this.errorHandler.createError('Service nicht gefunden', 404);
      }
      
      // Validieren der Eingabedaten
      const validationResult = this.validateServiceData(data, true);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Metadaten aktualisieren
      const serviceData = {
        ...data,
        updatedAt: new Date()
      };
      
      // Service aktualisieren
      const service = await this.serviceRepository.update(id, serviceData);
      
      // Aktivität loggen
      await this.serviceRepository.logActivity(
        service.id,
        userId,
        userName,
        'update',
        `Service "${service.name}" wurde aktualisiert`
      );
      
      return service;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceService.update');
    }
  }

  /**
   * Löscht einen Service
   */
  async delete(id: number, userId: number, userName: string) {
    try {
      this.logger.debug('ServiceService.delete', { id });
      
      // Überprüfen, ob der Service existiert
      const existingService = await this.serviceRepository.findById(id);
      if (!existingService) {
        throw this.errorHandler.createError('Service nicht gefunden', 404);
      }
      
      // Service löschen (oder als gelöscht markieren)
      const result = await this.serviceRepository.delete(id);
      
      // Aktivität loggen
      await this.serviceRepository.logActivity(
        id,
        userId,
        userName,
        'delete',
        `Service "${existingService.name}" wurde gelöscht`
      );
      
      return result;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceService.delete');
    }
  }

  /**
   * Sucht nach Services basierend auf einem Suchbegriff
   */
  async search(searchTerm: string) {
    try {
      this.logger.debug('ServiceService.search', { searchTerm });
      
      if (!searchTerm || searchTerm.length < 2) {
        throw this.errorHandler.createError('Suchbegriff muss mindestens 2 Zeichen enthalten', 400);
      }
      
      return await this.serviceRepository.search(searchTerm);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceService.search');
    }
  }

  /**
   * Validiert Service-Daten für die Erstellung/Aktualisierung
   */
  validateServiceData(data: any, isUpdate = false): { isValid: boolean; errors?: any } {
    const validationRules = {
      name: {
        required: !isUpdate,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      description: {
        type: 'string'
      },
      basePrice: {
        required: !isUpdate,
        type: 'number',
        min: 0
      },
      vatRate: {
        type: 'number',
        min: 0,
        max: 100
      },
      active: {
        type: 'boolean'
      },
      unit: {
        type: 'string',
        maxLength: 20
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }

  /**
   * Findet aktive Services (für Dropdown-Listen)
   */
  async findActive() {
    try {
      this.logger.debug('ServiceService.findActive');
      
      return await this.serviceRepository.findActive();
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceService.findActive');
    }
  }

  /**
   * Berechnet den Gesamtpreis für einen Service (inkl. MwSt)
   */
  calculateTotalPrice(basePrice: number, vatRate: number) {
    const vatAmount = (basePrice * vatRate) / 100;
    const totalPrice = basePrice + vatAmount;
    
    return {
      basePrice: this.roundToTwoDecimals(basePrice),
      vatAmount: this.roundToTwoDecimals(vatAmount),
      totalPrice: this.roundToTwoDecimals(totalPrice)
    };
  }

  /**
   * Rundet einen Wert auf zwei Dezimalstellen
   */
  private roundToTwoDecimals(value: number) {
    return Math.round(value * 100) / 100;
  }
}
