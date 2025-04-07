import { prisma } from '../db';
import { BaseRepository } from '../core/BaseRepository';
import { ILoggingService } from '@/types/interfaces/ILoggingService';
import { IErrorHandler } from '@/types/interfaces/IErrorHandler';
import { ICustomer, CustomerStatus, CustomerType } from '@/types/entities/customer/customer';
import { QueryOptions } from '@/types/interfaces/IRepository';

/**
 * Customer repository
 * Repository implementation for customer operations
 */
export class CustomerRepository extends BaseRepository<ICustomer, number> {
  /**
   * Creates a new CustomerRepository instance
   * 
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma.customer, logger, errorHandler);
    this.logger.debug('CustomerRepository initialized');
  }

  /**
   * Find a customer by email
   * 
   * @param email - Email to search for
   * @returns Promise with customer or null
   */
  async findByEmail(email: string): Promise<ICustomer | null> {
    try {
      this.logger.debug(`Finding customer by email: ${email}`);
      
      const customer = await prisma.customer.findFirst({
        where: { 
          email,
          status: { not: CustomerStatus.DELETED }
        }
      });
      
      return customer ? this.mapToDomainEntity(customer) : null;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByEmail', error instanceof Error ? error : String(error), { email });
      throw this.handleError(error);
    }
  }

  /**
   * Search customers with advanced filtering
   * 
   * @param term - Search term
   * @param limit - Maximum number of customers to return
   * @returns Promise with matching customers
   */
  async searchCustomers(term: string, limit: number = 20): Promise<ICustomer[]> {
    try {
      // Sanitize search term
      const sanitizedTerm = term.trim();
      
      // Search across multiple fields
      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: sanitizedTerm, mode: 'insensitive' } },
            { email: { contains: sanitizedTerm, mode: 'insensitive' } },
            { company: { contains: sanitizedTerm, mode: 'insensitive' } },
            { phone: { contains: sanitizedTerm, mode: 'insensitive' } },
            { city: { contains: sanitizedTerm, mode: 'insensitive' } },
            { address: { contains: sanitizedTerm, mode: 'insensitive' } }
          ],
          status: { not: CustomerStatus.DELETED } // Exclude deleted customers
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      // Map to domain entities
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error searching customers', error instanceof Error ? error : String(error), { term });
      throw this.handleError(error);
    }
  }

  /**
   * Find similar customers
   * 
   * @param customerId - Customer ID to find similar customers for
   * @param limit - Maximum number of customers to return
   * @returns Promise with similar customers
   */
  async findSimilarCustomers(customerId: number, limit: number = 5): Promise<ICustomer[]> {
    try {
      // First get the source customer
      const customer = await this.findById(customerId);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${customerId} not found`);
      }
      
      // Build query for similar customers
      const where: any = {
        id: { not: customerId } // Exclude the source customer
      };
      
      // Same customer type
      if (customer.type) {
        where.type = customer.type;
      }
      
      // Same city
      if (customer.city) {
        where.city = customer.city;
      }
      
      // Same postal code region (first 3 digits)
      if (customer.postalCode && customer.postalCode.length >= 3) {
        where.postalCode = { startsWith: customer.postalCode.substring(0, 3) };
      }
      
      // Find customers with similar attributes
      const similarCustomers = await prisma.customer.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      // Map to domain entities
      return similarCustomers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error finding similar customers', error instanceof Error ? error : String(error), { customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Get customer with related data
   * 
   * @param id - Customer ID
   * @returns Promise with customer including related data
   */
  async findByIdWithRelations(id: number): Promise<ICustomer | null> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          projects: {
            select: {
              id: true,
              title: true,
              startDate: true,
              status: true
            },
            where: { status: { not: 'deleted' } }
          },
          appointments: {
            select: {
              id: true,
              title: true,
              appointmentDate: true,
              status: true
            },
            where: { status: { not: 'cancelled' } }
          }
        }
      });
      
      if (!customer) {
        return null;
      }
      
      return this.mapToDomainEntity(customer);
    } catch (error) {
      this.logger.error('Error finding customer with relations', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Create a customer log entry
   * 
   * @param data - Log data
   * @returns Promise with created log
   */
  async createCustomerLog(data: { 
    customerId: number; 
    userId?: number; 
    action: string; 
    details?: string; 
  }): Promise<any> {
    try {
      // Get the user name from the userId if provided
      let userName = "System";
      
      if (data.userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: data.userId },
            select: { name: true }
          });
          if (user) {
            userName = user.name;
          }
        } catch (error) {
          this.logger.warn('Could not fetch user name for log', { userId: data.userId });
        }
      }
      
      return await prisma.customerLog.create({
        data: {
          customerId: data.customerId,
          userId: data.userId,
          userName: userName,
          action: data.action,
          details: data.details,
          createdAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error creating customer log', error instanceof Error ? error : String(error), { data });
      throw this.handleError(error);
    }
  }

  /**
   * Get customer logs
   * 
   * @param customerId - Customer ID
   * @returns Promise with customer logs
   */
  async getCustomerLogs(customerId: number): Promise<any[]> {
    try {
      const logs = await prisma.customerLog.findMany({
        where: {
          customerId: customerId
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return logs.map(log => ({
        id: log.id,
        customerId: log.customerId,
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt,
        user: log.user ? {
          name: log.user.name
        } : null
      }));
    } catch (error) {
      this.logger.error('Error fetching customer logs', error instanceof Error ? error : String(error), { customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<void> {
    // Prisma handles this automatically
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(): Promise<void> {
    // Prisma handles this automatically
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // Prisma handles this automatically
  }

  /**
   * Execute a database query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Promise with query result
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    try {
      switch (operation) {
        case 'findAll':
          return await prisma.customer.findMany(args[0]);
          
        case 'findById':
          return await prisma.customer.findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await prisma.customer.findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await prisma.customer.findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await prisma.customer.create({
            data: args[0]
          });
          
        case 'update':
          return await prisma.customer.update({
            where: { id: args[0] },
            data: args[1]
          });
          
        case 'delete':
          // Soft delete by default
          return await prisma.customer.update({
            where: { id: args[0] },
            data: { 
              status: CustomerStatus.DELETED,
              updatedAt: new Date()
            }
          });
          
        case 'count':
          return await prisma.customer.count({
            where: args[0]
          });
          
        case 'bulkUpdate':
          const [ids, data] = args;
          return await prisma.customer.updateMany({
            where: { id: { in: ids } },
            data
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
    } else {
      // Default sorting
      result.orderBy = { createdAt: 'desc' };
    }
    
    return result;
  }

  /**
   * Process criteria for ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const where: any = {};
    
    // Search text
    if (criteria.search) {
      where.OR = [
        { name: { contains: criteria.search, mode: 'insensitive' } },
        { email: { contains: criteria.search, mode: 'insensitive' } },
        { company: { contains: criteria.search, mode: 'insensitive' } },
        { phone: { contains: criteria.search, mode: 'insensitive' } },
        { city: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    
    // Status filter
    if (criteria.status) {
      where.status = criteria.status;
    } else {
      // Exclude deleted customers by default
      where.status = { not: CustomerStatus.DELETED };
    }
    
    // Type filter
    if (criteria.type) {
      where.type = criteria.type;
    }
    
    // Date range filter
    if (criteria.startDate || criteria.endDate) {
      where.createdAt = {};
      
      if (criteria.startDate) {
        where.createdAt.gte = criteria.startDate;
      }
      
      if (criteria.endDate) {
        where.createdAt.lte = criteria.endDate;
      }
    }
    
    // City filter
    if (criteria.city) {
      where.city = { contains: criteria.city, mode: 'insensitive' };
    }
    
    // Postal code filter
    if (criteria.postalCode) {
      where.postalCode = { startsWith: criteria.postalCode };
    }
    
    // Newsletter filter
    if (criteria.newsletter !== undefined) {
      where.newsletter = criteria.newsletter;
    }
    
    return where;
  }

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): ICustomer {
    if (!ormEntity) {
      return null as any;
    }
    
    return {
      id: ormEntity.id,
      name: ormEntity.name,
      company: ormEntity.company,
      email: ormEntity.email,
      phone: ormEntity.phone,
      address: ormEntity.address,
      postalCode: ormEntity.postalCode,
      city: ormEntity.city,
      country: ormEntity.country,
      notes: ormEntity.notes,
      newsletter: ormEntity.newsletter,
      status: ormEntity.status,
      type: ormEntity.type,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy,
      // Include related data if available
      projects: ormEntity.projects,
      appointments: ormEntity.appointments,
      logs: ormEntity.logs,
      invoices: ormEntity.invoices
    };
  }

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<ICustomer>): any {
    // Remove undefined properties and domain-specific fields
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      // Skip domain-specific properties that don't map to the database
      if (value !== undefined && 
          !['projects', 'appointments', 'logs', 'invoices'].includes(key)) {
        result[key] = value;
      }
    });
    
    // Set timestamps for creates/updates
    if (!result.createdAt && !result.id) {
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
    return error.code === 'P2002'; // Prisma-specific unique constraint error code
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    return error.code === 'P2003'; // Prisma-specific foreign key constraint error code
  }
}
