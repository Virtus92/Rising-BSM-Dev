import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IServiceService } from '@/lib/server/interfaces/IServiceService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * POST /api/services/calculate-price
 * Berechnet den Gesamtpreis für einen Service (inkl. MwSt)
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const serviceService = container.resolve<IServiceService>('ServiceService');
    
    const { basePrice, vatRate } = await req.json();
    
    if (typeof basePrice !== 'number' || typeof vatRate !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Basispreis und MwSt.-Satz müssen numerisch sein',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const result = serviceService.calculateTotalPrice(basePrice, vatRate);
    
    return NextResponse.json({
      success: true,
      data: result,
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
