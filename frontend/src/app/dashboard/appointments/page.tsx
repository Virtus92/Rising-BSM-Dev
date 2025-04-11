import React from 'react';
import { AppointmentList } from '@/features/appointments/components/AppointmentList';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Appointment Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>
      
      <AppointmentList />
    </div>
  );
}
