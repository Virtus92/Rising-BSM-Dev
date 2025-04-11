'use client';

import React from 'react';
import { UserList } from '@/features/users/components/UserList';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
      
      <UserList />
    </div>
  );
}
