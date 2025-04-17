import { 
  IBaseRepository, 
  PaginationResult, 
  QueryOptions, 
  SortOptions
} from '@/domain/repositories/IBaseRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';

/**
 * Abstrakte Basis-Repository-Klasse
 * 
 * Bietet eine Grundlage für alle Repository-Implementierungen.
 * 
 * @template T - Entitätstyp
 * @template ID - Typ des Primärschlüssels
 */
export abstract class BaseRepository<T, ID = number> implements IBaseRepository<T, ID> {
  /**
   * Konstruktor
   * 
   * @param model - ORM-Modell/Entität
   * @param logger - Logging-Dienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    protected readonly model: any,
    protected readonly logger: ILoggingService,
    protected readonly errorHandler: IErrorHandler
  ) {}

  /**
   * Findet alle Entitäten
   * 
   * @param options - Abfrageoptionen
   * @returns Promise mit Entitäten und Paginierung
   */
  async findAll(options?: QueryOptions): Promise<PaginationResult<T>> {
    try {
      const queryOptions = this.buildQueryOptions(options);
      
      // Make sure we have proper sorting for appointments
      if (this.getDisplayName()?.toLowerCase().includes('appointment')) {
        if (!queryOptions.orderBy) {
          queryOptions.orderBy = { appointmentDate: 'asc' };
          this.logger.debug('Adding default appointment date sorting for appointments');
        }
      }
      
      // Zähle die Gesamtanzahl
      const total = await this.count();
      
      // Hole die Daten
      const results = await this.executeQuery('findAll', queryOptions);
      
      // Berechne die Paginierung
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const totalPages = Math.ceil(total / limit) || 1;
      
      // Konvertiere zu Domänenentitäten
      const data = Array.isArray(results) ? results.map(entity => this.mapToDomainEntity(entity)) : [];
      
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
      this.logger.error('Error in findAll', { error, options });
      throw this.handleError(error);
    }
  }

  /**
   * Findet eine Entität anhand ihrer ID
   * 
   * @param id - ID der Entität
   * @param options - Abfrageoptionen
   * @returns Promise mit Entität oder null
   */
  async findById(id: ID, options?: QueryOptions): Promise<T | null> {
    try {
      const result = await this.executeQuery('findById', id, this.buildQueryOptions(options));
      return result ? this.mapToDomainEntity(result) : null;
    } catch (error) {
      this.logger.error('Error in findById', { error, id, options });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Entitäten anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @param options - Abfrageoptionen
   * @returns Promise mit Entitäten
   */
  async findByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T[]> {
    try {
      const processedCriteria = this.processCriteria(criteria);
      const queryOptions = this.buildQueryOptions(options);
      const results = await this.executeQuery('findByCriteria', processedCriteria, queryOptions);
      return Array.isArray(results) ? results.map(entity => this.mapToDomainEntity(entity)) : [];
    } catch (error) {
      this.logger.error('Error in findByCriteria', { error, criteria, options });
      throw this.handleError(error);
    }
  }

  /**
   * Findet eine Entität anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @param options - Abfrageoptionen
   * @returns Promise mit Entität oder null
   */
  async findOneByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T | null> {
    try {
      const processedCriteria = this.processCriteria(criteria);
      const queryOptions = this.buildQueryOptions(options);
      const result = await this.executeQuery('findOneByCriteria', processedCriteria, queryOptions);
      return result ? this.mapToDomainEntity(result) : null;
    } catch (error) {
      this.logger.error('Error in findOneByCriteria', { error, criteria, options });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt eine neue Entität
   * 
   * @param data - Entitätsdaten
   * @returns Promise mit erstellter Entität
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const entityData = this.mapToORMEntity(data);
      const result = await this.executeQuery('create', entityData);
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error('Error in create', { error, data });
      
      // Behandle Einzigartigkeit verletzt
      if (this.isUniqueConstraintError(error)) {
        throw this.errorHandler.createConflictError('Entity with this identifier already exists');
      }
      
      // Behandle andere Fehler
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert eine vorhandene Entität
   * 
   * @param id - ID der Entität
   * @param data - Aktualisierte Daten
   * @returns Promise mit aktualisierter Entität
   */
  async update(id: ID, data: Partial<T>): Promise<T> {
    try {
      const entityData = this.mapToORMEntity(data);
      const result = await this.executeQuery('update', id, entityData);
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error('Error in update', { error, id, data });
      
      // Behandle Einzigartigkeit verletzt
      if (this.isUniqueConstraintError(error)) {
        throw this.errorHandler.createConflictError('Entity with this identifier already exists');
      }
      
      // Behandle andere Fehler
      throw this.handleError(error);
    }
  }

  /**
   * Löscht eine Entität
   * 
   * @param id - ID der Entität
   * @returns Promise mit Erfolg der Operation
   */
  async delete(id: ID): Promise<boolean> {
    try {
      await this.executeQuery('delete', id);
      return true;
    } catch (error) {
      this.logger.error('Error in delete', { error, id });
      
      // Behandle Fremdschlüssel-Einschränkung verletzt
      if (this.isForeignKeyConstraintError(error)) {
        throw this.errorHandler.createConflictError('Cannot delete entity due to existing references');
      }
      
      // Behandle andere Fehler
      throw this.handleError(error);
    }
  }

  /**
   * Zählt Entitäten anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @returns Promise mit Anzahl
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    try {
      const processedCriteria = criteria ? this.processCriteria(criteria) : {};
      return await this.executeQuery('count', processedCriteria);
    } catch (error) {
      this.logger.error('Error in count', { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Führt einen Massenupdate durch
   * 
   * @param ids - IDs der Entitäten
   * @param data - Aktualisierte Daten
   * @returns Promise mit Anzahl der aktualisierten Entitäten
   */
  async bulkUpdate(ids: ID[], data: Partial<T>): Promise<number> {
    try {
      if (!ids.length) {
        return 0;
      }
      
      const entityData = this.mapToORMEntity(data);
      const result = await this.executeQuery('bulkUpdate', ids, entityData);
      return typeof result === 'number' ? result : (result as any).count || 0;
    } catch (error) {
      this.logger.error('Error in bulkUpdate', { error, ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Protokolliert eine Aktivität
   * 
   * @param userId - Benutzer-ID
   * @param actionType - Aktionstyp
   * @param details - Details
   * @param ipAddress - IP-Adresse
   * @returns Promise mit Protokollergebnis
   */
  async logActivity(userId: number, actionType: string, details?: string, ipAddress?: string): Promise<any> {
    try {
      return await this.executeQuery('logActivity', userId, actionType, details, ipAddress);
    } catch (error) {
      this.logger.error('Error in logActivity', { error, userId, actionType, details });
      return null; // Aktivitätsprotokollierung sollte nicht zum Abbruch führen
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
      // Beginne Transaktion
      await this.beginTransaction();
      
      // Führe Operation aus
      const result = await callback();
      
      // Commit Transaktion
      await this.commitTransaction();
      
      return result;
    } catch (error) {
      // Rollback Transaktion
      await this.rollbackTransaction();
      
      this.logger.error('Transaction error', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Behandelt Repository-Fehler
   * 
   * @param error - Zu behandelnder Fehler
   * @returns Gemappter Fehler
   */
  protected handleError(error: any): Error {
    // Gib Fehler zurück, wenn bereits behandelt
    if (error instanceof Error && 'statusCode' in error) {
      return error;
    }
    
    // Behandle datenbankspezifische Fehler
    if (this.isDatabaseError(error)) {
      return this.errorHandler.handleDatabaseError(error);
    }
    
    // Behandle andere Fehler
    return this.errorHandler.mapError(error);
  }

  /**
   * Beginnt eine Datenbanktransaktion
   */
  protected abstract beginTransaction(): Promise<void>;

  /**
   * Committet eine Datenbanktransaktion
   */
  protected abstract commitTransaction(): Promise<void>;

  /**
   * Rollt eine Datenbanktransaktion zurück
   */
  protected abstract rollbackTransaction(): Promise<void>;

  /**
   * Führt eine Datenbankabfrage aus
   * 
   * @param operation - Operationsname
   * @param args - Abfrageargumente
   * @returns Promise mit Abfrageergebnis
   */
  protected abstract executeQuery(operation: string, ...args: any[]): Promise<any>;

  /**
   * Baut ORM-spezifische Abfrageoptionen
   * 
   * @param options - Abfrageoptionen
   * @returns ORM-spezifische Optionen
   */
  protected abstract buildQueryOptions(options?: QueryOptions): any;

  /**
   * Verarbeitet Kriterien für das ORM
   * 
   * @param criteria - Filterkriterien
   * @returns ORM-spezifische Kriterien
   */
  protected abstract processCriteria(criteria: Record<string, any>): any;

  /**
   * Mappt ORM-Entität auf Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  protected abstract mapToDomainEntity(ormEntity: any): T;

  /**
   * Mappt Domänenentität auf ORM-Entität
   * 
   * @param domainEntity - Domänenentität
   * @returns ORM-Entität
   */
  protected abstract mapToORMEntity(domainEntity: Partial<T>): any;

  /**
   * Prüft, ob ein Fehler ein Datenbankfehler ist
   * 
   * @param error - Zu prüfender Fehler
   * @returns Ob der Fehler ein Datenbankfehler ist
   */
  protected isDatabaseError(error: any): boolean {
    // Standardimplementierung - Überschreiben in Unterklassen
    return error && typeof error === 'object' && 'code' in error;
  }

  /**
   * Prüft, ob ein Fehler eine Einzigartigkeit verletzt
   * 
   * @param error - Zu prüfender Fehler
   * @returns Ob der Fehler eine Einzigartigkeit verletzt
   */
  protected abstract isUniqueConstraintError(error: any): boolean;

  /**
   * Prüft, ob ein Fehler eine Fremdschlüssel-Einschränkung verletzt
   * 
   * @param error - Zu prüfender Fehler
   * @returns Ob der Fehler eine Fremdschlüssel-Einschränkung verletzt
   */
  protected abstract isForeignKeyConstraintError(error: any): boolean;
  
  /**
   * Gibt den Anzeigenamen des Repositories zurück
   * 
   * @returns Anzeigename für Logging
   */
  protected getDisplayName(): string {
    return this.constructor.name;
  }
}
