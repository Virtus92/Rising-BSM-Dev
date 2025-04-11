import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { QueryOptions } from '@/domain/repositories/IBaseRepository';

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
    try {
      // Hole das passende Modell
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
          
        case 'bulkUpdate':
          return await (model as any).updateMany({
            where: { id: { in: args[0] } },
            data: args[1]
          });
          
        case 'logActivity':
          // Spezielle Implementierung für Aktivitätsprotokollierung
          return await this.logActivityImplementation(args[0], args[1], args[2], args[3]);
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      this.logger.error(`Error executing query: ${operation}`, { error, args });
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
      // Verwende Prismas Transaktions-API
      return await this.prisma.$transaction(
        async (tx) => {
          try {
            // Speichere Transaktions-Client
            this.prismaTransaction = tx;
            
            // Führe Operation aus
            return await callback();
          } finally {
            // Lösche Transaktions-Client (wird immer ausgeführt)
            this.prismaTransaction = null;
          }
        },
        {
          // Transaktionsoptionen
          maxWait: 5000, // 5s maximale Wartezeit
          timeout: 10000, // 10s maximale Transaktionszeit
        }
      );
    } catch (error) {
      this.logger.error('Transaction error', { error });
      throw this.handleError(error);
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
}
