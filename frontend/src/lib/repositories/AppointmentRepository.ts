import { BaseRepository } from '../core/BaseRepository.js';
import { IAppointmentRepository } from '../../types/interfaces/IAppointmentRepository.js';
import { Appointment, AppointmentStatus } from '../entities/Appointment.js';
import { AppointmentFilterParams } from '../dtos/AppointmentDtos.js';
import { QueryOptions, FilterCriteria } from '../../types/interfaces/IBaseRepository.js';
import { ILoggingService } from '../../types/interfaces/ILoggingService.js';
import { IErrorHandler } from '../../types/interfaces/IErrorHandler.js';
// Korrigierter Import für PrismaClient
import { PrismaClient } from '@prisma/client';
import { DateTimeHelper } from '../utils/datetime-helper.js';

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
            this.logger.error('Error in AppointmentRepository.findAppointments', error instanceof Error ? error.message : String(error), { filters });
            throw this.handleError(error);
        }
    }

    /**
     * Get appointment notes
     * 
     * @param appointmentId - Appointment ID
     * @returns Promise with appointment notes
     */
    async getNotes(appointmentId: number): Promise<any[]> {
        return this.getAppointmentNotes(appointmentId);
    }

    /**
     * Get appointment notes with details
     * 
     * @param appointmentId - Appointment ID
     * @returns Promise with detailed notes
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
            this.logger.error('Error fetching appointment notes', error instanceof Error ? error.message : String(error), { appointmentId });
            throw this.handleError(error);
        }
    }

    /**
     * Add note to appointment
     * 
     * @param appointmentIdOrData - Appointment ID or note data object
     * @param userId - User ID
     * @param userName - User name
     * @param text - Note text
     * @returns Promise with created note
     */
    async addNote(
        appointmentIdOrData: number | { appointmentId: number; userId: number; userName: string; text: string },
        userId?: number,
        userName?: string,
        text?: string
    ): Promise<any> {
        try {
            let data: { appointmentId: number; userId: number; userName: string; text: string };
            
            if (typeof appointmentIdOrData === 'number') {
                if (userId === undefined || userName === undefined || text === undefined) {
                    throw new Error('Missing parameters for addNote');
                }
                data = {
                    appointmentId: appointmentIdOrData,
                    userId,
                    userName,
                    text
                };
            } else {
                data = appointmentIdOrData;
            }
            
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
            this.logger.error('Error adding appointment note', error instanceof Error ? error.message : String(error), { 
                appointmentIdOrData, 
                userId, 
                userName 
            });
            throw this.handleError(error);
        }
    }

    /**
     * Log appointment activity
     * 
     * @param appointmentIdOrData - Appointment ID or activity data object
     * @param userId - User ID
     * @param userName - User name
     * @param action - Activity type
     * @param details - Activity details
     * @returns Promise with created log entry
     */
    async logActivity(
        appointmentIdOrData: number | { appointmentId: number; userId: number; userName: string; action: string; details?: string },
        userId?: number,
        userName?: string,
        action?: string,
        details?: string
    ): Promise<any> {
        try {
            let data: { appointmentId: number; userId: number; userName: string; action: string; details?: string };
            
            if (typeof appointmentIdOrData === 'number') {
                if (userId === undefined || userName === undefined || action === undefined) {
                    throw new Error('Missing parameters for logActivity');
                }
                data = {
                    appointmentId: appointmentIdOrData,
                    userId,
                    userName,
                    action,
                    details
                };
            } else {
                data = appointmentIdOrData;
            }
            
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
            this.logger.error('Error logging appointment activity', error instanceof Error ? error.message : String(error), { 
                appointmentIdOrData, 
                userId, 
                action 
            });
            // Don't throw error for logging failures, just return null
            return null;
        }
    }

    /**
     * Find appointments for a specific date
     * 
     * @param date - Date to find appointments for
     * @returns Promise with appointments for the date
     */
    async findByDate(date: string | Date): Promise<Appointment[]> {
        try {
            // Convert string to Date if needed
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            
            const startOfDay = DateTimeHelper.startOfDay(dateObj);
            const endOfDay = DateTimeHelper.endOfDay(dateObj);
            
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
                }
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding appointments by date', error instanceof Error ? error.message : String(error), { date });
            throw this.handleError(error);
        }
    }

    /**
     * Find appointments for a date range
     * 
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Promise with appointments for the date range
     */
    async findByDateRange(startDate: string | Date, endDate: string | Date): Promise<Appointment[]> {
        try {
            // Convert strings to Date if needed
            const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
            const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
            
            // Add time components to the dates
            const start = DateTimeHelper.startOfDay(startObj);
            const end = DateTimeHelper.endOfDay(endObj);
            
            const appointments = await this.prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: start,
                        lte: end
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
                }
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding appointments by date range', error instanceof Error ? error.message : String(error), { startDate, endDate });
            throw this.handleError(error);
        }
    }

    /**
     * Find appointments for a customer
     * 
     * @param customerId - Customer ID
     * @returns Promise with customer's appointments
     */
    async findByCustomer(customerId: number): Promise<Appointment[]> {
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
                }
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding appointments by customer', error instanceof Error ? error.message : String(error), { customerId });
            throw this.handleError(error);
        }
    }

    /**
     * Find appointments for a project
     * 
     * @param projectId - Project ID
     * @returns Promise with project's appointments
     */
    async findByProject(projectId: number): Promise<Appointment[]> {
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
                }
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding appointments by project', error instanceof Error ? error.message : String(error), { projectId });
            throw this.handleError(error);
        }
    }

    /**
     * Find upcoming appointments
     * 
     * @param limit - Number of appointments to return
     * @returns Promise with upcoming appointments
     */
    async findUpcoming(limit: number = 5): Promise<Appointment[]> {
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
                take: limit
            });
            
            return appointments.map(appointment => this.mapToDomainEntity(appointment));
        } catch (error) {
            this.logger.error('Error finding upcoming appointments', error instanceof Error ? error.message : String(error));
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
            this.logger.error('Error getting appointment with details', error instanceof Error ? error.message : String(error), { id });
            throw this.handleError(error);
        }
    }

    /**
     * Process filter criteria for entity-specific properties
     * 
     * @param criteria - Filter criteria
     * @returns Processed criteria object
     */
    protected processCriteria(criteria: FilterCriteria): any {
        const processed = { ...criteria };
        
        // Handle date criteria if present
        if (processed.appointmentDate && processed.appointmentDate instanceof Date) {
            const date = processed.appointmentDate;
            processed.appointmentDate = {
                gte: DateTimeHelper.startOfDay(date),
                lte: DateTimeHelper.endOfDay(date)
            };
        }
        
        // Handle date range if present
        if (processed.startDate || processed.endDate) {
            processed.appointmentDate = {};
            
            if (processed.startDate) {
                const startDate = processed.startDate instanceof Date 
                    ? processed.startDate 
                    : new Date(processed.startDate);
                    
                processed.appointmentDate.gte = DateTimeHelper.startOfDay(startDate);
                delete processed.startDate;
            }
            
            if (processed.endDate) {
                const endDate = processed.endDate instanceof Date 
                    ? processed.endDate 
                    : new Date(processed.endDate);
                    
                processed.appointmentDate.lte = DateTimeHelper.endOfDay(endDate);
                delete processed.endDate;
            }
        }
        
        return processed;
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
                    
                case 'bulkUpdate':
                    return await this.prisma.$transaction(async (tx: any) => {
                        let count = 0;
                        for (const id of args[0]) {
                            try {
                                await tx.appointment.update({
                                    where: { id },
                                    data: args[1]
                                });
                                count++;
                            } catch (err) {
                                this.logger.error(`Failed to update appointment ${id}`, err instanceof Error ? err.message : String(err));
                                // Continue with other updates
                            }
                        }
                        return count;
                    });
                    
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        } catch (error) {
            this.logger.error(`Error executing query: ${operation}`, error instanceof Error ? error.message : String(error));
            throw this.handleError(error);
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
                gte: DateTimeHelper.startOfDay(date),
                lte: DateTimeHelper.endOfDay(date)
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
                formattedDate: DateTimeHelper.formatDate(note.createdAt, 'dd.MM.yyyy HH:mm')
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
        if (domainEntity.updatedBy !== undefined) result.updatedBy = domainEntity.updatedBy;
        
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