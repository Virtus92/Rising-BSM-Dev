import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IServiceService } from '@/lib/server/interfaces/IServiceService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/services
 * Gibt alle Services zurück
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const activeParam = searchParams.get('active');
    const active = activeParam ? activeParam === 'true' : undefined;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const filters = {
      active,
      search: search || undefined,
      limit,
      offset
    };
    
    const result = await serviceService.findAll(filters);
    
    return NextResponse.json({
      success: true,
      data: result.services,
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
 * POST /api/services
 * Erstellt einen neuen Service (Nur für Admin und Manager)
 */
export const POST = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
    const data = await req.json();
    
    const service = await serviceService.create(data, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json(
      {
        success: true,
        data: service,
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
