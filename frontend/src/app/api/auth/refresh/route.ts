/**
 * Refresh Token API-Route
 * 
 * Diese Route ermöglicht die Erneuerung des Access Tokens mit einem gültigen Refresh Token.
 */
import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/utils/api/response';
import { ApiError, BadRequestError, UnauthorizedError } from '@/lib/utils/api/error';
import { getLogger } from '@/lib/core/bootstrap';
import jwt from 'jsonwebtoken';

/**
 * POST /api/auth/refresh
 * Erneuert das Access Token mit einem Refresh Token
 */
export async function POST(request: NextRequest) {
  const logger = getLogger();
  
  try {
    const { refreshToken } = await request.json();
    
    // Eingabe validieren
    if (!refreshToken) {
      throw new BadRequestError('Refresh Token ist erforderlich');
    }
    
    // JWT-Secret aus Umgebungsvariablen oder Standard
    const jwtSecret = process.env.JWT_SECRET || 'your-default-super-secret-key-change-in-production';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-default-key-change-in-production';
    
    // Refresh Token verifizieren
    let decodedRefreshToken;
    try {
      decodedRefreshToken = jwt.verify(refreshToken, jwtRefreshSecret);
    } catch (error) {
      throw new UnauthorizedError('Ungültiges Refresh Token');
    }
    
    // Neues Access Token erstellen
    const userId = typeof decodedRefreshToken === 'object' ? decodedRefreshToken.userId : null;
    
    if (!userId) {
      throw new UnauthorizedError('Ungültiges Refresh Token');
    }
    
    // In einer realen Anwendung würden wir hier den Benutzer aus der Datenbank laden
    // Für die Demo verwenden wir fest codierte Benutzer
    
    // Demo-Benutzer für Admin und normalen Benutzer
    const demoUsers = [
      {
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin'
      },
      {
        id: 2,
        name: 'Benutzer',
        email: 'user@example.com',
        role: 'employee'
      }
    ];
    
    // Benutzer finden
    const user = demoUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new UnauthorizedError('Ungültiges Refresh Token');
    }
    
    // Neues Access Token erstellen
    const accessToken = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    
    // Neues Refresh Token erstellen
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      jwtRefreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    logger.info(`Token erneuert für Benutzer ID: ${user.id}`);
    
    return successResponse({
      accessToken,
      refreshToken: newRefreshToken,
      user
    }, 'Token erfolgreich erneuert');
  } catch (error) {
    logger.error('Fehler bei Token-Erneuerung:', error);
    return ApiError.handleError(error);
  }
}
