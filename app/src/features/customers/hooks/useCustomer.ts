import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerClient } from '@/features/customers/lib/clients';
import { UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Hook zum Verwalten eines einzelnen Kunden
 */
export function useCustomer(customerId: string | number | null | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Lade Kundendaten
  const {
    data: customer,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) {
        return null;
      }
      
      const response = await CustomerClient.getCustomerById(customerId);
      if (!response.success) {
        throw new Error(response.message || `Kunde mit ID ${customerId} konnte nicht geladen werden`);
      }
      return response.data;
    },
    enabled: !!customerId, // Nur ausführen, wenn eine ID vorhanden ist
  });

  // Mutation zum Aktualisieren des Kunden
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateCustomerDto) => {
      if (!customerId) {
        throw new Error('Keine Kunden-ID vorhanden');
      }
      
      const response = await CustomerClient.updateCustomer(customerId, data);
      if (!response.success) {
        throw new Error(response.message || 'Fehler beim Aktualisieren des Kunden');
      }
      return response.data;
    },
    onSuccess: (updatedCustomer) => {
      // Aktualisiere den Cache
      queryClient.setQueryData(['customer', customerId], updatedCustomer);
      
      // Invalidiere die Kundenliste, damit sie neu geladen wird
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich aktualisiert',
        variant: 'success'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Kunde konnte nicht aktualisiert werden',
        variant: 'error'
      });
    }
  });

  // Mutation zum Löschen des Kunden
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new Error('Keine Kunden-ID vorhanden');
      }
      
      const response = await CustomerClient.deleteCustomer(customerId);
      if (!response.success) {
        throw new Error(response.message || 'Fehler beim Löschen des Kunden');
      }
      return customerId;
    },
    onSuccess: () => {
      // Entferne den Kunden aus dem Cache
      queryClient.removeQueries({ queryKey: ['customer', customerId] });
      
      // Invalidiere die Kundenliste, damit sie neu geladen wird
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich gelöscht',
        variant: 'success'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: error.message || 'Kunde konnte nicht gelöscht werden',
        variant: 'error'
      });
    }
  });

  // Funktion zum Aktualisieren des Kunden
  const updateCustomer = useCallback(async (data: UpdateCustomerDto) => {
    try {
      return await updateMutation.mutateAsync(data);
    } catch (error) {
      // Fehler wird bereits in der Mutation behandelt
      return null;
    }
  }, [updateMutation]);

  // Funktion zum Löschen des Kunden
  const deleteCustomer = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();
      return true;
    } catch (error) {
      // Fehler wird bereits in der Mutation behandelt
      return false;
    }
  }, [deleteMutation]);

  return {
    customer,
    loading: isLoading,
    error: isError ? String(error) : null,
    updateCustomer,
    deleteCustomer,
    refetch
  };
}
