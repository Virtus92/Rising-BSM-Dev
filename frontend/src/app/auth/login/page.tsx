import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Anmelden - Rising BSM',
  description: 'Melden Sie sich bei Rising BSM an',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Rising BSM</h2>
          </div>
          
          <LoginForm />
            
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sie haben noch kein Konto?{' '}
              <span className="font-medium text-green-600 hover:text-green-500 dark:text-green-500">
                Kontaktieren Sie uns für Unternehmenszugänge!
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Image section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/images/login-cover.jpg"
          alt="Rising BSM Login"
        />
      </div>
    </div>
  );
}