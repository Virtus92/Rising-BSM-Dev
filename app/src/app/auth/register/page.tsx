import { Metadata } from 'next';
import RegisterForm from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrieren | RISING BSM',
  description: 'Erstellen Sie ein Konto bei RISING BSM für den Zugriff auf unser Kundenportal.',
};

/**
 * Registrierungsseite
 * 
 * Ermöglicht es neuen Benutzern, ein Konto zu erstellen
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted">
      <RegisterForm />
    </div>
  );
}
