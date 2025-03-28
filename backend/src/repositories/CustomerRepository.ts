import { BaseRepository } from '../core/BaseRepository.js';
import { ICustomerRepository } from '../interfaces/ICustomerRepository.js';
import { Customer, CustomerStatus } from '../entities/Customer.js';
import { CustomerFilterParams } from '../dtos/CustomerDtos.js';
import { QueryOptions } from '../interfaces/IBaseRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';

/**
 * Implementation of ICustomerRepository for database operations.
 */
export class CustomerRepository extends BaseRepository<Customer, number> implements ICustomerRepository {
    /**
     * Creates a new CustomerRepository instance
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
        super(prisma.customer, logger, errorHandler);
    }

    /**
     * Begin a transaction
     */
    protected async beginTransaction(): Promise<void> {
        try {
            await this.prisma.$transaction(async () => {
                // Transaction logic will be executed here
            });
        } catch (error) {
            this.logger.error('Error beginning transaction', error instanceof Error ? error : String(error));
            throw this.handleError(error);
        }
    }

    /**
     * Commit a transaction
     */
    protected async commitTransaction(): Promise<void> {
        try {
            // Prisma automatically commits the transaction, so no explicit commit is needed
        } catch (error) {
            this.logger.error('Error committing transaction', error instanceof Error ? error : String(error));
            throw this.handleError(error);
        }
    }

    /**
     * Rollback a transaction
     */
    protected async rollbackTransaction(): Promise<void> {
        try {
            // Prisma automatically rolls back the transaction if an error occurs, so no explicit rollback is needed
        } catch (error) {
            this.logger.error('Error rolling back transaction', error instanceof Error ? error : String(error));
            throw this.handleError(error);
        }
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
            switch (operation) {
                case 'findAll':
                    return await this.prisma.customer.findMany(args[0]);
                    
                case 'findById':
                    return await this.prisma.customer.findUnique({
                        where: { id: args[0] },
                        ...(args[1] || {})
                    });
                    
                case 'findByCriteria':
                    return await this.prisma.customer.findMany({
                        where: args[0],
                        ...(args[1] || {})
                    });
                    
                case 'findOneByCriteria':
                    return await this.prisma.customer.findFirst({
                        where: args[0],
                        ...(args[1] || {})
                    });
                    
                case 'create':
                    return await this.prisma.customer.create({
                        data: args[0]
                    });
                    
                case 'update':
                    return await this.prisma.customer.update({
                        where: { id: args[0] },
                        data: args[1]
                    });
                    
                case 'delete':
                    // Soft delete by default
                    return await this.prisma.customer.update({
                        where: { id: args[0] },
                        data: { 
                            status: CustomerStatus.DELETED,
                            updatedAt: new Date()
                        }
                    });
                    
                case 'count':
                    return await this.prisma.customer.count({
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
     * Find customers with similar attributes
     * 
     * @param customerId - Customer ID
     * @param limit - Maximum number of customers to return
     * @returns Promise with similar customers
     */
    async findSimilarCustomers(customerId: number, limit: number = 5): Promise<Customer[]> {
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
            const similarCustomers = await this.prisma.customer.findMany({
                where,
                take: limit,
                orderBy: { createdAt: 'desc' }
            });
            
            // Map to domain entities
        interface SimilarCustomer {
            id: number;
            name: string;
            company: string;
            email: string;
            phone: string;
            address: string;
            postalCode: string;
            city: string;
            country: string;
            status: CustomerStatus;
            type: string;
            newsletter: boolean;
            notes: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: number;
            updatedBy: number;
        }
        
        // Map to domain entities
        return similarCustomers.map((customer: any) => this.mapToDomainEntity(customer));
        } catch (error) {
            this.logger.error('Error finding similar customers', error instanceof Error ? error : String(error), { customerId });
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
    async searchCustomers(term: string, limit: number = 20): Promise<Customer[]> {
        try {
            // Sanitize search term
            const sanitizedTerm = term.trim();
            
            // Search across multiple fields
            const customers = await this.prisma.customer.findMany({
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
        interface CustomerSearch {
            id: number;
            name: string;
            company: string;
            email: string;
            phone: string;
            address: string;
            postalCode: string;
            city: string;
            country: string;
            status: CustomerStatus;
            type: string;
            newsletter: boolean;
            notes: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: number;
            updatedBy: number;
        }
        return customers.map((customer: any) => this.mapToDomainEntity(customer));
        } catch (error) {
            this.logger.error('Error searching customers', error instanceof Error ? error : String(error), { term });
            throw this.handleError(error);
        }
    }

    /**
     * Bulk update multiple customers
     * 
     * @param ids - Array of customer IDs
     * @param data - Update data
     * @returns Promise with count of updated customers
     */
    async bulkUpdate(ids: number[], data: Partial<Customer>): Promise<number> {
        try {
            // Ensure the IDs are valid
            if (!ids.length) {
                return 0;
            }
            
            // Prepare data for Prisma
            const updateData = this.mapToORMEntity(data);
            
            // Perform the update
            const result = await this.prisma.customer.updateMany({
                where: { id: { in: ids } },
                data: updateData
            });
            
            return result.count;
        } catch (error) {
            this.logger.error('Error in bulk update', error instanceof Error ? error : String(error), { ids, data });
            throw this.handleError(error);
        }
    }

    /**
     * Get customer by ID with related data
     * 
     * @param id - Customer ID
     * @param options - Query options
     * @returns Promise with customer including related data
     */
    async findByIdWithRelations(id: number, options?: any): Promise<Customer | null> {
        try {
            // Default include options
            const include = options?.include || {
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
            };
            
            // Find customer with relations
            const customer = await this.prisma.customer.findUnique({
                where: { id },
                include
            });
            
            if (!customer) {
                return null;
            }
            
            // Map to domain entity
            return this.mapToDomainEntity(customer);
        } catch (error) {
            this.logger.error('Error finding customer with relations', error instanceof Error ? error : String(error), { id });
            throw this.handleError(error);
        }
    }

    /**
     * Process criteria for ORM
     * 
     * @param criteria - Filter criteria
     * @returns ORM-specific criteria
     */
    protected processCriteria(criteria: CustomerFilterParams): any {
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
     * Map ORM entity to domain entity
     * 
     * @param ormEntity - ORM entity
     * @returns Domain entity
     */
    protected mapToDomainEntity(ormEntity: any): Customer {
        if (!ormEntity) {
            return null as any;
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
            status: ormEntity.status,
            type: ormEntity.type,
            newsletter: ormEntity.newsletter,
            notes: ormEntity.notes,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
            // Remove properties not in Customer entity
            // createdBy and updatedBy are removed
            projects: ormEntity.projects,
            appointments: ormEntity.appointments,
            logs: ormEntity.logs
        });
    }

    /**
     * Map domain entity to ORM entity
     * 
     * @param domainEntity - Domain entity
     * @returns ORM entity
     */
    protected mapToORMEntity(domainEntity: Partial<Customer>): any {
        // Remove undefined properties and domain-specific fields
        const result: Record<string, any> = {};
        
        Object.entries(domainEntity).forEach(([key, value]) => {
            // Skip domain-specific properties that don't map to the database
            if (value !== undefined && 
                    !['projects', 'appointments'].includes(key)) {
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
                    const user = await this.prisma.user.findUnique({
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
            
            return await this.prisma.customerLog.create({
                data: {
                    customerId: data.customerId,
                    userId: data.userId,
                    userName: userName, // Use the looked-up userName
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
     * Hard delete a customer
     * 
     * @param id - Customer ID
     * @returns Promise with deletion result
     */
    async hardDelete(id: number): Promise<any> {
        try {
            // Use a transaction to ensure atomicity
            return await this.prisma.$transaction(async (prisma) => {
                // First, handle foreign key constraints by setting them to null
                
                // Handle projects
                await prisma.project.updateMany({
                    where: { customerId: id },
                    data: { customerId: null }
                });
                
                // Handle appointments
                await prisma.appointment.updateMany({
                    where: { customerId: id },
                    data: { customerId: null }
                });
                
                // Handle invoices
                await prisma.invoice.updateMany({
                    where: { customerId: id },
                    data: { customerId: null }
                });
                
                // Logs are already set to cascade delete in the schema
                
                // Finally, delete the customer
                return prisma.customer.delete({
                    where: { id }
                });
            });
        } catch (error) {
            this.logger.error('Error in hard delete', error instanceof Error ? error : String(error), { id });
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
            // Query logs with user data
            const logs = await this.prisma.customerLog.findMany({
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
                // Include user name from relation if available
                user: log.user ? {
                    name: log.user.name
                } : null
            }));
        } catch (error) {
            this.logger.error('Error fetching customer logs', error instanceof Error ? error : String(error), { customerId });
            throw this.handleError(error);
        }
    }
}