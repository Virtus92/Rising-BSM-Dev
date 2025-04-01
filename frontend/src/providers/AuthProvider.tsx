'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';

// Typen definieren
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// AuthContext erstellen
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider erstellen
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Beim Laden prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const checkUserAuthentication = async () => {
      try {
        // Eine Möglichkeit wäre, einen API-Endpunkt zum Abrufen des aktuellen Benutzers aufzurufen
        // Für dieses Beispiel simulieren wir, dass wir den Benutzer aus dem localStorage abrufen
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Authentication check failed', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserAuthentication();
  }, []);

  // Login-Funktion
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        // Token und User im localStorage speichern
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Zur Dashboard-Seite navigieren
        router.push('/dashboard');
      } else {
        throw new Error(response.message || 'Anmeldung fehlgeschlagen');
      }
    } catch (error: any) {
      setError(error.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Logout-Funktion
  const logout = async () => {
    setLoading(true);
    
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      // Token und User aus dem localStorage entfernen
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
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