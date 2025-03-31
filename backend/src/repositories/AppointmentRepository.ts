import { BaseRepository } from '../core/BaseRepository.js';
import { IAppointmentRepository } from '../interfaces/IAppointmentRepository.js';
import { Appointment, AppointmentStatus } from '../entities/Appointment.js';
import { AppointmentFilterParams } from '../dtos/AppointmentDtos.js';
import { QueryOptions } from '../interfaces/IBaseRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import { datetime } from '../utils/datetime-helper.js';

/**
 * Implementation of IAppointmentRepository for database operations.
 */
export class AppointmentRepository extends BaseRepository<Appointment, number> implements IAppointmentRepository {
    /**
     * Creates a new AppointmentRepository instance
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
        super(prisma.appointment, logger, errorHandler);
        
        this.logger.debug('Initialized AppointmentRepository');
    }

    /**
     * Find appointments with advanced filtering
     * 
     * @param filters - Filter parameters
     * @returns Promise with appointments and pagination info
     */
    async findAppointments(filters: AppointmentFilterParams): Promise<{ data: Appointment[]; pagination: any }> {
        try {
            // Build WHERE conditions
            const where = this.buildAppointmentFilters(filters);
            
            // Extract pagination parameters
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const skip = (page - 1) * limit;
            
            // Build ORDER BY
            const orderBy: any = {};
            if (filters.sortBy) {
                orderBy[filters.sortBy] = filters.sortDirection || 'desc';
            } else {
                orderBy.appointmentDate = 'asc';
            }
            
            // Execute count query
            const total = await this.prisma.appointment.count({ where });
            
            // Execute main query
            const appointments = await this.prisma.appointment.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    customer: {
                        select: {
                            name: true
                        }
                    },
                    project: {
                        select: {
                            title: true
                        }
                    }
                }
            });
            
            // Map to domain entities
            const data = appointments.map(appointment => this.mapToDomainEntity(appointment));
            
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
            this.logger.error('Error in AppointmentRepository.findAppointments', error instanceof Error ? error : String(error), { filters });
            throw this.handleError(error);
        }
    }

    /**
     * Get appointment notes
     * 
     * @param appointmentId - Appointment ID
     * @returns Promise with appointment notes
     */
    async getAppointmentNotes(appointmentId: number): Promise<any[]> {
        try {
            const notes = await this.prisma.appointmentNote.findMany({
                where: { appointmentId },
                include: {
                    user: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return notes.map(note => ({
                id: note.id,
                appointmentId: note.appointmentId,
                userId: note.userId,
                userName: note.userName || (note.user ? note.user.name : 'System'),
                text: note.text,
                createdAt: note.createdAt
            }));
        } catch (error) {
            this.logger.error('Error fetching appointment notes', error instanceof Error ? error : String(error), { appointmentId });
            throw this.handleError(error);
        }
    }

    /**
     * Add note to appointment
     * 
     * @param data - Note data
     * @returns Promise with created note
     */
    async addNote(data: { appointmentId: number; userId: number; userName: string; text: string }): Promise<any> {
        try {
            const note = await this.prisma.appointmentNote.create({
                data: {
                    appointmentId: data.appointmentId,
                    userId: data.userId,
                    userName: data.userName,
                    text: data.text
                }
            });
            
            return note;
        } catch (error) {
            this.logger.error('Error adding appointment note', error instanceof Error ? error : String(error), { data });
            throw this.handleError(error);
        }
    }

    /**
     * Log appointment activity
     * 
     * @param data - Activity log data
     * @returns Promise with created log entry
     */
    async logActivity(data: { appointmentId: number; userId: number; userName: string; action: string; details?: string }): Promise<any> {
        try {
            return await this.prisma.appointmentLog.create({
                data: {
                    appointmentId: data.appointmentId,
                    userId: data.userId,
                    userName: data.userName,
                    action: data.action,
                    details: data.details,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            this.logger.error('Error logging appointment activity', error instanceof Error ? error : String(error), { data });
            // Don't throw error for logging failures, just return null
            return null;
        }
    }

    /**
     * Find appointments for a specific date
     * 
     * @param date - Date to find appointments for
     * @param options - Query options
     * @returns Promise with appointments for the date
     */
    async findByDate(date: Date, options?: QueryOptions): Promise<Appointment[]> {
        try {
            const startOfDay = datetime.startOfDay(date);
            const endOfDay = datetime.endOfDay(date);
            
            const appointments = await this.prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    customer: {
                        select: {
                            name: true
                        }
                    },
                    project: {
                        select: {
                            title: true
                        }
                    }
                },
                orderBy: {
                    appointmentDate: 'asc'
                },
                ...this.buildQueryOptions(options)
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding appointments by date', error instanceof Error ? error : String(error), { date });
            throw this.handleError(error);
        }
    }

    /**
     * Find upcoming appointments
     * 
     * @param limit - Number of appointments to return
     * @param options - Query options
     * @returns Promise with upcoming appointments
     */
    async findUpcoming(limit: number = 5, options?: QueryOptions): Promise<Appointment[]> {
        try {
            const now = new Date();
            
            const appointments = await this.prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: now
                    },
                    status: {
                        in: [AppointmentStatus.PLANNED, AppointmentStatus.CONFIRMED]
                    }
                },
                include: {
                    customer: {
                        select: {
                            name: true
                        }
                    },
                    project: {
                        select: {
                            title: true
                        }
                    }
                },
                orderBy: {
                    appointmentDate: 'asc'
                },
                take: limit,
                ...this.buildQueryOptions(options)
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding upcoming appointments', error instanceof Error ? error : String(error));
            throw this.handleError(error);
        }
    }

    /**
     * Find appointments by customer ID
     * 
     * @param customerId - Customer ID
     * @param options - Query options
     * @returns Promise with customer's appointments
     */
    async findByCustomerId(customerId: number, options?: QueryOptions): Promise<Appointment[]> {
        try {
            const appointments = await this.prisma.appointment.findMany({
                where: {
                    customerId
                },
                include: {
                    project: {
                        select: {
                            title: true
                        }
                    }
                },
                orderBy: {
                    appointmentDate: 'desc'
                },
                ...this.buildQueryOptions(options)
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding appointments by customer ID', error instanceof Error ? error : String(error), { customerId });
            throw this.handleError(error);
        }
    }

    /**
     * Find appointments by project ID
     * 
     * @param projectId - Project ID
     * @param options - Query options
     * @returns Promise with project's appointments
     */
    async findByProjectId(projectId: number, options?: QueryOptions): Promise<Appointment[]> {
        try {
            const appointments = await this.prisma.appointment.findMany({
                where: {
                    projectId
                },
                include: {
                    customer: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    appointmentDate: 'desc'
                },
                ...this.buildQueryOptions(options)
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding appointments by project ID', error instanceof Error ? error : String(error), { projectId });
            throw this.handleError(error);
        }
    }

    /**
     * Get appointment with details
     * 
     * @param id - Appointment ID
     * @returns Promise with appointment including relations
     */
    async getAppointmentWithDetails(id: number): Promise<Appointment | null> {
        try {
            const appointment = await this.prisma.appointment.findUnique({
                where: { id },
                include: {
                    customer: true,
                    project: true,
                    notes: {
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
                    }
                }
            });
            
            if (!appointment) {
                return null;
            }
            
            return this.mapToDomainEntity(appointment);
        } catch (error) {
            this.logger.error('Error getting appointment with details', error instanceof Error ? error : String(error), { id });
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
            const model = this.prisma.appointment;
            
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
     * Build appointment-specific filters
     * 
     * @param filters - Appointment filter parameters
     * @returns ORM-specific where conditions
     */
    protected buildAppointmentFilters(filters: AppointmentFilterParams): any {
        const where: any = {};
        
        // Add status filter
        if (filters.status) {
            where.status = filters.status;
        }
        
        // Add date filter
        if (filters.date) {
            const date = new Date(filters.date);
            where.appointmentDate = {
                gte: datetime.startOfDay(date),
                lte: datetime.endOfDay(date)
            };
        }
        
        // Add search filter
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { location: { contains: filters.search, mode: 'insensitive' } }
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
    protected mapToDomainEntity(ormEntity: any): Appointment {
        if (!ormEntity) {
            return null as any;
        }
        
        const appointment = new Appointment({
            id: ormEntity.id,
            title: ormEntity.title,
            customerId: ormEntity.customerId,
            projectId: ormEntity.projectId,
            appointmentDate: ormEntity.appointmentDate,
            duration: ormEntity.duration,
            location: ormEntity.location,
            description: ormEntity.description,
            status: ormEntity.status,
            createdBy: ormEntity.createdBy,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt
        });
        
        // Add customer and project data if available
        if (ormEntity.customer) {
            (appointment as any).customerName = ormEntity.customer.name;
        }
        
        if (ormEntity.project) {
            (appointment as any).projectTitle = ormEntity.project.title;
        }
        
        // Add notes if available
        if (ormEntity.notes) {
            appointment.notes = ormEntity.notes.map((note: any) => ({
                id: note.id,
                appointmentId: note.appointmentId,
                userId: note.userId,
                userName: note.userName || (note.user ? note.user.name : 'System'),
                text: note.text,
                createdAt: note.createdAt,
                formattedDate: datetime.formatDateTime(note.createdAt)
            }));
        }
        
        return appointment;
    }

    /**
     * Map domain entity to ORM entity
     * 
     * @param domainEntity - Domain entity
     * @returns ORM entity
     */
    protected mapToORMEntity(domainEntity: Partial<Appointment>): any {
        // Remove undefined properties and domain-specific fields
        const result: Record<string, any> = {};
        
        // Map only the fields that exist in the database
        if (domainEntity.title !== undefined) result.title = domainEntity.title;
        if (domainEntity.customerId !== undefined) result.customerId = domainEntity.customerId;
        if (domainEntity.projectId !== undefined) result.projectId = domainEntity.projectId;
        if (domainEntity.appointmentDate !== undefined) result.appointmentDate = domainEntity.appointmentDate;
        if (domainEntity.duration !== undefined) result.duration = domainEntity.duration;
        if (domainEntity.location !== undefined) result.location = domainEntity.location;
        if (domainEntity.description !== undefined) result.description = domainEntity.description;
        if (domainEntity.status !== undefined) result.status = domainEntity.status;
        if (domainEntity.createdBy !== undefined) result.createdBy = domainEntity.createdBy;
        
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
