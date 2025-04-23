'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

/**
 * New User Page
 * 
 * This component serves as a fallback for the /dashboard/users/new route.
 * It immediately redirects to the users list page with the modal open.
 * The middleware should handle most cases, but this is a safety measure.
 */
export default function NewUserPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Store flag in session storage to open the modal when we get to the users page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('openNewUserModal', 'true');
      
      // Redirect to the users list
      router.push('/dashboard/users');
    }
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg text-center">
        Redirecting to user management...
      </p>
    </div>
  );
}
