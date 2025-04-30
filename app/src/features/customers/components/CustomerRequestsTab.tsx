'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Calendar, Clock, User, AlertCircle, Edit, Trash2, Plus, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
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
import { RequestService } from '@/features/requests/lib/services';
import { useToast } from '@/shared/hooks/useToast';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';

interface CustomerRequestsTabProps {
  customerId: number;
}

/**
 * Component to display and manage requests for a specific customer
 */
export const CustomerRequestsTab: React.FC<CustomerRequestsTabProps> = ({ customerId }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [isRequestEditModalOpen, setIsRequestEditModalOpen] = useState(false);
  const [currentEditRequest, setCurrentEditRequest] = useState<number | null>(null);
  const [isEditingRequest, setIsEditingRequest] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    status: RequestStatus.NEW
  });
  
  const { toast } = useToast();
  const router = useRouter();

  // Fetch customer requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Properly filter requests by customerId on the backend
        // Ensure the customerId is passed as a number to avoid type mismatches
        const response = await RequestService.findAll({
          customerId: Number(customerId),  // Convert to number to ensure type consistency
          sortBy: 'createdAt',
          sortDirection: 'desc'
        });
        
        // For debugging - remove in production
        if (process.env.NODE_ENV === 'development') {
          console.log(`Filtering requests for customer ID: ${customerId}`);
          console.log('Response data count:', response.data?.data?.length || 0);
        }
        
        if (response.success && response.data) {
          // Ensure we're handling the data structure correctly
          if (Array.isArray(response.data.data)) {
            // Use the requests returned by the backend, which should be filtered by customerId
            // Add a safety check during transition to ensure we only show requests for this customer
            const data = response.data.data;
            
            // Filter requests by customer ID
            const filteredData = data.filter((request) => Number(request.customerId) === Number(customerId));
            
            // If filtering happened on the client, log a warning for debugging
            if (filteredData.length !== data.length) {
              console.warn(`Backend returned ${data.length} requests, but only ${filteredData.length} match customer ID ${customerId}. Backend filtering may not be working properly.`);
            }
            
            setRequests(filteredData);
          } else if (response.data.data) {
            // Handle any other structure
            setRequests([]);
            console.error('Unexpected data structure:', response.data);
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
    };

    if (customerId) {
      fetchRequests();
    }
  }, [customerId]);

  // Handle request status change
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setChangingStatusId(id);
      
      // Log the request we're about to make
      console.log(`Updating request ${id} status to ${newStatus}`);
      
      // Use PUT for status update instead of PATCH to avoid 500 errors
      // Use the correct parameters for updateRequestStatus method
      const response = await RequestService.updateRequest(id, { status: newStatus as RequestStatus, note: 'Status updated via customer requests tab' });
      
      if (response.success) {
        // Update local state
        setRequests(requests.map(request => 
          request.id === id 
            ? { ...request, status: newStatus, statusLabel: getStatusLabel(newStatus) } 
            : request
        ));
        
        toast({
          title: 'Status updated',
          description: `Request status changed to ${newStatus}`,
          variant: 'success'
        });
      } else {
        console.error('Status update response error:', response);
        toast({
          title: 'Update failed',
          description: response.message || 'Failed to update status',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating request status:', error as Error);
      toast({
        title: 'Update failed',
        description: 'An error occurred while updating the status',
        variant: 'error'
      });
    } finally {
      setChangingStatusId(null);
    }
  };
  
  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case RequestStatus.NEW: return 'New';
      case RequestStatus.IN_PROGRESS: return 'In Progress';
      case RequestStatus.COMPLETED: return 'Completed';
      case RequestStatus.CANCELLED: return 'Cancelled';
      default: return status;
    }
  };

  // Handle request deletion
  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await RequestService.delete(id);
      
      if (response.success) {
        // Remove deleted request from state
        setRequests(requests.filter(request => request.id !== id));
        
        toast({
          title: 'Request deleted',
          description: 'The request has been successfully deleted',
          variant: 'success'
        });
      } else {
        toast({
          title: 'Delete failed',
          description: response.message || 'Failed to delete request',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting request:', error as Error);
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the request',
        variant: 'error'
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
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

  // Form validation and submission
  const validateRequestForm = () => {
    const errors: Record<string, string> = {};
    
    if (!requestForm.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!requestForm.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(requestForm.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!requestForm.service?.trim()) {
      errors.service = 'Service is required';
    }
    
    if (!requestForm.message?.trim()) {
      errors.message = 'Message is required';
    }
    
    // Validate phone format if provided - German/international phone format
    if (requestForm.phone?.trim()) {
      // Simple validation for international or german phone format
      // Allow only digits, spaces, plus, parentheses and dashes
      const phoneRegex = /^[0-9+\s()-]+$/;
      if (!phoneRegex.test(requestForm.phone)) {
        errors.phone = 'Invalid phone format. Use only numbers, spaces, +, (), and -';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setRequestForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setRequestForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleCreateRequest = async () => {
    if (!validateRequestForm()) {
      return;
    }
    
    setIsCreatingRequest(true);
    
    try {
      const formData = {
        ...requestForm,
        customerId: customerId
      };
      
      const response = await RequestService.create(formData);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Request created successfully',
          variant: 'success'
        });
        
        // Add the new request to the list
        setRequests([response.data, ...requests]);
        
        // Close the modal and reset form
        setIsRequestModalOpen(false);
        setRequestForm({
          name: '',
          email: '',
          phone: '',
          service: '',
          message: '',
          status: RequestStatus.NEW
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create request',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating request:', error as Error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the request',
        variant: 'error'
      });
    } finally {
      setIsCreatingRequest(false);
    }
  };
  
  const handleEditRequest = async () => {
    if (!validateRequestForm() || !currentEditRequest) {
      return;
    }
    
    setIsEditingRequest(true);
    
    try {
      // Create a clean data object with only the necessary fields
      // This avoids sending data that might cause Prisma validation issues
      const formData: Record<string, any> = {};
      
      // Only include non-empty fields to prevent null/undefined issues
      if (requestForm.name?.trim()) formData.name = requestForm.name.trim();
      if (requestForm.email?.trim()) formData.email = requestForm.email.trim();
      if (requestForm.service?.trim()) formData.service = requestForm.service.trim();
      if (requestForm.message?.trim()) formData.message = requestForm.message.trim();
      
      // Handle phone field carefully - only include if it has valid content
      if (requestForm.phone?.trim()) {
        const cleanedPhone = requestForm.phone.trim().replace(/\s+/g, ' ');
        if (/^[0-9+\s()-]+$/.test(cleanedPhone)) {
          formData.phone = cleanedPhone;
        } else {
          // If phone doesn't match the validation pattern, don't include it
          // but log for debugging
          console.warn('Phone number was provided but did not match validation pattern');
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating request ${currentEditRequest} with data:`, formData);
      }
      
      // Update the basic request data first - without including status
      // Status will be updated separately
      const response = await RequestService.update(currentEditRequest, formData);
      
      if (response.success) {
        // If basic update succeeded, handle status update separately if needed
        const originalRequest = requests.find(r => r.id === currentEditRequest);
        let statusUpdateSuccess = true;
        
        if (originalRequest && originalRequest.status !== requestForm.status) {
          try {
            // Use the dedicated status update endpoint for status changes
            const statusResponse = await RequestService.updateRequest(currentEditRequest, {
              status: requestForm.status,
              note: 'Status updated during request edit'
            });
            
            if (!statusResponse.success) {
              console.error('Status update failed:', statusResponse);
              statusUpdateSuccess = false;
            }
          } catch (statusError) {
            console.error('Error updating status:', statusError);
            statusUpdateSuccess = false;
          }
        }
        
        // Update local state with the new request data
        const updatedRequest = {
          ...originalRequest,
          ...formData,
          // Only update status in UI if status update succeeded or status didn't change
          status: (statusUpdateSuccess && originalRequest.status !== requestForm.status) 
            ? requestForm.status 
            : originalRequest?.status,
          statusLabel: (statusUpdateSuccess && originalRequest.status !== requestForm.status)
            ? getStatusLabel(requestForm.status)
            : originalRequest?.statusLabel
        };
        
        setRequests(requests.map(request => 
          request.id === currentEditRequest 
            ? updatedRequest
            : request
        ));
        
        toast({
          title: 'Success',
          description: statusUpdateSuccess 
            ? 'Request updated successfully' 
            : 'Request updated but status change failed',
          variant: statusUpdateSuccess ? 'success' : 'warning'
        });
        
        // Close the modal and reset state
        setIsRequestEditModalOpen(false);
        setCurrentEditRequest(null);
      } else {
        console.error('Update response error:', response);
        
        // Extract specific validation error details if available
        const errorDetail = response.errors && response.errors.length > 0 
          ? response.errors[0]
          : response.message || 'Failed to update request';
          
        toast({
          title: 'Error',
          description: errorDetail,
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating request:', error as Error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating the request',
        variant: 'error'
      });
    } finally {
      setIsEditingRequest(false);
    }
  };
  
  const handleOpenEditModal = (request: any) => {
    // Set the form data
    setRequestForm({
      name: request.name || '',
      email: request.email || '',
      phone: request.phone || '',
      service: request.service || '',
      message: request.message || '',
      status: request.status || RequestStatus.NEW,
    });
    
    // Set the current request ID
    setCurrentEditRequest(request.id);
    
    // Open the edit modal
    setIsRequestEditModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
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
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Error loading requests
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-400">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No requests yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          This customer doesn't have any associated requests. Requests are typically created through the public form or converted from other entities.
        </p>
      </div>
    );
  }

  // Sort requests by date (most recent first)
  const sortedRequests = [...requests].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Requests ({requests.length})
        </h2>
        {/* No "New Request" button as per business requirements */}
      </div>
      
      {/* Request Creation Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Request</DialogTitle>
            <DialogDescription>
              Create a new request for this customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={requestForm.name}
                onChange={handleRequestInputChange}
                placeholder="Customer name"
                disabled={isCreatingRequest}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={requestForm.email}
                onChange={handleRequestInputChange}
                placeholder="customer@example.com"
                disabled={isCreatingRequest}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={requestForm.phone}
                onChange={handleRequestInputChange}
                placeholder="+1234567890"
                disabled={isCreatingRequest}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">
                Service <span className="text-red-500">*</span>
              </Label>
              <Input
                id="service"
                name="service"
                value={requestForm.service}
                onChange={handleRequestInputChange}
                placeholder="Requested service"
                disabled={isCreatingRequest}
              />
              {formErrors.service && (
                <p className="text-red-500 text-sm mt-1">{formErrors.service}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                value={requestForm.message}
                onChange={handleRequestInputChange}
                placeholder="Request details or notes"
                rows={4}
                disabled={isCreatingRequest}
              />
              {formErrors.message && (
                <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={requestForm.status}
                onValueChange={(value) => handleSelectChange('status', value)}
                disabled={isCreatingRequest}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RequestStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRequestModalOpen(false)}
              disabled={isCreatingRequest}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRequest}
              disabled={isCreatingRequest}
            >
              {isCreatingRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Create Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Edit Modal */}
      <Dialog open={isRequestEditModalOpen} onOpenChange={setIsRequestEditModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
            <DialogDescription>
              Update the details of this request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={requestForm.name}
                onChange={handleRequestInputChange}
                placeholder="Customer name"
                disabled={isEditingRequest}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={requestForm.email}
                onChange={handleRequestInputChange}
                placeholder="customer@example.com"
                disabled={isEditingRequest}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={requestForm.phone}
                onChange={handleRequestInputChange}
                placeholder="+1234567890"
                disabled={isEditingRequest}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">
                Service <span className="text-red-500">*</span>
              </Label>
              <Input
                id="service"
                name="service"
                value={requestForm.service}
                onChange={handleRequestInputChange}
                placeholder="Requested service"
                disabled={isEditingRequest}
              />
              {formErrors.service && (
                <p className="text-red-500 text-sm mt-1">{formErrors.service}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                value={requestForm.message}
                onChange={handleRequestInputChange}
                placeholder="Request details or notes"
                rows={4}
                disabled={isEditingRequest}
              />
              {formErrors.message && (
                <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={requestForm.status}
                onValueChange={(value) => handleSelectChange('status', value)}
                disabled={isEditingRequest}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RequestStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRequestEditModalOpen(false);
                setCurrentEditRequest(null);
              }}
              disabled={isEditingRequest}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditRequest}
              disabled={isEditingRequest}
            >
              {isEditingRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {sortedRequests.map((request) => (
          <Card key={request.id} className="mb-4">
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
                {request.processorId && request.processorName && (
                <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span>Assigned to: {request.processorName}</span>
                </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-2 items-center p-6">
              <div className="flex space-x-2">
                <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-gray-500"
                    onClick={() => handleOpenEditModal(request)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission={SystemPermission.REQUESTS_DELETE}>
                  <AlertDialog open={deleteId === request.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => setDeleteId(request.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this request. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleDelete(request.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </PermissionGuard>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};