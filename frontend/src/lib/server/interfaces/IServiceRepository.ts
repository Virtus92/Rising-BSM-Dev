/**
 * Interface für das Service-Repository
 * Verwaltet die angebotenen Dienstleistungen
 */
export interface IServiceRepository {
  /**
   * Erstellt einen neuen Service
   */
  create(data: any): Promise<any>;

  /**
   * Findet einen Service anhand seiner ID
   */
  findById(id: number): Promise<any | null>;

  /**
   * Findet alle Services mit optionaler Filterung
   */
  findAll(filters?: any): Promise<{
    services: any[];
    total: number;
  }>;

  /**
   * Aktualisiert einen Service
   */
  update(id: number, data: any): Promise<any>;

  /**
   * Löscht einen Service
   */
  delete(id: number): Promise<boolean>;

  /**
   * Sucht nach Services basierend auf einem Suchbegriff
   */
  search(searchTerm: string): Promise<any[]>;

  /**
   * Loggt eine Aktivität für einen Service
   */
  logActivity(serviceId: number, userId: number, userName: string, action: string, details?: string): Promise<void>;

  /**
   * Findet aktive Services (für Dropdown-Listen)
   */
  findActive(): Promise<any[]>;
}
