import type { PrismaClient, Prisma } from '@prisma/client'
type ContactRequestData = Omit<CreateRequestDto, 'requestId'> & { status: string };
import { IRequestRepository } from '../interfaces/IRequestRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { ContactRequest } from '../entities/ContactRequest.js';
import { BaseRepository } from '../core/BaseRepository.js';
import { 
  CreateRequestDto, 
  UpdateRequestDto, 
  RequestFilterParams, 
  PaginatedRequestsResponse, 
  RequestResponseDto,
  RequestPaginationMeta
} from '../dtos/RequestDtos.js';
import { FilterCriteria, QueryOptions } from '../interfaces/IBaseRepository.js';

/**
 * Repository for handling ContactRequest data persistence
 */
export class RequestRepository 
  extends BaseRepository<ContactRequest, number> 
  implements IRequestRepository {
  
  /**
   * Creates a new RequestRepository instance
   */
  constructor(
    private readonly prismaClient: any,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prismaClient.contactRequest, logger, errorHandler);
    this.logger.debug('Initialized RequestRepository');
  }

  /**
   * Find a request by ID with its notes
   */
  async findByIdWithNotes(id: number): Promise<ContactRequest> {
    try {
      const contactRequest = await this.prismaClient.contactRequest.findUnique({
        where: { id },
        include: {
          notes: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!contactRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }

      return this.mapToDomainEntity(contactRequest);
    } catch (error) {
      this.logger.error(`Error finding contact request with notes: ${id}`, error instanceof Error ? error.message : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Find requests with pagination and filtering
   */
  async findWithFilters(filters: RequestFilterParams): Promise<PaginatedRequestsResponse> {
    try {
      const {
        status,
        service,
        date,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortDirection = 'desc'
      } = filters;

      // Build where condition
      const where: Record<string, any> = {};

      if (status) {
        where.status = status;
      }
      
      if (service) {
        where.service = service;
      }

      if (date) {
        const dateObj = new Date(date);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        
        where.createdAt = {
          gte: dateObj,
          lt: nextDay
        };
      } else if (filters.startDate && filters.endDate) {
        where.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate)
        };
      } else if (filters.startDate) {
        where.createdAt = {
          gte: new Date(filters.startDate)
        };
      } else if (filters.endDate) {
        where.createdAt = {
          lte: new Date(filters.endDate)
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Count total matching records
      const total = await this.prismaClient.contactRequest.count({ where });

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      // Get paginated data
      // Konvertieren von snake_case (API) zu camelCase (Prisma)
      const mappedSortBy = this.convertToCamelCase(sortBy);
      
      const requests = await this.prismaClient.contactRequest.findMany({
        where,
        orderBy: {
          [mappedSortBy]: sortDirection
        },
        skip,
        take: limit,
        include: {
          notes: {
            select: {
              id: true,
              userId: true,
              userName: true,
              text: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 3 // Only include most recent notes
          }
        }
      });

      // Map to response DTOs
      interface NoteDto {
        id: number;
        requestId: number;
        userId: number;
        userName: string;
        text: string;
        createdAt: Date;
      }
      
      interface RequestWithNotes {
        id: number;
        name: string;
        email: string;
        phone: string;
        service: string;
        message: string;
        status: string;
        processorId: number | null;
        createdAt: Date;
        updatedAt: Date;
        notes: NoteDto[];
      }

      const data: RequestResponseDto[] = requests.map((request: RequestWithNotes) => this.mapToResponseDto(request));

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          filters: {
            status,
            service,
            date,
            search
          }
        }
      };
    } catch (error) {
      this.logger.error('Error finding requests with filters', error instanceof Error ? error.message : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Add a note to a request
   */
  async addNote(
    requestId: number, 
    userId: number, 
    userName: string, 
    text: string
  ): Promise<any> {
    try {
      const note = await this.prismaClient.requestNote.create({
        data: {
          requestId,
          userId,
          userName,
          text,
          createdAt: new Date()
        }
      });

      return note;
    } catch (error) {
      this.logger.error(`Error adding note to request: ${requestId}`, error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Update request processor assignment
   */
  async updateProcessor(id: number, processorId: number): Promise<ContactRequest> {
    try {
      // Holen des aktuellen Request, um den Status zu prüfen
      const currentRequest = await this.prismaClient.contactRequest.findUnique({
        where: { id }
      });

      if (!currentRequest) {
        throw this.errorHandler.createNotFoundError(`Contact request with ID ${id} not found`);
      }

      // Status-Logik: Wenn der Status 'neu' ist, ändere ihn zu 'in_bearbeitung'
      const newStatus = currentRequest.status === 'neu' ? 'in_bearbeitung' : currentRequest.status;

      // Update mit konkreten Werten statt SQL-Ausdruck
      const request = await this.prismaClient.contactRequest.update({
        where: { id },
        data: {
          processorId,
          status: newStatus
        }
      });

      return this.mapToDomainEntity(request);
    } catch (error) {
      this.logger.error(`Error updating processor for request: ${id}`, error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Batch update request statuses
   */
  async batchUpdateStatus(ids: number[], status: string): Promise<{ count: number }> {
    try {
      if (!ids.length) {
        return { count: 0 };
      }

      const result = await this.prismaClient.contactRequest.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          status
        }
      });

      return { count: result.count };
    } catch (error) {
      this.logger.error('Error batch updating request statuses', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Create a log entry for a request action
   */
  async createLogEntry(
    requestId: number, 
    userId: number, 
    userName: string, 
    action: string, 
    details?: string
  ): Promise<any> {
    try {
      const logEntry = await this.prismaClient.requestLog.create({
        data: {
          requestId,
          userId,
          userName,
          action,
          details,
          createdAt: new Date()
        }
      });

      return logEntry;
    } catch (error) {
      this.logger.error(`Error creating log entry for request: ${requestId}`, error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Helper method to map database model to response DTO
   */
  private mapToResponseDto(request: any): RequestResponseDto {
    return {
      id: request.id,
      name: request.name,
      email: request.email,
      phone: request.phone,
      service: request.service,
      message: request.message,
      status: request.status,
      statusLabel: this.getStatusLabel(request.status),
      processorId: request.processorId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      notes: request.notes?.map((note: any) => ({
        id: note.id,
        requestId: note.requestId,
        userId: note.userId,
        userName: note.userName,
        text: note.text,
        createdAt: note.createdAt
      })) || []
    };
  }

  /**
   * Helper method to get status label
   */
  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'neu': 'Neu',
      'in_bearbeitung': 'In Bearbeitung',
      'beantwortet': 'Beantwortet',
      'geschlossen': 'Geschlossen'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Override create method to set default status
   */
  override async create(requestData: CreateRequestDto): Promise<ContactRequest> {
    try {
      // Validate email
      if (requestData.email && !this.isValidEmail(requestData.email)) {
        throw this.errorHandler.createValidationError('Invalid email format', ['Email format is not valid']);
      }

      // Validate phone if provided
      if (requestData.phone && !this.isValidPhone(requestData.phone)) {
        throw this.errorHandler.createValidationError('Invalid phone format', ['Phone format is not valid']);
      }

      // Set default status if not provided
      const dataWithStatus: ContactRequestData = {
        ...requestData,
        status: 'neu' // Set default status to 'neu' (new)
      };

      const createdRequest = await this.prismaClient.contactRequest.create({
        data: dataWithStatus
      });

      return this.mapToDomainEntity(createdRequest);
    } catch (error) {
      this.logger.error('Error creating contact request', error instanceof Error ? error.message : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Helper method to validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper method to validate phone format
   */
  private isValidPhone(phone: string): boolean {
    // Accept various phone formats like +43 123 456789, 0123-456789, etc.
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Map ORM entity to domain entity
   * Required implementation from BaseRepository
   */
  /**
   * Get the Prisma client for external use
   */
  getPrismaClient(): any {
    return this.prismaClient;
  }

  protected mapToDomainEntity(ormEntity: any): ContactRequest {
    if (!ormEntity) {
      throw this.errorHandler.createNotFoundError('Entity not found');
    }
    
    const contactRequest = new ContactRequest();
    contactRequest.id = ormEntity.id;
    contactRequest.name = ormEntity.name;
    contactRequest.email = ormEntity.email;
    contactRequest.phone = ormEntity.phone;
    contactRequest.service = ormEntity.service;
    contactRequest.message = ormEntity.message;
    contactRequest.status = ormEntity.status;
    contactRequest.processorId = ormEntity.processorId;
    contactRequest.ipAddress = ormEntity.ipAddress;
    contactRequest.createdAt = ormEntity.createdAt;
    contactRequest.updatedAt = ormEntity.updatedAt;
    
    return contactRequest;
  }

  /**
   * Map domain entity to ORM entity
   * Required implementation from BaseRepository
   */
  protected mapToORMEntity(domainEntity: Partial<ContactRequest>): any {
    // Simply return the entity as-is, since our domain entity 
    // structure matches the database schema
    return { ...domainEntity };
  }

  /**
   * Build query options for ORM
   * Required implementation from BaseRepository
   */
  protected buildQueryOptions(options?: QueryOptions): any {
    if (!options) return {};

    const queryOptions: any = {};

    // Handle pagination
    if (options.page && options.limit) {
      queryOptions.skip = (options.page - 1) * options.limit;
      queryOptions.take = options.limit;
    }

    // Handle select fields
    if (options.select && Array.isArray(options.select) && options.select.length > 0) {
      queryOptions.select = options.select.reduce<Record<string, boolean>>((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
    }

    // Handle sorting
    if (options.sort) {
      // Konvertieren von snake_case zu camelCase für Feldnamen
      const mappedField = this.convertToCamelCase(options.sort.field);
      
      queryOptions.orderBy = {
        [mappedField]: options.sort.direction === 'ASC' ? 'asc' : 'desc'
      };
    }

    // Handle relations (include)
    if (options.relations && Array.isArray(options.relations) && options.relations.length > 0) {
      queryOptions.include = options.relations.reduce<Record<string, boolean>>((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {});
    }

    return queryOptions;
  }

  /**
   * Process criteria for ORM
   * Required implementation from BaseRepository
   */
  protected processCriteria(criteria: FilterCriteria): any {
    if (!criteria || Object.keys(criteria).length === 0) {
      return {};
    }

    // For Prisma, we can mostly use the criteria directly
    // but we may need to handle special cases
    const where: any = {};

    Object.keys(criteria).forEach(key => {
      const value = criteria[key];

      // Handle different types of criteria
      if (value === null) {
        where[key] = { isNull: true };
      } else if (typeof value === 'string' && value.includes('%')) {
        // Handle SQL LIKE patterns
        where[key] = { contains: value.replace(/%/g, '') };
      } else if (Array.isArray(value)) {
        where[key] = { in: value };
      } else if (typeof value === 'object') {
        // Complex conditions like greater than, less than, etc.
        where[key] = this.processComplexCondition(value);
      } else {
        // Simple equality
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * Process complex conditions for criteria
   */
  private processComplexCondition(condition: any): any {
    const result: any = {};

    if ('gt' in condition) result.gt = condition.gt;
    if ('gte' in condition) result.gte = condition.gte;
    if ('lt' in condition) result.lt = condition.lt;
    if ('lte' in condition) result.lte = condition.lte;
    if ('contains' in condition) result.contains = condition.contains;
    if ('startsWith' in condition) result.startsWith = condition.startsWith;
    if ('endsWith' in condition) result.endsWith = condition.endsWith;
    if ('in' in condition) result.in = condition.in;
    if ('notIn' in condition) result.notIn = condition.notIn;

    return result;
  }

  /**
   * Execute a query
   * Required implementation from BaseRepository
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    switch (operation) {
      case 'findAll':
        return this.prismaClient.contactRequest.findMany(args[0] || {});
      
      case 'findById':
        return this.prismaClient.contactRequest.findUnique({
          where: { id: args[0] },
          ...(args[1] || {})
        });
      
      case 'findByCriteria':
        return this.prismaClient.contactRequest.findMany({
          where: args[0],
          ...(args[1] || {})
        });
      
      case 'findOneByCriteria':
        return this.prismaClient.contactRequest.findFirst({
          where: args[0],
          ...(args[1] || {})
        });
      
      case 'create':
        return this.prismaClient.contactRequest.create({
          data: args[0]
        });
      
      case 'update':
        return this.prismaClient.contactRequest.update({
          where: { id: args[0] },
          data: args[1]
        });
      
      case 'delete':
        return this.prismaClient.contactRequest.delete({
          where: { id: args[0] }
        });
      
      case 'count':
        return this.prismaClient.contactRequest.count({
          where: args[0]
        });
      
      case 'bulkUpdate':
        return this.prismaClient.contactRequest.updateMany({
          where: { id: { in: args[0] } },
          data: args[1]
        });
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Begin a transaction
   * Required implementation from BaseRepository
   */
  protected async beginTransaction(): Promise<void> {
    // Prisma doesn't require explicit transaction start
    // Transactions are started when $transaction is called
    return Promise.resolve();
  }

  /**
   * Commit a transaction
   * Required implementation from BaseRepository
   */
  protected async commitTransaction(): Promise<void> {
    // Prisma doesn't require explicit transaction commit
    // Transactions are automatically committed when $transaction completes
    return Promise.resolve();
  }

  /**
   * Rollback a transaction
   * Required implementation from BaseRepository
   */
  protected async rollbackTransaction(): Promise<void> {
    // Prisma doesn't require explicit transaction rollback
    // Transactions are automatically rolled back when an error occurs
    return Promise.resolve();
  }

  /**
   * Check if error is a unique constraint violation
   * Required implementation from BaseRepository
   */
  protected isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Error &&
           'code' in (error as any) &&
           (error as any).code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * Required implementation from BaseRepository
   */
  protected isForeignKeyConstraintError(error: unknown): boolean {
    return error instanceof Error &&
           'code' in (error as any) &&
           ((error as any).code === 'P2003' || (error as any).code === 'P2018');
  }
}