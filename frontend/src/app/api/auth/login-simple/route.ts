/**
 * Vereinfachte Login API-Route
 * 
 * Diese Route bietet eine einfache Authentifizierung ohne Datenbankzugriff,
 * für Testzwecke und Ausweichsituationen.
 */
import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/utils/api/response';
import { ApiError, BadRequestError, UnauthorizedError } from '@/lib/utils/api/error';
import { getLogger } from '@/lib/core/bootstrap';
import jwt from 'jsonwebtoken';

// Fest kodierte Testbenutzer
const USERS = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin',
    status: 'active'
  },
  {
    id: 2,
    name: 'Benutzer',
    email: 'user@example.com',
    password: 'UserPass123!',
    role: 'employee',
    status: 'active'
  }
];

/**
 * POST /api/auth/login-simple
 * Authentifiziert einen Benutzer mit E-Mail und Passwort (vereinfacht)
 */
export async function POST(request: NextRequest) {
  const logger = getLogger();
  
  try {
    const { email, password } = await request.json();
    
    // Eingaben validieren
    if (!email || !password) {
      throw new BadRequestError('E-Mail und Passwort sind erforderlich');
    }
    
    // Benutzer in den Testdaten suchen
    const user = USERS.find(u => u.email === email);
    
    if (!user) {
      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }
    
    // Prüfen, ob der Benutzer aktiv ist
    if (user.status !== 'active') {
      throw new UnauthorizedError('Ihr Konto ist deaktiviert');
    }
    
    // Passwort überprüfen
    if (user.password !== password) {
      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }
    
    // JWT-Secret aus Umgebungsvariablen oder Standard
    const jwtSecret = process.env.JWT_SECRET || 'your-default-super-secret-key-change-in-production';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-default-key-change-in-production';
    
    // Zugriffstoken erstellen
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
    
    // Refresh-Token erstellen
    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtRefreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    logger.info(`Benutzer angemeldet: ${user.email} (vereinfachter Login)`);
    
    // Benutzerinformationen ohne Passwort zurückgeben
    const { password: _, ...userWithoutPassword } = user;
    
    // Erfolgsantwort zurückgeben
    return successResponse({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    }, 'Anmeldung erfolgreich');
  } catch (error) {
    logger.error('Vereinfachter Login-Fehler:', error);
    return ApiError.handleError(error);
  }
}
