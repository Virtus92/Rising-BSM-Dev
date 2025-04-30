import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { UserService } from '@/features/users/lib/services/UserService';
import { RequestService } from '@/features/requests/lib/services/RequestService';
import { AppointmentService } from '@/features/appointments/lib/services/AppointmentService';
import { CustomerService } from '@/features/customers/lib/services/CustomerService';
import { ApiResponse } from '@/core/api/ApiClient';

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
 * Enhanced with more robust error handling and support for different API response structures
 * 
 * @param response API response object
 * @returns Extracted count or 0 if not found
 */
const extractCount = (response: ApiResponse<any>): number => {
  if (!response) {
    console.warn('extractCount called with undefined/null response');
    return 0;
  }
  
  if (!response.success || !response.data) {
    console.warn('Unsuccessful API response or missing data:', response.message);
    return 0;
  }
  
  // Log response structure for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Extracting count from response structure:', 
      typeof response.data === 'object' ? 
        Object.keys(response.data) : typeof response.data);
  }
  
  // Handle direct number response
  if (typeof response.data === 'number') {
    return response.data;
  }
  
  // Handle object with count property (most common format after our fixes)
  if (typeof response.data === 'object' && response.data !== null) {
    // Direct count property (our standardized format)
    if ('count' in response.data && typeof response.data.count === 'number') {
      return response.data.count;
    }
    
    // Alternative total property
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
    
    // Handle nested data property with count
    if ('data' in response.data && typeof response.data.data === 'object' &&
        response.data.data !== null) {
      
      // Check for count in nested data
      if ('count' in response.data.data && 
          typeof response.data.data.count === 'number') {
        return response.data.data.count;
      }
      
      // Check for total in nested data
      if ('total' in response.data.data && 
          typeof response.data.data.total === 'number') {
        return response.data.data.total;
      }
      
      // If nested data is an array, return its length
      if (Array.isArray(response.data.data)) {
        return response.data.data.length;
      }
    }
    
    // Handle array response
    if (Array.isArray(response.data)) {
      return response.data.length;
    }
  }
  
  // We couldn't find a count value
  console.warn('Could not extract count from response:', response);
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

  // First mount flag to prevent duplicate fetches on initial mount
  const isFirstMountRef = useRef(true);

  // Extract fetchStats as a separate callback with debounce protection
  const fetchStats = useCallback(async (showErrors = false) => {
    // Don't allow multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Already fetching stats, skipping duplicate request');
      return;
    }
    
    // Throttle refreshes (minimum 5 seconds between refreshes)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      console.log('Throttling stats fetch - too soon since last fetch');
      return;
    }
    
    // Set fetching flag
    isFetchingRef.current = true;
    
    // Reset loading and error state before fetching
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    try {
      // Log fetch attempt for monitoring
      console.log('Fetching dashboard stats...');
      
      // Use Promise.allSettled with dedicated count endpoints
      const [usersResponse, customersResponse, requestsResponse, appointmentsResponse] = 
        await Promise.allSettled([
          UserService.count(),
          CustomerService.count(),
          RequestService.count(),
          AppointmentService.count()
        ]);

      // Log raw responses for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Raw count responses:', {
          users: usersResponse.status === 'fulfilled' ? usersResponse.value : 'rejected',
          customers: customersResponse.status === 'fulfilled' ? customersResponse.value : 'rejected',
          requests: requestsResponse.status === 'fulfilled' ? requestsResponse.value : 'rejected',
          appointments: appointmentsResponse.status === 'fulfilled' ? appointmentsResponse.value : 'rejected',
        });
      }

      // Track successful fetch time
      lastFetchTimeRef.current = Date.now();

      if (isMountedRef.current) {
        // Process the responses with enhanced error handling and fallbacks
        const processCountResponse = (response: PromiseSettledResult<any>, entityName: string): number => {
          if (response.status === 'rejected') {
            console.error(`Failed to fetch ${entityName} count:`, response.reason);
            return 0;
          }
          
          try {
            // Extract the count using the comprehensive extraction utility
            const count = extractCount(response.value);
            
            if (count === 0 && response.value?.success) {
              // Double-check with stricter extraction if we got 0 but the API call was successful
              console.warn(`Got 0 for ${entityName} count despite successful API call:`, response.value);
            }
            
            return count;
          } catch (err) {
            console.error(`Error processing ${entityName} count:`, err);
            return 0;
          }
        };
          
        const userCount = processCountResponse(usersResponse, 'users');
        const customerCount = processCountResponse(customersResponse, 'customers');
        const requestCount = processCountResponse(requestsResponse, 'requests');
        const appointmentCount = processCountResponse(appointmentsResponse, 'appointments');

        // Log processed counts
        console.log('Processed counts:', { userCount, customerCount, requestCount, appointmentCount });

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

      // Check if all requests failed
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
      console.error('Failed to fetch dashboard stats', error as Error);
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
      console.error('Failed to manually refresh stats:', error as Error);
      // Error handling and toasts are already in fetchStats with showErrors=true
    }
  }, [fetchStats, toast]);

  // Fetch stats on initial mount with duplicate request prevention
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    // Skip duplicate fetch on React Strict Mode double mount
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      
      // Delay initial fetch slightly to avoid race conditions
      const initialFetchTimer = setTimeout(() => {
        if (isMountedRef.current && !isFetchingRef.current) {
          console.log('Performing initial stats fetch');
          fetchStats();
        }
      }, 100);
      
      return () => {
        clearTimeout(initialFetchTimer);
        isMountedRef.current = false;
      };
    }
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array to run only once

  // Set up a refresh interval - using a stable interval reference
  useEffect(() => {
    // Only set up interval if component is mounted
    if (!isMountedRef.current) return;
    
    console.log('Setting up dashboard stats refresh interval (5 minutes)');
    const intervalId = setInterval(() => {
      // Only fetch if component is still mounted and not already fetching
      if (isMountedRef.current && !isFetchingRef.current) {
        console.log('Interval-triggered stats refresh');
        fetchStats();
      }
    }, 300000); // Refresh every 5 minutes
    
    // Clean up interval on unmount
    return () => {
      console.log('Clearing dashboard stats refresh interval');
      clearInterval(intervalId);
    }; 
  }, []); // Empty dependency array for stable interval

  // Return the state and the refresh function
  return { ...state, refreshStats };
};