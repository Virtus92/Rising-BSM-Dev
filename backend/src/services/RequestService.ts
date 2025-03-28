import { PrismaClient, ContactRequest } from '@prisma/client';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  IRequestService, 
  CreateRequestDto, 
  UpdateRequestStatusDto, 
  AddRequestNoteDto,
  RequestFilterParams,
  PaginatedRequests,
  ServiceOptions,
  AssignRequestDto,
  BatchUpdateStatusDto
} from '../interfaces/IRequestService.js';
import { NotificationEventManager, NotificationEventType } from '../events/NotificationEventManager.js';
import { ExportUtils } from '../utils/export-utils.js';
import { ValidationUtils } from '../utils/validation-utils.js';
import { ContactRequestCreatedEvent } from '../interfaces/INotificationEvents.js';

/**
 * Utility class to map API field names to Prisma schema field names
 */
class FieldMapper {
  // Map from API field names (typically snake_case) to Prisma field names (camelCase)
  private static fieldMap: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'processor_id': 'processorId',
    'ip_address': 'ipAddress'
  };

  /**
   * Maps an API field name to the corresponding Prisma schema field name
   * @param apiField - The field name from the API (e.g., 'created_at')
   * @returns The corresponding Prisma field name (e.g., 'createdAt')
   */
  public static toPrismaField(apiField: string): string {
    return this.fieldMap[apiField] || apiField;
  }
}

/**
 * Service for managing contact requests
 */
export class RequestService implements IRequestService {
  /**
   * Creates a new RequestService instance
   */
  constructor(
    private readonly prisma: PrismaClient,
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
      const contactRequest = await this.prisma.contactRequest.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          service: data.service,
          message: data.message,
          status: 'neu',
          ipAddress: context?.ipAddress
        }
      });

      this.logger.info(
        `New contact request created: ${contactRequest.id}`, 
        { ipAddress: context?.ipAddress }
      );
      
      // Get all administrators to notify about new contact request
      const admins = await this.prisma.user.findMany({
        where: {
          role: 'admin',
          status: 'active'
        }
      });
      
      if (admins.length > 0) {
        // Emit notification event for each admin
        admins.forEach(admin => {
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
  ): Promise<PaginatedRequests> {
    try {
      const {
        status,
        service,
        date,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt', // Default sort field
        sortDirection = 'desc' // Default sort direction
      } = filters;
      
      // Map API field name to Prisma schema field name
      const prismaSortField = FieldMapper.toPrismaField(sortBy);

      // Build where condition
      const where: any = {};

      if (status) {
        where.status = status;
      }
      
      if (service) {
        where.service = service;
      }

      if (date) {
        const dateObj = new Date(date);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        
        where.createdAt = {
          gte: dateObj,
          lt: nextDay
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Count total matching records
      const total = await this.prisma.contactRequest.count({ where });

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Get paginated data
      const contactRequests = await this.prisma.contactRequest.findMany({
        where,
        orderBy: {
          // Use mapped field name for Prisma schema
          [prismaSortField]: sortDirection
        },
        skip,
        take: limit,
        include: {
          notes: {
            select: {
              id: true,
              userId: true,
              userName: true,
              text: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 3 // Only include the 3 most recent notes
          }
        }
      });
      
      // Enhance data with additional formatting
      const data = contactRequests.map(request => ({
        ...request,
        serviceLabel: this.getServiceLabel(request.service),
        statusLabel: this.getStatusLabel(request.status),
        statusClass: this.getStatusClass(request.status),
        formattedDate: this.formatDate(request.createdAt)
      }));

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages
        },
        meta: {
          filters: {
            status,
            service,
            date,
            search
          }
        }
      };
    } catch (error) {
      // Enhanced error logging with more context
      const sortField = filters.sortBy ? FieldMapper.toPrismaField(filters.sortBy) : 'createdAt';
      this.logger.error('Error getting contact requests', error instanceof Error ? error : String(error), {
        filters,
        sortField
      });
      
      // Handle Prisma validation errors more gracefully
      if (error instanceof Error && error.name === 'PrismaClientValidationError') {
        const message = error instanceof Error && error.message.includes('Unknown argument') 
          ? 'Invalid sort field. Please check your query parameters.'
          : error instanceof Error ? error.message : 'An error occurred';
        
        throw this.errorHandler.createValidationError(message, [
          'Check that sortBy parameter uses valid field names.'
        ]);
      }
      
      throw error;
    }
  }

  /**
   * Get contact request by ID
   */
  async getRequestById(id: number): Promise<any> {
    try {
      // Ensure id is a valid integer
      const requestId = parseInt(String(id), 10);
      if (isNaN(requestId)) {
        throw this.errorHandler.createValidationError(`Invalid ID: ${id}`, ['ID must be a valid integer']);
      }
      
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id: requestId },
        include: {
          notes: {
            select: {
              id: true,
              userId: true,
              userName: true,
              text: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }
      
      // Get processor details if assigned
      let processor = null;
      if (contactRequest.processorId) {
        // Ensure processor ID is a valid integer
        const processorId = parseInt(String(contactRequest.processorId), 10);
        if (isNaN(processorId)) {
          throw this.errorHandler.createValidationError(`Invalid processor ID: ${contactRequest.processorId}`, ['Processor ID must be a valid integer']);
        }
        
        const user = await this.prisma.user.findUnique({
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
        notes: contactRequest.notes.map(note => ({
          ...note,
          formattedDate: this.formatDate(note.createdAt)
        })),
        processor
      };

      return enhancedRequest;
    } catch (error) {
      this.logger.error(`Error getting contact request: ${id}`, error instanceof Error ? error : String(error));
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
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id: requestId }
      });

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }

      // Update contact request status
      const updatedRequest = await this.prisma.contactRequest.update({
        where: { id: requestId },
        data: {
          status: data.status,
          processorId: context?.userId || contactRequest.processorId
        }
      });

      // Create log entry
      await this.prisma.requestLog.create({
        data: {
          requestId: id,
          userId: context?.userId || 0,
          userName: 'System',
          action: `Status updated to ${data.status}`,
          details: data.note ? `Status updated with note: ${data.note}` : `Status changed from ${contactRequest.status} to ${data.status}`,
          createdAt: new Date()
        }
      });
      
      // Add note if provided
      if (data.note) {
        await this.prisma.requestNote.create({
          data: {
            requestId: id,
            userId: context?.userId || 0,
            userName: 'System',
            text: data.note,
            createdAt: new Date()
          }
        });
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
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id: requestId }
      });

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${data.requestId} not found`);
      }

      // Create note
      const note = await this.prisma.requestNote.create({
        data: {
          requestId: data.requestId,
          userId: data.userId,
          userName: data.userName,
          text: data.text,
          createdAt: new Date()
        }
      });

      // Create log entry
      await this.prisma.requestLog.create({
        data: {
          requestId: data.requestId,
          userId: data.userId,
          userName: data.userName,
          action: 'Note added',
          details: `Note added to contact request ${data.requestId}`,
          createdAt: new Date()
        }
      });

      this.logger.info(
        `Note added to contact request ${data.requestId}`, 
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
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id: requestId }
      });

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }

      // Check if processor exists
      // Ensure processor ID is a valid integer
      const processorId = parseInt(String(data.processorId), 10);
      if (isNaN(processorId)) {
        throw this.errorHandler.createValidationError(`Invalid processor ID: ${data.processorId}`, ['Processor ID must be a valid integer']);
      }
      
      const processor = await this.prisma.user.findUnique({
        where: { id: processorId }
      });

      if (!processor) {
        throw this.errorHandler.createNotFoundError(`User with ID ${data.processorId} not found`);
      }

      // Update contact request with processor
      const updatedRequest = await this.prisma.contactRequest.update({
        where: { id: requestId },
        data: {
          processorId: data.processorId,
          status: contactRequest.status === 'neu' ? 'in_bearbeitung' : contactRequest.status,
        }
      });

      // Create log entry
      await this.prisma.requestLog.create({
        data: {
          requestId: id,
          userId: context?.userId || 0,
          userName: processor.name,
          action: 'Assigned',
          details: `Contact request assigned to ${processor.name}`,
          createdAt: new Date()
        }
      });

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
      
      // Update all matching request statuses
      const updateResult = await this.prisma.contactRequest.updateMany({
        where: {
          id: {
            in: data.ids
          }
        },
        data: {
          status: data.status,
          processorId: context?.userId
        }
      });
      
      // Create log entries for each request
      for (const id of data.ids) {
        await this.prisma.requestLog.create({
          data: {
            requestId: id,
            userId: context?.userId || 0,
            userName: 'System',
            action: `Batch status update to ${data.status}`,
            details: data.note ? `Status updated with note: ${data.note}` : `Status updated to ${data.status}`,
            createdAt: new Date()
          }
        });
        
        // Add note if provided
        if (data.note) {
          await this.prisma.requestNote.create({
            data: {
              requestId: id,
              userId: context?.userId || 0,
              userName: 'System',
              text: data.note,
              createdAt: new Date()
            }
          });
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
      // Get sort field with proper mapping
      const sortBy = filters.sortBy || 'createdAt';
      const sortField = FieldMapper.toPrismaField(sortBy);
      
      // Get requests data without pagination (for export)
      const contactRequests = await this.prisma.contactRequest.findMany({
        where: this.buildFilterWhere(filters),
        orderBy: {
          [sortField]: filters.sortDirection || 'desc'
        }
      });
      
      // Prepare data for export
      const exportData = contactRequests.map(request => ({
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
  
  // Helper Methods
  
  /**
   * Build where condition for filters
   */
  private buildFilterWhere(filters: RequestFilterParams): any {
    const where: any = {};
    
    // No need for local mapping here, using FieldMapper utility
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.service) {
      where.service = filters.service;
    }
    
    if (filters.date) {
      const dateObj = new Date(filters.date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.createdAt = {
        gte: dateObj,
        lt: nextDay
      };
    } else if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    } else if (filters.startDate) {
      where.createdAt = {
        gte: new Date(filters.startDate)
      };
    } else if (filters.endDate) {
      where.createdAt = {
        lte: new Date(filters.endDate)
      };
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    return where;
  }
  
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
}