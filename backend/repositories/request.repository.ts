import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository';
import { QueryBuilder } from '../utils/query-builder';
import { FilterOptions } from '../types/controller-types';
import { ContactRequestRecord } from '../types/models';
import { prisma } from '../utils/prisma.utils';

export class RequestRepository extends BaseRepository<ContactRequestRecord> {
  constructor() {
    super(prisma, prisma.contactRequest);
  }
  
  protected buildFilterConditions(filters: FilterOptions): any {
    const { status, service, date, search } = filters;
    
    const builder = new QueryBuilder();
    
    if (status) {
      builder.addFilter('status', status);
    }
    
    if (service) {
      builder.addFilter('service', service);
    }
    
    if (date) {
      builder.addDateRange('createdAt', date);
    }
    
    if (search) {
      builder.addSearch(search, ['name', 'email']);
    }
    
    return builder.build();
  }
  
  async getRequestWithNotes(id: number): Promise<any> {
    return this.model.findUnique({
      where: { id },
      include: {
        processor: true,
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }
  
  async getRecentRequests(limit: number = 5): Promise<any[]> {
    return this.model.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
  
  async countNewRequests(): Promise<number> {
    return this.model.count({
      where: { status: 'neu' }
    });
  }
  
  async createNote(requestId: number, userId: number, userName: string, text: string): Promise<any> {
    return this.prisma.requestNote.create({
      data: {
        requestId,
        userId,
        userName,
        text
      }
    });
  }
  
  async createLog(requestId: number, userId: number, userName: string, action: string, details?: string): Promise<any> {
    return this.prisma.requestLog.create({
      data: {
        requestId,
        userId,
        userName,
        action,
        details: details || null
      }
    });
  }
}
