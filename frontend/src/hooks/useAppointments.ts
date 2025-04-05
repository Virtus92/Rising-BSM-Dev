import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as appointmentsApi from '@/lib/api/appointments';
import { Appointment, AppointmentCreateRequest as AppointmentCreate, AppointmentUpdateRequest as AppointmentUpdate } from '@/lib/api/types';
import { useToast } from '@/hooks/useToast';

export function useAppointments(params: Record<string, any> = {}) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      try {
        const response = await appointmentsApi.getAppointments(params);
        
        // Datenstruktur normalisieren
        if (response.success) {
          if (Array.isArray(response.data)) {
            // Wenn response.data bereits ein Array ist
            return {
              ...response,
              data: response.data
            };
          } else if (response.data && response.data.appointments && Array.isArray(response.data.appointments)) {
            // Wenn appointments im data-Objekt eingebettet sind
            return {
              ...response,
              data: response.data.appointments
            };
          }
        }
        
        return response;
      } catch (error: any) {
        console.error('Error in useAppointments hook:', error);
        toast({
          title: 'Error loading appointments',
          description: error.message || 'Please try again later.',
          variant: 'error',
        });
        throw error;
      }
    }
  });
}

export function useAppointment(id: number | string) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      try {
        return await appointmentsApi.getAppointmentById(id);
      } catch (error: any) {
        toast({
          title: 'Error loading appointment',
          description: error.message || 'Please try again later.',
          variant: 'error',
        });
        throw error;
      }
    },
    enabled: !!id
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: AppointmentCreate) => appointmentsApi.createAppointment(data),
    onSuccess: () => {
      // Invalidate all appointments queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Appointment created',
        description: 'The appointment was successfully created.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating appointment',
        description: error.message || 'Please try again later.',
        variant: 'error',
      });
    },
  });
}

export function useUpdateAppointment(id: number | string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: AppointmentUpdate) => appointmentsApi.updateAppointment(id, data),
    onSuccess: () => {
      // Invalidate the individual appointment and the list of appointments
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Appointment updated',
        description: 'The appointment was successfully updated.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating appointment',
        description: error.message || 'Please try again later.',
        variant: 'error',
      });
    },
  });
}

export function useUpdateAppointmentStatus(id: number | string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) => 
      appointmentsApi.updateAppointmentStatus(id, status, note),
    onSuccess: () => {
      // Einzelnen Termin und Liste der Termine ungültig machen
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Status updated',
        description: 'The appointment status was successfully updated.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating status',
        description: error.message || 'Please try again later.',
        variant: 'error',
      });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: number | string) => appointmentsApi.deleteAppointment(id),
    onSuccess: () => {
      // Invalidate the appointments list
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Appointment deleted',
        description: 'The appointment was successfully deleted.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting appointment',
        description: error.message || 'Please try again later.',
        variant: 'error',
      });
    },
  });
}

export function useAddAppointmentNote(id: number | string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (note: string) => appointmentsApi.addAppointmentNote(id, note),
    onSuccess: () => {
      // Invalidate the individual appointment
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      
      toast({
        title: 'Note added',
        description: 'The note was successfully added.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error adding note',
        description: error.message || 'Please try again later.',
        variant: 'error',
      });
    },
  });
}