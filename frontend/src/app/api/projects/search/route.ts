import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/projects/search
 * Sucht nach Projekten basierend auf einem Suchbegriff
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Suchbegriff ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const projects = await projectService.search(query);
    
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
