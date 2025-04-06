/**
 * Interface für den Service-Service
 * Geschäftslogik für die Verwaltung von Dienstleistungen
 */
export interface IServiceService {
  /**
   * Erstellt einen neuen Service
   */
  create(data: any, userId: number, userName: string): Promise<any>;

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
  update(id: number, data: any, userId: number, userName: string): Promise<any>;

  /**
   * Löscht einen Service
   */
  delete(id: number, userId: number, userName: string): Promise<boolean>;

  /**
   * Sucht nach Services basierend auf einem Suchbegriff
   */
  search(searchTerm: string): Promise<any[]>;

  /**
   * Validiert Service-Daten für die Erstellung/Aktualisierung
   */
  validateServiceData(data: any, isUpdate?: boolean): { isValid: boolean; errors?: any };

  /**
   * Findet aktive Services (für Dropdown-Listen)
   */
  findActive(): Promise<any[]>;

  /**
   * Berechnet den Gesamtpreis für einen Service (inkl. MwSt)
   */
  calculateTotalPrice(basePrice: number, vatRate: number): { basePrice: number; vatAmount: number; totalPrice: number };
}
