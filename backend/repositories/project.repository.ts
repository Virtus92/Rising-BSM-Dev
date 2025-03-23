/**
 * Project Repository
 * 
 * Repository for Project entity operations providing data access and persistence.
 */
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { inject } from '../config/dependency-container.js';
import { ProjectFilterDTO } from '../types/dtos/project.dto.js';
import { DatabaseError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import entityLogger from '../utils/entity-logger.js';

/**
 * Project entity type
 */
export interface Project {
  id: number;
  title: string;
  customerId: number | null;
  serviceId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  amount: number | null;
  description: string | null;
  status: string;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  Customer?: any;
  Service?: any;
}

/**
 * Project note type
 */
export interface ProjectNote {
  id: number;
  projectId: number;
  userId: number | null;
  userName: string;
  text: string;
  createdAt: Date;
}

/**
 * Project log type
 */
export interface ProjectLog {
  id: number;
  projectId: number;
  userId: number;
  userName: string;
  action: string;
  details: string | null;
  createdAt: Date;
}

/**
 * Repository for Project entity operations
 */
export class ProjectRepository extends BaseRepository<Project, ProjectFilterDTO> {
  /**
   * Creates a new ProjectRepository instance
   * @param prisma - PrismaClient instance
   */
  constructor(prisma: PrismaClient = inject<PrismaClient>('PrismaClient')) {
    super(prisma, prisma.project);
  }

  /**
   * Build query conditions from filter criteria
   * @param filters - Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: ProjectFilterDTO): any {
    const { 
      status, 
      kunde_id, 
      dienstleistung_id, 
      start_datum_von, 
      start_datum_bis, 
      search 
    } = filters;
    
    const builder = new QueryBuilder();
    
    // Status filter
    if (status) {
      builder.addFilter('status', status);
    }
    
    // Customer filter
    if (kunde_id) {
      builder.addFilter('customerId', Number(kunde_id));
    }
    
    // Service filter
    if (dienstleistung_id) {
      builder.addFilter('serviceId', Number(dienstleistung_id));
    }
    
    // Date range filter
    if (start_datum_von || start_datum_bis) {
      builder.addDateRangeBetween('startDate', start_datum_von, start_datum_bis);
    }
    
    // Search filter for title and description
    if (search) {
      builder.addSearch(search, ['title', 'description']);
      
      // Also search for customer name using relationship
      builder.addOr([
        { Customer: { name: { contains: search, mode: 'insensitive' } } }
      ]);
    }
    
    return builder.build();
  }

  /**
   * Find projects with customer and service information
   * @param filters - Filter criteria
   * @param options - Query options
   * @returns Paginated list of projects with relations
   */
  async findWithRelations(
    filters: ProjectFilterDTO,
    options: any = {}
  ): Promise<any> {
    try {
      return this.findAll(
        filters,
        {
          ...options,
          include: {
            Customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            Service: {
              select: {
                id: true,
                name: true,
                priceBase: true,
                unit: true
              }
            }
          }
        }
      );
    } catch (error) {
      logger.error('Error in ProjectRepository.findWithRelations', { error, filters });
      throw new DatabaseError('Failed to fetch projects with relations', { cause: error });
    }
  }

  /**
   * Find project by ID with all related data
   * @param id - Project ID
   * @returns Project with appointments and notes
   */
  async findByIdWithDetails(id: number): Promise<any> {
    try {
      const project = await this.findById(id, {
        include: {
          Customer: true,
          Service: true
        }
      });
      
      if (!project) {
        return null;
      }
      
      // Get appointments and notes for this project
      const [appointments, notes] = await Promise.all([
        this.prisma.appointment.findMany({
          where: { projectId: id },
          orderBy: { appointmentDate: 'asc' }
        }),
        
        this.prisma.projectNote.findMany({
          where: { projectId: id },
          orderBy: { createdAt: 'desc' }
        })
      ]);
      
      return {
        project,
        appointments,
        notes
      };
    } catch (error) {
      logger.error('Error in ProjectRepository.findByIdWithDetails', { error, id });
      throw new DatabaseError(`Failed to fetch project details for ID ${id}`, { cause: error });
    }
  }

  /**
   * Add a note to a project
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userName - Username
   * @param text - Note text
   * @returns Created note
   */
  async addNote(
    projectId: number,
    userId: number,
    userName: string,
    text: string
  ): Promise<ProjectNote> {
    return entityLogger.createNote(
      'project',
      projectId,
      userId,
      userName,
      text
    );
  }

  /**
   * Log project activity
   * @param projectId - Project ID
   * @param userId - User ID
   * @param userName - Username
   * @param action - Action performed
   * @param details - Action details
   * @returns Created log entry
   */
  async logActivity(
    projectId: number,
    userId: number,
    userName: string = 'System',
    action: string,
    details: string = ''
  ): Promise<any> {
    return entityLogger.createLog(
      'project',
      projectId,
      userId,
      userName,
      action,
      details
    );
  }

  /**
   * Get project statistics
   * @param filters - Filter criteria
   * @returns Project statistics
   */
  async getProjectStats(filters: Partial<ProjectFilterDTO> = {}): Promise<any> {
    try {
      // Build where conditions for stats
      const where = this.buildFilterConditions(filters as ProjectFilterDTO);
      
      // Get counts by status
      const statusCounts = await this.prisma.project.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        }
      });
      
      // Get total project value
      const totalValue = await this.prisma.project.aggregate({
        where,
        _sum: {
          amount: true
        }
      });
      
      return {
        statusCounts,
        totalValue: totalValue._sum.amount || 0
      };
    } catch (error) {
      logger.error('Error in ProjectRepository.getProjectStats', { error, filters });
      throw new DatabaseError('Failed to fetch project statistics', { cause: error });
    }
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository();
export default projectRepository;