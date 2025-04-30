/**
 * Paginierungsergebnis
 */
export interface PaginationResult<T> {
  /**
   * Daten
   */
  data: T[];
  
  /**
   * Paginierungsinformationen
   */
  pagination: {
    /**
     * Aktuelle Seite
     */
    page: number;
    
    /**
     * Einträge pro Seite
     */
    limit: number;
    
    /**
     * Gesamtanzahl der Einträge
     */
    total: number;
    
    /**
     * Gesamtanzahl der Seiten
     */
    totalPages: number;
  };
}

/**
 * Sortieroptionen
 */
export interface SortOptions {
  /**
   * Sortierfeld
   */
  field: string;
  
  /**
   * Sortierrichtung
   */
  direction: 'asc' | 'desc';
}

/**
 * Abfrageoptionen
 */
export interface QueryOptions {
  /**
   * Seitennummer
   */
  page?: number;
  
  /**
   * Einträge pro Seite
   */
  limit?: number;
  
  /**
   * Auszuwählende Felder
   */
  select?: string[];
  
  /**
   * Zu ladende Beziehungen
   */
  relations?: string[];
  
  /**
   * Sortieroptionen
   */
  sort?: SortOptions;
  
  /**
   * Gelöschte Einträge einbeziehen
   */
  withDeleted?: boolean;
}

/**
 * Basis-Repository-Interface
 * 
 * Definiert gemeinsame Datenzugriffsmethoden für alle Entitäten.
 * 
 * @template T - Entitätstyp
 * @template ID - Typ des Primärschlüssels
 */
export interface IBaseRepository<T, ID = number> {
  /**
   * Findet alle Entitäten
   * 
   * @param options - Abfrageoptionen
   * @returns Entitäten mit Paginierung
   */
  findAll(options?: QueryOptions): Promise<PaginationResult<T>>;
  
  /**
   * Findet eine Entität anhand ihrer ID
   * 
   * @param id - ID der Entität
   * @param options - Abfrageoptionen
   * @returns Gefundene Entität oder null
   */
  findById(id: ID, options?: QueryOptions): Promise<T | null>;
  
  /**
   * Findet Entitäten anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @param options - Abfrageoptionen
   * @returns Gefundene Entitäten
   */
  findByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T[]>;
  
  /**
   * Findet eine Entität anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @param options - Abfrageoptionen
   * @returns Gefundene Entität oder null
   */
  findOneByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T | null>;
  
  /**
   * Erstellt eine neue Entität
   * 
   * @param data - Entitätsdaten
   * @returns Erstellte Entität
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Aktualisiert eine vorhandene Entität
   * 
   * @param id - ID der Entität
   * @param data - Aktualisierte Daten
   * @returns Aktualisierte Entität
   */
  update(id: ID, data: Partial<T>): Promise<T>;
  
  /**
   * Löscht eine Entität
   * 
   * @param id - ID der Entität
   * @returns Erfolg der Operation
   */
  delete(id: ID): Promise<boolean>;
  
  /**
   * Zählt Entitäten anhand von Kriterien
   * 
   * @param criteria - Filterkriterien
   * @returns Anzahl
   */
  count(criteria?: Record<string, any>): Promise<number>;
  
  /**
   * Führt einen Massenupdate durch
   * 
   * @param ids - IDs der Entitäten
   * @param data - Aktualisierte Daten
   * @returns Anzahl der aktualisierten Entitäten
   */
  bulkUpdate(ids: ID[], data: Partial<T>): Promise<number>;
  
  /**
   * Führt eine Transaktion aus
   * 
   * @param callback - Callback-Funktion, die das Repository als Parameter erhält
   * @returns Ergebnis der Transaktion
   */
  transaction<R>(callback: (repo: any) => Promise<R>): Promise<R>;
}