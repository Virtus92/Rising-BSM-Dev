import { PrismaClient, ContactRequest } from '@prisma/client';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  IContactService, 
  CreateContactRequestDto, 
  UpdateContactRequestStatusDto, 
  AddContactRequestNoteDto,
  ContactRequestFilterParams,
  PaginatedContactRequests,
  ContactServiceOptions
} from '../interfaces/IContactService.js';
import { NotificationEventManager, NotificationEventType } from '../events/NotificationEventManager.js';
import { ContactRequestCreatedEvent, ContactRequestAcceptedEvent } from '../interfaces/INotificationEvents.js';

/**
 * Service for managing contact requests
 */
export class ContactService implements IContactService {
  /**
   * Creates a new ContactService instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized ContactService');
  }

  /**
   * Create a new contact request
   * 
   * @param data - Contact request data
   * @param options - Optional service options
   * @returns Created contact request
   */
  async createContactRequest(
    data: CreateContactRequestDto,
    options?: ContactServiceOptions
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
   * 
   * @param filters - Filter parameters
   * @returns Paginated contact requests
   */
  async getContactRequests(
    filters: ContactRequestFilterParams
  ): Promise<PaginatedContactRequests> {
    try {
      const {
        status,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortDirection = 'desc'
      } = filters;

      // Build where condition
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      } else if (startDate) {
        where.createdAt = {
          gte: new Date(startDate)
        };
      } else if (endDate) {
        where.createdAt = {
          lte: new Date(endDate)
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { service: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Count total matching records
      const total = await this.prisma.contactRequest.count({ where });

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Get paginated data
      const data = await this.prisma.contactRequest.findMany({
        where,
        orderBy: {
          [sortBy]: sortDirection
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
            }
          }
        }
      });

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error getting contact requests', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get contact request by ID
   * 
   * @param id - Contact request ID
   * @returns Contact request details
   */
  async getContactRequestById(id: number): Promise<any> {
    try {
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id },
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

      return contactRequest;
    } catch (error) {
      this.logger.error(`Error getting contact request: ${id}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Update contact request status
   * 
   * @param id - Contact request ID
   * @param data - Status update data
   * @param options - Optional service options
   * @returns Updated contact request
   */
  async updateContactRequestStatus(
    id: number,
    data: UpdateContactRequestStatusDto,
    options?: ContactServiceOptions
  ): Promise<ContactRequest> {
    try {
      const context = options?.context;
      
      // Check if contact request exists
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id }
      });

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }

      // Update contact request status
      const updatedRequest = await this.prisma.contactRequest.update({
        where: { id },
        data: {
          status: data.status,
          processorId: context?.userId
        }
      });

      // Create log entry
      await this.prisma.requestLog.create({
        data: {
          requestId: id,
          userId: context?.userId || 0,
          userName: 'System',
          action: `Status updated to ${data.status}`,
          details: `Contact request status changed from ${contactRequest.status} to ${data.status}`,
          createdAt: new Date()
        }
      });
      
      // Emit event if status changed to 'accepted' or 'rejected'
      if (data.status === 'accepted' && contactRequest.status !== 'accepted') {
        // Get contact request details
        const contact = await this.prisma.contactRequest.findUnique({
          where: { id }
        });
        
        // Get processor details
        let processorName = 'Administrator';
        if (context?.userId) {
          const processor = await this.prisma.user.findUnique({
            where: { id: context.userId }
          });
          if (processor) {
            processorName = processor.name;
          }
        }
        
        // Emit notification event
        NotificationEventManager.getInstance().emit(
          NotificationEventType.CONTACT_REQUEST_ACCEPTED,
          {
            senderId: contact?.processorId || context?.userId,
            recipientId: contact?.id,  // User who created the contact request
            recipientName: processorName,
            requestId: id,
            timestamp: new Date()
          } as ContactRequestAcceptedEvent
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
   * 
   * @param data - Note data
   * @param options - Optional service options
   * @returns Created note
   */
  async addContactRequestNote(
    data: AddContactRequestNoteDto,
    options?: ContactServiceOptions
  ): Promise<any> {
    try {
      const context = options?.context;
      
      // Check if contact request exists
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id: data.requestId }
      });

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${data.requestId} not found`);
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${data.userId} not found`);
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
}