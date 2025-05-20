'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthManagement } from '@/features/auth/hooks/useAuthManagement';
import { useToast } from '@/shared/hooks/useToast';
import { RegisterData } from '@/features/auth/providers/AuthProvider';

/**
 * Typdefinition für die Formularfelder und Fehler
 */
type FormData = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  acceptTerms: boolean;
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

/**
 * RegisterForm-Komponente für die Benutzerregistrierung
 */
export default function RegisterForm() {
  // State für Formularfelder
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks
  const { register } = useAuthManagement();
  const router = useRouter();
  const { toast } = useToast();

  // Handler für Änderungen in Textfeldern
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Fehler zurücksetzen, wenn Feld aktualisiert wird
    if (errors[name as keyof FormData]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };

  // Handler für Checkbox-Änderungen
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: checked
    }));
    
    // Fehler zurücksetzen, wenn Feld aktualisiert wird
    if (errors[name as keyof FormData]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };

  // Formularvalidierung
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validierung für name
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    // Validierung für email
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    
    // Validierung für password
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    // Validierung für passwordConfirm
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwort bestätigen ist erforderlich';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwörter stimmen nicht überein';
    }
    
    // Validierung für acceptTerms
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Sie müssen den Nutzungsbedingungen zustimmen';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler für das Absenden des Formulars
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bei laufender Übermittlung nichts tun
    if (isSubmitting) return;
    
    // Validieren
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Register-Funktion aus dem AuthManagement-Hook verwenden
      const registerData: RegisterData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.passwordConfirm,
        passwordConfirm: formData.passwordConfirm, // Send both formats for compatibility
        terms: formData.acceptTerms,
      };
      
      const success = await register(registerData);
      
      if (success) {
        toast({
          title: 'Registrierung erfolgreich',
          description: 'Bitte melden Sie sich mit Ihren neuen Zugangsdaten an.',
          variant: 'success',
        });
        
        // Zum Login-Bildschirm weiterleiten
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error as Error);
      toast({
        title: 'Fehler bei der Registrierung',
        description: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-card rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrieren</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Erstellen Sie Ihr Konto
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border ${
              errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-800/80 dark:text-white`}
            placeholder="Ihr vollständiger Name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border ${
              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-800/80 dark:text-white`}
            placeholder="name@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Passwort
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full pl-3 pr-10 py-2 border ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-800/80 dark:text-white`}
              placeholder="Mindestens 8 Zeichen"
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
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Passwort bestätigen
          </label>
          <div className="relative">
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type={showPasswordConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={formData.passwordConfirm}
              onChange={handleInputChange}
              className={`w-full pl-3 pr-10 py-2 border ${
                errors.passwordConfirm ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-800/80 dark:text-white`}
              placeholder="Passwort wiederholen"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              aria-label={showPasswordConfirm ? "Passwort verbergen" : "Passwort anzeigen"}
            >
              {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.passwordConfirm && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.passwordConfirm}</p>
          )}
        </div>

        <div className="flex items-start">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={handleCheckboxChange}
            className="h-4 w-4 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Ich stimme den <Link href="/terms" className="text-green-600 hover:text-green-500 dark:text-green-500 dark:hover:text-green-400">Nutzungsbedingungen</Link> und der <Link href="/privacy" className="text-green-600 hover:text-green-500 dark:text-green-500 dark:hover:text-green-400">Datenschutzerklärung</Link> zu.
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Registrieren...
              </>
            ) : (
              'Registrieren'
            )}
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bereits registriert?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-green-600 hover:text-green-500 dark:text-green-500 dark:hover:text-green-400"
            >
              Anmelden
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
