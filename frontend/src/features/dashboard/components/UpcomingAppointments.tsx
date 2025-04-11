'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar } from 'lucide-react';
import { useUpcomingAppointments } from '../hooks/useUpcomingAppointments';

export const UpcomingAppointments = () => {
  const { appointments, isLoading, error } = useUpcomingAppointments();

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <p className="text-muted-foreground">No upcoming appointments</p>
        ) : (
          <ul className="space-y-4">
            {appointments.map((appointment) => (
              <li 
                key={appointment.id} 
                className="flex justify-between items-center p-3 bg-muted/20 hover:bg-muted/30 transition-colors rounded-lg border">
                <div>
                  <h3 className="font-semibold">
                    {appointment.customer?.name || 'Unknown Customer'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {appointment.title || appointment.service || 'Appointment'}
                  </p>
                </div>
                <div className="text-sm">
                  {appointment.appointmentDate ? 
                    new Date(appointment.appointmentDate).toLocaleString('de-DE', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }) : 'N/A'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
