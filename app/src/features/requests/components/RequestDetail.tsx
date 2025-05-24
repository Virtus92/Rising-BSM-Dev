'use client';

import React, { useState, useCallback } from 'react';
import { useRequest } from '../hooks/useRequest';
import { useRouter } from 'next/navigation';
import { DetailPageLayout, createStatusBadge, getInitials } from '@/shared/components/DetailPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Separator } from '@/shared/components/ui/separator';
import { FormModal } from '@/shared/components/modals';
import { useEntityModal } from '@/shared/hooks/useModal';
import { RequestFormFields, RequestFormData } from './RequestFormFields';
import { useToast } from '@/shared/hooks/useToast';
import { RequestService } from '@/features/requests/lib/services/RequestService.client';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { RequestStatusUpdateDto, UpdateRequestDto } from '@/domain/dtos/RequestDtos';
import { ConvertToCustomerForm } from './ConvertToCustomerForm';
import { LinkToCustomerForm } from './LinkToCustomerForm';
import Link from 'next/link';
import {
  Mail,
  Phone,
  Clock,
  User,
  MessageCircle,
  UserPlus,
  LinkIcon,
  AlertCircle,
  Loader2,
  UserCheck,
  Edit,
  Briefcase,
  Calendar,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface RequestDetailProps {
  id: number;
  onBack?: () => void;
}

// Status configuration for requests
const requestStatusConfig = {
  [RequestStatus.NEW]: { color: 'bg-blue-500', label: 'New' },
  [RequestStatus.IN_PROGRESS]: { color: 'bg-yellow-500', label: 'In Progress' },
  [RequestStatus.COMPLETED]: { color: 'bg-green-500', label: 'Completed' },
  [RequestStatus.CANCELLED]: { color: 'bg-red-500', label: 'Cancelled' }
};

export const RequestDetail: React.FC<RequestDetailProps> = ({ id, onBack }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const {
    request,
    isLoading,
    isError,
    updateStatus,
    addNote,
    deleteRequest,
    isUpdatingStatus,
    isAddingNote,
    isDeleting,
    refetch,
  } = useRequest(id);

  // State
  const [noteText, setNoteText] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Use the entity modal hook for edit functionality
  const editModal = useEntityModal<any>();

  // Form state for edit modal
  const [editFormData, setEditFormData] = useState<RequestFormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    status: RequestStatus.NEW
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // Permissions
  const canEdit = hasPermission(SystemPermission.REQUESTS_EDIT);
  const canDelete = hasPermission(SystemPermission.REQUESTS_DELETE);
  const canConvert = hasPermission(SystemPermission.CUSTOMERS_CREATE);
  const canLink = hasPermission(SystemPermission.REQUESTS_EDIT);

  // Handle request form submission for edit
  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: Record<string, string> = {};
    if (!editFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!editFormData.service.trim()) {
      errors.service = 'Service is required';
    }
    if (!editFormData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }
    
    setEditFormErrors({});
    editModal.setError(null);
    editModal.setSuccess(false);
    editModal.setIsSubmitting(true);
    
    try {
      const response = await RequestService.updateRequest(id, editFormData as UpdateRequestDto);
      
      if (response?.success) {
        editModal.setSuccess(true);
        editModal.setError(null);
        
        // Show success toast
        toast({
          title: 'Success',
          description: 'Request updated successfully',
          variant: 'success'
        });
        
        // Refresh the request data
        if (refetch) {
          await refetch();
        }
        
        // Close modal after a delay
        setTimeout(() => {
          editModal.closeModal();
        }, 1500);
        
        return response.data || null;
      } else {
        editModal.setError(response?.message || 'Failed to update request');
        editModal.setSuccess(false);
        return null;
      }
    } catch (err) {
      console.error('Error updating request:', err);
      editModal.setError('An unexpected error occurred');
      editModal.setSuccess(false);
      return null;
    } finally {
      editModal.setIsSubmitting(false);
    }
  }, [id, editModal, toast, refetch, editFormData]);

  // Handle note submission
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    addNote(noteText);
    setNoteText('');
  };

  // Handle status change
  const handleStatusChange = async (status: string) => {
    try {
      setChangingStatus(true);
      const data: RequestStatusUpdateDto = {
        status: status as RequestStatus,
      };
      
      await updateStatus(data);
      
      toast({
        title: 'Status updated',
        description: `Request status changed to ${status}`,
        variant: 'success'
      });
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update request status',
        variant: 'error'
      });
    } finally {
      setChangingStatus(false);
    }
  };

  // Handle delete
  const handleDeleteRequest = async () => {
    const success = await deleteRequest();
    if (success) {
      router.push('/dashboard/requests');
    }
  };

  // Open edit modal
  const openEditModal = () => {
    if (!request) return;
    
    setEditFormData({
      name: request.name || '',
      email: request.email || '',
      phone: request.phone || '',
      service: request.service || '',
      message: request.message || '',
      status: request.status as RequestStatus || RequestStatus.NEW
    });
    setEditFormErrors({});
    editModal.openEditModal(request);
  };

  if (!request && !isLoading && !isError) {
    return null;
  }

  // Prepare data for DetailPageLayout
  const statusBadge = request ? createStatusBadge(request.status, requestStatusConfig) : null;
  
  const profileInfo = request ? [
    {
      label: 'Email',
      value: <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline dark:text-blue-400">{request.email}</a>,
      icon: Mail,
      iconColor: 'text-blue-500'
    },
    {
      label: 'Phone',
      value: request.phone ? <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline dark:text-blue-400">{request.phone}</a> : null,
      icon: Phone,
      iconColor: 'text-green-500',
      emptyText: 'No phone provided'
    },
    {
      label: 'Service',
      value: <span className="text-sm font-medium">{request.service}</span>,
      icon: Briefcase,
      iconColor: 'text-purple-500'
    },
    {
      label: 'Customer',
      value: request.customerName ? (
        <Link 
          href={`/dashboard/customers/${request.customerId}`} 
          className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
        >
          {request.customerName}
        </Link>
      ) : null,
      icon: UserCheck,
      iconColor: 'text-amber-500',
      emptyText: 'Not linked to customer'
    },
    {
      label: 'Processor',
      value: request.processorName ? <span className="text-sm">{request.processorName}</span> : null,
      icon: User,
      iconColor: 'text-indigo-500',
      emptyText: 'Not assigned'
    }
  ] : [];

  const statusOptions = Object.values(RequestStatus).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }));

  const isCustomerLinked = !!request?.customerId;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: MessageCircle,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-purple-500" />
                Request Details
              </CardTitle>
              <CardDescription>
                Complete information about this request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 dark:text-gray-200">Message</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{request?.message}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</h3>
                  
                  <div className="flex items-start">
                    <Mail className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a href={`mailto:${request?.email}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        {request?.email}
                      </a>
                    </div>
                  </div>
                  
                  {request?.phone && (
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <a href={`tel:${request.phone}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                          {request.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Request Information</h3>
                  
                  <div className="flex items-start">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Service</p>
                      <p className="text-sm">{request?.service}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="pt-4 border-t flex flex-wrap gap-2">
                {!isCustomerLinked && canConvert && (
                  <Button
                    variant="default"
                    onClick={() => setConvertDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convert to Customer
                  </Button>
                )}
                
                {canLink && (
                  <Button
                    variant="outline"
                    onClick={() => setLinkDialogOpen(true)}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {isCustomerLinked ? 'Change Customer' : 'Link to Customer'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-purple-500" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  {statusBadge}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {request && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-medium flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm font-medium flex items-center">
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {format(new Date(request.updatedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: MessageCircle,
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-purple-500" />
              Notes
            </CardTitle>
            <CardDescription>
              Internal notes and comments for this request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add note form */}
            <div>
              <h3 className="font-medium mb-4 dark:text-gray-200">Add Note</h3>
              <form onSubmit={handleNoteSubmit} className="flex flex-col space-y-2">
                <Textarea
                  placeholder="Add a note about this request..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                />
                <Button 
                  type="submit"
                  className="self-end mt-2" 
                  disabled={!noteText.trim() || isAddingNote}
                >
                  {isAddingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </form>
            </div>
            
            <Separator className="dark:bg-gray-700" />
            
            {/* Notes history */}
            <div>
              <h3 className="font-medium mb-4 dark:text-gray-200">Notes History</h3>
              {request?.notes && request.notes.length > 0 ? (
                <div className="space-y-4">
                  {request.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md dark:border dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium dark:text-gray-200">{note.userName}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="whitespace-pre-line dark:text-gray-300">{note.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Notes Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    No notes have been added to this request yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <>
      <DetailPageLayout
        title={request?.name || 'Request'}
        subtitle={request?.service}
        statusBadge={statusBadge}
        onBack={() => router.push('/dashboard/requests')}
        onEdit={canEdit && request ? openEditModal : undefined}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={handleDeleteRequest}
        currentStatus={request?.status}
        statusOptions={statusOptions}
        onStatusChange={handleStatusChange}
        changingStatus={changingStatus || isUpdatingStatus}
        avatar={{
          initials: getInitials(request?.name),
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700'
        }}
        profileInfo={profileInfo}
        tabs={tabs}
        defaultTab="overview"
        deleteTitle="Delete Request"
        deleteDescription={`Are you sure you want to delete the request from ${request?.name}? This action cannot be undone.`}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        isLoading={isLoading}
        error={isError ? 'Error loading request details' : undefined}
        maxWidth="7xl"
      />

      {/* Edit Request Modal */}
      {editModal.action?.type === 'edit' && request && (
        <FormModal
          isOpen={editModal.isOpen}
          onClose={editModal.closeModal}
          title="Edit Request"
          description={`Update request from ${request.name}`}
          isSubmitting={editModal.isSubmitting}
          error={editModal.error}
          success={editModal.success}
          size="lg"
          onSubmit={handleEditSubmit}
          onCancel={editModal.closeModal}
          submitLabel="Update Request"
        >
          <RequestFormFields
            formData={editFormData}
            onChange={(updates) => setEditFormData(prev => ({ ...prev, ...updates }))}
            errors={editFormErrors}
            disabled={editModal.isSubmitting}
            showStatus={true}
          />
        </FormModal>
      )}

      {/* Convert to Customer Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Customer</DialogTitle>
            <DialogDescription>
              Create a new customer from this contact request.
            </DialogDescription>
          </DialogHeader>
          <ConvertToCustomerForm
            request={request!}
            onClose={() => {
              setConvertDialogOpen(false);
              refetch?.();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Link to Customer Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCustomerLinked ? 'Change Linked Customer' : 'Link to Customer'}</DialogTitle>
            <DialogDescription>
              {isCustomerLinked 
                ? 'Change which customer this request is linked to.'
                : 'Link this request with an existing customer.'}
            </DialogDescription>
          </DialogHeader>
          <LinkToCustomerForm
            requestId={request?.id || 0}
            onClose={() => {
              setLinkDialogOpen(false);
              refetch?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestDetail;
