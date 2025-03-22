import { PrismaClient, Project } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository';
import { FilterOptions } from '../types/controller-types';
import { QueryBuilder } from '../utils/query-builder';
import { ProjectRecord } from '../types/models';
import { prisma } from '../utils/prisma.utils';

export class ProjectRepository extends BaseRepository<ProjectRecord> {
  constructor() {
    super(prisma, prisma.project);
  }
  
  /**
   * Build query conditions for Project entity
   */
  protected buildFilterConditions(filters: FilterOptions): any {
    const { status, customerId, search, startDate, endDate } = filters;
    
    const builder = new QueryBuilder();
    
    if (status) {
      builder.addFilter('status', status);
    }
    
    if (customerId) {
      builder.addFilter('customerId', Number(customerId));
    }
    
    if (startDate && endDate) {
      builder.addDateRangeBetween('startDate', startDate, endDate);
    } else if (startDate) {
      builder.addDateRange('startDate', startDate);
    }
    
    if (search) {
      builder.addSearch(search, ['title', 'description']);
      
      // Also search for customer name
      builder.addOr([
        { Customer: { name: { contains: search, mode: 'insensitive' } } }
      ]);
    }
    
    return builder.build();
  }
  
  /**
   * Find projects with customer and service information
   */
  async findWithRelations(filters: FilterOptions, pagination: any): Promise<any> {
    return this.findAll(
      filters,
      pagination,
      {
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
    );
  }
  
  /**
   * Find project by ID with all related data
   */
  async findByIdWithDetails(id: number): Promise<any> {
    const project = await this.findById(id, {
      Customer: true,
      Service: true
    });
    
    if (!project) {
      return null;
    }
    
    // Get appointments and notes for this project
    const [appointments, notes] = await Promise.all([
      prisma.appointment.findMany({
        where: { projectId: id },
        orderBy: { appointmentDate: 'asc' }
      }),
      
      prisma.projectNote.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    return {
      project,
      appointments,
      notes
    };
  }
  
  /**
   * Add a note to a project
   */
  async addNote(projectId: number, userId: number, userName: string, text: string): Promise<any> {
    return prisma.projectNote.create({
      data: {
        projectId,
        userId,
        userName,
        text
      }
    });
  }
  
  async createNote(projectId: number, userId: number, userName: string, text: string): Promise<any> {
    return this.addNote(projectId, userId, userName, text);
  }
  
  /**
   * Log project activity
   */
  async logActivity(projectId: number, userId: number, userName: string, action: string, details?: string): Promise<any> {
    return prisma.projectLog.create({
      data: {
        projectId,
        userId,
        userName,
        action,
        details: details || null
      }
    });
  }
  
  async createLog(projectId: number, userId: number, userName: string, action: string, details?: string): Promise<any> {
    return this.logActivity(projectId, userId, userName, action, details);
  }
  
  async getProjectStats(filters: any = {}): Promise<any> {
    // Build where conditions for stats
    const where = this.buildFilterConditions(filters);
    
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
  }
}
