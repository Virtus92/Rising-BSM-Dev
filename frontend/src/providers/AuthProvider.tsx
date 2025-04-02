'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/api/auth';
import { setTokens, clearTokens, getAccessToken, getRefreshToken, getUserFromToken } from '@/lib/auth';

// Typen definieren
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Refresh Token Funktion
  const refreshAuth = async (): Promise<boolean> => {
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
      console.error('Token refresh failed', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Beim Laden prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const initializeAuth = async () => {
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
          }
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

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
        
        // Zur Dashboard-Seite navigieren
        router.push('/dashboard');
      } else {
        throw new Error(response.message || 'Anmeldung fehlgeschlagen');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      setError(errorMessage);
      console.error('Login failed:', errorMessage);
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
      console.error('Logout API call failed', error);
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
        clearError
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
