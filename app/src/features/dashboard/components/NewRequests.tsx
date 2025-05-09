'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText,
  RefreshCw, 
  Calendar, 
  UserPlus, 
  MessageSquare, 
  Edit, 
  Check,
  X, 
  ChevronRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import RequestClient from '@/features/requests/lib/clients/RequestClient';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { useToast } from '@/shared/hooks/useToast';

/**
 * NewRequests Component
 * 
 * Displays recent service requests with user-friendly action buttons
 * and clean layout for optimal usability.
 */
export const NewRequests = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);
  
  // Load requests on component mount
  useEffect(() => {
    fetchRequests();
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchRequests(false);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch requests from API
  const fetchRequests = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const response = await RequestClient.getRequests({
        status: RequestStatus.NEW,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        limit: 5
      });
      
      if (response.success && Array.isArray(response.data)) {
        setRequests(response.data);
        setError(null);
      } else {
        setError('Failed to load requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('An error occurred while loading requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view request details
  const handleViewRequest = (requestId: number) => {
    router.push(`/dashboard/requests/${requestId}`);
  };
  
  // Handle editing a request
  const handleEditRequest = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/requests/${requestId}/edit`);
  };
  
  // Add a note to a request
  const handleAddNote = async (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const note = prompt('Enter a note for this request:');
    if (note && note.trim()) {
      setIsActionLoading(requestId);
      
      try {
        const response = await RequestClient.addNote(requestId, note);
        
        if (response.success) {
          toast({
            title: 'Note added',
            description: 'Note has been added successfully',
            variant: 'success'
          });
          fetchRequests(false);
        } else {
          toast({
            title: 'Failed to add note',
            description: response.message || 'An error occurred',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error adding note:', error);
        toast({
          title: 'Error',
          description: 'Failed to add note. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsActionLoading(null);
      }
    }
  };
  
  // Update request status
  const handleUpdateStatus = async (requestId: number, status: RequestStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const statusLabel = status === RequestStatus.IN_PROGRESS ? 'in progress' : 
                         status === RequestStatus.COMPLETED ? 'completed' : 
                         status === RequestStatus.CANCELLED ? 'cancelled' : status.toLowerCase();
    
    if (confirm(`Are you sure you want to mark this request as ${statusLabel}?`)) {
      setIsActionLoading(requestId);
      
      try {
        const response = await RequestClient.updateStatus(requestId, { status });
        
        if (response.success) {
          toast({
            title: 'Status updated',
            description: `Request marked as ${statusLabel}`,
            variant: 'success'
          });
          fetchRequests(false);
        } else {
          toast({
            title: 'Failed to update status',
            description: response.message || 'An error occurred',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error updating status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update status. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsActionLoading(null);
      }
    }
  };
  
  // Convert request to customer
  const handleConvertToCustomer = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/requests/${requestId}?tab=convert`);
  };
  
  // Schedule appointment for request
  const handleScheduleAppointment = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/requests/${requestId}?tab=appointment`);
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge based on request status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case RequestStatus.IN_PROGRESS:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">In Progress</Badge>;
      case RequestStatus.COMPLETED:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Completed</Badge>;
      case RequestStatus.CANCELLED:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Cancelled</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">New</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            New Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            New Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h4 className="text-red-800 dark:text-red-300 font-medium">Error loading requests</h4>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => fetchRequests()}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            New Requests
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchRequests()}
            className="h-8 w-8 p-0"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full mb-3">
            <FileText className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No new requests</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            All requests have been processed. When new requests arrive, they will appear here.
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/requests')}
            className="flex items-center"
          >
            View All Requests
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Normal state with requests
  return (
    <Card className="h-full">
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-purple-500" />
          New Requests
        </CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchRequests()}
            className="h-9 w-9 p-0 flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {requests.map((request) => (
            <div 
              key={request.id} 
              onClick={() => handleViewRequest(request.id)}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-4 cursor-pointer transition-colors"
            >
              {/* Request info */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-sm md:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    {request.name}
                    {getStatusBadge(request.status)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {request.service || 'Service Request'}
                  </p>
                </div>
                <div className="text-xs text-right">
                  <div className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(request.createdAt)}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {formatTime(request.createdAt)}
                  </div>
                </div>
              </div>
              
              {/* Message preview */}
              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {request.message}
                </p>
              </div>
              
              {/* Action buttons - larger and more visible */}
              <div className="flex flex-wrap gap-2 mt-4">
                {isActionLoading === request.id ? (
                  <div className="w-full flex items-center justify-center py-2">
                    <Loader2 className="h-5 w-5 text-purple-500 animate-spin mr-2" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Processing...</span>
                  </div>
                ) : (
                  <TooltipProvider>
                    <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
                            onClick={(e) => handleUpdateStatus(request.id, RequestStatus.IN_PROGRESS, e)}
                          >
                            <Play className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1.5" />
                            <span className="text-blue-600 dark:text-blue-400">Start</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark as in progress</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700"
                            onClick={(e) => handleUpdateStatus(request.id, RequestStatus.COMPLETED, e)}
                          >
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400 mr-1.5" />
                            <span className="text-green-600 dark:text-green-400">Complete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark as completed</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-700"
                            onClick={(e) => handleAddNote(request.id, e)}
                          >
                            <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-1.5" />
                            <span className="text-amber-600 dark:text-amber-400">Note</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add a note</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <div className="grow"></div> {/* Spacer */}
                    
                    <PermissionGuard permission={SystemPermission.CUSTOMERS_CREATE}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-indigo-200 hover:border-indigo-300 dark:border-indigo-800 dark:hover:border-indigo-700"
                            onClick={(e) => handleConvertToCustomer(request.id, e)}
                          >
                            <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-1.5" />
                            <span className="text-indigo-600 dark:text-indigo-400">Convert</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Convert to customer</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                    
                    <PermissionGuard permission={SystemPermission.APPOINTMENTS_CREATE}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-purple-200 hover:border-purple-300 dark:border-purple-800 dark:hover:border-purple-700"
                            onClick={(e) => handleScheduleAppointment(request.id, e)}
                          >
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-1.5" />
                            <span className="text-purple-600 dark:text-purple-400">Schedule</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Schedule appointment</p>
                        </TooltipContent>
                      </Tooltip>
                    </PermissionGuard>
                  </TooltipProvider>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 text-center border-t border-slate-200 dark:border-slate-700">
          <Button 
            variant="link" 
            onClick={() => router.push('/dashboard/requests')}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center mx-auto"
          >
            View all requests
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Play icon component
const Play = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export default NewRequests;