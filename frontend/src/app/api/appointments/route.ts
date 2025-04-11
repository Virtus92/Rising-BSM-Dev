/**
 * Appointments API-Route
 * 
 * Verarbeitet Anfragen zur Terminverwaltung
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getAppointmentService } from '@/infrastructure/common/factories';
import { CreateAppointmentDto } from '@/domain/dtos/AppointmentDtos';

/**
 * GET /api/appointments
 * 
 * Ruft eine Liste von Terminen ab, optional gefiltert und paginiert
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  try {
    // Filterdaten aus Query-Parametern extrahieren
    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      date: searchParams.get('date') || undefined,
      customerId: searchParams.has('customerId') 
        ? parseInt(searchParams.get('customerId') as string) 
        : undefined,
      projectId: searchParams.has('projectId') 
        ? parseInt(searchParams.get('projectId') as string) 
        : undefined,
      page: searchParams.has('page') 
        ? parseInt(searchParams.get('page') as string) 
        : 1,
      limit: searchParams.has('limit') 
        ? parseInt(searchParams.get('limit') as string) 
        : 10
    };

    // Terminservice abrufen
    const appointmentService = getAppointmentService();
    
    // Paginierte Terminliste abrufen
    const result = await appointmentService.getAll({
      relations: ['customer'],
      context: {
        userId: req.auth?.userId,
        page: filters.page,
        limit: filters.limit
      }
    });

    // Erfolgsantwort
    return formatSuccess(result, 'Termine erfolgreich abgerufen');
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return formatError(
      error instanceof Error ? error.message : 'Fehler beim Abrufen der Termine',
      500
    );
  }
});

/**
 * POST /api/appointments
 * 
 * Erstellt einen neuen Termin
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  try {
    // Request-Body als JSON parsen
    const data = await req.json() as CreateAppointmentDto;
    
    // Terminservice abrufen
    const appointmentService = getAppointmentService();
    
    // Versuch, den Termin zu erstellen
    const result = await appointmentService.create(data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip
      }
    });
    
    // Erfolgsantwort
    return formatSuccess(result, 'Termin erfolgreich erstellt', 201);
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    // Behandlung von Validierungsfehlern
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Validierungsfehler beim Erstellen des Termins'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Fehler beim Erstellen des Termins',
      500
    );
  }
});
