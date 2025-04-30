import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { Appointment } from '@/domain/entities/Appointment';
import { AppointmentNote } from '@/domain/entities/AppointmentNote';
import { AppointmentFilterParamsDto } from '@/domain/dtos/AppointmentDtos';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { AppointmentStatus, LogActionType } from '@/domain/enums/CommonEnums';

/**
 * Implementation of AppointmentRepository
 * 
 * Manages appointment persistence with Prisma ORM
 */
export class AppointmentRepository extends PrismaRepository<Appointment, number> implements IAppointmentRepository {
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
    // 'appointment' is the name of the model in Prisma
    super(prisma, 'appointment', logger, errorHandler);
    
    this.logger.debug('Initialized AppointmentRepository');
  }

  /**
   * Override findAll to properly handle customer relations and sorting
   * 
   * @param options Repository options
   * @returns Paginated appointments
   */
  override async findAll<U = Appointment>(options?: any): Promise<PaginationResult<U>> {
    try {
      // Process the criteria for the WHERE clause
      const where = this.processCriteria(options?.criteria || {});
      
      // Default pagination settings
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;
      
      // Setup include for relations
      const include: any = {};
      if (options?.relations && Array.isArray(options.relations)) {
        // Process each requested relation
        for (const relation of options.relations) {
          if (relation === 'customer') {
            include.customer = {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            };
          } else if (relation === 'notes') {
            include.notes = true;
          }
          // Add other relations as needed
        }
      }
      
      // Process sorting options
      let orderBy: any = {};
      
      if (options?.sort?.field) {
        // Handle special case for customer name sorting
        if (options.sort.field === 'customer.name' || options.sort.field === 'customerName') {
          // Make sure customer is included for sorting
          if (!include.customer) {
            include.customer = {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            };
          }
          orderBy = { customer: { name: options.sort.direction || 'asc' } };
        } else {
          // Normal field sorting
          orderBy[options.sort.field] = options.sort.direction || 'asc';
        }
      } else {
        // Default sorting by date
        orderBy = { appointmentDate: 'asc' };
      }
      
      this.logger.debug(`Repository findAll query setup:`, {
        where, 
        orderBy, 
        include, 
        skip, 
        take: limit
      });
      
      // Execute queries
      const [total, entities] = await Promise.all([
        // Count query
        (this.prisma as any)[this.modelName].count({ where }),
        // Data query
        (this.prisma as any)[this.modelName].findMany({
          where,
          orderBy,
          include: Object.keys(include).length > 0 ? include : undefined,
          skip,
          take: limit,
        })
      ]);
      
      // Map to domain entities
      const data = await Promise.all(entities.map(async (entity: any) => {
        const domainEntity = this.mapToDomainEntity(entity);
        
        // Add customer data if loaded
        if (entity.customer) {
          (domainEntity as any).customerName = entity.customer.name;
          (domainEntity as any).customer = {
            id: entity.customer.id,
            name: entity.customer.name,
            email: entity.customer.email,
            phone: entity.customer.phone
          };
        }
        
        return domainEntity;
      }));
      
      // Calculate pagination
      const totalPages = Math.ceil(total / limit);
      const result: PaginationResult<Appointment> = {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        }
      };
      
      return result as PaginationResult<U>;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findAll:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Load customer data for an appointment directly from the database
   * 
   * @param customerId - Customer ID
   * @returns Customer data or null if not found
   */
  private async loadCustomerData(customerId?: number | null) {
    if (!customerId) return null;
    
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      });
      
      if (customer) {
        return {
          id: customer.id,
          name: customer.name || `Customer ${customer.id}`,
          email: customer.email,
          phone: customer.phone
        };
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Failed to load customer data for ID ${customerId}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  /**
   * Process filter criteria for queries - critical for sorting by customer name
   * 
   * @param criteria - Query criteria
   * @returns Processed criteria for Prisma
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    if (criteria.status !== undefined) {
      processedCriteria.status = criteria.status;
    }
    
    if (criteria.customerId !== undefined) {
      processedCriteria.customerId = criteria.customerId;
    }
    
    if (criteria.createdById !== undefined) {
      processedCriteria.createdBy = criteria.createdById;
    }
    
    // Date-based filtering
    if (criteria.appointmentDateRange) {
      processedCriteria.appointmentDate = {
        gte: new Date(criteria.appointmentDateRange.start),
        lte: new Date(criteria.appointmentDateRange.end)
      };
    } else {
      if (criteria.appointmentDateAfter) {
        processedCriteria.appointmentDate = {
          ...(processedCriteria.appointmentDate || {}),
          gte: new Date(criteria.appointmentDateAfter)
        };
      }
      
      if (criteria.appointmentDateBefore) {
        processedCriteria.appointmentDate = {
          ...(processedCriteria.appointmentDate || {}),
          lte: new Date(criteria.appointmentDateBefore)
        };
      }
    }
    
    // Handle search in title, location, or description
    if (criteria.search) {
      processedCriteria.OR = [
        { title: { contains: criteria.search, mode: 'insensitive' } },
        { location: { contains: criteria.search, mode: 'insensitive' } },
        { description: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    
    this.logger.debug('Processing appointment criteria:', { input: criteria, output: processedCriteria });
    
    return processedCriteria;
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
        where: { customerId },
        orderBy: { appointmentDate: 'desc' }
      });
      
      return Promise.all(
        appointments.map(async (appointment) => {
          const appointmentEntity = this.mapToDomainEntity(appointment);
          
          // Load customer data if available
          if (appointment.customerId) {
            const customerData = await this.loadCustomerData(appointment.customerId);
            if (customerData) {
              (appointmentEntity as any).customerName = customerData.name;
              (appointmentEntity as any).customer = customerData;
            }
          }
          
          return appointmentEntity;
        })
      );
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByCustomer', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        customerId 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments for a date range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise with appointments in the date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { appointmentDate: 'asc' }
      });
      
      return Promise.all(
        appointments.map(async (appointment) => {
          const appointmentEntity = this.mapToDomainEntity(appointment);
          
          // Load customer data if available
          if (appointment.customerId) {
            const customerData = await this.loadCustomerData(appointment.customerId);
            if (customerData) {
              (appointmentEntity as any).customerName = customerData.name;
              (appointmentEntity as any).customer = customerData;
            }
          }
          
          return appointmentEntity;
        })
      );
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByDateRange', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        startDate, 
        endDate 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments for a specific date
   * 
   * @param date - Date to find appointments for
   * @returns Promise with appointments on the specified date
   */
  async findByDate(date: Date): Promise<Appointment[]> {
    try {
      // Create start date (beginning of day)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      // Create end date (end of day)
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      return this.findByDateRange(startDate, endDate);
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByDate', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        date 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find upcoming appointments
   * 
   * @param limit - Maximum number of results
   * @returns Promise with upcoming appointments
   */
  async findUpcoming(limit: number = 10): Promise<Appointment[]> {
    try {
      const now = new Date();
      
      const appointments = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: now
          },
          status: {
            notIn: [AppointmentStatus.CANCELLED]
          }
        },
        orderBy: { appointmentDate: 'asc' },
        take: limit
      });
      
      return Promise.all(
        appointments.map(async (appointment) => {
          const appointmentEntity = this.mapToDomainEntity(appointment);
          
          // Load customer data if available
          if (appointment.customerId) {
            const customerData = await this.loadCustomerData(appointment.customerId);
            if (customerData) {
              (appointmentEntity as any).customerName = customerData.name;
              (appointmentEntity as any).customer = customerData;
            } else {
              throw new Error(`Customer data not found for ID ${appointment.customerId}`);
            }
          }
          
          return appointmentEntity;
        })
      );
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findUpcoming', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        limit 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find appointments with advanced filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with filtered appointments and pagination
   */
  async findAppointments(filters: AppointmentFilterParamsDto): Promise<PaginationResult<Appointment>> {
    try {
      // Build WHERE conditions
      const where: any = {};
      
      // Add search criteria
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { location: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Add additional filters
      if (filters.status) where.status = filters.status;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.createdById) where.createdBy = filters.createdById;
      
      // Time-based filters
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (filters.today) {
        where.appointmentDate = {
          gte: today,
          lt: tomorrow
        };
      } else if (filters.upcoming) {
        where.appointmentDate = {
          gte: now
        };
      } else if (filters.past) {
        where.appointmentDate = {
          lt: now
        };
      }
      
      // Date range filters
      if ((filters.startDate || filters.endDate) && !filters.today && !filters.upcoming && !filters.past) {
        where.appointmentDate = {};
        
        if (filters.startDate) {
          where.appointmentDate.gte = new Date(filters.startDate);
        }
        
        if (filters.endDate) {
          where.appointmentDate.lte = new Date(filters.endDate);
        }
      }
      
      // Calculate pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Include the customer relation for better sorting
      const include: any = {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      };
      
      // Determine sorting
      const orderBy: any = {};
      if (filters.sortBy) {
        if (filters.sortBy === 'customerName' || filters.sortBy === 'customer.name') {
          // Handle sorting by customer name properly by using relation
          orderBy.customer = { name: filters.sortDirection || 'asc' };
        } else {
          orderBy[filters.sortBy] = filters.sortDirection || 'asc';
        }
      } else {
        orderBy.appointmentDate = 'asc';
      }
      
      this.logger.debug(`Sorting appointments by ${Object.keys(orderBy)[0]} ${Object.values(orderBy)[0]}`);
      
      // Execute queries
      const [total, appointments] = await Promise.all([
        // Count query for total
        this.prisma.appointment.count({ where }),
        // Data query with pagination
        this.prisma.appointment.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include  // Include customer relation
        })
      ]);
      
      // Load data for each appointment
      const data = await Promise.all(
        appointments.map(async (appointment) => {
          const appointmentEntity = this.mapToDomainEntity(appointment);
          
          // Load customer data if available
          if (appointment.customerId) {
            const customerData = await this.loadCustomerData(appointment.customerId);
            if (customerData) {
              (appointmentEntity as any).customerName = customerData.name;
              (appointmentEntity as any).customer = customerData;
            } else {
              throw new Error(`Customer data not found for ID ${appointment.customerId}`);
            }
          }
          
          return appointmentEntity;
        })
      );
      
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
      this.logger.error('Error in AppointmentRepository.findAppointments', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update the status of an appointment
   * 
   * @param id - Appointment ID
   * @param status - New status
   * @param updatedBy - ID of the user making the change
   * @returns Promise with updated appointment
   */
  async updateStatus(id: number | string, status: string, updatedBy?: number): Promise<Appointment> {
    try {
      // Validate the status
      if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
        throw this.errorHandler.createValidationError(`Invalid status: ${status}`);
      }
      
      // We need to ensure the ID is numeric for Prisma
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Check if parsing resulted in a valid number
      if (isNaN(numericId)) {
        throw this.errorHandler.createValidationError(`Invalid appointment ID: ${id}`);
      }
      
      // Force the ID to be a number for Prisma
      const prismaId: number = numericId;
      
      // Update the appointment status
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id: prismaId },
        data: {
          status: status as AppointmentStatus,
          updatedAt: new Date(),
          // updatedBy field is omitted as it doesn't exist in the schema
        }
      });
      
      // Log the activity
      await this.logActivity(
        updatedBy || 0,
        LogActionType.CHANGE_STATUS,
        `Appointment status changed to ${status}`,
        undefined
      );
      
      // Map to domain entity
      const appointmentEntity = this.mapToDomainEntity(updatedAppointment);
      
      // Load customer data if available
      if (updatedAppointment.customerId) {
        const customerData = await this.loadCustomerData(updatedAppointment.customerId);
        if (customerData) {
          (appointmentEntity as any).customerName = customerData.name;
          (appointmentEntity as any).customer = customerData;
        }
      }
      
      return appointmentEntity;
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.updateStatus', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id, 
        status 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find an appointment with all relationships
   * 
   * @param id - Appointment ID
   * @returns Promise with appointment and all relationships
   */
  async findByIdWithRelations(id: number | string): Promise<Appointment | null> {
    try {
      if (id === undefined || id === null || id === '') {
        throw new Error('Invalid appointment ID');
      }

      // We need to ensure the ID is numeric for Prisma
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Check if parsing resulted in a valid number
      if (isNaN(numericId)) {
        this.logger.error(`Invalid appointment ID format: ${id}`);
        return null;
      }
      
      // Force the ID to be a number for Prisma
      const prismaId: number = numericId;

      this.logger.debug(`Finding appointment with ID ${numericId}`);
      
      // Get the appointment
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: prismaId }
      });
      
      if (!appointment) {
        this.logger.info(`Appointment with ID ${id} not found`);
        return null;
      }
      
      // Map to domain entity
      const appointmentEntity = this.mapToDomainEntity(appointment);
      
      // Add customer data if a customer ID is present
      if (appointment.customerId) {
        const customerData = await this.loadCustomerData(appointment.customerId);
        if (customerData) {
          (appointmentEntity as any).customer = customerData;
          // Ensure customerName is also set for consistency
          (appointmentEntity as any).customerName = customerData.name;
        } else {
          throw new Error(`Customer data not found for ID ${appointment.customerId}`);
        }
      }
      
      // Separately load notes
      const notes = await this.findNotes(prismaId);
      (appointmentEntity as any).notes = notes;
      
      return appointmentEntity;
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByIdWithRelations', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Add a note to an appointment
   * 
   * @param appointmentId - Appointment ID
   * @param userId - User ID
   * @param text - Note text
   * @returns Promise with created note
   */
  async addNote(appointmentId: number, userId: number, text: string): Promise<AppointmentNote> {
    try {
      // First check if the user exists - this is critical for foreign key constraints
      let effectiveUserId = userId;
      let userName = 'Unknown User';

      // Try to find the provided user first
      let user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true }
      });

      // If user doesn't exist, find the first admin or any active user
      if (!user) {
        throw this.errorHandler.createValidationError(`User with ID ${userId} not found`);
      }
      
      // Use the found user data
      effectiveUserId = user.id;
      userName = user.name || 'System User';

      // Create the note with the valid user ID
      const note = await this.prisma.appointmentNote.create({
        data: {
          appointmentId,
          userId: effectiveUserId,
          userName: userName,
          text,
          createdAt: new Date()
          // updatedAt is omitted as it doesn't exist in the schema
        }
      });
      
      // Log the activity
      await this.logActivity(
        userId,
        LogActionType.CREATE,
        `Note added to appointment: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        undefined
      );
      
      // Map to domain entity
      return new AppointmentNote({
        id: note.id,
        appointmentId: note.appointmentId,
        userId: note.userId,
        userName: note.userName || user?.name || 'Unknown User',
        text: note.text,
        createdAt: note.createdAt,
        updatedAt: note.createdAt // Use createdAt for updatedAt since it doesn't exist in schema
      });
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.addNote', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        appointmentId, 
        userId 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Find notes for an appointment
   * 
   * @param appointmentId - Appointment ID
   * @returns Promise with appointment notes
   */
  async findNotes(appointmentId: number): Promise<AppointmentNote[]> {
    try {
      const notes = await this.prisma.appointmentNote.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });
      
      // Map to domain entities
      return notes.map((note: any) => {
        const userName = note.user?.name || note.userName || 'Unknown User';
        
        return new AppointmentNote({
          id: note.id,
          appointmentId: note.appointmentId,
          userId: note.userId,
          userName: userName,
          text: note.text,
          createdAt: note.createdAt,
          updatedAt: note.createdAt // Use createdAt for updatedAt since it doesn't exist in schema
        });
      });
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findNotes', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        appointmentId 
      });
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
      // Create activity log
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details: details ? JSON.stringify({ details, ipAddress }) : ipAddress ? JSON.stringify({ ipAddress }) : null,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.logActivityImplementation', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId, 
        actionType 
      });
      return null;
    }
  }

  /**
   * Map an ORM entity to a domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected mapToDomainEntity(ormEntity: any): Appointment {
    if (!ormEntity) {
      return null as any;
    }
    
    // Enhanced error handling for malformed date
    let appointmentDate: Date;
    try {
      // Handle different date formats
      if (ormEntity.appointmentDate instanceof Date) {
        appointmentDate = ormEntity.appointmentDate;
      } else if (typeof ormEntity.appointmentDate === 'string') {
        appointmentDate = new Date(ormEntity.appointmentDate);
        throw new Error('Invalid date format');
      } else {
        throw new Error('Invalid date type');
      }
    } catch (error) {
      this.logger.error(`Error parsing appointment date: ${ormEntity.appointmentDate}`, {
        error: error instanceof Error ? error.message : String(error),
        appointmentId: ormEntity.id
      });
      appointmentDate = new Date(); // Default to current date
    }
    
    const appointment = new Appointment({
      id: ormEntity.id,
      title: ormEntity.title || 'Untitled Appointment',
      customerId: ormEntity.customerId,
      appointmentDate: appointmentDate,
      duration: ormEntity.duration || 60, // Default to 60 minutes if not specified
      location: ormEntity.location,
      description: ormEntity.description,
      status: ormEntity.status || AppointmentStatus.PLANNED, // Default to PLANNED if not specified
      createdAt: ormEntity.createdAt ? new Date(ormEntity.createdAt) : new Date(),
      updatedAt: ormEntity.updatedAt ? new Date(ormEntity.updatedAt) : new Date(),
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
    
    // Add customer information if available
    if (ormEntity.customer) {
      (appointment as any).customerName = ormEntity.customer.name || `Customer ${ormEntity.customerId}`;
      (appointment as any).customer = {
        id: ormEntity.customer.id,
        name: ormEntity.customer.name || `Customer ${ormEntity.customerId}`,
        email: ormEntity.customer.email,
        phone: ormEntity.customer.phone
      };
    }
    
    return appointment;
  }

  /**
   * Map a domain entity to an ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected mapToORMEntity(domainEntity: Partial<Appointment>): any {
    // Remove undefined properties
    const result: Record<string, any> = {};
    
    // Map properties based on the schema
    if (domainEntity.title !== undefined) result.title = domainEntity.title;
    if (domainEntity.customerId !== undefined) result.customerId = domainEntity.customerId;
    if (domainEntity.appointmentDate !== undefined) result.appointmentDate = domainEntity.appointmentDate;
    if (domainEntity.duration !== undefined) result.duration = domainEntity.duration;
    if (domainEntity.location !== undefined) result.location = domainEntity.location;
    if (domainEntity.description !== undefined) result.description = domainEntity.description;
    if (domainEntity.status !== undefined) result.status = domainEntity.status;
    if (domainEntity.createdBy !== undefined) result.createdBy = domainEntity.createdBy;
    // updatedBy is omitted as it doesn't exist in the database schema
    
    // Set timestamps
    if (!result.createdAt && !domainEntity.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }

  /**
   * Find appointments by criteria
   * 
   * @param criteria - Search criteria
   * @returns Array of appointments matching criteria
   */
  async find(criteria: Record<string, any>): Promise<Appointment[]> {
    try {
      // Process the criteria for the WHERE clause
      const where = this.processCriteria(criteria);
      
      // Execute query
      const appointments = await this.prisma.appointment.findMany({
        where,
        orderBy: { appointmentDate: 'asc' }
      });
      
      // Map to domain entities
      return Promise.all(
        appointments.map(async (appointment) => {
          const appointmentEntity = this.mapToDomainEntity(appointment);
          
          // Load customer data if available
          if (appointment.customerId) {
            const customerData = await this.loadCustomerData(appointment.customerId);
            if (customerData) {
              (appointmentEntity as any).customerName = customerData.name;
              (appointmentEntity as any).customer = customerData;
            }
          }
          
          return appointmentEntity;
        })
      );
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.find', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        criteria 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Check if an appointment exists
   * 
   * @param id - Appointment ID
   * @returns Whether the appointment exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const count = await this.prisma.appointment.count({
        where: { id }
      });
      
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if appointment with ID ${id} exists:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw this.handleError(error);
    }
  }
}