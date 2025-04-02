import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as appointmentsApi from '@/lib/api/appointments';
import { Appointment, AppointmentCreate, AppointmentUpdate } from '@/types/appointments';
import { useToast } from '@/hooks/useToast';

export function useAppointments(params: Record<string, any> = {}) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      try {
        return await appointmentsApi.getAppointments(params);
      } catch (error: any) {
        toast({
          title: 'Fehler beim Laden der Termine',
          description: error.message || 'Bitte versuchen Sie es später erneut.',
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
          title: 'Fehler beim Laden des Termins',
          description: error.message || 'Bitte versuchen Sie es später erneut.',
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
      // Alle Termine-Abfragen ungültig machen
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Termin erstellt',
        description: 'Der Termin wurde erfolgreich erstellt.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Erstellen des Termins',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
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
      // Einzelnen Termin und Liste der Termine ungültig machen
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Termin aktualisiert',
        description: 'Der Termin wurde erfolgreich aktualisiert.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Aktualisieren des Termins',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
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
        title: 'Status aktualisiert',
        description: 'Der Status des Termins wurde erfolgreich aktualisiert.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Aktualisieren des Status',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
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
      // Liste der Termine ungültig machen
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast({
        title: 'Termin gelöscht',
        description: 'Der Termin wurde erfolgreich gelöscht.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Löschen des Termins',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
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
      // Einzelnen Termin ungültig machen
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      
      toast({
        title: 'Notiz hinzugefügt',
        description: 'Die Notiz wurde erfolgreich hinzugefügt.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Hinzufügen der Notiz',
        description: error.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'error',
      });
    },
  });
}