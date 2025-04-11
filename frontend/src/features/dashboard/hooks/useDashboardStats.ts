'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeFetch, safeParseCount } from '@/shared/utils/apiUtils';
import { useToast } from '@/shared/hooks/useToast';

type StatsState = {
  userCount: number | null;
  customerCount: number | null;
  requestCount: number | null;
  appointmentCount: number | null;
  loading: boolean;
  error: Error | null;
  refreshStats: () => Promise<void>;
};

export const useDashboardStats = () => {
  const [state, setState] = useState<StatsState>({
    userCount: null,
    customerCount: null,
    requestCount: null,
    appointmentCount: null,
    loading: true,
    error: null,
    refreshStats: async () => {}
  });
  const { toast } = useToast();

  // Extract fetchStats as a separate callback to use in refreshStats
  const fetchStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Use Promise.allSettled to continue even if some endpoints fail
      const [
        usersResponse, 
        customersResponse, 
        requestsResponse, 
        appointmentsResponse
      ] = await Promise.allSettled([
        safeFetch('/api/users/count', {}, { count: 0 }),
        safeFetch('/api/customers/count', {}, { count: 0 }),
        safeFetch('/api/requests/count', {}, { count: 0 }),
        safeFetch('/api/appointments/count', {}, { count: 0 })
      ]);

      // Check for HTTP errors in the responses
      const errors = [];
      if (usersResponse.status === 'rejected') {
        errors.push(`Users: ${usersResponse.reason}`);
        console.error('Failed to fetch user count:', usersResponse.reason);
      }
      if (customersResponse.status === 'rejected') {
        errors.push(`Customers: ${customersResponse.reason}`);
        console.error('Failed to fetch customer count:', customersResponse.reason);
      }
      if (requestsResponse.status === 'rejected') {
        errors.push(`Requests: ${requestsResponse.reason}`);
        console.error('Failed to fetch request count:', requestsResponse.reason);
      }
      if (appointmentsResponse.status === 'rejected') {
        errors.push(`Appointments: ${appointmentsResponse.reason}`);
        console.error('Failed to fetch appointment count:', appointmentsResponse.reason);
      }

      // Process results even if some failed
      setState(prev => ({
        ...prev,
        userCount: safeParseCount(usersResponse.status === 'fulfilled' ? usersResponse.value : null),
        customerCount: safeParseCount(customersResponse.status === 'fulfilled' ? customersResponse.value : null),
        requestCount: safeParseCount(requestsResponse.status === 'fulfilled' ? requestsResponse.value : null),
        appointmentCount: safeParseCount(appointmentsResponse.status === 'fulfilled' ? appointmentsResponse.value : null),
        loading: false,
        error: errors.length > 0 ? new Error(`Failed to fetch some stats: ${errors.join(', ')}`) : null
      }));

      // If all calls failed, throw an error
      if (usersResponse.status === 'rejected' && customersResponse.status === 'rejected' && 
          requestsResponse.status === 'rejected' && appointmentsResponse.status === 'rejected') {
        throw new Error('Failed to fetch all dashboard statistics');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error('Failed to fetch stats')
      }));
    }
  }, []);

  // Function to manually refresh stats
  const refreshStats = useCallback(async () => {
    try {
      await fetchStats();
      toast({
        title: 'Statistics refreshed',
        description: 'Dashboard statistics have been updated.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      toast({
        title: 'Refresh failed',
        description: 'Could not refresh statistics. Please try again.',
        variant: 'error'
      });
    }
  }, [fetchStats, toast]);

  // Set the refreshStats function in state to expose it to consumers
  useEffect(() => {
    setState(prev => ({ ...prev, refreshStats }));
  }, [refreshStats]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    
    // Set up a refresh interval to keep data updated - every 30 seconds
    const intervalId = setInterval(fetchStats, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchStats]);

  return state;
};
