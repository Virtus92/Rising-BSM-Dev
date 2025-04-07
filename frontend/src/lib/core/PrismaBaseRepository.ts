/**
 * PrismaBaseRepository
 * 
 * Extends BaseRepository to provide Prisma-specific implementations
 * for abstract methods defined in the base class.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { ILoggingService } from '@/types/interfaces/ILoggingService';
import { IErrorHandler } from '@/types/interfaces/IErrorHandler';
import { QueryOptions } from '@/types/interfaces/IRepository';

export abstract class PrismaBaseRepository<T, ID> extends BaseRepository<T, ID> {
  // Track current transaction
  protected prismaTransaction: Prisma.TransactionClient | null = null;

  /**
   * Creates a new PrismaBaseRepository instance
   * 
   * @param prisma - Prisma client
   * @param model - Model name for this repository
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: string,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(prisma[modelName as keyof PrismaClient], logger, errorHandler);
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
      // We can't actually begin the transaction here, because Prisma requires us to pass the
      // operation to $transaction. So we'll just log it for now, and the actual transaction
      // will be created in the withTransaction method.
      this.logger.debug('Transaction will be started during operation execution');
    } catch (error) {
      this.logger.error('Error beginning transaction', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Commit a database transaction
   */
  protected async commitTransaction(): Promise<void> {
    // For Prisma, transactions are automatically committed when the callback completes
    // so there's nothing to do here
    this.prismaTransaction = null;
    this.logger.debug('Transaction committed');
  }

  /**
   * Rollback a database transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    // For Prisma, transactions are automatically rolled back when an error occurs
    // so there's nothing to do here
    this.prismaTransaction = null;
    this.logger.debug('Transaction rolled back');
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
      // Get the appropriate model
      const model = this.prismaTransaction || this.prisma[this.modelName as keyof PrismaClient];
      
      if (!model) {
        throw new Error(`Model ${this.modelName} not found on Prisma client`);
      }
      
      switch (operation) {
        case 'findAll':
          return await (model as any).findMany(args[0]);
          
        case 'findById':
          return await (model as any).findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
          
        case 'findByCriteria':
          return await (model as any).findMany({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'findOneByCriteria':
          return await (model as any).findFirst({
            where: args[0],
            ...(args[1] || {})
          });
          
        case 'create':
          return await (model as any).create({
            data: args[0]
          });
          
        case 'update':
          return await (model as any).update({
            where: { id: args[0] },
            data: args[1]
          });
          
        case 'delete':
          return await (model as any).delete({
            where: { id: args[0] }
          });
          
        case 'count':
          return await (model as any).count({
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
   * Execute operations in a transaction
   * 
   * @param operation - Operation to execute
   * @returns Promise with operation result
   */
  async withTransaction<R>(operation: () => Promise<R>): Promise<R> {
    try {
      // Use Prisma's transaction API
      return await this.prisma.$transaction(async (tx) => {
        // Store transaction client
        this.prismaTransaction = tx;
        
        try {
          // Execute operation
          const result = await operation();
          
          // Clear transaction client
          this.prismaTransaction = null;
          
          return result;
        } catch (error) {
          // Clear transaction client
          this.prismaTransaction = null;
          
          // Re-throw error to trigger rollback
          throw error;
        }
      }, {
        // Transaction options
        maxWait: 5000, // 5s max waiting time
        timeout: 10000, // 10s max transaction time
      });
    } catch (error) {
      this.logger.error('Transaction error', error instanceof Error ? error : String(error));
      throw this.handleError(error);
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
   * Process criteria for ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const result: Record<string, any> = {};
    
    // Process each criterion
    for (const [key, value] of Object.entries(criteria)) {
      // Handle complex criteria objects
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Object with operators like {eq, gt, lt, etc.}
        const operators: Record<string, any> = {};
        
        for (const [op, opValue] of Object.entries(value)) {
          switch (op) {
            case 'eq':
              operators.equals = opValue;
              break;
            case 'neq':
              operators.not = opValue;
              break;
            case 'gt':
              operators.gt = opValue;
              break;
            case 'gte':
              operators.gte = opValue;
              break;
            case 'lt':
              operators.lt = opValue;
              break;
            case 'lte':
              operators.lte = opValue;
              break;
            case 'contains':
              operators.contains = opValue;
              operators.mode = 'insensitive';
              break;
            case 'startsWith':
              operators.startsWith = opValue;
              break;
            case 'endsWith':
              operators.endsWith = opValue;
              break;
            case 'in':
              operators.in = opValue;
              break;
            case 'notIn':
              operators.notIn = opValue;
              break;
            default:
              // Unknown operator, just pass it through
              operators[op] = opValue;
          }
        }
        
        result[key] = operators;
      } else {
        // Simple equality
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Check if error is a unique constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a unique constraint violation
   */
  protected isUniqueConstraintError(error: any): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
  }
  
  /**
   * Bulk update multiple entities at once
   * 
   * @param ids - Array of entity IDs
   * @param data - Update data
   * @returns Promise with count of updated entities
   */
  async bulkUpdate(ids: ID[], data: Partial<T>): Promise<number> {
    try {
      const model = this.prismaTransaction || this.prisma[this.modelName as keyof PrismaClient];
      
      const result = await (model as any).updateMany({
        where: { id: { in: ids } },
        data: this.mapToORMEntity(data)
      });
      
      return result.count;
    } catch (error) {
      this.logger.error('Error in bulk update', error instanceof Error ? error : String(error), { ids, data });
      throw this.handleError(error);
    }
  }
}
