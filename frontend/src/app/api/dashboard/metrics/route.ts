import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IDashboardService } from '@/lib/server/interfaces/IDashboardService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/dashboard/metrics
 * Holt Kennzahlen für das Dashboard
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const dashboardService = container.resolve<IDashboardService>('DashboardService');
    
    const metrics = await dashboardService.getMetrics();
    
    return NextResponse.json({
      success: true,
      data: metrics,
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
