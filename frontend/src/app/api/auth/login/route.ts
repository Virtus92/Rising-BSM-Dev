/**
 * Login API-Route
 * 
 * Diese Route ermöglicht die Benutzerauthentifizierung mit E-Mail und Passwort.
 */
import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/utils/api/response';
import { ApiError, BadRequestError, UnauthorizedError } from '@/lib/utils/api/error';
import { getPrismaClient, getLogger } from '@/lib/core/bootstrap';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * POST /api/auth/login
 * Authentifiziert einen Benutzer mit E-Mail und Passwort
 */
export async function POST(request: NextRequest) {
  const logger = getLogger();
  
  try {
    const { email, password } = await request.json();
    
    // Eingaben validieren
    if (!email || !password) {
      throw new BadRequestError('E-Mail und Passwort sind erforderlich');
    }
    
    // Benutzer in der Datenbank suchen
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true
      }
    });
    
    if (!user) {
      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }
    
    // Prüfen, ob der Benutzer aktiv ist
    if (user.status !== 'active') {
      throw new UnauthorizedError('Ihr Konto ist deaktiviert');
    }
    
    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Ungültige Anmeldedaten');
    }
    
    // JWT-Secret aus Umgebungsvariablen holen
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!jwtSecret || !jwtRefreshSecret) {
      logger.error('JWT-Secrets nicht konfiguriert');
      throw new Error('Interner Serverfehler');
    }
    
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
    
    // Refresh-Token in der Datenbank speichern
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage
        createdByIp: request.headers.get('x-forwarded-for') || request.ip || undefined
      }
    });
    
    // Login-Zeitpunkt aktualisieren
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    logger.info(`Benutzer angemeldet: ${user.email}`);
    
    // Benutzerinformationen ohne Passwort zurückgeben
    const { password: _, ...userWithoutPassword } = user;
    
    // Erfolgsantwort zurückgeben
    return successResponse({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    }, 'Anmeldung erfolgreich');
  } catch (error) {
    logger.error('Login-Fehler:', error);
    return ApiError.handleError(error);
  }
}
