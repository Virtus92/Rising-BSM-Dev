import { useState, useEffect } from 'react';
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';
import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await AppointmentService.getAppointments();
      if (response.success && response.data) {
        setAppointments(response.data);
      } else {
        setError(response.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const deleteAppointment = async (appointmentId: number) => {
    try {
      const response = await AppointmentService.deleteAppointment(appointmentId);
      if (response.success) {
        setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
      } else {
        setError(response.message || 'Failed to delete appointment');
      }
    } catch (err) {
      setError('Failed to delete appointment');
      console.error(err);
    }
  };

  return { 
    appointments, 
    isLoading, 
    error, 
    deleteAppointment,
    refetch: fetchAppointments 
  };
};
