import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { Customer } from '@/domain/entities/Customer';
import { CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { CommonStatus, CustomerType, LogActionType } from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';

/**
 * Implementation of the CustomerRepository
 * 
 * Uses Prisma as ORM.
 */
export class CustomerRepository extends PrismaRepository<Customer> implements ICustomerRepository {
  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // 'customer' is the name of the model in Prisma
    super(prisma, 'customer', logger, errorHandler);
    
    this.logger.debug('Initialized CustomerRepository');
  }

  /**
   * Finds a customer by email address
   * 
   * @param email - Email address
   * @returns Promise with customer or null
   */
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      this.logger.debug(`Finding customer by email: ${email}`);
      
      // Note that we might not have email uniqueness for customers
      // So we use findFirst instead of findUnique
      const customer = await this.prisma.customer.findFirst({
        where: { 
          email,
          // Filter deleted customers
          NOT: { status: CommonStatus.DELETED }
        }
      });
      
      return customer ? this.mapToDomainEntity(customer) : null;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByEmail', { error, email });
      throw this.handleError(error);
    }
  }

  /**
   * Searches customers by a search term
   * 
   * @param term - Search term
   * @param limit - Maximum number of results
   * @returns Promise with found customers
   */
  async searchCustomers(term: string, limit: number = 10): Promise<Customer[]> {
    try {
      // Clean search text
      const search = term.trim();
      
      this.logger.debug(`Searching customers with term: ${search}`);
      
      // Execute search query - search by name, company, email, etc
      const customers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } }
          ],
          // Filter deleted customers
          NOT: { status: CommonStatus.DELETED }
        },
        take: limit,
        orderBy: { name: 'asc' }
      });
      
      // Map to domain entities
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.searchCustomers', { error, term });
      throw this.handleError(error);
    }
  }

  /**
   * Finds similar customers
   * 
   * @param customerId - Customer ID
   * @param limit - Maximum number of results
   * @returns Promise with similar customers
   */
  async findSimilarCustomers(customerId: number, limit: number = 5): Promise<Customer[]> {
    try {
      // Get the reference customer
      const referenceCustomer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!referenceCustomer) {
        return [];
      }
      
      // Find similar customers based on city, customer type, or similar criteria
      const similarCustomers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { city: referenceCustomer.city },
            { type: referenceCustomer.type },
            // For business customers: similar companies
            referenceCustomer.company 
              ? { company: { contains: referenceCustomer.company, mode: 'insensitive' } } 
              : {}
          ],
          // Exclude the reference customer
          NOT: { 
            id: customerId,
            status: CommonStatus.DELETED
          }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      // Map to domain entities
      return similarCustomers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findSimilarCustomers', { error, customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Finds a customer with relationships
   * 
   * @param id - Customer ID
   * @returns Promise with customer or null
   */
  async findByIdWithRelations(id: number): Promise<Customer | null> {
    try {
      this.logger.debug(`Finding customer with relations for ID: ${id}`);
      
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          appointments: {
            where: {
              NOT: { status: 'CANCELLED' }
            },
            orderBy: { appointmentDate: 'desc' },
            take: 5
          }
        }
      });
      
      if (!customer) {
        return null;
      }
      
      // Map to domain entity
      const customerEntity = this.mapToDomainEntity(customer);
      
      // Add appointments directly to the customer entity instance
      // This maintains the class prototype chain and all methods
      customerEntity.appointments = customer.appointments.map(appt => ({
        id: appt.id,
        title: appt.title || '',
        appointmentDate: appt.appointmentDate,
        status: appt.status,
        duration: appt.duration,
        location: appt.location || '',
        description: appt.description || '',
        customerId: appt.customerId,
        createdAt: appt.createdAt,
        updatedAt: appt.updatedAt,
        createdBy: appt.createdBy
      }));
      
      return customerEntity;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByIdWithRelations', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Finds customers with advanced filtering options
   * 
   * @param filters - Filter parameters
   * @returns Found customers with pagination
   */
  async findCustomers(filters: CustomerFilterParamsDto): Promise<PaginationResult<Customer>> {
    try {
      // Build WHERE conditions
      const where: any = {};
      
      // Add search criteria
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { company: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Add status filter with case-insensitive handling
      if (filters.status) {
      // Handle both uppercase and lowercase status values for compatibility
      where.OR = where.OR || [];
      const statusConditions = [
        { status: filters.status }, // Exact match
        { status: filters.status.toLowerCase() }, // Lowercase fallback
        { status: filters.status.toUpperCase() }  // Uppercase fallback
      ];
      
      if (where.OR.length > 0) {
        // If OR already exists, wrap in AND
        where.AND = [
          { OR: where.OR },
          { OR: statusConditions }
        ];
        delete where.OR;
      } else {
        where.OR = statusConditions;
      }
    }
      if (filters.type) where.type = filters.type;
      if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
      if (filters.postalCode) where.postalCode = { contains: filters.postalCode, mode: 'insensitive' };
      if (filters.newsletter !== undefined) where.newsletter = filters.newsletter;
      
      // Calculate pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Determine sorting
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.createdAt = 'desc';
        }
        
    // Execute queries
      const [total, customers] = await Promise.all([
        // Count query for total
        this.prisma.customer.count({ where }),
        // Data query with pagination
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy
        })
      ]);
      
      // Map to domain entities
      const data = customers.map(customer => this.mapToDomainEntity(customer));
      
      // Calculate pagination information
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
      this.logger.error('Error in CustomerRepository.findCustomers', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Updates a customer's status
   * 
   * @param id - Customer ID
   * @param status - New status
   * @param updatedBy - ID of the user making the change
   * @returns Updated customer
   */
  async updateStatus(id: number, status: CommonStatus, updatedBy?: number): Promise<Customer> {
    try {
      // Update the customer status
      const updatedCustomer = await this.prisma.customer.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
          updatedBy
        }
      });
      
      // Log the change
      await this.createCustomerLog({
        customerId: id,
        userId: updatedBy,
        action: LogActionType.CHANGE_STATUS,
        details: `Status changed to ${status}`
      });
      
      return this.mapToDomainEntity(updatedCustomer);
    } catch (error) {
      this.logger.error('Error in CustomerRepository.updateStatus', { error, id, status });
      throw this.handleError(error);
    }
  }

  /**
   * Performs a soft delete of a customer
   * 
   * @param id - Customer ID
   * @param updatedBy - ID of the user performing the deletion
   * @returns Success of the operation
   */
  async softDelete(id: number, updatedBy?: number): Promise<boolean> {
    try {
      // Update the customer status to DELETED
      await this.prisma.customer.update({
        where: { id },
        data: {
          status: CommonStatus.DELETED,
          updatedAt: new Date(),
          updatedBy
        }
      });
      
      // Log the deletion
      await this.createCustomerLog({
        customerId: id,
        userId: updatedBy,
        action: LogActionType.DELETE,
        details: 'Customer was deleted (Soft Delete)'
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.softDelete', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Updates a customer's newsletter subscription
   * 
   * @param id - Customer ID
   * @param subscribe - Subscribe to newsletter
   * @param updatedBy - ID of the user making the change
   * @returns Updated customer
   */
  async updateNewsletterSubscription(id: number, subscribe: boolean, updatedBy?: number): Promise<Customer> {
    try {
      // Update the newsletter setting
      const updatedCustomer = await this.prisma.customer.update({
        where: { id },
        data: {
          newsletter: subscribe,
          updatedAt: new Date(),
          updatedBy
        }
      });
      
      // Log the change
      await this.createCustomerLog({
        customerId: id,
        userId: updatedBy,
        action: LogActionType.UPDATE,
        details: `Newsletter subscription ${subscribe ? 'activated' : 'deactivated'}`
      });
      
      return this.mapToDomainEntity(updatedCustomer);
    } catch (error) {
      this.logger.error('Error in CustomerRepository.updateNewsletterSubscription', { error, id, subscribe });
      throw this.handleError(error);
    }
  }

  /**
   * Finds customers by type
   * 
   * @param type - Customer type
   * @param limit - Maximum number of results
   * @returns Found customers
   */
  async findByType(type: CustomerType, limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: { 
          type,
          NOT: { status: CommonStatus.DELETED }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByType', { error, type });
      throw this.handleError(error);
    }
  }

  /**
   * Finds customers by status
   * 
   * @param status - Customer status
   * @param limit - Maximum number of results
   * @returns Found customers
   */
  async findByStatus(status: CommonStatus, limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: { status },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByStatus', { error, status });
      throw this.handleError(error);
    }
  }

  /**
   * Finds recently created or updated customers
   * 
   * @param limit - Maximum number of results
   * @returns Found customers
   */
  async findRecent(limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: { 
          NOT: { status: CommonStatus.DELETED }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findRecent', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Verarbeitet die Kriterien für Abfragen
   * 
   * @param criteria - Abfragekriterien
   * @returns Processed criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    if (criteria.name !== undefined) {
      processedCriteria.name = { contains: criteria.name, mode: 'insensitive' };
    }
    
    if (criteria.email !== undefined) {
      processedCriteria.email = { contains: criteria.email, mode: 'insensitive' };
    }
    
    if (criteria.company !== undefined) {
      processedCriteria.company = { contains: criteria.company, mode: 'insensitive' };
    }
    
    if (criteria.city !== undefined) {
      processedCriteria.city = { contains: criteria.city, mode: 'insensitive' };
    }
    
    // Pass through other criteria directly
    ['id', 'status', 'type', 'newsletter', 'createdBy', 'updatedBy', 'postalCode'].forEach(key => {
      if (criteria[key] !== undefined) {
        processedCriteria[key] = criteria[key];
      }
    });
    
    return processedCriteria;
  }

  /**
   * Creates a customer log entry
   * 
   * @param data - Log data
   * @returns Promise with log entry
   */
  async createCustomerLog(data: { 
    customerId: number; 
    userId?: number; 
    action: string; 
    details?: string; 
  }): Promise<any> {
    try {
      this.logger.debug(`Creating customer log for customer ${data.customerId}: ${data.action}`);
      
      // Load user if available
      let userName = 'System';
      if (data.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: { name: true }
        });
        if (user) {
          userName = user.name;
        }
      }
      
      return await this.prisma.customerLog.create({
        data: {
          customerId: data.customerId,
          userId: data.userId,
          userName,
          action: data.action,
          details: data.details,
          createdAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in CustomerRepository.createCustomerLog', { error, data });
      // Protokollfehler sollten nicht die Hauptoperation beeinträchtigen
      return null;
    }
  }

  /**
   * Gets a customer's logs
   * 
   * @param customerId - Customer ID
   * @returns Promise with log entries
   */
  async getCustomerLogs(customerId: number): Promise<any[]> {
    try {
      this.logger.debug(`Getting logs for customer: ${customerId}`);
      
      const logs = await this.prisma.customerLog.findMany({
        where: { customerId },
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return logs;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.getCustomerLogs', { error, customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Implementation of activity logging
   * 
   * @param userId - User ID
   * @param actionType - Action type
   * @param details - Details
   * @param ipAddress - IP address
   * @returns Promise with log result
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      this.logger.info(`Logging customer activity for user ${userId}: ${actionType}`);

      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details: JSON.stringify({
            entityType: EntityType.CUSTOMER,
            details: details,
            ipAddress: ipAddress
          }),
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in CustomerRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      // Return an empty object instead of null
      return {};
    }
  }

  /**
   * Maps an ORM entity to a domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): Customer {
    if (!ormEntity) {
      throw new Error('Cannot map null or undefined ORM entity to Customer');
    }
    
    return new Customer({
      id: ormEntity.id,
      name: ormEntity.name,
      company: ormEntity.company,
      email: ormEntity.email,
      phone: ormEntity.phone,
      address: ormEntity.address,
      postalCode: ormEntity.postalCode,
      city: ormEntity.city,
      country: ormEntity.country,
      vatNumber: ormEntity.vatNumber, // Added missing vatNumber field
      notes: ormEntity.notes,
      newsletter: ormEntity.newsletter,
      status: ormEntity.status,
      type: ormEntity.type,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
  }

  /**
   * Maps a domain entity to an ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Customer>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    // Set timestamps for creations/updates
    if (!result.createdAt && !result.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Find customers by criteria
   * 
   * @param criteria - Search criteria
   * @returns Array of customers matching criteria
   */
  async find(criteria: Record<string, any>): Promise<Customer[]> {
    try {
      // Process the criteria for the WHERE clause
      const where = this.processCriteria(criteria);
      
      // Execute query
      const customers = await this.prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' }
      });
      
      // Map to domain entities
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.find', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        criteria 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Check if a customer exists
   * 
   * @param id - Customer ID
   * @returns Whether the customer exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const count = await this.prisma.customer.count({
        where: { id }
      });
      
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if customer with ID ${id} exists:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }

  /**
   * Add a note to a customer
   * 
   * @param id - Customer ID
   * @param userId - User ID
   * @param note - Note text
   * @returns Created note
   */
  async addNote(id: number, userId: number, note: string): Promise<any> {
    try {
      // Get user info
      let userName = 'System';
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });
        if (user) {
          userName = user.name;
        }
      }
      
      // Create the note
      const createdNote = await this.prisma.customerLog.create({
        data: {
          customerId: id,
          userId,
          userName,
          action: LogActionType.NOTE,
          details: note,
          createdAt: new Date()
        }
      });
      
      return {
        id: createdNote.id,
        text: createdNote.details,
        createdAt: createdNote.createdAt,
        userId: createdNote.userId,
        userName: createdNote.userName
      };
    } catch (error) {
      this.logger.error(`Error adding note to customer with ID ${id}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        note
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find notes for a customer
   * 
   * @param customerId - Customer ID
   * @returns Customer notes
   */
  async findNotes(customerId: number): Promise<any[]> {
    try {
      // Get all customer logs that are notes
      const notes = await this.prisma.customerLog.findMany({
        where: { 
          customerId,
          action: LogActionType.NOTE 
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return notes.map(note => ({
        id: note.id,
        text: note.details,
        createdAt: note.createdAt,
        userId: note.userId,
        userName: note.userName
      }));
    } catch (error) {
      this.logger.error(`Error finding notes for customer with ID ${customerId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }

  /**
   * Gets activity logs for a customer
   * 
   * @param id - Customer ID
   * @returns Activity logs
   */
  async getActivityLogs(id: number): Promise<any[]> {
    try {
      this.logger.debug(`Getting activity logs for customer: ${id}`);
      
      const activityLogs = await this.prisma.userActivity.findMany({
        where: {
          details: {
            contains: `"entityId":${id}`,
            mode: 'insensitive'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });
      
      return activityLogs.map(log => ({
        id: log.id,
        userId: log.userId,
        userName: log.user?.name || 'System',
        activity: log.activity,
        details: log.details ? JSON.parse(log.details) : {},
        timestamp: log.timestamp
      }));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.getActivityLogs', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Gets all logs for a customer (both direct logs and activity logs)
   * 
   * @param id - Customer ID
   * @returns Customer logs
   */
  async getLogs(id: number): Promise<any[]> {
    try {
      this.logger.debug(`Getting all logs for customer: ${id}`);
      
      // Get both types of logs in parallel
      const [customerLogs, activityLogs] = await Promise.all([
        this.getCustomerLogs(id),
        this.getActivityLogs(id)
      ]);
      
      // Combine both types of logs
      const allLogs = [
        ...customerLogs.map(log => ({
          ...log,
          source: 'customer_log',
          timestamp: log.createdAt
        })),
        ...activityLogs.map(log => ({
          ...log,
          source: 'activity_log'
        }))
      ];
      
      // Sort by timestamp descending
      return allLogs.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt);
        const dateB = new Date(b.timestamp || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      this.logger.error('Error in CustomerRepository.getLogs', { error, id });
      throw this.handleError(error);
    }
  }
}