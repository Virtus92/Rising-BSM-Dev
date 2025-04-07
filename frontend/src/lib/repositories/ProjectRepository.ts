import { BaseRepository } from '../core/BaseRepository.js';
import { IProjectRepository } from '../../types/interfaces/IProjectRepository.js';
import { Project, ProjectStatus } from '../entities/Project.js';
import { ProjectFilterParams } from '../dtos/ProjectDtos.js';
import { QueryOptions } from '../../types/interfaces/IBaseRepository.js';
import { ILoggingService } from '../../types/interfaces/ILoggingService.js';
import { IErrorHandler } from '../../types/interfaces/IErrorHandler.js';
import { PrismaClient } from '@prisma/client';
import { DateTimeHelper } from '../utils/datetime-helper.js';

/**
 * Implementation of IProjectRepository for database operations.
 */
export class ProjectRepository extends BaseRepository<Project, number> implements IProjectRepository {
    /**
     * Bulk update multiple projects
     * 
     * @param ids - Array of project IDs
     * @param data - Update data
     * @returns Promise with count of updated projects
     */
    async bulkUpdate(ids: number[], data: Partial<Project>): Promise<number> {
        try {
            const result = await this.prisma.project.updateMany({
                where: {
                    id: { in: ids }
                },
                data: this.mapToORMEntity(data)
            });
            
            return result.count;
        } catch (error) {
            this.logger.error('Error in bulk update', error instanceof Error ? error : String(error), { ids, data });
            throw this.handleError(error);
        }
    }

    /**
     * Creates a new ProjectRepository instance
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
        super(prisma.project, logger, errorHandler);
        
        this.logger.debug('Initialized ProjectRepository');
    }
    
    /**
     * Find projects by customer
     * 
     * @param customerId - Customer ID
     * @returns Promise with projects
     */
    async findByCustomer(customerId: number): Promise<Project[]> {
        return this.findByCustomerId(customerId);
    }
    
    /**
     * Find projects by service
     * 
     * @param serviceId - Service ID
     * @returns Promise with projects
     */
    async findByService(serviceId: number): Promise<Project[]> {
        return this.findByServiceId(serviceId);
    }
    
    /**
     * Get project with detailed relations
     * 
     * @param id - Project ID
     * @returns Promise with project including all related data
     */
    async findByIdWithDetails(id: number): Promise<Project | null> {
        return this.getProjectWithDetails(id);
    }
    
    /**
     * Get all notes for a project
     * 
     * @param projectId - Project ID
     * @returns Promise with notes
     */
    async getNotes(projectId: number): Promise<any[]> {
        return this.getProjectNotes(projectId);
    }

    /**
     * Find projects with advanced filtering
     * 
     * @param filters - Filter parameters
     * @returns Promise with projects and pagination info
     */
    async findProjects(filters: ProjectFilterParams): Promise<{ data: Project[]; pagination: any }> {
        try {
            // Build WHERE conditions
            const where = this.buildProjectFilters(filters);
            
            // Extract pagination parameters
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const skip = (page - 1) * limit;
            
            // Build ORDER BY
            const orderBy: any = {};
            if (filters.sortBy) {
                orderBy[filters.sortBy] = filters.sortDirection || 'desc';
            } else {
                orderBy.startDate = 'desc';
            }
            
            // Execute count query
            const total = await this.prisma.project.count({ where });
            
            // Execute main query
            const projects = await this.prisma.project.findMany({
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
                    service: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            
            // Map to domain entities
            const data = projects.map(project => this.mapToDomainEntity(project));
            
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
            this.logger.error('Error in ProjectRepository.findProjects', error instanceof Error ? error : String(error), { filters });
            throw this.handleError(error);
        }
    }

    /**
     * Get project notes
     * 
     * @param projectId - Project ID
     * @returns Promise with project notes
     */
    async getProjectNotes(projectId: number): Promise<any[]> {
        try {
            const notes = await this.prisma.projectNote.findMany({
                where: { projectId },
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
                projectId: note.projectId,
                userId: note.userId,
                userName: note.userName,
                text: note.text,
                createdAt: note.createdAt,
                formattedDate: DateTimeHelper.formatDate(note.createdAt, 'dd.MM.yyyy HH:mm')
            }));
        } catch (error) {
            this.logger.error('Error fetching project notes', error instanceof Error ? error : String(error), { projectId });
            throw this.handleError(error);
        }
    }

    /**
     * Add a note to a project
     * 
     * @param projectId - Project ID
     * @param userId - User ID
     * @param userName - User name
     * @param text - Note text
     * @returns Promise with created note
     */
    async addNote(projectId: number, userId: number, userName: string, text: string): Promise<any> {
        const data = {
            projectId,
            userId,
            userName,
            text
        };
        try {
            const note = await this.prisma.projectNote.create({
                data: {
                    projectId: data.projectId,
                    userId: data.userId,
                    userName: data.userName,
                    text: data.text
                }
            });
            
            return {
                ...note,
                formattedDate: DateTimeHelper.formatDate(note.createdAt, 'dd.MM.yyyy HH:mm')
            };
        } catch (error) {
            this.logger.error('Error adding project note', error instanceof Error ? error : String(error), { data });
            throw this.handleError(error);
        }
    }

    /**
     * Log activity for a project
     * 
     * @param projectId - Project ID
     * @param userId - User ID
     * @param userName - User name
     * @param action - Activity type
     * @param details - Activity details
     * @returns Promise with created activity log
     */
    async logActivity(projectId: number, userId: number, userName: string, action: string, details?: string): Promise<any> {
        const data = {
            projectId,
            userId,
            userName,
            action,
            details
        };
        try {
            return await this.prisma.projectLog.create({
                data: {
                    projectId: data.projectId,
                    userId: data.userId,
                    userName: data.userName,
                    action: data.action,
                    details: data.details,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            this.logger.error('Error logging project activity', error instanceof Error ? error : String(error), { data });
            // Don't throw error for logging failures, just return null
            return null;
        }
    }

    /**
     * Find active projects
     * 
     * @param limit - Number of projects to return
     * @param options - Query options
     * @returns Promise with active projects
     */
    async findActive(limit: number = 10, options?: QueryOptions): Promise<Project[]> {
        try {
            const projects = await this.prisma.project.findMany({
                where: {
                    status: ProjectStatus.IN_PROGRESS
                },
                include: {
                    customer: {
                        select: {
                            name: true
                        }
                    },
                    service: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take: limit,
                ...this.buildQueryOptions(options)
            });
            
            return projects.map(project => this.mapToDomainEntity(project));
        } catch (error) {
            this.logger.error('Error finding active projects', error instanceof Error ? error : String(error));
            throw this.handleError(error);
        }
    }

    /**
     * Find projects by customer ID
     * 
     * @param customerId - Customer ID
     * @param options - Query options
     * @returns Promise with customer's projects
     */
    async findByCustomerId(customerId: number, options?: QueryOptions): Promise<Project[]> {
        try {
            const projects = await this.prisma.project.findMany({
                where: {
                    customerId
                },
                include: {
                    service: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    startDate: 'desc'
                },
                ...this.buildQueryOptions(options)
            });
            
            return projects.map(project => this.mapToDomainEntity(project));
        } catch (error) {
            this.logger.error('Error finding projects by customer ID', error instanceof Error ? error : String(error), { customerId });
            throw this.handleError(error);
        }
    }

    /**
     * Find projects by service ID
     * 
     * @param serviceId - Service ID
     * @param options - Query options
     * @returns Promise with service's projects
     */
    async findByServiceId(serviceId: number, options?: QueryOptions): Promise<Project[]> {
        try {
            const projects = await this.prisma.project.findMany({
                where: {
                    serviceId
                },
                include: {
                    customer: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    startDate: 'desc'
                },
                ...this.buildQueryOptions(options)
            });
            
            return projects.map(project => this.mapToDomainEntity(project));
        } catch (error) {
            this.logger.error('Error finding projects by service ID', error instanceof Error ? error : String(error), { serviceId });
            throw this.handleError(error);
        }
    }

    /**
     * Get project with details
     * 
     * @param id - Project ID
     * @returns Promise with project including relations
     */
    async getProjectWithDetails(id: number): Promise<Project | null> {
        try {
            const project = await this.prisma.project.findUnique({
                where: { id },
                include: {
                    customer: true,
                    service: true,
                    appointments: {
                        where: {
                            status: {
                                not: 'canceled'
                            }
                        },
                        orderBy: {
                            appointmentDate: 'asc'
                        }
                    },
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
            
            if (!project) {
                return null;
            }
            
            return this.mapToDomainEntity(project);
        } catch (error) {
            this.logger.error('Error getting project with details', error instanceof Error ? error : String(error), { id });
            throw this.handleError(error);
        }
    }

    /**
     * Get project statistics
     * 
     * @param filters - Optional filter parameters
     * @returns Promise with project statistics
     */
    async getProjectStatistics(filters?: ProjectFilterParams): Promise<any> {
        try {
            // Build WHERE conditions for filters
            const where = filters ? this.buildProjectFilters(filters) : {};
            
            // Get status counts
            const statusCounts = await this.prisma.$transaction([
                this.prisma.project.count({ where: { ...where, status: ProjectStatus.NEW } }),
                this.prisma.project.count({ where: { ...where, status: ProjectStatus.IN_PROGRESS } }),
                this.prisma.project.count({ where: { ...where, status: ProjectStatus.COMPLETED } }),
                this.prisma.project.count({ where: { ...where, status: ProjectStatus.CANCELED } })
            ]);
            
            // Calculate total value
            const totalValueResult = await this.prisma.project.aggregate({
                where,
                _sum: {
                    amount: true
                }
            });
            
            const totalValue = totalValueResult._sum.amount || 0;
            
            // Get projects by month
            const now = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            
            const projectsByMonth = await this.prisma.$queryRaw`
                SELECT 
                    TO_CHAR("startDate", 'YYYY-MM') as month,
                    COUNT(*) as count,
                    SUM(amount) as value
                FROM 
                    "Project"
                WHERE 
                    "startDate" >= ${sixMonthsAgo}
                GROUP BY 
                    TO_CHAR("startDate", 'YYYY-MM')
                ORDER BY 
                    month ASC
            `;
            
            // Get top customers
            const topCustomers = await this.prisma.$queryRaw`
                SELECT 
                    c.id, 
                    c.name, 
                    COUNT(p.id) as "projectCount", 
                    SUM(p.amount) as "totalValue"
                FROM 
                    "Project" p
                JOIN 
                    "Customer" c ON p."customerId" = c.id
                WHERE 
                    p."customerId" IS NOT NULL
                GROUP BY 
                    c.id, c.name
                ORDER BY 
                    "totalValue" DESC
                LIMIT 5
            `;
            
            return {
                statusCounts: {
                    [ProjectStatus.NEW]: statusCounts[0],
                    [ProjectStatus.IN_PROGRESS]: statusCounts[1],
                    [ProjectStatus.COMPLETED]: statusCounts[2],
                    [ProjectStatus.CANCELED]: statusCounts[3]
                },
                totalValue,
                byMonth: projectsByMonth,
                topCustomers
            };
        } catch (error) {
            this.logger.error('Error getting project statistics', error instanceof Error ? error : String(error));
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
            const model = this.prisma.project;
            
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
                    return await this.bulkUpdate(args[0], args[1]);
                    
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        } catch (error) {
            this.logger.error(`Error executing query: ${operation}`, error instanceof Error ? error : String(error));
            throw error;
        }
    }

    /**
     * Build project-specific filters
     * 
     * @param filters - Project filter parameters
     * @returns ORM-specific where conditions
     */
    protected buildProjectFilters(filters: ProjectFilterParams): any {
        const where: any = {};
        
        // Add status filter
        if (filters.status) {
            where.status = filters.status;
        }
        
        // Add customer filter
        if (filters.customerId) {
            where.customerId = filters.customerId;
        }
        
        // Add service filter
        if (filters.serviceId) {
            where.serviceId = filters.serviceId;
        }
        
        // Add date range filters
        if (filters.startDateFrom || filters.startDateTo) {
            where.startDate = {};
            
            if (filters.startDateFrom) {
                where.startDate.gte = new Date(filters.startDateFrom);
            }
            
            if (filters.startDateTo) {
                where.startDate.lte = new Date(filters.startDateTo);
            }
        }
        
        // Add search filter
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
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
    protected mapToDomainEntity(ormEntity: any): Project {
        if (!ormEntity) {
            return null as any;
        }
        
        const project = new Project({
            id: ormEntity.id,
            title: ormEntity.title,
            customerId: ormEntity.customerId,
            serviceId: ormEntity.serviceId,
            startDate: ormEntity.startDate,
            endDate: ormEntity.endDate,
            amount: ormEntity.amount ? Number(ormEntity.amount) : undefined,
            description: ormEntity.description,
            status: ormEntity.status,
            createdBy: ormEntity.createdBy,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt
        });
        
        // Add customer and service data if available
        if (ormEntity.customer) {
            (project as any).customerName = ormEntity.customer.name;
            (project as any).customer = {
                id: ormEntity.customer.id,
                name: ormEntity.customer.name,
                email: ormEntity.customer.email
            };
        }
        
        if (ormEntity.service) {
            (project as any).serviceName = ormEntity.service.name;
            (project as any).service = {
                id: ormEntity.service.id,
                name: ormEntity.service.name,
                basePrice: ormEntity.service.basePrice ? Number(ormEntity.service.basePrice) : 0,
                unit: ormEntity.service.unit
            };
        }
        
        // Add notes if available
        if (ormEntity.notes) {
            project.notes = ormEntity.notes.map((note: any) => ({
                id: note.id,
                projectId: note.projectId,
                userId: note.userId,
                userName: note.userName || (note.user ? note.user.name : 'System'),
                text: note.text,
                createdAt: note.createdAt,
                formattedDate: datetime.formatDateTime(note.createdAt)
            }));
        }
        
        // Add appointments if available
        if (ormEntity.appointments) {
            project.appointments = ormEntity.appointments.map((appointment: any) => ({
                id: appointment.id,
                title: appointment.title,
                date: DateTimeHelper.formatDate(appointment.appointmentDate),
                status: appointment.status,
                statusLabel: appointment.status
            }));
        }
        
        return project;
    }

    /**
     * Map domain entity to ORM entity
     * 
     * @param domainEntity - Domain entity
     * @returns ORM entity
     */
    protected mapToORMEntity(domainEntity: Partial<Project>): any {
        // Remove undefined properties and domain-specific fields
        const result: Record<string, any> = {};
        
        // Map only the fields that exist in the database
        if (domainEntity.title !== undefined) result.title = domainEntity.title;
        if (domainEntity.customerId !== undefined) result.customerId = domainEntity.customerId;
        if (domainEntity.serviceId !== undefined) result.serviceId = domainEntity.serviceId;
        if (domainEntity.startDate !== undefined) result.startDate = domainEntity.startDate;
        if (domainEntity.endDate !== undefined) result.endDate = domainEntity.endDate;
        if (domainEntity.amount !== undefined) result.amount = domainEntity.amount;
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
