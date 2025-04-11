import React from 'react';
import { RequestList } from '@/features/requests/components/RequestList';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Requests Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Request
        </Button>
      </div>
      
      <RequestList />
    </div>
  );
}
