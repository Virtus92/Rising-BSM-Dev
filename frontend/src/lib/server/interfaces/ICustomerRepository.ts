/**
 * Interface für das Customer-Repository
 */
export interface ICustomerRepository {
  /**
   * Erstellt einen neuen Kunden
   */
  create(data: any): Promise<any>;

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
  update(id: number, data: any): Promise<any>;

  /**
   * Löscht einen Kunden
   */
  delete(id: number): Promise<boolean>;

  /**
   * Sucht nach Kunden basierend auf einem Suchbegriff
   */
  search(searchTerm: string): Promise<any[]>;

  /**
   * Zählt Kunden nach Status
   */
  countByStatus(): Promise<{ status: string; count: number }[]>;

  /**
   * Loggt eine Kundenaktivität
   */
  logActivity(customerId: number, userId: number, userName: string, action: string, details?: string): Promise<void>;
}
