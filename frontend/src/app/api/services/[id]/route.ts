import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IServiceService } from '@/lib/server/interfaces/IServiceService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/services/[id]
 * Holt einen bestimmten Service anhand seiner ID
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
    // Service-ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
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
    
    const service = await serviceService.findById(id);
    
    return NextResponse.json({
      success: true,
      data: service,
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
 * PUT /api/services/[id]
 * Aktualisiert einen bestimmten Service anhand seiner ID (Nur für Admin und Manager)
 */
export const PUT = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
    // Service-ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
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
    
    const data = await req.json();
    
    const service = await serviceService.update(id, data, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: service,
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
 * DELETE /api/services/[id]
 * Löscht einen bestimmten Service anhand seiner ID (Nur für Admin)
 */
export const DELETE = withRoles(['admin'], async (req: NextRequest, user) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
    // Service-ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
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
    
    const result = await serviceService.delete(id, user.id, user.name || `User ${user.id}`);
    
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
