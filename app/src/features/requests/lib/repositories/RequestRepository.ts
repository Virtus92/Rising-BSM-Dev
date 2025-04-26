import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { ContactRequest } from '@/domain/entities/ContactRequest';
import { ConvertToCustomerDto, RequestFilterParamsDto, RequestStatusUpdateDto } from '@/domain/dtos/RequestDtos';
import { Customer } from '@/domain/entities/Customer';
import { Appointment } from '@/domain/entities/Appointment';
import { RequestNote } from '@/domain/entities/RequestNote';
import { RequestStatus, LogActionType, AppointmentStatus, CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Repository implementation for contact requests
 */
export class RequestRepository extends PrismaRepository<ContactRequest> implements IRequestRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma, 'contactRequest', logger, errorHandler);
  }
  
  /**
   * Override update method specifically for contact requests
   * to handle missing schema fields
   */
  async update(id: number, data: Partial<ContactRequest>): Promise<ContactRequest> {
    try {
      // Create a safe copy of data without fields that don't exist in Prisma schema
      const safeData: any = { ...data };
      
      // Remove these fields because they don't exist in the Prisma schema
      delete safeData.updatedBy;
      delete safeData.createdBy;
      
      // Set updatedAt timestamp
      safeData.updatedAt = new Date();
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Safely updating request ${id} with filtered data`, safeData);
      }
      
      // Execute the update using the filtered data
      const updatedRequest = await this.prisma.contactRequest.update({
        where: { id },
        data: safeData
      });
      
      return this.mapToDomainEntity(updatedRequest);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.update:`, { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Process criteria for queries
   * 
   * @param criteria - Query criteria
   * @returns Processed criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    if (criteria.name !== undefined) {
      processedCriteria.name = { contains: criteria.name, mode: 'insensitive' };
    }
    
    if (criteria.email !== undefined) {
      processedCriteria.email = { contains: criteria.email, mode: 'insensitive' };
    }
    
    if (criteria.service !== undefined) {
      processedCriteria.service = { contains: criteria.service, mode: 'insensitive' };
    }
    
    if (criteria.message !== undefined) {
      processedCriteria.message = { contains: criteria.message, mode: 'insensitive' };
    }
    
    // Pass through other criteria directly
    ['id', 'status', 'processorId', 'customerId', 'appointmentId', 'createdBy', 'updatedBy'].forEach(key => {
      if (criteria[key] !== undefined) {
        processedCriteria[key] = criteria[key];
      }
    });
    
    // Handle special criteria
    if (criteria.unassigned === true) {
      processedCriteria.processorId = null;
    }
    
    if (criteria.notConverted === true) {
      processedCriteria.customerId = null;
    }
    
    return processedCriteria;
  }

  /**
   * Update the status of a contact request
   * 
   * @param id - Request ID
   * @param data - Status update data
   * @returns Updated request
   */
  async updateStatus(id: number, data: RequestStatusUpdateDto): Promise<ContactRequest> {
    try {
      return await this.transaction(async () => {
        // Update status
        const updatedRequest = await this.prisma.contactRequest.update({
          where: { id },
          data: { status: data.status }
        });

        // Add note if available
        if (data.note) {
          await this.prisma.requestLog.create({
            data: {
              requestId: id,
              userId: updatedRequest.processorId || 0,
              userName: 'System',
              action: LogActionType.CHANGE_STATUS,
              details: data.note
            }
          });
        }

        return this.mapToDomainEntity(updatedRequest);
      });
    } catch (error) {
      this.logger.error('Error updating request status', { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Add a note to a contact request
   * 
   * @param id - Request ID
   * @param userId - User ID
   * @param userName - User name
   * @param text - Note text
   * @returns Created note
   */
  async addNote(id: number, userId: number, userName: string, text: string): Promise<RequestNote> {
    try {
      const requestNote = await this.prisma.requestNote.create({
        data: {
          requestId: id,
          userId,
          userName,
          text,
        }
      });
      
      return new RequestNote({
      id: requestNote.id,
      requestId: requestNote.requestId,
      userId: requestNote.userId,
      userName: requestNote.userName,
      text: requestNote.text,
      createdAt: requestNote.createdAt,
      updatedAt: requestNote.createdAt // If updatedAt doesn't exist, use createdAt
      });
    } catch (error) {
      this.logger.error('Error adding note to request', { error, id, userId, text });
      throw this.handleError(error);
    }
  }

  /**
   * Get all notes for a contact request
   * 
   * @param id - Request ID
   * @returns List of notes
   */
  async getNotes(id: number): Promise<RequestNote[]> {
    try {
      const requestNotes = await this.prisma.requestNote.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'desc' }
      });
      
      return requestNotes.map(note => new RequestNote({
        id: note.id,
        requestId: note.requestId,
        userId: note.userId,
        userName: note.userName || 'Unknown User',
        text: note.text,
        createdAt: note.createdAt
      }));
    } catch (error) {
      this.logger.error('Error getting notes for request', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Delete a note from a contact request
   * 
   * @param requestId - Request ID
   * @param noteId - Note ID
   * @returns Success status
   */
  async deleteNote(requestId: number, noteId: number): Promise<boolean> {
    try {
      await this.prisma.requestNote.delete({
        where: { 
          id: noteId,
          requestId: requestId
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error deleting note from request', { error, requestId, noteId });
      throw this.handleError(error);
    }
  }

  /**
   * Assign a contact request to a user
   * 
   * @param id - Request ID
   * @param userId - User ID
   * @param note - Optional note
   * @returns Updated request
   */
  async assignTo(id: number, userId: number, note?: string): Promise<ContactRequest> {
    try {
      return await this.transaction(async () => {
        // Get user
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true }
        });

        if (!user) {
          throw this.errorHandler.createNotFoundError('User not found');
        }

        // Update request
        const updatedRequest = await this.prisma.contactRequest.update({
          where: { id },
          data: { 
            processorId: userId,
            status: RequestStatus.IN_PROGRESS
          }
        });

        // Create log entry
        await this.prisma.requestLog.create({
          data: {
            requestId: id,
            userId,
            userName: user.name,
            action: LogActionType.ASSIGN,
            details: note || `Request assigned to ${user.name}`
          }
        });

        return this.mapToDomainEntity(updatedRequest);
      });
    } catch (error) {
      this.logger.error('Error assigning request', { error, id, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Convert a contact request to a customer
   * 
   * @param data - Conversion data
   * @returns Result of conversion
   */
  async convertToCustomer(data: ConvertToCustomerDto): Promise<{
    customer: Customer;
    appointment?: Appointment;
    request: ContactRequest;
  }> {
    try {
      return await this.transaction(async () => {
        // Get request
        const request = await this.prisma.contactRequest.findUnique({
          where: { id: data.requestId }
        });

        if (!request) {
          throw this.errorHandler.createNotFoundError('Contact request not found');
        }

        // Create customer data ensuring required fields are not undefined
        const customerData = {
        // Required fields must have values
        name: data.customerData?.name || request.name || 'Unknown',
        email: data.customerData?.email || request.email || '',
        phone: data.customerData?.phone || request.phone || '',
        // Optional fields can be undefined - convert nulls to undefined
        company: data.customerData?.company || undefined,
        address: data.customerData?.address || undefined,
        postalCode: data.customerData?.postalCode || undefined,
        city: data.customerData?.city || undefined,
        country: data.customerData?.country || 'Deutschland',
        type: CustomerType.PRIVATE, // Using enum value directly
        newsletter: data.customerData?.newsletter || false,
        source: 'contact_request',
        status: CommonStatus.ACTIVE // Using enum value directly
        };
        
        // Apply customer type if provided
        if (data.customerData?.type) {
          customerData.type = data.customerData.type as CustomerType;  // Convert string to enum
        }

        // Create customer
        const customerRecord = await this.prisma.customer.create({
          data: customerData
        });

        // Erstelle Customer-Domain-Entität
        const customer = new Customer({
          id: customerRecord.id,
          name: customerRecord.name,
          company: customerRecord.company || undefined,
          email: customerRecord.email || undefined,
          phone: customerRecord.phone || undefined,
          address: customerRecord.address || undefined,
          postalCode: customerRecord.postalCode || undefined,
          city: customerRecord.city || undefined,
          country: customerRecord.country,
          type: customerRecord.type as CustomerType,
          newsletter: customerRecord.newsletter,
          status: customerRecord.status as CommonStatus,
          createdAt: customerRecord.createdAt,
          updatedAt: customerRecord.updatedAt
        });
        // Update request
        const updatedRequestRecord = await this.prisma.contactRequest.update({
          where: { id: data.requestId },
          data: { 
            customerId: customer.id,
            status: RequestStatus.COMPLETED
          }
        });

        // Create log entry
        await this.prisma.requestLog.create({
          data: {
            requestId: data.requestId,
            userId: request.processorId || 0,
            userName: 'System',
            action: LogActionType.CONVERT,
            details: data.note || `Customer ${customer.name} was created from request`
          }
        });

        let appointment;
        // Create appointment if desired
        if (data.createAppointment && data.appointmentData) {
          // Create properly typed appointment data
          const appointmentData: Partial<Appointment> = {
            customerId: customer.id,
            title: data.appointmentData?.title,
            duration: data.appointmentData?.duration,
            location: data.appointmentData?.location,
            description: data.appointmentData?.description
          };
          
          // Handle date conversion safely
          if (data.appointmentData?.appointmentDate) {
            appointmentData.appointmentDate = new Date(data.appointmentData.appointmentDate);
          }
          
          const appointmentResult = await this.createAppointment(
            data.requestId, 
            appointmentData, 
            'Termin bei Kundenkonvertierung erstellt'
          );
          appointment = appointmentResult;
        }

        const updatedRequest = this.mapToDomainEntity(updatedRequestRecord);

        return {
          customer,
          appointment,
          request: updatedRequest
        };
      });
    } catch (error) {
      this.logger.error('Error converting request to customer', { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Link a contact request to an existing customer
   * 
   * @param requestId - Request ID
   * @param customerId - Customer ID
   * @param note - Optional note
   * @returns Updated request
   */
  async linkToCustomer(requestId: number, customerId: number, note?: string): Promise<ContactRequest> {
    try {
      return await this.transaction(async () => {
        // Get customer
        const customer = await this.prisma.customer.findUnique({
          where: { id: customerId }
        });

        if (!customer) {
          throw this.errorHandler.createNotFoundError('Customer not found');
        }

        // Update request
        const updatedRequest = await this.prisma.contactRequest.update({
          where: { id: requestId },
          data: { 
            customerId,
            status: RequestStatus.IN_PROGRESS
          }
        });

        // Create log entry
        await this.prisma.requestLog.create({
        data: {
        requestId,
        userId: updatedRequest.processorId || 0,
        userName: 'System',
        action: LogActionType.LINK,
        details: note || `Linked with customer ${customer.name}`
        }
        });

        return this.mapToDomainEntity(updatedRequest);
      });
    } catch (error) {
      this.logger.error('Error linking request to customer', { error, requestId, customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Create an appointment for a contact request
   * 
   * @param requestId - Request ID
   * @param appointmentData - Appointment data
   * @param note - Optional note
   * @returns Created appointment
   */
  async createAppointment(requestId: number, appointmentData: Partial<Appointment>, note?: string): Promise<Appointment> {
    try {
      return await this.transaction(async () => {
        // Get request
        const request = await this.prisma.contactRequest.findUnique({
          where: { id: requestId },
          include: { customer: true }
        });

        if (!request) {
          throw this.errorHandler.createNotFoundError('Contact request not found');
        }

        // Process appointment date and time
        let appointmentDate;
        if (typeof appointmentData.appointmentDate === 'string') {
          // Wenn ein String übergeben wurde, parsen
          appointmentDate = new Date(String(appointmentData.appointmentDate));
        } else if (appointmentData.appointmentDate instanceof Date) {
          // Wenn bereits ein Date-Objekt übergeben wurde, verwenden
          appointmentDate = appointmentData.appointmentDate;
        } else {
          // Standarddatum (heute + 2 Tage)
          appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + 2);
          appointmentDate.setHours(12, 0, 0, 0);
        }

        // Compile appointment data
        const appointmentCreateData = {
        title: appointmentData.title || `Termin mit ${request.name}`,
        customerId: request.customerId || undefined,
        appointmentDate,
        duration: appointmentData.duration || 60,
        location: appointmentData.location || undefined, // Convert null to undefined
        description: appointmentData.description || request.message || undefined, // Convert null to undefined
        status: AppointmentStatus.PLANNED,  // Already using enum value
        createdBy: request.processorId || undefined
        };

        // Create appointment
        const appointmentRecord = await this.prisma.appointment.create({
          data: appointmentCreateData
        });
        
        // Domain-Entität erstellen
        const appointment = new Appointment({
          id: appointmentRecord.id,
          title: appointmentRecord.title,
          customerId: appointmentRecord.customerId || undefined,
          appointmentDate: appointmentRecord.appointmentDate,
          duration: appointmentRecord.duration || undefined,
          location: appointmentRecord.location || undefined,
          description: appointmentRecord.description || undefined,
          status: appointmentRecord.status as AppointmentStatus,
          createdAt: appointmentRecord.createdAt,
          updatedAt: appointmentRecord.updatedAt,
          createdBy: appointmentRecord.createdBy || undefined
        });

        // Link request with appointment
        await this.prisma.contactRequest.update({
          where: { id: requestId },
          data: { 
            appointmentId: appointment.id,
            status: request.status === RequestStatus.NEW ? RequestStatus.IN_PROGRESS : request.status
          }
        });

        // Create log entry
        await this.prisma.requestLog.create({
          data: {
            requestId,
            userId: request.processorId || 0,
            userName: 'System',
            action: LogActionType.CREATE,
            details: note || `Appointment ${appointment.title} created`
          }
        });

        return appointment;
      });
    } catch (error) {
      this.logger.error('Error creating appointment for request', { error, requestId, appointmentData });
      throw this.handleError(error);
    }
  }

  /**
   * Get statistics for contact requests
   * 
   * @param period - Time period (week, month, year)
   * @returns Statistics
   */
  async getRequestStats(period?: string): Promise<{
    totalRequests: number;
    newRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    conversionRate: number;
  }> {
    try {
      // Determine time period
      const startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          // Standard: 30 Tage
          startDate.setDate(startDate.getDate() - 30);
      }

      // Count all requests in the period
      const totalRequests = await this.prisma.contactRequest.count({
        where: { createdAt: { gte: startDate } }
      });

      // Count new requests
      const newRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.NEW,
          createdAt: { gte: startDate }
        }
      });

      // Count in progress
      const inProgressRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.IN_PROGRESS,
          createdAt: { gte: startDate }
        }
      });

      // Count completed requests
      const completedRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.COMPLETED,
          createdAt: { gte: startDate }
        }
      });

      // Count cancelled requests
      const cancelledRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.CANCELLED,
          createdAt: { gte: startDate }
        }
      });

      // Count converted requests (linked to customer)
      const convertedRequests = await this.prisma.contactRequest.count({
        where: { 
          customerId: { not: null },
          createdAt: { gte: startDate }
        }
      });

      // Calculate conversion rate
      const conversionRate = totalRequests > 0 
        ? (convertedRequests / totalRequests) * 100 
        : 0;

      return {
        totalRequests,
        newRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        conversionRate
      };
    } catch (error) {
      this.logger.error('Error getting request stats', { error, period });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find requests with advanced filtering options
   * 
   * @param filters - Filter parameters
   * @returns Found requests with pagination
   */
  async findRequests(filters: RequestFilterParamsDto): Promise<PaginationResult<ContactRequest>> {
    try {
      // Build criteria based on filters
      const where: any = {};
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.service) {
        where.service = filters.service;
      }
      
      if (filters.processorId) {
        where.processorId = filters.processorId;
      }
      
      if (filters.unassigned) {
        where.processorId = null;
      }
      
      if (filters.notConverted) {
        where.customerId = null;
      }
      
      // Explicitly handle customerId filter
      if (filters.customerId !== undefined && filters.customerId !== null) {
        this.logger.info(`Filtering requests by customer ID: ${filters.customerId}`);
        where.customerId = filters.customerId;
      }
      
      // Date filter
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }
      
      // Calculate pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Determine sorting
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }
      
      // Execute queries
      const [total, requests] = await Promise.all([
        // Count query for total
        this.prisma.contactRequest.count({ where }),
        // Data query with pagination
        this.prisma.contactRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            processor: true,
            customer: true,
            appointment: true
          }
        })
      ]);
      
      // Map to domain entities
      const data = requests.map(request => this.mapToDomainEntity(request));
      
      // Calculate pagination information
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error finding requests with filters', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Implementation of activity logging
   * 
   * @param userId - User ID
   * @param actionType - Action type
   * @param details - Details
   * @param ipAddress - IP address
   * @returns Promise with log result
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      // Load user for name
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      // Create activity log
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error logging activity', { error, userId, actionType });
      return null;
    }
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): ContactRequest {
    if (!ormEntity) {
      return null as any;
    }
    
    return new ContactRequest({
      id: ormEntity.id,
      name: ormEntity.name || '',
      email: ormEntity.email || '',
      phone: ormEntity.phone || undefined,
      service: ormEntity.service || '',
      message: ormEntity.message || '',
      status: ormEntity.status as RequestStatus, // Ensure proper enum conversion
      processorId: ormEntity.processorId || undefined,
      customerId: ormEntity.customerId || undefined,
      appointmentId: ormEntity.appointmentId || undefined,
      ipAddress: ormEntity.ipAddress || undefined,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy || undefined,
      updatedBy: ormEntity.updatedBy || undefined
    });
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<ContactRequest>): any {
    // Remove undefined values, ID and other problematic fields for the database
    const { id, createdAt, updatedAt, requestData, updatedBy, createdBy, ...dataWithoutProblematicFields } = domainEntity;
    const result: Record<string, any> = {};
    
    Object.entries(dataWithoutProblematicFields).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    // Set timestamp for new entities
    if (!domainEntity.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    // Log fields being removed for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      const removedFields = [];
      if ('id' in domainEntity) removedFields.push('id');
      if ('createdBy' in domainEntity) removedFields.push('createdBy');
      if ('updatedBy' in domainEntity) removedFields.push('updatedBy');
      if (removedFields.length > 0) {
        this.logger.debug(`Removed fields from ORM entity data in RequestRepository: ${removedFields.join(', ')}`);
      }
    }
    
    return result;
  }
}