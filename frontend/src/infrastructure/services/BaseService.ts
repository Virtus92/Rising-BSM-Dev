import { 
  IBaseService, 
  ServiceOptions 
} from '@/domain/services/IBaseService';
import { IBaseRepository, PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler, AppError } from '@/infrastructure/common/error/ErrorHandler';

/**
 * Basis-Service-Klasse
 * 
 * Implementiert das IBaseService-Interface und bietet gemeinsame Funktionalität
 * für alle Service-Klassen.
 * 
 * @template T - Entitätstyp
 * @template C - Typ für Create DTO
 * @template U - Typ für Update DTO
 * @template R - Typ für Response DTO
 * @template ID - Typ des Primärschlüssels
 */
export abstract class BaseService<T, C, U, R, ID = number> implements IBaseService<T, C, U, R, ID> {
  /**
   * Konstruktor
   * 
   * @param repository - Repository für den Datenzugriff
   * @param logger - Logging-Dienst
   * @param validator - Validierungsdienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    protected readonly repository: IBaseRepository<T, ID>,
    protected readonly logger: ILoggingService,
    protected readonly validator: IValidationService,
    protected readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug(`Created ${this.constructor.name}`);
  }

  /**
   * Ruft alle Entitäten ab
   * 
   * @param options - Service-Optionen
   * @returns Paginierte Liste von Entitäten
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<R>> {
    try {
      // Mappe Service-Optionen auf Repository-Optionen
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Hole Entitäten vom Repository
      const result = await this.repository.findAll(repoOptions);
      
      // Mappe Entitäten auf DTOs
      const data = result.data.map(entity => this.toDTO(entity));
      
      // Gib paginiertes Ergebnis zurück
      return {
        data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getAll`, { error, options });
      throw this.handleError(error);
    }
  }

  /**
   * Ruft eine Entität anhand ihrer ID ab
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Entität oder null, wenn nicht gefunden
   */
  async getById(id: ID, options?: ServiceOptions): Promise<R | null> {
    try {
      // Mappe Service-Optionen auf Repository-Optionen
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Hole Entität vom Repository
      const entity = await this.repository.findById(id, repoOptions);
      
      // Wenn Entität nicht gefunden, gib null zurück
      if (!entity) {
        return null;
      }
      
      // Mappe Entität auf DTO
      return this.toDTO(entity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getById`, { error, id, options });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt eine neue Entität
   * 
   * @param data - Erstellungsdaten
   * @param options - Service-Optionen
   * @returns Erstellte Entität
   */
  async create(data: C, options?: ServiceOptions): Promise<R> {
    try {
      // Validiere Eingabedaten
      await this.validate(data);
      
      // Füge Auditinformationen hinzu, falls Kontext vorhanden
      const auditedData = this.addAuditInfo(data, options?.context, 'create');
      
      // Führe Business-Logic-Hooks aus
      await this.beforeCreate(auditedData, options);
      
      // Mappe DTO auf Entität
      const entityData = this.toEntity(auditedData);
      
      // Erstelle Entität im Repository
      const entity = await this.repository.create(entityData);
      
      // Führe After-Create-Hooks aus
      const processedEntity = await this.afterCreate(entity, auditedData, options);
      
      // Mappe Entität auf DTO
      return this.toDTO(processedEntity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.create`, { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert eine vorhandene Entität
   * 
   * @param id - ID der Entität
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierte Entität
   */
  async update(id: ID, data: U, options?: ServiceOptions): Promise<R> {
    try {
      // Prüfe, ob Entität existiert
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw this.errorHandler.createNotFoundError(
          `${this.getEntityName()} with ID ${String(id)} not found`
        );
      }
      
      // Validiere Eingabedaten mit userID für E-Mail-Validierung
      await this.validate(data, true, id as any);
      
      // Füge Auditinformationen hinzu, falls Kontext vorhanden
      const auditedData = this.addAuditInfo(data, options?.context, 'update');
      
      // Führe Business-Logic-Hooks aus
      await this.beforeUpdate(id, auditedData, existing, options);
      
      // Mappe DTO auf Entität
      const entityData = this.toEntity(auditedData, existing);
      
      // Aktualisiere Entität im Repository
      const entity = await this.repository.update(id, entityData);
      
      // Führe After-Update-Hooks aus
      const processedEntity = await this.afterUpdate(entity, auditedData, existing, options);
      
      // Mappe Entität auf DTO
      return this.toDTO(processedEntity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.update`, { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht eine Entität
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Ob die Löschung erfolgreich war
   */
  async delete(id: ID, options?: ServiceOptions): Promise<boolean> {
    try {
      // Prüfe, ob Entität existiert
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw this.errorHandler.createNotFoundError(
          `${this.getEntityName()} with ID ${String(id)} not found`
        );
      }
      
      // Führe Business-Logic-Hooks aus
      await this.beforeDelete(id, existing, options);
      
      // Lösche Entität im Repository
      const result = await this.repository.delete(id);
      
      // Führe After-Delete-Hooks aus
      await this.afterDelete(id, existing, options);
      
      // Gib Erfolg zurück
      return result === true || !!result;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.delete`, { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Entitäten anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @param options - Service-Optionen
   * @returns Gefundene Entitäten
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<R[]> {
    try {
      // Mappe Service-Optionen auf Repository-Optionen
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Hole Entitäten vom Repository
      const entities = await this.repository.findByCriteria(criteria, repoOptions);
      
      // Mappe Entitäten auf DTOs
      return entities.map(entity => this.toDTO(entity));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByCriteria`, { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Validiert Daten
   * 
   * @param data - Zu validierende Daten
   * @param isUpdate - Ob es sich um eine Aktualisierung handelt
   * @param entityId - ID der Entität (bei Aktualisierungen)
   */
  async validate(data: C | U, isUpdate: boolean = false, entityId?: number): Promise<void> {
    try {
      // Hole Validierungsschema basierend auf der Operation
      const schema = isUpdate ? this.getUpdateValidationSchema() : this.getCreateValidationSchema();
      
      // Validiere Daten gegen Schema
      const { isValid, errors } = this.validator.validate(data, schema, { throwOnError: false });
      
      // Wenn Validierung fehlschlägt, wirf Validierungsfehler
      if (!isValid) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          errors
        );
      }
      
      // Führe zusätzliche Validierungen aus, falls erforderlich
      await this.validateBusinessRules(data, isUpdate, entityId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error(`Error in ${this.constructor.name}.validate`, { error, data, isUpdate });
      throw this.errorHandler.createValidationError(
        'Validation error',
        [error instanceof Error ? error.message : String(error)]
      );
    }
  }

  /**
   * Führt eine Transaktion aus
   * 
   * @param callback - Callback-Funktion
   * @returns Ergebnis der Transaktion
   */
  async transaction<Result>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<Result>): Promise<Result> {
    try {
      // Verwende Repository, um Transaktion zu verwalten
      return await this.repository.transaction(async () => {
        // Führe Callback aus
        return await callback(this);
      });
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.transaction`, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Führt einen Massenupdate durch
   * 
   * @param ids - IDs der Entitäten
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Anzahl der aktualisierten Entitäten
   */
  async bulkUpdate(ids: ID[], data: U, options?: ServiceOptions): Promise<number> {
    try {
      // Validiere Daten
      await this.validate(data, true);
      
      // Füge Auditinformationen hinzu, falls Kontext vorhanden
      const auditedData = this.addAuditInfo(data, options?.context, 'update');
      
      // Bereite Entitätsdaten vor
      const entityData = this.toEntity(auditedData);
      
      // Rufe Repository auf, um Entitäten zu aktualisieren
      const count = await this.repository.bulkUpdate(ids, entityData);
      
      return count;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.bulkUpdate`, { error, ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Mappt eine Entität auf eine Response DTO
   * 
   * @param entity - Zu mappende Entität
   * @returns Response DTO
   */
  abstract toDTO(entity: T): R;

  /**
   * Mappt eine DTO auf eine Entität
   * 
   * @param dto - DTO-Daten
   * @param existingEntity - Vorhandene Entität (für Updates)
   * @returns Entitätsdaten
   */
  protected abstract toEntity(dto: C | U, existingEntity?: T): Partial<T>;

  /**
   * Gibt das Validierungsschema für die Erstellung zurück
   */
  protected abstract getCreateValidationSchema(): any;

  /**
   * Gibt das Validierungsschema für die Aktualisierung zurück
   */
  protected abstract getUpdateValidationSchema(): any;

  /**
   * Validiert Geschäftsregeln
   * 
   * @param data - Zu validierende Daten
   * @param isUpdate - Ob es sich um eine Aktualisierung handelt
   * @param entityId - ID der Entität (bei Aktualisierungen)
   */
  protected async validateBusinessRules(data: C | U, isUpdate: boolean, entityId?: number): Promise<void> {
    // Standardimplementierung tut nichts
    // Überschreiben in Unterklassen für spezifische Geschäftsregeln
  }

  /**
   * Fügt Auditinformationen zu Daten hinzu
   * 
   * @param data - Zu erweiternde Daten
   * @param context - Kontextinformationen
   * @param operation - Operationstyp
   * @returns Erweiterte Daten
   */
  protected addAuditInfo(data: any, context?: any, operation?: string): any {
    // Klone Daten, um das Original nicht zu verändern
    const result = { ...data };
    
    // Füge Auditfelder hinzu, wenn Kontext Benutzerinformationen enthält
    if (context?.userId) {
      if (operation === 'create') {
        result.createdBy = context.userId;
        result.updatedBy = context.userId; // Setze beide für Erstellungen
      }
      
      if (operation === 'update') {
        result.updatedBy = context.userId;
      }
      
      // Protokolliere die hinzugefügten Auditinformationen
      this.logger.debug(`Adding audit info to ${operation} operation`, {
        entity: this.getEntityName(),
        userId: context.userId,
        operation
      });
    }
    
    return result;
  }

  /**
   * Pre-Create-Hook
   * 
   * @param data - Erstellungsdaten
   * @param options - Service-Optionen
   */
  protected async beforeCreate(data: C, options?: ServiceOptions): Promise<void> {
    // Standardimplementierung tut nichts
    // Überschreiben in Unterklassen für spezifische Logik
  }

  /**
   * Post-Create-Hook
   * 
   * @param entity - Erstellte Entität
   * @param data - Erstellungsdaten
   * @param options - Service-Optionen
   * @returns Verarbeitete Entität
   */
  protected async afterCreate(entity: T, data: C, options?: ServiceOptions): Promise<T> {
    // Standardimplementierung gibt Entität unverändert zurück
    // Überschreiben in Unterklassen für spezifische Logik
    return entity;
  }

  /**
   * Pre-Update-Hook
   * 
   * @param id - ID der Entität
   * @param data - Aktualisierungsdaten
   * @param existingEntity - Vorhandene Entität
   * @param options - Service-Optionen
   */
  protected async beforeUpdate(
    id: ID,
    data: U,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<void> {
    // Standardimplementierung tut nichts
    // Überschreiben in Unterklassen für spezifische Logik
  }

  /**
   * Post-Update-Hook
   * 
   * @param entity - Aktualisierte Entität
   * @param data - Aktualisierungsdaten
   * @param existingEntity - Vorherige Entität
   * @param options - Service-Optionen
   * @returns Verarbeitete Entität
   */
  protected async afterUpdate(
    entity: T,
    data: U,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<T> {
    // Standardimplementierung gibt Entität unverändert zurück
    // Überschreiben in Unterklassen für spezifische Logik
    return entity;
  }

  /**
   * Pre-Delete-Hook
   * 
   * @param id - ID der Entität
   * @param existingEntity - Zu löschende Entität
   * @param options - Service-Optionen
   */
  protected async beforeDelete(
    id: ID,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<void> {
    // Standardimplementierung tut nichts
    // Überschreiben in Unterklassen für spezifische Logik
  }

  /**
   * Post-Delete-Hook
   * 
   * @param id - ID der Entität
   * @param existingEntity - Gelöschte Entität
   * @param options - Service-Optionen
   */
  protected async afterDelete(
    id: ID,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<void> {
    // Standardimplementierung tut nichts
    // Überschreiben in Unterklassen für spezifische Logik
  }

  /**
   * Mappt Service-Optionen auf Repository-Optionen
   * 
   * @param options - Service-Optionen
   * @returns Repository-Optionen
   */
  protected mapToRepositoryOptions(options?: ServiceOptions): any {
    if (!options) {
      return undefined;
    }
    
    // Extrahiere gemeinsame Eigenschaften
    const { relations, withDeleted } = options;
    
    return {
      page: options.page,
      limit: options.limit,
      relations,
      withDeleted
    };
  }

  /**
   * Gibt den Entitätsnamen für Fehlermeldungen zurück
   * 
   * @returns Entitätsname
   */
  protected getEntityName(): string {
    return this.constructor.name.replace('Service', '');
  }

  /**
   * Behandelt und transformiert Fehler
   * 
   * @param error - Ursprünglicher Fehler
   * @returns Transformierter Fehler
   */
  protected handleError(error: unknown): Error {
    // Wenn es bereits ein AppError ist, gib ihn direkt zurück
    if (error instanceof AppError) {
      return error;
    }
    
    // Für allgemeine Fehler extrahiere die Nachricht
    if (error instanceof Error) {
      return this.errorHandler.createError(
        error.message,
        500,
        'internal_error',
        { originalError: error }
      );
    }
    
    // Für andere Typen konvertiere zu String
    return this.errorHandler.createError(
      String(error),
      500,
      'internal_error'
    );
  }
}
