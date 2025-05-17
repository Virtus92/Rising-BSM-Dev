'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppointmentClient } from '@/features/appointments/lib/clients/AppointmentClient';
import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import AuthService from '@/features/auth/core/AuthService';

// Define appointment with customer type
interface AppointmentWithCustomer extends AppointmentDto {
  customerName?: string;
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
}

/**
 * Custom hook for loading and managing upcoming appointments
 */
export const useUpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Use ref to track if a fetch is already in progress
  const isFetchingRef = useRef(false);
  
  // Get permissions from the auth hooks
  const permissionsData = usePermissions();
  
  // Helper function to load customer data
  const loadCustomerData = async (customerId: number) => {
    try {
      const response = await CustomerService.getCustomerById(customerId);
      if (response.success && response.data) {
        return {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone
        };
      }
      return null;
    } catch (error) {
      console.warn(`Failed to load customer data for ID ${customerId}:`, error);
      return null;
    }
  };
  
  // Function to fetch appointments with proper error handling
  const fetchAppointmentsWithErrorHandling = useCallback(async () => {
    // Skip if already fetching or component unmounted
    if (isFetchingRef.current || !isMountedRef.current) {
      return;
    }
    
    try {
      // Mark as fetching
      isFetchingRef.current = true;
      
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }
      
      // First check if we're authenticated at all
      const isUserAuthenticated = await AuthService.isAuthenticated();
      if (!isUserAuthenticated) {
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setError('Authentication required. Please reload the page or log in again.');
          setIsLoading(false);
          setAppointments([]);
        }
        return;
      }
      
      // Make the API call
      const response = await AppointmentClient.getUpcomingAppointments(5);
      
      // Handle authentication errors
      if (response.statusCode === 401 || response.statusCode === 403 || 
          response.code === 'AUTHENTICATION_REQUIRED' || response.code === 'PERMISSION_DENIED') {
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setError('Authentication required. Please reload the page or log in again.');
          setIsLoading(false);
          setAppointments([]);
        }
        return;
      }
      
      if (response.success && isMountedRef.current) {
        // Extract appointment data
        let appointmentData: AppointmentDto[] = [];
        const responseData = response.data;
        
        // Process the response based on its structure
        if (responseData) {
          if (Array.isArray(responseData)) {
            appointmentData = responseData;
          } else if (typeof responseData === 'object') {
            if (Array.isArray(responseData.appointments)) {
              appointmentData = responseData.appointments;
            } else if (Array.isArray(responseData.data)) {
              appointmentData = responseData.data;
            }
          }
        }
        
        // Process appointments with customer data
        const processedAppointments = await Promise.all(
          appointmentData.map(async (appt: AppointmentWithCustomer) => {
            // Use existing customer name if available
            if (appt.customer?.name) {
              return { ...appt, customerName: appt.customer.name };
            }
            
            // Load customer data if needed
            if (appt.customerId && !appt.customerName) {
              try {
                const customerData = await loadCustomerData(appt.customerId);
                if (customerData) {
                  return { 
                    ...appt, 
                    customerName: customerData.name,
                    customer: customerData
                  };
                }
              } catch (err) {
                // Fail gracefully with placeholder
                console.warn(`Error loading customer data for ${appt.customerId}`, err);
              }
              return { ...appt, customerName: `Customer ${appt.customerId}` };
            }
            
            return appt;
          })
        );
        
        if (isMountedRef.current) {
          setAppointments(processedAppointments);
          setIsLoading(false);
          setIsAuthenticated(true);
        }
      } else {
        if (isMountedRef.current) {
          setError(response.error || response.message || 'Failed to load appointments');
          setIsLoading(false);
          setAppointments([]);
        }
      }
    } catch (error) {
      console.error('Error in appointments fetch:', error);
      if (isMountedRef.current) {
        setError('Error loading appointments: ' + (error instanceof Error ? error.message : String(error)));
        setIsLoading(false);
        setAppointments([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      
      // Reset fetching flag immediately instead of with timeout
      isFetchingRef.current = false;
    }
  }, []);

  // Setup event listeners for authentication and initialization
  useEffect(() => {
    isMountedRef.current = true;
    
    // Track event listeners for cleanup
    const handleAuthRequired = () => {
      if (isMountedRef.current) {
        setIsAuthenticated(false);
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
      }
    };
    
    const handleAuthStateChange = (event: CustomEvent) => {
      if (isMountedRef.current && event.detail?.isAuthenticated === true) {
        // Retry fetching when authentication is restored
        fetchAppointmentsWithErrorHandling();
      }
    };
    
    // Add event listeners
    window.addEventListener('auth-required', handleAuthRequired);
    window.addEventListener('auth-state-change', handleAuthStateChange as EventListener);
    
    // Check authentication state immediately
    AuthService.isAuthenticated().then(isAuthed => {
      if (isMountedRef.current) {
        setIsAuthenticated(isAuthed);
        if (!isAuthed) {
          setError('Authentication required. Please log in again.');
          setIsLoading(false);
        } else {
          // Only fetch if authenticated
          fetchAppointmentsWithErrorHandling();
        }
      }
    }).catch(() => {
      // On error, try to fetch anyway in case it's just an auth check issue
      if (isMountedRef.current) {
        fetchAppointmentsWithErrorHandling();
      }
    });
    
    // Setup refresh interval only if authenticated
    let refreshIntervalId: NodeJS.Timeout | null = null;
    if (isAuthenticated) {
      refreshIntervalId = setInterval(() => {
        if (isMountedRef.current && !isFetchingRef.current && isAuthenticated) {
          fetchAppointmentsWithErrorHandling();
        }
      }, 5 * 60 * 1000); // Refresh every 5 minutes
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('auth-required', handleAuthRequired);
      window.removeEventListener('auth-state-change', handleAuthStateChange as EventListener);
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };
  }, [fetchAppointmentsWithErrorHandling, isAuthenticated]);

  // Function to manually refresh data with proper auth check
  const refreshAppointments = useCallback(() => {
    if (!isAuthenticated) {
      setError('Cannot refresh - authentication required');
      return;
    }
    
    if (isFetchingRef.current || !isMountedRef.current) {
      return;
    }
    
    fetchAppointmentsWithErrorHandling();
  }, [fetchAppointmentsWithErrorHandling, isAuthenticated]);

  return { 
    appointments, 
    isLoading, 
    error, 
    refreshAppointments,
    isAuthenticated
  };
};