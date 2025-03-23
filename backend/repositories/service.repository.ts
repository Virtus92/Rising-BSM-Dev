import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { ServiceFilterDTO } from '../types/dtos/service.dto.js';
import { ServiceRecord } from '../types/models.js';
import { prisma } from '../utils/prisma.utils.js';
import entityLogger from '../utils/entity-logger.js';

/**
 * Service entity type
 */
export interface Service {
  id: number;
  name: string;
  description: string | null;
  priceBase: number;
  unit: string | null;
  vatRate: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service Repository
 * 
 * Repository for Service entity operations
 */
export class ServiceRepository extends BaseRepository<ServiceRecord, ServiceFilterDTO> {
  constructor() {
    super(prisma, prisma.service);
  }
  
  protected buildFilterConditions(filters: ServiceFilterDTO): any {
    const { status, search } = filters;
    
    const builder = new QueryBuilder();
    
    if (status === 'aktiv') {
      builder.addFilter('active', true);
    } else if (status === 'inaktiv') {
      builder.addFilter('active', false);
    }
    
    if (search) {
      builder.addSearch(search, ['name', 'description']);
    }
    
    return builder.build();
  }
  
  async getServiceRevenue(serviceId: number, period?: string): Promise<any> {
    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period) {
      const startDate = new Date();
      
      switch(period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          // Default to last month
          startDate.setMonth(startDate.getMonth() - 1);
      }
      
      dateFilter = {
        gte: startDate,
        lte: now
      };
    }
    
    // Get service revenue data
    const serviceRevenue = await this.prisma.invoicePosition.groupBy({
      by: ['serviceId'],
      where: {
        serviceId,
        invoice: { // Changed from Invoice to invoice
          invoiceDate: dateFilter
        }
      },
      _sum: {
        quantity: true,
        unitPrice: true
      }
    });
    
    // Get top customers for this service
    const topCustomers = await this.prisma.invoicePosition.groupBy({
      by: ['invoiceId'],
      where: {
        serviceId
      },
      _sum: {
        quantity: true,
        unitPrice: true
      },
      orderBy: {
        _sum: {
          unitPrice: 'desc'
        }
      },
      take: 5
    });
    
    // Get customer information for the top customers
    const invoiceIds = topCustomers.map(item => item.invoiceId);
    
    const customerInfo = await this.prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds }
      },
      select: {
        id: true,
        customerId: true,
        customer: { // Changed from Customer to customer
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return {
      revenue: serviceRevenue,
      topCustomers: customerInfo
    };
  }
  
  /**
   * Log an activity on a service
   * @param serviceId - Service ID
   * @param userId - User ID
   * @param userName - User name
   * @param action - Action type
   * @param details - Action details
   * @returns The created log entry
   */
  async createLog(
    serviceId: number,
    userId: number,
    userName: string = 'System',
    action: string,
    details: string = ''
  ): Promise<any> {
    return entityLogger.createLog(
      'service',
      serviceId,
      userId,
      userName,
      action,
      details
    );
  }
}

export const serviceRepository = new ServiceRepository();
export default serviceRepository;
