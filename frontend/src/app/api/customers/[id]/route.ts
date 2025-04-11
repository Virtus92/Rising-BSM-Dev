/**
 * Customer API-Route für einzelne Kunden
 * 
 * Verarbeitet Anfragen für einzelne Kunden (GET, PUT, DELETE)
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getCustomerService } from '@/infrastructure/common/factories';
import { UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';

/**
 * GET /api/customers/[id]
 * 
 * Ruft einen einzelnen Kunden anhand seiner ID ab
 */
export const GET = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  try {
    if (!params) {
      return formatError('Keine Kunden-ID angegeben', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Ungültige Kunden-ID', 400);
    }
    
    // Kundenservice abrufen
    const customerService = getCustomerService();
    
    // Kunde mit angegebener ID abrufen
    const customer = await customerService.getById(id, {
      relations: ['appointments'],
      context: {
        userId: req.auth?.userId
      }
    });
    
    if (!customer) {
      return formatNotFound('Kunde nicht gefunden');
    }
    
    // Erfolgsantwort
    return formatSuccess(customer, 'Kunde erfolgreich abgerufen');
    
  } catch (error) {
    console.error('Error fetching customer:', error);
    return formatError(
      error instanceof Error ? error.message : 'Fehler beim Abrufen des Kunden',
      500
    );
  }
});

/**
 * PUT /api/customers/[id]
 * 
 * Aktualisiert einen Kunden anhand seiner ID
 */
export const PUT = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  try {
    if (!params) {
      return formatError('Keine Kunden-ID angegeben', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Ungültige Kunden-ID', 400);
    }
    
    // Request-Body als JSON parsen
    const data = await req.json() as UpdateCustomerDto;
    
    // Kundenservice abrufen
    const customerService = getCustomerService();
    
    // Prüfen, ob der Kunde existiert
    const existingCustomer = await customerService.getById(id);
    
    if (!existingCustomer) {
      return formatNotFound('Kunde nicht gefunden');
    }
    
    // Kunde aktualisieren
    const updatedCustomer = await customerService.update(id, data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip
      }
    });
    
    // Erfolgsantwort
    return formatSuccess(updatedCustomer, 'Kunde erfolgreich aktualisiert');
    
  } catch (error) {
    console.error('Error updating customer:', error);
    
    // Behandlung von Validierungsfehlern
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Validierungsfehler beim Aktualisieren des Kunden'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Kunden',
      500
    );
  }
});

/**
 * DELETE /api/customers/[id]
 * 
 * Löscht einen Kunden anhand seiner ID
 */
export const DELETE = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  try {
    if (!params) {
      return formatError('Keine Kunden-ID angegeben', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Ungültige Kunden-ID', 400);
    }
    
    // Kundenservice abrufen
    const customerService = getCustomerService();
    
    // Prüfen, ob der Kunde existiert
    const existingCustomer = await customerService.getById(id);
    
    if (!existingCustomer) {
      return formatNotFound('Kunde nicht gefunden');
    }
    
    // Kunde löschen
    const deleted = await customerService.delete(id, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip
      }
    });
    
    // Erfolgsantwort
    return formatSuccess({ deleted }, 'Kunde erfolgreich gelöscht');
    
  } catch (error) {
    console.error('Error deleting customer:', error);
    return formatError(
      error instanceof Error ? error.message : 'Fehler beim Löschen des Kunden',
      500
    );
  }
});
