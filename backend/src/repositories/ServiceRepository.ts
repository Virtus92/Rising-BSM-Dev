import { BaseRepository } from '../core/BaseRepository.js';
import { IServiceRepository } from '../interfaces/IServiceRepository.js';
import { Service } from '../entities/Service.js';
import { ServiceFilterParams } from '../dtos/ServiceDtos.js';
import { FilterCriteria, QueryOptions } from '../interfaces/IBaseRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';

/**
 * Implementation of IServiceRepository for database operations.
 */
export class ServiceRepository extends BaseRepository<Service, number> implements IServiceRepository {
  /**
   * Processes filter criteria to build ORM-specific where conditions.
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific where conditions
   */
  protected processCriteria(criteria: FilterCriteria): any {
    const where: any = {};
    
    // Iterate over each filter criteria
    for (const key in criteria) {
      if (criteria.hasOwnProperty(key)) {
        const value = criteria[key];
        
        // Handle different filter types
        if (typeof value === 'string') {
          // String equality
          where[key] = value;
        } else if (typeof value === 'number') {
          // Number equality
          where[key] = value;
        } else if (Array.isArray(value)) {
          // IN condition
          where[key] = { in: value };
        } else if (value && typeof value === 'object' && value.hasOwnProperty('gt')) {
          // Greater than
          where[key] = { gt: value.gt };
        } else if (value && typeof value === 'object' && value.hasOwnProperty('lt')) {
          // Less than
          where[key] = { lt: value.lt };
        } else if (value && typeof value === 'object' && value.hasOwnProperty('gte')) {
          // Greater than or equal to
          where[key] = { gte: value.gte };
        } else if (value && typeof value === 'object' && value.hasOwnProperty('lte')) {
          // Less than or equal to
          where[key] = { lte: value.lte };
        }
      }
    }
    
    return where;
  }
  /**
   * Creates a new ServiceRepository instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // Pass model reference to BaseRepository
    super(prisma.service, logger, errorHandler);
    
    this.logger.debug('Initialized ServiceRepository');
  }

  /**
   * Find services with advanced filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with services and pagination info
   */
  async findServices(filters: ServiceFilterParams): Promise<{ data: Service[]; pagination: any }> {
    try {
      // Build WHERE conditions
      const where = this.buildServiceFilters(filters);
      
      // Extract pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Build ORDER BY
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.name = 'asc';
      }
      
      // Execute count query
      const total = await this.prisma.service.count({ where });
      
      // Execute main query
      const services = await this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy
      });
      
      // Map to domain entities
      const data = services.map(service => this.mapToDomainEntity(service));
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in ServiceRepository.findServices', error instanceof Error ? error : String(error), { filters });
      throw this.handleError(error);
    }
  }

  /**
   * Find active services
   * 
   * @param limit - Maximum number of services to return
   * @returns Promise with services
   */
  async findActive(limit?: number): Promise<Service[]> {
    try {
      const query: any = {
        where: { active: true },
        orderBy: { name: 'asc' }
      };
      
      if (limit) {
        query.take = limit;
      }
      
      const services = await this.prisma.service.findMany(query);
      
      return services.map(service => this.mapToDomainEntity(service));
    } catch (error) {
      this.logger.error('Error in ServiceRepository.findActive', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Toggle service active status
   * 
   * @param id - Service ID
   * @param active - Active status
   * @returns Promise with updated service
   */
  async toggleStatus(id: number, active: boolean): Promise<Service> {
    try {
      const service = await this.prisma.service.update({
        where: { id },
        data: { 
          active,
          updatedAt: new Date()
        }
      });
      
      return this.mapToDomainEntity(service);
    } catch (error) {
      this.logger.error('Error in ServiceRepository.toggleStatus', error instanceof Error ? error : String(error), { id, active });
      throw this.handleError(error);
    }
  }

  /**
   * Get service statistics
   * 
   * @param serviceId - Service ID
   * @returns Promise with statistics
   */
  async getStatistics(serviceId: number): Promise<any> {
    try {
      // Get service
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId }
      });
      
      if (!service) {
        throw this.errorHandler.createNotFoundError(`Service with ID ${serviceId} not found`);
      }
      
      // Get invoice items for this service
      const invoiceItems = await this.prisma.invoiceItem.findMany({
        where: { serviceId },
        include: {
          invoice: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Calculate total revenue
      let totalRevenue = 0;
      
      // Process invoice items
      for (const item of invoiceItems) {
        totalRevenue += item.quantity * item.unitPrice;
      }
      
      // Get unique invoices
      const invoiceIds = new Set(invoiceItems.map(item => item.invoiceId));
      
      // Calculate monthly revenue
      const monthlyRevenue: { [key: string]: number } = {};
      
      invoiceItems.forEach(item => {
        if (item.invoice) {
          const month = item.invoice.invoiceDate.toISOString().substring(0, 7); // YYYY-MM
          const revenue = item.quantity * item.unitPrice;
          
          if (!monthlyRevenue[month]) {
            monthlyRevenue[month] = 0;
          }
          
          monthlyRevenue[month] += revenue;
        }
      });
      
      // Format monthly revenue data
      const monthlyRevenueArray = Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ 
          month, 
          revenue 
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // Calculate top customers
      const customerRevenue: { [key: string]: { id: number; name: string; revenue: number } } = {};
      
      invoiceItems.forEach(item => {
        if (item.invoice && item.invoice.customer) {
          const customerId = item.invoice.customer.id.toString();
          const revenue = item.quantity * item.unitPrice;
          
          if (!customerRevenue[customerId]) {
            customerRevenue[customerId] = {
              id: item.invoice.customer.id,
              name: item.invoice.customer.name,
              revenue: 0
            };
          }
          
          customerRevenue[customerId].revenue += revenue;
        }
      });
      
      // Get top customers by revenue
      const topCustomers = Object.values(customerRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      return {
        service: {
          id: service.id,
          name: service.name,
          active: service.active
        },
        usage: {
          totalRevenue,
          invoiceCount: invoiceIds.size,
          monthlyRevenue: monthlyRevenueArray,
          topCustomers
        }
      };
    } catch (error) {
      this.logger.error('Error in ServiceRepository.getStatistics', error instanceof Error ? error : String(error), { serviceId });
      throw this.handleError(error);
    }
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Prisma handles transactions differently, so we don't need to do anything here
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(): Promise<void> {
    // Prisma handles transactions differently, so we don't need to do anything here
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // Prisma handles transactions differently, so we don't need to do anything here
  }

  /**
   * Execute a query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Promise with query result
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    try {
      const model = this.prisma.service;
      
      switch (operation) {
        case 'findAll':
          return await model.findMany(args[0]);
          
        case 'findById':
          return await model.findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await model.findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await model.findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await model.create({
            data: args[0]
          });
          
        case 'update':
          return await model.update({
            where: { id: args[0] },
            data: args[1]
          });
          
        case 'delete':
          return await model.delete({
            where: { id: args[0] }
          });
          
        case 'count':
          return await model.count({
            where: args[0]
          });
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      this.logger.error(`Error executing query: ${operation}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Build service-specific filters
   * 
   * @param filters - Service filter parameters
   * @returns ORM-specific where conditions
   */
  protected buildServiceFilters(filters: ServiceFilterParams): any {
    const where: any = {};
    
    // Add status filter
    if (filters.status) {
      where.active = filters.status === 'active';
    }
    
    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    return where;
  }

  /**
   * Build query options for ORM
   * 
   * @param options - Query options
   * @returns ORM-specific query options
   */
  protected buildQueryOptions(options?: QueryOptions): any {
    if (!options) {
      return {};
    }
    
    const result: any = {};
    
    // Add pagination
    if (options.page !== undefined && options.limit !== undefined) {
      result.skip = (options.page - 1) * options.limit;
      result.take = options.limit;
    }
    
    // Add select fields
    if (options.select && options.select.length > 0) {
      result.select = options.select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Add relations
    if (options.relations && options.relations.length > 0) {
      result.include = options.relations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Add sorting
    if (options.sort) {
      result.orderBy = {
        [options.sort.field]: options.sort.direction.toLowerCase()
      };
    }
    
    return result;
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): Service {
    if (!ormEntity) {
      return null as any;
    }
    
    return new Service({
      id: ormEntity.id,
      name: ormEntity.name,
      description: ormEntity.description,
      basePrice: Number(ormEntity.basePrice), // Convert Decimal to number
      vatRate: Number(ormEntity.vatRate), // Convert Decimal to number
      active: ormEntity.active,
      unit: ormEntity.unit,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt
    });
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Service>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    if (domainEntity.name !== undefined) result.name = domainEntity.name;
    if (domainEntity.description !== undefined) result.description = domainEntity.description;
    if (domainEntity.basePrice !== undefined) result.basePrice = domainEntity.basePrice;
    if (domainEntity.vatRate !== undefined) result.vatRate = domainEntity.vatRate;
    if (domainEntity.active !== undefined) result.active = domainEntity.active;
    if (domainEntity.unit !== undefined) result.unit = domainEntity.unit;
    
    // Set timestamps for creates/updates
    if (!result.createdAt && !domainEntity.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Check if error is a unique constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a unique constraint violation
   */
  protected isUniqueConstraintError(error: any): boolean {
    // Prisma-specific unique constraint error code
    return error.code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    // Prisma-specific foreign key constraint error code
    return error.code === 'P2003';
  }
}
