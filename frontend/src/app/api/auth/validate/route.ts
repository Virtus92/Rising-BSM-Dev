/**
 * Token Validation API-Route
 * 
 * Validiert Reset-Tokens und andere Einmal-Tokens.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';

/**
 * GET /api/auth/validate
 * 
 * Validiert ein Token (z.B. für Passwort-Reset).
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  // Hole das Token aus den Query-Parametern
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: 'Token is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  // Verwende AuthService für die Token-Validierung
  const authService = getAuthService();
  
  try {
    const isValid = await authService.verifyToken(token);
    
    if (!isValid) {
      const response = NextResponse.json(
      {
        success: false,
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
      );
      
      // Delete all authentication cookies
      response.cookies.delete('auth_token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('auth_token_backup');
      response.cookies.delete('refresh_token_backup');
      
      return response;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error validating token',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
  
  // Formatiere die Antwort
  return NextResponse.json(
    formatSuccess({ valid: true }, 'Token is valid'),
    { status: 200 }
  );
}, { requiresAuth: false });