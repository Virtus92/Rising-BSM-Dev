import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { QueryOptions } from '@/domain/repositories/IBaseRepository';
import { configService } from '@/infrastructure/services/ConfigService';

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
          result = await (model as any).findUnique({
            where: { id: args[0] },
            ...(args[1] || {})
          });
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
          result = await (model as any).update({
            where: { id: args[0] },
            data: args[1]
          });
          break;
          
        case 'delete':
          result = await (model as any).delete({
            where: { id: args[0] }
          });
          break;
          
        case 'count':
          result = await (model as any).count({
            where: args[0]
          });
          break;
          
        case 'bulkUpdate':
          result = await (model as any).updateMany({
            where: { id: { in: args[0] } },
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
      result.orderBy = {
        [options.sort.field]: options.sort.direction.toLowerCase()
      };
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
            error.meta?.cause || 'Record not found'
          );
          
        case 'P2014': // Required relation violation
          return this.errorHandler.createValidationError(
            'Required relation violation',
            [error.message]
          );
          
        case 'P2021': // Table does not exist
          return this.errorHandler.createDatabaseError(
            `Table does not exist: ${error.meta?.table || 'unknown'}`,
            error.code,
            error
          );
          
        case 'P2010': // Raw query error
          return this.errorHandler.createDatabaseError(
            `Raw query error: ${error.message}`,
            error.code,
            error
          );
          
        default:
          return this.errorHandler.createDatabaseError(
            `Database error: ${error.code} - ${error.message}`,
            error.code,
            error
          );
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
      return this.errorHandler.createDatabaseError(
        'A critical database error occurred. Please contact support.',
        'CRITICAL_DB_ERROR',
        error
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      // Fehler bei der Initialisierung
      this.logger.error('Prisma initialization error', { error });
      return this.errorHandler.createDatabaseError(
        'Database connection could not be established',
        'DB_INIT_ERROR',
        error
      );
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      // Unbekannter Anfragefehler
      return this.errorHandler.createDatabaseError(
        'Unknown database request error',
        'UNKNOWN_REQUEST_ERROR',
        error
      );
    }
    
    // Generischer Datenbankfehler
    return this.errorHandler.createDatabaseError(
      `Database error occurred: ${error.message || 'Unknown error'}`,
      'DB_ERROR',
      error
    );
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
}