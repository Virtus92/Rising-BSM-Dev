// Serverinitialisierung zuerst importieren
import '@/lib/server/init';

import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/server/core/api-handler';
import { IDashboardService } from '@/lib/server/interfaces/IDashboardService';
import { withAuth } from '@/lib/server/core/auth';
import { ILoggingService } from '@/lib/server/interfaces/ILoggingService';

// Dienste, die für diese Route aufgelöst werden sollen
const SERVICES_TO_RESOLVE = ['DashboardService', 'LoggingService'];

/**
 * GET /api/dashboard
 * Holt alle Daten für das Dashboard in einem Aufruf
 */
export const GET = withAuth(
  async (req: NextRequest, user, services) => {
    const { logger, DashboardService } = services as {
      logger: ILoggingService;
      DashboardService: IDashboardService;
    };
    
    logger.debug('Dashboard-Daten-Anfrage empfangen');
    
    try {
      // Alle Dashboard-Daten parallel laden für bessere Performance
      const [
        metrics,
        recentProjects,
        upcomingAppointments,
        projectStats,
        appointmentStats,
        customerStats,
        recentActivities
      ] = await Promise.all([
        DashboardService.getMetrics(),
        DashboardService.getRecentProjects(5),
        DashboardService.getUpcomingAppointments(5),
        DashboardService.getProjectStatsByStatus(),
        DashboardService.getAppointmentStatsByStatus(),
        DashboardService.getCustomerStatsByStatus(),
        DashboardService.getRecentActivities(10)
      ]);
      
      // Verarbeite Termine, um sicherzustellen, dass Kundendaten als Strings vorhanden sind
      const processedAppointments = upcomingAppointments.map((appointment: any) => {
        // Wenn customer ein Objekt ist, extrahiere den Namen
        if (appointment.customer && typeof appointment.customer === 'object') {
          appointment.customerName = appointment.customer.name || 'Kein Name';
          // Setze customer als String (nur zur Sicherheit)
          appointment.customer = appointment.customerName;
        } else if (!appointment.customerName && typeof appointment.customer === 'string') {
          appointment.customerName = appointment.customer;
        } else if (!appointment.customer && !appointment.customerName) {
          appointment.customerName = 'Kein Kunde zugewiesen';
          appointment.customer = 'Kein Kunde zugewiesen';
        }
        
        return appointment;
      });
      
      // Chart-Daten aus den Statistiken erstellen
      const projectStatusChart = {
        labels: (projectStats as any[]).map(stat => stat.status),
        data: (projectStats as any[]).map(stat => Number(stat.count))
      };
      
      const appointmentStatusChart = {
        labels: (appointmentStats as any[]).map(stat => stat.status),
        data: (appointmentStats as any[]).map(stat => Number(stat.count))
      };
      
      const customerStatusChart = {
        labels: (customerStats as any[]).map(stat => stat.status),
        data: (customerStats as any[]).map(stat => Number(stat.count))
      };
      
      // Leeres Chart für Revenue, wenn keine Daten vorhanden sind
      const revenueChart = {
        labels: [],
        data: []
      };
      
      // TODO: Revenue-Daten abrufen
      logger.warn('Revenue Chart benötigt Implementierung vom Backend!');
      
      // Dashboard-Daten zusammenstellen
      const dashboardData = {
        stats: {
          // Metriken in dem Format umstrukturieren, das das Frontend erwartet
          totalCustomers: { count: metrics.customers.total, trend: metrics.customers.new || 0 },
          activeProjects: { count: metrics.projects.active, trend: 0 },
          newRequests: { count: metrics.projects.active - metrics.projects.completed, trend: 0 },
          
          // Originale Metriken beibehalten für vollständige Daten
          customers: metrics.customers,
          projects: metrics.projects,
          appointments: metrics.appointments,
          services: metrics.services,
          notifications: metrics.notifications
        },
        
        // Chart-Daten
        charts: {
        revenue: revenueChart,
        projectStatus: projectStatusChart,
        appointmentStatus: appointmentStatusChart,
        customerStatus: customerStatusChart,
        services: projectStatusChart // Als Ersatz verwenden wir die Projektstatistiken
        },
        
        // Einfacher Zugriff auf Revenue-Chart (für bestehende Integration)
        revenue: revenueChart,
        
        // Listen-Daten
        recentProjects,
        upcomingAppointments: processedAppointments,
        recentActivity: recentActivities,
        
        // Zusätzliche leere Arrays für Kompatibilität
        notifications: []
      };
      
      logger.info('Dashboard-Daten erfolgreich geladen', {
        projectCount: recentProjects.length,
        appointmentCount: processedAppointments.length,
        activityCount: recentActivities.length
      });
      
      return NextResponse.json({
        success: true,
        data: dashboardData,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Fehler beim Laden der Dashboard-Daten', error);
      
      const statusCode = error.statusCode || 500;
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Interner Serverfehler beim Laden der Dashboard-Daten',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: statusCode }
      );
    }
  },
  SERVICES_TO_RESOLVE
);
