import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { useToast } from '@/shared/hooks/useToast';

interface CustomerNote {
  id: number;
  customerId: number;
  userId: number;
  userName: string;
  text: string | { text: string } | any; // Handle different possible formats
  details?: string; // Some APIs might use this field instead
  createdAt: string;
  formattedDate?: string;
}

/**
 * Hook for managing customer notes
 * Uses the service factory pattern through CustomerService
 */
export const useCustomerNotes = (customerId: number) => {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch customer notes
  const fetchNotes = useCallback(async (forceRefresh = false) => {
    if (!customerId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching notes for customer:', customerId);
      
      // Use a cache-busting parameter to avoid caching issues
      const endpoint = `/api/customers/${customerId}/notes${forceRefresh ? `?t=${Date.now()}` : ''}`;
      console.log('API endpoint:', endpoint);
      
      const response = await CustomerService.getCustomerNotes(customerId);
      
      console.log('Notes API response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('Setting notes from API:', JSON.stringify(response.data || [], null, 2));
        setNotes(response.data || []);
      } else {
        console.error('API error fetching notes:', response.message);
        setError(response.message || 'Failed to fetch customer notes');
      }
    } catch (err) {
      console.error('Error fetching customer notes:', err);
      setError('An unexpected error occurred while fetching notes');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  // Add a new note
  const addNote = useCallback(async (noteText: string) => {
    if (!customerId || !noteText.trim()) return false;
    
    try {
      setIsAddingNote(true);
      
      console.log('Adding note for customer:', customerId, noteText);
      const response = await CustomerService.addCustomerNote(customerId, noteText);
      console.log('Add note API response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        toast({
          title: 'Note added',
          description: 'Note added successfully',
          variant: 'success'
        });
        
        // Force refresh notes after adding
        await fetchNotes(true);
        
        // For debugging, immediately check the API again to verify the note was saved
        setTimeout(async () => {
          console.log('Verifying note was saved...');
          const verifyResponse = await CustomerService.getCustomerNotes(customerId);
          console.log('Verification response:', JSON.stringify(verifyResponse, null, 2));
        }, 1000);
        
        return true;
      } else {
        console.error('API error adding note:', response.message);
        toast({
          title: 'Error',
          description: response.message || 'Failed to add note',
          variant: 'error'
        });
        return false;
      }
    } catch (err) {
      console.error('Error adding note:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while adding note',
        variant: 'error'
      });
      return false;
    } finally {
      setIsAddingNote(false);
    }
  }, [customerId, fetchNotes, toast]);

  // Initial fetch
  useEffect(() => {
    console.log('Initial note fetch for customer:', customerId);
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    isLoading,
    error,
    isAddingNote,
    addNote,
    refreshNotes: fetchNotes
  };
};