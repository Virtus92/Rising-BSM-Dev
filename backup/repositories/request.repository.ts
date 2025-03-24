import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../backend/utils/base.repository.js';
import { QueryBuilder } from '../utils_bak/query-builder.js';
import { FilterOptions } from '../../backend/types/controller.types.js';
import { ContactRequestRecord } from '../types/models.js';
import { prisma } from '../../backend/utils/prisma.utils.js';
import entityLogger from '../utils_bak/entity-logger.js';

export interface ContactRequest {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  message: string;
  status: string;
  processorId: number | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
  
  /**
   * Create a note for a contact request
   * @param requestId - Contact request ID
   * @param userId - User ID
   * @param userName - User name
   * @param text - Note text
   * @returns The created note
   */
  async createNote(
    requestId: number,
    userId: number,
    userName: string,
    text: string
  ): Promise<any> {
    return entityLogger.createNote(
      'request',
      requestId,
      userId,
      userName,
      text
    );
  }

  /**
   * Log an activity on a contact request
   * @param requestId - Contact request ID
   * @param userId - User ID
   * @param userName - User name
   * @param action - Action type
   * @param details - Action details
   * @returns The created log entry
   */
  async createLog(
    requestId: number,
    userId: number,
    userName: string = 'System',
    action: string,
    details: string = ''
  ): Promise<any> {
    return entityLogger.createLog(
      'request',
      requestId,
      userId,
      userName,
      action,
      details
    );
  }
}

export const requestRepository = new RequestRepository();