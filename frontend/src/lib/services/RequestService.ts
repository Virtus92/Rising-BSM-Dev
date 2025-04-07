import { ContactRequest } from '../entities/ContactRequest.js';
import { ILoggingService } from '../lib/interfaces/ILoggingService.js';
import { IErrorHandler } from '../lib/interfaces/IErrorHandler.js';
import { IRequestService } from '../lib/interfaces/IRequestService.js';
import { 
  CreateRequestDto, 
  UpdateRequestDto,
  UpdateRequestStatusDto, 
  AddRequestNoteDto,
  RequestFilterParams,
  PaginatedRequestsResponse,
  RequestResponseDto,
  AssignRequestDto,
  BatchUpdateStatusDto
} from '../dtos/RequestDtos.js';

/**
 * Extended DTO with additional UI display properties
 */
interface EnhancedRequestResponseDto extends RequestResponseDto {
  serviceLabel?: string;
  statusClass?: string;
  formattedDate?: string;
  notes?: any[];
  processor?: any;
}
import { ServiceOptions, FilterCriteria } from '../../types/interfaces/IBaseService.js';
import { NotificationEventManager, NotificationEventType } from '../events/NotificationEventManager.js';
import { ExportUtils } from '../utils/export-utils.js';
import { ValidationUtils } from '../utils/validation-utils.js';
import { ContactRequestCreatedEvent } from '../lib/interfaces/INotificationEvents.js';
import { IRequestRepository } from '../lib/interfaces/IRequestRepository.js';

/**
 * Service for managing contact requests
 */
export class RequestService implements IRequestService {
  /**
   * Creates a new RequestService instance
   */
  constructor(
    private readonly requestRepository: IRequestRepository,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized RequestService');
  }

  /**
   * Create a new contact request
   */
  async createRequest(
    data: CreateRequestDto,
    options?: ServiceOptions
  ): Promise<ContactRequest> {
    try {
      const context = options?.context;
      
      // Create contact request
      const contactRequest = await this.requestRepository.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        service: data.service,
        message: data.message
      });

      this.logger.info(
        `New contact request created: ${contactRequest.id}`, 
        { ipAddress: context?.ipAddress }
      );
      
      // Get all administrators to notify about new contact request
      const admins = await this.requestRepository.getPrismaClient().user.findMany({
        where: {
          role: 'admin',
          status: 'active'
        }
      });
      
      if (admins.length > 0) {
        // Emit notification event for each admin
        admins.forEach((admin: any) => {
          NotificationEventManager.getInstance().emit(
            NotificationEventType.CONTACT_REQUEST_CREATED,
            {
              senderId: 0, // System
              senderName: data.name,
              recipientId: admin.id,
              requestId: contactRequest.id,
              timestamp: new Date()
            } as ContactRequestCreatedEvent
          );
        });
      }

      return contactRequest;
    } catch (error) {
      this.logger.error('Error creating contact request', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get contact requests with filtering and pagination
   */
  async getRequests(
    filters: RequestFilterParams
  ): Promise<PaginatedRequestsResponse> {
    try {
      // Standardwerte setzen
      if (!filters.sortBy) {
        filters.sortBy = 'createdAt';
      }
      
      // Die Konvertierung von snake_case zu camelCase erfolgt jetzt in der Repository-Klasse
      
      const result = await this.requestRepository.findWithFilters(filters);
      
      // Add formatting enhancements to data if needed
      const enhancedData = result.data.map((request: any) => ({
        ...request,
        statusClass: this.getStatusClass(request.status),
        serviceLabel: this.getServiceLabel(request.service),
        formattedDate: this.formatDate(request.createdAt)
      }));

      return {
        data: enhancedData,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error getting contact requests', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get contact request by ID
   */
  async getRequestById(id: number): Promise<EnhancedRequestResponseDto> {
    try {
      // Validate ID format
      const requestId = parseInt(String(id), 10);
      if (isNaN(requestId)) {
        throw this.errorHandler.createValidationError(`Invalid ID: ${id}`, ['ID must be a valid integer']);
      }
      
      // Use repository to fetch request with notes
      const contactRequest = await this.requestRepository.findByIdWithNotes(requestId);
      
      // Get processor details if assigned
      let processor = null;
      if (contactRequest.processorId !== undefined && contactRequest.processorId !== null) {
        const processorId = contactRequest.processorId;
        
        const user = await this.requestRepository.getPrismaClient().user.findUnique({
          where: { id: processorId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
        
        processor = user;
      }
      
      // Enhance data with additional formatting
      const enhancedRequest = {
        ...contactRequest,
        serviceLabel: this.getServiceLabel(contactRequest.service),
        statusLabel: this.getStatusLabel(contactRequest.status),
        statusClass: this.getStatusClass(contactRequest.status),
        formattedDate: this.formatDate(contactRequest.createdAt),
        notes: (contactRequest as any).notes ? (contactRequest as any).notes.map((note: any) => ({
          ...note,
          formattedDate: this.formatDate(note.createdAt)
        })) : [],
        processor
      };

      return enhancedRequest;
    } catch (error) {
      this.logger.error(`Error getting contact request: ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Update contact request status
   */
  async updateRequestStatus(
    id: number,
    data: UpdateRequestStatusDto,
    options?: ServiceOptions
  ): Promise<ContactRequest> {
    try {
      const context = options?.context;
      
      // Ensure id is a valid integer
      const requestId = parseInt(String(id), 10);
      if (isNaN(requestId)) {
        throw this.errorHandler.createValidationError(`Invalid ID: ${id}`, ['ID must be a valid integer']);
      }
      
      // Check if contact request exists
      const contactRequest = await this.requestRepository.findById(requestId);

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }

      // Update contact request status
      const updatedRequest = await this.requestRepository.update(requestId, {
        status: data.status,
        processorId: context?.userId || contactRequest.processorId
      });

      // Create log entry for this action
      const logDetails = data.note ? 
        `Status updated with note: ${data.note}` : 
        `Status changed from ${contactRequest.status} to ${data.status}`;
      
      await this.requestRepository.createLogEntry(
        id,
        context?.userId || 0,
        'System',
        `Status updated to ${data.status}`,
        logDetails
      );
      
      // Add note if provided
      if (data.note) {
        await this.requestRepository.addNote(
          id,
          context?.userId || 0,
          'System',
          data.note
        );
      }

      this.logger.info(
        `Contact request ${id} status updated to ${data.status}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error updating contact request status: ${id}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Add a note to a contact request
   */
  async addRequestNote(
    data: AddRequestNoteDto,
    options?: ServiceOptions
  ): Promise<any> {
    try {
      const context = options?.context;
      
      // Ensure requestId is a valid integer
      const requestId = parseInt(String(data.requestId), 10);
      if (isNaN(requestId)) {
        throw this.errorHandler.createValidationError(`Invalid request ID: ${data.requestId}`, ['Request ID must be a valid integer']);
      }
      
      // Check if contact request exists
      const contactRequest = await this.requestRepository.findById(requestId);

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${data.requestId} not found`);
      }

      // Create note using repository
      const note = await this.requestRepository.addNote(
        requestId,
        data.userId ?? 0,
        data.userName ?? 'System',
        data.text
      );

      // Create log entry
      await this.requestRepository.createLogEntry(
        requestId,
        data.userId ?? 0,
        data.userName ?? 'System',
        'Note added',
        `Note added to contact request ${requestId}`
      );

      this.logger.info(
        `Note added to contact request ${requestId}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return note;
    } catch (error) {
      this.logger.error(`Error adding note to contact request: ${data.requestId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }
  
  /**
   * Assign a request to a processor
   */
  async assignRequest(
    id: number,
    data: AssignRequestDto,
    options?: ServiceOptions
  ): Promise<ContactRequest> {
    try {
      const context = options?.context;
      
      // Ensure id is a valid integer
      const requestId = parseInt(String(id), 10);
      if (isNaN(requestId)) {
        throw this.errorHandler.createValidationError(`Invalid ID: ${id}`, ['ID must be a valid integer']);
      }
      
      // Check if contact request exists
      const contactRequest = await this.requestRepository.findById(requestId);

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }

      // Check if processor exists
      const processorId = data.processorId;
      
      const processor = await this.requestRepository.getPrismaClient().user.findUnique({
        where: { id: processorId }
      });

      if (!processor) {
        throw this.errorHandler.createNotFoundError(`User with ID ${data.processorId} not found`);
      }

      // Update contact request with processor using repository
      const updatedRequest = await this.requestRepository.updateProcessor(requestId, data.processorId);

      // Create log entry
      await this.requestRepository.createLogEntry(
        id,
        context?.userId || 0,
        processor.name,
        'Assigned',
        `Contact request assigned to ${processor.name}`
      );

      this.logger.info(
        `Contact request ${id} assigned to processor ${data.processorId}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return updatedRequest;
    } catch (error) {
      this.logger.error(
        `Error assigning contact request ${id} to processor ${data.processorId}`, 
        error instanceof Error ? error : String(error)
      );
      throw error;
    }
  }
  
  /**
   * Batch update request statuses
   */
  async batchUpdateRequestStatus(
    data: BatchUpdateStatusDto,
    options?: ServiceOptions
  ): Promise<{ count: number }> {
    try {
      const context = options?.context;
      
      // Validate ids
      if (!data.ids.length) {
        throw this.errorHandler.createValidationError('No IDs provided', ['At least one ID must be provided']);
      }
      
      // Update all matching request statuses using repository
      const updateResult = await this.requestRepository.batchUpdateStatus(data.ids, data.status);
      
      // Create log entries for each request
      for (const id of data.ids) {
        // Create log entry
        await this.requestRepository.createLogEntry(
          id,
          context?.userId || 0,
          'System',
          `Batch status update to ${data.status}`,
          data.note ? `Status updated with note: ${data.note}` : `Status updated to ${data.status}`
        );
        
        // Add note if provided
        if (data.note) {
          await this.requestRepository.addNote(
            id,
            context?.userId || 0,
            'System',
            data.note
          );
        }
      }
      
      this.logger.info(
        `Batch updated ${updateResult.count} contact requests to status ${data.status}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );
      
      return { count: updateResult.count };
    } catch (error) {
      this.logger.error(
        `Error batch updating contact request statuses`, 
        error instanceof Error ? error : String(error)
      );
      throw error;
    }
  }
  
  /**
   * Export contact requests to CSV or Excel
   */
  async exportRequests(
    format: 'csv' | 'excel',
    filters: RequestFilterParams
  ): Promise<Buffer> {
    try {
      // Get all requests without pagination for export
      // We'll get everything first, then format and export
      const result = await this.requestRepository.findWithFilters({
        ...filters,
        page: 1,
        limit: 1000 // Using a high limit to get all results
      });
      
      // Prepare data for export
      const exportData = result.data.map(request => ({
        ID: request.id,
        Name: request.name,
        Email: request.email,
        Phone: request.phone || '',
        Service: this.getServiceLabel(request.service),
        Status: this.getStatusLabel(request.status),
        Message: request.message,
        CreatedAt: this.formatDate(request.createdAt)
      }));
      
      // Generate file based on format
      if (format === 'csv') {
        return await ExportUtils.generateCsv(exportData);
      } else {
        return await ExportUtils.generateExcel(exportData, 'Contact Requests');
      }
    } catch (error) {
      this.logger.error(
        `Error exporting contact requests`, 
        error instanceof Error ? error : String(error)
      );
      throw error;
    }
  }

  // Implementation of IBaseService interface methods
  
  /**
   * Get all entities with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginatedRequestsResponse> {
    return this.getRequests({
      page: options?.page,
      limit: options?.limit,
      sortBy: options?.sort?.field,
      sortDirection: options?.sort?.direction === 'DESC' ? 'desc' : 'asc'
    });
  }
  
  /**
   * Get entity by ID
   */
  async getById(id: number, options?: ServiceOptions): Promise<RequestResponseDto | null> {
    return this.getRequestById(id);
  }
  
  /**
   * Create a new entity
   */
  async create(data: CreateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto> {
    const request = await this.createRequest(data, options);
    return this.toDTO(request);
  }
  
  /**
   * Update an entity
   */
  async update(id: number, data: UpdateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto> {
    // If status is provided, use updateRequestStatus
    if (data.status) {
      const request = await this.updateRequestStatus(id, { status: data.status }, options);
      return this.toDTO(request);
    }
    
    // Otherwise perform a regular update
    const existingRequest = await this.requestRepository.findById(id);
    if (!existingRequest) {
      throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
    }
    
    const updatedRequest = await this.requestRepository.update(id, data);
    return this.toDTO(updatedRequest);
  }
  
  /**
   * Delete an entity (not implemented for requests)
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    // Contact requests are not deletable
    throw this.errorHandler.createValidationError(
      'Operation not supported', 
      ['Contact requests cannot be deleted']
    );
  }
  
  /**
   * Find entities by criteria
   */
  async findByCriteria(criteria: FilterCriteria, options?: ServiceOptions): Promise<RequestResponseDto[]> {
    const result = await this.getRequests({
      ...criteria as RequestFilterParams,
      page: options?.page,
      limit: options?.limit
    });
    
    return result.data;
  }
  
  /**
   * Validate entity data
   */
  async validate(data: CreateRequestDto | UpdateRequestDto, isUpdate?: boolean): Promise<void> {
    const errors: string[] = [];
    
    // Check required fields for new requests
    if (!isUpdate) {
      if (!data.name) errors.push('Name is required');
      if (!data.email) errors.push('Email is required');
      if (!data.service) errors.push('Service is required');
      if (!data.message) errors.push('Message is required');
    }
    
    // Validate email if provided
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email format is invalid');
    }
    
    // Validate phone if provided
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Phone format is invalid');
    }
    
    if (errors.length > 0) {
      throw this.errorHandler.createValidationError('Validation failed', errors);
    }
  }
  
  /**
   * Transform entity to DTO
   */
  toDTO(entity: ContactRequest): RequestResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      service: entity.service,
      serviceLabel: this.getServiceLabel(entity.service!), // Added non-null assertion
      message: entity.message,
      status: entity.status,
      statusLabel: this.getStatusLabel(entity.status),
      processorId: entity.processorId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
  
  /**
   * Execute within transaction - not implemented
   */
  async transaction<R>(callback: (service: IRequestService) => Promise<R>): Promise<R> {
    // Simple implementation without actual transaction support
    return callback(this);
  }
  
  // Helper Methods
  
  /**
   * Get formatted service label
   */
  private getServiceLabel(service: string): string {
    const serviceMap: Record<string, string> = {
      'facility': 'Facility Management',
      'moving': 'Umzugsservice',
      'winter': 'Winterdienst',
      'other': 'Sonstige Anfrage'
    };
    
    return serviceMap[service] || service;
  }
  
  /**
   * Get formatted status label
   */
  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'neu': 'Neu',
      'in_bearbeitung': 'In Bearbeitung',
      'beantwortet': 'Beantwortet',
      'geschlossen': 'Geschlossen'
    };
    
    return statusMap[status] || status;
  }
  
  /**
   * Get CSS class for status
   */
  private getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'neu': 'bg-blue-100 text-blue-800',
      'in_bearbeitung': 'bg-yellow-100 text-yellow-800',
      'beantwortet': 'bg-green-100 text-green-800',
      'geschlossen': 'bg-gray-100 text-gray-800'
    };
    
    return classMap[status] || '';
  }
  
  /**
   * Format date for display
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Check if email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Check if phone number is valid
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }
}