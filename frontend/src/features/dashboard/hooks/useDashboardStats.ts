import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { UserService } from '@/infrastructure/clients/UserService';
import { RequestService } from '@/infrastructure/clients/RequestService';
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { ApiResponse } from '@/infrastructure/clients/ApiClient';

// Define API response types for count endpoints
interface CountResponse {
  count: number;
}

// Define a more specific type for the state, excluding refreshStats initially
type StatsData = {
  userCount: number;
  customerCount: number;
  requestCount: number;
  appointmentCount: number;
};

type StatsState = StatsData & {
  loading: boolean;
  error: Error | null;
};

// Define the hook's return type including the refresh function
type UseDashboardStatsReturn = StatsState & {
  refreshStats: () => Promise<void>;
};

/**
 * Safely extracts count value from various response formats
 * 
 * @param response API response object
 * @returns Extracted count or 0 if not found
 */
const extractCount = (response: ApiResponse<any>): number => {
  if (!response.success || !response.data) {
    return 0;
  }
  
  // Handle direct number response
  if (typeof response.data === 'number') {
    return response.data;
  }
  
  // Handle object with count property
  if (typeof response.data === 'object') {
    if ('count' in response.data && typeof response.data.count === 'number') {
      return response.data.count;
    }
    
    if ('total' in response.data && typeof response.data.total === 'number') {
      return response.data.total;
    }
    
    // Handle pagination response
    if ('pagination' in response.data && 
        typeof response.data.pagination === 'object' && 
        response.data.pagination !== null) {
      if ('total' in response.data.pagination && 
          typeof response.data.pagination.total === 'number') {
        return response.data.pagination.total;
      }
    }
    
    // Handle array response
    if (Array.isArray(response.data)) {
      return response.data.length;
    }
  }
  
  return 0;
};

/**
 * Hook for fetching and managing dashboard statistics
 * Uses service layer to fetch data from API endpoints
 */
export const useDashboardStats = (): UseDashboardStatsReturn => {
  // Initialize state with default values
  const [state, setState] = useState<StatsState>({
    userCount: 0,
    customerCount: 0,
    requestCount: 0,
    appointmentCount: 0,
    loading: true,
    error: null,
  });
  
  const { toast } = useToast();
  
  // Use ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  // Use ref to track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track last successful fetch time to prevent excessive refresh
  const lastFetchTimeRef = useRef(0);

  // Extract fetchStats as a separate callback with debounce protection
  const fetchStats = useCallback(async (showErrors = false) => {
    // Don't allow multiple simultaneous fetches
    if (isFetchingRef.current) return;
    
    // Throttle refreshes (minimum 5 seconds between refreshes)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      return;
    }
    
    // Set fetching flag
    isFetchingRef.current = true;
    
    // Reset loading and error state before fetching
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    try {
      // Use Promise.allSettled with dedicated count endpoints
      const [usersResponse, customersResponse, requestsResponse, appointmentsResponse] = 
        await Promise.allSettled([
          UserService.count(),
          CustomerService.count(),
          RequestService.count(),
          AppointmentService.count()
        ]);

      // Track successful fetch time
      lastFetchTimeRef.current = Date.now();

      if (isMountedRef.current) {
        // Process the responses
        const userCount = usersResponse.status === 'fulfilled' ? 
          extractCount(usersResponse.value) : 0;
          
        const customerCount = customersResponse.status === 'fulfilled' ? 
          extractCount(customersResponse.value) : 0;
          
        const requestCount = requestsResponse.status === 'fulfilled' ? 
          extractCount(requestsResponse.value) : 0;
          
        const appointmentCount = appointmentsResponse.status === 'fulfilled' ? 
          extractCount(appointmentsResponse.value) : 0;

        // Log successful responses for debugging
        if (requestsResponse.status === 'fulfilled') {
          console.log('Request count response:', requestsResponse.value);
        }

        // Update state with fetched data
        setState(prev => ({
          ...prev,
          userCount,
          customerCount,
          requestCount,
          appointmentCount,
          loading: false,
          error: null
        }));
      }

      // Log errors for any failed requests without showing toast for background updates
      [usersResponse, customersResponse, requestsResponse, appointmentsResponse].forEach((response, index) => {
        if (response.status === 'rejected') {
          const entityTypes = ['users', 'customers', 'requests', 'appointments'];
          console.error(`Dashboard fetch failed for ${entityTypes[index]} count:`, response.reason);
        }
      });

      // Check if all requests failed after attempting to process
      const allFailed = [usersResponse, customersResponse, requestsResponse, appointmentsResponse].every(r => r.status === 'rejected');
      if (allFailed && isMountedRef.current) {
        const error = new Error('Failed to fetch all dashboard statistics.');
        setState(prev => ({
          ...prev,
          loading: false,
          error
        }));
        
        if (showErrors) {
          toast({
            title: 'Failed to fetch statistics',
            description: 'Could not retrieve dashboard data. Please try again later.',
            variant: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('An unknown error occurred while fetching stats')
        }));
        
        if (showErrors) {
          toast({
            title: 'Error loading dashboard',
            description: 'Failed to load statistics. Please try again later.',
            variant: 'error'
          });
        }
      }
    } finally {
      // Clear fetching flag
      isFetchingRef.current = false;
    }
  }, [toast]); // Only depends on toast

  // Function to manually refresh stats with visible feedback
  const refreshStats = useCallback(async () => {
    try {
      await fetchStats(true); // Show errors for manual refresh
      toast({
        title: 'Statistics refreshed',
        description: 'Dashboard statistics have been updated.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to manually refresh stats:', error);
      // Error handling and toasts are already in fetchStats with showErrors=true
    }
  }, [fetchStats, toast]);

  // Fetch stats on initial mount
  useEffect(() => {
    fetchStats();
    
    // Set the isMounted ref for cleanup
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchStats]);

  // Set up a refresh interval - increased to 5 minutes to reduce load
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchStats();
    }, 300000); // Refresh every 5 minutes instead of every minute
    
    return () => {
      clearInterval(intervalId);
      isMountedRef.current = false;
    }; 
  }, [fetchStats]);

  // Return the state and the refresh function
  return { ...state, refreshStats };
};