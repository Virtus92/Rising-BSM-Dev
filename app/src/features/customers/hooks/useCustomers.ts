'use client';

import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { CustomerService } from '@/features/customers/lib/services';
import { CustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { createBaseListUtility, BaseListUtility } from '@/shared/utils/list/baseListUtils';

/**
 * Extended interface for customer list operations
 */
export interface UseCustomersResult extends BaseListUtility<CustomerDto, CustomerFilterParamsDto> {
  // Alias for better semantics
  customers: CustomerDto[];
  
  // Customer-specific operations
  deleteCustomer: (id: number) => Promise<boolean>;
  filterByType: (type: CustomerType | undefined) => void;
  filterByStatus: (status: CommonStatus | undefined) => void;
  filterByLocation: (city?: string, country?: string) => void;
}

/**
 * Hook for managing customer list with the unified list utilities
 */
export const useCustomers = (initialFilters?: Partial<CustomerFilterParamsDto>): UseCustomersResult => {
  const { toast } = useToast();
  
  // Define the fetch function for customers
  const fetchCustomers = useCallback(async (filters: CustomerFilterParamsDto) => {
    return await CustomerService.getCustomers(filters);
  }, []);
  
  // Map UI sort field to actual database column
  const mapSortFieldToColumn = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'sortBy': 'name', // Default to name if sortBy is passed
      'name': 'name',
      'email': 'email',
      'phone': 'phone',
      'type': 'type',
      'status': 'status',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt'
    };
    
    return fieldMap[field] || 'name';
  };

  // Use the base list utility
  const baseList = createBaseListUtility<CustomerDto, CustomerFilterParamsDto>({
    fetchFunction: async (filters) => {
      // Map the sortBy field to an actual database column before sending to API
      const mappedFilters = {...filters};
      if (mappedFilters.sortBy) {
        mappedFilters.sortBy = mapSortFieldToColumn(mappedFilters.sortBy as string);
      }
      
      // Ensure we don't modify the sort direction
      // This is critical - client and server must agree on direction
      if (process.env.NODE_ENV === 'development') {
        console.log('Mapped customer filters:', mappedFilters);
      }
      
      try {
        // Create the API call promise first but don't await it yet
        // This prevents Function.prototype.apply errors on Promise objects
        const apiCall = CustomerService.getCustomers(mappedFilters);
        
        // Now await the promise
        return await apiCall;
      } catch (err) {
        console.error('Error in useCustomers fetchFunction:', err);
        throw err;
      }
    },
    initialFilters: initialFilters as CustomerFilterParamsDto,
    defaultSortField: 'sortBy' as keyof CustomerFilterParamsDto,
    defaultSortDirection: 'asc',
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit'] as Array<keyof CustomerFilterParamsDto>,
      enum: {
        type: Object.values(CustomerType),
        status: Object.values(CommonStatus),
        sortDirection: ['asc', 'desc']
      } as Record<keyof CustomerFilterParamsDto, any[]>
    }
  });
  
  /**
   * Delete a customer by ID
   */
  const deleteCustomer = useCallback(async (customerId: number) => {
    try {
      const response = await CustomerService.deleteCustomer(customerId);
      
      if (response.success) {
        toast?.({ 
          title: 'Customer deleted',
          description: 'The customer has been successfully deleted.',
          variant: 'success'
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to delete customer',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Filter customers by type
   */
  const filterByType = useCallback((type: CustomerType | undefined) => {
    baseList.setFilter('type', type);
  }, [baseList]);
  
  /**
   * Filter customers by status
   */
  const filterByStatus = useCallback((status: CommonStatus | undefined) => {
    baseList.setFilter('status', status);
  }, [baseList]);
  
  /**
   * Filter customers by location
   */
  const filterByLocation = useCallback((city?: string, country?: string) => {
    baseList.updateFilters({ 
      city: city || undefined, 
      country: country || undefined,
      page: 1 
    });
  }, [baseList]);
  
  return {
    ...baseList,
    // Alias items as customers for better semantics
    customers: baseList.items,
    
    // Customer-specific methods
    deleteCustomer,
    filterByType,
    filterByStatus,
    filterByLocation
  };
};
