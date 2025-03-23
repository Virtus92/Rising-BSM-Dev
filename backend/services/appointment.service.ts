/**
 * Appointment Service
 * 
 * Service for Appointment entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import { BaseService } from '../utils/base.service.js';
import { AppointmentRepository, Appointment, appointmentRepository } from '../repositories/appointment.repository.js';
import { 
  AppointmentCreateDTO, 
  AppointmentUpdateDTO, 
  AppointmentResponseDTO, 
  AppointmentDetailDTO,
  AppointmentFilterDTO,
  AppointmentStatusUpdateDTO
} from '../types/dtos/appointment.dto.js';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError
} from '../utils/errors.js';
import { 
  CreateOptions, 
  UpdateOptions, 
  FindOneOptions, 
  FindAllOptions 
} from '../types/service.types.js';
import { getTerminStatusInfo } from '../utils/helpers.js';
import { validateRequired, validateDate } from '../utils/common-validators.js';
import logger from '../utils/logger.js';

/**
 * Type for AppointmentRecord from database
 */
export interface AppointmentRecord {
  id: number;
  title: string;
  customerId: number | null;  // Ensure this is not optional (undefined)
  projectId: number | null;   // Ensure this is not optional (undefined)
  appointmentDate: Date;
  duration: number | null;
  location: string | null;
  description: string | null;
  status: string;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: any;
  project?: any;
  // For backwards compatibility
  Customer?: any;
  Project?: any;
}

/**
 * Service for Appointment entity operations
 */
export class AppointmentService extends BaseService<
  Appointment,
  AppointmentRepository,
  AppointmentFilterDTO,
  AppointmentCreateDTO,
  AppointmentUpdateDTO,
  AppointmentResponseDTO
> {
  /**
   * Creates a new AppointmentService instance
   * @param repository - AppointmentRepository instance
   */
  constructor(repository: AppointmentRepository = appointmentRepository) {
    super(repository);
  }

  /**
   * Find all appointments with filtering and pagination
   * @param filters - Filter criteria
   * @param options - Find options
   * @returns Paginated list of appointments
   */
  async findAll(
    filters: AppointmentFilterDTO,
    options: FindAllOptions = {}
  ): Promise<{ data: AppointmentResponseDTO[]; pagination: any }> {
    try {
      // Get appointments from repository with relations
      const result = await this.repository.findAll(filters, {
        page: options.page,
        limit: options.limit,
        orderBy: options.orderBy 
          ? { [options.orderBy]: options.orderDirection || 'asc' }
          : { appointmentDate: 'asc' as const },
        include: {
          customer: true,
          project: true
        }
      });
      
      // Map to response DTOs
      const appointments = result.data.map((appointment: AppointmentRecord | Appointment) => 
        this.mapEntityToDTO(appointment)
      );
      
      return {
        data: appointments,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error, 'Error fetching appointments', { filters, options });
    }
  }

  /**
   * Search appointments
   * @param searchTerm - Search term
   * @returns List of appointment search results
   */
  async search(searchTerm: string): Promise<any[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }
      
      // Instead of direct access to protected prisma, use the repository
      const appointments = await this.repository.transaction(async (tx) => {
        return tx.appointment.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { location: { contains: searchTerm, mode: 'insensitive' } },
              { customer: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true
              }
            },
            project: {
              select: {
                id: true,
                title: true
              }
            }
          },
          take: 10
        });
      });
      
      // Format results for search
      return appointments.map((appointment: any) => ({
        id: appointment.id,
        title: appointment.title,
        type: 'Termin',
        date: format(appointment.appointmentDate, 'dd.MM.yyyy HH:mm'),
        status: appointment.status,
        url: `/dashboard/termine/${appointment.id}`,
        customer: appointment.customer?.name || 'Kein Kunde',
        project: appointment.project?.title || 'Kein Projekt'
      }));
    } catch (error) {
      this.handleError(error, 'Error searching appointments', { searchTerm });
    }
  }

  /**
   * Find appointment by ID with full details
   * @param id - Appointment ID
   * @param options - Find options
   * @returns Appointment with all related data or null if not found
   */
  async findByIdWithDetails(
    id: number,
    options: FindOneOptions = {}
  ): Promise<AppointmentDetailDTO | null> {
    try {
      // Get appointment with details from repository
      const result = await this.repository.getAppointmentWithRelations(id);
      
      // Return null if appointment not found
      if (!result) {
        if (options.throwIfNotFound) {
          throw new NotFoundError(`Appointment with ID ${id} not found`);
        }
        return null;
      }
      
      // Map to detailed response DTO
      return this.mapToDetailDTO(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error fetching appointment details for ID ${id}`);
    }
  }

  /**
   * Get upcoming appointments
   * @param limit - Maximum number of appointments to return
   * @returns List of upcoming appointments
   */
  async getUpcomingAppointments(limit: number = 5): Promise<AppointmentResponseDTO[]> {
    try {
      const appointments = await this.repository.getUpcomingAppointments(limit);
      return appointments.map((appointment: Appointment) => this.mapEntityToDTO(appointment));
    } catch (error) {
      this.handleError(error, 'Error fetching upcoming appointments');
    }
  }

  /**
   * Create a new appointment
   * @param data - Appointment create DTO
   * @param options - Create options
   * @returns Created appointment
   */
  async create(
    data: AppointmentCreateDTO,
    options: CreateOptions = {}
  ): Promise<AppointmentResponseDTO> {
    try {
      // Validate create data
      await this.validateCreate(data);
      
      // Map DTO to entity
      const appointmentData = this.mapCreateDtoToEntity(data);
      
      // Set creator ID if provided
      if (options.userContext?.userId) {
        appointmentData.createdBy = options.userContext.userId;
      } else if (options.userId) {
        appointmentData.createdBy = options.userId;
      }
      
      // Create appointment
      const created = await this.repository.create(appointmentData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.createLog(
          created.id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'created',
          'Appointment created'
        );
      } else if (options.userId) {
        await this.repository.createLog(
          created.id,
          options.userId,
          'System',
          'created',
          'Appointment created'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(created);
    } catch (error) {
      this.handleError(error, 'Error creating appointment', { data });
    }
  }

  /**
   * Update an existing appointment
   * @param id - Appointment ID
   * @param data - Appointment update DTO
   * @param options - Update options
   * @returns Updated appointment
   */
  async update(
    id: number,
    data: AppointmentUpdateDTO,
    options: UpdateOptions = {}
  ): Promise<AppointmentResponseDTO> {
    try {
      // Validate update data
      await this.validateUpdate(id, data);
      
      // Get existing appointment
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError(`Appointment with ID ${id} not found`);
      }
      
      // Map DTO to entity
      const appointmentData = this.mapUpdateDtoToEntity(data);
      
      // Update appointment
      const updated = await this.repository.update(id, appointmentData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.createLog(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'updated',
          'Appointment updated'
        );
      } else if (options.userId) {
        await this.repository.createLog(
          id,
          options.userId,
          'System',
          'updated',
          'Appointment updated'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating appointment with ID ${id}`, { id, data });
    }
  }

  /**
   * Update appointment status
   * @param id - Appointment ID
   * @param status - New status
   * @param note - Optional note about the status change
   * @param options - Update options
   * @returns Updated appointment
   */
  async updateStatus(
    id: number,
    status: string,
    note: string | null = null,
    options: UpdateOptions = {}
  ): Promise<AppointmentResponseDTO> {
    try {
      // Validate status
      const validStatuses = ['geplant', 'bestaetigt', 'abgeschlossen', 'storniert'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Execute transaction for status update and optional note
      const updated = await this.repository.transaction(async (tx) => {
        // Update status
        const updated = await tx.appointment.update({
          where: { id },
          data: {
            status,
            updatedAt: new Date()
          },
          include: {
            Customer: true,
            Project: true
          }
        });
        
        // Add note if provided
        if (note && options.userContext?.userId) {
          await tx.appointmentNote.create({
            data: {
              appointmentId: id,
              userId: options.userContext.userId,
              userName: options.userContext.userName || 'System',
              text: note
            }
          });
        } else if (note && options.userId) {
          await tx.appointmentNote.create({
            data: {
              appointmentId: id,
              userId: options.userId,
              userName: 'System',
              text: note
            }
          });
        }
        
        // Log status change
        if (options.userContext?.userId) {
          await tx.appointmentLog.create({
            data: {
              appointmentId: id,
              userId: options.userContext.userId,
              userName: options.userContext.userName || 'System',
              action: 'status_changed',
              details: `Status changed to: ${status}`
            }
          });
        } else if (options.userId) {
          await tx.appointmentLog.create({
            data: {
              appointmentId: id,
              userId: options.userId,
              userName: 'System',
              action: 'status_changed',
              details: `Status changed to: ${status}`
            }
          });
        }
        
        return updated;
      });
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating status for appointment with ID ${id}`, { id, status });
    }
  }

  /**
   * Add a note to an appointment
   * @param id - Appointment ID
   * @param text - Note text
   * @param options - Create options
   * @returns Success message
   */
  async addNote(
    id: number,
    text: string,
    options: CreateOptions = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate note text
      if (!text || text.trim() === '') {
        throw new ValidationError('Note text is required');
      }
      
      // Check if appointment exists
      const appointment = await this.repository.findById(id);
      
      if (!appointment) {
        throw new NotFoundError(`Appointment with ID ${id} not found`);
      }
      
      // Add note
      if (options.userContext?.userId) {
        await this.repository.createNote(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          text
        );
        
        // Log activity
        await this.repository.createLog(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'note_added',
          'Note added to appointment'
        );
      } else if (options.userId) {
        await this.repository.createNote(
          id,
          options.userId,
          'System',
          text
        );
        
        // Log activity
        await this.repository.createLog(
          id,
          options.userId,
          'System',
          'note_added',
          'Note added to appointment'
        );
      } else {
        throw new ValidationError('User context is required to add a note');
      }
      
      return {
        success: true,
        message: 'Note added successfully'
      };
    } catch (error) {
      this.handleError(error, `Error adding note to appointment with ID ${id}`, { id, text });
    }
  }

  /**
   * Validate create DTO
   * @param data - Create DTO
   * @throws ValidationError if validation fails
   */
  protected async validateCreate(data: AppointmentCreateDTO): Promise<void> {
    // Validate required fields
    validateRequired(data.titel, 'Title');
    validateRequired(data.termin_datum, 'Date');
    validateRequired(data.termin_zeit, 'Time');
    
    // Validate date and time format
    try {
      const dateTime = new Date(`${data.termin_datum}T${data.termin_zeit}`);
      if (isNaN(dateTime.getTime())) {
        throw new Error('Invalid date/time format');
      }
    } catch (error) {
      throw new ValidationError('Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time.');
    }
    
    // Validate duration if provided
    if (data.dauer !== undefined && (isNaN(Number(data.dauer)) || Number(data.dauer) <= 0)) {
      throw new ValidationError('Duration must be a positive number');
    }
    
    // Validate customer ID if provided
    if (data.kunde_id) {
      // Check if customer exists
      const customerExists = await this.repository.customerExists(Number(data.kunde_id));
      
      if (!customerExists) {
        throw new ValidationError(`Customer with ID ${data.kunde_id} not found`);
      }
    }
    
    // Validate project ID if provided
    if (data.projekt_id) {
      // Check if project exists
      const projectExists = await this.repository.projectExists(Number(data.projekt_id));
      
      if (!projectExists) {
        throw new ValidationError(`Project with ID ${data.projekt_id} not found`);
      }
    }
  }

  /**
   * Validate update DTO
   * @param id - Appointment ID
   * @param data - Update DTO
   * @throws ValidationError if validation fails
   */
  protected async validateUpdate(id: number, data: AppointmentUpdateDTO): Promise<void> {
    // Validate title if provided
    if (data.titel !== undefined) {
      validateRequired(data.titel, 'Title');
    }
    
    // Validate date and time if provided
    if ((data.termin_datum && !data.termin_zeit) || (!data.termin_datum && data.termin_zeit)) {
      throw new ValidationError('Both date and time must be provided together');
    }
    
    if (data.termin_datum && data.termin_zeit) {
      try {
        const dateTime = new Date(`${data.termin_datum}T${data.termin_zeit}`);
        if (isNaN(dateTime.getTime())) {
          throw new Error('Invalid date/time format');
        }
      } catch (error) {
        throw new ValidationError('Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time.');
      }
    }
    
    // Validate duration if provided
    if (data.dauer !== undefined && (isNaN(Number(data.dauer)) || Number(data.dauer) <= 0)) {
      throw new ValidationError('Duration must be a positive number');
    }
    
    // Validate customer ID if provided
    if (data.kunde_id !== undefined && data.kunde_id !== null) {
      // Check if customer exists
      const customerExists = await this.repository.customerExists(Number(data.kunde_id));
      
      if (!customerExists) {
        throw new ValidationError(`Customer with ID ${data.kunde_id} not found`);
      }
    }
    
    // Validate project ID if provided
    if (data.projekt_id !== undefined && data.projekt_id !== null) {
      // Check if project exists
      const projectExists = await this.repository.projectExists(Number(data.projekt_id));
      
      if (!projectExists) {
        throw new ValidationError(`Project with ID ${data.projekt_id} not found`);
      }
    }
    
    // Validate status if provided
    if (data.status) {
      const validStatuses = ['geplant', 'bestaetigt', 'abgeschlossen', 'storniert'];
      if (!validStatuses.includes(data.status)) {
        throw new ValidationError(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
      }
    }
  }

  /**
   * Map entity to response DTO
   * @param entity - Appointment entity
   * @returns Appointment response DTO
   */
  protected mapEntityToDTO(entity: AppointmentRecord | Appointment): AppointmentResponseDTO {
    const statusInfo = getTerminStatusInfo(entity.status);
    
    // Get customer and project information safely
    const customerName = 
      entity.customer?.name || 
      entity.Customer?.name || 
      'Kein Kunde zugewiesen';
    
    const projectTitle = 
      entity.project?.title || 
      entity.Project?.title || 
      'Kein Projekt zugewiesen';
    
    return {
      id: entity.id,
      titel: entity.title,
      kunde_id: entity.customerId || null,  // Handle undefined case
      kunde_name: customerName,
      projekt_id: entity.projectId || null,  // Handle undefined case
      projekt_titel: projectTitle,
      termin_datum: entity.appointmentDate,
      dateFormatted: format(entity.appointmentDate, 'dd.MM.yyyy'),
      timeFormatted: format(entity.appointmentDate, 'HH:mm'),
      dauer: entity.duration !== null ? entity.duration : 60,
      ort: entity.location || 'Nicht angegeben',
      status: entity.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    };
  }

  /**
   * Map result with details to detailed response DTO
   * @param result - Appointment with notes and optional related data
   * @returns Appointment detail response DTO
   */
  protected mapToDetailDTO(result: any): AppointmentDetailDTO {
    const appointment = result;
    const statusInfo = getTerminStatusInfo(appointment.status);
    
    // Format notes
    const formattedNotes = appointment.notes?.map((note: any) => ({
      id: note.id,
      text: note.text,
      formattedDate: format(note.createdAt, 'dd.MM.yyyy, HH:mm'),
      benutzer: note.userName
    })) || [];
    
    // Safely access properties
    const customerId = appointment.customerId || null;
    const projectId = appointment.projectId || null;
    const customerName = appointment.customer?.name || 
                        appointment.Customer?.name || 
                        'Kein Kunde zugewiesen';
    const projectTitle = appointment.project?.title || 
                        appointment.Project?.title || 
                        'Kein Projekt zugewiesen';
    
    // Return combined data
    return {
      id: appointment.id,
      titel: appointment.title,
      kunde_id: customerId,
      kunde_name: customerName,
      projekt_id: projectId,
      projekt_titel: projectTitle,
      termin_datum: appointment.appointmentDate,
      dateFormatted: format(appointment.appointmentDate, 'dd.MM.yyyy'),
      timeFormatted: format(appointment.appointmentDate, 'HH:mm'),
      dauer: appointment.duration !== null ? appointment.duration : 60,
      ort: appointment.location || 'Nicht angegeben',
      beschreibung: appointment.description || 'Keine Beschreibung vorhanden',
      status: appointment.status,
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
  protected mapCreateDtoToEntity(dto: AppointmentCreateDTO): Partial<Appointment> {
    // Combine date and time
    const appointmentDate = new Date(`${dto.termin_datum}T${dto.termin_zeit}`);
    
    return {
      title: dto.titel,
      customerId: dto.kunde_id ? Number(dto.kunde_id) : null,
      projectId: dto.projekt_id ? Number(dto.projekt_id) : null,
      appointmentDate,
      duration: dto.dauer ? Number(dto.dauer) : 60,
      location: dto.ort || null,
      description: dto.beschreibung || null,
      status: dto.status || 'geplant'
    };
  }

  /**
   * Map update DTO to entity
   * @param dto - Update DTO
   * @returns Partial entity for update
   */
  protected mapUpdateDtoToEntity(dto: AppointmentUpdateDTO): Partial<Appointment> {
    const updateData: Partial<Appointment> = {};
    
    // Only include fields that are present in the DTO
    if (dto.titel !== undefined) updateData.title = dto.titel;
    if (dto.kunde_id !== undefined) updateData.customerId = dto.kunde_id !== null ? Number(dto.kunde_id) : null;
    if (dto.projekt_id !== undefined) updateData.projectId = dto.projekt_id !== null ? Number(dto.projekt_id) : null;
    
    // Combine date and time if both are provided
    if (dto.termin_datum && dto.termin_zeit) {
      updateData.appointmentDate = new Date(`${dto.termin_datum}T${dto.termin_zeit}`);
    }
    
    if (dto.dauer !== undefined) updateData.duration = Number(dto.dauer);
    if (dto.ort !== undefined) updateData.location = dto.ort;
    if (dto.beschreibung !== undefined) updateData.description = dto.beschreibung;
    if (dto.status !== undefined) updateData.status = dto.status;
    
    return updateData;
  }
}