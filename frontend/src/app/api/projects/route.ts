import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/projects
 * Gibt alle Projekte zurück
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : undefined;
    const serviceId = searchParams.get('serviceId') ? parseInt(searchParams.get('serviceId')!) : undefined;
    const startDateFrom = searchParams.get('startDateFrom') ? new Date(searchParams.get('startDateFrom')!) : undefined;
    const startDateTo = searchParams.get('startDateTo') ? new Date(searchParams.get('startDateTo')!) : undefined;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    
    const filters = {
      status: status || undefined,
      customerId,
      serviceId,
      startDateFrom,
      startDateTo,
      search: search || undefined,
      limit,
      offset,
      includeCompleted
    };
    
    const result = await projectService.findAll(filters);
    
    return NextResponse.json({
      success: true,
      data: result.projects,
      meta: {
        total: result.total,
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
 * POST /api/projects
 * Erstellt ein neues Projekt
 */
export const POST = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    const data = await req.json();
    
    const project = await projectService.create(data, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json(
      {
        success: true,
        data: project,
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    );
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
