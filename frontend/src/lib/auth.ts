/**
 * Auth-Utilities
 * Funktionen für das Token-Management und die Benutzerverwaltung
 */
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import * as authApi from './api/auth';

// Konstanten für Token-Storage
const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Token-Payload-Typ
 */
export interface TokenPayload {
  sub?: string;
  userId?: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Speichert die Tokens (Access und Refresh)
 */
export function setTokens(accessToken: string, refreshToken?: string): void {
  // Access Token im Cookie speichern
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { 
    expires: 1/96, // 15 Minuten in Tagen
    sameSite: 'strict'
  });
  
  // Refresh Token im Cookie speichern, falls vorhanden
  if (refreshToken) {
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { 
      expires: 7, // 7 Tage
      sameSite: 'strict',
      // HttpOnly wird clientseitig nicht unterstützt, wird vom Server gesetzt
    });
  }
}

/**
 * Löscht die gespeicherten Tokens
 */
export function clearTokens(): void {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

/**
 * Holt das Access Token
 */
export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

/**
 * Holt das Refresh Token
 */
export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

/**
 * Extrahiert Benutzerinformationen aus dem Token
 */
export function getUserFromToken(token: string): { id: number; name: string; email: string; role: string } | null {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    
    if (!decoded) {
      return null;
    }
    
    // UserId kann entweder in sub oder userId sein
    const userId = decoded.sub ? parseInt(decoded.sub) : decoded.userId;
    
    if (!userId) {
      return null;
    }
    
    return {
      id: userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    console.error('Token-Decodierung fehlgeschlagen:', error);
    return null;
  }
}

/**
 * Überprüft, ob ein Token abgelaufen ist
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    // Token Verfallszeit in Sekunden, aktueller Zeitpunkt in Millisekunden
    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    
    return currentTime >= expiryTime;
  } catch (error) {
    console.error('Token-Validierung fehlgeschlagen:', error);
    return true;
  }
}

/**
 * Aktualisiert das Access Token mit dem Refresh Token
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await authApi.refreshToken(refreshToken);
    
    if (response.success && response.data) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token-Aktualisierung fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Prüft, ob der Benutzer eine bestimmte Rolle hat
 */
export function hasRole(userRole: string, requiredRole: string | string[]): boolean {
  if (!userRole) {
    return false;
  }
  
  // Rollengewichtung (höhere Zahl = mehr Rechte)
  const roleWeights: Record<string, number> = {
    'admin': 100,
    'manager': 75,
    'mitarbeiter': 50,
    'benutzer': 25,
    'gast': 10
  };
  
  // Funktion, um zu prüfen, ob eine Rolle genügend Rechte hat
  const hasEnoughRights = (userRoleWeight: number, requiredRoleWeight: number) => {
    return userRoleWeight >= requiredRoleWeight;
  };
  
  // Gewicht der Benutzerrolle
  const userRoleWeight = roleWeights[userRole.toLowerCase()] || 0;
  
  // Prüfung für mehrere erforderliche Rollen (ODER-Verknüpfung)
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => {
      const requiredRoleWeight = roleWeights[role.toLowerCase()] || 0;
      return hasEnoughRights(userRoleWeight, requiredRoleWeight);
    });
  }
  
  // Prüfung für eine einzelne erforderliche Rolle
  const requiredRoleWeight = roleWeights[requiredRole.toLowerCase()] || 0;
  return hasEnoughRights(userRoleWeight, requiredRoleWeight);
}
