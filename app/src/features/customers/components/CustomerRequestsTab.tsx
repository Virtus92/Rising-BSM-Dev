'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Calendar, Clock, User, AlertCircle, Edit, Trash2, Loader2, ChevronDown, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/shared/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { formatDate } from '@/shared/utils/date-utils';
import { RequestService } from '@/features/requests/lib/services/RequestService.client';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { useEntityModal } from '@/shared/hooks/useModal';
import { FormModal, ConfirmationModal } from '@/shared/components/BaseModal';
import RequestForm from '@/features/requests/components/RequestForm';
import { useToast } from '@/shared/hooks/useToast';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';

interface CustomerRequestsTabProps {
  customerId: number;
}

/**
 * Component to display and manage requests for a specific customer
 * Note: This component does not allow creating new requests for customers,
 * as requests are typically created through public forms and then linked to customers.
 */
export const CustomerRequestsTab: React.FC<CustomerRequestsTabProps> = ({ customerId }) => {
  const [requests, setRequests] = useState<RequestResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  
  // Get permissions
  const { hasPermission } = usePermissions();
  const canEditRequests = hasPermission(API_PERMISSIONS.REQUESTS.UPDATE);
  const canDeleteRequests = hasPermission(API_PERMISSIONS.REQUESTS.DELETE);
  
  // Use the entity modal hook for consistent behavior
  const modal = useEntityModal<RequestResponseDto>();
  
  // Fetch customer requests
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await RequestService.findAll({
        customerId: Number(customerId),
        sortBy: 'createdAt',
        sortDirection: 'desc'
      });
      
      if (response.success && response.data) {
        if (Array.isArray(response.data.data)) {
          const data = response.data.data;
          const filteredData = data.filter((request) => Number(request.customerId) === Number(customerId));
          setRequests(filteredData);
        } else {
          setRequests([]);
        }
      } else {
        setError('Failed to load requests');
        console.error('Error fetching requests:', response.message);
      }
    } catch (err) {
      setError('Failed to load requests');
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchRequests();
    }
  }, [customerId, fetchRequests]);

  // Handle request form submission (for editing only)
  const handleRequestSubmit = useCallback(async (data: any) => {
    modal.setError(null);
    modal.setSuccess(false);
    modal.setIsSubmitting(true);
    
    try {
      let response;
      
      if (modal.action?.type === 'edit' && modal.action.item) {
        response = await RequestService.updateRequest(modal.action.item.id, data);
      } else {
        modal.setError('Invalid action type');
        return null;
      }
      
      if (response && response.success) {
        modal.setSuccess(true);
        toast({
          title: 'Success',
          description: 'Request updated successfully',
          variant: 'success'
        });
        
        // Refresh the requests list
        await fetchRequests();
        
        // Close modal after a delay
        setTimeout(() => {
          modal.closeModal();
        }, 1500);
        
        return response.data;
      } else {
        modal.setError(response?.message || 'Failed to update request');
        return null;
      }
    } catch (err) {
      console.error('Error updating request:', err);
      modal.setError('An unexpected error occurred');
      return null;
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast, fetchRequests]);

  // Handle request deletion
  const handleRequestDelete = useCallback(async () => {
    if (!modal.action?.item) return;
    
    modal.setError(null);
    modal.setIsSubmitting(true);
    
    try {
      const response = await RequestService.deleteRequest(modal.action.item.id);
      
      if (response && response.success) {
        toast({
          title: 'Success',
          description: 'Request has been deleted successfully',
          variant: 'success'
        });
        
        // Refresh the requests list
        await fetchRequests();
        modal.closeModal();
      } else {
        modal.setError('Failed to delete request');
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      modal.setError('An unexpected error occurred');
    } finally {
      modal.setIsSubmitting(false);
    }
  }, [modal, toast, fetchRequests]);

  // Handle list actions (removed create action)
  const handleListAction = useCallback((action: string, request?: RequestResponseDto) => {
    switch (action) {
      case 'edit':
        if (request && canEditRequests) {
          modal.openEditModal(request);
        }
        break;
      case 'view':
        if (request) {
          router.push(`/dashboard/requests/${request.id}`);
        }
        break;
      case 'delete':
        if (request && canDeleteRequests) {
          modal.openDeleteModal(request);
        }
        break;
    }
  }, [modal, canEditRequests, canDeleteRequests, router]);

  // Handle request status change
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setChangingStatusId(id);
      
      const response = await RequestService.updateRequest(id, { 
        status: newStatus as RequestStatus 
      });
      
      if (response && response.success) {
        // Update local state
        setRequests(requests.map(request => 
          request.id === id 
            ? { ...request, status: newStatus as RequestStatus } 
            : request
        ));
        
        toast({
          title: 'Status updated',
          description: `Request status changed to ${newStatus}`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'Update failed',
          description: response?.message || 'Failed to update status',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: 'Update failed',
        description: 'An error occurred while updating the status',
        variant: 'error'
      });
    } finally {
      setChangingStatusId(null);
    }
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
    
    switch (status) {
      case RequestStatus.NEW:
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>New</span>;
      case RequestStatus.IN_PROGRESS:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>In Progress</span>;
      case RequestStatus.COMPLETED:
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>Completed</span>;
      case RequestStatus.CANCELLED:
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>Cancelled</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
    }
  };

  // Get modal title and description
  const getModalInfo = () => {
    switch (modal.action?.type) {
      case 'edit':
        return {
          title: 'Edit Request',
          description: `Update request details`
        };
      case 'delete':
        return {
          title: 'Delete Request',
          description: `Are you sure you want to delete this request? This action cannot be undone.`
        };
      default:
        return {
          title: 'Request',
          description: ''
        };
    }
  };

  const modalInfo = getModalInfo();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Error loading requests
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-400">
              <p>{error}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRequests}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/requests')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View all requests
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - No create button for requests
  if (requests.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No requests found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          This customer doesn't have any associated requests. Requests are typically created through the public contact form and then linked to existing customers.
        </p>
        <div className="flex justify-center space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/requests')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View all requests
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit public form
          </Button>
        </div>
      </div>
    );
  }

  // Sort requests by date (most recent first)
  const sortedRequests = [...requests].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">
            Requests ({requests.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            View and manage requests linked to this customer
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {sortedRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  <Link 
                    href={`/dashboard/requests/${request.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {request.service || 'General Inquiry'}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {request.message && request.message.length > 60
                    ? `${request.message.substring(0, 60)}...`
                    : request.message}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {renderStatusBadge(request.status)}
                <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs mt-1"
                        disabled={changingStatusId === request.id}
                      >
                        {changingStatusId === request.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        )}
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {Object.values(RequestStatus).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          disabled={request.status === status}
                          className={request.status === status ? 'bg-muted cursor-default' : ''}
                          onClick={() => request.status !== status && handleStatusChange(request.id, status)}
                        >
                          {request.status === status && (
                            <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                          )}
                          <span className={request.status === status ? 'font-medium ml-6' : ''}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid gap-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {formatDate(new Date(request.createdAt))}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{request.name}</span>
                  {request.email && (
                    <span className="ml-2 text-gray-500">({request.email})</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-2 items-center p-6">
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/requests/${request.id}`)}
                >
                  View Details
                </Button>
                <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-gray-500"
                    onClick={() => handleListAction('edit', request)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission={SystemPermission.REQUESTS_DELETE}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleListAction('delete', request)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </PermissionGuard>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Edit Request Modal */}
      {modal.action?.type === 'edit' && (
        <FormModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modalInfo.title}
          description={modalInfo.description}
          isSubmitting={modal.isSubmitting}
          error={modal.error}
          success={modal.success}
          size="lg"
          showDefaultActions={false}
        >
          <RequestForm
            initialData={modal.action.item}
            onSubmit={handleRequestSubmit}
            mode="edit"
            isLoading={modal.isSubmitting}
            error={modal.error}
            success={modal.success}
            onCancel={modal.closeModal}
          />
        </FormModal>
      )}
      
      {/* Delete Request Modal */}
      {modal.action?.type === 'delete' && (
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          title={modalInfo.title}
          message={modalInfo.description}
          variant="destructive"
          confirmLabel="Delete Request"
          onConfirm={handleRequestDelete}
          isConfirming={modal.isSubmitting}
          error={modal.error}
        />
      )}
    </div>
  );
};

export default CustomerRequestsTab;
