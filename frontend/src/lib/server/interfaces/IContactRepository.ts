/**
 * Interface für das Contact-Repository
 */
export interface IContactRepository {
  /**
   * Erstellt eine neue Kontaktanfrage
   */
  create(data: any): Promise<any>;

  /**
   * Findet eine Kontaktanfrage anhand ihrer ID
   */
  findById(id: number): Promise<any | null>;

  /**
   * Findet alle Kontaktanfragen mit optionaler Filterung
   */
  findAll(filters?: any): Promise<{
    requests: any[];
    total: number;
  }>;

  /**
   * Aktualisiert eine Kontaktanfrage
   */
  update(id: number, data: any): Promise<any>;

  /**
   * Fügt eine Notiz zu einer Kontaktanfrage hinzu
   */
  addNote(requestId: number, userId: number, userName: string, text: string): Promise<any>;

  /**
   * Holt Notizen für eine Kontaktanfrage
   */
  getRequestNotes(requestId: number): Promise<any[]>;

  /**
   * Loggt eine Aktivität für eine Kontaktanfrage
   */
  logActivity(requestId: number, userId: number, userName: string, action: string, details?: string): Promise<void>;

  /**
   * Zählt Kontaktanfragen nach Status
   */
  countByStatus(): Promise<{ status: string; count: number }[]>;
}
