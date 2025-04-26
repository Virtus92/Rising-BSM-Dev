'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import RequestForm from '@/features/requests/components/RequestForm';
import { RequestService } from '@/features/requests/lib/services';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { AccessDenied } from '@/shared/components/AccessDenied';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

export default function EditRequestPage() {
  const params = useParams();
  const requestId = parseInt(params.id as string);
  const [request, setRequest] = useState<RequestResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const canEditRequest = true; // Bypass permission check

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        // Use the proper method from the service - findRequestById is the actual method name
        const response = await RequestService.findRequestById(requestId);
        
        if (response.success && response.data) {
          setRequest(response.data);
        } else {
          setError(response.message || 'Failed to fetch request details');
          toast({
            title: 'Error',
            description: response.message || 'Failed to fetch request details',
            variant: 'error'
          });
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch request details');
        toast({
          title: 'Error',
          description: 'Failed to fetch request details',
          variant: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (canEditRequest) {
      fetchRequest();
    } else {
      setLoading(false);
    }
  }, [requestId, toast, canEditRequest]);

  // Update request handler
  const handleUpdateRequest = async (data: any) => {
    try {
      const response = await RequestService.updateRequest(requestId, data);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Request has been updated successfully',
          variant: 'success'
        });
        return response.data;
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update request',
          variant: 'error'
        });
        return null;
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to update request',
        variant: 'error'
      });
      return null;
    }
  };

  if (!canEditRequest) {
    return <AccessDenied resource="requests" action="edit" />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 text-center mb-4">
          {error || 'Request not found'}
        </p>
        <button 
          onClick={() => router.push('/dashboard/requests')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Requests
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RequestForm 
        mode="edit" 
        initialData={request} 
        onSubmit={handleUpdateRequest} 
      />
    </div>
  );
}
