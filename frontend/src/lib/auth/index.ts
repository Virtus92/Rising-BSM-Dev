import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// Konfigurationen für die Cookie-Optionen
const getCookieOptions = (expiryDays: number): Cookies.CookieAttributes => ({
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  expires: expiryDays,
  // Hinweis: httpOnly kann nur auf dem Server gesetzt werden, nicht auf dem Client
  // In einer vollständigen Implementierung sollten Tokens über Server-Side API-Routen
  // mit HTTP-only Cookies verwaltet werden
});

/**
 * Speichert die Auth-Tokens in Cookies
 */
export const setTokens = (accessToken: string, refreshToken: string) => {
  if (!accessToken || !refreshToken) {
    console.error('Versuche, leere Tokens zu speichern', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });
    return;
  }
  
  // Access Token mit kurzer Lebensdauer (15 Minuten)
  Cookies.set('access_token', accessToken, getCookieOptions(1/96));
  
  // Refresh Token mit längerer Lebensdauer (7 Tage oder basierend auf "Remember me")
  Cookies.set('refresh_token', refreshToken, getCookieOptions(7));
  
  console.log('Auth-Tokens wurden in Cookies gespeichert');
};

/**
 * Gibt das aktuelle Access Token zurück
 */
export const getAccessToken = (): string | undefined => {
  return Cookies.get('access_token');
};

/**
 * Gibt das aktuelle Refresh Token zurück
 */
export const getRefreshToken = (): string | undefined => {
  return Cookies.get('refresh_token');
};

/**
 * Löscht alle Auth-Tokens
 */
export const clearTokens = (): void => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  console.log('Auth-Tokens wurden gelöscht');
};

/**
 * Prüft, ob ein Token noch gültig ist
 */
export const isTokenValid = (token: string | undefined): boolean => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Fehler beim Überprüfen der Token-Gültigkeit:', error);
    return false;
  }
};

/**
 * Typdefinition für decodierte Token-Daten
 */
export interface DecodedToken {
  sub: number; // Benutzer-ID im JWT ist unter 'sub' gespeichert
  name: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Extrahiert Benutzerinformationen aus einem JWT-Token
 */
export const getUserFromToken = (token: string | undefined): { 
  id: number; 
  name: string; 
  email: string; 
  role: string; 
} | null => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Prüfen, ob Token abgelaufen ist
    if (decoded.exp < Date.now() / 1000) {
      console.warn('Token ist abgelaufen');
      return null;
    }
    
    return {
      id: decoded.sub, // Benutzer-ID aus 'sub' extrahieren
      name: decoded.name,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('Fehler beim Decodieren des Tokens:', error);
    return null;
  }
};

/**
 * Prüft, ob ein Benutzer eine bestimmte Rolle hat
 */
export const hasRole = (userRole: string | undefined, requiredRole: string | string[]): boolean => {
  if (!userRole) return false;
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
};
