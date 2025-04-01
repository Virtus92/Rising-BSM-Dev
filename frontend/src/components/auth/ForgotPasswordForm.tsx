'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// API-Funktion für Passwort-Reset
async function requestPasswordReset(email: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw new Error('Es gab ein Problem bei der Anfrage. Bitte versuchen Sie es später erneut.');
  }
}

// Formularschema
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .min(1, 'E-Mail ist erforderlich'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await requestPasswordReset(data.email);
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message || 'Es gab ein Problem bei der Anfrage. Bitte versuchen Sie es später erneut.');
      }
    } catch (err: any) {
      setError(err.message || 'Es gab ein Problem bei der Anfrage. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Passwort zurücksetzen</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {isSuccess ? (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md p-4 mb-6 text-sm">
          Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts gesendet.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
              placeholder="ihre.email@beispiel.de"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
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
        <Link href="/auth/login" className="flex items-center text-sm text-green-600 hover:text-green-500 dark:text-green-500">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zur Anmeldung
        </Link>
      </div>
    </div>
  );
}