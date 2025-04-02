'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Eye, EyeOff } from 'lucide-react';

// Login-Schema erstellen
const loginSchema = z.object({
  email: z.string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .min(1, 'E-Mail ist erforderlich'),
  password: z.string()
    .min(1, 'Passwort ist erforderlich'),
  rememberMe: z.boolean().optional().default(false)
});

// Typ für das Formular erstellen
interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sicherer Umgang mit searchParams in einem useEffect
  useEffect(() => {
    // Redirect-Parameter aus der URL abrufen
    if (searchParams) {
      const redirect = searchParams.get('redirect');
      if (redirect) {
        setRedirectPath(redirect);
      }
    }
  }, [searchParams]);

  // Weiterleitung zum Dashboard, wenn bereits angemeldet
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password, data.rememberMe);
      router.push(redirectPath);
    } catch (error) {
      // Fehler wird bereits im AuthProvider behandelt
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anmelden</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Melden Sie sich an, um auf Ihr BSM-Konto zuzugreifen
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md p-4 mb-6 text-sm">
          {error}
        </div>
      )}

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
            onChange={() => error && clearError()}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Passwort
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-green-600 hover:text-green-500 dark:text-green-500">
              Passwort vergessen?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register('password')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
              placeholder="••••••••"
              onChange={() => error && clearError()}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            {...register('rememberMe')}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Angemeldet bleiben
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Anmelden...
              </>
            ) : (
              'Anmelden'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}