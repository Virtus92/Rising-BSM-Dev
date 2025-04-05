'use client';

import { useState, useEffect, FormEvent, useRef, MutableRefObject } from 'react';
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
  rememberMe: z.boolean(),
});

// Typ für das Formular erstellen
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Refs für direkten Zugriff auf die Formularelemente
  const emailRef: MutableRefObject<HTMLInputElement | null> = useRef(null);
  const passwordRef: MutableRefObject<HTMLInputElement | null> = useRef(null);
  const rememberMeRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  // Formular konfigurieren
  const {
    register,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Sicherer Umgang mit searchParams in einem useEffect
  useEffect(() => {
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
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  // Formularverarbeitung durch react-hook-form
  const onSubmit = async (data: LoginFormValues) => {
    await submitForm(data);
  };

  // Unsere eigene Submit-Funktion, die auch direkt aufgerufen werden kann
  const submitForm = async (data: LoginFormValues) => {
    // Fehler zurücksetzen
    clearError();
    console.log("Form Submitted with:", data);
    
    // Login-Funktion aufrufen
    await login(data.email, data.password, data.rememberMe);
    // Die Weiterleitung erfolgt innerhalb des AuthProviders
  };

  // Expliziter Event-Handler für das native Formular-Submit-Event
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Werte direkt aus dem Formular holen, falls react-hook-form versagt
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Validieren und Absenden
    try {
      const validatedData = loginSchema.parse({
        email,
        password,
        rememberMe
      });
      
      await submitForm(validatedData);
    } catch (validationError) {
      console.error("Validation error:", validationError);
      // Fehlermeldung würde normalerweise durch react-hook-form angezeigt
    }
  };

  // Registriere die Formularelemente mit react-hook-form UND füge refs hinzu
  const emailProps = register('email');
  const passwordProps = register('password');
  const rememberMeProps = register('rememberMe');

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anmelden</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Melden Sie sich an, um auf Ihr BSM-Konto zuzugreifen
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

      {/* Beide Handler für maximale Kompatibilität - der native und der react-hook-form */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            name="email"  // Wichtig für FormData
            type="email"
            autoComplete="email"
            ref={(e) => {
              emailRef.current = e;
              emailProps.ref(e);
            }}
            onChange={(e) => {
              emailProps.onChange(e);
              if (error) clearError();
            }}
            onBlur={emailProps.onBlur}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
            placeholder="ihre.email@beispiel.de"
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
              name="password"  // Wichtig für FormData
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              ref={(e) => {
                passwordRef.current = e;
                passwordProps.ref(e);
              }}
              onChange={(e) => {
                passwordProps.onChange(e);
                if (error) clearError();
              }}
              onBlur={passwordProps.onBlur}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white"
              placeholder="••••••••"
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
            name="rememberMe"  // Wichtig für FormData
            type="checkbox"
            ref={(e) => {
              rememberMeRef.current = e;
              rememberMeProps.ref(e);
            }}
            onChange={rememberMeProps.onChange}
            onBlur={rememberMeProps.onBlur}
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
