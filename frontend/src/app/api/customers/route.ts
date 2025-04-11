/**
 * Customers API-Route
 * 
 * Verarbeitet Anfragen zur Kundenverwaltung
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getCustomerService } from '@/infrastructure/common/factories';
import { CreateCustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';

/**
 * GET /api/customers
 * 
 * Ruft eine Liste von Kunden ab, optional gefiltert und paginiert
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  try {
    // Filterdaten aus Query-Parametern extrahieren
    const { searchParams } = new URL(req.url);
    const filters: CustomerFilterParamsDto = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      type: searchParams.get('type') as any || undefined,
      city: searchParams.get('city') || undefined,
      postalCode: searchParams.get('postalCode') || undefined,
      newsletter: searchParams.has('newsletter') 
        ? searchParams.get('newsletter') === 'true'
        : undefined,
      page: searchParams.has('page') 
        ? parseInt(searchParams.get('page') as string)
        : 1,
      limit: searchParams.has('limit') 
        ? parseInt(searchParams.get('limit') as string)
        : 10,
      sortBy: searchParams.get('sortBy') || undefined,
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || undefined
    };

    // Kundenservice abrufen
    const customerService = getCustomerService();
    
    // Paginierte Kundenliste abrufen
    const result = await customerService.getAll({
      relations: ['appointments'],
      context: {
        userId: req.auth?.userId
      },
      ...filters
    });

    // Erfolgsantwort
    return formatSuccess(result, 'Kunden erfolgreich abgerufen');
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    return formatError(
      error instanceof Error ? error.message : 'Fehler beim Abrufen der Kunden',
      500
    );
  }
});

/**
 * POST /api/customers
 * 
 * Erstellt einen neuen Kunden
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  try {
    // Request-Body als JSON parsen
    const data = await req.json() as CreateCustomerDto;
    
    // Kundenservice abrufen
    const customerService = getCustomerService();
    
    // Versuch, den Kunden zu erstellen
    const result = await customerService.create(data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip
      }
    });
    
    // Erfolgsantwort
    return formatSuccess(result, 'Kunde erfolgreich erstellt', 201);
    
  } catch (error) {
    console.error('Error creating customer:', error);
    
    // Behandlung von Validierungsfehlern
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Validierungsfehler beim Erstellen des Kunden'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Fehler beim Erstellen des Kunden',
      500
    );
  }
});
