/**
 * Users API Route
 * Implementiert die API-Endpunkte für die Benutzerverwaltung
 */
import { NextRequest } from 'next/server';
import { getUserService } from '@/lib/factories';
import apiResponse from '@/lib/utils/api/unified-response';

/**
 * GET /api/users
 * Holt eine Liste von Benutzern mit Paginierung und optionaler Filterung
 */
export async function GET(request: NextRequest) {
  try {
    // Query-Parameter extrahieren
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    
    // Service aufrufen
    const userService = getUserService();
    const result = await userService.getUsers({
      page,
      limit,
      search,
      role: role || undefined,
      status: status || undefined
    });
    
    // Antwort formatieren
    return apiResponse.paginated(
      result.users,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      'Users retrieved successfully'
    );
  } catch (error) {
    // Fehlerbehandlung
    return apiResponse.handleError(error);
  }
}

/**
 * POST /api/users
 * Erstellt einen neuen Benutzer
 */
export async function POST(request: NextRequest) {
  try {
    // Request-Body extrahieren
    const userData = await request.json();
    
    // Service aufrufen
    const userService = getUserService();
    const newUser = await userService.createUser(userData);
    
    // Antwort formatieren
    return apiResponse.created(newUser, 'User created successfully');
  } catch (error) {
    // Fehlerbehandlung
    return apiResponse.handleError(error);
  }
}
