import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { QueryOptions as BaseQueryOptions, PaginationResult } from '@/domain/repositories/IBaseRepository';
import { configService } from '@/infrastructure/services/ConfigService';

// Extend QueryOptions to include criteria
export interface QueryOptions extends BaseQueryOptions {
  criteria?: any;
}

/**
 * Prisma-Basis-Repository
 * 
 * Erweitert das BaseRepository, um Prisma-spezifische Implementierungen
 * für abstrakte Methoden zu bieten.
 * 
 * @template T - Entitätstyp
 * @template ID - Typ des Primärschlüssels
 */
export abstract class PrismaRepository<T, ID = number> extends BaseRepository<T, ID> {
  /**
   * Prisma-Transaktion
   */
  protected prismaTransaction: Prisma.TransactionClient | null = null;

  /**
   * Konstruktor
   * 
   * @param prisma - Prisma-Client
   * @param modelName - Modellname für dieses Repository
   * @param logger - Logging-Dienst
   * @param errorHandler - Fehlerbehandlungsdienst
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
   * Beginnt eine Datenbanktransaktion
   */
  protected async beginTransaction(): Promise<void> {
    if (this.prismaTransaction) {
      this.logger.warn('Transaction already in progress');
      return;
    }
    
    try {
      // Wir können die Transaktion hier nicht tatsächlich starten, da Prisma erfordert,
      // dass wir die Operation an $transaction übergeben. Daher protokollieren wir sie nur.
      this.logger.debug('Transaction will be started during operation execution');
    } catch (error) {
      this.logger.error('Error beginning transaction', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Committet eine Datenbanktransaktion
   */
  protected async commitTransaction(): Promise<void> {
    // Bei Prisma werden Transaktionen automatisch committet, wenn der Callback abgeschlossen ist
    this.prismaTransaction = null;
    this.logger.debug('Transaction committed');
  }

  /**
   * Rollt eine Datenbanktransaktion zurück
   */
  protected async rollbackTransaction(): Promise<void> {
    // Bei Prisma werden Transaktionen automatisch zurückgerollt, wenn ein Fehler auftritt
    this.prismaTransaction = null;
    this.logger.debug('Transaction rolled back');
  }

  /**
   * Normalisiert eine ID für Prisma-Abfragen
   * Konvertiert String-IDs in numerische IDs, falls nötig
   * 
   * @param id - Die zu normalisierende ID
   * @returns Die normalisierte ID
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
   * Führt eine Datenbankabfrage aus
   * 
   * @param operation - Operationsname
   * @param args - Abfrageargumente
   * @returns Promise mit Abfrageergebnis
   */
  protected async executeQuery(operation: string, ...args: any[]): Promise<any> {
    // Startzeit protokollieren, wenn im Debug-Modus
    const isDebug = configService.getLoggingConfig().level === 'debug';
    const startTime = isDebug ? Date.now() : 0;
    
    try {
      // Hole das passende Modell
      const model = this.prismaTransaction || this.prisma[this.modelName as keyof PrismaClient];
      
      if (!model) {
        throw new Error(`Model ${this.modelName} not found on Prisma client`);
      }
      
      // Ausführung der Abfrage
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
          // Normalisiere die ID für Prisma
          const updateId = this.normalizeId(args[0]);
          
          // Ensure we don't include the ID field in the data object for update operations
          const updateData = { ...args[1] };
          
          // Remove id from update data to prevent Prisma errors
          if (updateData && typeof updateData === 'object' && 'id' in updateData) {
            delete updateData.id;
            this.logger.debug('Removed id from update data to prevent Prisma errors');
          }
          
          result = await (model as any).update({
            where: { id: updateId },
            data: updateData
          });
          break;
          
        case 'delete':
          // Normalisiere die ID für Prisma
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
          // Normalisiere alle IDs im Array
          const bulkUpdateIds = Array.isArray(args[0]) 
            ? args[0].map(id => this.normalizeId(id)) 
            : args[0];
            
          result = await (model as any).updateMany({
            where: { id: { in: bulkUpdateIds } },
            data: args[1]
          });
          break;
          
        case 'logActivity':
          // Spezielle Implementierung für Aktivitätsprotokollierung
          result = await this.logActivityImplementation(args[0], args[1], args[2], args[3]);
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      // Protokolliere Ausführungszeit im Debug-Modus
      if (isDebug) {
        const duration = Date.now() - startTime;
        this.logger.debug(`Query execution time for ${operation} on ${this.modelName}: ${duration}ms`);
        
        // Warne bei langsamen Abfragen
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
      // Protokolliere Fehler mit Details
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
   * Führt eine Transaktion aus
   * 
   * @param callback - Callback-Funktion
   * @returns Promise mit Transaktionsergebnis
   */
  async transaction<R>(callback: () => Promise<R>): Promise<R> {
    try {
      const timeout = configService.isDevelopment() ? 30000 : 10000;
      
      // Verwende Prismas Transaktions-API
      return await this.prisma.$transaction(
        async (tx) => {
          try {
            // Speichere Transaktions-Client
            this.prismaTransaction = tx;
            
            // Protokolliere Transaktionsbeginn
            this.logger.debug(`Starting transaction for ${this.modelName}`);
            
            // Führe Operation aus
            return await callback();
          } finally {
            // Lösche Transaktions-Client (wird immer ausgeführt)
            this.prismaTransaction = null;
            
            // Protokolliere Transaktionsende
            this.logger.debug(`Transaction for ${this.modelName} completed`);
          }
        },
        {
          // Transaktionsoptionen
          maxWait: 5000, // 5s maximale Wartezeit
          timeout: timeout, // Timeout für die Transaktion
        }
      );
    } catch (error) {
      this.logger.error(`Transaction error in ${this.modelName}`, { error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Baut ORM-spezifische Abfrageoptionen
   * 
   * @param options - Abfrageoptionen
   * @returns ORM-spezifische Optionen
   */
  protected buildQueryOptions(options?: QueryOptions): any {
    if (!options) {
      return {};
    }
    
    const result: any = {};
    
    // Füge Paginierung hinzu
    if (options.page !== undefined && options.limit !== undefined) {
      result.skip = (options.page - 1) * options.limit;
      result.take = options.limit;
    }
    
    // Füge Auswahlfelder hinzu
    if (options.select && options.select.length > 0) {
      result.select = options.select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Füge Beziehungen hinzu
    if (options.relations && options.relations.length > 0) {
      result.include = options.relations.reduce((acc, relation) => {
        acc[relation] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Füge Sortierung hinzu
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
   * Prüft, ob ein Fehler eine Einzigartigkeit verletzt
   * 
   * @param error - Zu prüfender Fehler
   * @returns Ob der Fehler eine Einzigartigkeit verletzt
   */
  protected isUniqueConstraintError(error: any): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  /**
   * Prüft, ob ein Fehler eine Fremdschlüssel-Einschränkung verletzt
   * 
   * @param error - Zu prüfender Fehler
   * @returns Ob der Fehler eine Fremdschlüssel-Einschränkung verletzt
   */
  protected isForeignKeyConstraintError(error: any): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
  }

  /**
   * Behandelt einen Datenbankfehler
   * 
   * @param error - Der aufgetretene Fehler
   * @returns Der transformierte Fehler
   */
  protected handleDatabaseError(error: any): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Bekannte Prisma-Fehler mit detaillierten Fehlermeldungen
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
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      // Validierungsfehler
      return this.errorHandler.createValidationError(
        'Database validation error', 
        [error.message.split('\n').pop() || error.message]
      );
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      // Schwerwiegender Fehler im Prisma-Engine
      this.logger.error('Critical Prisma Engine error occurred', { error });
      return this.errorHandler.handleDatabaseError(error);
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      // Fehler bei der Initialisierung
      this.logger.error('Prisma initialization error', { error });
      return this.errorHandler.handleDatabaseError(error);
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      // Unbekannter Anfragefehler
      return this.errorHandler.handleDatabaseError(error);
    }
    
    // Generischer Datenbankfehler
    return this.errorHandler.handleDatabaseError(error);
  }

  /**
   * Implementierung der Aktivitätsprotokollierung
   * 
   * Muss von den abgeleiteten Klassen implementiert werden, die Aktivitäten protokollieren müssen.
   * 
   * @param userId - Benutzer-ID
   * @param actionType - Aktionstyp
   * @param details - Details
   * @param ipAddress - IP-Adresse
   * @returns Promise mit Protokollergebnis
   */
  protected abstract logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string, 
    ipAddress?: string
  ): Promise<any>;
  
  /**
   * Gibt den Anzeigenamen des Repositories zurück
   * 
   * @returns Anzeigename für Logging
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