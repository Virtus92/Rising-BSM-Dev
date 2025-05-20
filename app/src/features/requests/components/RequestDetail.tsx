import React, { useState } from 'react';
import { useRequest } from '../hooks/useRequest';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Mail,
  Phone,
  Clock,
  User,
  MessageCircle,
  UserPlus,
  LinkIcon,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  UserCheck,
  Edit,
} from 'lucide-react';
import { formatDate } from '@/features/notifications/components/utils/date-utils';
import { RequestStatusUpdateDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { ConvertToCustomerForm } from './ConvertToCustomerForm';
import { LinkToCustomerForm } from './LinkToCustomerForm';
import Link from 'next/link';

interface RequestDetailProps {
  id: number;
  onBack?: () => void;
}

/**
 * Component for displaying a contact request in detail
 */
export const RequestDetail: React.FC<RequestDetailProps> = ({ id, onBack }) => {
  const router = useRouter();
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
  } = useRequest(id);

  const [noteText, setNoteText] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>Error loading request details.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    addNote(noteText);
    setNoteText('');
  };

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    
    const data: RequestStatusUpdateDto = {
      status: newStatus as RequestStatus,
      note: statusNote.trim() || undefined,
    };
    
    updateStatus(data);
    setStatusDialogOpen(false);
    setNewStatus('');
    setStatusNote('');
  };
  
  const isCustomerLinked = !!request.customerId;

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <h1 className="text-2xl font-bold">Request Details</h1>
      </div>

      {/* Main card with base information */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-xl">{request.name}</CardTitle>
            <CardDescription>
              {request.service}
            </CardDescription>
          </div>
          <Badge 
            className={`${getStatusColor(request.status)} text-white`}
          >
            {request.statusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{request.email}</span>
              </div>
              {request.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{request.phone}</span>
                </div>
              )}
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Created: {formatDate(new Date(request.createdAt))}</span>
              </div>
            </div>
            <div className="space-y-2">
              {request.processorName ? (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Processor: {request.processorName}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                  <span className="text-amber-500">Not assigned</span>
                </div>
              )}
              {request.customerName ? (
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Customer: {' '}
                    <Link 
                      href={`/dashboard/customers/${request.customerId}`}
                      className="text-primary hover:underline"
                    >
                      {request.customerName}
                    </Link>
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-md bg-muted p-4 mt-4">
            <h3 className="font-medium mb-2">Message:</h3>
            <p className="whitespace-pre-line">{request.message}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 pt-2">
          {/* Edit Button */}
          <Link href={`/dashboard/requests/${request.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Request
            </Button>
          </Link>
          
          {/* Status Dialog */}
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Change Status</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleStatusUpdate}>
                <DialogHeader>
                  <DialogTitle>Change Status</DialogTitle>
                  <DialogDescription>
                    Update the status of this contact request.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Select
                    value={newStatus}
                    onValueChange={setNewStatus}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RequestStatus.NEW}>New</SelectItem>
                      <SelectItem value={RequestStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={RequestStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={RequestStatus.CANCELLED}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Note about status change (optional)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isUpdatingStatus || !newStatus}
                  >
                    {isUpdatingStatus && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Convert to Customer Button - only show if not linked */}
          {!isCustomerLinked && (
            <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convert to Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Convert to Customer</DialogTitle>
                  <DialogDescription>
                    Create a new customer from this contact request.
                  </DialogDescription>
                </DialogHeader>
                <ConvertToCustomerForm
                  request={request}
                  onClose={() => {
                    setConvertDialogOpen(false);
                    window.location.reload();
                  }}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Link to Customer Button - always show */}
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="h-4 w-4 mr-2" />
                {isCustomerLinked ? 'Change Customer' : 'Link to Customer'}
              </Button>
            </DialogTrigger>
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
                requestId={request.id}
                onClose={() => {
                  setLinkDialogOpen(false);
                  window.location.reload();
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Request</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the request.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    const success = await deleteRequest();
                    if (success) {
                      router.push('/dashboard/requests');
                    }
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      {/* Tabs for notes */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList>
          <TabsTrigger value="notes" className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
              <CardDescription>
                Internal notes for this contact request
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Notes List */}
              <div className="space-y-4 mb-6">
                {!request.notes || request.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No notes available.
                  </p>
                ) : (
                  request.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-md bg-muted">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {note.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(new Date(note.createdAt))}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-line">{note.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note */}
              <form onSubmit={handleNoteSubmit}>
                <Textarea
                  placeholder="Add new note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isAddingNote || !noteText.trim()}
                  >
                    {isAddingNote && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Note
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
