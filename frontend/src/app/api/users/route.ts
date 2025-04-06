/**
 * Benutzer-API-Route
 */
import { NextRequest } from 'next/server';
import { getUserService } from '@/lib/services/factory';
import { responseHelpers } from '@/lib/utils/api/express-compat';
import config from '@/lib/config';

/**
 * GET /api/users
 * Alle Benutzer abrufen (mit Paginierung)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || config.DEFAULT_PAGE_SIZE.toString());
    const search = searchParams.get('search') || '';
    
    const userService = getUserService();
    const { users, total, totalPages } = await userService.getUsers({
      page,
      limit,
      search
    });
    
    return responseHelpers.paginated(users, {
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return responseHelpers.error(message);
  }
}

/**
 * POST /api/users
 * Neuen Benutzer erstellen
 */
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    const userService = getUserService();
    const newUser = await userService.createUser(userData);
    
    return responseHelpers.created(newUser);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return responseHelpers.error(message);
  }
}