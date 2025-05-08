import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientRustPanicError, PrismaClientInitializationError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { BaseRepository } from './BaseRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';
import { QueryOptions as BaseQueryOptions, PaginationResult } from '@/domain/repositories/IBaseRepository';
import { configService } from '@/core/config/ConfigService';

// Extend QueryOptions to include criteria
export interface QueryOptions extends BaseQueryOptions {
  criteria?: any;
}

/**
 * Prisma Base Repository
 * 
 * Extends the BaseRepository to provide Prisma-specific implementations
 * for abstract methods.
 * 
 * @template T - Entity type
 * @template ID - Primary key type
 */
export abstract class PrismaRepository<T, ID = number> extends BaseRepository<T, ID> {
  /**
   * Prisma transaction
   */
  protected prismaTransaction: Prisma.TransactionClient | null = null;

  /**
   * Constructor
   * 
   * @param prisma - Prisma client
   * @param modelName - Model name for this repository
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: string,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma[modelName as keyof PrismaClient], logger, errorHandler);
    this.logger.debug(`Initialized PrismaRepository for model: ${modelName}`);
  }

  /**
   * Find all items with pagination
   * 
   * @param options - Query options 
   * @returns Paginated results
   */
  async findAll<U = T>(options?: QueryOptions): Promise<PaginationResult<U>> {
    try {
      const queryOptions = this.buildQueryOptions(options);
      
      // Process criteria if provided
      let where = {};
      if (options?.criteria) {
        where = this.processCriteria ? this.processCriteria(options.criteria) : options.criteria;
      }
      
      // Build query parameters
      const params: any = {
        where,
        ...queryOptions
      };
      
      // Special handling for customer sorting if needed
      if (options?.sort?.field === 'customerName' || options?.sort?.field === 'customer.name') {
        params.orderBy = {
          customer: { name: options.sort.direction.toLowerCase() }
        };
        
        // Make sure customer relation is included
        if (!params.include) params.include = {};
        params.include.customer = true;
      }
      
      // Execute paginated query
      const [total, items] = await Promise.all([
        this.executeQuery('count', where),
        this.executeQuery('findByCriteria', where, params)
      ]);
      
      // Calculate pagination metadata
      const limit = options?.limit || 10;
      const page = options?.page || 1;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: items as U[],
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error(`Error in ${this.getDisplayName()}.findAll:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw this.handleError(error);
    }
  }

  /**
   * Begin a database transaction
   */
  protected async beginTransaction(): Promise<void> {
    if (this.prismaTransaction) {
      this.logger.warn('Transaction already in progress');
      return;
    }
    
    try {
      // We can't actually start the transaction here, as Prisma requires
      // that we pass the operation to $transaction. So we just log it.
      this.logger.debug('Transaction will be started during operation execution');
    } catch (error) {
      this.logger.error('Error beginning transaction', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Commit a database transaction
   */
  protected async commitTransaction(): Promise<void> {
    // In Prisma, transactions are automatically committed when the callback completes
    this.prismaTransaction = null;
    this.logger.debug('Transaction committed');
  }

  /**
   * Rollback a database transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // In Prisma, transactions are automatically rolled back when an error occurs
    this.prismaTransaction = null;
    this.logger.debug('Transaction rolled back');
  }

  /**
   * Normalize an ID for Prisma queries
   * Converts string IDs to numeric IDs if needed
   * 
   * @param id - The ID to normalize
   * @returns The normalized ID
   */
  protected normalizeId(id: any): any {
    try {
      // Simply return the ID as-is without any conversion or validation
      // Let the database layer handle the validation
      // This maximizes compatibility with different ID formats
      return id;
    } catch (error) {
      this.logger.warn('Error in normalizeId:', { id, error: String(error) });
      return id;
    }
  }

  /**
   * Execute a database query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Promise with query result
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    // Log start time if in debug mode
    const isDebug = configService.getLoggingConfig().level === 'debug';
    const startTime = isDebug ? Date.now() : 0;
    
    try {
      // Get the appropriate model
      const model = this.prismaTransaction || this.prisma[this.modelName as keyof PrismaClient];
      
      if (!model) {
        throw new Error(`Model ${this.modelName} not found on Prisma client`);
      }
      
      // Execute the query
      let result;
      
      switch (operation) {
        case 'findAll':
          result = await (model as any).findMany(args[0]);
          break;
          
        case 'findById':
          // Don't do any ID normalization or validation at all - just try to find the record
          try {
            // First try a direct lookup by id
            result = await (model as any).findUnique({
              where: { id: args[0] },
              ...(args[1] || {})
            });
            
            // If that fails, try converting string to number and vice versa
            if (!result && typeof args[0] === 'string' && /^\d+$/.test(args[0])) {
              // Try as number if it's a numeric string
              result = await (model as any).findUnique({
                where: { id: parseInt(args[0]) },
                ...(args[1] || {})
              });
            } else if (!result && typeof args[0] === 'number') {
              // Try as string if it's a number
              result = await (model as any).findUnique({
                where: { id: String(args[0]) },
                ...(args[1] || {})
              });
            }
          } catch (findError) {
            // Log the error but don't crash - return null instead
            this.logger.warn(`Error finding record by ID ${args[0]}`, { 
              error: findError,
              modelName: this.modelName 
            });
            result = null;
          }
          break;
          
        case 'findByCriteria':
          result = await (model as any).findMany({
            where: args[0],
            ...(args[1] || {})
          });
          break;
          
        case 'findOneByCriteria':
          result = await (model as any).findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          break;
          
        case 'create':
          result = await (model as any).create({
            data: args[0]
          });
          break;
          
        case 'update':
          // Normalize the ID for Prisma
          const updateId = this.normalizeId(args[0]);
          
          // Ensure we don't include the ID field in the data object for update operations
          const updateData = { ...args[1] };
          
          // Remove id from update data to prevent Prisma errors
          if (updateData && typeof updateData === 'object' && 'id' in updateData) {
            delete updateData.id;
            this.logger.debug('Removed id from update data to prevent Prisma errors');
          }
          
          // Handle special case for RefreshToken which uses token as primary key instead of id
          if (this.modelName === 'refreshToken') {
            // For RefreshToken, use token as the key field
            result = await (model as any).update({
              where: { token: updateId },
              data: updateData
            });
          } else {
            // For all other models, use id as the key field
            result = await (model as any).update({
              where: { id: updateId },
              data: updateData
            });
          }
          break;
          
        case 'delete':
          // Normalize the ID for Prisma
          const deleteId = this.normalizeId(args[0]);
          
          result = await (model as any).delete({
            where: { id: deleteId }
          });
          break;
          
        case 'count':
          result = await (model as any).count({
            where: args[0]
          });
          break;
          
        case 'bulkUpdate':
          // Normalize all IDs in the array
          const bulkUpdateIds = Array.isArray(args[0]) 
            ? args[0].map(id => this.normalizeId(id)) 
            : args[0];
            
          result = await (model as any).updateMany({
            where: { id: { in: bulkUpdateIds } },
            data: args[1]
          });
          break;
          
        case 'logActivity':
          // Special implementation for activity logging
          result = await this.logActivityImplementation(args[0], args[1], args[2], args[3]);
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      // Log execution time in debug mode
      if (isDebug) {
        const duration = Date.now() - startTime;
        this.logger.debug(`Query execution time for ${operation} on ${this.modelName}: ${duration}ms`);
        
        // Warn for slow queries
        if (duration > 1000) {
          this.logger.warn(`Slow query detected: ${operation} on ${this.modelName} took ${duration}ms`, {
            operation,
            model: this.modelName,
            duration,
            args: JSON.stringify(args)
          });
        }
      }
      
      return result;
    } catch (error) {
      // Log error with details
      this.logger.error(`Error executing query: ${operation} on ${this.modelName}`, { 
        error, 
        operation, 
        model: this.modelName,
        args: JSON.stringify(args)
      });
      
      throw error;
    }
  }

  /**
   * Execute a transaction
   * 
   * @param callback - Callback function that accepts a repository instance
   * @returns Promise with transaction result
   */
  async transaction<R>(callback: (repo: this) => Promise<R>): Promise<R> {
    try {
      const timeout = configService.isDevelopment() ? 30000 : 10000;
      
      // Use Prisma's transaction API
      return await this.prisma.$transaction(
        async (tx) => {
          try {
            // Store transaction client
            this.prismaTransaction = tx;
            
            // Log transaction start
            this.logger.debug(`Starting transaction for ${this.modelName}`);
            
            // Execute operation - pass this repository instance to the callback
            return await callback(this);
          } finally {
            // Clear transaction client (always executed)
            this.prismaTransaction = null;
            
            // Log transaction end
            this.logger.debug(`Transaction for ${this.modelName} completed`);
          }
        },
        {
          // Transaction options
          maxWait: 5000, // 5s maximum wait time
          timeout: timeout, // Transaction timeout
        }
      );
    } catch (error) {
      this.logger.error(`Transaction error in ${this.modelName}`, { error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Build ORM-specific query options
   * 
   * @param options - Query options
   * @returns ORM-specific options
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
    
    // Add selection fields
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
      // Fix for the "sortBy" field issue - don't use "sortBy" as a field name
      // Special handling for metadata field names that aren't real database fields
      if (options.sort.field === 'sortBy') {
        // Use a default field based on the model
        const defaultSortField = this.getDefaultSortField();
        result.orderBy = {
          [defaultSortField]: options.sort.direction.toLowerCase()
        };
        this.logger.debug(`Used default sort field ${defaultSortField} for sortBy`);
      } else {
        // Use the specified field
        result.orderBy = {
          [options.sort.field]: options.sort.direction.toLowerCase()
        };
        this.logger.debug(`Added sorting options: ${options.sort.field} ${options.sort.direction}`);
      }
    } else if (this.modelName === 'appointment') {
      // Default sorting for appointments
      result.orderBy = { appointmentDate: 'asc' };
      this.logger.debug('Added default sorting for appointments by appointmentDate asc');
    }
    
    return result;
  }

  /**
   * Check if an error violates a uniqueness constraint
   * 
   * @param error - Error to check
   * @returns Whether the error violates a uniqueness constraint
   */
  protected isUniqueConstraintError(error: any): boolean {
    return error instanceof PrismaClientKnownRequestError && error.code === 'P2002';
  }

  /**
   * Check if an error violates a foreign key constraint
   * 
   * @param error - Error to check
   * @returns Whether the error violates a foreign key constraint
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    return error instanceof PrismaClientKnownRequestError && error.code === 'P2003';
  }

  /**
   * Handle a database error
   * 
   * @param error - The error that occurred
   * @returns The transformed error
   */
  protected handleDatabaseError(error: any): Error {
    if (error instanceof PrismaClientKnownRequestError) {
      // Known Prisma errors with detailed error messages
      switch (error.code) {
        case 'P2002': // Unique constraint violated
          const field = error.meta?.target as string[] || ['field'];
          return this.errorHandler.createConflictError(
            `Unique constraint violation on field(s): ${field.join(', ')}`
          );
          
        case 'P2003': // Foreign key constraint failed
          const fkField = error.meta?.field_name || 'field';
          return this.errorHandler.createConflictError(
            `Foreign key constraint violation on field: ${fkField}`
          );
          
        case 'P2025': // Record not found
          return this.errorHandler.createNotFoundError(
            error.meta?.cause ? String(error.meta.cause) : 'Record not found'
          );
          
        case 'P2014': // Required relation violation
          return this.errorHandler.createValidationError(
            'Required relation violation',
            [error.message]
          );
          
        case 'P2021': // Table does not exist
          return this.errorHandler.handleDatabaseError(error);
          
        case 'P2010': // Raw query error
          return this.errorHandler.handleDatabaseError(error);
          
        default:
          return this.errorHandler.handleDatabaseError(error);
      }
    } else if (error instanceof PrismaClientValidationError) {
      // Validation error
      return this.errorHandler.createValidationError(
        'Database validation error', 
        [error.message.split('\n').pop() || error.message]
      );
    } else if (error instanceof PrismaClientRustPanicError) {
      // Critical error in Prisma Engine
      this.logger.error('Critical Prisma Engine error occurred', { error });
      return this.errorHandler.handleDatabaseError(error);
    } else if (error instanceof PrismaClientInitializationError) {
      // Initialization error
      this.logger.error('Prisma initialization error', { error });
      return this.errorHandler.handleDatabaseError(error);
    } else if (error instanceof PrismaClientUnknownRequestError) {
      // Unknown request error
      return this.errorHandler.handleDatabaseError(error);
    }
    
    // Generic database error
    return this.errorHandler.handleDatabaseError(error);
  }

  /**
   * Implementation of activity logging
   * 
   * Must be implemented by derived classes that need to log activities.
   * 
   * @param userId - User ID
   * @param actionType - Action type
   * @param details - Details
   * @param ipAddress - IP address
   * @returns Promise with log result
   */
  protected abstract logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string, 
    ipAddress?: string
  ): Promise<any>;
  
  /**
   * Get the display name of the repository
   * 
   * @returns Display name for logging
   */
  protected getDisplayName(): string {
    return `${this.modelName}Repository`;
  }
  
  /**
   * Returns the default sort field for this model
   * Used when a generic 'sortBy' is requested
   * 
   * @returns The default field to sort by
   */
  protected getDefaultSortField(): string {
    // Use model-specific default sort fields
    switch (this.modelName) {
      case 'user':
        return 'name';
      case 'customer':
        return 'name';
      case 'appointment':
        return 'appointmentDate';
      case 'request':
        return 'createdAt';
      default:
        return 'createdAt';
    }
  }
}