'use client';

import { useCallback } from 'react';
import { useBaseList } from '@/shared/hooks/useBaseList';
import { CustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { useToast } from '@/shared/hooks/useToast';

interface UseRefactoredCustomersOptions {
  initialFilters?: CustomerFilterParamsDto;
  enableUrlSync?: boolean;
}

/**
 * Hook for managing customers with the unified list utilities
 */
export function useRefactoredCustomers({ 
  initialFilters, 
  enableUrlSync = true 
}: UseRefactoredCustomersOptions = {}) {
  const { toast } = useToast();
  
  // Define the fetch function for customers
  const fetchCustomers = useCallback(async (filters: CustomerFilterParamsDto) => {
    return await CustomerService.getCustomers(filters);
  }, []);
  
  // Use the base list hook
  const listResult = useBaseList<CustomerDto, CustomerFilterParamsDto>({
    fetchFunction: fetchCustomers,
    initialFilters: {
      page: 1,
      limit: 10,
      sortBy: 'name',
      sortDirection: 'asc',
      ...initialFilters
    },
    syncWithUrl: enableUrlSync,
    urlFilterConfig: {
      numeric: ['page', 'limit'],
      enum: {
        type: Object.values(CustomerType),
        status: Object.values(CommonStatus)
      }
    }
  });
  
  // Add customer-specific functionality
  
  /**
   * Delete a customer by ID
   */
  const deleteCustomer = useCallback(async (customerId: number) => {
    try {
      const response = await CustomerService.deleteCustomer(customerId);
      
      if (response.success) {
        toast({
          title: 'Customer deleted',
          description: 'The customer has been successfully deleted.',
          variant: 'success'
        });
        
        // Refresh the list
        listResult.refetch();
        return true;
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete customer',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, listResult]);
  
  /**
   * Filter customers by type
   */
  const filterByType = useCallback((type: CustomerType | undefined) => {
    listResult.updateFilters({ type, page: 1 });
  }, [listResult]);
  
  /**
   * Filter customers by status
   */
  const filterByStatus = useCallback((status: CommonStatus | undefined) => {
    listResult.updateFilters({ status, page: 1 });
  }, [listResult]);
  
  /**
   * Filter customers by location
   */
  const filterByLocation = useCallback((city?: string, country?: string) => {
    listResult.updateFilters({ 
      city: city || undefined, 
      country: country || undefined,
      page: 1 
    });
  }, [listResult]);
  
  return {
    // Spread all base list properties
    ...listResult,
    
    // Customers alias for items
    customers: listResult.items,
    
    // Customer-specific methods
    deleteCustomer,
    filterByType,
    filterByStatus,
    filterByLocation
  };
}
