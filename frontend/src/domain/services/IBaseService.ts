import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * Service-Optionen
 */
export interface ServiceOptions {
  /**
   * Kontext der Operation
   */
  context?: {
    /**
     * Benutzer-ID
     */
    userId?: number;
    
    /**
     * IP-Adresse
     */
    ipAddress?: string;
    
    /**
     * Benutzerdefinierte Daten
     */
    [key: string]: any;
  };
  
  /**
   * Zu ladende Beziehungen
   */
  relations?: string[];
  
  /**
   * Gelöschte Einträge einbeziehen
   */
  withDeleted?: boolean;
}

/**
 * Basis-Service-Interface
 * 
 * Definiert gemeinsame Geschäftsoperationen für alle Entitäten.
 * 
 * @template T - Entitätstyp
 * @template C - Typ für Create DTO
 * @template U - Typ für Update DTO
 * @template R - Typ für Response DTO
 * @template ID - Typ des Primärschlüssels
 */
export interface IBaseService<T, C, U, R, ID = number> {
  /**
   * Ruft alle Entitäten ab
   * 
   * @param options - Service-Optionen
   * @returns Entitäten mit Paginierung
   */
  getAll(options?: ServiceOptions): Promise<PaginationResult<R>>;
  
  /**
   * Ruft eine Entität anhand ihrer ID ab
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Gefundene Entität oder null
   */
  getById(id: ID, options?: ServiceOptions): Promise<R | null>;
  
  /**
   * Erstellt eine neue Entität
   * 
   * @param data - Erstellungsdaten
   * @param options - Service-Optionen
   * @returns Erstellte Entität
   */
  create(data: C, options?: ServiceOptions): Promise<R>;
  
  /**
   * Aktualisiert eine vorhandene Entität
   * 
   * @param id - ID der Entität
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierte Entität
   */
  update(id: ID, data: U, options?: ServiceOptions): Promise<R>;
  
  /**
   * Löscht eine Entität
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  delete(id: ID, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Findet Entitäten anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @param options - Service-Optionen
   * @returns Gefundene Entitäten
   */
  findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<R[]>;
  
  /**
   * Validiert Daten
   * 
   * @param data - Zu validierende Daten
   * @param isUpdate - Ob es sich um eine Aktualisierung handelt
   * @param entityId - ID der Entität (bei Aktualisierungen)
   */
  validate(data: C | U, isUpdate?: boolean, entityId?: number): Promise<void>;
  
  /**
   * Führt eine Transaktion aus
   * 
   * @param callback - Callback-Funktion
   * @returns Ergebnis der Transaktion
   */
  transaction<R>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<R>): Promise<R>;
  
  /**
   * Führt einen Massenupdate durch
   * 
   * @param ids - IDs der Entitäten
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Anzahl der aktualisierten Entitäten
   */
  bulkUpdate(ids: ID[], data: U, options?: ServiceOptions): Promise<number>;
  
  /**
   * Konvertiert eine Entität in eine Response DTO
   * 
   * @param entity - Entität
   * @returns Response DTO
   */
  toDTO(entity: T): R;
}
