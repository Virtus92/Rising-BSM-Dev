'use client';

import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { RequestService } from '@/infrastructure/clients/RequestService';
import { RequestDto, RequestFilterParamsDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { createBaseListUtility, BaseListUtility } from '@/shared/utils/list/baseListUtils';

/**
 * Extended interface for request list operations
 */
export interface UseRequestsResult extends BaseListUtility<RequestDto, RequestFilterParamsDto> {
  // Alias for better semantics
  requests: RequestDto[];
  
  // Request-specific operations
  deleteRequest: (id: number) => Promise<boolean>;
  filterByStatus: (status: RequestStatus | undefined) => void;
  filterByDateRange: (startDate?: Date, endDate?: Date) => void;
}

/**
 * Hook for managing requests with the unified list utilities
 */
export const useRequests = (initialFilters?: Partial<RequestFilterParamsDto>): UseRequestsResult => {
  const { toast } = useToast();
  
  // Map UI sort field to actual database column
  const mapSortFieldToColumn = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'sortBy': 'createdAt', // Default to creation date if sortBy is passed
      'name': 'name',
      'email': 'email',
      'service': 'service',
      'status': 'status',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    
    return fieldMap[field] || 'createdAt';
  };
  
  // Use the base list utility
  const baseList = createBaseListUtility<RequestDto, RequestFilterParamsDto>({
    fetchFunction: async (filters) => {
      // Map the sortBy field to an actual database column before sending to API
      const mappedFilters = {...filters};
      // Handle special case for sortBy field
      if (typeof mappedFilters.sortBy === 'string' && mappedFilters.sortBy.toLowerCase() === 'sortby') {
        mappedFilters.sortBy = 'createdAt';
      } else if (mappedFilters.sortBy) {
        mappedFilters.sortBy = mapSortFieldToColumn(mappedFilters.sortBy as string);
      }
      
      // Ensure we don't modify the sort direction
      // This is critical - client and server must agree on direction
      if (process.env.NODE_ENV === 'development') {
        console.log('Mapped request filters:', mappedFilters);
      }
      
      return await RequestService.getAll(mappedFilters);
    },
    initialFilters: initialFilters as RequestFilterParamsDto,
    defaultSortField: 'createdAt' as keyof RequestFilterParamsDto,
    defaultSortDirection: 'desc',
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit'] as Array<keyof RequestFilterParamsDto>,
      enum: {
        status: Object.values(RequestStatus),
        sortDirection: ['asc', 'desc']
      } as Record<keyof RequestFilterParamsDto, any[]>
    }
  });
  
  /**
   * Delete a request by ID
   */
  const deleteRequest = useCallback(async (requestId: number) => {
    try {
      const response = await RequestService.delete(requestId);
      
      if (response.success) {
        toast?.({ 
          title: 'Request deleted',
          description: 'The request has been successfully deleted.',
          variant: 'success'
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to delete request',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Filter requests by status
   */
  const filterByStatus = useCallback((status: RequestStatus | undefined) => {
    baseList.setFilter('status', status);
  }, [baseList]);
  
  /**
   * Filter requests by date range
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
    // Alias items as requests for better semantics
    requests: baseList.items,
    
    // Request-specific methods
    deleteRequest,
    filterByStatus,
    filterByDateRange
  };
};
