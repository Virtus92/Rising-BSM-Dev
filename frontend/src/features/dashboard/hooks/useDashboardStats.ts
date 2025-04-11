'use client';

import { useState, useEffect } from 'react';
import { safeFetch, safeParseCount } from '@/shared/utils/apiUtils';

type StatsState = {
  userCount: number | null;
  customerCount: number | null;
  requestCount: number | null;
  appointmentCount: number | null;
  loading: boolean;
  error: Error | null;
};

export const useDashboardStats = () => {
  const [state, setState] = useState<StatsState>({
    userCount: null,
    customerCount: null,
    requestCount: null,
    appointmentCount: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
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

        // Process results even if some failed
        setState({
          userCount: safeParseCount(usersResponse.status === 'fulfilled' ? usersResponse.value : null),
          customerCount: safeParseCount(customersResponse.status === 'fulfilled' ? customersResponse.value : null),
          requestCount: safeParseCount(requestsResponse.status === 'fulfilled' ? requestsResponse.value : null),
          appointmentCount: safeParseCount(appointmentsResponse.status === 'fulfilled' ? appointmentsResponse.value : null),
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error : new Error('Failed to fetch stats')
        }));
      }
    };

    fetchStats();
    
    // Set up a refresh interval to keep data updated
    const intervalId = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return state;
};
