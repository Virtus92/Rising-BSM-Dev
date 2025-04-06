import { ICustomerService } from '../interfaces/ICustomerService';
import { ICustomerRepository } from '../interfaces/ICustomerRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';

/**
 * Service für die Verwaltung von Kunden
 */
export class CustomerService implements ICustomerService {
  constructor(
    private customerRepository: ICustomerRepository,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Erstellt einen neuen Kunden
   */
  async create(data: any, userId: number, userName: string) {
    try {
      this.logger.debug('CustomerService.create', { name: data.name });
      
      // Validieren der Eingabedaten
      const validationResult = this.validateCustomerData(data);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validation error', 400, validationResult.errors);
      }
      
      // Metadaten hinzufügen
      const customerData = {
        ...data,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Kunden erstellen
      const customer = await this.customerRepository.create(customerData);
      
      // Aktivität loggen
      await this.customerRepository.logActivity(
        customer.id,
        userId,
        userName,
        'create',
        `Kunde ${customer.name} wurde erstellt`
      );
      
      return customer;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerService.create');
    }
  }

  /**
   * Findet einen Kunden anhand seiner ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('CustomerService.findById', { id });
      
      const customer = await this.customerRepository.findById(id);
      if (!customer) {
        throw this.errorHandler.createError('Kunde nicht gefunden', 404);
      }
      
      return customer;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerService.findById');
    }
  }

  /**
   * Findet alle Kunden mit optionaler Filterung
   */
  async findAll(filters?: any) {
    try {
      this.logger.debug('CustomerService.findAll', filters);
      
      return await this.customerRepository.findAll(filters);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerService.findAll');
    }
  }

  /**
   * Aktualisiert einen Kunden
   */
  async update(id: number, data: any, userId: number, userName: string) {
    try {
      this.logger.debug('CustomerService.update', { id });
      
      // Überprüfen, ob der Kunde existiert
      const existingCustomer = await this.customerRepository.findById(id);
      if (!existingCustomer) {
        throw this.errorHandler.createError('Kunde nicht gefunden', 404);
      }
      
      // Validieren der Eingabedaten
      const validationResult = this.validateCustomerData(data, true);
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validation error', 400, validationResult.errors);
      }
      
      // Metadaten aktualisieren
      const customerData = {
        ...data,
        updatedBy: userId,
        updatedAt: new Date()
      };
      
      // Kunden aktualisieren
      const customer = await this.customerRepository.update(id, customerData);
      
      // Aktivität loggen
      await this.customerRepository.logActivity(
        customer.id,
        userId,
        userName,
        'update',
        `Kunde ${customer.name} wurde aktualisiert`
      );
      
      return customer;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerService.update');
    }
  }

  /**
   * Löscht einen Kunden
   */
  async delete(id: number, userId: number, userName: string) {
    try {
      this.logger.debug('CustomerService.delete', { id });
      
      // Überprüfen, ob der Kunde existiert
      const existingCustomer = await this.customerRepository.findById(id);
      if (!existingCustomer) {
        throw this.errorHandler.createError('Kunde nicht gefunden', 404);
      }
      
      // Kunden löschen (oder als gelöscht markieren)
      const result = await this.customerRepository.delete(id);
      
      // Aktivität loggen
      await this.customerRepository.logActivity(
        id,
        userId,
        userName,
        'delete',
        `Kunde ${existingCustomer.name} wurde gelöscht`
      );
      
      return result;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerService.delete');
    }
  }

  /**
   * Sucht nach Kunden basierend auf einem Suchbegriff
   */
  async search(searchTerm: string) {
    try {
      this.logger.debug('CustomerService.search', { searchTerm });
      
      if (!searchTerm || searchTerm.length < 2) {
        throw this.errorHandler.createError('Suchbegriff muss mindestens 2 Zeichen enthalten', 400);
      }
      
      return await this.customerRepository.search(searchTerm);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerService.search');
    }
  }

  /**
   * Validiert Kundendaten für die Erstellung
   */
  validateCustomerData(data: any, isUpdate = false): { isValid: boolean; errors?: any } {
    const validationRules = {
      name: {
        required: !isUpdate,
        type: 'string',
        minLength: 2,
        maxLength: 100
      },
      email: {
        type: 'email',
        required: !isUpdate
      },
      phone: {
        type: 'string',
        maxLength: 30
      },
      address: {
        type: 'string'
      },
      postalCode: {
        type: 'string',
        maxLength: 10
      },
      city: {
        type: 'string',
        maxLength: 100
      },
      country: {
        type: 'string',
        maxLength: 100
      },
      notes: {
        type: 'string'
      },
      newsletter: {
        type: 'boolean'
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'prospect', 'deleted']
      },
      type: {
        type: 'string',
        enum: ['private', 'business']
      }
    };
    
    return this.validationService.validate(data, validationRules);
  }

  /**
   * Holt Kundenstatistiken
   */
  async getCustomerStatistics() {
    try {
      this.logger.debug('CustomerService.getCustomerStatistics');
      
      const statusCounts = await this.customerRepository.countByStatus();
      
      // Weitere Statistiken könnten hier berechnet werden
      
      return {
        statusCounts
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerService.getCustomerStatistics');
    }
  }
}
