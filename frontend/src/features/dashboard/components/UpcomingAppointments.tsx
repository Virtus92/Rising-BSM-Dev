'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar } from 'lucide-react';
import { useUpcomingAppointments } from '../hooks/useUpcomingAppointments';

export const UpcomingAppointments = () => {
  const { appointments } = useUpcomingAppointments();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-500" />
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-gray-500">No upcoming appointments</p>
        ) : (
          <ul className="space-y-4">
            {appointments.map((appointment) => (
              <li 
                key={appointment.id} 
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{appointment.customerName}</h3>
                  <p className="text-sm text-gray-600">{appointment.service}</p>
                </div>
                <div className="text-sm">
                  {appointment.scheduledAt ? new Date(appointment.scheduledAt).toLocaleString() : 'N/A'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
