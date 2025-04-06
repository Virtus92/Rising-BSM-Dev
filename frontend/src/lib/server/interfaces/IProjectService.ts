/**
 * Interface für den Project-Service
 */
export interface IProjectService {
  /**
   * Erstellt ein neues Projekt
   */
  create(data: any, userId: number, userName: string): Promise<any>;

  /**
   * Findet ein Projekt anhand seiner ID
   */
  findById(id: number): Promise<any | null>;

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
  update(id: number, data: any, userId: number, userName: string): Promise<any>;

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
   * Validiert Projektdaten für die Erstellung/Aktualisierung
   */
  validateProjectData(data: any, isUpdate?: boolean): { isValid: boolean; errors?: any };

  /**
   * Holt Projektstatistiken (nach Status, Service, etc.)
   */
  getProjectStatistics(): Promise<any>;

  /**
   * Holt aktuelle Projekte für das Dashboard
   */
  getRecentProjects(limit?: number): Promise<any[]>;
}
