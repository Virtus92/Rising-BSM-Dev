import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IServiceService } from '@/lib/server/interfaces/IServiceService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/services/active
 * Holt aktive Services für Dropdown-Listen
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
    const services = await serviceService.findActive();
    
    return NextResponse.json({
      success: true,
      data: services,
      meta: {
        count: services.length,
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
