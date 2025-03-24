/**
 * Project Repository
 * 
 * Repository for Project entity operations providing data access and persistence.
 */
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { ProjectFilterParams } from '../types/dtos/project.dto.js';
import { inject } from '../config/dependency-container.js';
import { DatabaseError, NotFoundError } from '../utils/error.utils.js';
import logger from '../utils/logger.js';

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
 * Repository for Project entity operations
 */
export class ProjectRepository extends BaseRepository<Project, ProjectFilterParams> {
  /**
   * Creates a new ProjectRepository instance
   * @param prisma PrismaClient instance
   */
  constructor(prisma: PrismaClient = inject<PrismaClient>('PrismaClient')) {
    super(prisma, prisma.project);
  }

  /**
   * Build query conditions from filter criteria
   * @param filters Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: ProjectFilterParams): any {
    const { 
      status, 
      customerId, 
      serviceId, 
      startDateFrom, 
      startDateTo, 
      search 
    } = filters;
    
    const builder = new QueryBuilder();
    
    // Status filter
    if (status) {
      builder.addFilter('status', status);
    }
    
    // Customer filter
    if (customerId) {
      builder.addFilter('customerId', Number(customerId));
    }
    
    // Service filter
    if (serviceId) {
      builder.addFilter('serviceId', Number(serviceId));
    }
    
    // Date range filter
    if (startDateFrom || startDateTo) {
      const dateFilter: any = {};
      
      if (startDateFrom) {
        dateFilter.gte = new Date(startDateFrom);
      }
      
      if (startDateTo) {
        dateFilter.lte = new Date(startDateTo);
      }
      
      builder.addFilter('startDate', dateFilter);
    }
    
    // Search filter for title and description
    if (search) {
      builder.addSearch(search, ['title', 'description']);
    }
    
    return builder.build();
  }

  /**
   * Find projects with related entities (customer, service)
   * @param filters Filter criteria
   * @param options Query options
   * @returns Paginated projects with relations
   */
  async findWithRelations(
    filters: ProjectFilterParams,
    options: any = {}
  ): Promise<any> {
    try {
      return this.findAll(
        filters,
        {
          ...options,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                basePrice: true
              }
            },
            creator: {
              select: {
                id: true,
                name: true
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
   * @param id Project ID
   * @returns Project with related data
   */
  async findByIdWithDetails(id: number): Promise<any> {
    try {
      // Get project with basic relations
      const project = await this.findById(id, {
        include: {
          customer: true,
          service: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      if (!project) {
        return null;
      }
      
      // Get notes and appointments in parallel
      const [notes, appointments] = await Promise.all([
        this.prisma.projectNote.findMany({
          where: { projectId: id },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        
        this.prisma.appointment.findMany({
          where: { projectId: id },
          orderBy: { appointmentDate: 'asc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      ]);
      
      // Return project with related data
      return {
        ...project,
        notes,
        appointments
      };
    } catch (error) {
      logger.error('Error in ProjectRepository.findByIdWithDetails', { error, id });
      throw new DatabaseError(`Failed to fetch project details for ID ${id}`, { cause: error });
    }
  }

  /**
   * Add a note to a project
   * @param projectId Project ID
   * @param userId User ID
   * @param userName User name
   * @param text Note text
   * @returns Created note
   */
  async addNote(
    projectId: number,
    userId: number,
    userName: string,
    text: string
  ): Promise<ProjectNote> {
    try {
      // First check if project exists
      const project = await this.findById(projectId);
      
      if (!project) {
        throw new NotFoundError(`Project with ID ${projectId} not found`);
      }
      
      // Create the note
      return this.prisma.projectNote.create({
        data: {
          projectId,
          userId,
          userName,
          text,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // If it's already a NotFoundError, rethrow it
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error('Error in ProjectRepository.addNote', { error, projectId, userId });
      throw new DatabaseError('Failed to add note to project', { cause: error });
    }
  }

  /**
   * Update project status
   * @param id Project ID
   * @param status New status
   * @returns Updated project
   */
  async updateStatus(id: number, status: string): Promise<Project> {
    try {
      return this.update(id, {
        status,
        updatedAt: new Date()
      }, {
        checkExists: true
      });
    } catch (error) {
      logger.error('Error in ProjectRepository.updateStatus', { error, id, status });
      throw new DatabaseError(`Failed to update status for project with ID ${id}`, { cause: error });
    }
  }

  /**
   * Get project statistics
   * @param filters Optional filter criteria
   * @returns Project statistics
   */
  async getProjectStats(filters: Partial<ProjectFilterParams> = {}): Promise<any> {
    try {
      // Build where conditions
      const where = this.buildFilterConditions(filters as ProjectFilterParams);
      
      // Get project counts by status
      const statusCounts = await this.prisma.project.groupBy({
        by: ['status'],
        where,
        _count: true
      });
      
      // Get total project value
      const totalValue = await this.prisma.project.aggregate({
        where,
        _sum: {
          amount: true
        }
      });
      
      // Get project counts by month
      const monthlyProjects = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "startDate") as month,
          COUNT(*) as count
        FROM "Project"
        WHERE "startDate" IS NOT NULL
        GROUP BY DATE_TRUNC('month', "startDate")
        ORDER BY month DESC
        LIMIT 12
      `;
      
      return {
        statusCounts,
        totalValue: totalValue._sum.amount || 0,
        monthlyProjects
      };
    } catch (error) {
      logger.error('Error in ProjectRepository.getProjectStats', { error, filters });
      throw new DatabaseError('Failed to fetch project statistics', { cause: error });
    }
  }

  /**
   * Search projects by term
   * @param term Search term
   * @param limit Maximum results to return
   * @returns Matching projects
   */
  async search(term: string, limit: number = 10): Promise<any[]> {
    try {
      return this.prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } }
          ]
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Error in ProjectRepository.search', { error, term });
      throw new DatabaseError('Failed to search projects', { cause: error });
    }
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository();
export default projectRepository;