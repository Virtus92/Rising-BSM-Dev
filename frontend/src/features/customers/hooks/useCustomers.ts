'use client';
import { useState, useEffect } from 'react';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { CustomerDto } from '@/domain/dtos/CustomerDtos';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await CustomerService.getCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        setError(response.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError('Failed to fetch customers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const deleteCustomer = async (customerId: number) => {
    try {
      const response = await CustomerService.deleteCustomer(customerId);
      if (response.success) {
        setCustomers(customers.filter(customer => customer.id !== customerId));
      } else {
        setError(response.message || 'Failed to delete customer');
      }
    } catch (err) {
      setError('Failed to delete customer');
      console.error(err);
    }
  };

  return { 
    customers, 
    isLoading, 
    error, 
    deleteCustomer,
    refetch: fetchCustomers 
  };
};
