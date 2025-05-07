import { Customer } from '@/domain/entities/Customer';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerResponseDto,
  CustomerDetailResponseDto,
  CustomerLogDto,
  CustomerFilterParamsDto 
} from '@/domain/dtos/CustomerDtos';
import { ICustomerService } from '@/domain/services/ICustomerService';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors';
import { PaginationResult, QueryOptions } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions, ServiceError } from '@/domain/services/IBaseService';
import { ValidationResultDto, ValidationErrorDto } from '@/domain/dtos/ValidationDto';
import { ValidationResult, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { LogActionType } from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';

/**
 * Server-side implementation of the CustomerService
 * 
 * This service handles customer-related operations directly using the repository
 */
export class CustomerService implements ICustomerService {
  private repository: ICustomerRepository;
  private logger: ILoggingService;
  private validationService: IValidationService;
  private errorHandler: IErrorHandler;

  /**
   * Constructor
   */
  constructor(
    repository?: ICustomerRepository,
    logger?: ILoggingService,
    validationService?: IValidationService,
    errorHandler?: IErrorHandler
  ) {
    // Dependencies are injected, but we'll get them from factories if not provided
    this.repository = repository || require('@/core/factories').getCustomerRepository();
    this.logger = logger || require('@/core/logging').getLogger();
    this.validationService = validationService || require('@/core/validation').getValidationService();
    this.errorHandler = errorHandler || require('@/core/errors').getErrorHandler();
    
    this.logger.debug('Server-side CustomerService initialized');
  }
  /**
   * Find a customer by email address
   * 
   * @param email - Customer email address
   * @param options - Service options
   * @returns Customer or null if not found
   */
  async findByEmail(email: string, options?: ServiceOptions): Promise<CustomerResponseDto | null> {
    try {
      this.logger.debug(`Finding customer with email ${email}`, { options });
      
      if (!email) {
        throw new ServiceError('Email is required', 'INVALID_EMAIL', 400);
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ServiceError('Invalid email format', 'INVALID_EMAIL_FORMAT', 400);
      }
      
      // Find customer by email
      const customer = await this.repository.findByEmail(email);
      
      if (!customer) {
        return null;
      }
      
      // Convert to DTO
      return this.toDTO(customer);
    } catch (error) {
      this.logger.error(`Error finding customer with email ${email}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get detailed customer information by ID
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Detailed customer or null if not found
   */
  async getCustomerDetails(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null> {
    try {
      this.logger.debug(`Getting customer details for ID ${id}`, { options });
      
      // Check for ID validity
      if (!id) {
        throw new ServiceError('Invalid customer ID', 'INVALID_ID', 400);
      }
      
      // Get customer from repository
      const customer = await this.repository.findById(id);
      
      if (!customer) {
        return null;
      }
      
      // Get related data
      const notes = await this.repository.findNotes(id);
      // Use getCustomerLogs method instead as findLogs doesn't exist on ICustomerRepository
const logs = await this.repository.getCustomerLogs?.(id) || [];
      
      // Convert to detailed DTO
      const baseDTO = this.toDTO(customer);
      return {
        ...baseDTO,
        notes: notes?.map(note => ({
          id: note.id,
          text: note.text,
          createdAt: note.createdAt.toISOString(),
          userId: note.userId,
          userName: note.userName,
          customerId: id,
          customerName: note.customerName || '',
          entityType: EntityType.CUSTOMER as any,
          entityId: id,
          logType: LogActionType.NOTE,
          details: note.text || {} as any,
          action: LogActionType.NOTE,
          updatedAt: note.createdAt.toISOString()
        })) || [],
        logs: logs?.map((log: any) => ({
          id: log.id,
          action: log.action,
          details: log.details,
          text: log.details,
          createdAt: log.createdAt.toISOString(),
          userId: log.userId,
          userName: log.userName,
          customerId: id,
          customerName: log.customerName || '',
          entityType: EntityType.CUSTOMER as any,
          entityId: id,
          logType: LogActionType.NOTE,
          updatedAt: log.updatedAt ? log.updatedAt.toISOString() : log.createdAt.toISOString()
        }) as CustomerLogDto) as CustomerLogDto[] || []
      };
    } catch (error) {
      this.logger.error(`Error getting details for customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Count customers with optional filtering
   * 
   * @param options - Service options with filters
   * @returns Number of customers matching criteria
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      this.logger.debug('Counting customers with options:', { options });
      
      // Process filters into repository-compatible criteria
      const criteria: Record<string, any> = {};
      
      if (options?.filters) {
        // Map filters to criteria
        if (options.filters.status) criteria.status = options.filters.status;
        if (options.filters.search) criteria.search = options.filters.search;
        
        // Handle date-based filters
        if (options.filters.createdAfter) {
          criteria.createdAfter = new Date(options.filters.createdAfter);
        }
        
        if (options.filters.createdBefore) {
          criteria.createdBefore = new Date(options.filters.createdBefore);
        }
      }
      
      // Call repository method to count
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error('Error counting customers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get all customers with pagination
   * 
   * @param options - Service options
   * @returns Paginated customers
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    try {
      this.logger.debug('Getting all customers with options:', { options });
      
      // Use the repository's findAll method
      const queryOptions = {
        page: options?.page || 1,
        limit: options?.limit || 10,
        relations: options?.relations || [],
        sort: options?.sort
      };
      
      // Process filters separately
      const criteria = this.mapFiltersToRepositoryCriteria(options?.filters);
      
      // Get customers with options
      const result = await this.repository.findAll(queryOptions);
      
      // Map entities to DTOs
      return {
        data: result.data.map(customer => this.toDTO(customer)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error getting all customers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get a customer by ID
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Customer or null if not found
   */
  async getById(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null> {
    try {
      this.logger.debug(`Getting customer with ID ${id}`, { options });
      
      // Check for ID validity
      if (!id) {
        throw new ServiceError('Invalid customer ID', 'INVALID_ID', 400);
      }
      
      // Get customer from repository
      const customer = await this.repository.findById(id);
      
      if (!customer) {
        return null;
      }
      
      // Get related notes
      const notes = await this.repository.findNotes(id);
      
      // Convert to detailed DTO
      const baseDTO = this.toDTO(customer);
      return {
        ...baseDTO,
        notes: notes?.map(note => ({
          id: note.id,
          text: note.text,
          createdAt: note.createdAt.toISOString(),
          userId: note.userId,
          userName: note.userName,
          customerId: id,
          customerName: note.customerName || '',
          entityType: EntityType.CUSTOMER as any,
          entityId: id,
          logType: LogActionType.NOTE,
          details: note.text || {} as any,
          action: LogActionType.NOTE,
          updatedAt: note.createdAt.toISOString()
        })) as CustomerLogDto[] || []
      };
    } catch (error) {
      this.logger.error(`Error getting customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new customer
   * 
   * @param data - Customer creation data
   * @param options - Service options
   * @returns Created customer
   */
  async create(data: CreateCustomerDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      this.logger.debug('Creating customer with data:', { data, options });
      
      // Validate data
      const validationResult = await this.validate(data);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors ? validationResult.errors.map(e => typeof e === 'string' ? e : e.message || String(e)).join(', ') : 'Validation failed';
        throw new ServiceError(
          errorMessages,
          'VALIDATION_ERROR',
          400,
          validationResult.errors
        );
      }
      
      // Handle field normalization (companyName -> company, zipCode -> postalCode)
      const normalizedData = { ...data };
      if (normalizedData.companyName !== undefined) {
        normalizedData.company = normalizedData.companyName;
        delete normalizedData.companyName;
      }
      if (normalizedData.zipCode !== undefined) {
        normalizedData.postalCode = normalizedData.zipCode;
        delete normalizedData.zipCode;
      }
      
      // Ensure status is properly handled for union type
      if ('status' in data) {
        normalizedData.status = data.status;
      }
      
      // Convert to domain entity
      const customerEntity = this.fromDTO(normalizedData);
      
      // Set creator information
      if (options?.context?.userId) {
        customerEntity.createdBy = options.context.userId;
      }
      
      // Set default status if not provided
      if (!customerEntity.status) {
        customerEntity.status = CommonStatus.ACTIVE;
      }
      
      // Create customer
      const createdCustomer = await this.repository.create(customerEntity as Customer);
      
      // Add initial note if provided
      if (data.notes && createdCustomer.id) {
        await this.addNote(createdCustomer.id, data.notes, options);
      }
      
      // Convert to DTO
      return this.toDTO(createdCustomer);
    } catch (error) {
      this.logger.error('Error creating customer:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing customer
   * 
   * @param id - Customer ID
   * @param data - Update data
   * @param options - Service options
   * @returns Updated customer
   */
  async update(id: number, data: UpdateCustomerDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      this.logger.debug(`Updating customer with ID ${id}:`, { data, options });
      
      // Validate data
      const validationResult = await this.validate(data, true, id);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors ? validationResult.errors.map(e => typeof e === 'string' ? e : e.message || String(e)).join(', ') : 'Validation failed';
        throw new ServiceError(
          errorMessages,
          'VALIDATION_ERROR',
          400,
          validationResult.errors
        );
      }
      
      // Get existing customer
      const existingCustomer = await this.repository.findById(id);
      if (!existingCustomer) {
        throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
      }
      
      // Handle field normalization (companyName -> company, zipCode -> postalCode)
      const normalizedData = { ...data };
      if (normalizedData.companyName !== undefined) {
        normalizedData.company = normalizedData.companyName;
        delete normalizedData.companyName;
      }
      if (normalizedData.zipCode !== undefined) {
        normalizedData.postalCode = normalizedData.zipCode;
        delete normalizedData.zipCode;
      }
      
      // Convert to domain entity
      const customerEntity = this.fromDTO(normalizedData);
      
      // Set updater information
      if (options?.context?.userId) {
        customerEntity.updatedBy = options.context.userId;
      }
      
      // Update customer
      const updatedCustomer = await this.repository.update(id, customerEntity);
      
      // Add note if provided
      if (data.notes) {
        await this.addNote(id, data.notes, options);
      }
      
      // Convert to DTO
      return this.toDTO(updatedCustomer);
    } catch (error) {
      this.logger.error(`Error updating customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update the status of a customer
   * 
   * @param id - Customer ID
   * @param status - New status
   * @param note - Optional note about the status change
   * @param options - Service options
   * @returns Updated customer
   */
  async updateStatus(id: number, statusData: { status: CommonStatus; reason?: string }, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      this.logger.debug(`Updating status of customer with ID ${id} to ${statusData.status}`, { options });
      
      // Validate status
      if (!Object.values(CommonStatus).includes(statusData.status as CommonStatus)) {
        throw new ServiceError(`Invalid status: ${statusData.status}`, 'INVALID_STATUS', 400);
      }
      
      // Get customer
      const customer = await this.repository.findById(id);
      if (!customer) {
        throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
      }
      
      // Update status
      const updatedCustomer = await this.repository.updateStatus(
        id,
        statusData.status as CommonStatus,
        options?.context?.userId || 0
      );
      
      // Add note if provided
      if (statusData.reason) {
        await this.addNote(id, `Status changed to ${statusData.status}: ${statusData.reason}`, options);
      }
      
      // Convert to DTO
      return this.toDTO(updatedCustomer);
    } catch (error) {
      this.logger.error(`Error updating status of customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        statusData,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Delete a customer
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Operation success
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug(`Deleting customer with ID ${id}`, { options });
      
      // Check if customer exists
      const customer = await this.repository.findById(id);
      if (!customer) {
        throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
      }
      
      // Delete customer
      return await this.repository.delete(id);
    } catch (error) {
      this.logger.error(`Error deleting customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Add a note to a customer
   * 
   * @param id - Customer ID
   * @param note - Note text
   * @param options - Service options
   * @returns Created note
   */
  async addNote(id: number, note: string, options?: ServiceOptions): Promise<CustomerLogDto> {
    try {
      this.logger.debug(`Adding note to customer with ID ${id}`, { note, options });
      
      // Get user ID from options
      const userId = options?.context?.userId || 0;
      
      // Add note
      const createdNote = await this.repository.addNote(id, userId, note);
      
      if (!createdNote) {
        throw new ServiceError('Failed to add note', 'NOTE_CREATION_FAILED', 500);
      }

      // Convert Note to Record<string, any>
      const noteRecord: Record<string, any> = {
        id: createdNote.id,
        text: createdNote.text,
        createdAt: createdNote.createdAt.toISOString(),
        userId: createdNote.userId,
        userName: createdNote.userName,
        customerId: id,
        customerName: (createdNote as any).customerName || '',
        entityType: EntityType.CUSTOMER as any,
        entityId: id,
        logType: LogActionType.NOTE,
        details: note
      };
      
      // Convert to DTO
      return {
        id: createdNote.id,
        text: createdNote.text,
        createdAt: createdNote.createdAt.toISOString(),
        userId: createdNote.userId,
        userName: createdNote.userName,
        customerId: id,
        customerName: (createdNote as any).customerName || '',
        entityType: EntityType.CUSTOMER as any,
        entityId: id,
        action: LogActionType.NOTE,
        updatedAt: createdNote.createdAt.toISOString(),
        details: noteRecord
      };
    } catch (error) {
      this.logger.error(`Error adding note to customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        note,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get notes for a customer
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Customer notes
   */
  async getNotes(id: number, options?: ServiceOptions): Promise<CustomerLogDto[]> {
    try {
      this.logger.debug(`Getting notes for customer with ID ${id}`, { options });
      
      // Get notes from repository
      const notes = await this.repository.findNotes(id);
      
      // Convert to DTOs
      return notes.map((note: any) => ({
        id: note.id,
        text: note.text,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt ? note.updatedAt.toISOString() : note.createdAt.toISOString(),
        action: note.action,
        userId: note.userId,
        userName: note.userName,
        customerId: id,
        customerName: (note as any).customerName || '',
        entityType: EntityType.CUSTOMER as any,
        entityId: id,
        logType: LogActionType.NOTE,
        details: note.text
      }) as CustomerLogDto);
    } catch (error) {
      this.logger.error(`Error getting notes for customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find customers by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Customers matching criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    try {
      this.logger.debug('Finding customers by criteria:', { criteria, options });
      
      // Convert to repository criteria
      const repositoryCriteria = this.mapFiltersToRepositoryCriteria(criteria);
      
      // Find customers
      const customers = await this.repository.find(repositoryCriteria);
      
      // Convert to DTOs
      return customers.map(customer => this.toDTO(customer));
    } catch (error) {
      this.logger.error('Error finding customers by criteria:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        criteria,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Validate customer data
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether it's an update operation
   * @param entityId - Customer ID for updates
   * @returns Validation result
   */
  async validate(data: CreateCustomerDto | UpdateCustomerDto, isUpdate: boolean = false, entityId?: number): Promise<ValidationResultDto> {
    try {
      this.logger.debug('Validating customer data:', { data, isUpdate, entityId });
      
      // Basic validation
      const errors: string[] = [];
      
      // Name is required for creation
      if (!isUpdate && !data.name) {
        errors.push('Name is required');
      }
      
      // Validate status if provided
      // Check status if available (considering both DTO types)
      const statusValue = (data as any).status;
      if (statusValue && !Object.values(CommonStatus).includes(statusValue as CommonStatus)) {
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
          isUpdate ? 'updateCustomer' : 'createCustomer',
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
      }) as ValidationErrorDto) : undefined;

      return {
        result: errors.length === 0 ? ValidationResult.SUCCESS : ValidationResult.ERROR,
        isValid: errors.length === 0,
        errors: validationErrors
      };
    } catch (error) {
      this.logger.error('Error validating customer data:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        isUpdate,
        entityId
      });
      return {
        result: ValidationResult.ERROR,
        isValid: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : String(error),
          type: ValidationErrorType.INTERNAL_ERROR
        } as ValidationErrorDto]
      };
    }
  }

  /**
   * Execute a transaction
   * 
   * @param callback - Transaction callback
   * @returns Transaction result
   */
  async transaction<T>(callback: (service: ICustomerService) => Promise<T>): Promise<T> {
    try {
      this.logger.debug('Executing customer transaction');
      
      // Start transaction in repository
      return await this.repository.transaction(async (repo) => {
        // Create a new service instance with the transaction repository
        const transactionService = new CustomerService(
        repo as ICustomerRepository,
        this.logger,
        this.validationService,
        this.errorHandler
        ) as ICustomerService;
        
        // Execute callback with the transaction service
        return await callback(transactionService);
      });
    } catch (error) {
      this.logger.error('Error executing customer transaction:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }

  /**
   * Perform a bulk update
   * 
   * @param ids - Customer IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Number of updated customers
   */
  async bulkUpdate(ids: number[], data: UpdateCustomerDto, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.debug('Performing bulk update on customers:', { ids, data, options });
      
      // Validate data
      const validationResult = await this.validate(data, true);
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors ? validationResult.errors.map(e => typeof e === 'string' ? e : e.message || String(e)).join(', ') : 'Validation failed';
        throw new ServiceError(
          errorMessages,
          'VALIDATION_ERROR',
          400,
          validationResult.errors
        );
      }
      
      // Handle field normalization (companyName -> company, zipCode -> postalCode)
      const normalizedData = { ...data };
      if (normalizedData.companyName !== undefined) {
        normalizedData.company = normalizedData.companyName;
        delete normalizedData.companyName;
      }
      if (normalizedData.zipCode !== undefined) {
        normalizedData.postalCode = normalizedData.zipCode;
        delete normalizedData.zipCode;
      }
      
      // Convert to domain entity
      const customerEntity = this.fromDTO(normalizedData);
      
      // Set updater information
      if (options?.context?.userId) {
        customerEntity.updatedBy = options.context.userId;
      }
      
      // Perform bulk update
      const updateCount = await this.repository.bulkUpdate(ids, customerEntity);
      
      // Add note if provided and update was successful
      if (data.notes && updateCount > 0) {
        // Add note to each updated customer
        await Promise.all(ids.map(id => this.addNote(id, data.notes as string, options)));
      }
      
      return updateCount;
    } catch (error) {
      this.logger.error('Error performing bulk update on customers:', {
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
   * Advanced search for customers
   * 
   * @param searchText - Search text
   * @param options - Service options
   * @returns Matching customers
   */
  async search(searchText: string, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    try {
      this.logger.debug('Searching customers:', { searchText, options });
      
      // Create criteria for repository
      const criteria = {
        search: searchText
      };
      
      // Find customers
      const customers = await this.repository.find(criteria);
      
      // Convert to DTOs
      return customers.map(customer => this.toDTO(customer));
    } catch (error) {
      this.logger.error('Error searching customers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        searchText,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Check if a customer exists
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Whether the customer exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug(`Checking if customer with ID ${id} exists`, { options });
      
      // Check existence
      return await this.repository.exists(id);
    } catch (error) {
      this.logger.error(`Error checking if customer with ID ${id} exists:`, {
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
  getRepository(): ICustomerRepository {
    return this.repository;
  }

  /**
   * Find all customers with pagination
   * 
   * @param options - Service options
   * @returns Paginated customers
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    try {
      this.logger.debug('Finding all customers with options:', { options });
      
      // Convert to CustomerFilterParamsDto format
      const filterParams: CustomerFilterParamsDto = {
        page: options?.page || 1,
        limit: options?.limit || 10,
      };
      
      // Add filter parameters
      if (options?.filters) {
        if (options.filters.status) filterParams.status = options.filters.status;
        if (options.filters.search) filterParams.search = options.filters.search;
        
        // Handle date filters
        if (options.filters.createdAfter) {
          filterParams.createdAfter = typeof options.filters.createdAfter === 'string' 
            ? options.filters.createdAfter 
            : options.filters.createdAfter.toISOString();
        }
        
        if (options.filters.createdBefore) {
          filterParams.createdBefore = typeof options.filters.createdBefore === 'string' 
            ? options.filters.createdBefore 
            : options.filters.createdBefore.toISOString();
        }
      }
      
      // Add sorting
      if (options?.sort) {
        filterParams.sortBy = options.sort.field;
        filterParams.sortDirection = options.sort.direction;
      }
      
      // Use repository's findCustomers method if available
      if (typeof this.repository.findCustomers === 'function') {
        const result = await this.repository.findCustomers(filterParams);
        
        // Map entities to DTOs
        return {
          data: result.data.map(customer => this.toDTO(customer)),
          pagination: result.pagination
        };
      }
      
      // Fall back to standard findAll method
      // Create proper QueryOptions object
      const queryOptions = {
        page: options?.page || 1,
        limit: options?.limit || 10,
        sort: options?.sort
      };
      
      // Process filters separately 
      const criteria = this.mapFiltersToRepositoryCriteria(options?.filters);
      
      // Get customers with options
      const result = await this.repository.findAll(queryOptions);
      
      // Map entities to DTOs
      return {
        data: result.data.map(customer => this.toDTO(customer)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error finding all customers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Convert a domain entity to a DTO
   * 
   * @param entity - Domain entity
   * @returns Response DTO
   */
  toDTO(entity: Customer): CustomerResponseDto {
    if (!entity) {
      return null as any;
    }
    
    // Basic customer data
    const dto: CustomerResponseDto = {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      city: entity.city,
      state: entity.state,
      postalCode: entity.postalCode,
      country: entity.country,
      company: entity.company,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      newsletter: entity.newsletter,
      type: entity.type
    };
    
    // Add legacy zipCode for backward compatibility
    (dto as any).zipCode = entity.postalCode;
    
    // Add legacy companyName for backward compatibility
    (dto as any).companyName = entity.company;
    
    return dto;
  }

  /**
   * Convert a DTO to a domain entity
   * 
   * @param dto - DTO
   * @returns Domain entity
   */
  fromDTO(dto: CreateCustomerDto | UpdateCustomerDto): Partial<Customer> {
    if (!dto) {
      return {};
    }
    
    // Create entity from DTO
    const entity: Partial<Customer> = {};
    
    // Map properties
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.email !== undefined) entity.email = dto.email;
    if (dto.phone !== undefined) entity.phone = dto.phone;
    if (dto.address !== undefined) entity.address = dto.address;
    if (dto.city !== undefined) entity.city = dto.city;
    if (dto.state !== undefined) entity.state = dto.state;
    if (dto.country !== undefined) entity.country = dto.country;
    if (dto.status !== undefined) entity.status = dto.status as CommonStatus;
    
    // Fix: Add missing fields
    if (dto.newsletter !== undefined) entity.newsletter = Boolean(dto.newsletter);
    if (dto.type !== undefined) entity.type = dto.type as CustomerType;
    if (dto.vatNumber !== undefined) entity.vatNumber = dto.vatNumber;
    
    // Handle both postalCode and zipCode (normalize to postalCode)
    if (dto.postalCode !== undefined) {
      entity.postalCode = dto.postalCode;
    } else if ((dto as any).zipCode !== undefined) {
      entity.postalCode = (dto as any).zipCode;
    }
    
    // Handle both company and companyName (normalize to company)
    if (dto.company !== undefined) {
      entity.company = dto.company;
    } else if ((dto as any).companyName !== undefined) {
      entity.company = (dto as any).companyName;
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
    
    // Handle date-based filters
    if (filters.createdAfter) {
      criteria.createdAfter = new Date(filters.createdAfter);
    }
    
    if (filters.createdBefore) {
      criteria.createdBefore = new Date(filters.createdBefore);
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
      return error; // ServiceError already has the code property
    }
    
    // Create a new ServiceError
    return new ServiceError(
      error instanceof Error ? error.message : String(error),
      'CUSTOMER_SERVICE_ERROR', // code
      500, // statusCode
      error instanceof Error ? error : undefined // Additional data
    );
  }


// Implement missing ICustomerService methods

/**
 * Find customers with advanced filtering options
 */
async findCustomers(filters: CustomerFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
  try {
    this.logger.debug('Finding customers with filters:', { filters, options });
    
    // Use repository's findCustomers method if available
    if (typeof this.repository.findCustomers === 'function') {
      const result = await this.repository.findCustomers(filters);
      
      // Map entities to DTOs
      return {
        data: result.data.map(customer => this.toDTO(customer)),
        pagination: result.pagination
      };
    }
    
    // Fall back to findAll with filters
    const queryOptions: QueryOptions = {
      page: filters.page || 1,
      limit: filters.limit || 10
    };
    
    if (filters.sortBy) {
      queryOptions.sort = {
        field: filters.sortBy,
        direction: filters.sortDirection || 'desc'
      };
    }
    
    // Create criteria from filters
    const criteria: Record<string, any> = {};
    if (filters.status) criteria.status = filters.status;
    if (filters.type) criteria.type = filters.type;
    if (filters.search) criteria.search = filters.search;
    if (filters.city) criteria.city = filters.city;
    if (filters.country) criteria.country = filters.country;
    if (filters.newsletter !== undefined) criteria.newsletter = filters.newsletter;
    
    // Get customers matching criteria
    const customers = await this.repository.findByCriteria(criteria, queryOptions);
    const total = await this.repository.count(criteria);
    
    return {
      data: customers.map(customer => this.toDTO(customer)),
      pagination: {
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        total,
        totalPages: Math.ceil(total / (queryOptions.limit || 10))
      }
    };
  } catch (error) {
    this.logger.error('Error finding customers with filters:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      filters,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Search customers by a search term
 */
async searchCustomers(searchText: string, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
  try {
    this.logger.debug('Searching customers:', { searchText, options });
    
    // Use repository's searchCustomers method if available
    if (typeof this.repository.searchCustomers === 'function') {
      const limit = options?.limit || 10;
      const customers = await this.repository.searchCustomers(searchText, limit);
      return customers.map(customer => this.toDTO(customer));
    }
    
    // Fall back to findByCriteria with search in name, email, etc.
    const criteria = {
      search: searchText
    };
    
    const queryOptions: QueryOptions = {
      limit: options?.limit || 10
    };
    
    const customers = await this.repository.findByCriteria(criteria, queryOptions);
    return customers.map(customer => this.toDTO(customer));
  } catch (error) {
    this.logger.error('Error searching customers:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      searchText,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Get similar customers based on criteria
 */
async getSimilarCustomers(customerId: number, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
  try {
    this.logger.debug('Finding similar customers:', { customerId, options });
    
    // Use repository's findSimilarCustomers method if available
    if (typeof this.repository.findSimilarCustomers === 'function') {
      const limit = options?.limit || 5;
      const customers = await this.repository.findSimilarCustomers(customerId, limit);
      return customers.map(customer => this.toDTO(customer));
    }
    
    // Fall back to getting the customer and finding others with similar attributes
    const customer = await this.repository.findById(customerId);
    if (!customer) {
      return [];
    }
    
    // Find customers with similar city or type
    const criteria: Record<string, any> = {};
    if (customer.city) criteria.city = customer.city;
    if (customer.type) criteria.type = customer.type;
    
    const queryOptions: QueryOptions = {
      limit: options?.limit || 5
    };
    
    const customers = await this.repository.findByCriteria(criteria, queryOptions);
    
    // Filter out the original customer
    return customers
      .filter(c => c.id !== customerId)
      .map(customer => this.toDTO(customer));
  } catch (error) {
    this.logger.error('Error finding similar customers:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Get customer statistics
 */
async getCustomerStatistics(options?: ServiceOptions): Promise<any> {
  try {
    this.logger.debug('Getting customer statistics', { options });
    
    // Get total count
    const totalCount = await this.repository.count();
    
    // Get counts by status
    const statusCounts: Record<string, number> = {};
    for (const status of Object.values(CommonStatus)) {
      const count = await this.repository.count({ status });
      statusCounts[status] = count;
    }
    
    // Get counts by type
    const typeCounts: Record<string, number> = {};
    for (const type of Object.values(CustomerType)) {
      const count = await this.repository.count({ type });
      typeCounts[type as string] = count;
    }
    
    // Get recent customers
    const recentCustomers = await this.repository.findByCriteria({}, {
      limit: 5,
      sort: { field: 'createdAt', direction: 'desc' }
    });
    
    return {
      totalCount,
      statusCounts,
      typeCounts,
      recentCustomers: recentCustomers.map(customer => this.toDTO(customer))
    };
  } catch (error) {
    this.logger.error('Error getting customer statistics:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Get customer logs
 */
async getCustomerLogs(customerId: number, options?: ServiceOptions): Promise<CustomerLogDto[]> {
  try {
    this.logger.debug('Getting customer logs:', { customerId, options });
    
    // Use repository's getCustomerLogs method if available
    if (typeof this.repository.getCustomerLogs === 'function') {
      const logs = await this.repository.getCustomerLogs(customerId);
      
      // Map to DTOs with required properties
      return logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        text: log.details, // For backwards compatibility
        createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
        updatedAt: log.updatedAt instanceof Date ? log.updatedAt.toISOString() : log.updatedAt || log.createdAt,
        userId: log.userId,
        userName: log.userName,
        customerId: customerId,
        customerName: log.customerName || '',
        entityType: EntityType.CUSTOMER,
        entityId: customerId,
        logType: log.action === LogActionType.NOTE ? LogActionType.NOTE : log.action
      }));
    }
    
    // Fall back to finding notes
    const notes = await this.repository.findNotes(customerId);
    
    // Convert notes to log format
    return notes.map(note => ({
      id: note.id,
      action: LogActionType.NOTE,
      details: note.text,
      text: note.text,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt, // Notes don't have updatedAt
      userId: note.userId,
      userName: note.userName,
      customerId: customerId,
      customerName: (note as any).customerName || '',
      entityType: EntityType.CUSTOMER,
      entityId: customerId,
      logType: LogActionType.NOTE
    }));
  } catch (error) {
    this.logger.error('Error getting customer logs:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Create a customer log
 */
async createCustomerLog(
  customerId: number,
  action: string,
  details?: string,
  options?: ServiceOptions
): Promise<CustomerLogDto> {
  try {
    this.logger.debug('Creating customer log:', { customerId, action, details, options });
    
    // Get user information from options
    const userId = options?.context?.userId || 0;
    let userName = 'System';
    
    // Find the customer
    const customer = await this.repository.findById(customerId);
    if (!customer) {
      throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
    }
    
    // Create log entry - use repository's createCustomerLog if available
    let logEntry;
    if (typeof this.repository.createCustomerLog === 'function') {
      logEntry = await this.repository.createCustomerLog({
        customerId,
        userId,
        action,
        details
      });
    } else {
      // Fall back to adding a note
      logEntry = await this.repository.addNote(customerId, userId, details || action);
    }
    
    // Convert to DTO
    return {
      id: logEntry.id,
      action: action,
      details: details ? details : {} as any,
      text: details || '',
      createdAt: logEntry.createdAt instanceof Date ? logEntry.createdAt.toISOString() : logEntry.createdAt,
      updatedAt: logEntry.createdAt instanceof Date ? logEntry.createdAt.toISOString() : logEntry.createdAt,
      userId: userId,
      userName: logEntry.userName || userName,
      customerId: customerId,
      customerName: customer.name || '',
      entityType: EntityType.CUSTOMER,
      entityId: customerId
    };
  } catch (error) {
    this.logger.error('Error creating customer log:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId,
      action,
      details,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Soft delete a customer
 */
async softDelete(customerId: number, options?: ServiceOptions): Promise<boolean> {
  try {
    this.logger.debug('Soft deleting customer:', { customerId, options });
    
    // Check if customer exists
    const customer = await this.repository.findById(customerId);
    if (!customer) {
      throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
    }
    
    // Use repository's softDelete method if available
    if (typeof this.repository.softDelete === 'function') {
      return await this.repository.softDelete(customerId, options?.context?.userId);
    }
    
    // Fall back to updating status to DELETED
    await this.repository.update(customerId, {
      status: CommonStatus.DELETED,
      updatedBy: options?.context?.userId
    } as Partial<Customer>);
    
    return true;
  } catch (error) {
    this.logger.error('Error soft deleting customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Hard delete a customer (permanent)
 */
async hardDelete(customerId: number, options?: ServiceOptions): Promise<boolean> {
  try {
    this.logger.debug('Hard deleting customer:', { customerId, options });
    
    // Check if customer exists
    const customer = await this.repository.findById(customerId);
    if (!customer) {
      throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
    }
    
    // Delete the customer
    return await this.repository.delete(customerId);
  } catch (error) {
    this.logger.error('Error hard deleting customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Export customers
 */
async exportCustomers(filters: CustomerFilterParamsDto, format: string, options?: ServiceOptions): Promise<Buffer> {
  try {
    this.logger.debug('Exporting customers:', { filters, format, options });
    
    // Find customers matching filters
    const result = await this.findCustomers(filters, options);
    const customers = result.data;
    
    // Create CSV or other format data
    if (format === 'csv') {
      // Create CSV
      const headers = ['ID', 'Name', 'Company', 'Email', 'Phone', 'Address', 'City', 'Country', 'Status', 'Type', 'Created At'];
      const rows = customers.map(customer => [
        customer.id,
        customer.name,
        customer.company || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.city || '',
        customer.country || '',
        customer.status,
        customer.type,
        customer.createdAt
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');
      
      return Buffer.from(csvContent, 'utf-8');
    }
    
    // For other formats
    throw new ServiceError(`Export format '${format}' not supported`, 'UNSUPPORTED_FORMAT', 400);
  } catch (error) {
    this.logger.error('Error exporting customers:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      filters,
      format,
      options
    });
    throw this.handleError(error);
  }
}

/**
 * Update newsletter subscription
 */
async updateNewsletterSubscription(customerId: number, subscribe: boolean, options?: ServiceOptions): Promise<CustomerResponseDto> {
  try {
    this.logger.debug('Updating newsletter subscription:', { customerId, subscribe, options });
    
    // Check if customer exists
    const customer = await this.repository.findById(customerId);
    if (!customer) {
      throw new ServiceError('Customer not found', 'NOT_FOUND', 404);
    }
    
    // Use repository's updateNewsletterSubscription method if available
    if (typeof this.repository.updateNewsletterSubscription === 'function') {
      const updatedCustomer = await this.repository.updateNewsletterSubscription(
        customerId,
        subscribe,
        options?.context?.userId
      );
      
      return this.toDTO(updatedCustomer);
    }
    
    // Fall back to standard update
    const updatedCustomer = await this.repository.update(customerId, {
      newsletter: subscribe,
      updatedBy: options?.context?.userId
    } as Partial<Customer>);
    
    return this.toDTO(updatedCustomer);
  } catch (error) {
    this.logger.error('Error updating newsletter subscription:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId,
      subscribe,
      options
    });
    throw this.handleError(error);
  }
}
}

// Export for compatibility
export default CustomerService;