import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { ICustomerService } from '@/lib/server/interfaces/ICustomerService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/customers/statistics
 * Holt Kundenstatistiken (Nur für Admin und Manager)
 */
export const GET = withRoles(['admin', 'manager'], async (req: NextRequest) => {
  try {
    const customerService = container.resolve<ICustomerService>('CustomerService');
    
    const statistics = await customerService.getCustomerStatistics();
    
    return NextResponse.json({
      success: true,
      data: statistics,
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
