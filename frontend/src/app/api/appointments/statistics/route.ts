import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAppointmentService } from '@/lib/server/interfaces/IAppointmentService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/appointments/statistics
 * Holt Terminstatistiken
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const appointmentService = container.resolve<IAppointmentService>('AppointmentService');
    
    const statistics = await appointmentService.getAppointmentStatistics();
    
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
