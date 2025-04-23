/**
 * Hilfsfunktionen für die Authentifizierung
 */
import { TokenManager } from '@/infrastructure/auth/TokenManager';
import { AuthRole, User } from '@/features/auth/providers/AuthProvider';
import { UserStatus, UserRole } from '@/domain/enums/UserEnums';

// Öffentliche Routen, die keine Authentifizierung erfordern
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/contact',
  '/about',
  '/services',
  '/api-docs', // Falls vorhanden
];

/**
 * Prüft, ob eine Route öffentlich ist und keine Authentifizierung erfordert
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    path === route || 
    path.startsWith(route + '/') || 
    (route.endsWith('*') && path.startsWith(route.slice(0, -1)))
  );
}

/**
 * Extrahiert die Umleitung aus der URL
 */
export function getRedirectParam(searchParams?: URLSearchParams): string {
  const params = searchParams || new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  
  return params.get('redirect') || '/dashboard';
}

/**
 * Event für Auth-Status-Änderungen auslösen
 */
export function dispatchAuthStatusEvent(isAuthenticated: boolean, user?: User | null): void {
  if (typeof window !== 'undefined') {
    try {
      const event = new CustomEvent('auth_status_changed', { 
        detail: { isAuthenticated, user } 
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error('Failed to dispatch auth event:', e);
    }
  }
}

/**
 * Überprüft, ob ein Token gültig ist und gibt den enthaltenen Benutzer zurück
 */
export function validateAndExtractUser(token?: string): User | null {
  if (!token) {
    return null;
  }
  
  // Prüfen, ob das Token abgelaufen ist
  if (TokenManager.isTokenExpired(token)) {
    return null;
  }
  
  // Benutzer aus Token extrahieren
  const userData = TokenManager.getUserFromToken(token);
  if (!userData) return null;
  
  // Erstelle ein vollständiges User-Objekt mit den erforderlichen Feldern
  return {
    ...userData,
    role: userData.role as UserRole,  // Cast string to UserRole enum
    status: UserStatus.ACTIVE,  // Default-Wert für Status
    createdAt: new Date(),  // Platzhalter für createdAt
    updatedAt: new Date()   // Platzhalter für updatedAt
  };
}

/**
 * Initialisiert die Authentifizierung
 * (Prüft vorhandene Tokens und leitet weiter)
 */
export async function initializeAuth(
  callback: {
    setUser: (user: User | null) => void;
    refreshAuth: () => Promise<boolean>;
    redirectToLogin: (fromPath: string) => void;
    redirectToDashboard: () => void;
  },
  currentPath: string
): Promise<boolean> {
  const { setUser, refreshAuth, redirectToLogin, redirectToDashboard } = callback;
  
  try {
    const accessToken = TokenManager.getAccessToken();
    
    if (accessToken) {
      // Prüfen, ob das Token abgelaufen ist
      if (TokenManager.isTokenExpired(accessToken)) {
        // Token ist abgelaufen, versuchen zu aktualisieren
        const refreshed = await refreshAuth();
        
        if (!refreshed) {
          // Konnte Token nicht aktualisieren, daher löschen
          TokenManager.clearTokens();
          setUser(null);
          
          // Zur Login-Seite weiterleiten, wenn nicht auf einer öffentlichen Route
          if (currentPath && !isPublicRoute(currentPath)) {
            redirectToLogin(currentPath);
          }
          
          return false;
        }
        
        return true;
      } else {
        // Token ist gültig, Benutzer extrahieren
        const userData = TokenManager.getUserFromToken(accessToken);
        
        if (userData) {
          setUser({
            ...userData,
            role: userData.role as UserRole,
            status: UserStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Wenn wir auf der Login-Seite sind mit gültigem Token, zur Dashboard-Seite weiterleiten
          if (currentPath && currentPath.includes('/auth/login')) {
            redirectToDashboard();
          }
          
          return true;
        } else {
          // Token enthält keine gültigen Benutzerdaten
          TokenManager.clearTokens();
          return false;
        }
      }
    }
  } catch (error) {
    console.error('Fehler bei der Auth-Initialisierung:', error);
    TokenManager.clearTokens();
  }
  
  return false;
}

/**
 * Prüft, ob ein Benutzer eine bestimmte Rolle hat
 */
export function hasRequiredRole(userRole: string | undefined, requiredRole: AuthRole | AuthRole[]): boolean {
  if (!userRole) {
    return false;
  }
  
  // TokenManager für konsistente Prüfung verwenden
  return TokenManager.hasRole(userRole, requiredRole);
}
