'use client';
import React from 'react';
import { CustomerList } from '@/features/customers/components/CustomerList';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      </div>
      
      <CustomerList />
    </div>
  );
}
