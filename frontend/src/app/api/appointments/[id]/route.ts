import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getAppointmentService } from '@/infrastructure/common/factories';
import { UpdateAppointmentDto, StatusUpdateDto } from '@/domain/dtos/AppointmentDtos';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/appointments/[id]
 * 
 * Ruft einen einzelnen Termin anhand seiner ID ab
 */
export const GET = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  try {
    if (!params) {
      return formatError('Keine Termin-ID angegeben', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Ungültige Termin-ID', 400);
    }
    
    // Terminservice abrufen
    const appointmentService = getAppointmentService();
    
    // Termin mit angegebener ID abrufen
    const appointment = await appointmentService.getById(id, {
      relations: ['customer'],
      context: {
        userId: req.auth?.userId
      }
    });
    
    if (!appointment) {
      return formatNotFound('Termin nicht gefunden');
    }
    
    // Erfolgsantwort
    return formatSuccess(appointment, 'Termin erfolgreich abgerufen');
    
  } catch (error) {
    const logger = getLogger();
    logger.error('Error fetching appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: params?.id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving appointment',
      500
    );
  }
});

/**
 * PUT /api/appointments/[id]
 * 
 * Aktualisiert einen Termin anhand seiner ID
 */
export const PUT = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  try {
    if (!params) {
      return formatError('Keine Termin-ID angegeben', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Ungültige Termin-ID', 400);
    }
    
    // Request-Body als JSON parsen
    const data = await req.json() as UpdateAppointmentDto;
    
    // Terminservice abrufen
    const appointmentService = getAppointmentService();
    
    // Prüfen, ob der Termin existiert
    const existingAppointment = await appointmentService.getById(id);
    
    if (!existingAppointment) {
      return formatNotFound('Termin nicht gefunden');
    }
    
    // Termin aktualisieren
    const updatedAppointment = await appointmentService.update(id, data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip
      }
    });
    
    // Erfolgsantwort
    return formatSuccess(updatedAppointment, 'Termin erfolgreich aktualisiert');
    
  } catch (error) {
    const logger = getLogger();
    logger.error('Error updating appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: params?.id
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Appointment validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Error updating appointment',
      500
    );
  }
});

/**
 * DELETE /api/appointments/[id]
 * 
 * Löscht einen Termin anhand seiner ID
 */
export const DELETE = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  try {
    if (!params) {
      return formatError('Keine Termin-ID angegeben', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Ungültige Termin-ID', 400);
    }
    
    // Terminservice abrufen
    const appointmentService = getAppointmentService();
    
    // Prüfen, ob der Termin existiert
    const existingAppointment = await appointmentService.getById(id);
    
    if (!existingAppointment) {
      return formatNotFound('Termin nicht gefunden');
    }
    
    // Termin löschen
    const deleted = await appointmentService.delete(id, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip
      }
    });
    
    // Erfolgsantwort
    return formatSuccess({ deleted }, 'Termin erfolgreich gelöscht');
    
  } catch (error) {
    const logger = getLogger();
    logger.error('Error deleting appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: params?.id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error deleting appointment',
      500
    );
  }
});
