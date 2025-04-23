'use client';

import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';
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
      // Map the sortBy field to an actual database column before sending to API
      const mappedFilters = {...filters};
      // Handle special case for sortBy field
      if (typeof mappedFilters.sortBy === 'string' && mappedFilters.sortBy.toLowerCase() === 'sortby') {
        mappedFilters.sortBy = 'appointmentDate';
      } else if (mappedFilters.sortBy) {
        mappedFilters.sortBy = mapSortFieldToColumn(mappedFilters.sortBy as string);
      }
      
      // Ensure we don't modify the sort direction
      // This is critical - client and server must agree on direction
      if (process.env.NODE_ENV === 'development') {
        console.log('Mapped appointment filters:', mappedFilters);
      }
      return await AppointmentService.getAll(mappedFilters);
    },
    initialFilters: initialFilters as AppointmentFilterParamsDto,
    defaultSortField: 'appointmentDate' as keyof AppointmentFilterParamsDto,
    defaultSortDirection: 'asc',
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit'] as Array<keyof AppointmentFilterParamsDto>,
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
      const response = await AppointmentService.deleteAppointment(appointmentId);
      
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
