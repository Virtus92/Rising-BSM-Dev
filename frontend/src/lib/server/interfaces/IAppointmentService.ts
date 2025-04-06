/**
 * Interface für den Appointment-Service
 */
export interface IAppointmentService {
  /**
   * Erstellt einen neuen Termin
   */
  create(data: any, userId: number, userName: string): Promise<any>;

  /**
   * Findet einen Termin anhand seiner ID
   */
  findById(id: number): Promise<any | null>;

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
  update(id: number, data: any, userId: number, userName: string): Promise<any>;

  /**
   * Ändert den Status eines Termins
   */
  updateStatus(id: number, status: string, userId: number, userName: string): Promise<any>;

  /**
   * Löscht einen Termin
   */
  delete(id: number, userId: number, userName: string): Promise<boolean>;

  /**
   * Fügt eine Notiz zu einem Termin hinzu
   */
  addNote(appointmentId: number, userId: number, userName: string, text: string): Promise<any>;

  /**
   * Holt Notizen für einen Termin
   */
  getAppointmentNotes(appointmentId: number): Promise<any[]>;

  /**
   * Validiert Termindaten für die Erstellung/Aktualisierung
   */
  validateAppointmentData(data: any, isUpdate?: boolean): { isValid: boolean; errors?: any };

  /**
   * Holt bevorstehende Termine
   */
  getUpcomingAppointments(limit?: number): Promise<any[]>;

  /**
   * Holt Terminstatistiken
   */
  getAppointmentStatistics(): Promise<any>;
}
