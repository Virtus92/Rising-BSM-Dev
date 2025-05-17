'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useRequests } from '@/features/requests/hooks/useRequests';

interface SearchResult {
  id: string | number;
  name?: string;
  title?: string;
  type: 'customer' | 'appointment' | 'request';
  [key: string]: any;
}

/**
 * Hook for searching across multiple entities
 * 
 * Searches customers, appointments, and requests for the given search term
 */
export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get data from entity hooks
  const { customers, isLoading: isLoadingCustomers, refetch: refetchCustomers } = useCustomers({
    search: searchTerm,
    limit: 5
  });
  
  const { appointments, isLoading: isLoadingAppointments, refetch: refetchAppointments } = useAppointments({
    search: searchTerm,
    limit: 5
  });

  const { requests, isLoading: isLoadingRequests, refetch: refetchRequests } = useRequests({
    search: searchTerm,
    limit: 5
  });

  // Perform search across entities - removed data dependencies to prevent infinite loop
  const search = useCallback(async (term: string) => {
    if (!term) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Refetch data with the search term
      await Promise.all([
        refetchCustomers(),
        refetchAppointments(),
        refetchRequests()
      ]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [refetchCustomers, refetchAppointments, refetchRequests]);

  // Combine results whenever data changes
  useEffect(() => {
    if (searchTerm && !isSearching) {
      // Combine results
      const results: SearchResult[] = [
        ...customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          type: 'customer' as const
        })),
        ...appointments.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          customerName: appointment.customerName,
          date: appointment.appointmentDate,
          type: 'appointment' as const
        })),
        ...requests.map(request => ({
          id: request.id,
          name: request.name,
          title: request.service || request.name,
          email: request.email,
          type: 'request' as const
        }))
      ];
      
      setSearchResults(results);
    }
  }, [customers, appointments, requests, searchTerm, isSearching]);
  
  // Search when search term changes - removed search dependency
  useEffect(() => {
    if (searchTerm) {
      const timeout = setTimeout(() => {
        search(searchTerm);
      }, 300);
      
      return () => clearTimeout(timeout);
    } else {
      setSearchResults([]);
    }
    // Intentionally exclude 'search' from dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Return search state and functions
  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching: isSearching || isLoadingCustomers || isLoadingAppointments || isLoadingRequests,
    search
  };
}
