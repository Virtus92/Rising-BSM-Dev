'use client';

import React from 'react';
import { CustomerList } from '@/features/customers/components/CustomerList';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();
  
  const handleCreateCustomer = () => {
    router.push('/dashboard/customers/new');
  };
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* We've removed the redundant title and description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <CustomerList onCreateClick={handleCreateCustomer} />
      </div>
    </div>
  );
}
