import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

export interface AuthResult {
  success: boolean;
  userId?: number;
  userName?: string;
  role?: string;
  error?: string;
}

/**
 * Verifiziert ein JWT-Token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authentifiziert eine Anfrage anhand des Tokens im Cookie oder Authorization-Header
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  try {
    // Token aus Authorization-Header oder Cookies holen
    let token: string | undefined;
    
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Cookie-Store lesen
      const cookieStore = cookies();
      token = cookieStore.get('access_token')?.value;
    }
    
    if (!token) {
      return {
        success: false,
        error: 'Kein Authentifizierungstoken gefunden'
      };
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        success: false,
        error: 'Ungültiges Token'
      };
    }
    
    return {
      success: true,
      userId: decoded.id || decoded.sub,
      userName: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    console.error('Authentifizierungsfehler:', error);
    return {
      success: false,
      error: 'Authentifizierungsfehler'
    };
  }
}
