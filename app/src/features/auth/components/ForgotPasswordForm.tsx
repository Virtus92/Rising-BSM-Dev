'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthManagement } from '@/features/auth/hooks/useAuthManagement';

/**
 * Formular zum Zurücksetzen des Passworts (Anforderung des Reset-Links)
 */
export default function ForgotPasswordForm() {
  // States
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Auth-Management-Hook
  const { forgotPassword, error, clearError } = useAuthManagement();

  // E-Mail validieren
  const validateEmail = () => {
    if (!email) {
      setEmailError('E-Mail ist erforderlich');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return false;
    }
    
    setEmailError(null);
    return true;
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bei laufender Übermittlung nichts tun
    if (isSubmitting) return;
    
    // Fehler zurücksetzen
    clearError();
    
    // E-Mail validieren
    if (!validateEmail()) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await forgotPassword({ email });
      
      if (success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error requesting password reset:', error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Passwort zurücksetzen</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
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
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">E-Mail versendet</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                <p>
                  Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
                if (error) clearError();
              }}
              className={`w-full px-3 py-2 border ${
                emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-800/80 dark:text-white`}
              placeholder="name@example.com"
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Senden...
                </>
              ) : (
                'Link zum Zurücksetzen senden'
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
