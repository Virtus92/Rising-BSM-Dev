import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository';
import { QueryBuilder } from '../utils/query-builder';
import { FilterOptions } from '../types/controller-types';
import { CustomerRecord } from '../types/models';
import { prisma } from '../utils/prisma.utils';

export class CustomerRepository extends BaseRepository<CustomerRecord> {
  constructor() {
    super(prisma, prisma.customer);
  }
  
  protected buildFilterConditions(filters: FilterOptions): any {
    const { status, type, search } = filters;
    
    const builder = new QueryBuilder();
    
    if (status) {
      builder.addFilter('status', status);
    }
    
    if (type) {
      builder.addFilter('type', type);
    }
    
    if (search) {
      builder.addSearch(search, ['name', 'email', 'company']);
    }
    
    return builder.build();
  }
  
  async findByEmail(email: string): Promise<CustomerRecord | null> {
    return this.model.findFirst({
      where: { email }
    });
  }
  
  async getCustomerWithRelations(id: number): Promise<any> {
    return this.model.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { startDate: 'desc' },
          take: 10
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10
        }
      }
    });
  }
  
  async createNote(customerId: number, userId: number, userName: string, text: string): Promise<any> {
    // For customers, notes are stored directly in the customer table
    // So we update the notes field instead of creating a separate record
    const customer = await this.model.findUnique({
      where: { id: customerId },
      select: { notes: true }
    });
    
    const timestamp = new Date().toISOString();
    const newNote = `${timestamp} - ${userName}:\n${text}\n\n${customer?.notes || ''}`;
    
    return this.model.update({
      where: { id: customerId },
      data: {
        notes: newNote,
        updatedAt: new Date()
      }
    });
  }
  
  async createLog(customerId: number, userId: number, userName: string, action: string, details?: string): Promise<any> {
    return this.prisma.customerLog.create({
      data: {
        customerId,
        userId,
        userName,
        action,
        details: details || null
      }
    });
  }
  
  async getCustomerStats(): Promise<any> {
    // Use Prisma's raw query capabilities for more complex stats
    return this.prisma.$queryRaw`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN type = 'privat' THEN 1 END) AS privat,
        COUNT(CASE WHEN type = 'geschaeft' THEN 1 END) AS geschaeft,
        COUNT(CASE WHEN status = 'aktiv' THEN 1 END) AS aktiv
      FROM "Customer"
    `;
  }
  
  async getCustomerGrowthData(months: number = 12): Promise<any> {
    // Get monthly customer growth data
    return this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "createdAt") AS month,
        COUNT(*) AS customer_count
      FROM "Customer"
      WHERE status != 'geloescht' AND "createdAt" >= NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `;
  }
}
