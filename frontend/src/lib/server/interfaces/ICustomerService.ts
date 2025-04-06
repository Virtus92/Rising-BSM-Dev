/**
 * Interface für den Customer-Service
 */
export interface ICustomerService {
  /**
   * Erstellt einen neuen Kunden
   */
  create(data: any, userId: number, userName: string): Promise<any>;

  /**
   * Findet einen Kunden anhand seiner ID
   */
  findById(id: number): Promise<any | null>;

  /**
   * Findet alle Kunden mit optionaler Filterung
   */
  findAll(filters?: any): Promise<any[]>;

  /**
   * Aktualisiert einen Kunden
   */
  update(id: number, data: any, userId: number, userName: string): Promise<any>;

  /**
   * Löscht einen Kunden
   */
  delete(id: number, userId: number, userName: string): Promise<boolean>;

  /**
   * Sucht nach Kunden basierend auf einem Suchbegriff
   */
  search(searchTerm: string): Promise<any[]>;

  /**
   * Validiert Kundendaten für die Erstellung
   */
  validateCustomerData(data: any): { isValid: boolean; errors?: any };

  /**
   * Holt Kundenstatistiken
   */
  getCustomerStatistics(): Promise<any>;
}
