import { 
  IBaseService, 
  ServiceOptions 
} from '@/domain/services/IBaseService';
import { IBaseRepository, PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { IErrorHandler, AppError, ValidationError } from '@/infrastructure/common/error/ErrorHandler';
import { ValidationResult, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { ValidationResultDto } from '@/domain/dtos/ValidationDto';

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
export abstract class BaseService<T, C extends Record<string, any>, U extends Record<string, any>, R, ID = number> implements IBaseService<T, C, U, R, ID> {
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
   * Gets the repository instance
   * This allows direct repository access when needed for specific operations
   * 
   * @returns The repository instance
   */
  public getRepository(): IBaseRepository<T, ID> {
    return this.repository;
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
      const validationResult = await this.validate(data);
      
      // Prüfe auf Validierungsfehler
      if (validationResult.result === ValidationResult.ERROR) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          validationResult.errors?.map(e => e.message) || []
        );
      }
      
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
      const validationResult = await this.validate(data, true, id as any);
      
      // Prüfe auf Validierungsfehler
      if (validationResult.result === ValidationResult.ERROR) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          validationResult.errors?.map(e => e.message) || []
        );
      }
      
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
   * @returns Validierungsergebnis
   */
  async validate(data: C | U, isUpdate: boolean = false, entityId?: number): Promise<ValidationResultDto> {
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
      
      // Rückgabe eines erfolgreichen Validierungsergebnisses
      return {
        result: ValidationResult.SUCCESS,
        data: data
      };
    } catch (error) {
      if (error instanceof AppError) {
        // Erstelle Validierungsfehler im Domain-Format
        const errorDtos = error instanceof ValidationError ? 
          error.errors?.map(e => ({
            type: ValidationErrorType.FORMAT,
            field: e.split(':')[0]?.trim() || 'unknown',
            message: e
          })) : 
          [{
            type: ValidationErrorType.OTHER,
            field: 'general',
            message: error.message
          }];

        return {
          result: ValidationResult.ERROR,
          errors: errorDtos
        };
      }
      
      this.logger.error(`Error in ${this.constructor.name}.validate`, { error, data, isUpdate });
      
      // Erstelle allgemeinen Validierungsfehler
      return {
        result: ValidationResult.ERROR,
        errors: [{
          type: ValidationErrorType.OTHER,
          field: 'general',
          message: error instanceof Error ? error.message : String(error)
        }]
      };
    }
  }

  /**
   * Counts entities based on criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Number of entities
   */
  async count(criteria?: Record<string, any>, options?: ServiceOptions): Promise<number> {
    try {
      // Repository count method only accepts criteria parameter
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.count`, { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Finds all entities (alias for getAll)
   * 
   * @param options - Service options
   * @returns Paginated result of entities
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<R>> {
    return this.getAll(options);
  }

  async transaction<r>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<r>): Promise<r> {
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
      const validationResult = await this.validate(data, true);
      
      // Prüfe auf Validierungsfehler
      if (validationResult.result === ValidationResult.ERROR) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          validationResult.errors?.map(e => e.message) || []
        );
      }
      
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
   * Führt eine erweiterte Suche durch
   * 
   * @param searchText - Suchtext
   * @param options - Service-Optionen
   * @returns Gefundene Entitäten
   */
  async search(searchText: string, options?: ServiceOptions): Promise<R[]> {
    // Standardimplementierung verwendet findByCriteria mit Name und andere häufig gesuchte Felder
    // Sollte in Unterklassen überschrieben werden für spezifische Suchlogik
    try {
      const criteria: Record<string, any> = {};
      
      if (searchText && searchText.trim() !== '') {
        // Füge grundlegende Suchkriterien hinzu (sollte in Unterklassen angepasst werden)
        criteria.name = searchText; // Annahme: Die meisten Entitäten haben ein "name" Feld
      }
      
      return await this.findByCriteria(criteria, options);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.search`, { error, searchText });
      throw this.handleError(error);
    }
  }

  /**
   * Prüft, ob eine Entität existiert
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Ob die Entität existiert
   */
  async exists(id: ID, options?: ServiceOptions): Promise<boolean> {
    try {
      // Prüfe über Repository, ob Entität existiert
      const entity = await this.repository.findById(id, this.mapToRepositoryOptions(options));
      return !!entity;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.exists`, { error, id });
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
   * Konvertiert eine DTO in eine Entität
   * 
   * @param dto - DTO
   * @returns Entität
   */
  fromDTO(dto: C | U): Partial<T> {
    return this.toEntity(dto);
  }

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
    
    // Type assertion for pagination options that might be passed from older code
    const serviceOptions = options as any;
    
    // Add sort options if they exist
    const sortOptions = options.sort ? {
      sort: {
        field: options.sort.field,
        direction: options.sort.direction || 'asc'
      }
    } : {};
    
    this.logger.debug(`Mapping service options to repository options with sort:`, sortOptions);
    
    return {
      page: serviceOptions.page,
      limit: serviceOptions.limit,
      relations,
      withDeleted,
      ...sortOptions
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
