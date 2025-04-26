import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { AuthClient } from '@/features/auth/lib/clients/AuthClient';
import { useToast } from '@/shared/hooks/useToast';

type ForgotPasswordData = {
  email: string;
};

type ResetPasswordData = {
  token: string;
  password: string;
  confirmPassword: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  terms?: boolean;
};

type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

/**
 * Hook für die Verwaltung von Authentifizierungsfunktionen
 * 
 * Bietet Hilfsfunktionen für Anmeldung, Registrierung, Passwort-Verwaltung, etc.
 */
export function useAuthManagement() {
  const { login: authLogin, logout: authLogout, register: authRegister } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Login-Funktion
   */
  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
    // Verwenden Sie die Funktion aus dem AuthProvider, um Dopplung zu vermeiden
    // Der AuthProvider kümmert sich um das Token-Management und die Benutzerstatusverwaltung
    setLoading(true);
    setError(null);
    
    try {
      // Wichtig: Hier wird der Login direkt über den AuthProvider ausgeführt
      // Der AuthProvider kümmert sich um die Weiterleitung, daher keine weitere Router-Navigation hier
      await authLogin({ email, password, remember });
      
      // Success toast is now handled by the LoginForm component
      // This prevents duplicate toast notifications
      
      // Keine Weiterleitung hier, die wird vom AuthProvider übernommen
      // Router-Navigation hier würde zu Dopplung führen und Konflikte verursachen
      console.log('Login successful, redirect will be handled by AuthProvider');
      
      return true;
    } catch (error) {
      console.error('Login fehlgeschlagen:', error as Error);
      
      // Store the error message in state for potential UI display
      setError(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen');
      
      // Error toast is now handled by the LoginForm component
      // This prevents duplicate toast notifications
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [authLogin, toast]);
  
  /**
   * Logout-Funktion
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await authLogout();
      
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Sie wurden erfolgreich abgemeldet.',
        variant: 'success'
      });
      
      router.push('/auth/login');
      return true;
    } catch (error) {
      console.error('Abmeldung fehlgeschlagen:', error as Error);
      
      toast({
        title: 'Fehler bei der Abmeldung',
        description: 'Bitte versuchen Sie es erneut.',
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [authLogout, router, toast]);
  
  /**
   * Funktion zum Zurücksetzen des Passworts (Schritt 1: E-Mail anfordern)
   */
  const forgotPassword = useCallback(async ({ email }: ForgotPasswordData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthClient.forgotPassword(email);
      
      if (response.success) {
        toast({
          title: 'E-Mail gesendet',
          description: 'Eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts wurde gesendet.',
          variant: 'success'
        });
        return true;
      } else {
        setError(response.message || 'Fehler beim Anfordern des Passwort-Resets');
        toast({
          title: 'Fehler',
          description: response.message || 'Fehler beim Anfordern des Passwort-Resets',
          variant: 'error'
        });
        return false;
      }
    } catch (error) {
      console.error('Fehler bei Passwort vergessen:', error as Error);
      
      setError(error instanceof Error ? error.message : 'Fehler beim Anfordern des Passwort-Resets');
      
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Anfordern des Passwort-Resets',
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Funktion zum Zurücksetzen des Passworts (Schritt 2: Neues Passwort setzen)
   */
  const resetPassword = useCallback(async ({ token, password, confirmPassword }: ResetPasswordData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthClient.resetPassword(token, password, confirmPassword);
      
      if (response.success) {
        toast({
          title: 'Passwort zurückgesetzt',
          description: 'Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.',
          variant: 'success'
        });
        
        router.push('/auth/login');
        return true;
      } else {
        setError(response.message || 'Fehler beim Zurücksetzen des Passworts');
        toast({
          title: 'Fehler',
          description: response.message || 'Fehler beim Zurücksetzen des Passworts',
          variant: 'error'
        });
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error as Error);
      
      setError(error instanceof Error ? error.message : 'Fehler beim Zurücksetzen des Passworts');
      
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Zurücksetzen des Passworts',
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
  /**
   * Funktion zum Registrieren eines neuen Benutzers
   */
  const register = useCallback(async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verwenden Sie immer die AuthProvider-Funktion, wenn vorhanden
      await authRegister(userData);
      
      toast({
        title: 'Registrierung erfolgreich',
        description: 'Ihr Konto wurde erfolgreich erstellt. Sie können sich jetzt anmelden.',
        variant: 'success'
      });
      
      router.push('/auth/login');
      return true;
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error as Error);
      
      setError(error instanceof Error ? error.message : 'Fehler bei der Registrierung');
      
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler bei der Registrierung',
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [authRegister, router, toast]);
  
  /**
   * Funktion zum Ändern des Passworts
   */
  const changePassword = useCallback(async ({ currentPassword, newPassword, newPasswordConfirm }: ChangePasswordData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthClient.changePassword(currentPassword, newPassword, newPasswordConfirm);
      
      if (response.success) {
        toast({
          title: 'Passwort geändert',
          description: 'Ihr Passwort wurde erfolgreich geändert.',
          variant: 'success'
        });
        return true;
      } else {
        setError(response.message || 'Fehler beim Ändern des Passworts');
        toast({
          title: 'Fehler',
          description: response.message || 'Fehler beim Ändern des Passworts',
          variant: 'error'
        });
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Ändern des Passworts:', error as Error);
      
      setError(error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts');
      
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts',
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Funktion zum Validieren eines Reset-Tokens
   */
  const validateResetToken = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthClient.validateResetToken(token);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Ungültiger oder abgelaufener Token');
        toast({
          title: 'Fehler',
          description: response.message || 'Ungültiger oder abgelaufener Token',
          variant: 'error'
        });
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Validieren des Tokens:', error as Error);
      
      setError(error instanceof Error ? error.message : 'Ungültiger oder abgelaufener Token');
      
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ungültiger oder abgelaufener Token',
        variant: 'error'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  return {
    loading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    register,
    changePassword,
    validateResetToken,
    clearError: () => setError(null)
  };
}
