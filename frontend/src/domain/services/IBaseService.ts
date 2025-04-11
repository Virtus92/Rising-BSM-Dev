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
 * Service-Fehler
 */
export class ServiceError extends Error {
  /**
   * Fehlercode
   */
  code: string;
  
  /**
   * Statuscode
   */
  statusCode: number;
  
  /**
   * Fehlerdaten
   */
  data?: any;
  
  /**
   * Konstruktor
   * 
   * @param message - Fehlermeldung
   * @param code - Fehlercode
   * @param statusCode - Statuscode
   * @param data - Fehlerdaten
   */
  constructor(message: string, code: string, statusCode: number = 400, data?: any) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
  }
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
   * @throws ServiceError - Bei Fehlern
   */
  getAll(options?: ServiceOptions): Promise<PaginationResult<R>>;
  
  /**
   * Ruft eine Entität anhand ihrer ID ab
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Gefundene Entität oder null
   * @throws ServiceError - Bei Fehlern
   */
  getById(id: ID, options?: ServiceOptions): Promise<R | null>;
  
  /**
   * Erstellt eine neue Entität
   * 
   * @param data - Erstellungsdaten
   * @param options - Service-Optionen
   * @returns Erstellte Entität
   * @throws ServiceError - Bei Fehlern
   */
  create(data: C, options?: ServiceOptions): Promise<R>;
  
  /**
   * Aktualisiert eine vorhandene Entität
   * 
   * @param id - ID der Entität
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierte Entität
   * @throws ServiceError - Bei Fehlern
   */
  update(id: ID, data: U, options?: ServiceOptions): Promise<R>;
  
  /**
   * Löscht eine Entität
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   * @throws ServiceError - Bei Fehlern
   */
  delete(id: ID, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Findet Entitäten anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @param options - Service-Optionen
   * @returns Gefundene Entitäten
   * @throws ServiceError - Bei Fehlern
   */
  findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<R[]>;
  
  /**
   * Validiert Daten
   * 
   * @param data - Zu validierende Daten
   * @param isUpdate - Ob es sich um eine Aktualisierung handelt
   * @param entityId - ID der Entität (bei Aktualisierungen)
   * @returns Validierungsergebnis
   * @throws ServiceError - Bei Validierungsfehlern
   */
  validate(data: C | U, isUpdate?: boolean, entityId?: number): Promise<import('../dtos/ValidationDto').ValidationResultDto>;
  
  /**
   * Führt eine Transaktion aus
   * 
   * @param callback - Callback-Funktion
   * @returns Ergebnis der Transaktion
   * @throws ServiceError - Bei Fehlern
   */
  transaction<Result>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<Result>): Promise<Result>;
  
  /**
   * Führt einen Massenupdate durch
   * 
   * @param ids - IDs der Entitäten
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Anzahl der aktualisierten Entitäten
   * @throws ServiceError - Bei Fehlern
   */
  bulkUpdate(ids: ID[], data: U, options?: ServiceOptions): Promise<number>;
  
  /**
   * Konvertiert eine Entität in eine Response DTO
   * 
   * @param entity - Entität
   * @returns Response DTO
   */
  toDTO(entity: T): R;
  
  /**
   * Konvertiert eine DTO in eine Entität
   * 
   * @param dto - DTO
   * @returns Entität
   */
  fromDTO(dto: C | U): Partial<T>;
  
  /**
   * Erweiterte Suche
   * 
   * @param searchText - Suchbegriff
   * @param options - Service-Optionen
   * @returns Suchergebnisse
   * @throws ServiceError - Bei Fehlern
   */
  search(searchText: string, options?: ServiceOptions): Promise<R[]>;
  
  /**
   * Prüft, ob eine Entität existiert
   * 
   * @param id - ID der Entität
   * @param options - Service-Optionen
   * @returns Ob die Entität existiert
   */
  exists(id: ID, options?: ServiceOptions): Promise<boolean>;
}