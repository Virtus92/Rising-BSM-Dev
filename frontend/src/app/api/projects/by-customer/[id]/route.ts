import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/projects/by-customer/[id]
 * Holt alle Projekte für einen bestimmten Kunden
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Kunden-ID aus der URL extrahieren
    const customerId = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Kunden-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const projects = await projectService.findByCustomer(customerId);
    
    return NextResponse.json({
      success: true,
      data: projects,
      meta: {
        customerId,
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
