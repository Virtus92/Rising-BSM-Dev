import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IDashboardService } from '@/lib/server/interfaces/IDashboardService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/dashboard/recent-projects
 * Holt aktuelle Projekte für das Dashboard
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const dashboardService = container.resolve<IDashboardService>('DashboardService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 5;
    
    const projects = await dashboardService.getRecentProjects(limit);
    
    return NextResponse.json({
      success: true,
      data: projects,
      meta: {
        count: projects.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});
