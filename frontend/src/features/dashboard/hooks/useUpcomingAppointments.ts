'use client';

import { useState, useEffect } from 'react';
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';
import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';

export const useUpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      try {
        setIsLoading(true);
        const response = await AppointmentService.getUpcomingAppointments();
        if (response.success && response.data) {
          setAppointments(response.data);
        } else {
          setError(response.message || 'Failed to fetch upcoming appointments');
        }
      } catch (error) {
        console.error('Failed to fetch upcoming appointments', error);
        setError('Failed to fetch upcoming appointments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingAppointments();
  }, []);

  return { appointments, isLoading, error };
};
