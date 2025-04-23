'use client';

import { useState, useEffect } from 'react';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, MessageSquare, User } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface CustomerNotesTabProps {
  customerId: number;
}

export const CustomerNotesTab: React.FC<CustomerNotesTabProps> = ({ customerId }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await CustomerService.getNotes(customerId);
      if (response.success && response.data) {
        setNotes(response.data);
      } else {
        setError(response.message || 'Failed to fetch customer notes');
      }
    } catch (err) {
      console.error('Error fetching customer notes:', err);
      setError('An unexpected error occurred while fetching notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchNotes();
    }
  }, [customerId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await CustomerService.addNote(customerId, newNote);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Note added successfully',
          variant: 'success',
        });
        setNewNote('');
        fetchNotes(); // Refresh notes
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to add note',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error adding note:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Customer Notes</h3>
        
        {/* Add Note Form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note about this customer..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={handleAddNote} 
            disabled={!newNote.trim() || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Add Note
          </Button>
        </div>
        
        {/* Notes List */}
        <div className="mt-6 space-y-4">
          {notes.length === 0 ? (
            <p className="text-muted-foreground italic">No notes available for this customer.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-4 border rounded-md bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {note.userName || 'System'}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {note.createdAt && formatDistance(new Date(note.createdAt), new Date(), { addSuffix: true })}
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm">{note.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}