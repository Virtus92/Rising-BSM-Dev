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
 * GET /api/dashboard/stats
 * Holt nur die Statistiken für das Dashboard
 */
export const GET = withAuth(
  async (req: NextRequest, user, services) => {
    const { logger, DashboardService } = services as {
      logger: ILoggingService;
      DashboardService: IDashboardService;
    };
    
    logger.debug('Dashboard-Statistik-Anfrage empfangen');
    
    try {
      // Basis-Metriken laden
      const metrics = await DashboardService.getMetrics();
      
      // Zusätzliche Statistiken laden (falls benötigt)
      const [projectStats, customerStats] = await Promise.all([
        DashboardService.getProjectStatsByStatus(),
        DashboardService.getCustomerStatsByStatus(),
      ]);
      
      // Trend-Werte berechnen (z.B. basierend auf letzten Änderungen)
      // In diesem Fall verwenden wir Dummy-Werte, die später durch echte Trends ersetzt werden sollten
      const trendCustomers = 5; // Positiver Trend für Kunden
      const trendProjects = 2;  // Positiver Trend für Projekte
      
      // Statistik-Daten für das Frontend formatieren
      const statsData = {
        // Statistik im Format, das das Frontend erwartet
        totalCustomers: { 
          count: metrics.customers.total, 
          trend: trendCustomers 
        },
        activeProjects: { 
          count: metrics.projects.active, 
          trend: trendProjects 
        },
        newRequests: { 
          count: metrics.projects.active - metrics.projects.completed, 
          trend: 0 
        },
        
        // Originale Metriken für vollständige Daten
        customers: metrics.customers,
        projects: metrics.projects,
        appointments: metrics.appointments,
        
        // Zusätzliche Statistiken
        projectStatusDistribution: projectStats,
        customerStatusDistribution: customerStats
      };
      
      logger.info('Dashboard-Statistiken erfolgreich geladen');
      
      return NextResponse.json({
        success: true,
        data: statsData,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Fehler beim Laden der Dashboard-Statistiken', error);
      
      const statusCode = error.statusCode || 500;
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Interner Serverfehler beim Laden der Dashboard-Statistiken',
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
