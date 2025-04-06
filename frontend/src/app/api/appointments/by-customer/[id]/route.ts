import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAppointmentService } from '@/lib/server/interfaces/IAppointmentService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/appointments/by-customer/[id]
 * Holt alle Termine für einen bestimmten Kunden
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const appointmentService = container.resolve<IAppointmentService>('AppointmentService');
    
    // Kunden-ID aus der URL extrahieren
    const customerId = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Kunden-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const appointments = await appointmentService.findByCustomer(customerId);
    
    return NextResponse.json({
      success: true,
      data: appointments,
      meta: {
        customerId,
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
