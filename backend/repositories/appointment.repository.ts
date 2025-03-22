import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository';
import { QueryBuilder } from '../utils/query-builder';
import { FilterOptions } from '../types/controller-types';
import { AppointmentRecord } from '../types/models';
import { prisma } from '../utils/prisma.utils';

export class AppointmentRepository extends BaseRepository<AppointmentRecord> {
  constructor() {
    super(prisma, prisma.appointment);
  }
  
  protected buildFilterConditions(filters: FilterOptions): any {
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
    return this.prisma.appointmentNote.create({
      data: {
        appointmentId,
        userId,
        userName,
        text
      }
    });
  }
  
  async createLog(appointmentId: number, userId: number, userName: string, action: string, details?: string): Promise<any> {
    return this.prisma.appointmentLog.create({
      data: {
        appointmentId,
        userId,
        userName,
        action,
        details: details || null
      }
    });
  }
}
