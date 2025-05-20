import { PrismaClient, User } from '@prisma/client';
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
import { convertToRequestNotes } from '@/domain/utils/noteUtils';
import { createCustomerEntity } from '@/domain/utils/entityFactory';
import { UserRole } from '@/domain/enums/UserEnums';

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
      
      // Handle notes conversion - convert RequestNote[] to string[]
      if (data.notes) {
        // If notes is an array of RequestNote objects, extract the text from each note
        if (Array.isArray(data.notes) && data.notes.length > 0) {
          if (data.notes[0] instanceof RequestNote) {
            safeData.notes = data.notes.map(note => {
              return typeof note === 'string' ? note : (note as RequestNote).text;
            });
          }
        }
        
        // Don't attempt to update notes directly as they're stored in a separate table
        delete safeData.notes;
      }
      
      // Remove these fields because they don't exist in the Prisma schema
      delete safeData.updatedBy;
      delete safeData.createdBy;
      delete safeData.processor;
      delete safeData.customer;
      delete safeData.appointment;
      
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
        createdAt: note.createdAt,
        updatedAt: note.createdAt // If updatedAt doesn't exist, use createdAt
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
          type: CustomerType.INDIVIDUAL, // Using enum value directly
          newsletter: data.customerData?.newsletter || false,
          status: CommonStatus.ACTIVE // Using enum value directly
        };
        
        // Apply customer type if provided
        if (data.customerData?.type) {
          customerData.type = data.customerData.type as CustomerType;
        }

        // Create customer
        const customerRecord = await this.prisma.customer.create({
          data: customerData
        });

        // Create complete Customer domain entity
        const customer = createCustomerEntity({
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
            title: data.appointmentData.title,
            duration: data.appointmentData.duration || 60,
            location: data.appointmentData.location,
            description: data.appointmentData.description
          };
          
          // Handle date conversion safely
          if (data.appointmentData.appointmentDate) {
            try {
              // Convert ISO string to Date object
              appointmentData.appointmentDate = new Date(data.appointmentData.appointmentDate);
              
              // Validate that we have a valid date
              if (isNaN(appointmentData.appointmentDate.getTime())) {
                this.logger.error('Invalid appointment date provided', {
                  date: data.appointmentData.appointmentDate
                });
                // Fall back to current date + 1 day at noon
                const fallbackDate = new Date();
                fallbackDate.setDate(fallbackDate.getDate() + 1);
                fallbackDate.setHours(12, 0, 0, 0);
                appointmentData.appointmentDate = fallbackDate;
              }
            } catch (error) {
              this.logger.error('Error converting appointment date', {
                error,
                date: data.appointmentData.appointmentDate
              });
              // Fall back to current date + 1 day at noon
              const fallbackDate = new Date();
              fallbackDate.setDate(fallbackDate.getDate() + 1);
              fallbackDate.setHours(12, 0, 0, 0);
              appointmentData.appointmentDate = fallbackDate;
            }
          }
          
          const appointmentResult = await this.createAppointment(
            data.requestId, 
            appointmentData, 
            'Appointment created during customer conversion'
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
          // Parse if a string was passed
          appointmentDate = new Date(String(appointmentData.appointmentDate));
        } else if (appointmentData.appointmentDate instanceof Date) {
          // Use directly if already a Date object
          appointmentDate = appointmentData.appointmentDate;
        } else {
          // Default date (today + 2 days at noon)
          appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + 2);
          appointmentDate.setHours(12, 0, 0, 0);
        }

        // Compile appointment data
        const appointmentCreateData = {
          title: appointmentData.title || `Appointment with ${request.name}`,
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
        
        // Create domain entity
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
          // Standard: 30 days
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
          where.createdAt.gte = new Date(filters.startDate);
        }
        
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
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
      const data = requests.map(request => {
        // Create the base entity
        const entity = this.mapToDomainEntity(request);
        
        // Add related data with proper type casting to avoid 'never' type issues
        if (request.processor) {
          const processor = request.processor as Record<string, any>;
          // Use a more complete User type representation
          (entity as any).processor = {
            id: processor.id,
            name: processor.name,
            email: processor.email,
            role: processor.role as UserRole,
            status: 'active',
            firstName: processor.firstName || '',
            lastName: processor.lastName || '',
            getFullName: () => processor.name || ''
          };
        }
        
        if (request.customer) {
          entity.customer = createCustomerEntity({
            id: request.customer.id,
            name: request.customer.name,
            email: request.customer.email || undefined,
            phone: request.customer.phone || undefined
          });
        }
        
        if (request.appointment) {
          const appointment = request.appointment as Record<string, any>;
          // Create a more complete Appointment-compatible object
          (entity as any).appointment = {
            id: appointment.id,
            title: appointment.title,
            appointmentDate: appointment.appointmentDate,
            status: appointment.status as AppointmentStatus,
            isConfirmed: appointment.status === AppointmentStatus.CONFIRMED,
            isCompleted: appointment.status === AppointmentStatus.COMPLETED,
            isCancelled: appointment.status === AppointmentStatus.CANCELLED,
            isRescheduled: appointment.status === AppointmentStatus.RESCHEDULED,
            duration: appointment.duration || 60,
            location: appointment.location || '',
            description: appointment.description || '',
            customerId: appointment.customerId,
            createdAt: appointment.createdAt || new Date(),
            updatedAt: appointment.updatedAt || new Date()
          };
        }
        
        return entity;
      });
      
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
      return {};
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
      // Return empty object instead of null
      return new ContactRequest();
    }
    
    const request = new ContactRequest({
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
    
    // Convert string notes to RequestNote objects
    if (ormEntity.notes && Array.isArray(ormEntity.notes)) {
      request.notes = convertToRequestNotes(ormEntity.notes, ormEntity.processorId || 0, ormEntity.id);
    } else {
      request.notes = [];
    }
    
    return request;
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<ContactRequest>): any {
    // Remove undefined values, ID and other problematic fields for the database
    const { id, createdAt, updatedAt, requestData, updatedBy, createdBy, processor, customer, appointment, notes, ...dataWithoutProblematicFields } = domainEntity;
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
    
    // Ensure service field is always present in create operations
    if (!domainEntity.id && !result.service) {
      // If service is missing, use source or fallback to 'Consultation'
      result.service = domainEntity.source || 'Consultation';
    }
    
    // Log fields being removed for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      const removedFields = [];
      if ('id' in domainEntity) removedFields.push('id');
      if ('createdBy' in domainEntity) removedFields.push('createdBy');
      if ('updatedBy' in domainEntity) removedFields.push('updatedBy');
      if ('notes' in domainEntity) removedFields.push('notes');
      if ('processor' in domainEntity) removedFields.push('processor');
      if ('customer' in domainEntity) removedFields.push('customer');
      if ('appointment' in domainEntity) removedFields.push('appointment');
      if (removedFields.length > 0) {
        this.logger.debug(`Removed fields from ORM entity data in RequestRepository: ${removedFields.join(', ')}`);
      }
    }
    
    return result;
  }

  /**
   * Find requests by criteria
   * 
   * @param criteria - Search criteria
   * @returns Array of requests matching criteria
   */
  async find(criteria: Record<string, any>): Promise<ContactRequest[]> {
    try {
      // Process the criteria for the WHERE clause
      const where = this.processCriteria(criteria);
      
      // Execute query
      const requests = await this.prisma.contactRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      
      // Map to domain entities
      return requests.map(request => this.mapToDomainEntity(request));
    } catch (error) {
      this.logger.error('Error in RequestRepository.find', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        criteria 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Check if a request exists
   * 
   * @param id - Request ID
   * @returns Whether the request exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const count = await this.prisma.contactRequest.count({
        where: { id }
      });
      
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if request with ID ${id} exists:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find notes for a request
   * 
   * @param requestId - Request ID
   * @returns Request notes
   */
  async findNotes(requestId: number): Promise<RequestNote[]> {
    try {
      const notes = await this.prisma.requestNote.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' }
      });
      
      return notes.map(note => new RequestNote({
        id: note.id,
        requestId: note.requestId,
        userId: note.userId,
        userName: note.userName || 'Unknown User',
        text: note.text,
        createdAt: note.createdAt,
        updatedAt: note.createdAt // If updatedAt doesn't exist, use createdAt
      }));
    } catch (error) {
      this.logger.error(`Error finding notes for request with ID ${requestId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Find a request with all relationships
   * 
   * @param id - Request ID
   * @returns Request with relationships
   */
  async findByIdWithRelations(id: number): Promise<ContactRequest | null> {
    try {
      const request = await this.prisma.contactRequest.findUnique({
        where: { id },
        include: {
          processor: true,
          customer: true,
          appointment: true
        }
      });
      
      if (!request) {
        return null;
      }
      
      // Map to domain entity
      const requestEntity = this.mapToDomainEntity(request);
      
      // Add related data with proper type casting to avoid 'never' type issues
      if (request.processor) {
        const processor = request.processor as Record<string, any>;
        // Create a User-compatible object for processor
        (requestEntity as any).processor = {
        id: processor.id,
        name: processor.name,
        email: processor.email,
          role: processor.role as UserRole,
            status: 'active',
            firstName: processor.firstName || '',
            lastName: processor.lastName || '',
            getFullName: () => processor.name || '',
          };
      }
      
      if (request.customer) {
        (requestEntity).customer = createCustomerEntity({
          id: request.customer.id,
          name: request.customer.name,
          email: request.customer.email || undefined,
          phone: request.customer.phone || undefined
        });
      }
      
      if (request.appointment) {
        const appointment = request.appointment as Record<string, any>;
        // Create an Appointment-compatible object
        (requestEntity as any).appointment = {
          id: appointment.id,
          title: appointment.title,
          appointmentDate: appointment.appointmentDate,
          status: appointment.status as AppointmentStatus,
          isConfirmed: appointment.status === AppointmentStatus.CONFIRMED,
          isCompleted: appointment.status === AppointmentStatus.COMPLETED,
          isCancelled: appointment.status === AppointmentStatus.CANCELLED,
          isRescheduled: appointment.status === AppointmentStatus.RESCHEDULED,
          duration: appointment.duration || 60,
          location: appointment.location || '',
          description: appointment.description || '',
          customerId: appointment.customerId,
          createdAt: appointment.createdAt || new Date(),
          updatedAt: appointment.updatedAt || new Date()
        };
      }
      
      // Load notes separately
      const notes = await this.findNotes(id);
      (requestEntity).notes = notes;
      
      return requestEntity;
    } catch (error) {
      this.logger.error(`Error finding request with ID ${id} with relations:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update request status
   * 
   * @param id - Request ID
   * @param status - New status
   * @param updatedBy - User ID making the change
   * @returns Updated request
   */
  async updateStatus(id: number, dataOrStatus: RequestStatusUpdateDto | string, updatedBy?: number): Promise<ContactRequest> {
    // Handle both function signatures
    let status: string;
    let note: string | undefined;
    
    if (typeof dataOrStatus === 'string') {
      // Handle the string status case
      status = dataOrStatus;
    } else {
      // Handle RequestStatusUpdateDto case
      status = dataOrStatus.status;
      note = dataOrStatus.note;
      // If updatedBy wasn't provided, see if it's in the notes
      if (typeof updatedBy === 'undefined' && dataOrStatus.updatedBy) {
        updatedBy = dataOrStatus.updatedBy;
      }
    }
    try {
      // Update the request status
      const updatedRequest = await this.prisma.contactRequest.update({
        where: { id },
        data: { 
          status: status,
          updatedAt: new Date()
        }
      });
      
      // Log the status change
      await this.prisma.requestLog.create({
        data: {
          requestId: id,
          userId: updatedBy || 0,
          userName: 'System',
          action: LogActionType.CHANGE_STATUS,
          details: note ? `Status changed to ${status}: ${note}` : `Status changed to ${status}`
        }
      });
      
      return this.mapToDomainEntity(updatedRequest);
    } catch (error) {
      this.logger.error(`Error updating status of request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status,
        updatedBy
      });
      throw this.handleError(error);
    }
  }
}