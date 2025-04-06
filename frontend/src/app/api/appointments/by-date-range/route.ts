import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAppointmentService } from '@/lib/server/interfaces/IAppointmentService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/appointments/by-date-range
 * Findet Termine in einem bestimmten Zeitraum
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const appointmentService = container.resolve<IAppointmentService>('AppointmentService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start- und Enddatum sind erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültiges Datumformat',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Startdatum muss vor dem Enddatum liegen',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const appointments = await appointmentService.findByDateRange(startDate, endDate);
    
    return NextResponse.json({
      success: true,
      data: appointments,
      meta: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        count: appointments.length,
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
