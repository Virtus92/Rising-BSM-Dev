// Mark as server-only to prevent client-side imports
import 'server-only';

import { ContactRequest } from '@/domain/entities/ContactRequest';
import { 
  RequestResponseDto, 
  RequestDetailResponseDto, 
  CreateRequestDto, 
  UpdateRequestDto,
  RequestFilterParamsDto,
  RequestNoteDto,
  RequestStatusUpdateDto,
  ConvertToCustomerDto
} from '@/domain/dtos/RequestDtos';
import { IRequestService } from '@/domain/services/IRequestService';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IRequestDataRepository } from '@/domain/repositories/IRequestDataRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions, ServiceError } from '@/domain/services/IBaseService';
import { ValidationResultDto, ValidationErrorDto } from '@/domain/dtos/ValidationDto';
import { RequestStatus, LogActionType, AppointmentStatus } from '@/domain/enums/CommonEnums';
import { ValidationErrorType, ValidationResult } from '@/domain/enums/ValidationResults';
import { RequestNote } from '@/domain/entities/RequestNote';
import { Customer } from '@/domain/entities/Customer';
import { Appointment } from '@/domain/entities/Appointment';
import { AppError } from '@/core/errors/types/app-errors';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Server-side implementation of the RequestService
 * 
 * This service handles request-related operations directly using the repository
 */
export class RequestServiceImpl implements IRequestService {
  // IRequestService interface implementation methods
  async createRequest(data: CreateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto> {
    return this.create(data, options);
  }
  
  /**
   * Find requests based on filter parameters
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Paginated request results
   */
  async findRequests(filters: RequestFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<RequestResponseDto>> {
    try {
      logger.debug('Finding requests with filters:', filters);
      
      // Check if repository has a dedicated findRequests method
      if (typeof this.repository.findRequests === 'function') {
        // Use the dedicated method with proper parameters
        const result = await this.repository.findRequests(filters);
        
        // Map entities to DTOs
        return {
          data: result.data.map(request => this.toDTO(request)),
          pagination: result.pagination
        };
      }
      
      // Fallback to generic implementation
      // Process filters into repository-compatible criteria
      const repositoryCriteria: Record<string, any> = {};
      
      // Map filters to criteria
      if (filters.status) repositoryCriteria.status = filters.status;
      if (filters.source) repositoryCriteria.source = filters.source;
      if (filters.customerId) repositoryCriteria.customerId = filters.customerId;
      if (filters.processorId) repositoryCriteria.processorId = filters.processorId;
      if (filters.search) repositoryCriteria.search = filters.search;
      if (filters.unassigned) repositoryCriteria.processorId = null;
      if (filters.assigned) repositoryCriteria.customerId = { not: null };
      if (filters.notConverted) repositoryCriteria.customerId = null;
      
      // Handle date-based filters
      if (filters.createdAfter || filters.startDate) {
        const dateValue = filters.createdAfter || filters.startDate;
        if (dateValue) {
          repositoryCriteria.createdAfter = new Date(dateValue);
        }
      }
      
      if (filters.createdBefore || filters.endDate) {
        const dateValue = filters.createdBefore || filters.endDate;
        if (dateValue) {
          repositoryCriteria.createdBefore = new Date(dateValue);
        }
      }
      
      // Create query options object with proper typing to include sort property
      interface QueryOptionsWithSort {
        page: number;
        limit: number;
        relations: string[];
        sort?: {
          field: string;
          direction: 'asc' | 'desc';
        };
      }

      const queryOptions: QueryOptionsWithSort = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        relations: filters.relations || ['customer', 'assignedTo']
      };
      
      // Add sorting if provided
      if (filters.sortBy) {
        queryOptions.sort = {
          field: filters.sortBy,
          direction: filters.sortDirection || 'desc'
        };
      }
      
      // Convert queryOptions to the expected format with criteria included
      const combinedOptions: QueryOptionsWithSort & { criteria?: Record<string, any> } = {
        ...queryOptions,
        criteria: repositoryCriteria  // Pass criteria to the repository via the options object
      };
      
      // Call repository's findAll method with the combined options
      const result = await this.repository.findAll(combinedOptions);
      
      // Map entities to DTOs and return with pagination info
      return {
        data: result.data.map(request => this.toDTO(request)),
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('Error finding requests:', error as Error);
      throw this.handleError(error);
    }
  }
  
  async findRequestById(id: number, options?: ServiceOptions): Promise<RequestDetailResponseDto> {
    return this.getById(id, options) as Promise<RequestDetailResponseDto>;
  }
  
  async updateRequest(id: number, data: UpdateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto> {
    return this.update(id, data, options);
  }
  
  async deleteRequest(id: number, options?: ServiceOptions): Promise<boolean> {
    return this.delete(id, options);
  }
  
  async assignRequest(id: number, userId: number, note?: string, options?: ServiceOptions): Promise<RequestResponseDto> {
    return this.assignTo(id, userId, note, options);
  }
  
  async createAppointmentForRequest(requestId: number, appointmentData: Partial<Appointment>, note?: string, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    const appointment = await this.createAppointment(requestId, {
      title: appointmentData.title || '',
      appointmentDate: appointmentData.appointmentDate?.toISOString() || new Date().toISOString(),
      duration: appointmentData.duration,
      note: note,
      location: appointmentData.location,
      description: appointmentData.description
    }, options);
    
    return this.mapAppointmentToDTO(appointmentData as Appointment);
  }
  
  async getRequestStats(period?: string, options?: ServiceOptions): Promise<{
    totalRequests: number;
    newRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    conversionRate: number;
  }> {
    try {
      return await this.repository.getRequestStats(period);
    } catch (error) {
      logger.error('Error getting request stats:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        period,
        options
      });
      throw this.handleError(error);
    }
  }
  
  private repository: IRequestRepository;
  private customerRepository: ICustomerRepository;
  private userRepository: IUserRepository;
  private appointmentRepository: IAppointmentRepository;
  private requestDataRepository: IRequestDataRepository;
  private logger: ILoggingService;
  private validationService: IValidationService;
  private errorHandler: IErrorHandler;

  /**
   * Constructor
   */
  constructor(
    repository?: IRequestRepository,
    customerRepository?: ICustomerRepository,
    userRepository?: IUserRepository,
    appointmentRepository?: IAppointmentRepository,
    requestDataRepository?: IRequestDataRepository,
    logger?: ILoggingService,
    validationService?: IValidationService,
    errorHandler?: IErrorHandler
  ) {
    // Dependencies are injected directly or obtained from serverFactory
    const serverFactories = require('@/core/factories/serviceFactory.server');
    
    this.repository = repository || serverFactories.getRequestRepository();
    this.customerRepository = customerRepository || serverFactories.getCustomerRepository();
    this.userRepository = userRepository || serverFactories.getUserRepository();
    this.appointmentRepository = appointmentRepository || serverFactories.getAppointmentRepository();
    this.requestDataRepository = requestDataRepository || serverFactories.getRequestDataRepository();
    this.logger = logger || getLogger();
    this.validationService = validationService || require('@/core/validation').getValidationService();
    this.errorHandler = errorHandler || require('@/core/errors').getErrorHandler();
    
    this.logger.debug('Server-side RequestService initialized');
  }

  /**
   * Count requests with optional filtering
   * 
   * @param options - Service options with filters
   * @returns Number of requests matching criteria or object with count property
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<{ count: number }> {
    try {
      this.logger.debug('Counting requests with options:', { options });
      
      // Process filters into repository-compatible criteria
      const criteria: Record<string, any> = {};
      
      if (options?.filters) {
        // Map filters to criteria
        if (options.filters.status) criteria.status = options.filters.status;
        if (options.filters.source) criteria.source = options.filters.source;
        if (options.filters.customerId) criteria.customerId = options.filters.customerId;
        if (options.filters.processorId) criteria.processorId = options.filters.processorId;
        if (options.filters.assignedTo) criteria.processorId = options.filters.assignedTo;
        
        // Handle date-based filters
        if (options.filters.createdAfter || options.filters.startDate) {
          const dateValue = options.filters.createdAfter || options.filters.startDate;
          if (dateValue) {
            criteria.createdAfter = new Date(dateValue);
          }
        }
        
        if (options.filters.createdBefore || options.filters.endDate) {
          const dateValue = options.filters.createdBefore || options.filters.endDate;
          if (dateValue) {
            criteria.createdBefore = new Date(dateValue);
          }
        }
      }
      
      // Call repository method to count
      const count = await this.repository.count(criteria);
      
      // Ensure consistent response format with count property
      if (typeof count === 'number') {
        return { count };
      } else if (count && typeof count === 'object' && 'count' in count) {
        return count as { count: number };
      } else if (count && typeof count === 'object' && 'total' in count) {
        return { count: (count as { total: number }).total };
      }
      
      // Default to zero if no valid count format is found
      return { count: 0 };
    } catch (error) {
      this.logger.error('Error counting requests:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      // Return a default value instead of throwing to prevent 500 errors
      return { count: 0 };
    }
  }

  /**
   * Get all requests with pagination
   * 
   * @param options - Service options
   * @returns Paginated requests
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<RequestResponseDto>> {
    try {
      this.logger.debug('Getting all requests with options:', { options });
      
      // Forward to findAll implementation
      return this.findAll(options);
    } catch (error) {
      this.logger.error('Error getting all requests:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find all requests with pagination
   * 
   * @param options - Service options
   * @returns Paginated requests
   */
  async findAll(options?: ServiceOptions & { filters?: any }): Promise<PaginationResult<RequestResponseDto>> {
    try {
      this.logger.debug('Finding all requests with options:', { options });
      
      // Convert to RequestFilterParamsDto format
      const filterParams: RequestFilterParamsDto = {
        page: options?.page || 1,
        limit: options?.limit || 10,
      };
      
      // Add filter parameters
      if (options?.filters) {
        if (options.filters.status) filterParams.status = options.filters.status;
        if (options.filters.source) filterParams.source = options.filters.source;
        if (options.filters.search) filterParams.search = options.filters.search;
        if (options.filters.customerId) filterParams.customerId = options.filters.customerId;
        if (options.filters.processorId) filterParams.processorId = options.filters.processorId;
        if (options.filters.unassigned) filterParams.unassigned = true;
        if (options.filters.assigned) filterParams.assigned = true;
        if (options.filters.notConverted) filterParams.notConverted = true;
        
        // Handle date filters
        if (options.filters.createdAfter) {
          if (typeof options.filters.createdAfter === 'string') {
            filterParams.createdAfter = options.filters.createdAfter;
          } else if (options.filters.createdAfter instanceof Date) {
            filterParams.createdAfter = options.filters.createdAfter.toISOString();
          }
        }
        
        if (options.filters.createdBefore) {
          if (typeof options.filters.createdBefore === 'string') {
            filterParams.createdBefore = options.filters.createdBefore;
          } else if (options.filters.createdBefore instanceof Date) {
            filterParams.createdBefore = options.filters.createdBefore.toISOString();
          }
        }
      }
      
      // Add sorting
      if (options?.sort) {
        filterParams.sortBy = options.sort.field;
        filterParams.sortDirection = options.sort.direction;
      }
      
      // Use repository's findRequests method if available
      if (typeof this.repository.findRequests === 'function') {
        const result = await this.repository.findRequests(filterParams);
        
        // Map entities to DTOs
        return {
          data: result.data.map(request => this.toDTO(request)),
          pagination: result.pagination
        };
      }
      
      // Fall back to standard findAll method
      // Create proper QueryOptions object with typing for sort property
      interface ExpandedQueryOptions {
        page: number;
        limit: number;
        relations: string[];
        sort?: {
          field: string;
          direction: 'asc' | 'desc';
        };
        criteria?: Record<string, any>;
      }
      
      const queryOptions: ExpandedQueryOptions = {
        page: options?.page || 1,
        limit: options?.limit || 10,
        relations: ['customer', 'assignedTo']
      };
      
      // Add sort if provided
      if (options?.sort) {
        queryOptions.sort = options.sort;
      }
      
      // Process filters separately and add to options
      queryOptions.criteria = this.mapFiltersToRepositoryCriteria(options?.filters);
      
      // Get requests with options (single parameter)
      const result = await this.repository.findAll(queryOptions);
      
      // Map entities to DTOs
      return {
        data: result.data.map(request => this.toDTO(request)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error finding all requests:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get a request by ID
   * 
   * @param id - Request ID
   * @param options - Service options
   * @returns Request or null if not found
   */
  async getById(id: number, options?: ServiceOptions): Promise<RequestDetailResponseDto | null> {
    try {
      this.logger.debug(`Getting request with ID ${id}`, { options });
      
      // Check for ID validity
      if (!id) {
        throw new ServiceError('Invalid request ID', 'INVALID_ID', 400);
      }
      
      // Get request with relations
      const request = await this.repository.findByIdWithRelations(id);
      
      if (!request) {
        return null;
      }
      
      // Get notes if not already loaded
      let notes: RequestNote[] = [];
      
      // Safely access notes property if it exists
      if (request && (request).notes) {
        notes = (request).notes as RequestNote[];
      } else {
        // Fallback to repository call
        notes = await this.repository.findNotes(id);
      }
      
      // Get request data from the request data repository
      let requestData = null;
      try {
        if (this.requestDataRepository) {
          // Retrieve request data safely - it's not an array
          const dataResult = await this.requestDataRepository.findByRequestId(id);
          if (dataResult && Array.isArray(dataResult) && dataResult.length > 0) {
            requestData = dataResult[0];
          }
        }
      } catch (dataError) {
        this.logger.warn(`Error loading request data for request ${id}:`, {
          error: dataError instanceof Error ? dataError.message : String(dataError),
          stack: dataError instanceof Error ? dataError.stack : undefined
        });
      }
      
      // Convert to detailed DTO
      const baseDTO = this.toDTO(request);
      // Create a properly typed detailed response
      const detailedResponse: RequestDetailResponseDto = {
        ...baseDTO,
        notes: notes?.map(note => ({
          id: note.id,
          requestId: id,
          text: note.text,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt?.toISOString() || note.createdAt.toISOString(),
          userId: note.userId,
          userName: note.userName,
          formattedDate: new Date(note.createdAt).toLocaleDateString()
        })) || []
      };
      
      // Add form data if available (using type casting since these are dynamically added properties)
      if (requestData) {
        detailedResponse.formData = requestData.data || null;
      }
      
      return detailedResponse;
    } catch (error) {
      this.logger.error(`Error getting request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new request
   * 
   * @param data - Request creation data
   * @param options - Service options
   * @returns Created request
   */
  async create(data: CreateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto> {
    try {
      this.logger.debug('Creating request with data:', { data, options });
      
      // Validate data
      const validationResult = await this.validate(data);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors ? validationResult.errors.map(e => e.message || String(e)).join(', ') : 'Validation failed';
        throw new ServiceError(
          errorMessages,
          'VALIDATION_ERROR',
          400,
          validationResult.errors
        );
      }
      
      // Convert to domain entity
      const requestEntity = this.fromDTO(data);
      
      // Set creator information
      if (options?.context?.userId) {
        requestEntity.createdBy = options.context.userId;
      }
      
      // Set default status if not provided
      if (!requestEntity.status) {
        requestEntity.status = RequestStatus.NEW;
      }
      
      // Create request
      const createdRequest = await this.repository.create(requestEntity as ContactRequest);
      
      // Add initial note if provided
      if (data.note && createdRequest.id) {
        await this.addNote(createdRequest.id, data.note, options);
      }
      
      // Store form data if provided
      if (data.formData && createdRequest.id && this.requestDataRepository) {
        await this.requestDataRepository.create({
          requestId: createdRequest.id,
          data: {
            formData: data.formData,
            metadata: data.formMetadata || {},
            source: data.source || 'web',
            type: data.type || 'contact'
          },
          category: 'formData',
          label: 'Form Data',
          dataType: 'json',
          order: 1,
          isValid: true
        });
      }
      
      // Convert to DTO
      return this.toDTO(createdRequest);
    } catch (error) {
      this.logger.error('Error creating request:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing request
   * 
   * @param id - Request ID
   * @param data - Update data
   * @param options - Service options
   * @returns Updated request
   */
  async update(id: number, data: UpdateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto> {
    try {
      this.logger.debug(`Updating request with ID ${id}:`, { data, options });
      
      // Validate data
      const validationResult = await this.validate(data, true, id);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors ? validationResult.errors.map(e => e.message || String(e)).join(', ') : 'Validation failed';
        throw new ServiceError(
          errorMessages,
          'VALIDATION_ERROR',
          400,
          validationResult.errors
        );
      }
      
      // Get existing request
      const existingRequest = await this.repository.findById(id);
      if (!existingRequest) {
        throw new ServiceError('Request not found', 'NOT_FOUND', 404);
      }
      
      // Convert to domain entity
      const requestEntity = this.fromDTO(data);
      
      // Set updater information
      if (options?.context?.userId) {
        requestEntity.updatedBy = options.context.userId;
      }
      
      // Update request
      const updatedRequest = await this.repository.update(id, requestEntity);
      
      // Add note if provided
      if (data.note) {
        await this.addNote(id, data.note, options);
      }
      
      // Update form data if provided
      if (data.formData && this.requestDataRepository) {
        const existingData = await this.requestDataRepository.findByRequestId(id);
        if (existingData && existingData.length > 0) {
          await this.requestDataRepository.update(existingData[0].id, {
            data: {
              formData: data.formData,
              metadata: data.formMetadata || (existingData[0].data.metadata || {})
            },
            updatedAt: new Date()
          });
        } else {
          await this.requestDataRepository.create({
            requestId: id,
            data: {
              formData: data.formData,
              metadata: data.formMetadata || {},
              source: data.source || 'web',
              type: data.type || 'contact'
            },
            category: 'formData',
            label: 'Form Data',
            dataType: 'json',
            order: 1,
            isValid: true
          });
        }
      }
      
      // Convert to DTO
      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error updating request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update a request's status using status update DTO
   * 
   * @param id - Request ID
   * @param data - Status update data
   * @param options - Service options
   * @returns Updated request
   */
  async updateRequestStatus(id: number, data: RequestStatusUpdateDto, options?: ServiceOptions): Promise<RequestResponseDto> {
    try {
      this.logger.debug(`Updating request status with data:`, { id, data, options });
      
      // Validate status and ensure it exists in RequestStatus enum
      const validStatus = Object.values(RequestStatus).includes(data.status as RequestStatus);
      if (!validStatus) {
        throw new ServiceError(`Invalid status: ${data.status}`, 'INVALID_STATUS', 400);
      }
      
      // Update status with safe handling of parameters
      const updatedRequest = await this.updateStatus(id, data.status, data.note, options);
      
      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error updating request status:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        options
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update the status of a request
   * 
   * @param id - Request ID
   * @param status - New status
   * @param note - Optional note about the status change
   * @param options - Service options
   * @returns Updated request
   */
  async updateStatus(id: number, status: string, note?: string, options?: ServiceOptions): Promise<RequestResponseDto> {
    try {
      this.logger.debug(`Updating status of request with ID ${id} to ${status}`, { note, options });
      
      // Validate status
      if (!Object.values(RequestStatus).includes(status as RequestStatus)) {
        throw new ServiceError(`Invalid status: ${status}`, 'INVALID_STATUS', 400);
      }
      
      // Get request
      const request = await this.repository.findById(id);
      if (!request) {
        throw new ServiceError('Request not found', 'NOT_FOUND', 404);
      }
      
      // Update status
      const updatedRequest = await this.repository.updateStatus(
        id,
        status as RequestStatus,
        options?.context?.userId || 0
      );
      
      // Add note if provided
      if (note) {
        await this.addNote(id, `Status changed to ${status}: ${note}`, options);
      }
      
      // Convert to DTO
      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error updating status of request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status,
        note,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Assign a request to a user
   * 
   * @param id - Request ID
   * @param userId - User ID
   * @param note - Optional note about the assignment
   * @param options - Service options
   * @returns Updated request
   */
  async assignTo(id: number, userId: number, note?: string, options?: ServiceOptions): Promise<RequestResponseDto> {
    try {
      this.logger.debug(`Assigning request with ID ${id} to user ${userId}`, { note, options });
      
      // Get request
      const request = await this.repository.findById(id);
      if (!request) {
        throw new ServiceError('Request not found', 'NOT_FOUND', 404);
      }
      
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      // Update request with assigned user
      const updatedRequest = await this.repository.update(id, {
        processorId: userId,
        updatedBy: options?.context?.userId || 0,
        updatedAt: new Date()
      });
      
      // Add note if provided
      if (note) {
        await this.addNote(id, `Assigned to ${user.name}: ${note}`, options);
      } else {
        await this.addNote(id, `Assigned to ${user.name}`, options);
      }
      
      // Convert to DTO
      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error assigning request with ID ${id} to user ${userId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        note,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Link a request to a customer
   * 
   * @param id - Request ID
   * @param customerId - Customer ID
   * @param note - Optional note about the linking
   * @param options - Service options
   * @returns Updated request
   */
  async linkToCustomer(id: number, customerId: number, note?: string, options?: ServiceOptions): Promise<RequestResponseDto> {
    try {
      this.logger.debug(`Linking request with ID ${id} to customer ${customerId}`, { note, options });
      
      // Get request
      const request = await this.repository.findById(id);
      if (!request) {
        throw new ServiceError('Request not found', 'NOT_FOUND', 404);
      }
      
      // Verify customer exists
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new ServiceError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
      }
      
      // Update request with customer
      const updatedRequest = await this.repository.update(id, {
        customerId: customerId,
        updatedBy: options?.context?.userId || 0,
        updatedAt: new Date()
      });
      
      // Add note if provided
      if (note) {
        await this.addNote(id, `Linked to customer ${customer.name}: ${note}`, options);
      } else {
        await this.addNote(id, `Linked to customer ${customer.name}`, options);
      }
      
      // Convert to DTO
      return this.toDTO(updatedRequest);
    } catch (error) {
      this.logger.error(`Error linking request with ID ${id} to customer ${customerId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        note,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Add a note to a request
   * 
   * @param id - Request ID
   * @param userIdOrText - User ID or note text
   * @param userNameOrOptions - User name or service options
   * @param textOrUndefined - Note text or undefined
   * @param optionsOrUndefined - Service options or undefined
   * @returns Created note
   */
  async addNote(id: number, userIdOrText: number | string, userNameOrOptions?: string | ServiceOptions, textOrUndefined?: string, optionsOrUndefined?: ServiceOptions): Promise<RequestNoteDto> {
    try {
      // Handle overloaded parameters
      let userId: number;
      let userName: string = '';
      let text: string;
      let options: ServiceOptions | undefined;
      
      // Check if first overload (id, text, options)
      if (typeof userIdOrText === 'string') {
        text = userIdOrText;
        options = userNameOrOptions as ServiceOptions;
        
        // Get user from context - use safe defaults if context is missing
        userId = options?.context?.userId || 0;
        
        // Try to get the user's name from the repository if possible
        if (userId && userId > 0) {
          try {
            const user = await this.userRepository.findById(userId);
            if (user && user.name) {
              userName = user.name;
            } else {
              userName = options?.context?.userName || 'System';
            }
          } catch (userError) {
            this.logger.warn(`Failed to get user name for note: ${userError}`);
            userName = options?.context?.userName || 'System';
          }
        } else {
          userName = options?.context?.userName || 'System';
        }
      }
      // Second overload (id, userId, userName, text, options)
      else {
        userId = userIdOrText;
        // Handle case where userName might be missing
        if (typeof userNameOrOptions === 'string') {
          userName = userNameOrOptions;
          text = textOrUndefined || '';
          options = optionsOrUndefined;
        } else {
          // In case userNameOrOptions is actually options
          text = textOrUndefined || '';
          options = userNameOrOptions as ServiceOptions;
          
          // Try to get the user's name from the repository if possible
          if (userId && userId > 0) {
            try {
              const user = await this.userRepository.findById(userId);
              if (user && user.name) {
                userName = user.name;
              } else {
                userName = 'System';
              }
            } catch (userError) {
              this.logger.warn(`Failed to get user name for note: ${userError}`);
              userName = 'System';
            }
          } else {
            userName = 'System';
          }
        }
      }
      
      // Safety check for required parameters
      if (!id || !text) {
        throw new ServiceError('Request ID and note text are required', 'INVALID_PARAMETERS', 400);
      }
      
      this.logger.debug(`Adding note to request with ID ${id}`, { userId, userName, text, options });
      
      // Add note with sanitized parameters - ensure we always have a valid userName
      const createdNote = await this.repository.addNote(id, userId || 0, userName || 'System', text);
      
      if (!createdNote) {
        throw new ServiceError('Failed to add note', 'NOTE_CREATION_FAILED', 500);
      }
      
      // Convert to DTO
      return {
        id: createdNote.id,
        requestId: id,
        text: createdNote.text,
        createdAt: createdNote.createdAt.toISOString(),
        updatedAt: createdNote.updatedAt?.toISOString() || createdNote.createdAt.toISOString(),
        userId: createdNote.userId,
        userName: createdNote.userName
      };
    } catch (error) {
      this.logger.error(`Error adding note to request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userIdOrText,
        userNameOrOptions,
        textOrUndefined,
        optionsOrUndefined
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get notes for a request
   * 
   * @param id - Request ID
   * @param options - Service options
   * @returns Request notes
   */
  async getNotes(id: number, options?: ServiceOptions): Promise<RequestNoteDto[]> {
    try {
      this.logger.debug(`Getting notes for request with ID ${id}`, { options });
      
      // Get notes from repository
      const notes = await this.repository.findNotes(id);
      
      // Convert to DTOs
      return notes.map(note => ({
        id: note.id,
        requestId: id,
        text: note.text,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt?.toISOString() || note.createdAt.toISOString(),
        userId: note.userId,
        userName: note.userName
      }));
    } catch (error) {
      this.logger.error(`Error getting notes for request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Create an appointment from a request
   * 
   * @param id - Request ID
   * @param appointmentData - Appointment data
   * @param options - Service options
   * @returns Operation result
   */
  async createAppointment(
    id: number, 
    appointmentData: { 
      title: string; 
      appointmentDate: string; 
      duration?: number; 
      note?: string; 
      location?: string; 
      description?: string;
    }, 
    options?: ServiceOptions
  ): Promise<boolean> {
    try {
      this.logger.debug(`Creating appointment from request with ID ${id}`, { appointmentData, options });
      
      // Get request
      const request = await this.repository.findById(id);
      if (!request) {
        throw new ServiceError('Request not found', 'NOT_FOUND', 404);
      }
      
      // Create appointment
      const appointment = await this.appointmentRepository.create({
        title: appointmentData.title,
        appointmentDate: new Date(appointmentData.appointmentDate),
        duration: appointmentData.duration || 60,
        location: appointmentData.location,
        description: appointmentData.description || `Appointment created from request #${id}`,
        customerId: request.customerId,
        status: AppointmentStatus.SCHEDULED,
        createdBy: options?.context?.userId || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Add note to appointment if provided
      if (appointmentData.note && appointment.id) {
        await this.appointmentRepository.addNote(
          appointment.id,
          options?.context?.userId || 0,
          appointmentData.note
        );
      }
      
      // Add note to request
      await this.addNote(
        id,
        `Created appointment "${appointmentData.title}" for ${appointmentData.appointmentDate}`,
        options
      );
      
      // Update request status to in-progress if it was new
      if (request.status === RequestStatus.NEW) {
        await this.updateStatus(id, RequestStatus.IN_PROGRESS, 'Appointment scheduled', options);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error creating appointment from request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        appointmentData,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Convert a request to a customer
   * 
   * @param data - Conversion data
   * @param options - Service options
   * @returns Conversion result
   */
  async convertToCustomer(
    data: ConvertToCustomerDto, 
    options?: ServiceOptions
  ): Promise<{
    customer: CustomerResponseDto;
    appointment?: AppointmentResponseDto;
    request: RequestResponseDto;
  }> {
    try {
      this.logger.debug(`Converting request with ID ${data.requestId} to customer`, { data, options });
      
      // Use repository's convertToCustomer method
      const result = await this.repository.convertToCustomer(data);
      
      // Add note if provided
      if (data.note) {
        const userId = options?.context?.userId || 0;
        const userName = options?.context?.userName || 'System';
        await this.addNote(data.requestId, userId, userName, `Converted to customer: ${data.note}`, options);
      }
      
      // Map entities to DTOs
      return {
        customer: this.mapCustomerToDTO(result.customer),
        appointment: result.appointment ? this.mapAppointmentToDTO(result.appointment) : undefined,
        request: this.toDTO(result.request)
      };
    } catch (error) {
      this.logger.error(`Error converting request with ID ${data.requestId} to customer:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        options
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Map customer entity to DTO
   * 
   * @param customer - Customer entity
   * @returns Customer response DTO
   */
  private mapCustomerToDTO(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
      country: customer.country,
      type: customer.type,
      status: customer.status,
      newsletter: customer.newsletter,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
  
  /**
   * Map appointment entity to DTO
   * 
   * @param appointment - Appointment entity
   * @returns Appointment response DTO
   */
  private mapAppointmentToDTO(appointment: Appointment): AppointmentResponseDto {
    const date = new Date(appointment.appointmentDate);
    const formattedDate = date.toLocaleDateString();
    const appointmentTime = date.toTimeString().split(' ')[0].substring(0, 5);
    
    // Get status label and class based on appointment status
    let statusLabel = 'Scheduled';
    let statusClass = 'primary';
    
    switch (appointment.status) {
      case AppointmentStatus.SCHEDULED:
        statusLabel = 'Scheduled';
        statusClass = 'primary';
        break;
      case AppointmentStatus.COMPLETED:
        statusLabel = 'Completed';
        statusClass = 'success';
        break;
      case AppointmentStatus.CANCELLED:
        statusLabel = 'Cancelled';
        statusClass = 'danger';
        break;
      case AppointmentStatus.RESCHEDULED:
        statusLabel = 'Rescheduled';
        statusClass = 'warning';
        break;
      default:
        statusLabel = 'Unknown';
        statusClass = 'secondary';
    }
    
    return {
      id: appointment.id,
      title: appointment.title,
      customerId: appointment.customerId,
      appointmentDate: appointment.appointmentDate.toISOString(),
      duration: appointment.duration || 60, // Default to 60 minutes if undefined
      location: appointment.location,
      description: appointment.description,
      status: appointment.status,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      // Add missing properties
      dateFormatted: formattedDate,
      appointmentTime: appointmentTime,
      timeFormatted: appointmentTime,
      statusLabel: statusLabel,
      statusClass: statusClass
    };
  }

  /**
   * Delete a request
   * 
   * @param id - Request ID
   * @param options - Service options
   * @returns Operation success
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug(`Deleting request with ID ${id}`, { options });
      
      // Check if request exists
      const request = await this.repository.findById(id);
      if (!request) {
        throw new ServiceError('Request not found', 'NOT_FOUND', 404);
      }
      
      // Delete request
      return await this.repository.delete(id);
    } catch (error) {
      this.logger.error(`Error deleting request with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find requests by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Requests matching criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<RequestResponseDto[]> {
    try {
      this.logger.debug('Finding requests by criteria:', { criteria, options });
      
      // Convert to repository criteria
      const repositoryCriteria = this.mapFiltersToRepositoryCriteria(criteria);
      
      // Find requests - using find method with a single parameter
      const requests = await this.repository.find(repositoryCriteria);
      
      // Convert to DTOs
      return requests.map(request => this.toDTO(request));
    } catch (error) {
      this.logger.error('Error finding requests by criteria:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        criteria,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Validate request data
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether it's an update operation
   * @param entityId - Request ID for updates
   * @returns Validation result
   */
  async validate(data: CreateRequestDto | UpdateRequestDto, isUpdate: boolean = false, entityId?: number): Promise<ValidationResultDto> {
    try {
      this.logger.debug('Validating request data:', { data, isUpdate, entityId });
      
      // Basic validation
      const errors: string[] = [];
      
      // Email or phone is required for creation
      if (!isUpdate && !data.email && !data.phone) {
        errors.push('Either email or phone is required');
      }
      
      // Service is required for creation
      if (!isUpdate && !data.service) {
        errors.push('Service is required');
      }
      
      // Validate status if provided
      if ('status' in data && data.status && !Object.values(RequestStatus).includes(data.status as RequestStatus)) {
        errors.push(`Invalid status: ${data.status}`);
      }
      
      // Validate email format if provided
      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          errors.push('Invalid email format');
        }
      }
      
      // Use validation service for complex validation
      if (this.validationService) {
        const schemaValidation = await this.validationService.validate(
          isUpdate ? 'updateRequest' : 'createRequest',
          data
        );
        
        if (!schemaValidation.isValid && schemaValidation.errors) {
          errors.push(...schemaValidation.errors);
        }
      }
      
      // Return validation result
      // Convert string errors to ValidationErrorDto objects
      const validationErrors = errors.length > 0 ? errors.map(error => ({
        field: 'general',
        message: error,
        type: ValidationErrorType.INVALID
      })) : undefined;

      return {
        isValid: errors.length === 0,
        errors: validationErrors,
        result: errors.length === 0 ? ValidationResult.SUCCESS : ValidationResult.ERROR
      };
    } catch (error) {
      this.logger.error('Error validating request data:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        isUpdate,
        entityId
      });
      return {
        isValid: false,
        errors: [
          {
            field: 'general',
            message: error instanceof Error ? error.message : String(error),
            type: ValidationErrorType.INTERNAL_ERROR
          }
        ],
        result: ValidationResult.ERROR
      };
    }
  }

  /**
   * Execute a transaction
   * 
   * @param callback - Transaction callback
   * @returns Transaction result
   */
  async transaction<T>(callback: (service: IRequestService) => Promise<T>): Promise<T> {
    try {
      this.logger.debug('Executing request transaction');
      
      // Start transaction in repository
      return await this.repository.transaction(async (repo) => {
        // Create a new service instance with the transaction repository
        const transactionService = new RequestServiceImpl(
          repo as IRequestRepository,
          this.customerRepository,
          this.userRepository,
          this.appointmentRepository,
          this.requestDataRepository,
          this.logger,
          this.validationService,
          this.errorHandler
        );
        
        // Execute callback with the transaction service
        return await callback(transactionService);
      });
    } catch (error) {
      this.logger.error('Error executing request transaction:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }

  /**
   * Perform a bulk update
   * 
   * @param ids - Request IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Number of updated requests
   */
  async bulkUpdate(ids: number[], data: UpdateRequestDto, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.debug('Performing bulk update on requests:', { ids, data, options });
      
      // Validate data
      const validationResult = await this.validate(data, true);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors ? validationResult.errors.map(e => e.message || String(e)).join(', ') : 'Validation failed';
        throw new ServiceError(
          errorMessages,
          'VALIDATION_ERROR',
          400,
          validationResult.errors
        );
      }
      
      // Convert to domain entity
      const requestEntity = this.fromDTO(data);
      
      // Set updater information
      if (options?.context?.userId) {
        requestEntity.updatedBy = options.context.userId;
      }
      
      // Perform bulk update
      const updateCount = await this.repository.bulkUpdate(ids, requestEntity);
      
      // Add note if provided and update was successful
      if (data.note && updateCount > 0) {
        // Add note to each updated request
        await Promise.all(ids.map(id => this.addNote(id, data.note as string, options)));
      }
      
      return updateCount;
    } catch (error) {
      this.logger.error('Error performing bulk update on requests:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ids,
        data,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Advanced search for requests
   * 
   * @param searchText - Search text
   * @param options - Service options
   * @returns Matching requests
   */
  async search(searchText: string, options?: ServiceOptions): Promise<RequestResponseDto[]> {
    try {
      this.logger.debug('Searching requests:', { searchText, options });
      
      // Create criteria for repository
      const criteria = {
        search: searchText
      };
      
      // Find requests
      const requests = await this.repository.find(criteria);
      
      // Convert to DTOs
      return requests.map(request => this.toDTO(request));
    } catch (error) {
      this.logger.error('Error searching requests:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        searchText,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Check if a request exists
   * 
   * @param id - Request ID
   * @param options - Service options
   * @returns Whether the request exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug(`Checking if request with ID ${id} exists`, { options });
      
      // Check existence
      return await this.repository.exists(id);
    } catch (error) {
      this.logger.error(`Error checking if request with ID ${id} exists:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get repository access
   * 
   * @returns Repository instance
   */
  getRepository(): IRequestRepository {
    return this.repository;
  }

  /**
   * Convert a domain entity to a DTO
   * 
   * @param entity - Domain entity
   * @returns Response DTO
   */
  toDTO(entity: ContactRequest): RequestResponseDto {
    if (!entity) {
      // Instead of returning null, return a minimal valid RequestResponseDto
      return {
        id: 0,
        name: '',
        email: '',
        status: RequestStatus.NEW,
        service: '', // Add missing required property
        message: '', // Add missing required property
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusLabel: 'Unknown',
        statusClass: 'secondary'
      };
    }
    
    // Derive status label and class based on entity.status
    let statusLabel = 'Unknown';
    let statusClass = 'secondary';
    
    switch (entity.status) {
      case RequestStatus.NEW:
        statusLabel = 'New';
        statusClass = 'primary';
        break;
      case RequestStatus.IN_PROGRESS:
        statusLabel = 'In Progress';
        statusClass = 'info';
        break;
      case RequestStatus.COMPLETED:
        statusLabel = 'Completed';
        statusClass = 'success';
        break;
      case RequestStatus.CANCELLED:
        statusLabel = 'Cancelled';
        statusClass = 'danger';
        break;
      // Add other status cases as needed
    }
    
    // Basic request data
    const dto: RequestResponseDto = {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      message: entity.message,
      source: entity.source,
      status: entity.status,
      customerId: entity.customerId,
      processorId: entity.processorId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      service: entity.source || 'web',
      statusLabel,
      statusClass
    };
    
    // Add customer information if available
    if ((entity).customer) {
      dto.customerName = (entity).customer.name;
      dto.customerData = {
        id: (entity).customer.id,
        name: (entity).customer.name,
        email: (entity).customer.email,
        phone: (entity).customer.phone
      };
    }
    
    // Add assignee information if available
    if ((entity).assignedTo) {
      dto.assignedToName = (entity).assignedTo.name;
      dto.assignedToData = {
        id: (entity).assignedTo.id,
        name: (entity).assignedTo.name,
        email: (entity).assignedTo.email,
        role: (entity).assignedTo.role
      };
    }
    
    return dto;
  }

  /**
   * Convert a DTO to a domain entity
   * 
   * @param dto - DTO
   * @returns Domain entity
   */
  fromDTO(dto: CreateRequestDto | UpdateRequestDto): Partial<ContactRequest> {
    if (!dto) {
      return {};
    }
    
    // Create entity from DTO
    const entity: Partial<ContactRequest> = {};
    
    // Map properties
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.email !== undefined) entity.email = dto.email;
    if (dto.phone !== undefined) entity.phone = dto.phone;
    if (dto.message !== undefined) entity.message = dto.message;
    if (dto.service !== undefined) entity.service = dto.service;
    if (dto.source !== undefined) entity.source = dto.source;
    if (dto.status !== undefined) entity.status = dto.status as RequestStatus;
    if (dto.customerId !== undefined) entity.customerId = dto.customerId;
    if (dto.processorId !== undefined) entity.processorId = dto.processorId;
    
    // Ensure service is set for new requests
    if (!entity.service && dto.source) {
      entity.service = dto.source;
    }
    
    return entity;
  }

  /**
   * Map filter options to repository criteria
   * 
   * @param filters - Filter options
   * @returns Repository criteria
   */
  private mapFiltersToRepositoryCriteria(filters?: Record<string, any>): Record<string, any> {
    if (!filters) {
      return {};
    }
    
    const criteria: Record<string, any> = {};
    
    // Map filters to criteria
    if (filters.status) criteria.status = filters.status;
    if (filters.source) criteria.source = filters.source;
    if (filters.customerId) criteria.customerId = filters.customerId;
    if (filters.processorId) criteria.processorId = filters.processorId;
    
    // Handle special filters
    if (filters.unassigned) {
      criteria.processorId = null;
    }
    
    if (filters.assigned) {
      criteria.customerId = { not: null };
    }
    
    if (filters.notConverted) {
      criteria.customerId = null;
    }
    
    // Handle date-based filters
    if (filters.createdAfter) {
      // Handle different possible types for createdAfter
      if (typeof filters.createdAfter === 'string') {
        criteria.createdAfter = new Date(filters.createdAfter);
      } else if (filters.createdAfter instanceof Date) {
        criteria.createdAfter = filters.createdAfter;
      }
    }
    
    if (filters.createdBefore) {
      // Handle different possible types for createdBefore
      if (typeof filters.createdBefore === 'string') {
        criteria.createdBefore = new Date(filters.createdBefore);
      } else if (filters.createdBefore instanceof Date) {
        criteria.createdBefore = filters.createdBefore;
      }
    }
    
    // Handle search
    if (filters.search) {
      criteria.search = filters.search;
    }
    
    return criteria;
  }

  /**
   * Handle errors
   * 
   * @param error - Error object
   * @returns ServiceError
   */
  private handleError(error: any): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }
    
    // Create a new ServiceError with the required properties
    const message = error instanceof Error ? error.message : String(error);
    return new ServiceError(
      message,
      'REQUEST_SERVICE_ERROR', // code
      500, // statusCode
      error instanceof Error ? error : undefined // Additional data
    );
  }
}

// Export for compatibility
export default RequestServiceImpl;