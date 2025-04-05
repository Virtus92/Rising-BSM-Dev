'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authApi from '@/lib/api/auth';
import { setTokens, clearTokens, getAccessToken, getRefreshToken, getUserFromToken, hasRole } from '@/lib/auth';
import { ApiRequestError } from '@/lib/api/config';

// Typdefinitionen
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export type AuthRole = 'admin' | 'manager' | 'mitarbeiter' | 'benutzer';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
  hasPermission: (requiredRole: AuthRole | AuthRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Öffentliche Routen, die keine Authentifizierung erfordern
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/contact',
  '/about',
  '/services',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Prüft, ob der Benutzer die erforderliche Rolle hat
  const hasPermission = useCallback((requiredRole: AuthRole | AuthRole[]): boolean => {
    if (!user) return false;
    return hasRole(user.role, requiredRole);
  }, [user]);

  // Token aktualisieren
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      setLoading(true);
      const response = await authApi.refreshToken(refreshToken);
      
      if (response.success && response.data) {
        setTokens(response.data.accessToken, response.data.refreshToken);
        
        // User-Daten aus Token extrahieren
        const user = getUserFromToken(response.data.accessToken);
        if (user) {
          setUser(user);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setError(error.message);
      } else {
        setError('Token-Aktualisierung fehlgeschlagen.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Beim Laden prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = getAccessToken();
        
        if (accessToken) {
          const user = getUserFromToken(accessToken);
          
          if (user) {
            setUser(user);
          } else {
            // Versuchen, das Token zu aktualisieren, wenn das Access Token abgelaufen ist
            const refreshed = await refreshAuth();
            
            if (!refreshed) {
              clearTokens();
              
              // Zur Login-Seite weiterleiten, wenn nicht auf einer öffentlichen Route
              if (pathname && !PUBLIC_ROUTES.includes(pathname) && typeof window !== 'undefined') {
                router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Fehler bei der Auth-Initialisierung:', error);
      } finally {
        setLoading(false);
        setInitialCheckDone(true);
      }
    };

    initializeAuth();
  }, [refreshAuth, router, pathname]);

  // Login-Funktion
  const login = async (email: string, password: string, remember = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(email, password, remember);
      
      if (response.success && response.data) {
        // Tokens speichern
        setTokens(response.data.accessToken, response.data.refreshToken);
        
        // User-Daten direkt aus der Antwort verwenden
        setUser(response.data.user);
        
        // Zur Dashboard-Seite navigieren oder zur ursprünglichen URL, falls vorhanden
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || '/dashboard';
        router.push(redirectUrl);
        
        return;
      }
      
      throw new Error('Unerwarteter Antworttyp vom Server');
    } catch (error) {
      let errorMessage = 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      
      if (error instanceof ApiRequestError) {
        // Spezifischere Fehlermeldungen basierend auf dem Statuscode
        if (error.statusCode === 401) {
          errorMessage = 'Falsche E-Mail oder Passwort. Bitte überprüfen Sie Ihre Eingaben.';
        } else if (error.statusCode === 404) {
          errorMessage = 'Benutzer mit dieser E-Mail wurde nicht gefunden.';
        } else if (error.statusCode === 400) {
          errorMessage = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre Eingaben.';
        } else if (error.statusCode === 403) {
          errorMessage = 'Ihr Konto ist gesperrt oder deaktiviert.';
        } else {
          // Verwende die vom Server zurückgegebene Fehlermeldung, falls vorhanden
          errorMessage = error.message || errorMessage;
        }
        
        // Verwende zusätzliche Fehlerdetails, falls vorhanden
        if (error.errors && error.errors.length > 0) {
          errorMessage = error.errors[0];
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      console.error('Login fehlgeschlagen:', errorMessage);
      // Verhindere, dass der Fehler an den Aufrufer weitergegeben wird
      return Promise.resolve();
    } finally {
      setLoading(false);
    }
  };

  // Logout-Funktion
  const logout = async () => {
    setLoading(true);
    
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API-Aufruf fehlgeschlagen', error);
    } finally {
      // Tokens löschen
      clearTokens();
      
      // User-State zurücksetzen
      setUser(null);
      
      // Zur Login-Seite navigieren
      router.push('/auth/login');
      
      setLoading(false);
    }
  };

  // Fehler löschen
  const clearError = () => {
    setError(null);
  };

  // Sicherheitscheck für geschützte Routen
  useEffect(() => {
    if (initialCheckDone && !loading) {
      const isPublicRoute = pathname ? PUBLIC_ROUTES.some(route => 
        pathname === route || 
        pathname.startsWith(route + '/') || 
        (route.endsWith('*') && pathname.startsWith(route.slice(0, -1)))
      ) : false;
      
      if (!isPublicRoute && !user && typeof window !== 'undefined') {
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
      }
    }
  }, [initialCheckDone, loading, user, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
        clearError,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook für den einfachen Zugriff auf den AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  
  return context;
}
