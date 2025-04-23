import { BaseService } from './BaseService';
import { ContactRequest } from '@/domain/entities/ContactRequest';
import { IRequestService } from '@/domain/services/IRequestService';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import {
  CreateRequestDto,
  UpdateRequestDto,
  RequestResponseDto,
  RequestDetailResponseDto,
  RequestStatusUpdateDto,
  ConvertToCustomerDto,
  RequestNoteDto
} from '@/domain/dtos/RequestDtos';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';
import { mapRequestToDto } from '@/domain/dtos/RequestDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { RequestStatus, AppointmentStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { Customer } from '@/domain/entities/Customer';
import { Appointment } from '@/domain/entities/Appointment';
import { 
  getRequestStatusLabel, 
  getRequestStatusClass,
  getAppointmentStatusLabel,
  getAppointmentStatusClass 
} from '@/domain/utils/statusUtils';

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
    protected userRepository: IUserRepository,
    protected appointmentRepository: IAppointmentRepository,
    protected notificationService: any, // Inject the NotificationService
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(requestRepository, logger, validator, errorHandler);
  }

  /**
   * Find all requests with pagination and filtering
   * 
   * @param options Service options including pagination and filters
   * @returns Paginated results
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<RequestResponseDto>> {
    try {
      // Convert service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Add filter criteria if provided in options
      if (options?.filters) {
        repoOptions.criteria = {};
        
        if (options.filters.status) {
          repoOptions.criteria.status = options.filters.status;
        }
        
        if (options.filters.type) {
          repoOptions.criteria.type = options.filters.type;
        }
        
        if (options.filters.assignedTo) {
          repoOptions.criteria.processorId = options.filters.assignedTo;
        }
        
        if (options.filters.startDate && options.filters.endDate) {
          repoOptions.criteria.createdAtRange = {
            start: options.filters.startDate,
            end: options.filters.endDate
          };
        } else if (options.filters.startDate) {
          repoOptions.criteria.createdAtAfter = options.filters.startDate;
        } else if (options.filters.endDate) {
          repoOptions.criteria.createdAtBefore = options.filters.endDate;
        }
      }
      
      // Get requests from repository
      const result = await this.repository.findAll(repoOptions);
      
      // Map entities to DTOs
      return {
        data: result.data.map(request => this.toDTO(request)),
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
   * Count requests with optional filtering
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
      
      if (options?.filters?.type) {
        criteria.type = options.filters.type;
      }
      
      if (options?.filters?.assignedTo) {
        criteria.processorId = options.filters.assignedTo;
      }
      
      if (options?.filters?.startDate && options?.filters?.endDate) {
        criteria.createdAtRange = {
          start: options.filters.startDate,
          end: options.filters.endDate
        };
      } else if (options?.filters?.startDate) {
        criteria.createdAtAfter = options.filters.startDate;
      } else if (options?.filters?.endDate) {
        criteria.createdAtBefore = options.filters.endDate;
      }
      
      this.logger.info('Counting requests with criteria', { criteria });
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
    try {
      // Create the request using the base method
      const createdRequest = await this.create(data, options);
      
      // Determine if this is a customer-created request or a public request
      // A customer request is one where:
      // 1. We have a userId in context (authenticated user)
      // 2. User role is 'user' (not admin, manager, or employee)
      // 3. OR we explicitly have a customerId in the context
      const isCustomerRequest = 
        (options?.context?.userId && options?.context?.role === 'user') ||
        (options?.context?.customerId !== undefined);
      
      const customerId = options?.context?.customerId;
      const requestType = isCustomerRequest ? 'customer_request' : 'public_request';
      
      this.logger.info(`Creating ${requestType}`, { 
        isCustomerRequest, 
        userId: options?.context?.userId,
        customerId
      });
      
      // Find admins and managers to notify about the new request
      const adminsAndManagers = await this.userRepository.findByCriteria({
        role: { in: ['admin', 'manager'] },
        status: 'active'
      });
      
      if (adminsAndManagers.length > 0 && this.notificationService) {
        const userIds = adminsAndManagers.map(user => user.id);
        
        // Different notifications for customer vs public requests
        if (isCustomerRequest) {
          // Customer request notification
          await this.notificationService.createNotificationForMultipleUsers(
            userIds,
            `New Request from Existing Customer`,
            `Customer ${data.name} (${data.email}) has submitted a new request for ${data.service}.`,
            'customer', // NotificationType.CUSTOMER
            {
              contactRequestId: createdRequest.id,
              customerId: options?.context?.customerId || customerId,
              link: `/dashboard/requests/${createdRequest.id}`
            }
          );
        } else {
          // Public request notification
          await this.notificationService.createNotificationForMultipleUsers(
            userIds,
            `New Public Request`,
            `${data.name} (${data.email}) has submitted a public request for ${data.service}.`,
            'request', // NotificationType.REQUEST
            {
              contactRequestId: createdRequest.id,
              link: `/dashboard/requests/${createdRequest.id}`
            }
          );
        }
      }
      
      return createdRequest;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.createRequest`, {
        error: error instanceof Error ? error.message : String(error),
        data
      });
      throw this.handleError(error);
    }
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
      this.logger.error(`Error in ${this.constructor.name}.findRequests`, { 
        error: error instanceof Error ? error.message : String(error),
        criteria 
      });
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
  ): Promise<RequestDetailResponseDto> {
    try {
      const repoOptions = this.mapToRepositoryOptions({
        ...options,
        relations: ['notes', 'customer', 'appointment']
      });

      const request = await this.requestRepository.findById(id, repoOptions);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Lade Notizen zur Anfrage
      const notes = await this.requestRepository.getNotes(id);

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
      this.logger.error(`Error in ${this.constructor.name}.findRequestById`, { 
        error: error instanceof Error ? error.message : String(error),
        id 
      });
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
    try {
      // Verify that the request exists before trying to update it
      const existingRequest = await this.requestRepository.findById(id);
      if (!existingRequest) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }
    
      // Create a clean version of data without non-Prisma fields and nested relations
      // This prevents problems with Prisma's expectations for nested relations
      const cleanData: Record<string, any> = {};
      
      // Only include fields that are part of the ContactRequest model
      // and explicitly exclude nested relations that need special handling
      const allowedFields = [
        'name', 'email', 'phone', 'service', 'message', 'status', 
        'processorId', 'customerId', 'appointmentId', 'ipAddress',
        'source', 'metadata'
      ];
      
      // Only copy allowed fields that are present in the data
      // Use type assertion to treat data as a record with string keys
      const dataRecord = data as Record<string, unknown>;
      for (const field of allowedFields) {
        if (field in dataRecord && dataRecord[field] !== undefined) {
          cleanData[field] = dataRecord[field];
        }
      }
      
      // Set updatedAt timestamp
      cleanData.updatedAt = new Date();
      
      // Log user ID for audit purposes
      if (options?.context?.userId) {
        this.logger.info(`Request ${id} updated by user ${options.context.userId}`);
      }
      
      // Use the repository directly for the update to have better control over the operation
      const updatedRequest = await this.requestRepository.update(id, cleanData);
      
      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.updateRequest`, {
        error: error instanceof Error ? error.message : String(error),
        id,
        data
      });
      throw this.handleError(error);
    }
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

      // Create clean update object with only the needed properties
      // Important: Don't include createdBy/updatedBy fields that might not exist in Prisma schema
      const updateData = {
        status: data.status,
        updatedAt: new Date()
        // Don't include updatedBy as it's not in the Prisma schema
      };

      // Log the update attempt
      this.logger.info(`Updating request status`, {
        id,
        newStatus: data.status,
        // Store the user ID in the log but don't include in the update data
        updateBy: options?.context?.userId
      });
      
      // Speichere die Änderungen - using repository directly to avoid potential id issues
      const updatedRequest = await this.requestRepository.update(id, updateData);

      // Füge optional eine Notiz hinzu
      if (data.note && options?.context?.userId) {
        const user = await this.userRepository.findById(options.context.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';
        await this.addNote(id, options.context.userId, userName, data.note, options);
      }

      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.updateRequestStatus`, { 
        error: error instanceof Error ? error.message : String(error),
        id, 
        data 
      });
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
    id: number,
    userId: number,
    userName: string,
    text: string,
    options?: ServiceOptions
  ): Promise<RequestNoteDto> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Validiere die Eingabedaten
      if (!text || !text.trim()) {
        throw this.errorHandler.createValidationError(
          'Invalid note data',
          ['Note text is required']
        );
      }

      // Füge die Notiz hinzu
      const note = await this.requestRepository.addNote(id, userId, userName, text);

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
      this.logger.error(`Error in ${this.constructor.name}.addNote`, { 
        error: error instanceof Error ? error.message : String(error),
        id, 
        userId, 
        text 
      });
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
    userId: number,
    note?: string,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    try {
      // Prüfe, ob die Anfrage existiert
      const request = await this.requestRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Weise die Anfrage zu
      request.processorId = userId;
      
      // Wenn die Anfrage noch neu ist, setze sie auf "in Bearbeitung"
      if (request.status === RequestStatus.NEW) {
        request.status = RequestStatus.IN_PROGRESS;
      }
      
      request.updateAuditData(options?.context?.userId);

      // Speichere die Änderungen
      const updatedRequest = await this.requestRepository.update(id, request);

      // Füge eine Notiz hinzu
      if (options?.context?.userId) {
        const user = await this.userRepository.findById(options.context.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';
        const noteText = note || `Request assigned to processor ID ${userId}`;
        await this.addNote(id, options.context.userId, userName, noteText, options);
      }

      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.assignRequest`, { 
        error: error instanceof Error ? error.message : String(error),
        id, 
        userId 
      });
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
        const user = await this.userRepository.findById(options.context.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';
        await this.addNote(data.requestId, options.context.userId, userName, `Request converted to customer ID ${customer.id}${
            appointment ? ` and appointment ID ${appointment.id} created` : ''
          }`, options);
            
        // Send notification to all managers and admins about customer conversion
        if (this.notificationService) {
          // Find admins and managers 
          const adminsAndManagers = await this.userRepository.findByCriteria({
            role: { in: ['admin', 'manager'] },
            status: 'active'
          });
          
          if (adminsAndManagers.length > 0) {
            const userIds = adminsAndManagers.map(u => u.id);
            const title = 'Request Converted to Customer';
            const message = `Request from ${request.name} was converted to a new customer${appointment ? ' with appointment' : ''}.`;
            
            await this.notificationService.createNotificationForMultipleUsers(
              userIds,
              title,
              message,
              'customer',
              {
                customerId: customer.id,
                contactRequestId: data.requestId,
                appointmentId: appointment?.id,
                link: `/dashboard/customers/${customer.id}`
              }
            );
          }
        }
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
      this.logger.error(`Error in ${this.constructor.name}.convertToCustomer`, { 
        error: error instanceof Error ? error.message : String(error),
        data 
      });
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
    note?: string,
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

      // Create a clean update object with only the necessary fields
      const updateData = {
        customerId,
        updatedAt: new Date(),
        updatedBy: options?.context?.userId
      };

      // Log the linking operation
      this.logger.info(`Linking request ${requestId} to customer ${customerId}`, {
        requestId,
        customerId,
        updatedBy: options?.context?.userId
      });

      // Speichere die Änderungen - using clean object without id
      const updatedRequest = await this.requestRepository.update(requestId, updateData);

      // Füge eine Notiz hinzu
      if (options?.context?.userId) {
        const user = await this.userRepository.findById(options.context.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';
        const noteText = note || `Request linked to customer ID ${customerId}`;
        await this.addNote(requestId, options.context.userId, userName, noteText, options);
      }

      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.linkToCustomer`, { 
        error: error instanceof Error ? error.message : String(error),
        requestId, 
        customerId 
      });
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
    appointmentData: Partial<Appointment>,
    note?: string,
    options?: ServiceOptions
  ): Promise<AppointmentResponseDto> {
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

      // Prepare only the necessary fields for update to avoid inclusion of ID
      const requestUpdate = {
        appointmentId: appointment.id,
        updatedAt: new Date(),
        updatedBy: options?.context?.userId
      };
      
      // Log the update operation
      this.logger.info(`Linking appointment ${appointment.id} to request ${requestId}`, {
        requestId,
        appointmentId: appointment.id,
        updatedBy: options?.context?.userId
      });

      // Speichere die Änderungen an der Anfrage - using minimal update object
      await this.requestRepository.update(requestId, requestUpdate);

      // Füge eine Notiz hinzu
      if (options?.context?.userId) {
        const user = await this.userRepository.findById(options.context.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System';
        const noteText = note || `Appointment ID ${appointment.id} created for request`;
        await this.addNote(requestId, options.context.userId, userName, noteText, options);
      }

      // Format date and time for display
      const dateObj = appointment.appointmentDate;
      const dateFormatted = dateObj.toLocaleDateString();
      const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const appointmentTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        id: appointment.id,
        title: appointment.title,
        appointmentDate: appointment.appointmentDate.toISOString(),
        dateFormatted: dateFormatted,
        appointmentTime: appointmentTime,
        timeFormatted: timeFormatted,
        duration: appointment.duration ?? 60, // Default to 60 minutes if undefined
        location: appointment.location,
        description: appointment.description,
        status: appointment.status,
        statusLabel: getAppointmentStatusLabel(appointment.status),
        statusClass: getAppointmentStatusClass(appointment.status),
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
        customerId: appointment.customerId,
        customerName: request.name
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.createAppointmentForRequest`, { 
        error: error instanceof Error ? error.message : String(error),
        requestId, 
        appointmentData 
      });
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
    period?: string,
    options?: ServiceOptions
  ): Promise<{
    totalRequests: number;
    newRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    requestsWithCustomer: number;
    conversionRate: number;
  }> {
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
      this.logger.error(`Error in ${this.constructor.name}.getRequestStats`, {
        error: error instanceof Error ? error.message : String(error)
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
  toDTO(entity: ContactRequest): RequestResponseDto {
    // Verwenden der mapRequestToDto-Funktion aus den DTOs
    const baseDto = mapRequestToDto(entity);
    
    // Erweitere mit zusätzlichen Informationen
    return {
      ...baseDto,
      statusLabel: getRequestStatusLabel(entity.status),
      statusClass: getRequestStatusClass(entity.status),
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
      phone: { type: 'string', pattern: '^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$', required: false },
      service: { type: 'string', minLength: 2, maxLength: 100, required: false },
      message: { type: 'string', minLength: 10, maxLength: 1000, required: false },
      status: { type: 'string', enum: Object.values(RequestStatus), required: false },
      processorId: { type: 'number', required: false },
      customerId: { type: 'number', required: false },
      appointmentId: { type: 'number', required: false }
    };
  }
}