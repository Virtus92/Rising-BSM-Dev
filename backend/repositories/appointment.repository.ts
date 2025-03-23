import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { FilterOptions } from '../types/controller.types.js';
import { AppointmentFilterDTO } from '../types/dtos/appointment.dto.js';
import { AppointmentRecord } from '../types/models.js';
import { prisma } from '../utils/prisma.utils.js';
import entityLogger from '../utils/entity-logger.js';

/**
 * Appointment entity type
 */
export interface Appointment {
  id: number;
  title: string;
  customerId: number | null | undefined;
  projectId: number | null | undefined;
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
  Customer?: any;
  Project?: any;
}

export class AppointmentRepository extends BaseRepository<AppointmentRecord, AppointmentFilterDTO> {
  constructor() {
    super(prisma, prisma.appointment);
  }
  
  protected buildFilterConditions(filters: AppointmentFilterDTO): any {
    const { status, date, search, customerId, projectId } = filters;
    
    const builder = new QueryBuilder();
    
    if (status) {
      builder.addFilter('status', status);
    }
    
    if (date) {
      builder.addDateRange('appointmentDate', date, true);
    }
    
    if (customerId) {
      builder.addFilter('customerId', Number(customerId));
    }
    
    if (projectId) {
      builder.addFilter('projectId', Number(projectId));
    }
    
    if (search) {
      builder.addSearch(search, ['title', 'location']);
      
      // Also search for customer name
      builder.addOr([
        { Customer: { name: { contains: search, mode: 'insensitive' } } }
      ]);
    }
    
    return builder.build();
  }
  
  /**
   * Find customer by ID for validation
   * @param id Customer ID
   * @returns True if customer exists
   */
  async customerExists(id: number): Promise<boolean> {
    const count = await this.prisma.customer.count({
      where: { id }
    });
    return count > 0;
  }
  
  /**
   * Find project by ID for validation
   * @param id Project ID
   * @returns True if project exists
   */
  async projectExists(id: number): Promise<boolean> {
    const count = await this.prisma.project.count({
      where: { id }
    });
    return count > 0;
  }
  
  async getAppointmentWithRelations(id: number): Promise<any> {
    return this.model.findUnique({
      where: { id },
      include: {
        Customer: true,
        Project: true,
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }
  
  async getUpcomingAppointments(limit: number = 5): Promise<any[]> {
    return this.model.findMany({
      where: {
        appointmentDate: {
          gte: new Date()
        }
      },
      include: {
        Customer: true
      },
      orderBy: {
        appointmentDate: 'asc'
      },
      take: limit
    });
  }
  
  async createNote(appointmentId: number, userId: number, userName: string, text: string): Promise<any> {
    return entityLogger.createNote(
      'appointment',
      appointmentId,
      userId,
      userName,
      text
    );
  }
  
  async createLog(appointmentId: number, userId: number, userName: string = 'System', action: string, details: string = ''): Promise<any> {
    return entityLogger.createLog(
      'appointment',
      appointmentId,
      userId,
      userName,
      action,
      details
    );
  }
}

export const appointmentRepository = new AppointmentRepository();
export default appointmentRepository;
