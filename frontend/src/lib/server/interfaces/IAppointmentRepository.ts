/**
 * Interface für das Appointment-Repository
 */
export interface IAppointmentRepository {
  /**
   * Erstellt einen neuen Termin
   */
  create(data: any): Promise<any>;

  /**
   * Findet einen Termin anhand seiner ID
   */
  findById(id: number, includeRelations?: boolean): Promise<any | null>;

  /**
   * Findet alle Termine mit optionaler Filterung
   */
  findAll(filters?: any): Promise<{
    appointments: any[];
    total: number;
  }>;

  /**
   * Findet Termine nach Kunde
   */
  findByCustomer(customerId: number): Promise<any[]>;

  /**
   * Findet Termine nach Projekt
   */
  findByProject(projectId: number): Promise<any[]>;

  /**
   * Findet Termine nach Zeitraum
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;

  /**
   * Aktualisiert einen Termin
   */
  update(id: number, data: any): Promise<any>;

  /**
   * Löscht einen Termin
   */
  delete(id: number): Promise<boolean>;

  /**
   * Fügt eine Notiz zu einem Termin hinzu
   */
  addNote(appointmentId: number, userId: number, userName: string, text: string): Promise<any>;

  /**
   * Holt Notizen für einen Termin
   */
  getAppointmentNotes(appointmentId: number): Promise<any[]>;

  /**
   * Loggt eine Aktivität für einen Termin
   */
  logActivity(appointmentId: number, userId: number, userName: string, action: string, details?: string): Promise<void>;

  /**
   * Zählt Termine nach Status
   */
  countByStatus(): Promise<{ status: string; count: number }[]>;

  /**
   * Holt bevorstehende Termine
   */
  getUpcomingAppointments(limit?: number): Promise<any[]>;
}
