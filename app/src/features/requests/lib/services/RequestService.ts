import { BaseService } from '@/core/services/BaseService';
import { ContactRequest } from '@/domain/entities/ContactRequest';
import { IRequestService } from '@/domain/services/IRequestService';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors/';
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
import { ApiClient } from '@/core/api/ApiClient';

/**
 * Service for contact requests
 * 
 * Implements IRequestService and extends BaseService.
 */
export class RequestService extends BaseService<
  ContactRequest,
  CreateRequestDto,
  UpdateRequestDto,
  RequestResponseDto
> implements IRequestService {
  
  // Add static methods for compatibility with dashboard
  private static readonly basePath = "/requests";

  /**
   * Static method for counting requests - for compatibility with dashboard
   */
  static async count(): Promise<any> {
    try {
      // Use the API client directly to maintain consistency with other services
      return await ApiClient.get(`${RequestService.basePath}/count`);
    } catch (error) {
      console.error('Error in RequestService.count (static):', error as Error);
      return {
        success: false,
        data: { count: 0 },
        message: error instanceof Error ? error.message : 'Error counting requests'
      };
    }
  }
  
  /**
   * Constructor
   * 
   * @param requestRepository - Repository for contact requests
   * @param customerRepository - Repository for customers
   * @param appointmentRepository - Repository for appointments
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
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
   * Creates a new request
   * 
   * @param data - Request data
   * @param options - Service options
   * @returns Created request
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
   * Finds requests with filter options
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Found requests with pagination
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
   * Finds a request by its ID
   * 
   * @param id - Request ID
   * @param options - Service options
   * @returns Found request or null
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

      // Load notes for the request
      const notes = await this.requestRepository.getNotes(id);

      // Load customer information if linked
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

      // Load appointment information if linked
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

      // Create base DTO
      const requestDto = this.toDTO(request) as RequestResponseDto;

      // Extend with details
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
   * Updates a request
   * 
   * @param id - Request ID
   * @param data - Update data
   * @param options - Service options
   * @returns Updated request
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
   * Updates a request's status
   * 
   * @param id - Request ID
   * @param data - Status update data
   * @param options - Service options
   * @returns Updated request
   */
  async updateRequestStatus(
    id: number,
    data: RequestStatusUpdateDto,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    try {
      // Check if the request exists
      const request = await this.requestRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Check if the status is valid
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
      
      // Save the changes - using repository directly to avoid potential id issues
      const updatedRequest = await this.requestRepository.update(id, updateData);

      // Add an optional note
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
   * Deletes a request
   * 
   * @param id - Request ID
   * @param options - Service options
   * @returns Operation success
   */
  async deleteRequest(
    id: number,
    options?: ServiceOptions
  ): Promise<boolean> {
    return this.delete(id, options);
  }

  /**
   * Adds a note to a request
   * 
   * @param requestId - Request ID
   * @param data - Note data
   * @param options - Service options
   * @returns Created note
   */
  async addNote(
    id: number,
    userId: number,
    userName: string,
    text: string,
    options?: ServiceOptions
  ): Promise<RequestNoteDto> {
    try {
      // Check if the request exists
      const request = await this.requestRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Validate the input data
      if (!text || !text.trim()) {
        throw this.errorHandler.createValidationError(
          'Invalid note data',
          ['Note text is required']
        );
      }

      // Add the note
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
   * Assigns a request to a user
   * 
   * @param id - Request ID
   * @param processorId - Processor ID
   * @param options - Service options
   * @returns Updated request
   */
  async assignRequest(
    id: number,
    userId: number,
    note?: string,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    try {
      // Check if the request exists
      const request = await this.requestRepository.findById(id);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${id} not found`);
      }

      // Assign the request
      request.processorId = userId;
      
      // If the request is still new, set it to "in progress"
      if (request.status === RequestStatus.NEW) {
        request.status = RequestStatus.IN_PROGRESS;
      }
      
      request.updateAuditData(options?.context?.userId);

      // Save the changes
      const updatedRequest = await this.requestRepository.update(id, request);

      // Add a note
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
   * Converts a request to a customer
   * 
   * @param data - Conversion data
   * @param options - Service options
   * @returns Conversion result
   */
  async convertToCustomer(
    data: ConvertToCustomerDto,
    options?: ServiceOptions
  ): Promise<{ customer: any; request: RequestResponseDto }> {
    try {
      // Check if the request exists
      const request = await this.requestRepository.findById(data.requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${data.requestId} not found`);
      }

      // Create a new customer based on the request
      const customerData: Partial<Customer> = {
        name: data.customerData?.name || request.name,
        email: data.customerData?.email || request.email,
        phone: data.customerData?.phone || request.phone,
        company: data.customerData?.company,
        type: data.customerData?.type === 'business' ? CustomerType.BUSINESS : CustomerType.PRIVATE,
        // Include additional fields from data.customerData
        ...(data.customerData?.address && { address: data.customerData.address }),
        ...(data.customerData?.postalCode && { postalCode: data.customerData.postalCode }),
        ...(data.customerData?.city && { city: data.customerData.city }),
        ...(data.customerData?.country && { country: data.customerData.country }),
        newsletter: data.customerData?.newsletter || false
      };

      // Create the customer
      const customer = await this.customerRepository.create(customerData);

      // Update the request to link it to the customer
      request.customerId = customer.id;
      request.updateAuditData(options?.context?.userId);

      // Optionally create an appointment
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

        // Create the appointment
        appointment = await this.appointmentRepository.create(appointmentData);

        // Link the appointment to the request
        request.appointmentId = appointment.id;
      }

      // Save the changes to the request
      const updatedRequest = await this.requestRepository.update(data.requestId, request);

      // Add a note
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
   * Links a request to an existing customer
   * 
   * @param requestId - Request ID
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Updated request
   */
  async linkToCustomer(
    requestId: number,
    customerId: number,
    note?: string,
    options?: ServiceOptions
  ): Promise<RequestResponseDto> {
    try {
      // Check if the request exists
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }

      // Check if the customer exists
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

      // Save the changes - using clean object without id
      const updatedRequest = await this.requestRepository.update(requestId, updateData);

      // Add a note
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
   * Creates an appointment for a request
   * 
   * @param requestId - Request ID
   * @param appointmentData - Appointment data
   * @param options - Service options
   * @returns Created appointment
   */
  async createAppointmentForRequest(
    requestId: number,
    appointmentData: Partial<Appointment>,
    note?: string,
    options?: ServiceOptions
  ): Promise<AppointmentResponseDto> {
    try {
      // Check if the request exists
      const request = await this.requestRepository.findById(requestId);
      if (!request) {
        throw this.errorHandler.createNotFoundError(`Request with ID ${requestId} not found`);
      }

      // Create the appointment
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

      // Create the appointment
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

      // Save the changes to the request - using minimal update object
      await this.requestRepository.update(requestId, requestUpdate);

      // Add a note
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
   * Gets request statistics
   * 
   * @param options - Service options
   * @returns Request statistics
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
      // Count requests by status
      const totalRequests = await this.requestRepository.count();
      const newRequests = await this.requestRepository.count({ status: RequestStatus.NEW });
      const inProgressRequests = await this.requestRepository.count({ status: RequestStatus.IN_PROGRESS });
      const completedRequests = await this.requestRepository.count({ status: RequestStatus.COMPLETED });
      const cancelledRequests = await this.requestRepository.count({ status: RequestStatus.CANCELLED });

      // Calculate conversion rate (requests with customers / total)
      const requestsWithCustomer = await this.requestRepository.count({
        customerId: { $ne: null }
      });
      
      const conversionRate = totalRequests ? (requestsWithCustomer / totalRequests) * 100 : 0;

      return {
        totalRequests,
        newRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        requestsWithCustomer,
        conversionRate: Math.round(conversionRate * 100) / 100 // Round to 2 decimal places
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getRequestStats`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }

  /**
   * Maps an entity to a DTO
   * 
   * @param entity - Entity to map
   * @returns DTO
   */
  toDTO(entity: ContactRequest): RequestResponseDto {
    // Use the mapRequestToDto function from the DTOs
    const baseDto = mapRequestToDto(entity);
    
    // Extend with additional information
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
   * Maps a DTO to an entity
   * 
   * @param dto - DTO
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(
    dto: CreateRequestDto | UpdateRequestDto,
    existingEntity?: ContactRequest
  ): Partial<ContactRequest> {
    // Create base object
    const entity: Partial<ContactRequest> = { 
      ...existingEntity 
    };
    
    // Copy values from the DTO
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
   * Returns the validation schema for creation
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
   * Returns the validation schema for updates
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

export default RequestService;