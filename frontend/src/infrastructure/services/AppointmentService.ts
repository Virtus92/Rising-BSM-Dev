import { BaseService } from './BaseService';
import { Appointment } from '@/domain/entities/Appointment';
import { IAppointmentService } from '@/domain/services/IAppointmentService';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentResponseDto,
  AppointmentDetailResponseDto,
  UpdateAppointmentStatusDto
} from '@/domain/dtos/AppointmentDtos';
import { mapAppointmentToDto } from '@/domain/dtos/AppointmentDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { AppointmentCustomerData } from '@/domain/dtos/AppointmentDtos';

/**
 * Service für Termine
 * 
 * Implementiert IAppointmentService und erweitert BaseService.
 */
export class AppointmentService extends BaseService<
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentResponseDto
> implements IAppointmentService {
  
  // Add container property to store service dependencies
  protected container: any;
  
  /**
   * Konstruktor
   * 
   * @param repository - Repository für Termine
   * @param logger - Logging-Dienst
   * @param validator - Validierungsdienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    protected repository: IAppointmentRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(repository, logger, validator, errorHandler);
    // Initialize the container
    this.container = {}; 
  }
  
  /**
   * Helper method to get customer service
   */
  private getCustomerService() {
    try {
      // Import dynamically to avoid circular dependencies
      const { getServiceFactory } = require('@/infrastructure/common/factories');
      const serviceFactory = getServiceFactory();
      return serviceFactory.createCustomerService();
    } catch (error) {
      this.logger.error('Failed to get customer service', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  
  /**
   * Helper method for consistent appointment ID validation
   */
  private validateAppointmentId(id: number | string): number | null {
    if (id === undefined || id === null || id === '') {
      return null;
    }
    
    // If it's already a number, just validate it's positive
    if (typeof id === 'number') {
      return id > 0 ? id : null;
    }
    
    // If it's a string, try to extract numeric part
    const numericPart = id.replace(/[^0-9]/g, '');
    if (!numericPart) {
      return null;
    }
    
    const numericId = parseInt(numericPart, 10);
    return !isNaN(numericId) && numericId > 0 ? numericId : null;
  }

  /**
   * Find all appointments with pagination and filtering
   * 
   * @param options Service options including pagination and filters
   * @returns Paginated appointments
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<AppointmentResponseDto>> {
    try {
      // Convert service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Add filter criteria if provided in options
      if (options?.filters) {
        repoOptions.criteria = {};
        
        if (options.filters.status) {
          repoOptions.criteria.status = options.filters.status;
        }
        
        if (options.filters.startDate && options.filters.endDate) {
          repoOptions.criteria.appointmentDateRange = {
            start: options.filters.startDate,
            end: options.filters.endDate
          };
        } else if (options.filters.startDate) {
          repoOptions.criteria.appointmentDateAfter = options.filters.startDate;
        } else if (options.filters.endDate) {
          repoOptions.criteria.appointmentDateBefore = options.filters.endDate;
        }
        
        if (options.filters.customerId) {
          repoOptions.criteria.customerId = options.filters.customerId;
        }
      }
      
      // Ensure we always include customer relation for proper customer data
      if (!repoOptions.relations) {
        repoOptions.relations = [];
      }
      
      if (!repoOptions.relations.includes('customer')) {
        repoOptions.relations.push('customer');
      }
      
      // Special handling for customer name sorting
      if (options?.sort?.field === 'customerName' || options?.sort?.field === 'customer.name') {
        if (!repoOptions.sort) repoOptions.sort = {};
        repoOptions.sort.field = 'customer.name';
        repoOptions.sort.direction = options.sort.direction || 'asc';
      }
      
      this.logger.debug('Finding appointments with options:', { 
        criteria: repoOptions.criteria,
        sort: repoOptions.sort,
        relations: repoOptions.relations
      });
      
      // Get appointments from repository
      const result = await this.repository.findAll(repoOptions);
      
      // Map entities to DTOs
      return {
        data: result.data.map(appointment => this.toDTO(appointment)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findAll`, { 
        error: error instanceof Error ? error.message : String(error),
        options 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Count appointments with optional filtering
   */
  async count(options?: { 
    context?: any, 
    filters?: Record<string, any> 
  }): Promise<number> {
    try {
      const criteria: Record<string, any> = {};
      
      if (options?.filters?.status) {
        criteria.status = options.filters.status;
      }
      
      if (options?.filters?.startDate && options?.filters?.endDate) {
        criteria.appointmentDateRange = {
          start: options.filters.startDate,
          end: options.filters.endDate
        };
      } else if (options?.filters?.startDate) {
        criteria.appointmentDateAfter = options.filters.startDate;
      } else if (options?.filters?.endDate) {
        criteria.appointmentDateBefore = options.filters.endDate;
      }
      
      if (options?.filters?.customerId) {
        criteria.customerId = options.filters.customerId;
      }
      
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.count`, { 
        error: error instanceof Error ? error.message : String(error),
        filters: options?.filters 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Ruft detaillierte Termininfos ab
   * 
   * @param id - Termin-ID
   * @param options - Service-Optionen
   * @returns Termin mit Details oder null
   */
  async getAppointmentDetails(
    id: number | string,
    options?: ServiceOptions
  ): Promise<AppointmentDetailResponseDto | null> {
    try {
      // Use validateId for consistent ID validation
      const validatedId = this.validateAppointmentId(id);
      if (validatedId === null) {
        this.logger.error('Invalid appointment ID provided to getAppointmentDetails');
        throw this.errorHandler.createValidationError('Invalid appointment ID', ['Appointment ID is required']);
      }

      this.logger.debug(`Getting appointment details for ID: ${validatedId}`);

      // Always include customer and notes relations
      const repoOptions = this.mapToRepositoryOptions({
        ...options,
        relations: ['notes', 'customer']
      });

      const appointment = await this.repository.findByIdWithRelations(validatedId);
      if (!appointment) {
        this.logger.info(`Appointment with ID ${validatedId} not found`);
        return null;
      }

      // Load notes for the appointment
      const notes = await this.repository.findNotes(validatedId);

      // Create base DTO
      const appointmentDto = this.toDTO(appointment) as AppointmentResponseDto;

      // Get customer details consistently using AppointmentCustomerData interface
      let customer: AppointmentCustomerData | undefined;
      
      // First try to get customer from the appointment.customer property
      if (appointment.customerId && (appointment as any).customer) {
        const customerData = (appointment as any).customer;
        customer = {
          id: appointment.customerId,
          name: customerData.name || 'Unknown Customer',
          email: customerData.email,
          phone: customerData.phone
        };
      }
      // If not available, try to get from customerService
      else if (appointment.customerId) {
        try {
          // Get customer service from service factory instead of container
          const customerService = this.getCustomerService();
          if (customerService) {
            const customerData = await customerService.getById(appointment.customerId);
            if (customerData) {
              customer = {
                id: appointment.customerId,
                name: customerData.name || 'Unknown Customer',
                email: customerData.email,
                phone: customerData.phone
              };
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to load customer data for appointment ${appointment.id}`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Return consistent appointment detail response
      return {
        ...appointmentDto,
        notes: notes.map(note => ({
          id: note.id,
          appointmentId: note.appointmentId,
          text: note.text,
          userId: note.userId,
          userName: note.userName || 'Unknown User',
          formattedDate: note.createdAt.toLocaleString(),
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString()
        })),
        customer,
        activityLogs: []
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getAppointmentDetails`, { 
        error: error instanceof Error ? error.message : String(error), 
        id 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Termine für einen Kunden
   * 
   * @param customerId - Kunden-ID
   * @param options - Service-Optionen
   * @returns Gefundene Termine
   */
  async findByCustomer(
    customerId: number,
    options?: ServiceOptions
  ): Promise<AppointmentResponseDto[]> {
    try {
      const appointments = await this.repository.findByCustomer(customerId);
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByCustomer`, { 
        error: error instanceof Error ? error.message : String(error), 
        customerId 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Termine für einen Datumsbereich
   * 
   * @param startDate - Startdatum (YYYY-MM-DD)
   * @param endDate - Enddatum (YYYY-MM-DD)
   * @param options - Service-Optionen
   * @returns Gefundene Termine
   */
  async findByDateRange(
    startDate: string,
    endDate: string,
    options?: ServiceOptions
  ): Promise<AppointmentResponseDto[]> {
    try {
      // Convert string dates to Date objects for the repository
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      const appointments = await this.repository.findByDateRange(startDateObj, endDateObj);
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByDateRange`, { 
        error: error instanceof Error ? error.message : String(error), 
        startDate, 
        endDate 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert den Status eines Termins
   * 
   * @param id - Termin-ID
   * @param data - Status-Update-Daten
   * @param options - Service-Optionen
   * @returns Aktualisierter Termin
   */
  async updateStatus(
    id: number,
    data: UpdateAppointmentStatusDto,
    options?: ServiceOptions
  ): Promise<AppointmentResponseDto> {
    try {
      // Prüfe, ob der Termin existiert
      const appointment = await this.repository.findById(id);
      if (!appointment) {
        throw this.errorHandler.createNotFoundError(`Appointment with ID ${id} not found`);
      }

      // Prüfe, ob der Status gültig ist
      const validStatuses = Object.values(AppointmentStatus);
      if (!validStatuses.includes(data.status)) {
        throw this.errorHandler.createValidationError(
          'Invalid status',
          [`Status must be one of: ${validStatuses.join(', ')}`]
        );
      }

      // Aktualisiere den Status
      appointment.status = data.status;
      appointment.updateAuditData(options?.context?.userId);

      // Speichere die Änderungen
      const updatedAppointment = await this.repository.update(id, appointment);

      // Füge optional eine Notiz hinzu
      if (data.note && options?.context?.userId) {
        await this.addNote(id, data.note, options);
      }

      return this.toDTO(updatedAppointment);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.updateStatus`, { 
        error: error instanceof Error ? error.message : String(error),
        id, 
        data 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Fügt eine Notiz zu einem Termin hinzu
   * 
   * @param id - Termin-ID
   * @param note - Notiztext
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  async addNote(
    id: number,
    note: string,
    options?: ServiceOptions
  ): Promise<boolean> {
    try {
      // Prüfe, ob der Termin existiert
      const appointment = await this.repository.findById(id);
      if (!appointment) {
        throw this.errorHandler.createNotFoundError(`Appointment with ID ${id} not found`);
      }

      // Validiere die Eingabedaten
      if (!note || !note.trim()) {
        throw this.errorHandler.createValidationError(
          'Invalid note data',
          ['Note text is required']
        );
      }

      // Get userId from options context
      const userId = options?.context?.userId;
      
      // If userId is not provided, use a default system user ID (1 for admin)
      // This ensures the API still works even if the user context is missing
      const effectiveUserId = userId || 1;
      this.logger.debug(`Adding note to appointment ${id} with user ID: ${effectiveUserId}`, { providedUserId: userId });
      
      // Füge die Notiz hinzu
      await this.repository.addNote(id, effectiveUserId, note);

      return true;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.addNote`, { 
        error: error instanceof Error ? error.message : String(error),
        id, 
        note 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Holt bevorstehende Termine
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Bevorstehende Termine
   */
  async getUpcoming(
    limit: number = 10,
    options?: ServiceOptions & { days?: number }
  ): Promise<AppointmentResponseDto[]> {
    try {
      // Number of days to look ahead (default 7 days)
      const days = options?.days || 7;
      
      // Calculate date range
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + days);
      
      // Find appointments in date range
      const appointments = await this.repository.findByDateRange(today, endDate);
      
      // Sort by date and limit
      const sortedAppointments = appointments
        .sort((a, b) => {
          const dateA = new Date(a.appointmentDate);
          const dateB = new Date(b.appointmentDate);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, limit);
      
      return sortedAppointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getUpcoming`, { 
        error: error instanceof Error ? error.message : String(error),
        limit 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Mappt eine Entität auf ein DTO
   * 
   * @param entity - Zu mappende Entität
   * @returns DTO
   */
  toDTO(entity: Appointment): AppointmentResponseDto {
    // Verwenden der mapAppointmentToDto-Funktion aus den DTOs
    const baseDto = mapAppointmentToDto(entity);
    
    // Formatiere Datum und Zeit
    const dateObj = new Date(entity.appointmentDate);
    
    // Ensure appointmentDate is a string
    const appointmentDateStr = typeof entity.appointmentDate === 'string' 
      ? entity.appointmentDate 
      : entity.appointmentDate.toISOString().split('T')[0];
    
    // Process customer data consistently using AppointmentCustomerData interface
    if ((entity as any).customer) {
      const customerData = (entity as any).customer;
      baseDto.customerName = customerData.name;
      baseDto.customerData = {
        id: customerData.id,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone
      };
    }
    
    // Erweitere mit zusätzlichen Informationen
    return {
      ...baseDto,
      appointmentDate: appointmentDateStr, // Ensure appointmentDate is always a string
      dateFormatted: dateObj.toLocaleDateString(),
      timeFormatted: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      statusLabel: this.getStatusLabel(entity.status),
      statusClass: this.getStatusClass(entity.status)
    };
  }

  /**
   * Mappt ein DTO auf eine Entität
   * 
   * @param dto - DTO
   * @param existingEntity - Vorhandene Entität (bei Updates)
   * @returns Entitätsdaten
   */
  protected toEntity(
    dto: CreateAppointmentDto | UpdateAppointmentDto,
    existingEntity?: Appointment
  ): Partial<Appointment> {
    // Basisobjekt erstellen
    const entity: Partial<Appointment> = { 
      ...existingEntity 
    };
    
    // Übernehme Werte aus dem DTO
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.customerId !== undefined) entity.customerId = dto.customerId;
    if (dto.location !== undefined) entity.location = dto.location;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.status !== undefined) entity.status = dto.status;
    
    if (dto.duration !== undefined) {
        // Ensure duration is always a number
      if (typeof dto.duration === 'string') {
      try {
        const parsedDuration = parseInt(dto.duration, 10);
        entity.duration = isNaN(parsedDuration) ? 60 : parsedDuration;
          this.logger.debug(`Converted string duration to number: ${dto.duration} -> ${entity.duration}`);
      } catch (err) {
          this.logger.warn(`Error converting duration string '${dto.duration}' to number, using default`, { error: err });
            entity.duration = 60; // Default duration if parsing fails
          }
        } else {
          entity.duration = dto.duration;
        }
      }
    
    // Verarbeite Datum und Zeit
    if ('appointmentDate' in dto && dto.appointmentDate) {
      if ('appointmentTime' in dto && dto.appointmentTime) {
        // Kombiniere Datum und Zeit
        const [year, month, day] = dto.appointmentDate.split('-').map(Number);
        const [hour, minute] = dto.appointmentTime.split(':').map(Number);
        
        entity.appointmentDate = new Date(year, month - 1, day, hour, minute);
      } else {
        // Verwende nur das Datum
        entity.appointmentDate = new Date(dto.appointmentDate);
      }
    }
    
    return entity;
  }

  /**
   * Gibt das Validierungsschema für die Erstellung zurück
   */
  protected getCreateValidationSchema(): any {
    return {
      title: { type: 'string', minLength: 3, maxLength: 100, required: true },
      customerId: { type: 'number', required: false },
      appointmentDate: { type: 'string', format: 'date', required: true },
      appointmentTime: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$', required: true },
      duration: { type: 'number', minimum: 15, maximum: 480, required: false },
      location: { type: 'string', maxLength: 200, required: false },
      description: { type: 'string', maxLength: 1000, required: false },
      status: { type: 'string', enum: Object.values(AppointmentStatus), required: false }
    };
  }

  /**
   * Gibt das Validierungsschema für die Aktualisierung zurück
   */
  protected getUpdateValidationSchema(): any {
    return {
      title: { type: 'string', minLength: 3, maxLength: 100, required: false },
      customerId: { type: 'number', required: false },
      appointmentDate: { type: 'string', format: 'date', required: false },
      appointmentTime: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$', required: false },
      duration: { type: 'number', minimum: 15, maximum: 480, required: false },
      location: { type: 'string', maxLength: 200, required: false },
      description: { type: 'string', maxLength: 1000, required: false },
      status: { type: 'string', enum: Object.values(AppointmentStatus), required: false }
    };
  }

  /**
   * Gibt ein Label für einen Status zurück
   * 
   * @param status - Status
   * @returns Label
   */
  private getStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PLANNED:
        return 'Geplant';
      case AppointmentStatus.CONFIRMED:
        return 'Bestätigt';
      case AppointmentStatus.CANCELLED:
        return 'Abgesagt';
      case AppointmentStatus.COMPLETED:
        return 'Abgeschlossen';
      case AppointmentStatus.RESCHEDULED:
        return 'Verschoben';
      default:
        return 'Unbekannt';
    }
  }

  /**
   * Gibt eine CSS-Klasse für einen Status zurück
   * 
   * @param status - Status
   * @returns CSS-Klasse
   */
  private getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PLANNED:
        return 'bg-blue-100 text-blue-800';
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case AppointmentStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800';
      case AppointmentStatus.RESCHEDULED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}