'use client';

import React from 'react';
import { RequestList } from '@/features/requests/components/RequestList';
import { useRouter } from 'next/navigation';

export default function RequestsPage() {
  const router = useRouter();
  
  const handleCreateRequest = () => {
    router.push('/dashboard/requests/new');
  };
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* We've removed the redundant title and description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <RequestList onCreateClick={handleCreateRequest} />
      </div>
    </div>
  );
}
