import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/projects/[id]
 * Holt ein bestimmtes Projekt anhand seiner ID
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Projekt-ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Projekt-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const project = await projectService.findById(id);
    
    return NextResponse.json({
      success: true,
      data: project,
      meta: {
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

/**
 * PUT /api/projects/[id]
 * Aktualisiert ein bestimmtes Projekt anhand seiner ID (Nur für Admin und Manager)
 */
export const PUT = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Projekt-ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Projekt-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    
    const project = await projectService.update(id, data, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: project,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        errors: error.errors,
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});

/**
 * DELETE /api/projects/[id]
 * Löscht ein bestimmtes Projekt anhand seiner ID (Nur für Admin)
 */
export const DELETE = withRoles(['admin'], async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Projekt-ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Projekt-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const result = await projectService.delete(id);
    
    return NextResponse.json({
      success: result,
      meta: {
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
