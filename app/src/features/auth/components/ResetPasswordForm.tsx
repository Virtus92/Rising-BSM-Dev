'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { useAuthManagement } from '@/features/auth/hooks/useAuthManagement';

interface ResetPasswordFormProps {
  token: string;
}

/**
 * Formular zum Zurücksetzen des Passworts
 */
export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  // States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{ 
    password?: string; 
    confirmPassword?: string;
  }>({});
  
  // Router und Auth-Hook
  const router = useRouter();
  const { validateResetToken, resetPassword, error, clearError } = useAuthManagement();

  // Token beim Laden validieren
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Sanitize token first to prevent HTML errors
        const sanitizedToken = token.replace(/</g, '').replace(/>/g, '');
        
        const isValid = await validateResetToken(sanitizedToken);
        setIsTokenValid(isValid);
      } catch (err) {
        console.error('Error validating token:', err);
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, [token, validateResetToken]);

  // Formular validieren
  const validateForm = () => {
    const errors: { password?: string; confirmPassword?: string } = {};
    
    if (!password) {
      errors.password = 'Passwort ist erforderlich';
    } else if (password.length < 8) {
      errors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Passwort muss mindestens einen Großbuchstaben enthalten';
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Passwort muss mindestens eine Zahl enthalten';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Bitte bestätigen Sie Ihr Passwort';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bei laufender Übermittlung nichts tun
    if (isLoading) return;
    
    // Fehler zurücksetzen
    clearError();
    
    // Formular validieren
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const success = await resetPassword({ 
        token, 
        password, 
        confirmPassword 
      });
      
      if (success) {
        setIsSuccess(true);
        
        // Nach erfolgreicher Zurücksetzung zur Login-Seite weiterleiten
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Error resetting password:', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ladezustand während der Token-Validierung
  if (isValidating) {
    return (
      <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-4">
          <Loader2 className="animate-spin h-8 w-8 text-green-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Token wird überprüft...</p>
        </div>
      </div>
    );
  }

  // Ungültiger Token
  if (!isTokenValid) {
    return (
      <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Ungültiger oder abgelaufener Link</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.
          </p>
          <div className="mt-6">
            <Link 
              href="/auth/forgot-password"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Neuen Link anfordern
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Neues Passwort festlegen</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bitte geben Sie Ihr neues Passwort ein.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md p-4 mb-6 text-sm flex items-start">
          <svg className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Passwort zurückgesetzt</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                <p>
                  Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden in Kürze zur Anmeldeseite weitergeleitet, wo Sie sich mit Ihrem neuen Passwort anmelden können.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Neues Passwort
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) {
                    setFormErrors(prev => ({ ...prev, password: undefined }));
                  }
                  if (error) clearError();
                }}
                className={`w-full pl-3 pr-10 py-2 border ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-800/80 dark:text-white`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
            )}
            <div className="mt-2">
              <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li className={password.length >= 8 ? "text-green-500 dark:text-green-400" : ""}>
                  Mindestens 8 Zeichen
                </li>
                <li className={/[A-Z]/.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                  Mindestens ein Großbuchstabe
                </li>
                <li className={/[a-z]/.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                  Mindestens ein Kleinbuchstabe
                </li>
                <li className={/[0-9]/.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                  Mindestens eine Zahl
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Passwort bestätigen
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formErrors.confirmPassword) {
                    setFormErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                  if (error) clearError();
                }}
                className={`w-full pl-3 pr-10 py-2 border ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-800/80 dark:text-white`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Passwort zurücksetzen...
                </>
              ) : (
                'Passwort zurücksetzen'
              )}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <Link 
          href="/auth/login" 
          className="flex items-center text-sm text-green-600 hover:text-green-500 dark:text-green-500 dark:hover:text-green-400 font-medium"
          onClick={() => clearError()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zur Anmeldung
        </Link>
      </div>
    </div>
  );
}
