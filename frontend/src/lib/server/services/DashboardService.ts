import { PrismaClient } from '@prisma/client';
import { IDashboardService } from '../interfaces/IDashboardService';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IProjectService } from '../interfaces/IProjectService';
import { IAppointmentService } from '../interfaces/IAppointmentService';
import { INotificationService } from '../interfaces/INotificationService';

/**
 * Service für die Bereitstellung von Dashboard-Daten
 */
export class DashboardService implements IDashboardService {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private projectService: IProjectService,
    private appointmentService: IAppointmentService,
    private notificationService: INotificationService
  ) {}

  /**
   * Holt Kennzahlen für das Dashboard
   */
  async getMetrics() {
    try {
      this.logger.debug('DashboardService.getMetrics');
      
      // Kundenzahlen
      const totalCustomers = await this.prisma.customer.count();
      const activeCustomers = await this.prisma.customer.count({
        where: { status: 'active' }
      });
      
      // Neue Kunden in den letzten 30 Tagen
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newCustomers = await this.prisma.customer.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });
      
      // Projektzahlen
      const totalProjects = await this.prisma.project.count();
      const activeProjects = await this.prisma.project.count({
        where: {
          status: {
            in: ['new', 'in_progress']
          }
        }
      });
      const completedProjects = await this.prisma.project.count({
        where: { status: 'completed' }
      });
      
      // Terminzahlen
      const totalAppointments = await this.prisma.appointment.count();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayAppointments = await this.prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          status: {
            notIn: ['cancelled']
          }
        }
      });
      
      const upcomingAppointments = await this.prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today
          },
          status: {
            in: ['planned', 'confirmed']
          }
        }
      });
      
      // Service-Zahlen
      const activeServices = await this.prisma.service.count({
        where: { active: true }
      });
      
      // Ungelesene Benachrichtigungen werden pro Benutzer berechnet,
      // für Dashboard-Metriken ist die Gesamtzahl aller ungelesenen Nachrichten relevant
      const unreadNotifications = await this.prisma.notification.count({
        where: { read: false }
      });
      
      return {
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          new: newCustomers
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects
        },
        appointments: {
          total: totalAppointments,
          today: todayAppointments,
          upcoming: upcomingAppointments
        },
        services: {
          active: activeServices
        },
        notifications: {
          unread: unreadNotifications
        }
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'DashboardService.getMetrics');
    }
  }

  /**
   * Holt aktuelle Projekte für das Dashboard
   */
  async getRecentProjects(limit = 5) {
    try {
      this.logger.debug('DashboardService.getRecentProjects', { limit });
      
      return await this.projectService.getRecentProjects(limit);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'DashboardService.getRecentProjects');
    }
  }

  /**
   * Holt bevorstehende Termine für das Dashboard
   */
  async getUpcomingAppointments(limit = 5) {
    try {
      this.logger.debug('DashboardService.getUpcomingAppointments', { limit });
      
      return await this.appointmentService.getUpcomingAppointments(limit);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'DashboardService.getUpcomingAppointments');
    }
  }

  /**
   * Holt Statistiken zu Projekten nach Status
   */
  async getProjectStatsByStatus() {
    try {
      this.logger.debug('DashboardService.getProjectStatsByStatus');
      
      const stats = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM "Project"
        GROUP BY status
        ORDER BY count DESC
      `;
      
      return stats;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'DashboardService.getProjectStatsByStatus');
    }
  }

  /**
   * Holt Statistiken zu Terminen nach Status
   */
  async getAppointmentStatsByStatus() {
    try {
      this.logger.debug('DashboardService.getAppointmentStatsByStatus');
      
      const stats = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM "Appointment"
        GROUP BY status
        ORDER BY count DESC
      `;
      
      return stats;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'DashboardService.getAppointmentStatsByStatus');
    }
  }

  /**
   * Holt Statistiken zu Kunden nach Status
   */
  async getCustomerStatsByStatus() {
    try {
      this.logger.debug('DashboardService.getCustomerStatsByStatus');
      
      const stats = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM "Customer"
        GROUP BY status
        ORDER BY count DESC
      `;
      
      return stats;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'DashboardService.getCustomerStatsByStatus');
    }
  }

  /**
   * Holt aktuelle Aktivitäten für das Dashboard
   */
  async getRecentActivities(limit = 10) {
    try {
      this.logger.debug('DashboardService.getRecentActivities', { limit });
      
      // Kombiniere verschiedene Aktivitäten aus verschiedenen Tabellen
      // Hier als Beispiel: Projekt-, Kunden- und Termin-Logs
      
      // Projektnotizen
      const projectNotes = await this.prisma.projectNote.findMany({
        select: {
          id: true,
          projectId: true,
          userId: true,
          userName: true,
          text: true,
          createdAt: true,
          project: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      // Kundenaktivitäten
      const customerLogs = await this.prisma.customerLog.findMany({
        select: {
          id: true,
          customerId: true,
          userId: true,
          userName: true,
          action: true,
          details: true,
          createdAt: true,
          customer: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      // Terminnotizen
      const appointmentNotes = await this.prisma.appointmentNote.findMany({
        select: {
          id: true,
          appointmentId: true,
          userId: true,
          userName: true,
          text: true,
          createdAt: true,
          appointment: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      // Aktivitäten zusammenfassen und nach Datum sortieren
      const projectActivities = projectNotes.map(note => ({
        id: `project-${note.id}`,
        type: 'project',
        subType: 'note',
        userId: note.userId,
        userName: note.userName,
        title: `Projekt: ${note.project?.title || 'Unbekannt'}`,
        content: note.text,
        createdAt: note.createdAt,
        referenceId: note.projectId,
        referenceType: 'project'
      }));
      
      const customerActivities = customerLogs.map(log => ({
        id: `customer-${log.id}`,
        type: 'customer',
        subType: 'action',
        userId: log.userId,
        userName: log.userName,
        title: `Kunde: ${log.customer?.name || 'Unbekannt'}`,
        content: log.details || log.action,
        createdAt: log.createdAt,
        referenceId: log.customerId,
        referenceType: 'customer'
      }));
      
      const appointmentActivities = appointmentNotes.map(note => ({
        id: `appointment-${note.id}`,
        type: 'appointment',
        subType: 'note',
        userId: note.userId,
        userName: note.userName,
        title: `Termin: ${note.appointment?.title || 'Unbekannt'}`,
        content: note.text,
        createdAt: note.createdAt,
        referenceId: note.appointmentId,
        referenceType: 'appointment'
      }));
      
      // Alle Aktivitäten kombinieren und nach Datum sortieren
      const allActivities = [
        ...projectActivities,
        ...customerActivities,
        ...appointmentActivities
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
       .slice(0, limit);
      
      return allActivities;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'DashboardService.getRecentActivities');
    }
  }
}
