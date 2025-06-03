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

  // Get data from entity hooks - don't pass initial search term
  const customersHook = useCustomers({
    limit: 5
  });
  
  const appointmentsHook = useAppointments({
    limit: 5
  });

  const requestsHook = useRequests({
    limit: 5
  });
  
  // Extract what we need
  const { items: customers = [], isLoading: isLoadingCustomers, setSearch: setCustomerSearch, refetch: refetchCustomers } = customersHook;
  const { items: appointments = [], isLoading: isLoadingAppointments, setSearch: setAppointmentSearch, refetch: refetchAppointments } = appointmentsHook;
  const { items: requests = [], isLoading: isLoadingRequests, setSearch: setRequestSearch, refetch: refetchRequests } = requestsHook;

  // Perform search across entities
  const search = useCallback(async (term: string) => {
    if (!term) {
      setSearchResults([]);
      // Clear search in all hooks
      setCustomerSearch('');
      setAppointmentSearch('');
      setRequestSearch('');
      return;
    }

    setIsSearching(true);
    
    try {
      // Update search term in all hooks before refetching
      setCustomerSearch(term);
      setAppointmentSearch(term);
      setRequestSearch(term);
      
      // Refetch data with the new search term
      await Promise.allSettled([
        refetchCustomers(),
        refetchAppointments(),
        refetchRequests()
      ]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [setCustomerSearch, setAppointmentSearch, setRequestSearch, refetchCustomers, refetchAppointments, refetchRequests]);

  // Combine results whenever data changes
  useEffect(() => {
    if (searchTerm && !isSearching) {
      // Combine results - ensure arrays are defined
      const customerResults = Array.isArray(customers) ? customers : [];
      const appointmentResults = Array.isArray(appointments) ? appointments : [];
      const requestResults = Array.isArray(requests) ? requests : [];
      
      const results: SearchResult[] = [
        ...customerResults.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          type: 'customer' as const
        })),
        ...appointmentResults.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          customerName: appointment.customerName,
          date: appointment.appointmentDate,
          type: 'appointment' as const
        })),
        ...requestResults.map(request => ({
          id: request.id,
          name: request.name,
          title: request.service || request.name,
          email: request.email,
          service: request.service,
          createdAt: request.createdAt,
          type: 'request' as const
        }))
      ];
      
      setSearchResults(results);
    } else if (!searchTerm) {
      setSearchResults([]);
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
