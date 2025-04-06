import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IAppointmentService } from '@/lib/server/interfaces/IAppointmentService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/appointments
 * Gibt alle Termine zurück
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const appointmentService = container.resolve<IAppointmentService>('AppointmentService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : undefined;
    const projectId = searchParams.get('projectId') ? parseInt(searchParams.get('projectId')!) : undefined;
    const startDateFrom = searchParams.get('startDateFrom') ? new Date(searchParams.get('startDateFrom')!) : undefined;
    const startDateTo = searchParams.get('startDateTo') ? new Date(searchParams.get('startDateTo')!) : undefined;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const filters = {
      status: status || undefined,
      customerId,
      projectId,
      startDateFrom,
      startDateTo,
      search: search || undefined,
      limit,
      offset
    };
    
    const result = await appointmentService.findAll(filters);
    
    return NextResponse.json({
      success: true,
      data: result.appointments,
      meta: {
        total: result.total,
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

/**
 * POST /api/appointments
 * Erstellt einen neuen Termin
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const appointmentService = container.resolve<IAppointmentService>('AppointmentService');
    
    const data = await req.json();
    
    const appointment = await appointmentService.create(data, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json(
      {
        success: true,
        data: appointment,
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        errors: error.errors,
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});
