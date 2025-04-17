import { useState } from 'react';
import { MessageSquare, User, Loader2, RefreshCw, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { useCustomerNotes } from '../hooks/useCustomerNotes';
import { Separator } from '@/shared/components/ui/separator';
import { formatDate } from '@/shared/utils/date-utils';

interface CustomerNotesTabProps {
  customerId: number;
  canEdit: boolean;
}

export const CustomerNotesTab: React.FC<CustomerNotesTabProps> = ({ customerId, canEdit }) => {
  const [noteText, setNoteText] = useState('');
  const { 
    notes, 
    isLoading, 
    error, 
    isAddingNote, 
    addNote, 
    refreshNotes 
  } = useCustomerNotes(customerId);

  // Debug logs for troubleshooting
  console.log('Notes state:', { 
    customerId,
    notesCount: notes?.length || 0, 
    notes: notes || [],
    isLoading,
    error
  });

  // Helper function to get the actual text content from a note
  const getNoteText = (note: any): string => {
    // Handle case where text is a nested object with text property
    if (note.text && typeof note.text === 'object' && note.text.text) {
      return note.text.text;
    }
    // Handle case where text is directly in the details field
    if (note.details) {
      return note.details;
    }
    // Handle case where text is a direct string
    if (typeof note.text === 'string') {
      return note.text;
    }
    // Fallback
    return 'Note text unavailable';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    console.log('Submitting note:', noteText);
    const success = await addNote(noteText);
    console.log('Note submission result:', success);
    
    if (success) {
      setNoteText('');
    }
  };

  const handleManualRefresh = () => {
    console.log('Manually refreshing notes');
    refreshNotes(true); // Force refresh with cache busting
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
          Customer Notes
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span>Communication history and internal notes about this customer</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {canEdit && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this customer..."
              className="min-h-[100px]"
              disabled={isAddingNote}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isAddingNote || !noteText.trim()}>
                {isAddingNote ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Add Note
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        
        {canEdit && notes.length > 0 && <Separator />}
        
        {/* Notes List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-center">
            <p>Error loading notes: {error}</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Notes Available</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              {canEdit 
                ? "Add the first note about this customer using the form above." 
                : "This customer doesn't have any notes yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md dark:border dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium dark:text-gray-200">{note.userName || 'User'}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(note.createdAt)}</span>
                </div>
                <p className="whitespace-pre-line dark:text-gray-300">{getNoteText(note)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {notes.length > 0 && (
        <CardFooter className="bg-gray-50 dark:bg-gray-800/50 flex justify-center border-t py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};