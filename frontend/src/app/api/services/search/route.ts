import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IServiceService } from '@/lib/server/interfaces/IServiceService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/services/search
 * Sucht nach Services basierend auf einem Suchbegriff
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
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
    
    const services = await serviceService.search(query);
    
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
