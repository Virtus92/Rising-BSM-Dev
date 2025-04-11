import { BaseService } from './BaseService';
import { ContactRequest } from '@/domain/entities/ContactRequest';
import { IRequestService } from '@/domain/services/IRequestService';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import {
  CreateRequestDto,
  UpdateRequestDto,
  RequestResponseDto,
  RequestDetailResponseDto,
  RequestStatusUpdateDto,
  ConvertToCustomerDto
} from '@/domain/dtos/RequestDtos';
import { mapRequestToDto } from '@/domain/dtos/RequestDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { Customer } from '@/domain/entities/Customer';
import { CustomerType } from '@/domain/enums/CommonEnums';
import { Appointment } from '@/domain/entities/Appointment';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';

/**
 * Service für Kontaktanfragen
 * 
 * Implementiert IRequestService und erweitert BaseService.
 */
export class RequestService extends BaseService<
  ContactRequest,
  CreateRequestDto,
  UpdateRequestDto,
  RequestResponseDto
> implements IRequestService {
  
  /**
   * Konstruktor
   * 
   * @param requestRepository - Repository für Kontaktanfragen
   * @param customerRepository - Repository für Kunden
   * @param appointmentRepository - Repository für Termine
   * @param logger - Logging-Dienst
   * @param validator - Validierungsdienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    protected requestRepository: IRequestRepository,
    protected customerRepository: ICustomerRepository,
    protected appointmentRepository: IAppointmentRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(requestRepository, logger, validator, errorHandler);
  }

  /**
   * Erstellt eine neue Anfrage
   * 
   * @param data - Anfragedaten
   * @param options - Service-Optionen
   * @returns Erstellte Anfrage
   */
  async createRequest(
    data: CreateRequestDto,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    return this.create(data, options);
  }

  /**
   * Findet Anfragen mit Filteroptionen
   * 
   * @param criteria - Filterkriterien
   * @param options - Service-Optionen
   * @returns Gefundene Anfragen mit Paginierung
   */
  async findRequests(
    criteria: Record<string, any>,
    options?: ServiceOptions
  ): Promise<import('@/domain/repositories/IBaseRepository').PaginationResult<RequestResponseDto>> {
    try {
      const repoOptions = this.mapToRepositoryOptions(options);
      const result = await this.requestRepository.findRequests(criteria, repoOptions);
      
      return {
        data: result.data.map(request => this.toDTO(request)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findRequests`, { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Findet eine Anfrage anhand ihrer ID
   * 
   * @param id - Anfrage-ID
   * @param options - Service-Optionen
   * @returns Gefundene Anfrage oder null
   */
  async findRequestById(
    id: number,
    options?: ServiceOptions
  ): Promise<RequestDetailResponseDto | null> {
    try {
      const repoOptions = this.mapToRepositoryOptions({
        ...options,
        relations: ['notes', 'customer', 'appointment']
      });

      const request = await this.requestRepository.findById(id, repoOptions);
      if (!request) {
        return null;
      }

      // Lade Notizen zur Anfrage
      const notes = await this.requestRepository.findNotes(id);

      // Lade Kundeninformationen, falls verknüpft
      let customer = undefined;
      if (request.customerId) {
        const customerEntity = await this.customerRepository.findById(request.customerId);
        if (customerEntity) {
          customer = {
            id: customerEntity.id,
            name: customerEntity.name,
            email: customerEntity.email,
            phone: customerEntity.phone,
            company: customerEntity.company
          };
        }
      }

      // Lade Termininformationen, falls verknüpft
      let appointment = undefined;
      if (request.appointmentId) {
        const appointmentEntity = await this.appointmentRepository.findById(request.appointmentId);
        if (appointmentEntity) {
          appointment = {
            id: appointmentEntity.id,
            title: appointmentEntity.title,
            appointmentDate: appointmentEntity.appointmentDate.toISOString(),
            status: appointmentEntity.status
          };
        }
      }

      // Basis-DTO erstellen
      const requestDto = this.toDTO(request) as RequestResponseDto;

      // Erweitern mit Details
      return {
        ...requestDto,
        notes: notes.map(note => ({
          id: note.id,
          requestId: note.requestId,
          text: note.text,
          userId: note.userId,
          userName: note.userName || 'Unknown User',
          formattedDate: note.createdAt.toLocaleString(),
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString()
        })),
        customer,
        appointment,
        activityLogs: []
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findRequestById`, { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert eine Anfrage
   * 
   * @param id - Anfrage-ID
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  async updateRequest(
    id: number,
    data: UpdateRequestDto,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    return this.update(id, data, options);
  }

  /**
   * Aktualisiert den Status einer Anfrage
   * 
   * @param id - Anfrage-ID
   * @param data - Statusaktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  async updateRequestStatus(
    id: number,
    data: RequestStatusUpdateDto,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Prüfe, ob der Status gültig ist
      const validStatuses = Object.values(RequestStatus);
      if (!validStatuses.includes(data.status)) {
        throw this.errorHandler.createValidationError(
          'Invalid status',
          [`Status must be one of: ${validStatuses.join(', ')}`]
        );
      }

      // Aktualisiere den Status
      request.status = data.status;
      request.updateAuditData(options?.context?.userId);

      // Speichere die Änderungen
      const updatedRequest = await this.requestRepository.update(id, request);

      // Füge optional eine Notiz hinzu
      if (data.note && options?.context?.userId) {
        await this.addNote(id, {
          text: data.note,
          userId: options.context.userId
        }, options);
      }

      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.updateRequestStatus`, { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht eine Anfrage
   * 
   * @param id - Anfrage-ID
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  async deleteRequest(
    id: number,
    options?: ServiceOptions
  ): Promise<boolean> {
    return this.delete(id, options);
  }

  /**
   * Fügt eine Notiz zu einer Anfrage hinzu
   * 
   * @param requestId - Anfrage-ID
   * @param data - Notizdaten
   * @param options - Service-Optionen
   * @returns Erstellte Notiz
   */
  async addNote(
    requestId: number,
    data: { text: string; userId: number },
    options?: ServiceOptions
  ): Promise<any> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }

      // Validiere die Eingabedaten
      if (!data.text || !data.text.trim()) {
        throw this.errorHandler.createValidationError(
          'Invalid note data',
          ['Note text is required']
        );
      }

      // Füge die Notiz hinzu
      const note = await this.requestRepository.addNote(requestId, data.userId, data.text);

      return {
        id: note.id,
        requestId: note.requestId,
        text: note.text,
        userId: note.userId,
        userName: note.userName || 'Unknown User',
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString()
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.addNote`, { error, requestId, data });
      throw this.handleError(error);
    }
  }

  /**
   * Weist eine Anfrage einem Benutzer zu
   * 
   * @param id - Anfrage-ID
   * @param processorId - Bearbeiter-ID
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  async assignRequest(
    id: number,
    processorId: number,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Weise die Anfrage zu
      request.processorId = processorId;
      
      // Wenn die Anfrage noch neu ist, setze sie auf "in Bearbeitung"
      if (request.status === RequestStatus.NEW) {
        request.status = RequestStatus.IN_PROGRESS;
      }
      
      request.updateAuditData(options?.context?.userId);

      // Speichere die Änderungen
      const updatedRequest = await this.requestRepository.update(id, request);

      // Füge eine Notiz hinzu
      if (options?.context?.userId) {
        await this.addNote(id, {
          text: `Request assigned to processor ID ${processorId}`,
          userId: options.context.userId
        }, options);
      }

      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.assignRequest`, { error, id, processorId });
      throw this.handleError(error);
    }
  }

  /**
   * Konvertiert eine Anfrage zu einem Kunden
   * 
   * @param data - Konvertierungsdaten
   * @param options - Service-Optionen
   * @returns Ergebnis der Konvertierung
   */
  async convertToCustomer(
    data: ConvertToCustomerDto,
    options?: ServiceOptions
  ): Promise<{ customer: any; request: RequestResponseDto }> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(data.requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${data.requestId} not found`);
      }

      // Erstelle einen neuen Kunden basierend auf der Anfrage
      const customerData: Partial<Customer> = {
        name: data.customerData?.name || request.name,
        email: data.customerData?.email || request.email,
        phone: data.customerData?.phone || request.phone,
        company: data.customerData?.company,
        type: data.customerData?.type === 'business' ? CustomerType.BUSINESS : CustomerType.PRIVATE,
        // Weitere Felder aus data.customerData übernehmen
        ...(data.customerData?.address && { address: data.customerData.address }),
        ...(data.customerData?.postalCode && { postalCode: data.customerData.postalCode }),
        ...(data.customerData?.city && { city: data.customerData.city }),
        ...(data.customerData?.country && { country: data.customerData.country }),
        newsletter: data.customerData?.newsletter || false
      };

      // Erstelle den Kunden
      const customer = await this.customerRepository.create(customerData);

      // Aktualisiere die Anfrage, um sie mit dem Kunden zu verknüpfen
      request.customerId = customer.id;
      request.updateAuditData(options?.context?.userId);

      // Erstelle optional einen Termin
      let appointment = null;
      if (data.createAppointment && data.appointmentData) {
        const appointmentData: Partial<Appointment> = {
          title: data.appointmentData.title || `Appointment for ${customer.name}`,
          customerId: customer.id,
          appointmentDate: data.appointmentData.appointmentDate 
            ? new Date(data.appointmentData.appointmentDate) 
            : new Date(),
          duration: data.appointmentData.duration || 60,
          location: data.appointmentData.location,
          description: data.appointmentData.description || request.message,
          status: AppointmentStatus.PLANNED
        };

        // Erstelle den Termin
        appointment = await this.appointmentRepository.create(appointmentData);

        // Verknüpfe den Termin mit der Anfrage
        request.appointmentId = appointment.id;
      }

      // Speichere die Änderungen an der Anfrage
      const updatedRequest = await this.requestRepository.update(data.requestId, request);

      // Füge eine Notiz hinzu
      if (options?.context?.userId) {
        await this.addNote(data.requestId, {
          text: `Request converted to customer ID ${customer.id}${
            appointment ? ` and appointment ID ${appointment.id} created` : ''
          }`,
          userId: options.context.userId
        }, options);
      }

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          type: customer.type
        },
        request: this.toDTO(updatedRequest)
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.convertToCustomer`, { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Verknüpft eine Anfrage mit einem bestehenden Kunden
   * 
   * @param requestId - Anfrage-ID
   * @param customerId - Kunden-ID
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  async linkToCustomer(
    requestId: number,
    customerId: number,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }

      // Prüfe, ob der Kunde existiert
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${customerId} not found`);
      }

      // Verknüpfe die Anfrage mit dem Kunden
      request.customerId = customerId;
      request.updateAuditData(options?.context?.userId);

      // Speichere die Änderungen
      const updatedRequest = await this.requestRepository.update(requestId, request);

      // Füge eine Notiz hinzu
      if (options?.context?.userId) {
        await this.addNote(requestId, {
          text: `Request linked to customer ID ${customerId}`,
          userId: options.context.userId
        }, options);
      }

      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.linkToCustomer`, { error, requestId, customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt einen Termin für eine Anfrage
   * 
   * @param requestId - Anfrage-ID
   * @param appointmentData - Termindaten
   * @param options - Service-Optionen
   * @returns Erstellter Termin
   */
  async createAppointmentForRequest(
    requestId: number,
    appointmentData: any,
    options?: ServiceOptions
  ): Promise<any> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }

      // Erstelle den Termin
      const appointmentEntity: Partial<Appointment> = {
        title: appointmentData.title || `Appointment for ${request.name}`,
        customerId: request.customerId,
        appointmentDate: appointmentData.appointmentDate 
          ? new Date(appointmentData.appointmentDate) 
          : new Date(),
        duration: appointmentData.duration || 60,
        location: appointmentData.location,
        description: appointmentData.description || request.message,
        status: AppointmentStatus.PLANNED
      };

      // Erstelle den Termin
      const appointment = await this.appointmentRepository.create(appointmentEntity);

      // Verknüpfe die Anfrage mit dem Termin
      request.appointmentId = appointment.id;
      request.updateAuditData(options?.context?.userId);

      // Speichere die Änderungen an der Anfrage
      await this.requestRepository.update(requestId, request);

      // Füge eine Notiz hinzu
      if (options?.context?.userId) {
        await this.addNote(requestId, {
          text: `Appointment ID ${appointment.id} created for request`,
          userId: options.context.userId
        }, options);
      }

      return {
        id: appointment.id,
        title: appointment.title,
        appointmentDate: appointment.appointmentDate.toISOString(),
        duration: appointment.duration,
        location: appointment.location,
        description: appointment.description,
        status: appointment.status
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.createAppointmentForRequest`, { error, requestId, appointmentData });
      throw this.handleError(error);
    }
  }

  /**
   * Ruft Statistiken zu Anfragen ab
   * 
   * @param options - Service-Optionen
   * @returns Anfragenstatistiken
   */
  async getRequestStats(
    options?: ServiceOptions
  ): Promise<any> {
    try {
      // Zähle Anfragen nach Status
      const totalRequests = await this.requestRepository.count();
      const newRequests = await this.requestRepository.count({ status: RequestStatus.NEW });
      const inProgressRequests = await this.requestRepository.count({ status: RequestStatus.IN_PROGRESS });
      const completedRequests = await this.requestRepository.count({ status: RequestStatus.COMPLETED });
      const cancelledRequests = await this.requestRepository.count({ status: RequestStatus.CANCELLED });

      // Berechne die Konversionsrate (Anfragen mit Kunden / Gesamtanzahl)
      const requestsWithCustomer = await this.requestRepository.count({
        customerId: { $ne: null }
      } as any);
      
      const conversionRate = totalRequests ? (requestsWithCustomer / totalRequests) * 100 : 0;

      return {
        totalRequests,
        newRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        requestsWithCustomer,
        conversionRate: Math.round(conversionRate * 100) / 100 // Auf 2 Dezimalstellen runden
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getRequestStats`, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Mappt eine Entität auf ein DTO
   * 
   * @param entity - Zu mappende Entität
   * @returns DTO
   */
  toDTO(entity: ContactRequest): RequestResponseDto {
    // Verwenden der mapRequestToDto-Funktion aus den DTOs
    const baseDto = mapRequestToDto(entity);
    
    // Erweitere mit zusätzlichen Informationen
    return {
      ...baseDto,
      statusLabel: this.getStatusLabel(entity.status),
      statusClass: this.getStatusClass(entity.status),
      processorName: entity.processorId ? `User ID ${entity.processorId}` : undefined,
      customerName: entity.customerId ? `Customer ID ${entity.customerId}` : undefined,
      appointmentTitle: entity.appointmentId ? `Appointment ID ${entity.appointmentId}` : undefined
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
    dto: CreateRequestDto | UpdateRequestDto,
    existingEntity?: ContactRequest
  ): Partial<ContactRequest> {
    // Basisobjekt erstellen
    const entity: Partial<ContactRequest> = { 
      ...existingEntity 
    };
    
    // Übernehme Werte aus dem DTO
    if ('name' in dto && dto.name !== undefined) entity.name = dto.name;
    if ('email' in dto && dto.email !== undefined) entity.email = dto.email;
    if ('phone' in dto && dto.phone !== undefined) entity.phone = dto.phone;
    if ('service' in dto && dto.service !== undefined) entity.service = dto.service;
    if ('message' in dto && dto.message !== undefined) entity.message = dto.message;
    if ('status' in dto && dto.status !== undefined) entity.status = dto.status;
    if ('processorId' in dto && dto.processorId !== undefined) entity.processorId = dto.processorId;
    if ('customerId' in dto && dto.customerId !== undefined) entity.customerId = dto.customerId;
    if ('appointmentId' in dto && dto.appointmentId !== undefined) entity.appointmentId = dto.appointmentId;
    if ('ipAddress' in dto && dto.ipAddress !== undefined) entity.ipAddress = dto.ipAddress;
    
    return entity;
  }

  /**
   * Gibt das Validierungsschema für die Erstellung zurück
   */
  protected getCreateValidationSchema(): any {
    return {
      name: { type: 'string', minLength: 2, maxLength: 100, required: true },
      email: { type: 'string', format: 'email', required: true },
      phone: { type: 'string', pattern: '^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$', required: false },
      service: { type: 'string', minLength: 2, maxLength: 100, required: true },
      message: { type: 'string', minLength: 10, maxLength: 1000, required: true },
      ipAddress: { type: 'string', required: false }
    };
  }

  /**
   * Gibt das Validierungsschema für die Aktualisierung zurück
   */
  protected getUpdateValidationSchema(): any {
    return {
      name: { type: 'string', minLength: 2, maxLength: 100, required: false },
      email: { type: 'string', format: 'email', required: false },
      phone: { type: 'string', pattern: '^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$', required: false },
      service: { type: 'string', minLength: 2, maxLength: 100, required: false },
      message: { type: 'string', minLength: 10, maxLength: 1000, required: false },
      status: { type: 'string', enum: Object.values(RequestStatus), required: false },
      processorId: { type: 'number', required: false },
      customerId: { type: 'number', required: false },
      appointmentId: { type: 'number', required: false }
    };
  }

  /**
   * Gibt ein Label für einen Status zurück
   * 
   * @param status - Status
   * @returns Label
   */
  private getStatusLabel(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.NEW:
        return 'Neu';
      case RequestStatus.IN_PROGRESS:
        return 'In Bearbeitung';
      case RequestStatus.COMPLETED:
        return 'Abgeschlossen';
      case RequestStatus.CANCELLED:
        return 'Abgebrochen';
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
  private getStatusClass(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.NEW:
        return 'bg-blue-100 text-blue-800';
      case RequestStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case RequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case RequestStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}