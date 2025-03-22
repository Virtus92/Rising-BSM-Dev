/**
 * Project Service
 * 
 * Service for Project entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import { BaseService } from '../utils/base.service.js';
import { ProjectRepository, Project, projectRepository } from '../repositories/project.repository.js';
import { 
  ProjectCreateDTO, 
  ProjectUpdateDTO, 
  ProjectResponseDTO, 
  ProjectDetailResponseDTO,
  ProjectFilterDTO,
  ProjectStatus
} from '../types/dtos/project.dto.js';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError
} from '../utils/error-handler.js';
import { 
  CreateOptions, 
  UpdateOptions, 
  FindOneOptions, 
  FindAllOptions 
} from '../types/service.types.js';
import { getProjektStatusInfo, getTerminStatusInfo } from '../utils/helpers.js';
import validator from '../utils/validator.js';
import logger from '../utils/logger.js';

/**
 * Service for Project entity operations
 */
export class ProjectService extends BaseService<
  Project,
  ProjectRepository,
  ProjectFilterDTO,
  ProjectCreateDTO,
  ProjectUpdateDTO,
  ProjectResponseDTO
> {
  /**
   * Creates a new ProjectService instance
   * @param repository - ProjectRepository instance
   */
  constructor(repository: ProjectRepository = projectRepository) {
    super(repository);
  }

  /**
   * Find all projects with filtering and pagination
   * @param filters - Filter criteria
   * @param options - Find options
   * @returns Paginated list of projects
   */
  async findAll(
    filters: ProjectFilterDTO,
    options: FindAllOptions = {}
  ): Promise<{ data: ProjectResponseDTO[]; pagination: any }> {
    try {
      // Get projects from repository with relations
      const result = await this.repository.findWithRelations(filters, {
        page: options.page,
        limit: options.limit,
        orderBy: options.orderBy 
          ? { [options.orderBy]: options.orderDirection || 'desc' }
          : { createdAt: 'desc' as const }
      });
      
      // Map to response DTOs
      const projects = result.data.map((project: Project) => this.mapEntityToDTO(project));
      
      return {
        data: projects,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error, 'Error fetching projects', { filters, options });
    }
  }

  /**
   * Find project by ID with full details
   * @param id - Project ID
   * @param options - Find options
   * @returns Project with all related data or null if not found
   */
  async findByIdWithDetails(
    id: number,
    options: FindOneOptions = {}
  ): Promise<ProjectDetailResponseDTO | null> {
    try {
      // Get project with details from repository
      const result = await this.repository.findByIdWithDetails(id);
      
      // Return null if project not found
      if (!result || !result.project) {
        if (options.throwIfNotFound) {
          throw new NotFoundError(`Project with ID ${id} not found`);
        }
        return null;
      }
      
      // Map to detailed response DTO
      return this.mapToDetailDTO(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error fetching project details for ID ${id}`);
    }
  }

  /**
   * Create a new project
   * @param data - Project create DTO
   * @param options - Create options
   * @returns Created project
   */
  async create(
    data: ProjectCreateDTO,
    options: CreateOptions = {}
  ): Promise<ProjectResponseDTO> {
    try {
      // Validate create data
      await this.validateCreate(data);
      
      // Map DTO to entity
      const projectData = this.mapCreateDtoToEntity(data);
      
      // Set creator ID if provided
      if (options.userContext?.userId) {
        projectData.createdBy = options.userContext.userId;
      } else if (options.userId) {
        projectData.createdBy = options.userId;
      }
      
      // Create project
      const created = await this.repository.create(projectData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.logActivity(
          created.id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'created',
          'Project created'
        );
      } else if (options.userId) {
        await this.repository.logActivity(
          created.id,
          options.userId,
          'System',
          'created',
          'Project created'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(created);
    } catch (error) {
      this.handleError(error, 'Error creating project', { data });
    }
  }

  /**
   * Update an existing project
   * @param id - Project ID
   * @param data - Project update DTO
   * @param options - Update options
   * @returns Updated project
   */
  async update(
    id: number,
    data: ProjectUpdateDTO,
    options: UpdateOptions = {}
  ): Promise<ProjectResponseDTO> {
    try {
      // Validate update data
      await this.validateUpdate(id, data);
      
      // Get existing project if needed for validation
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError(`Project with ID ${id} not found`);
      }
      
      // Map DTO to entity
      const projectData = this.mapUpdateDtoToEntity(data);
      
      // Update project
      const updated = await this.repository.update(id, projectData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.logActivity(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'updated',
          'Project updated'
        );
      } else if (options.userId) {
        await this.repository.logActivity(
          id,
          options.userId,
          'System',
          'updated',
          'Project updated'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating project with ID ${id}`, { id, data });
    }
  }

  /**
   * Update a project's status
   * @param id - Project ID
   * @param status - New status
   * @param note - Optional note about the status change
   * @param options - Update options
   * @returns Updated project
   */
  async updateStatus(
    id: number,
    status: string,
    note: string | null = null,
    options: UpdateOptions = {}
  ): Promise<ProjectResponseDTO> {
    try {
      // Validate status
      if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
        throw new ValidationError(`Invalid status value. Must be one of: ${Object.values(ProjectStatus).join(', ')}`);
      }
      
      // Execute transaction for status update and optional note
      const updated = await this.repository.transaction(async (tx) => {
        // Update status
        const updated = await tx.project.update({
          where: { id },
          data: {
            status,
            updatedAt: new Date()
          },
          include: {
            Customer: true,
            Service: true
          }
        });
        
        // Add note if provided
        if (note && options.userContext?.userId) {
          await tx.projectNote.create({
            data: {
              projectId: id,
              userId: options.userContext.userId,
              userName: options.userContext.userName || 'System',
              text: note
            }
          });
        } else if (note && options.userId) {
          await tx.projectNote.create({
            data: {
              projectId: id,
              userId: options.userId,
              userName: 'System',
              text: note
            }
          });
        }
        
        // Log status change
        if (options.userContext?.userId) {
          await tx.projectLog.create({
            data: {
              projectId: id,
              userId: options.userContext.userId,
              userName: options.userContext.userName || 'System',
              action: 'status_changed',
              details: `Status changed to: ${status}`
            }
          });
        } else if (options.userId) {
          await tx.projectLog.create({
            data: {
              projectId: id,
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
      this.handleError(error, `Error updating status for project with ID ${id}`, { id, status });
    }
  }

  /**
   * Add a note to a project
   * @param id - Project ID
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
      
      // Check if project exists
      const project = await this.repository.findById(id);
      
      if (!project) {
        throw new NotFoundError(`Project with ID ${id} not found`);
      }
      
      // Add note
      if (options.userContext?.userId) {
        await this.repository.addNote(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          text
        );
        
        // Log activity
        await this.repository.logActivity(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'note_added',
          'Note added to project'
        );
      } else if (options.userId) {
        await this.repository.addNote(
          id,
          options.userId,
          'System',
          text
        );
        
        // Log activity
        await this.repository.logActivity(
          id,
          options.userId,
          'System',
          'note_added',
          'Note added to project'
        );
      } else {
        throw new ValidationError('User context is required to add a note');
      }
      
      return {
        success: true,
        message: 'Note added successfully'
      };
    } catch (error) {
      this.handleError(error, `Error adding note to project with ID ${id}`, { id, text });
    }
  }

  /**
   * Get project statistics
   * @param filters - Filter criteria
   * @returns Project statistics
   */
  async getStatistics(filters: Partial<ProjectFilterDTO> = {}): Promise<any> {
    try {
      return await this.repository.getProjectStats(filters);
    } catch (error) {
      this.handleError(error, 'Error fetching project statistics', { filters });
    }
  }

  /**
   * Validate create DTO
   * @param data - Create DTO
   * @throws ValidationError if validation fails
   */
  protected async validateCreate(data: ProjectCreateDTO): Promise<void> {
    // Validate required fields
    if (!data.titel) {
      throw new ValidationError('Project title is required');
    }
    
    if (!data.start_datum) {
      throw new ValidationError('Start date is required');
    }
    
    // Validate date format
    try {
      new Date(data.start_datum);
    } catch (error) {
      throw new ValidationError('Invalid start date format');
    }
    
    // Validate end date if provided
    if (data.end_datum) {
      try {
        const endDate = new Date(data.end_datum);
        const startDate = new Date(data.start_datum);
        
        if (endDate < startDate) {
          throw new ValidationError('End date must be after start date');
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError('Invalid end date format');
      }
    }
    
    // Validate amount if provided
    if (data.betrag !== undefined && data.betrag !== null) {
      if (isNaN(Number(data.betrag)) || Number(data.betrag) < 0) {
        throw new ValidationError('Amount must be a positive number');
      }
    }
    
    // Validate status if provided
    if (data.status && !Object.values(ProjectStatus).includes(data.status as ProjectStatus)) {
      throw new ValidationError(`Invalid status value. Must be one of: ${Object.values(ProjectStatus).join(', ')}`);
    }
    
    // Validate customer ID if provided
    if (data.kunde_id) {
      // Check if customer exists
      const customer = await this.repository.prisma.customer.findUnique({
        where: { id: Number(data.kunde_id) }
      });
      
      if (!customer) {
        throw new ValidationError(`Customer with ID ${data.kunde_id} not found`);
      }
    }
    
    // Validate service ID if provided
    if (data.dienstleistung_id) {
      // Check if service exists
      const service = await this.repository.prisma.service.findUnique({
        where: { id: Number(data.dienstleistung_id) }
      });
      
      if (!service) {
        throw new ValidationError(`Service with ID ${data.dienstleistung_id} not found`);
      }
    }
  }

  /**
   * Validate update DTO
   * @param id - Project ID
   * @param data - Update DTO
   * @throws ValidationError if validation fails
   */
  protected async validateUpdate(id: number, data: ProjectUpdateDTO): Promise<void> {
    // Validate title if provided
    if (data.titel !== undefined && (!data.titel || data.titel.trim().length < 2)) {
      throw new ValidationError('Project title must be at least 2 characters long');
    }
    
    // Validate dates
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    // Check start date format
    if (data.start_datum) {
      try {
        startDate = new Date(data.start_datum);
      } catch (error) {
        throw new ValidationError('Invalid start date format');
      }
    }
    
    // Check end date format
    if (data.end_datum) {
      try {
        endDate = new Date(data.end_datum);
      } catch (error) {
        throw new ValidationError('Invalid end date format');
      }
    }
    
    // Check date relationship if both provided
    if (startDate && endDate && endDate < startDate) {
      throw new ValidationError('End date must be after start date');
    }
    
    // Get existing project for validation against changed fields
    const existing = await this.repository.findById(id);
    
    if (!existing) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }
    
    // Use existing dates for comparison if not in update data
    if (!startDate && data.end_datum) {
      startDate = existing.startDate;
      
      if (startDate && endDate && endDate < startDate) {
        throw new ValidationError('End date must be after existing start date');
      }
    }
    
    if (!endDate && data.start_datum && existing.endDate) {
      endDate = existing.endDate;
      
      if (startDate && endDate && endDate < startDate) {
        throw new ValidationError('Existing end date must be after new start date');
      }
    }
    
    // Validate amount if provided
    if (data.betrag !== undefined) {
      if (data.betrag !== null && (isNaN(Number(data.betrag)) || Number(data.betrag) < 0)) {
        throw new ValidationError('Amount must be a positive number');
      }
    }
    
    // Validate status if provided
    if (data.status && !Object.values(ProjectStatus).includes(data.status as ProjectStatus)) {
      throw new ValidationError(`Invalid status value. Must be one of: ${Object.values(ProjectStatus).join(', ')}`);
    }
    
    // Validate customer ID if provided
    if (data.kunde_id !== undefined && data.kunde_id !== null) {
      // Check if customer exists
      const customer = await this.repository.prisma.customer.findUnique({
        where: { id: Number(data.kunde_id) }
      });
      
      if (!customer) {
        throw new ValidationError(`Customer with ID ${data.kunde_id} not found`);
      }
    }
    
    // Validate service ID if provided
    if (data.dienstleistung_id !== undefined && data.dienstleistung_id !== null) {
      // Check if service exists
      const service = await this.repository.prisma.service.findUnique({
        where: { id: Number(data.dienstleistung_id) }
      });
      
      if (!service) {
        throw new ValidationError(`Service with ID ${data.dienstleistung_id} not found`);
      }
    }
  }

  /**
   * Map entity to response DTO
   * @param entity - Project entity
   * @returns Project response DTO
   */
  protected mapEntityToDTO(entity: Project): ProjectResponseDTO {
    // Get status info
    const statusInfo = getProjektStatusInfo(entity.status);
    
    return {
      id: entity.id,
      titel: entity.title,
      kunde_id: entity.customerId,
      kunde_name: entity.Customer?.name || 'Kein Kunde zugewiesen',
      dienstleistung_id: entity.serviceId,
      dienstleistung: entity.Service?.name || 'Keine Dienstleistung',
      start_datum: entity.startDate ? format(entity.startDate, 'yyyy-MM-dd') : '',
      end_datum: entity.endDate ? format(entity.endDate, 'yyyy-MM-dd') : '',
      betrag: entity.amount ? Number(entity.amount) : null,
      beschreibung: entity.description || '',
      status: entity.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className,
      createdAt: format(entity.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      updatedAt: format(entity.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    };
  }

  /**
   * Map result with details to detailed response DTO
   * @param result - Result with project, appointments, and notes
   * @returns Project detail response DTO
   */
  protected mapToDetailDTO(result: any): ProjectDetailResponseDTO {
    const { project, appointments, notes } = result;
    
    // Map base project data
    const baseDTO = this.mapEntityToDTO(project);
    
    // Format appointments
    const formattedAppointments = appointments.map((appointment: any) => {
      const statusInfo = getTerminStatusInfo(appointment.status);
      return {
        id: appointment.id,
        titel: appointment.title,
        datum: format(appointment.appointmentDate, 'yyyy-MM-dd HH:mm'),
        status: appointment.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className
      };
    });
    
    // Format notes
    const formattedNotes = notes.map((note: any) => ({
      id: note.id,
      text: note.text,
      formattedDate: format(note.createdAt, 'yyyy-MM-dd HH:mm'),
      benutzer: note.userName
    }));
    
    // Return combined data
    return {
      ...baseDTO,
      notes: formattedNotes,
      appointments: formattedAppointments
    };
  }

  /**
   * Map create DTO to entity
   * @param dto - Create DTO
   * @returns Partial entity for creation
   */
  protected mapCreateDtoToEntity(dto: ProjectCreateDTO): Partial<Project> {
    return {
      title: dto.titel,
      customerId: dto.kunde_id !== undefined ? Number(dto.kunde_id) : null,
      serviceId: dto.dienstleistung_id !== undefined ? Number(dto.dienstleistung_id) : null,
      startDate: dto.start_datum ? new Date(dto.start_datum) : null,
      endDate: dto.end_datum ? new Date(dto.end_datum) : null,
      amount: dto.betrag !== undefined ? Number(dto.betrag) : null,
      description: dto.beschreibung || null,
      status: dto.status || ProjectStatus.NEW
    };
  }

  /**
   * Map update DTO to entity
   * @param dto - Update DTO
   * @returns Partial entity for update
   */
  protected mapUpdateDtoToEntity(dto: ProjectUpdateDTO): Partial<Project> {
    const updateData: Partial<Project> = {};
    
    // Only include fields that are present in the DTO
    if (dto.titel !== undefined) updateData.title = dto.titel;
    if (dto.kunde_id !== undefined) updateData.customerId = dto.kunde_id !== null ? Number(dto.kunde_id) : null;
    if (dto.dienstleistung_id !== undefined) updateData.serviceId = dto.dienstleistung_id !== null ? Number(dto.dienstleistung_id) : null;
    if (dto.start_datum !== undefined) updateData.startDate = new Date(dto.start_datum);
    if (dto.end_datum !== undefined) updateData.endDate = dto.end_datum ? new Date(dto.end_datum) : null;
    if (dto.betrag !== undefined) updateData.amount = dto.betrag !== null ? Number(dto.betrag) : null;
    if (dto.beschreibung !== undefined) updateData.description = dto.beschreibung;
    if (dto.status !== undefined) updateData.status = dto.status;
    
    return updateData;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;