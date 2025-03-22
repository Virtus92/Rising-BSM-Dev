import { Project } from '@prisma/client';
import { ProjectRepository } from '../repositories/project.repository';
import { FilterOptions } from '../types/controller-types';
import { CreateOptions, UpdateOptions, DeleteOptions, FindAllOptions, FindOneOptions } from '../types/base.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { formatDateSafely } from '../utils/formatters';
import { getProjektStatusInfo, getTerminStatusInfo } from '../utils/helpers';
import logger from '../utils/logger';

export class ProjectService {
  private projectRepository: ProjectRepository;
  
  constructor() {
    this.projectRepository = new ProjectRepository();
  }
  
  /**
   * Find all projects with filtering and pagination
   */
  async findAll(filters: FilterOptions, options: FindAllOptions = {}): Promise<any> {
    try {
      const { page, limit } = options;
      
      // Get projects with relations
      const result = await this.projectRepository.findWithRelations(
        filters, 
        { page, limit }
      );
      
      // Format project data for API response
      const formattedProjects = result.data.map((project: any) => {
        const statusInfo = getProjektStatusInfo(project.status);
        
        return {
          id: project.id,
          titel: project.title,
          kunde_id: project.customerId,
          kunde_name: project.Customer?.name || 'Kein Kunde zugewiesen',
          dienstleistung: project.Service?.name || 'Keine Dienstleistung',
          start_datum: formatDateSafely(project.startDate || new Date(), 'dd.MM.yyyy'),
          end_datum: formatDateSafely(project.endDate || new Date(), 'dd.MM.yyyy'),
          status: project.status,
          statusLabel: statusInfo.label,
          statusClass: statusInfo.className,
          betrag: project.amount
        };
      });
      
      return {
        projects: formattedProjects,
        pagination: result.pagination,
        filters
      };
    } catch (error) {
      logger.error('Error in ProjectService.findAll', error);
      throw error;
    }
  }
  
  /**
   * Find a project by ID with all related data
   */
  async findById(id: number, options: FindOneOptions = {}): Promise<any> {
    try {
      const projectId = Number(id);
      
      if (isNaN(projectId)) {
        throw new ValidationError('Invalid project ID');
      }
      
      // Get project with all related data
      const result = await this.projectRepository.findByIdWithDetails(projectId);
      
      if (!result || !result.project) {
        if (options.throwIfNotFound) {
          throw new NotFoundError(`Project with ID ${projectId} not found`);
        }
        return null;
      }
      
      // Format project data for response
      const { project, appointments, notes } = result;
      const statusInfo = getProjektStatusInfo(project.status);
      
      return {
        project: {
          id: project.id,
          titel: project.title,
          kunde_id: project.customerId,
          kunde_name: project.Customer?.name || 'Kein Kunde zugewiesen',
          dienstleistung_id: project.serviceId,
          dienstleistung: project.Service?.name || 'Nicht zugewiesen',
          start_datum: formatDateSafely(project.startDate, 'dd.MM.yyyy'),
          end_datum: project.endDate ? formatDateSafely(project.endDate, 'dd.MM.yyyy') : 'Nicht festgelegt',
          betrag: project.amount ? Number(project.amount) : null,
          beschreibung: project.description || 'Keine Beschreibung vorhanden',
          status: project.status,
          statusLabel: statusInfo.label,
          statusClass: statusInfo.className
        },
        appointments: appointments.map((appointment: any) => {
          const appointmentStatus = getTerminStatusInfo(appointment.status);
          return {
            id: appointment.id,
            titel: appointment.title,
            datum: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy, HH:mm'),
            statusLabel: appointmentStatus.label,
            statusClass: appointmentStatus.className
          };
        }),
        notes: notes.map((note: any) => ({
          id: note.id,
          text: note.text,
          formattedDate: formatDateSafely(note.createdAt, 'dd.MM.yyyy, HH:mm'),
          benutzer: note.userName
        }))
      };
    } catch (error) {
      logger.error('Error in ProjectService.findById', error);
      throw error;
    }
  }
  
  /**
   * Create a new project
   */
  async create(data: any, options: CreateOptions = {}): Promise<any> {
    try {
      const { userId } = options;
      
      // Map DTO fields to database fields
      const projectData = {
        title: data.titel,
        customerId: data.kunde_id ? Number(data.kunde_id) : null,
        serviceId: data.dienstleistung_id ? Number(data.dienstleistung_id) : null,
        startDate: new Date(data.start_datum),
        endDate: data.end_datum ? new Date(data.end_datum) : null,
        amount: data.betrag ? Number(data.betrag) : null,
        description: data.beschreibung || null,
        status: data.status || 'neu',
        createdBy: userId || null
      };
      
      // Create project in database
      const project = await this.projectRepository.create(projectData);
      
      // Log activity
      if (userId) {
        await this.projectRepository.logActivity(
          project.id,
          userId,
          'System',
          'created',
          'Project created'
        );
        
        // Create notification for customer if assigned
        if (project.customerId) {
          // This would be handled by a notification service
          // For now we'll just log it
          logger.info(`Notification would be sent to customer ${project.customerId} about new project ${project.id}`);
        }
      }
      
      return {
        projectId: project.id,
        message: 'Project created successfully'
      };
    } catch (error) {
      logger.error('Error in ProjectService.create', error);
      throw error;
    }
  }
  
  /**
   * Update an existing project
   */
  async update(id: number, data: any, options: UpdateOptions = {}): Promise<any> {
    try {
      const projectId = Number(id);
      const { userId, throwIfNotFound = true } = options;
      
      if (isNaN(projectId)) {
        throw new ValidationError('Invalid project ID');
      }
      
      // Check if project exists
      const existingProject = await this.projectRepository.findById(projectId);
      
      if (!existingProject) {
        if (throwIfNotFound) {
          throw new NotFoundError(`Project with ID ${projectId} not found`);
        }
        return null;
      }
      
      // Map DTO fields to database fields
      const projectData = {
        title: data.titel,
        customerId: data.kunde_id ? Number(data.kunde_id) : null,
        serviceId: data.dienstleistung_id ? Number(data.dienstleistung_id) : null,
        startDate: new Date(data.start_datum),
        endDate: data.end_datum ? new Date(data.end_datum) : null,
        amount: data.betrag ? Number(data.betrag) : null,
        description: data.beschreibung || null,
        status: data.status || existingProject.status
      };
      
      // Update project in database
      const project = await this.projectRepository.update(projectId, projectData);
      
      // Log activity
      if (userId) {
        await this.projectRepository.logActivity(
          projectId,
          userId,
          'System',
          'updated',
          'Project updated'
        );
      }
      
      return {
        projectId,
        message: 'Project updated successfully'
      };
    } catch (error) {
      logger.error('Error in ProjectService.update', error);
      throw error;
    }
  }
  
  /**
   * Update project status
   */
  async updateStatus(id: number, status: string, note: string | null, options: UpdateOptions = {}): Promise<any> {
    try {
      const projectId = Number(id);
      const { userId, throwIfNotFound = true } = options;
      
      if (isNaN(projectId)) {
        throw new ValidationError('Invalid project ID');
      }
      
      // Validate status value
      if (!status) {
        throw new ValidationError('Status is required');
      }
      
      // Check valid status values
      if (!['neu', 'in_bearbeitung', 'abgeschlossen', 'storniert'].includes(status)) {
        throw new ValidationError('Invalid status value');
      }
      
      // Check if project exists
      const project = await this.projectRepository.findById(projectId);
      
      if (!project) {
        if (throwIfNotFound) {
          throw new NotFoundError(`Project with ID ${projectId} not found`);
        }
        return null;
      }
      
      // Execute transaction for status update and optional note
      await this.projectRepository.transaction(async (tx: any) => {
        // Update status
        await tx.project.update({
          where: { id: projectId },
          data: {
            status,
            updatedAt: new Date()
          }
        });
        
        // Add note if provided
        if (note && note.trim() !== '' && userId) {
          const userName = 'System'; // In a real app, get this from user service
          await this.projectRepository.addNote(projectId, userId, userName, note);
        }
        
        // Log the status change
        if (userId) {
          await this.projectRepository.logActivity(
            projectId,
            userId,
            'System',
            'status_changed',
            `Status changed to: ${status}`
          );
        }
      });
      
      return {
        projectId,
        message: 'Project status updated successfully'
      };
    } catch (error) {
      logger.error('Error in ProjectService.updateStatus', error);
      throw error;
    }
  }
  
  /**
   * Add note to project
   */
  async addNote(id: number, note: string, options: CreateOptions = {}): Promise<any> {
    try {
      const projectId = Number(id);
      const { userId } = options;
      
      if (isNaN(projectId)) {
        throw new ValidationError('Invalid project ID');
      }
      
      if (!note || note.trim() === '') {
        throw new ValidationError('Note cannot be empty');
      }
      
      // Check if project exists
      const project = await this.projectRepository.findById(projectId);
      
      if (!project) {
        throw new NotFoundError(`Project with ID ${projectId} not found`);
      }
      
      // Add note to project
      if (userId) {
        const userName = 'System'; // In a real app, get this from user service
        await this.projectRepository.addNote(projectId, userId, userName, note);
        
        // Log activity
        await this.projectRepository.logActivity(
          projectId,
          userId,
          userName,
          'note_added',
          'Note added to project'
        );
      }
      
      return {
        projectId,
        message: 'Note added successfully'
      };
    } catch (error) {
      logger.error('Error in ProjectService.addNote', error);
      throw error;
    }
  }
}
