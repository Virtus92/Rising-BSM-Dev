'use client';

import { useState, useEffect } from 'react';
import { AppointmentClient } from '@/infrastructure/api/AppointmentClient';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';

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

  // Hilfsfunktion, um Kundendaten zu laden
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

  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        
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
            
            // Set processed appointments
            setAppointments(processedAppointments);
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
        
        // Fallback to regular appointments endpoint
        // Try fallback endpoint with date filters
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
        
        // Prepare fallback request parameters
        
        const fallbackResponse = await AppointmentClient.getAppointments(params);
        // Process fallback response
        
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
          
          setAppointments(processedAppointments);
          if (appointmentData.length === 0) {
            // No appointments found in the date range
          }
        } else {
          const errorMsg = fallbackResponse.message || 'Failed to fetch upcoming appointments';
          console.error('Fallback endpoint failed:', errorMsg);
          setError(errorMsg);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while fetching appointments';
        console.error('Critical error in appointments fetch:', errorMsg, error);
        setError(`Data fetching error: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingAppointments();
  }, []);

  const refreshAppointments = async () => {
    // Manually refresh appointments data
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      
      // Try using the upcoming endpoint first
      try {
        // Try primary endpoint
        const response = await AppointmentClient.getUpcomingAppointments(5);
        // Process response
        
        if (response.success) {
          const responseData = response.data as AppointmentResponseData | AppointmentDto[];
          const appointmentData: AppointmentDto[] = Array.isArray(responseData) ? responseData :
                              responseData && Array.isArray(responseData.appointments) ? responseData.appointments :
                              [];
          
          // Retrieved appointments from primary endpoint
          
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
          
          setAppointments(processedAppointments);
          setError(null);
          return;
        } else {
          console.warn('Refresh: Primary endpoint returned unsuccessful response');
        }
      } catch (upcomingError) {
        console.warn('Refresh: Upcoming appointments endpoint failed:', upcomingError);
      }
      
      // Fallback to regular appointments
      // Try fallback endpoint with date filters
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
      
      // Prepare fallback parameters
      
      const fallbackResponse = await AppointmentClient.getAppointments(params);
      // Process fallback response
      
      if (fallbackResponse.success) {
        const data = fallbackResponse.data;
        const appointmentData = Array.isArray(data) ? data :
                             data && 'data' in data && Array.isArray((data as any).data) ? (data as any).data :
                             [];
        
        // Retrieved appointments from fallback endpoint
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
        
        setAppointments(processedAppointments);
        setError(null);
      } else {
        const errorMsg = fallbackResponse.message || 'Failed to refresh upcoming appointments';
        console.error('Refresh: Fallback endpoint failed:', errorMsg);
        setError(`Refresh failed: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while refreshing';
      console.error('Refresh: Critical error:', errorMsg, error);
      setError(`Refresh error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { appointments, isLoading, error, refreshAppointments };
};
