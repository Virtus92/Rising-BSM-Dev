/**
 * Interface für das Project-Repository
 */
export interface IProjectRepository {
  /**
   * Erstellt ein neues Projekt
   */
  create(data: any): Promise<any>;

  /**
   * Findet ein Projekt anhand seiner ID
   */
  findById(id: number, includeRelations?: boolean): Promise<any | null>;

  /**
   * Findet alle Projekte mit optionaler Filterung
   */
  findAll(filters?: any): Promise<{
    projects: any[];
    total: number;
  }>;

  /**
   * Findet Projekte nach Kunde
   */
  findByCustomer(customerId: number): Promise<any[]>;

  /**
   * Findet Projekte nach Service
   */
  findByService(serviceId: number): Promise<any[]>;

  /**
   * Aktualisiert ein Projekt
   */
  update(id: number, data: any): Promise<any>;

  /**
   * Löscht ein Projekt
   */
  delete(id: number): Promise<boolean>;

  /**
   * Sucht nach Projekten basierend auf einem Suchbegriff
   */
  search(searchTerm: string): Promise<any[]>;

  /**
   * Fügt eine Notiz zu einem Projekt hinzu
   */
  addNote(projectId: number, userId: number, userName: string, text: string): Promise<any>;

  /**
   * Holt Notizen für ein Projekt
   */
  getProjectNotes(projectId: number): Promise<any[]>;

  /**
   * Zählt Projekte nach Status
   */
  countByStatus(): Promise<any[]>;

  /**
   * Holt Projekte für das Dashboard
   */
  getRecentProjects(limit?: number): Promise<any[]>;
}
