'use client';

import React from 'react';
import { RequestList } from '@/features/requests/components/RequestList';

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Requests Management</h1>
      </div>
      
      <RequestList />
    </div>
  );
}
