/**
 * Register API Route Handler
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthService, getUserService } from '@/services/factory';
import { createdResponse } from '@/lib/utils/api/response';
import { ApiError, BadRequestError, ConflictError } from '@/lib/utils/api/error';

/**
 * POST /api/auth/register
 * Neuen Benutzer registrieren
 */
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { email, password, firstName, lastName } = userData;
    
    // Grundlegende Validierung
    if (!email || !password) {
      throw new BadRequestError('E-Mail und Passwort sind erforderlich');
    }
    
    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Ungültiges E-Mail-Format');
    }
    
    // Prüfen, ob ein Benutzer mit dieser E-Mail bereits existiert
    const userService = getUserService();
    const existingUser = await userService.getUserByEmail(email);
    
    if (existingUser) {
      throw new ConflictError('Ein Benutzer mit dieser E-Mail existiert bereits');
    }
    
    // Benutzer erstellen
    const authService = getAuthService();
    const newUser = await authService.register({
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user'  // Standard-Rolle
    });
    
    // Optional: Auto-Login nach Registrierung
    const { accessToken, refreshToken } = await authService.login(email, password);
    
    // Cookies setzen
    const response = NextResponse.json({
      success: true,
      message: 'Registrierung erfolgreich',
      data: {
        user: newUser,
        accessToken
      }
    }, { status: 201 });
    
    // HTTP-Only-Cookie für Refresh-Token setzen
    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 Tage
    });
    
    // Normales Cookie für Access-Token setzen (für JS-Zugriff)
    response.cookies.set({
      name: 'token',
      value: accessToken,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 // 15 Minuten
    });
    
    return response;
  } catch (error) {
    return ApiError.handleError(error);
  }
}