'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Interface for structured request data
 */
export interface RequestDataItem {
  id: number;
  requestId: number;
  category: string;
  label: string;
  order: number;
  dataType: string;
  data: any;
  isValid: boolean;
  processedBy?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook for fetching and managing structured data for a request
 * 
 * @param requestId - ID of the request
 * @returns Structured data and loading state
 */
export const useRequestData = (requestId?: number) => {
  const [requestData, setRequestData] = useState<RequestDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchRequestData = async () => {
    if (!requestId) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/requests/data?requestId=${requestId}`);
      const result = await response.json();
      
      if (result.success) {
        // Sort by order field
        const sortedData = [...result.data].sort((a, b) => a.order - b.order);
        setRequestData(sortedData);
      } else {
        setError(result.message || 'Failed to fetch request data');
        toast({
          title: 'Error',
          description: 'Failed to load request data',
          variant: 'error'
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading data',
        variant: 'error'
      });
      console.error('Error fetching request data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequestData();
  }, [requestId]);
  
  return {
    requestData,
    isLoading,
    error,
    refetch: fetchRequestData
  };
};