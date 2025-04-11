import { BaseService } from './BaseService';
import { Appointment } from '@/domain/entities/Appointment';
import { IAppointmentService } from '@/domain/services/IAppointmentService';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
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
  }

  /**
   * Ruft detaillierte Termininfos ab
   * 
   * @param id - Termin-ID
   * @param options - Service-Optionen
   * @returns Termin mit Details oder null
   */
  async getAppointmentDetails(
    id: number,
    options?: ServiceOptions
  ): Promise<AppointmentDetailResponseDto | null> {
    try {
      const repoOptions = this.mapToRepositoryOptions({
        ...options,
        relations: ['notes', 'customer']
      });

      const appointment = await this.repository.findById(id, repoOptions);
      if (!appointment) {
        return null;
      }

      // Lade Notizen zum Termin
      const notes = await this.repository.findNotes(id);

      // Basis-DTO erstellen
      const appointmentDto = this.toDTO(appointment) as AppointmentResponseDto;

      // Erweitern mit Details
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
        customer: appointment.customerId ? {
          id: appointment.customerId,
          name: 'Customer Name', // Hier würde normalerweise der tatsächliche Kundenname stehen
          email: 'customer@example.com',
          phone: '123-456-7890'
        } : undefined,
        activityLogs: []
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getAppointmentDetails`, { error, id });
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
      this.logger.error(`Error in ${this.constructor.name}.findByCustomer`, { error, customerId });
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
      this.logger.error(`Error in ${this.constructor.name}.findByDateRange`, { error, startDate, endDate });
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
      this.logger.error(`Error in ${this.constructor.name}.updateStatus`, { error, id, data });
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
      if (!userId) {
        throw this.errorHandler.createValidationError(
          'Invalid user',
          ['User ID is required to add a note']
        );
      }

      // Füge die Notiz hinzu
      await this.repository.addNote(id, userId, note);

      return true;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.addNote`, { error, id, note });
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
    options?: ServiceOptions
  ): Promise<AppointmentResponseDto[]> {
    try {
      const appointments = await this.repository.findUpcoming(limit);
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getUpcoming`, { error, limit });
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
      : entity.appointmentDate.toISOString();
    
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
    if (dto.duration !== undefined) entity.duration = dto.duration;
    
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