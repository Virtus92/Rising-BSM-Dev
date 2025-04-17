'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

/**
 * Not Found Page for User
 * 
 * Displays when a user isn't found, with a special case for 'new'
 */
export default function UserNotFound({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();
  const isNewUserRoute = params.id === 'new';
  
  // If this is the 'new' route, redirect to users page with modal open
  useEffect(() => {
    if (isNewUserRoute && typeof window !== 'undefined') {
      sessionStorage.setItem('openNewUserModal', 'true');
      router.push('/dashboard/users');
    }
  }, [isNewUserRoute, router]);
  
  // If this is a 'new' user route, show a loading spinner while redirecting
  if (isNewUserRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-lg text-center">
          Redirecting to user management...
        </p>
      </div>
    );
  }
  
  // Otherwise show a not found message for other user IDs
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold">User Not Found</h1>
          
          <p className="text-gray-600 dark:text-gray-300">
            The user you are looking for doesn't exist or has been removed.
          </p>
          
          <div className="pt-4 flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            
            <Button
              onClick={() => router.push('/dashboard/users')}
            >
              User Management
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
