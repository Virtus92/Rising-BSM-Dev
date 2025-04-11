import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { RequestService } from '@/infrastructure/clients/RequestService';
import { 
  RequestResponseDto,
  RequestFilterParamsDto
} from '@/domain/dtos/RequestDtos';

/**
 * Custom hook for managing a list of requests
 */
export const useRequests = (filters?: RequestFilterParamsDto) => {
  const [requests, setRequests] = useState<RequestResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await RequestService.getAll(filters);
      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        setError(response.message || 'Failed to fetch requests');
      }
    } catch (err) {
      setError('Failed to fetch requests');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]); // Re-fetch when filters change

  const deleteRequest = async (requestId: number) => {
    try {
      const response = await RequestService.delete(requestId);
      if (response.success) {
        // Remove the deleted request from the local state
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
        toast({
          title: 'Request deleted',
          description: 'Request deleted successfully',
          variant: 'success'
        });
        return true;
      } else {
        toast({
          title: 'Delete failed',
          description: response.message || 'Failed to delete request',
          variant: 'error'
        });
        return false;
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the request',
        variant: 'error'
      });
      return false;
    }
  };

  return {
    requests,
    isLoading,
    error,
    isError: !!error,
    deleteRequest,
    refetch: fetchRequests
  };
};
