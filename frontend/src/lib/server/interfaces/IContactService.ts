/**
 * Interface für den Contact-Service
 */
export interface IContactService {
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
  update(id: number, data: any, userId: number, userName: string): Promise<any>;

  /**
   * Aktualisiert den Status einer Kontaktanfrage
   */
  updateStatus(id: number, status: string, userId: number, userName: string): Promise<any>;

  /**
   * Fügt eine Notiz zu einer Kontaktanfrage hinzu
   */
  addNote(requestId: number, userId: number, userName: string, text: string): Promise<any>;

  /**
   * Holt Notizen für eine Kontaktanfrage
   */
  getRequestNotes(requestId: number): Promise<any[]>;

  /**
   * Validiert Kontaktanfragedaten
   */
  validateContactData(data: any): { isValid: boolean; errors?: any };
}
