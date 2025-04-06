import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/projects/by-service/[id]
 * Holt alle Projekte für einen bestimmten Service
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Service-ID aus der URL extrahieren
    const serviceId = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(serviceId) || serviceId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Service-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const projects = await projectService.findByService(serviceId);
    
    return NextResponse.json({
      success: true,
      data: projects,
      meta: {
        serviceId,
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
