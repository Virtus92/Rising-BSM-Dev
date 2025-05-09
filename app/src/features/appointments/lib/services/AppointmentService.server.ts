import { Appointment } from '@/domain/entities/Appointment';
import { 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentResponseDto,
  AppointmentDetailResponseDto,
  UpdateAppointmentStatusDto,
  AppointmentFilterParamsDto,
  AppointmentNoteDto 
} from '@/domain/dtos/AppointmentDtos';
import { IAppointmentService } from '@/domain/services/IAppointmentService';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler } from '@/core/errors';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions, ServiceError } from '@/domain/services/IBaseService';
import { ValidationResultDto, ValidationErrorDto } from '@/domain/dtos/ValidationDto';
import { ValidationResult } from '@/domain/enums/ValidationResults';
import { AppointmentNote } from '@/domain/entities/AppointmentNote';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';

/**
 * Server-side implementation of the AppointmentService
 * 
 * This service handles appointment-related operations directly using the repository
 */
export class AppointmentService implements IAppointmentService {
  private repository: IAppointmentRepository;
  private logger: ILoggingService;
  private validationService: IValidationService;
  private errorHandler: IErrorHandler;

  /**
   * Constructor
   */
  constructor(
    repository?: IAppointmentRepository,
    logger?: ILoggingService,
    validationService?: IValidationService,
    errorHandler?: IErrorHandler
  ) {
    // Dependencies are injected, but we'll get them from factories if not provided
    this.repository = repository || require('@/core/factories').getAppointmentRepository();
    this.logger = logger || require('@/core/logging').getLogger();
    this.validationService = validationService || require('@/core/validation').getValidationService();
    this.errorHandler = errorHandler || require('@/core/errors').getErrorHandler();
    
    this.logger.debug('Server-side AppointmentService initialized');
  }

  /**
   * Count appointments with optional filtering
   * 
   * @param options - Service options with filters
   * @returns Number of appointments matching criteria
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      this.logger.debug('Counting appointments with options:', { options });
      
      // Process filters into repository-compatible criteria
      const criteria: Record<string, any> = {};
      
      if (options?.filters) {
        // Map filters to criteria
        if (options.filters.status) criteria.status = options.filters.status;
        if (options.filters.customerId) criteria.customerId = options.filters.customerId;
        
        // Handle date-based filters
        if (options.filters.startDate) {
          criteria.appointmentDateAfter = new Date(options.filters.startDate);
        }
        
        if (options.filters.endDate) {
          criteria.appointmentDateBefore = new Date(options.filters.endDate);
        }
      }
      
      // Call repository method to count
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error('Error counting appointments:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get all appointments with pagination
   * 
   * @param options - Service options
   * @returns Paginated appointments
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<AppointmentResponseDto>> {
    try {
      this.logger.debug('Getting all appointments with options:', { options });
      
      // Use the repository's findAll method
      // Create proper QueryOptions object
      const queryOptions = {
        page: options?.page || 1,
        limit: options?.limit || 10,
        relations: options?.relations || ['customer'],
        sort: options?.sort
      };
      
      // Process filters separately
      const criteria = this.mapFiltersToRepositoryCriteria(options?.filters);
      
      // Create repository query parameters
      // We need to work around the TypeScript error by using a more compatible approach
      const queryParams: any = {
        ...queryOptions
      };
      
      // Instead of directly adding 'criteria', we'll add the individual criteria properties
      if (criteria) {
        Object.keys(criteria).forEach(key => {
          queryParams[key] = criteria[key];
        });
      }
      
      // Get appointments with criteria and options
      const result = await this.repository.findAll(queryParams);
      
      // Map entities to DTOs
      return {
        data: result.data.map(appointment => this.toDTO(appointment)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error getting all appointments:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get an appointment by ID
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Appointment or null if not found
   */
  async getById(id: number, options?: ServiceOptions): Promise<AppointmentResponseDto | null> {
    try {
      this.logger.debug(`Getting appointment with ID ${id}`, { options });
      
      // Check for ID validity
      if (!id) {
        throw new ServiceError('Invalid appointment ID', 'INVALID_ID', 400);
      }
      
      // Get appointment from repository
      const appointment = await this.repository.findByIdWithRelations(id);
      
      if (!appointment) {
        return null;
      }
      
      // Convert to DTO
      return this.toDTO(appointment);
    } catch (error) {
      this.logger.error(`Error getting appointment with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get appointment with detailed information
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Detailed appointment or null if not found
   */
  async getAppointmentDetails(id: number | string, options?: ServiceOptions): Promise<AppointmentDetailResponseDto | null> {
    try {
      this.logger.debug(`Getting appointment details for ID ${id}`, { options });
      
      // Convert string ID to number if needed
      const appointmentId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Check for ID validity
      if (isNaN(appointmentId)) {
        throw new ServiceError('Invalid appointment ID', 'INVALID_ID', 400);
      }
      
      // Get appointment with relations
      const appointment = await this.repository.findByIdWithRelations(appointmentId);
      
      if (!appointment) {
        return null;
      }
      
      // Get notes if not already loaded
      let notes: AppointmentNote[] = [];
      if (!appointment.notes) {
        notes = await this.repository.findNotes(appointmentId);
      } else {
        notes = appointment.notes;
      }
      
      // Convert to detailed DTO
      const baseDTO = this.toDTO(appointment);
      return {
        ...baseDTO,
        notes: notes.map(note => ({
          id: note.id,
          appointmentId: typeof id === 'string' ? parseInt(id, 10) : id,
          text: note.text,
          createdAt: note.createdAt.toISOString(),
          userId: note.userId,
          userName: note.userName,
          formattedDate: new Date(note.createdAt).toLocaleDateString()
        })) as AppointmentNoteDto[]
      };
    } catch (error) {
      this.logger.error(`Error getting appointment details with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new appointment
   * 
   * @param data - Appointment creation data
   * @param options - Service options
   * @returns Created appointment
   */
  async create(data: CreateAppointmentDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    try {
      this.logger.debug('Creating appointment with data:', { data, options });
      
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
      
      // Convert to domain entity
      const appointmentEntity = this.fromDTO(data);
      
      // Set creator information
      if (options?.context?.userId) {
        appointmentEntity.createdBy = options.context.userId;
      }
      
      // Set default status if not provided
      if (!appointmentEntity.status) {
        appointmentEntity.status = AppointmentStatus.PLANNED;
      }
      
      // Create appointment
      const createdAppointment = await this.repository.create(appointmentEntity as Appointment);
      
      // Add initial note if provided
      if (data.note && createdAppointment.id) {
        await this.addNote(createdAppointment.id, data.note, options);
      }
      
      // Convert to DTO
      return this.toDTO(createdAppointment);
    } catch (error) {
      this.logger.error('Error creating appointment:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing appointment
   * 
   * @param id - Appointment ID
   * @param data - Update data
   * @param options - Service options
   * @returns Updated appointment
   */
  async update(id: number, data: UpdateAppointmentDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    try {
      this.logger.debug(`Updating appointment with ID ${id}:`, { data, options });
      
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
      
      // Get existing appointment
      const existingAppointment = await this.repository.findById(id);
      if (!existingAppointment) {
        throw new ServiceError('Appointment not found', 'NOT_FOUND', 404);
      }
      
      // Convert to domain entity
      const appointmentEntity = this.fromDTO(data);
      
      // Set updater information
      if (options?.context?.userId) {
        appointmentEntity.updatedBy = options.context.userId || 0;
      }
      
      // Update appointment
      const updatedAppointment = await this.repository.update(id, appointmentEntity);
      
      // Add note if provided
      if (data.note) {
        await this.addNote(id, data.note, options);
      }
      
      // Convert to DTO
      return this.toDTO(updatedAppointment);
    } catch (error) {
      this.logger.error(`Error updating appointment with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update the status of an appointment
   * 
   * @param id - Appointment ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Updated appointment
   */
  async updateStatus(id: number, statusData: UpdateAppointmentStatusDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    try {
      this.logger.debug(`Updating status of appointment with ID ${id}:`, { statusData, options });
      
      // Validate status
      if (!Object.values(AppointmentStatus).includes(statusData.status as AppointmentStatus)) {
        throw new ServiceError(`Invalid status: ${statusData.status}`, 'INVALID_STATUS', 400);
      }
      
      // Get appointment
      const appointment = await this.repository.findById(id);
      if (!appointment) {
        throw new ServiceError('Appointment not found', 'NOT_FOUND', 404);
      }
      
      // Update status
      const updatedAppointment = await this.repository.updateStatus(
        id,
        statusData.status,
        options?.context?.userId || 0
      );
      
      // Add note if provided
      if (statusData.note) {
        await this.addNote(id, statusData.note, options);
      }
      
      // Convert to DTO
      return this.toDTO(updatedAppointment);
    } catch (error) {
      this.logger.error(`Error updating status of appointment with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        statusData,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Delete an appointment
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Operation success
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug(`Deleting appointment with ID ${id}`, { options });
      
      // Check if appointment exists
      const appointment = await this.repository.findById(id);
      if (!appointment) {
        throw new ServiceError('Appointment not found', 'NOT_FOUND', 404);
      }
      
      // Delete appointment
      return await this.repository.delete(id);
    } catch (error) {
      this.logger.error(`Error deleting appointment with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments for a customer
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Customer's appointments
   */
  async findByCustomer(customerId: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      this.logger.debug(`Finding appointments for customer with ID ${customerId}`, { options });
      
      // Get appointments from repository
      const appointments = await this.repository.findByCustomer(customerId);
      
      // Convert to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error(`Error finding appointments for customer with ID ${customerId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments in a date range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @param options - Service options
   * @returns Appointments in the date range
   */
  async findByDateRange(startDate: string, endDate: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      this.logger.debug(`Finding appointments between ${startDate} and ${endDate}`, { options });
      
      // Convert string dates to Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ServiceError('Invalid date format', 'INVALID_DATE', 400);
      }
      
      // Get appointments from repository
      const appointments = await this.repository.findByDateRange(start, end);
      
      // Convert to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error(`Error finding appointments between ${startDate} and ${endDate}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Add a note to an appointment
   * 
   * @param id - Appointment ID
   * @param note - Note text
   * @param options - Service options
   * @returns Operation success
   */
  async addNote(id: number, note: string, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug(`Adding note to appointment with ID ${id}`, { note, options });
      
      // Get user ID from options
      const userId = options?.context?.userId || 0;
      
      // Add note
      const createdNote = await this.repository.addNote(id, userId, note);
      
      return !!createdNote;
    } catch (error) {
      this.logger.error(`Error adding note to appointment with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        note,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get upcoming appointments
   * 
   * @param limit - Maximum number of appointments to return
   * @param options - Service options
   * @returns Upcoming appointments
   */
  async getUpcoming(limit?: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      this.logger.debug('Getting upcoming appointments', { limit, options });
      
      // Use repository to get upcoming appointments
      const appointments = await this.repository.findUpcoming(limit || 10);
      
      // Convert to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error getting upcoming appointments:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        limit,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Appointments matching criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      this.logger.debug('Finding appointments by criteria:', { criteria, options });
      
      // Convert to repository criteria
      const repositoryCriteria = this.mapFiltersToRepositoryCriteria(criteria);
      
      // Find appointments
      const appointments = await this.repository.find(repositoryCriteria);
      
      // Convert to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error finding appointments by criteria:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        criteria,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Validate appointment data
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether it's an update operation
   * @param entityId - Appointment ID for updates
   * @returns Validation result
   */
  async validate(data: CreateAppointmentDto | UpdateAppointmentDto, isUpdate: boolean = false, entityId?: number): Promise<ValidationResultDto> {
    try {
      this.logger.debug('Validating appointment data:', { data, isUpdate, entityId });
      
      // Basic validation
      const errors: string[] = [];
      
      // Title is required for creation
      if (!isUpdate && !data.title) {
        errors.push('Title is required');
      }
      
      // Appointment date is required for creation
      if (!isUpdate && !data.appointmentDate) {
        errors.push('Appointment date is required');
      }
      
      // Validate appointment date format
      if (data.appointmentDate) {
        const date = new Date(data.appointmentDate);
        if (isNaN(date.getTime())) {
          errors.push('Invalid appointment date format');
        }
      }
      
      // Validate status if provided
      if (data.status && !Object.values(AppointmentStatus).includes(data.status as AppointmentStatus)) {
        errors.push(`Invalid status: ${data.status}`);
      }
      
      // Validate duration if provided
      if (data.duration !== undefined) {
        if (isNaN(data.duration) || data.duration <= 0) {
          errors.push('Duration must be a positive number');
        }
      }
      
      // Use validation service for complex validation
      if (this.validationService) {
        const schemaValidation = await this.validationService.validate(
          isUpdate ? 'updateAppointment' : 'createAppointment',
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
        type: 'VALIDATION_ERROR' as ValidationErrorDto['type']
      }) as ValidationErrorDto) : undefined;

      return {
        result: errors.length === 0 ? ValidationResult.SUCCESS : ValidationResult.ERROR,
        isValid: errors.length === 0,
        errors: validationErrors
      };
    } catch (error) {
      this.logger.error('Error validating appointment data:', {
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
        type: 'INTERNAL_ERROR' as ValidationErrorDto['type']
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
  async transaction<T>(callback: (service: IAppointmentService) => Promise<T>): Promise<T> {
    try {
      this.logger.debug('Executing appointment transaction');
      
      // Start transaction in repository
      return await this.repository.transaction(async (repo) => {
        // Create a new service instance with the transaction repository
        const transactionService = new AppointmentService(
          repo as IAppointmentRepository,
          this.logger,
          this.validationService,
          this.errorHandler
        );
        
        // Execute callback with the transaction service
        return await callback(transactionService);
      });
    } catch (error) {
      this.logger.error('Error executing appointment transaction:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }

  /**
   * Perform a bulk update
   * 
   * @param ids - Appointment IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Number of updated appointments
   */
  async bulkUpdate(ids: number[], data: UpdateAppointmentDto, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.debug('Performing bulk update on appointments:', { ids, data, options });
      
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
      
      // Convert to domain entity
      const appointmentEntity = this.fromDTO(data);
      
      // Set updater information
      if (options?.context?.userId) {
        appointmentEntity.updatedBy = options.context.userId;
      }
      
      // Perform bulk update
      const updateCount = await this.repository.bulkUpdate(ids, appointmentEntity);
      
      return updateCount;
    } catch (error) {
      this.logger.error('Error performing bulk update on appointments:', {
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
   * Advanced search for appointments
   * 
   * @param searchText - Search text
   * @param options - Service options
   * @returns Matching appointments
   */
  async search(searchText: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      this.logger.debug('Searching appointments:', { searchText, options });
      
      // Create criteria for repository
      const criteria = {
        search: searchText
      };
      
      // Find appointments
      const appointments = await this.repository.find(criteria);
      
      // Convert to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error searching appointments:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        searchText,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Check if an appointment exists
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Whether the appointment exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.debug(`Checking if appointment with ID ${id} exists`, { options });
      
      // Check existence
      return await this.repository.exists(id);
    } catch (error) {
      this.logger.error(`Error checking if appointment with ID ${id} exists:`, {
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
  getRepository(): IAppointmentRepository {
    return this.repository;
  }

  /**
   * Find all appointments with pagination
   * 
   * @param options - Service options
   * @returns Paginated appointments
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<AppointmentResponseDto>> {
    try {
      this.logger.debug('Finding all appointments with options:', { options });
      
      // There are two ways to get appointments: either using findAppointments with filter params
      // or using findAll with criteria. Let's use both approaches based on what's provided.
      
      // If customerId is provided in filters, we want to make sure it's properly used
      if (options?.filters?.customerId) {
        this.logger.debug('Using findAll with criteria for customer-specific appointments');
        
        // Create query options with criteria
        const queryOptions = {
          page: options?.page || 1,
          limit: options?.limit || 10,
          relations: options?.relations || ['customer'],
          sort: options?.sort,
          criteria: this.mapFiltersToRepositoryCriteria(options?.filters)
        };
        
        // Use the findAll method with criteria
        const result = await this.repository.findAll(queryOptions);
        
        // Map entities to DTOs
        return {
          data: result.data.map(appointment => this.toDTO(appointment)),
          pagination: result.pagination
        };
      }
      
      // If no customerId specified, use the findAppointments approach
      // Convert to AppointmentFilterParamsDto format
      const filterParams: AppointmentFilterParamsDto = {
        page: options?.page || 1,
        limit: options?.limit || 10,
      };
      
      // Add filter parameters
      if (options?.filters) {
        if (options.filters.status) filterParams.status = options.filters.status;
        if (options.filters.customerId) filterParams.customerId = options.filters.customerId;
        if (options.filters.search) filterParams.search = options.filters.search;
        
        // Handle date filters
        if (options.filters.startDate) {
          filterParams.startDate = typeof options.filters.startDate === 'string' 
            ? options.filters.startDate 
            : options.filters.startDate.toISOString();
        }
        
        if (options.filters.endDate) {
          filterParams.endDate = typeof options.filters.endDate === 'string' 
            ? options.filters.endDate 
            : options.filters.endDate.toISOString();
        }
        
        // Special filter flags
        if (options.filters.today) filterParams.today = true;
        if (options.filters.upcoming) filterParams.upcoming = true;
        if (options.filters.past) filterParams.past = true;
      }
      
      // Add sorting
      if (options?.sort) {
        filterParams.sortBy = options.sort.field;
        filterParams.sortDirection = options.sort.direction;
      }
      
      // Use repository's findAppointments method
      const result = await this.repository.findAppointments(filterParams);
      
      // Map entities to DTOs
      return {
        data: result.data.map(appointment => this.toDTO(appointment)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error finding all appointments:', {
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
  toDTO(entity: Appointment): AppointmentResponseDto {
    if (!entity) {
      return null as any;
    }
    
    const appointmentDate = new Date(entity.appointmentDate);
    
    // Basic appointment data
    const dto: AppointmentResponseDto = {
      id: entity.id,
      title: entity.title,
      appointmentDate: entity.appointmentDate.toISOString(),
      dateFormatted: appointmentDate.toLocaleDateString(),
      appointmentTime: appointmentDate.toISOString().split('T')[1].substring(0, 5),
      timeFormatted: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: entity.duration || 60, // Default to 60 minutes if undefined
      location: entity.location,
      description: entity.description,
      status: entity.status,
      statusLabel: this.getStatusLabel(entity.status),
      statusClass: this.getStatusClass(entity.status),
      customerId: entity.customerId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy
    };
    
    // Add customer information if available
    if ((entity as any).customer) {
      dto.customerName = (entity as any).customer.name;
      dto.customerData = {
        id: (entity as any).customer.id,
        name: (entity as any).customer.name,
        email: (entity as any).customer.email,
        phone: (entity as any).customer.phone
      };
    } else if ((entity as any).customerName) {
      dto.customerName = (entity as any).customerName;
    }
    
    return dto;
  }

  /**
   * Convert a DTO to a domain entity
   * 
   * @param dto - DTO
   * @returns Domain entity
   */
  fromDTO(dto: CreateAppointmentDto | UpdateAppointmentDto): Partial<Appointment> {
    if (!dto) {
      return {};
    }
    
    // Create entity from DTO
    const entity: Partial<Appointment> = {};
    
    // Map properties
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.appointmentDate !== undefined) {
      try {
        entity.appointmentDate = new Date(dto.appointmentDate);
      } catch (error) {
        this.logger.warn(`Invalid appointment date: ${dto.appointmentDate}`, { error });
        entity.appointmentDate = new Date();
      }
    }
    if (dto.duration !== undefined) entity.duration = dto.duration;
    if (dto.location !== undefined) entity.location = dto.location;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.status !== undefined) entity.status = dto.status as AppointmentStatus;
    if (dto.customerId !== undefined) entity.customerId = dto.customerId;
    
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
    if (filters.customerId) criteria.customerId = filters.customerId;
    
    // Handle date-based filters
    if (filters.startDate) {
      criteria.appointmentDateAfter = new Date(filters.startDate);
    }
    
    if (filters.endDate) {
      criteria.appointmentDateBefore = new Date(filters.endDate);
    }
    
    // Handle search
    if (filters.search) {
      criteria.search = filters.search;
    }
    // Handle special flags
    if (filters.today) criteria.today = true;
    if (filters.upcoming) criteria.upcoming = true;
    if (filters.past) criteria.past = true;
    if (filters.search) criteria.search = filters.search;
    if (filters.sortBy) criteria.sortBy = filters.sortBy;
    if (filters.sortDirection) criteria.sortDirection = filters.sortDirection;
    if (filters.page) criteria.page = filters.page;
    if (filters.limit) criteria.limit = filters.limit;
    
    return criteria;
  }
  
  /**
   * Get a human-readable label for an appointment status
   * 
   * @param status - Appointment status
   * @returns Human-readable status label
   */
  private getStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PLANNED:
        return 'Planned';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmed';
      case AppointmentStatus.IN_PROGRESS:
        return 'In Progress';
      case AppointmentStatus.COMPLETED:
        return 'Completed';
      case AppointmentStatus.CANCELLED:
        return 'Cancelled';
      case AppointmentStatus.RESCHEDULED:
        return 'Rescheduled';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get a CSS class for an appointment status
   * 
   * @param status - Appointment status
   * @returns CSS class name
   */
  private getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PLANNED:
        return 'status-planned';
      case AppointmentStatus.CONFIRMED:
        return 'status-confirmed';
      case AppointmentStatus.IN_PROGRESS:
        return 'status-in-progress';
      case AppointmentStatus.COMPLETED:
        return 'status-completed';
      case AppointmentStatus.CANCELLED:
        return 'status-cancelled';
      case AppointmentStatus.RESCHEDULED:
        return 'status-rescheduled';
      default:
        return 'status-unknown';
    }
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
      'APPOINTMENT_SERVICE_ERROR', // code
      500, // statusCode
      error instanceof Error ? error : undefined // Additional data
    );
  }
}

// Export for compatibility
export default AppointmentService;