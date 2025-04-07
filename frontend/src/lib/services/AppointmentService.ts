import { BaseService } from '../core/BaseService.js';
import { IAppointmentService } from '../lib/interfaces/IAppointmentService.js';
import { IAppointmentRepository } from '../lib/interfaces/IAppointmentRepository.js';
import { ILoggingService } from '../lib/interfaces/ILoggingService.js';
import { IValidationService } from '../lib/interfaces/IValidationService.js';
import { IErrorHandler } from '../lib/interfaces/IErrorHandler.js';
import { ICustomerRepository } from '../lib/interfaces/ICustomerRepository.js';
import { IProjectRepository } from '../lib/interfaces/IProjectRepository.js';
import { Appointment, AppointmentStatus } from '../entities/Appointment.js';
import { 
  AppointmentCreateDto, 
  AppointmentUpdateDto, 
  AppointmentResponseDto, 
  AppointmentDetailResponseDto,
  AppointmentStatusUpdateDto,
  AppointmentNoteDto,
  AppointmentFilterParams,
  appointmentCreateValidationSchema,
  appointmentUpdateValidationSchema,
  appointmentStatusUpdateValidationSchema,
  appointmentNoteValidationSchema
} from '../dtos/AppointmentDtos.js';
import { PaginatedResult, ServiceOptions } from '../../types/interfaces/IBaseService.js';
import { DateTimeHelper } from '../utils/datetime-helper.js';

/**
 * Service for appointment management
 */
export class AppointmentService extends BaseService<
  Appointment, 
  AppointmentCreateDto, 
  AppointmentUpdateDto, 
  AppointmentResponseDto
> implements IAppointmentService {
  /**
   * Creates a new AppointmentService instance
   * 
   * @param repository - Appointment repository
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly projectRepository: IProjectRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(appointmentRepository, logger, validator, errorHandler);
    
    this.logger.debug('Initialized AppointmentService');
  }

  /**
   * Get detailed appointment information
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Promise with detailed appointment data
   */
  async getAppointmentDetails(id: number, options?: ServiceOptions): Promise<AppointmentDetailResponseDto | null> {
    try {
      // Use specialized repository method to get appointment with relations
      const appointment = await this.appointmentRepository.getAppointmentWithDetails(id);
      
      if (!appointment) {
        return null;
      }
      
      // Map to detailed DTO
      return this.toDetailedDTO(appointment);
    } catch (error) {
      this.logger.error('Error getting appointment details', error instanceof Error ? error.message : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments with filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with paginated appointments
   */
  async findAppointments(filters: AppointmentFilterParams): Promise<PaginatedResult<AppointmentResponseDto>> {
    try {
      // Use specialized repository method for filtering
      const result = await this.appointmentRepository.findAppointments(filters);
      
      // Map results to DTOs
      const data = result.data.map(appointment => this.toDTO(appointment));
      
      return {
        data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error finding appointments', error instanceof Error ? error.message : String(error), { filters });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments for a specific date
   * 
   * @param date - Date string (YYYY-MM-DD)
   * @param options - Service options
   * @returns Promise with appointments
   */
  async findByDate(date: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      // Validate date format
      if (!this.isValidDateString(date)) {
        throw this.errorHandler.createValidationError(
          'Invalid date format',
          ['Date must be in YYYY-MM-DD format']
        );
      }
      
      // Get appointments for date
      const appointments = await this.appointmentRepository.findByDate(date);
      
      // Map to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error finding appointments by date', error instanceof Error ? error.message : String(error), { date });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments for a date range
   * 
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param options - Service options
   * @returns Promise with appointments
   */
  async findByDateRange(startDate: string, endDate: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      // Validate date formats
      if (!this.isValidDateString(startDate) || !this.isValidDateString(endDate)) {
        throw this.errorHandler.createValidationError(
          'Invalid date format',
          ['Dates must be in YYYY-MM-DD format']
        );
      }
      
      // Ensure start date is before end date
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      
      if (startObj > endObj) {
        throw this.errorHandler.createValidationError(
          'Invalid date range',
          ['Start date must be before end date']
        );
      }
      
      // Get appointments for date range
      const appointments = await this.appointmentRepository.findByDateRange(startDate, endDate);
      
      // Map to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error finding appointments by date range', error instanceof Error ? error.message : String(error), { startDate, endDate });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments for a customer
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Promise with appointments
   */
  async findByCustomer(customerId: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      // Get appointments for customer
      const appointments = await this.appointmentRepository.findByCustomer(customerId);
      
      // Map to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error finding appointments by customer', error instanceof Error ? error.message : String(error), { customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments for a project
   * 
   * @param projectId - Project ID
   * @param options - Service options
   * @returns Promise with appointments
   */
  async findByProject(projectId: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      // Get appointments for project
      const appointments = await this.appointmentRepository.findByProject(projectId);
      
      // Map to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error finding appointments by project', error instanceof Error ? error.message : String(error), { projectId });
      throw this.handleError(error);
    }
  }

  /**
   * Find upcoming appointments
   * 
   * @param limit - Maximum number of appointments to return
   * @param options - Service options
   * @returns Promise with appointments
   */
  async findUpcoming(limit?: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      // Get upcoming appointments
      const appointments = await this.appointmentRepository.findUpcoming(limit);
      
      // Map to DTOs
      return appointments.map(appointment => this.toDTO(appointment));
    } catch (error) {
      this.logger.error('Error finding upcoming appointments', error instanceof Error ? error.message : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Update appointment status
   * 
   * @param id - Appointment ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Promise with updated appointment
   */
  async updateStatus(id: number, statusData: AppointmentStatusUpdateDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    try {
      // Validate input
      const validationResult = this.validator.validate(
        statusData,
        appointmentStatusUpdateValidationSchema
      );
      
      if (!validationResult.isValid) {
        throw this.errorHandler.createValidationError(
          'Invalid status update data',
          validationResult.errors
        );
      }
      
      // Check if appointment exists
      const appointment = await this.repository.findById(id);
      
      if (!appointment) {
        throw this.errorHandler.createNotFoundError(`Appointment with ID ${id} not found`);
      }
      
      // Update status
      appointment.status = statusData.status;
      
      // Update appointment
      const updated = await this.repository.update(id, appointment);
      
      // Add note if provided
      if (statusData.note && options?.context?.userId) {
        await this.addNote(
          id,
          statusData.note,
          options.context.userId,
          options.context.userName || 'System',
          options
        );
      }
      
      // Log activity
      if (options?.context?.userId) {
        await this.appointmentRepository.logActivity(
          id, 
          options.context.userId, 
          options.context.userName || 'System', 
          `Status updated to ${statusData.status}`, 
          statusData.note
        );
      }
      
      // Return updated appointment
      return this.toDTO(updated);
    } catch (error) {
      this.logger.error('Error updating appointment status', error instanceof Error ? error.message : String(error), { id, statusData });
      throw this.handleError(error);
    }
  }

  /**
   * Add note to appointment
   * 
   * @param id - Appointment ID
   * @param note - Note text
   * @param userId - User ID
   * @param userName - User name
   * @param options - Service options
   * @returns Promise with created note
   */
  async addNote(id: number, note: string, userId: number, userName: string, options?: ServiceOptions): Promise<AppointmentNoteDto> {
    try {
      // Validate note text
      const validationResult = this.validator.validate(
        { note },
        appointmentNoteValidationSchema
      );
      
      if (!validationResult.isValid) {
        throw this.errorHandler.createValidationError(
          'Invalid note',
          validationResult.errors
        );
      }
      
      // Check if appointment exists
      const appointment = await this.repository.findById(id);
      
      if (!appointment) {
        throw this.errorHandler.createNotFoundError(`Appointment with ID ${id} not found`);
      }
      
      // Create note
      const createdNote = await this.appointmentRepository.addNote(id, userId, userName, note);
      
      // Log activity
      await this.appointmentRepository.logActivity(
        id,
        userId,
        userName,
        'Note added',
        note.length > 50 ? `${note.substring(0, 47)}...` : note
      );
      
      // Return created note
      return {
        id: createdNote.id,
        appointmentId: createdNote.appointmentId,
        note: createdNote.text,
        userId: createdNote.userId,
        userName: createdNote.userName,
        formattedDate: DateTimeHelper.formatDate(createdNote.createdAt, 'dd.MM.yyyy HH:mm'),
        createdAt: createdNote.createdAt.toISOString()
      };
    } catch (error) {
      this.logger.error('Error adding note to appointment', error instanceof Error ? error.message : String(error), { id, note });
      throw this.handleError(error);
    }
  }

  /**
   * Get appointment notes
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Promise with notes
   */
  async getNotes(id: number, options?: ServiceOptions): Promise<AppointmentNoteDto[]> {
    try {
      // Check if appointment exists
      const appointment = await this.repository.findById(id);
      
      if (!appointment) {
        throw this.errorHandler.createNotFoundError(`Appointment with ID ${id} not found`);
      }
      
      // Get notes
      const notes = await this.appointmentRepository.getAppointmentNotes(id);
      
      // Map to DTOs
      return notes.map(note => ({
        id: note.id,
        appointmentId: note.appointmentId,
        note: note.text,
        userId: note.userId,
        userName: note.userName,
        formattedDate: DateTimeHelper.formatDate(note.createdAt, 'dd.MM.yyyy HH:mm'),
        createdAt: note.createdAt.toISOString()
      }));
    } catch (error) {
      this.logger.error('Error getting appointment notes', error instanceof Error ? error.message : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Create appointment from date and time strings
   * 
   * @param data - Create data with date and time strings
   * @param options - Service options
   * @returns Promise with created appointment
   */
  async createFromDateAndTime(data: AppointmentCreateDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    try {
      // Validate data
      const validationResult = this.validator.validate(
        data,
        appointmentCreateValidationSchema
      );
      
      if (!validationResult.isValid) {
        throw this.errorHandler.createValidationError(
          'Invalid appointment data',
          validationResult.errors
        );
      }

      // Check if customerId is 0 and set to null instead
      if (data.customerId === 0) {
        data.customerId = undefined;
      }
      
      // Check if customerId exists if provided
      if (data.customerId) {
        // Here we'll use a workaround since exists() method is not available
        const customer = await this.customerRepository.findById(data.customerId);
        
        if (!customer) {
          throw this.errorHandler.createValidationError(
            'Invalid customer reference',
            ['The specified customer does not exist']
          );
        }
      }
      
      // Similar check for projectId
      if (data.projectId === 0) {
        data.projectId = undefined;
      }
      
      if (data.projectId) {
        // Here we'll use a workaround since exists() method is not available
        const project = await this.projectRepository.findById(data.projectId);
        if (!project) {
          throw this.errorHandler.createValidationError(
            'Invalid project reference',
            ['The specified project does not exist']
          );
        }
      }
      
      // Combine date and time
      const appointmentDate = this.combineDateAndTime(
        data.appointmentDate,
        data.appointmentTime
      );
      
      // Create domain entity
      const appointment = new Appointment({
        title: data.title,
        customerId: data.customerId,
        projectId: data.projectId,
        appointmentDate,
        duration: data.duration || 60,
        location: data.location,
        description: data.description,
        status: data.status || AppointmentStatus.PLANNED,
        createdBy: options?.context?.userId
      });
      
      // Create appointment
      const created = await this.repository.create(appointment);
      
      // Log activity
      if (options?.context?.userId) {
        await this.appointmentRepository.logActivity(
          created.id,
          options.context.userId,
          options.context.userName || 'System',
          'Appointment created',
          `Title: ${data.title}, Date: ${data.appointmentDate}, Time: ${data.appointmentTime}`
        );
      }
      
      // Return created appointment
      return this.toDTO(created);
    } catch (error) {
      this.logger.error('Error creating appointment', error instanceof Error ? error.message : String(error), { data });
      throw this.handleError(error);
    }
  }

  /**
   * Update appointment with date and time strings
   * 
   * @param id - Appointment ID
   * @param data - Update data with date and time strings
   * @param options - Service options
   * @returns Promise with updated appointment
   */
  async updateWithDateAndTime(id: number, data: AppointmentUpdateDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    try {
      // Validate data
      const validationResult = this.validator.validate(
        data,
        appointmentUpdateValidationSchema
      );
      
      if (!validationResult.isValid) {
        throw this.errorHandler.createValidationError(
          'Invalid appointment data',
          validationResult.errors
        );
      }
      
      // Check if appointment exists
      const appointment = await this.repository.findById(id);
      
      if (!appointment) {
        throw this.errorHandler.createNotFoundError(`Appointment with ID ${id} not found`);
      }
      
      // Create update object
      const updateData: Partial<Appointment> = {};
      
      // Copy simple properties
      if (data.title !== undefined) updateData.title = data.title;
      if (data.customerId !== undefined) updateData.customerId = data.customerId;
      if (data.projectId !== undefined) updateData.projectId = data.projectId;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      
      // Handle date and time
      if (data.appointmentDate && data.appointmentTime) {
        // Both date and time provided
        updateData.appointmentDate = this.combineDateAndTime(
          data.appointmentDate,
          data.appointmentTime
        );
      } else if (data.appointmentDate) {
        // Only date provided, keep existing time
        const existingTime = appointment.getISOTime();
        updateData.appointmentDate = this.combineDateAndTime(
        data.appointmentDate,
        existingTime
        );
      } else if (data.appointmentTime) {
        // Only time provided, keep existing date
        const existingDate = appointment.getISODate();
        updateData.appointmentDate = this.combineDateAndTime(
        existingDate,
        data.appointmentTime
        );
      }
      
      // Add updated by
      if (options?.context?.userId) {
        // Assuming we have an updatedBy field in the Appointment entity
        updateData.updatedBy = options.context.userId;
      }
      
      // Update appointment
      const updated = await this.repository.update(id, updateData);
      
      // Log activity
      if (options?.context?.userId) {
        await this.appointmentRepository.logActivity(
          id,
          options.context.userId,
          options.context.userName || 'System',
          'Appointment updated',
          `Updated fields: ${Object.keys(data).join(', ')}`
        );
      }
      
      // Return updated appointment
      return this.toDTO(updated);
    } catch (error) {
      this.logger.error('Error updating appointment', error instanceof Error ? error.message : String(error), { id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Map domain entity to DTO
   * 
   * @param entity - Domain entity
   * @returns Response DTO
   */
  toDTO(entity: Appointment): AppointmentResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      customerId: entity.customerId,
      customerName: (entity as any).customerName,
      projectId: entity.projectId,
      projectTitle: (entity as any).projectTitle,
      appointmentDate: entity.getISODate(),
      dateFormatted: DateTimeHelper.formatDate(entity.appointmentDate, 'dd.MM.yyyy'),
      appointmentTime: entity.getISOTime(),
      timeFormatted: DateTimeHelper.formatDate(entity.appointmentDate, 'yyyy-MM-dd HH:mm').split(' ')[1],
      duration: entity.duration,
      location: entity.location,
      description: entity.description,
      status: entity.status,
      statusLabel: entity.getStatusLabel(),
      statusClass: entity.getStatusClass(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Map domain entity to detailed DTO
   * 
   * @param entity - Domain entity with relations
   * @returns Detailed response DTO
   */
  toDetailedDTO(entity: Appointment): AppointmentDetailResponseDto {
    // Base DTO
    const dto = this.toDTO(entity) as AppointmentDetailResponseDto;
    
    // Add notes
    dto.notes = entity.notes?.map(note => ({
      id: note.id,
      appointmentId: note.appointmentId,
      note: note.text,
      userId: note.userId,
      userName: note.userName,
      formattedDate: DateTimeHelper.formatDate(note.createdAt, 'dd.MM.yyyy HH:mm'),
      createdAt: note.createdAt.toISOString()
    })) || [];
    
    // Add customer if available
    if ((entity as any).customer) {
      dto.customer = {
        id: (entity as any).customer.id,
        name: (entity as any).customer.name,
        email: (entity as any).customer.email
      };
    }
    
    // Add project if available
    if ((entity as any).project) {
      dto.project = {
        id: (entity as any).project.id,
        title: (entity as any).project.title,
        status: (entity as any).project.status
      };
    }
    
    return dto;
  }

  /**
   * Map DTO to domain entity
   * 
   * @param dto - DTO
   * @param existingEntity - Existing entity (for updates)
   * @returns Domain entity
   */
  protected toEntity(dto: AppointmentCreateDto | AppointmentUpdateDto, existingEntity?: Appointment): Partial<Appointment> {
    const entity: Partial<Appointment> = { };
    
    // Handle entity creation
    if ((dto as AppointmentCreateDto).appointmentDate && (dto as AppointmentCreateDto).appointmentTime) {
      const appointmentDate = this.combineDateAndTime(
        (dto as AppointmentCreateDto).appointmentDate,
        (dto as AppointmentCreateDto).appointmentTime
      );
      entity.appointmentDate = appointmentDate;
    }
    
    // Copy other properties
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.customerId !== undefined) entity.customerId = dto.customerId;
    if (dto.projectId !== undefined) entity.projectId = dto.projectId;
    if (dto.duration !== undefined) entity.duration = dto.duration;
    if (dto.location !== undefined) entity.location = dto.location;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.status !== undefined) entity.status = dto.status;
    
    return entity;
  }

  /**
   * Get validation schema for entity creation
   * 
   * @returns Validation schema
   */
  protected getCreateValidationSchema(): any {
    return appointmentCreateValidationSchema;
  }

  /**
   * Get validation schema for entity update
   * 
   * @returns Validation schema
   */
  protected getUpdateValidationSchema(): any {
    return appointmentUpdateValidationSchema;
  }

  /**
   * Check if string is a valid date format (YYYY-MM-DD)
   * 
   * @param dateString - Date string to check
   * @returns Whether the string is a valid date
   */
  private isValidDateString(dateString: string): boolean {
    if (!dateString) return false;
    
    // Check format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    // Check if it's a valid date
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Check if string is a valid time format (HH:MM)
   * 
   * @param timeString - Time string to check
   * @returns Whether the string is a valid time
   */
  private isValidTimeString(timeString: string): boolean {
    if (!timeString) return false;
    
    // Check format
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
  }

  /**
   * Combine date and time strings into a Date object
   * 
   * @param dateString - Date string (YYYY-MM-DD)
   * @param timeString - Time string (HH:MM)
   * @returns Combined Date object
   */
  private combineDateAndTime(dateString: string, timeString: string): Date {
    if (!this.isValidDateString(dateString)) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    
    if (!this.isValidTimeString(timeString)) {
      throw new Error(`Invalid time format: ${timeString}`);
    }
    
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    return new Date(year, month - 1, day, hours, minutes);
  }

  /**
   * Check if appointment is today using the datetime utility
   * 
   * @param appointment - Appointment to check
   * @returns Whether the appointment is today
   */
  private isAppointmentToday(appointment: Appointment): boolean {
    const today = new Date();
    const appointmentDate = appointment.appointmentDate;
    
    return appointmentDate.getDate() === today.getDate() &&
           appointmentDate.getMonth() === today.getMonth() &&
           appointmentDate.getFullYear() === today.getFullYear();
  }
}