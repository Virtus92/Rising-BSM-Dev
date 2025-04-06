import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAppointmentService } from '@/lib/server/interfaces/IAppointmentService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * PUT /api/appointments/[id]/status
 * Aktualisiert den Status eines Termins
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const appointmentService = container.resolve<IAppointmentService>('AppointmentService');
    
    // Termin-ID aus der URL extrahieren
    const urlParts = req.url.split('/');
    const id = parseInt(urlParts[urlParts.length - 2]);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Termin-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const appointment = await appointmentService.updateStatus(
      id,
      status,
      user.id,
      user.name || `User ${user.id}`
    );
    
    return NextResponse.json({
      success: true,
      data: appointment,
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
