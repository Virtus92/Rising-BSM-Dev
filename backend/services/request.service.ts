/**
 * Request Service
 * 
 * Service for ContactRequest entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import { BaseService } from '../utils/base.service.js';
import { 
  RequestRepository, 
  ContactRequest, 
  requestRepository 
} from '../repositories/request.repository.js';
import { 
  ContactRequestCreateDTO, 
  ContactRequestResponseDTO, 
  ContactRequestDetailDTO,
  RequestFilterDTO
} from '../types/dtos/request.dto.js';
import { 
  NotFoundError, 
  ValidationError
} from '../../backup/utils_bak/errors.js';
import { 
  CreateOptions, 
  UpdateOptions, 
  FindOneOptions, 
  FindAllOptions 
} from '../types/service.types.js';
import { getAnfrageStatusInfo } from '../../backup/utils_bak/helpers.js';
import { validateEmail, validateRequired } from '../../backup/utils_bak/common-validators.js';
import logger from '../utils/logger.js';

/**
 * Service for ContactRequest entity operations
 */
export class RequestService extends BaseService<
  ContactRequest,
  RequestRepository,
  RequestFilterDTO,
  ContactRequestCreateDTO,
  any, // No update DTO, only status updates
  ContactRequestResponseDTO
> {
  /**
   * Creates a new RequestService instance
   * @param repository - RequestRepository instance
   */
  constructor(repository: RequestRepository = requestRepository) {
    super(repository);
  }

  /**
   * Find all contact requests with filtering and pagination
   * @param filters - Filter criteria
   * @param options - Find options
   * @returns Paginated list of contact requests
   */
  async findAll(
    filters: RequestFilterDTO,
    options: FindAllOptions = {}
  ): Promise<{ data: ContactRequestResponseDTO[]; pagination: any }> {
    try {
      // Get requests from repository
      const result = await this.repository.findAll(filters, {
        page: options.page,
        limit: options.limit,
        orderBy: options.orderBy 
          ? { [options.orderBy]: options.orderDirection || 'desc' }
          : { createdAt: 'desc' as const }
      });
      
      // Map to response DTOs
      const requests = result.data.map((request) => this.mapEntityToDTO(request as any));
      
      return {
        data: requests,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error, 'Error fetching contact requests', { filters, options });
    }
  }

  /**
   * Find contact request by ID with notes
   * @param id - Contact request ID
   * @param options - Find options
   * @returns Contact request with notes or null if not found
   */
  async findByIdWithDetails(
    id: number,
    options: FindOneOptions = {}
  ): Promise<ContactRequestDetailDTO | null> {
    try {
      // Get request with notes from repository
      const result = await this.repository.getRequestWithNotes(id);
      
      // Return null if request not found
      if (!result) {
        if (options.throwIfNotFound) {
          throw new NotFoundError(`Contact request with ID ${id} not found`);
        }
        return null;
      }
      
      // Map to detailed response DTO
      return this.mapToDetailDTO(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error fetching contact request details for ID ${id}`);
    }
  }

  /**
   * Get recent contact requests
   * @param limit - Maximum number of requests to return
   * @returns List of recent contact requests
   */
  async getRecentRequests(limit: number = 5): Promise<ContactRequestResponseDTO[]> {
    try {
      const requests = await this.repository.getRecentRequests(limit);
      return requests.map((request: ContactRequest) => this.mapEntityToDTO(request));
    } catch (error) {
      this.handleError(error, 'Error fetching recent contact requests');
    }
  }

  /**
   * Count new contact requests
   * @returns Number of new contact requests
   */
  async countNewRequests(): Promise<number> {
    try {
      return this.repository.countNewRequests();
    } catch (error) {
      this.handleError(error, 'Error counting new contact requests');
    }
  }

  /**
   * Create a new contact request
   * @param data - Contact request create DTO
   * @param options - Create options
   * @returns Created contact request
   */
  async create(
    data: ContactRequestCreateDTO,
    options: CreateOptions = {}
  ): Promise<ContactRequestResponseDTO> {
    try {
      // Validate create data
      await this.validateCreate(data);
      
      // Map DTO to entity
      const requestData = this.mapCreateDtoToEntity(data);
      
      // Set IP address if provided
      if (options.userContext?.ipAddress) {
        requestData.ipAddress = options.userContext.ipAddress;
      }
      
      // Create request
      const created = await this.repository.create(requestData);
      
      // Process any required notifications - would typically be handled by a notification service
      
      // Return mapped response
      return this.mapEntityToDTO(created);
    } catch (error) {
      this.handleError(error, 'Error creating contact request', { data });
    }
  }

  /**
   * Update contact request status
   * @param id - Contact request ID
   * @param status - New status
   * @param note - Optional note about the status change
   * @param options - Update options
   * @returns Updated contact request
   */
  async updateStatus(
    id: number,
    status: string,
    note: string | null = null,
    options: UpdateOptions = {}
  ): Promise<ContactRequestResponseDTO> {
    try {
      // Validate status
      const validStatuses = ['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Execute transaction for status update and optional note
      const updated = await this.repository.transaction(async (tx) => {
        // Update status
        const updated = await tx.contactRequest.update({
          where: { id },
          data: {
            status,
            updatedAt: new Date()
          }
        });
        
        // Add note if provided
        if (note && options.userContext?.userId) {
          await tx.requestNote.create({
            data: {
              requestId: id,
              userId: options.userContext.userId,
              userName: options.userContext.userName || 'System',
              text: note
            }
          });
        } else if (note && options.userId) {
          await tx.requestNote.create({
            data: {
              requestId: id,
              userId: options.userId,
              userName: 'System',
              text: note
            }
          });
        }
        
        // Log status change
        if (options.userContext?.userId) {
          await this.repository.createLog(
            id,
            options.userContext.userId,
            options.userContext.userName || 'System',
            'status_changed',
            `Status changed to: ${status}`
          );
        } else if (options.userId) {
          await this.repository.createLog(
            id,
            options.userId,
            'System',
            'status_changed',
            `Status changed to: ${status}`
          );
        }
        
        return updated;
      });
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating status for contact request with ID ${id}`, { id, status });
    }
  }

  /**
   * Add a note to a contact request
   * @param id - Contact request ID
   * @param text - Note text
   * @param options - Create options
   * @returns Success message
   */
  async addNote(
    id: number,
    text: string,
    options: CreateOptions = {}
  ): Promise<{ success: boolean; message: string; noteId?: number }> {
    try {
      // Validate note text
      if (!text || text.trim() === '') {
        throw new ValidationError('Note text is required');
      }
      
      // Check if contact request exists
      const request = await this.repository.findById(id);
      
      if (!request) {
        throw new NotFoundError(`Contact request with ID ${id} not found`);
      }
      
      let noteId;
      
      // Add note
      if (options.userContext?.userId) {
        const note = await this.repository.createNote(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          text
        );
        
        noteId = note.id;
        
        // Log activity
        await this.repository.createLog(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'note_added',
          'Note added to contact request'
        );
      } else if (options.userId) {
        const note = await this.repository.createNote(
          id,
          options.userId,
          'System',
          text
        );
        
        noteId = note.id;
        
        // Log activity
        await this.repository.createLog(
          id,
          options.userId,
          'System',
          'note_added',
          'Note added to contact request'
        );
      } else {
        throw new ValidationError('User context is required to add a note');
      }
      
      return {
        success: true,
        message: 'Note added successfully',
        noteId
      };
    } catch (error) {
      this.handleError(error, `Error adding note to contact request with ID ${id}`, { id, text });
    }
  }

  /**
   * Validate create DTO
   * @param data - Create DTO
   * @throws ValidationError if validation fails
   */
  protected async validateCreate(data: ContactRequestCreateDTO): Promise<void> {
    // Validate required fields
    validateRequired(data.name, 'Name');
    validateEmail(data.email);
    validateRequired(data.service, 'Service');
    validateRequired(data.message, 'Message', 10);
  }

  /**
   * Map entity to response DTO
   * @param entity - Contact request entity
   * @returns Contact request response DTO
   */
  protected mapEntityToDTO(entity: ContactRequest | any): ContactRequestResponseDTO {
    const statusInfo = getAnfrageStatusInfo(entity.status);
    
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      serviceLabel: entity.service === 'facility' ? 'Facility Management' : 
                   entity.service === 'moving' ? 'Umzüge & Transporte' : 
                   entity.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
      formattedDate: format(entity.createdAt, 'dd.MM.yyyy'),
      status: entity.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    };
  }

  /**
   * Map contact request with notes to detailed response DTO
   * @param result - Contact request with notes
   * @returns Contact request detail response DTO
   */
  protected mapToDetailDTO(result: any): ContactRequestDetailDTO {
    const request = result;
    const statusInfo = getAnfrageStatusInfo(request.status);
    
    // Format notes if available
    const formattedNotes = request.notes?.map((note: any) => ({
      id: note.id,
      text: note.text,
      formattedDate: format(note.createdAt, 'dd.MM.yyyy, HH:mm'),
      benutzer: note.userName
    })) || [];
    
    return {
      id: request.id,
      name: request.name,
      email: request.email,
      phone: request.phone || 'Nicht angegeben',
      serviceLabel: request.service === 'facility' ? 'Facility Management' : 
                    request.service === 'moving' ? 'Umzüge & Transporte' : 
                    request.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
      message: request.message,
      formattedDate: format(request.createdAt, 'dd.MM.yyyy'),
      status: request.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className,
      notes: formattedNotes
    };
  }

  /**
   * Map create DTO to entity
   * @param dto - Create DTO
   * @returns Partial entity for creation
   */
  protected mapCreateDtoToEntity(dto: ContactRequestCreateDTO): Partial<ContactRequest> {
    return {
      name: dto.name,
      email: dto.email,
      phone: dto.phone || null,
      service: dto.service,
      message: dto.message,
      status: 'neu'
    };
  }
}

/**
 * Create and export default service instance for convenience
 */
export const requestService = new RequestService();