import type { Metadata } from 'next';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Passwort zurücksetzen - Rising BSM',
  description: 'Setzen Sie Ihr Passwort für Rising BSM zurück',
};

interface ResetPasswordPageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = params;
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Rising BSM</h2>
          </div>
          
          <ResetPasswordForm token={token} />
        </div>
      </div>
      
      {/* Image section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/images/login-cover.jpg"
          alt="Rising BSM Passwort zurücksetzen"
        />
      </div>
    </div>
  );
}