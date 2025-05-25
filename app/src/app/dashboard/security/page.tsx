'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SecurityRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings page security tab
    router.replace('/dashboard/settings?tab=security');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-96">
      <p className="text-gray-600">Redirecting to security settings...</p>
    </div>
  );
}
