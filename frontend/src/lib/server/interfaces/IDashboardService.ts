/**
 * Interface für den Dashboard-Service
 * Stellt Aggregationsfunktionen für das Dashboard bereit
 */
export interface IDashboardService {
  /**
   * Holt Kennzahlen für das Dashboard
   */
  getMetrics(): Promise<{
    customers: {
      total: number;
      active: number;
      new: number;
    };
    projects: {
      total: number;
      active: number;
      completed: number;
    };
    appointments: {
      upcoming: number;
      total: number;
      today: number;
    };
    services: {
      active: number;
    };
    notifications: {
      unread: number;
    };
  }>;

  /**
   * Holt aktuelle Projekte für das Dashboard
   */
  getRecentProjects(limit?: number): Promise<any[]>;

  /**
   * Holt bevorstehende Termine für das Dashboard
   */
  getUpcomingAppointments(limit?: number): Promise<any[]>;

  /**
   * Holt Statistiken zu Projekten nach Status
   */
  getProjectStatsByStatus(): Promise<any[]>;

  /**
   * Holt Statistiken zu Terminen nach Status
   */
  getAppointmentStatsByStatus(): Promise<any[]>;

  /**
   * Holt Statistiken zu Kunden nach Status
   */
  getCustomerStatsByStatus(): Promise<any[]>;

  /**
   * Holt aktuelle Aktivitäten für das Dashboard
   */
  getRecentActivities(limit?: number): Promise<any[]>;
}
