/**
 * Basis-DTO für Abfrageparameter
 */
export interface BaseFilterParamsDto {
  /**
   * Suchtext
   */
  search?: string;
  
  /**
   * Seitennummer
   */
  page?: number;
  
  /**
   * Einträge pro Seite
   */
  limit?: number;
  
  /**
   * Sortierfeld
   */
  sortBy?: string;
  
  /**
   * Sortierrichtung
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Startdatum für die Filterung
   */
  startDate?: Date;
  
  /**
   * Enddatum für die Filterung
   */
  endDate?: Date;
}

/**
 * Basis-DTO für Antworten
 */
export interface BaseResponseDto {
  /**
   * Entitäts-ID
   */
  id: number;
  
  /**
   * Erstellungszeitpunkt
   */
  createdAt: string;
  
  /**
   * Aktualisierungszeitpunkt
   */
  updatedAt: string;
  
  /**
   * ID des erstellenden Benutzers
   */
  createdBy?: number;
  
  /**
   * ID des aktualisierenden Benutzers
   */
  updatedBy?: number;
}

/**
 * Basis-DTO für Paginierungsergebnisse
 */
export interface PaginationResultDto<T> {
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
