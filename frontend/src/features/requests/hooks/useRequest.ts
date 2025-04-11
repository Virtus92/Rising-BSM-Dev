import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { RequestService } from '@/infrastructure/clients/RequestService';
import { 
  RequestDetailResponseDto, 
  ConvertToCustomerDto,
  RequestStatusUpdateDto
} from '@/domain/dtos/RequestDtos';

/**
 * Custom hook for managing a single request
 * 
 * @param requestId ID of the request to manage
 */
export const useRequest = (requestId?: number) => {
  const [request, setRequest] = useState<RequestDetailResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const fetchRequest = async () => {
    if (!requestId) return;
    
    try {
      setIsLoading(true);
      const response = await RequestService.getById(requestId);
      if (response.success && response.data) {
        setRequest(response.data);
      } else {
        setError(response.message || 'Failed to fetch request details');
      }
    } catch (err) {
      setError('Failed to fetch request details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const updateStatus = async (status: RequestStatusUpdateDto) => {
    if (!requestId) return;
    
    // Get status value for toast
    const statusValue = status.status;
    
    try {
      setIsUpdating(true);
      const response = await RequestService.updateStatus(requestId, status);
      if (response.success && response.data) {
        setRequest(response.data);
        toast({
          title: 'Status updated',
          description: `Request status updated to ${statusValue}`,
          variant: 'success'
        });
      } else {
        setError(response.message || 'Failed to update request status');
        toast({
          title: 'Update failed',
          description: response.message || 'Failed to update request status',
          variant: 'error'
        });
      }
    } catch (err) {
      setError('Failed to update request status');
      console.error(err);
      toast({
        title: 'Update failed',
        description: 'An error occurred while updating the request status',
        variant: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const convertToCustomer = async (data: ConvertToCustomerDto) => {
    if (!requestId) return;
    
    try {
      setIsConverting(true);
      const response = await RequestService.convertToCustomer(data);
      if (response.success) {
        toast({
          title: 'Conversion successful',
          description: 'Request successfully converted to customer',
          variant: 'success'
        });
        // Refresh request after conversion
        fetchRequest();
      } else {
        setError(response.message || 'Failed to convert request to customer');
        toast({
          title: 'Conversion failed',
          description: response.message || 'Failed to convert request to customer',
          variant: 'error'
        });
      }
    } catch (err) {
      setError('Failed to convert request to customer');
      console.error(err);
      toast({
        title: 'Conversion failed',
        description: 'An error occurred while converting the request to a customer',
        variant: 'error'
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Create appointment for this request
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);

  const createAppointment = async (appointmentData: any, note?: string) => {
    if (!requestId) return;
    
    try {
      setIsCreatingAppointment(true);
      const response = await RequestService.createAppointment(requestId, appointmentData, note);
      if (response.success) {
        toast({
          title: 'Appointment created',
          description: 'Appointment successfully created for this request',
          variant: 'success'
        });
        // Refresh request after creating appointment
        fetchRequest();
      } else {
        setError(response.message || 'Failed to create appointment');
        toast({
          title: 'Creation failed',
          description: response.message || 'Failed to create appointment',
          variant: 'error'
        });
      }
    } catch (err) {
      setError('Failed to create appointment');
      console.error(err);
      toast({
        title: 'Creation failed',
        description: 'An error occurred while creating the appointment',
        variant: 'error'
      });
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  // Add support for linking to customer
  const [isLinking, setIsLinking] = useState(false);

  const linkToCustomer = async (customerId: number, note?: string) => {
    if (!requestId) return;
    
    try {
      setIsLinking(true);
      const response = await RequestService.linkToCustomer(requestId, customerId, note);
      if (response.success) {
        toast({
          title: 'Link successful',
          description: 'Request successfully linked to customer',
          variant: 'success'
        });
        // Refresh request after linking
        fetchRequest();
      } else {
        setError(response.message || 'Failed to link request to customer');
        toast({
          title: 'Link failed',
          description: response.message || 'Failed to link request to customer',
          variant: 'error'
        });
      }
    } catch (err) {
      setError('Failed to link request to customer');
      console.error(err);
      toast({
        title: 'Link failed',
        description: 'An error occurred while linking the request to a customer',
        variant: 'error'
      });
    } finally {
      setIsLinking(false);
    }
  };
  
  // Support for add note functionality
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const addNote = async (noteText: string) => {
    if (!requestId || !noteText.trim()) return;
    
    try {
      setIsAddingNote(true);
      const response = await RequestService.addNote(requestId, noteText);
      if (response.success) {
        toast({
          title: 'Note added',
          description: 'Note added successfully',
          variant: 'success'
        });
        // Refresh request after adding note
        fetchRequest();
      } else {
        setError(response.message || 'Failed to add note');
        toast({
          title: 'Failed to add note',
          description: response.message || 'Failed to add note',
          variant: 'error'
        });
      }
    } catch (err) {
      setError('Failed to add note');
      console.error(err);
      toast({
        title: 'Failed to add note',
        description: 'An error occurred while adding a note',
        variant: 'error'
      });
    } finally {
      setIsAddingNote(false);
    }
  };
  
  // Support for deleting the request
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteRequest = async () => {
    if (!requestId) return;
    
    try {
      setIsDeleting(true);
      const response = await RequestService.delete(requestId);
      if (response.success) {
        toast({
          title: 'Request deleted',
          description: 'Request deleted successfully',
          variant: 'success'
        });
        return true;
      } else {
        setError(response.message || 'Failed to delete request');
        toast({
          title: 'Delete failed',
          description: response.message || 'Failed to delete request',
          variant: 'error'
        });
        return false;
      }
    } catch (err) {
      setError('Failed to delete request');
      console.error(err);
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the request',
        variant: 'error'
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Support for assigning request to a user
  const [isAssigning, setIsAssigning] = useState(false);
  
  const assignRequest = async (userId: number) => {
    if (!requestId) return;
    
    try {
      setIsAssigning(true);
      const response = await RequestService.assignRequest(requestId, userId);
      if (response.success) {
        toast({
          title: 'Request assigned',
          description: 'Request assigned successfully',
          variant: 'success'
        });
        fetchRequest();
        return true;
      } else {
        setError(response.message || 'Failed to assign request');
        toast({
          title: 'Assign failed',
          description: response.message || 'Failed to assign request',
          variant: 'error'
        });
        return false;
      }
    } catch (err) {
      setError('Failed to assign request');
      console.error(err);
      toast({
        title: 'Assign failed',
        description: 'An error occurred while assigning the request',
        variant: 'error'
      });
      return false;
    } finally {
      setIsAssigning(false);
    }
  };

  return {
    request,
    isLoading,
    error,
    isError: !!error,
    isUpdatingStatus: isUpdating,
    isUpdating,
    isConverting,
    isCreatingAppointment,
    isLinking,
    isAddingNote,
    isDeleting,
    isAssigning,
    updateStatus,
    convertToCustomer,
    createAppointment,
    linkToCustomer,
    addNote,
    deleteRequest,
    assignRequest,
    refetch: fetchRequest
  };
};
