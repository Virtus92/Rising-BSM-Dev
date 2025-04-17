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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
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
  Calendar,
  Clock,
  User,
  MessageCircle,
  UserPlus,
  LinkIcon,
  Trash2,
  CheckCircle,
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
import { CreateAppointmentForm } from './CreateAppointmentForm';
import Link from 'next/link';

interface RequestDetailProps {
  id: number;
  onBack?: () => void;
}

/**
 * Komponente zur Anzeige einer Kontaktanfrage im Detail
 */
export const RequestDetail: React.FC<RequestDetailProps> = ({ id, onBack }) => {
  const router = useRouter();
  const {
    request,
    isLoading,
    isError,
    updateStatus,
    assignRequest,
    addNote,
    deleteRequest,
    isUpdatingStatus,
    isAddingNote,
    isDeleting,
  } = useRequest(id);

  const [noteText, setNoteText] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
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
        <p>Fehler beim Laden der Kontaktanfrage.</p>
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

  return (
    <div className="space-y-6">
      {/* Zurück-Button und Header */}
      <div className="flex items-center">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
        )}
        <h1 className="text-2xl font-bold">Kontaktanfrage Details</h1>
      </div>

      {/* Hauptkarte mit Basisinformationen */}
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
                <span>Erstellt: {formatDate(new Date(request.createdAt))}</span>
              </div>
            </div>
            <div className="space-y-2">
              {request.processorName ? (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Bearbeiter: {request.processorName}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                  <span className="text-amber-500">Nicht zugewiesen</span>
                </div>
              )}
              {request.customerName && (
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Kunde: {' '}
                    <Link 
                      href={`/dashboard/customers/${request.customerId}`}
                      className="text-primary hover:underline"
                    >
                      {request.customerName}
                    </Link>
                  </span>
                </div>
              )}
              {request.appointmentTitle && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    Termin: {' '}
                    <Link 
                      href={`/dashboard/appointments/${request.appointmentId}`}
                      className="text-primary hover:underline"
                    >
                      {request.appointmentTitle}
                    </Link>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md bg-muted p-4 mt-4">
            <h3 className="font-medium mb-2">Nachricht:</h3>
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
          {/* Status-Dialog */}
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Status ändern</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleStatusUpdate}>
                <DialogHeader>
                  <DialogTitle>Status ändern</DialogTitle>
                  <DialogDescription>
                    Aktualisieren Sie den Status dieser Kontaktanfrage.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Select
                    value={newStatus}
                    onValueChange={setNewStatus}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RequestStatus.NEW}>Neu</SelectItem>
                      <SelectItem value={RequestStatus.IN_PROGRESS}>In Bearbeitung</SelectItem>
                      <SelectItem value={RequestStatus.COMPLETED}>Abgeschlossen</SelectItem>
                      <SelectItem value={RequestStatus.CANCELLED}>Abgebrochen</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Notiz zur Statusänderung (optional)"
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
                    Speichern
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Konvertieren/Verknüpfen/Termin-Buttons */}
          <TooltipProvider>
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Zu Kunde konvertieren
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Diese Anfrage in einen neuen Kunden umwandeln
                </TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Zu Kunde konvertieren</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie einen neuen Kunden aus dieser Kontaktanfrage.
                  </DialogDescription>
                </DialogHeader>
                <ConvertToCustomerForm
                  request={request}
                  onClose={() => document.querySelector('dialog')?.close()}
                />
              </DialogContent>
            </Dialog>
          </TooltipProvider>

          <TooltipProvider>
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Mit Kunde verknüpfen
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Mit existierendem Kunden verknüpfen
                </TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Mit Kunde verknüpfen</DialogTitle>
                  <DialogDescription>
                    Verknüpfen Sie diese Anfrage mit einem bestehenden Kunden.
                  </DialogDescription>
                </DialogHeader>
                <LinkToCustomerForm
                  requestId={request.id}
                  onClose={() => document.querySelector('dialog')?.close()}
                />
              </DialogContent>
            </Dialog>
          </TooltipProvider>

          <TooltipProvider>
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Termin erstellen
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Termin für diese Anfrage erstellen
                </TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Termin erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie einen Termin für diese Kontaktanfrage.
                  </DialogDescription>
                </DialogHeader>
                <CreateAppointmentForm
                  request={request}
                  onClose={() => document.querySelector('dialog')?.close()}
                />
              </DialogContent>
            </Dialog>
          </TooltipProvider>

          {/* Löschen-Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie diese Kontaktanfrage wirklich löschen? 
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
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
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      {/* Tabs für Notizen und weitere Infos */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList>
          <TabsTrigger value="notes" className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Notizen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notizen</CardTitle>
              <CardDescription>
                Interne Notizen zu dieser Kontaktanfrage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Notizen Liste */}
              <div className="space-y-4 mb-6">
                {request.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Notizen vorhanden.
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

              {/* Notiz hinzufügen */}
              <form onSubmit={handleNoteSubmit}>
                <Textarea
                  placeholder="Neue Notiz hinzufügen..."
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
                    Notiz hinzufügen
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
