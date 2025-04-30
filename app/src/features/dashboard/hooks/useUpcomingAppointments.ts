'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppointmentClient } from '@/features/appointments/lib/clients/AppointmentClient';
import { CustomerService } from '@/features/customers/lib/services/CustomerService';
import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { PermissionError } from '@/features/users/hooks/usePermissions';

// Define response type interface
interface AppointmentResponseData {
  appointments?: AppointmentDto[];
  data?: AppointmentDto[];
  [key: string]: any;
}

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

export const useUpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Use ref to track if a fetch is already in progress
  const isFetchingRef = useRef(false);
  
  // Get permissions from the auth hooks
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

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

  // Effect for loading appointments data initially
  useEffect(() => {
    // Set mounted flag on component mount
    isMountedRef.current = true;
    
    // Wait for permissions to load before proceeding
    if (isLoadingPermissions) {
      console.log('Waiting for permissions to load before fetching appointments');
      return;
    }
    
    // Use try/catch with error boundary to handle permission check
    try {
      // Check if the user has the required permission
      if (!hasPermission(SystemPermission.APPOINTMENTS_VIEW)) {
        console.log('User lacks permission to view upcoming appointments');
        if (isMountedRef.current) {
          setError('You do not have permission to view appointments.');
          setIsLoading(false);
        }
        return;
      }
      
      const fetchUpcomingAppointments = async () => {
      // Skip if already fetching
      if (isFetchingRef.current) {
        console.log('Already fetching appointments data, skipping duplicate request');
        return;
      }
      
      // Set fetching flag
      isFetchingRef.current = true;
      
      try {
        if (isMountedRef.current) {
          setIsLoading(true);
          setError(null); // Clear any previous errors
        }
        
        // First try the dedicated upcoming endpoint
        try {
          // Try primary endpoint
          const response = await AppointmentClient.getUpcomingAppointments(5);
          // Process response
          
          if (response.success) {
            // Ensure data is an array with proper type handling
            const responseData = response.data as AppointmentResponseData | AppointmentDto[];
            const appointmentData: AppointmentDto[] = Array.isArray(responseData) ? responseData :
                                 responseData && Array.isArray(responseData.appointments) ? responseData.appointments :
                                 responseData && Array.isArray(responseData.data) ? responseData.data :
                                 [];
            
            // Process appointments with customer data
            const processedAppointments = await Promise.all(
              appointmentData.map(async (appt: AppointmentWithCustomer) => {
                // Ensure we have customerName if we have customer object but no customerName
                if (!appt.customerName && appt.customer && appt.customer.name) {
                  return { ...appt, customerName: appt.customer.name };
                }
                // If we have customerId but no customer object or name, try to load it
                if (appt.customerId && !appt.customerName && (!appt.customer || !appt.customer.name)) {
                  const customerData = await loadCustomerData(appt.customerId);
                  if (customerData) {
                    return { 
                      ...appt, 
                      customerName: customerData.name,
                      customer: customerData
                    };
                  }
                  return { ...appt, customerName: `Customer ${appt.customerId}` };
                }
                return appt;
              })
            );
            
            // Set processed appointments (only if still mounted)
            if (isMountedRef.current) {
              setAppointments(processedAppointments);
              setIsLoading(false);
            }
            return;
          } else {
            console.warn('Primary endpoint returned unsuccessful response');
          }
        } catch (upcomingError) {
          console.warn('Upcoming appointments endpoint failed with error:', upcomingError);
          // Log full error details in development for easier debugging
          if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', upcomingError);
          }
        }
        
        // Fallback to regular appointments endpoint with date filters
        try {
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);
          
          const params = {
            startDate: today.toISOString().split('T')[0],
            endDate: nextWeek.toISOString().split('T')[0],
            limit: 5,
            sortBy: 'appointmentDate',
            sortDirection: 'asc'
          };
          
          // Prepare fallback request
          const fallbackResponse = await AppointmentClient.getAppointments(params);
          
          if (fallbackResponse.success) {
            const data = fallbackResponse.data;
            const appointmentData = Array.isArray(data) ? data :
                               data && 'data' in data && Array.isArray((data as any).data) ? (data as any).data :
                               [];
            
            // Process appointments with customer data
            const processedAppointments = await Promise.all(
              appointmentData.map(async (appt: AppointmentWithCustomer) => {
                // Ensure we have customerName if we have customer object but no customerName
                if (!appt.customerName && appt.customer && appt.customer.name) {
                  return { ...appt, customerName: appt.customer.name };
                }
                // If we have customerId but no customer object or name, try to load it
                if (appt.customerId && !appt.customerName && (!appt.customer || !appt.customer.name)) {
                  const customerData = await loadCustomerData(appt.customerId);
                  if (customerData) {
                    return { 
                      ...appt, 
                      customerName: customerData.name,
                      customer: customerData
                    };
                  }
                  return { ...appt, customerName: `Customer ${appt.customerId}` };
                }
                return appt;
              })
            );
            
            // Only update state if still mounted
            if (isMountedRef.current) {
              setAppointments(processedAppointments);
              setError(null);
            }
          } else {
            const errorMsg = fallbackResponse.message || 'Failed to fetch upcoming appointments';
            console.error('Fallback endpoint failed:', errorMsg);
            
            // Only update state if still mounted
            if (isMountedRef.current) {
              setError(errorMsg);
            }
          }
        } catch (fallbackError) {
          console.error('Critical error in fallback fetch:', fallbackError);
          
          // Only update state if still mounted
          if (isMountedRef.current) {
            setError('Unable to load appointments data. Please try again later.');
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while fetching appointments';
        console.error('Critical error in appointments fetch:', errorMsg, error);
        
        // Only update state if still mounted
        if (isMountedRef.current) {
          setError(`Data fetching error: ${errorMsg}`);
        }
      } finally {
        // Only update state if still mounted
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        
        // Reset fetching flag with slight delay to avoid rapid consecutive calls
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 200);
      }
    };

    fetchUpcomingAppointments();
    
    // Set up refresh interval - 5 minutes
    const interval = setInterval(() => {
      // Only refresh if component is still mounted and not already fetching
      if (isMountedRef.current && !isFetchingRef.current) {
        fetchUpcomingAppointments();
      }
    }, 5 * 60 * 1000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
    };
    } catch (error) {
      // Handle permission errors gracefully
      if (error instanceof PermissionError) {
        console.error('Permission error in UpcomingAppointments:', error.message);
        if (isMountedRef.current) {
          setError('Permission error: ' + error.message);
          setIsLoading(false);
        }
      } else {
        // Unexpected errors should still be thrown for error boundaries
        console.error('Unexpected error in useUpcomingAppointments:', error);
        throw error;
      }
    }
  }, [isLoadingPermissions, hasPermission]); // Only re-run when permissions loading state changes

  // Function to manually refresh data
  const refreshAppointments = async () => {
    // Skip if already fetching
    if (isFetchingRef.current) {
      console.log('Already fetching appointments data, skipping manual refresh');
      return;
    }
    
    // Skip if component unmounted
    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping refresh');
      return;
    }
    
    // Handle permission check with proper error handling
    try {
      // Check if user has permission
      if (!hasPermission(SystemPermission.APPOINTMENTS_VIEW)) {
        if (isMountedRef.current) {
          setError('You do not have permission to view appointments.');
          setIsLoading(false);
        }
        return;
      }
      
      // Set fetching flag
      isFetchingRef.current = true;
    
    try {
      // Only update state if still mounted
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null); // Clear previous errors
      }
      
      // Try using the upcoming endpoint first
      try {
        const response = await AppointmentClient.getUpcomingAppointments(5);
        
        if (response.success) {
          const responseData = response.data as AppointmentResponseData | AppointmentDto[];
          const appointmentData: AppointmentDto[] = Array.isArray(responseData) ? responseData :
                               responseData && Array.isArray(responseData.appointments) ? responseData.appointments :
                               responseData && Array.isArray(responseData.data) ? responseData.data :
                               [];
          
          // Process appointments with customer data
          const processedAppointments = await Promise.all(
            appointmentData.map(async (appt: AppointmentWithCustomer) => {
              // Ensure we have customerName if we have customer object but no customerName
              if (!appt.customerName && appt.customer && appt.customer.name) {
                return { ...appt, customerName: appt.customer.name };
              }
              // If we have customerId but no customer object or name, try to load it
              if (appt.customerId && !appt.customerName && (!appt.customer || !appt.customer.name)) {
                const customerData = await loadCustomerData(appt.customerId);
                if (customerData) {
                  return { 
                    ...appt, 
                    customerName: customerData.name,
                    customer: customerData
                  };
                }
                return { ...appt, customerName: `Customer ${appt.customerId}` };
              }
              return appt;
            })
          );
          
          // Only update state if still mounted
          if (isMountedRef.current) {
            setAppointments(processedAppointments);
            setError(null);
          }
          return;
        } else {
          console.warn('Refresh: Primary endpoint returned unsuccessful response');
        }
      } catch (upcomingError) {
        console.warn('Refresh: Upcoming appointments endpoint failed:', upcomingError);
      }
      
      // Fallback to regular appointments with date filters
      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const params = {
          startDate: today.toISOString().split('T')[0],
          endDate: nextWeek.toISOString().split('T')[0],
          limit: 5,
          sortBy: 'appointmentDate',
          sortDirection: 'asc'
        };
        
        const fallbackResponse = await AppointmentClient.getAppointments(params);
        
        if (fallbackResponse.success) {
          const data = fallbackResponse.data;
          const appointmentData = Array.isArray(data) ? data :
                             data && 'data' in data && Array.isArray((data as any).data) ? (data as any).data :
                             [];
          
          // Process appointments with customer data
          const processedAppointments = await Promise.all(
            appointmentData.map(async (appt: AppointmentWithCustomer) => {
              // Ensure we have customerName if we have customer object but no customerName
              if (!appt.customerName && appt.customer && appt.customer.name) {
                return { ...appt, customerName: appt.customer.name };
              }
              // If we have customerId but no customer object or name, try to load it
              if (appt.customerId && !appt.customerName && (!appt.customer || !appt.customer.name)) {
                const customerData = await loadCustomerData(appt.customerId);
                if (customerData) {
                  return { 
                    ...appt, 
                    customerName: customerData.name,
                    customer: customerData
                  };
                }
                return { ...appt, customerName: `Customer ${appt.customerId}` };
              }
              return appt;
            })
          );
          
          // Only update state if still mounted
          if (isMountedRef.current) {
            setAppointments(processedAppointments);
            setError(null);
          }
        } else {
          const errorMsg = fallbackResponse.message || 'Failed to refresh upcoming appointments';
          console.error('Refresh: Fallback endpoint failed:', errorMsg);
          
          // Only update state if still mounted
          if (isMountedRef.current) {
            setError(`Refresh failed: ${errorMsg}`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while refreshing';
        console.error('Refresh: Critical error:', errorMsg, error);
        
        // Only update state if still mounted
        if (isMountedRef.current) {
          setError(`Refresh error: ${errorMsg}`);
        }
      }
    } finally {
      // Only update state if still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      
      // Reset fetching flag with small delay
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 200);
    }
    } catch (permError) {
      // Handle permission errors gracefully
      if (permError instanceof PermissionError) {
        console.error('Permission error during refresh:', permError.message);
        if (isMountedRef.current) {
          setError('Permission error: ' + permError.message);
          setIsLoading(false);
        }
      } else {
        // Unexpected permission-related errors should be logged but not crash the app
        console.error('Unexpected error during permission check:', permError);
        if (isMountedRef.current) {
          setError('Error checking permissions');
          setIsLoading(false);
        }
      }
    }
  };

  return { appointments, isLoading, error, refreshAppointments };
};
