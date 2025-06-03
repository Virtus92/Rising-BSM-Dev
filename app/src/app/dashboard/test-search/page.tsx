'use client';

import { useState } from 'react';
import { CustomerList } from '@/features/customers/components/CustomerList';
import { UserList } from '@/features/users/components/UserList';
import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { RequestList } from '@/features/requests/components/RequestList';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';

/**
 * Test page to verify search and filtering functionality
 */
export default function TestSearchPage() {
  const [activeList, setActiveList] = useState<'customers' | 'users' | 'appointments' | 'requests'>('customers');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              This page tests the search and filtering functionality for all list implementations.
              Try searching and using filters on each list type to verify they work correctly.
            </AlertDescription>
          </Alert>

          {/* Tab buttons */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeList === 'customers' ? 'default' : 'outline'}
              onClick={() => setActiveList('customers')}
            >
              Customers
            </Button>
            <Button
              variant={activeList === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveList('users')}
            >
              Users
            </Button>
            <Button
              variant={activeList === 'appointments' ? 'default' : 'outline'}
              onClick={() => setActiveList('appointments')}
            >
              Appointments
            </Button>
            <Button
              variant={activeList === 'requests' ? 'default' : 'outline'}
              onClick={() => setActiveList('requests')}
            >
              Requests
            </Button>
          </div>

          {/* Test instructions */}
          <Alert className="mb-6" variant="default">
            <AlertDescription>
              <strong>Test Instructions:</strong>
              <ul className="list-disc ml-6 mt-2">
                <li>Use the search bar to search across all fields</li>
                <li>Click "Filters" to open the filter panel</li>
                <li>Try different filter combinations</li>
                <li>Check that URL parameters update when filtering</li>
                <li>Verify that the main header search works on this page</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Active list */}
          <div className="border rounded-lg p-4">
            {activeList === 'customers' && <CustomerList />}
            {activeList === 'users' && <UserList />}
            {activeList === 'appointments' && <AppointmentList />}
            {activeList === 'requests' && <RequestList />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
