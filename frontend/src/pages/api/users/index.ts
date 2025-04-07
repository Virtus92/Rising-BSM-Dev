/**
 * API-Route für Benutzer
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserService } from '@/lib/factories';
import { ApiResponse } from '@/lib/utils/api/unified-response';
import { ValidationError } from '@/lib/utils/api/error';

/**
 * Handler für alle HTTP-Methoden
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  try {
    // Methode prüfen
    switch (req.method) {
      case 'GET':
        return await getUsers(req, res);
      case 'POST':
        return await createUser(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: `Methode ${req.method} nicht unterstützt`,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Benutzerverwaltungs-Fehler:', error);
    
    // Fehlertyp bestimmen
    if (error instanceof ValidationError) {
      return res.status(422).json({
        success: false,
        message: error.message,
        errors: error.errors,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET: Benutzer abrufen
 */
async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  const { limit, page, search } = req.query;
  
  const userService = getUserService();
  const filters = {
    limit: limit ? parseInt(limit as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    search: search as string
  };
  
  const result = await userService.findUsers(filters);
  
  return res.status(200).json({
    success: true,
    message: 'Benutzer erfolgreich abgerufen',
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST: Benutzer erstellen
 */
async function createUser(req: NextApiRequest, res: NextApiResponse) {
  const userData = req.body;
  const userService = getUserService();
  
  // Validierung im Service
  const result = await userService.create(userData);
  
  return res.status(201).json({
    success: true,
    message: 'Benutzer erfolgreich erstellt',
    data: result,
    timestamp: new Date().toISOString()
  });
}
