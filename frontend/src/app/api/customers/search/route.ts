import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { ICustomerService } from '@/lib/server/interfaces/ICustomerService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/customers/search
 * Sucht nach Kunden basierend auf einem Suchbegriff
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const customerService = container.resolve<ICustomerService>('CustomerService');
    
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
    
    const customers = await customerService.search(query);
    
    return NextResponse.json({
      success: true,
      data: customers,
      meta: {
        count: customers.length,
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
