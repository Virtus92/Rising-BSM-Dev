import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

// Loader-Komponente als Fallback für Suspense
function LoginFormSkeleton() {
  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 animate-pulse">
      <div className="text-center mb-8">
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 mx-auto mt-2"></div>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-1"></div>
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
        </div>
        
        <div className="flex items-center">
          <div className="h-4 w-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 ml-2"></div>
        </div>
        
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Rising BSM</h2>
          </div>
          
          {/* LoginForm in Suspense einbetten */}
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
            
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