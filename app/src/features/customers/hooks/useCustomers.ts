'use client';

import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
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
  
  // Add setPageSize method
  setPageSize: (pageSize: number) => void;
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
  
  // Map UI sort field to actual database column - this needs to match exactly what the server expects
  const mapSortFieldToColumn = (field: string): string => {
    const fieldMap: Record<string, string> = {
      // UI field -> Database column mapping
      'name': 'name',
      'email': 'email', 
      'phone': 'phone',
      'company': 'company',
      'city': 'city',
      'country': 'country',
      'postalCode': 'postalCode',
      'type': 'type',
      'status': 'status',
      'newsletter': 'newsletter',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      // Default fallback
      'id': 'createdAt'
    };
    
    return fieldMap[field] || 'createdAt';
  };

  // Use the base list utility
  const baseList = createBaseListUtility<CustomerDto, CustomerFilterParamsDto>({
    fetchFunction: async (filters) => {
      // Log filters for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('useCustomers: Processing filters:', filters);
      }
      
      // Map the sortBy field to an actual database column before sending to API
      const mappedFilters = { ...filters };
      if (mappedFilters.sortBy) {
        const originalSortBy = mappedFilters.sortBy;
        mappedFilters.sortBy = mapSortFieldToColumn(mappedFilters.sortBy as string);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`useCustomers: Mapped sortBy from '${originalSortBy}' to '${mappedFilters.sortBy}'`);
        }
      }
      
      // Ensure we have valid sort direction
      if (mappedFilters.sortDirection && !['asc', 'desc'].includes(mappedFilters.sortDirection)) {
        mappedFilters.sortDirection = 'desc';
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
        console.log('useCustomers: Final mapped filters:', mappedFilters);
      }
      
      try {
        // Make the API call
        const apiCall = CustomerService.getCustomers(mappedFilters);
        const response = await apiCall;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('useCustomers: API response:', response);
        }
        
        return response;
      } catch (err) {
        console.error('Error in useCustomers fetchFunction:', err);
        throw err;
      }
    },
    
    // Add response adapter to properly extract data from API response
    responseAdapter: (response) => {
      // Handle the API response structure
      const data = response?.data || response;
      
      // Extract items - API returns data.data for success responses
      let items: CustomerDto[] = [];
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
      sortBy: 'createdAt',
      sortDirection: 'desc',
      ...initialFilters
    } as CustomerFilterParamsDto,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit'] as Array<keyof CustomerFilterParamsDto>,
      boolean: ['newsletter', 'includeDeleted'] as Array<keyof CustomerFilterParamsDto>,
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
