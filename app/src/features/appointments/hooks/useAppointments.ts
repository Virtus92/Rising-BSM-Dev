'use client';

import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { AppointmentClient } from '@/features/appointments/lib/clients';
import { AppointmentDto, AppointmentFilterParamsDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { createBaseListUtility, BaseListUtility } from '@/shared/utils/list/baseListUtils';
import { permissionErrorHandler } from '@/shared/utils/permission-error-handler';

/**
 * Extended interface for appointment list operations
 */
export interface UseAppointmentsResult extends BaseListUtility<AppointmentDto, AppointmentFilterParamsDto> {
  // Alias for better semantics
  appointments: AppointmentDto[];
  
  // Appointment-specific operations
  deleteAppointment: (id: number) => Promise<boolean>;
  filterByStatus: (status: AppointmentStatus | undefined) => void;
  filterByDateRange: (startDate?: Date, endDate?: Date) => void;
  
  // Add setPageSize method for consistency
  setPageSize: (pageSize: number) => void;
}

/**
 * Hook for managing appointments with the unified list utilities
 */
export const useAppointments = (initialFilters?: Partial<AppointmentFilterParamsDto>): UseAppointmentsResult => {
  const { toast } = useToast();
  
  // Map UI sort field to actual database column
  const mapSortFieldToColumn = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'sortBy': 'appointmentDate', // Default to date if sortBy is passed
      'title': 'title',
      'appointmentDate': 'appointmentDate',
      'appointmentTime': 'appointmentTime',
      'status': 'status',
      'customerName': 'customer.name',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    
    return fieldMap[field] || 'appointmentDate';
  };
  
  // Use the base list utility
  const baseList = createBaseListUtility<AppointmentDto, AppointmentFilterParamsDto>({
    fetchFunction: async (filters) => {
      // Log filters for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('useAppointments: Processing filters:', filters);
      }
      
      // Map the sortBy field to an actual database column before sending to API
      const mappedFilters = {...filters};
      // Handle special case for sortBy field
      if (typeof mappedFilters.sortBy === 'string' && mappedFilters.sortBy.toLowerCase() === 'sortby') {
        mappedFilters.sortBy = 'appointmentDate';
      } else if (mappedFilters.sortBy) {
        const originalSortBy = mappedFilters.sortBy;
        mappedFilters.sortBy = mapSortFieldToColumn(mappedFilters.sortBy as string);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`useAppointments: Mapped sortBy from '${originalSortBy}' to '${mappedFilters.sortBy}'`);
        }
      }
      
      // Ensure we have valid sort direction
      if (mappedFilters.sortDirection && !['asc', 'desc'].includes(mappedFilters.sortDirection)) {
        mappedFilters.sortDirection = 'asc';
      }
      
      // Validate and fix pagination
      if (mappedFilters.page && mappedFilters.page < 1) {
        mappedFilters.page = 1;
      }
      if (mappedFilters.limit && (mappedFilters.limit < 1 || mappedFilters.limit > 100)) {
        mappedFilters.limit = 10;
      }
      
      // Log the final mapped filters
      if (process.env.NODE_ENV === 'development') {
        console.log('useAppointments: Final mapped filters:', mappedFilters);
      }
      
      try {
        // Make the API call
        const apiCall = AppointmentClient.getAppointments(mappedFilters);
        const response = await apiCall;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('useAppointments: API response:', response);
        }
        
        return response;
      } catch (err) {
        console.error('Error in useAppointments fetchFunction:', err);
        // Return empty result instead of throwing
        return {
          data: [],
          pagination: {
            page: mappedFilters.page || 1,
            limit: mappedFilters.limit || 10,
            total: 0,
            totalPages: 0
          }
        };
      }
    },
    
    // Add response adapter to properly extract data from API response
    responseAdapter: (response) => {
      // Handle the API response structure
      const data = response?.data || response;
      
      // Extract items - API returns data.data for success responses
      let items: AppointmentDto[] = [];
      if (data && data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (Array.isArray(data)) {
        items = data;
      }
      
      // Extract pagination
      const pagination = data?.pagination || {
        page: 1,
        limit: 10,
        total: items.length,
        totalPages: 1
      };
      
      return { items, pagination };
    },
    
    initialFilters: {
      page: 1,
      limit: 10,
      sortBy: 'appointmentDate',
      sortDirection: 'asc',
      ...initialFilters
    } as AppointmentFilterParamsDto,
    defaultSortField: 'appointmentDate',
    defaultSortDirection: 'asc',
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit', 'customerId', 'createdById'] as Array<keyof AppointmentFilterParamsDto>,
      boolean: ['today', 'upcoming', 'past'] as Array<keyof AppointmentFilterParamsDto>,
      enum: {
        status: Object.values(AppointmentStatus),
        sortDirection: ['asc', 'desc']
      } as Record<keyof AppointmentFilterParamsDto, any[]>
    }
  });
  
  /**
   * Delete an appointment by ID
   */
  const deleteAppointment = useCallback(async (appointmentId: number) => {
    try {
      const response = await AppointmentClient.deleteAppointment(appointmentId);
      
      if (response.success) {
        toast?.({ 
          title: 'Appointment deleted',
          description: 'The appointment has been successfully deleted.',
          variant: 'success'
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        // Check if it's a permission error first
        if (!permissionErrorHandler.handlePermissionError(response, toast)) {
          // If not a permission error, show generic error
          toast?.({ 
            title: 'Error',
            description: response.message || 'Failed to delete appointment',
            variant: 'destructive'
          });
        }
        return false;
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      // Check if it's a permission error first
      if (!permissionErrorHandler.handlePermissionError(err, toast)) {
        // If not a permission error, show generic error
        toast?.({ 
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive'
        });
      }
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Filter appointments by status
   */
  const filterByStatus = useCallback((status: AppointmentStatus | undefined) => {
    baseList.setFilter('status', status);
  }, [baseList]);
  
  /**
   * Filter appointments by date range
   */
  const filterByDateRange = useCallback((startDate?: Date, endDate?: Date) => {
    baseList.updateFilters({ 
      startDate: startDate || undefined, 
      endDate: endDate || undefined,
      page: 1 
    });
  }, [baseList]);
  
  return {
    ...baseList,
    // Alias items as appointments for better semantics
    appointments: baseList.items,
    
    // Appointment-specific methods
    deleteAppointment,
    filterByStatus,
    filterByDateRange
  };
};

// Add default export for compatibility with import statements
export default useAppointments;