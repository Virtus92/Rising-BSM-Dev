/**
 * Utils for converting between different note representations
 * 
 * This utility handles the conversion between string notes and RequestNote objects.
 */

import { RequestNote } from '@/domain/entities/RequestNote';

/**
 * Convert string notes to RequestNote objects
 * 
 * @param notes String notes or null/undefined
 * @param userId Default user ID for the notes
 * @param requestId Request ID for the notes
 * @returns Array of RequestNote objects
 */
export function convertToRequestNotes(
  notes: string[] | null | undefined,
  userId: number = 0,
  requestId: number = 0
): RequestNote[] {
  if (!notes || !Array.isArray(notes)) {
    return [];
  }
  
  return notes.map((note, index) => {
    if (typeof note === 'string') {
      return new RequestNote({
        id: index, // Temporary ID
        requestId,
        userId,
        userName: 'System',
        text: note,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (note as RequestNote) {
      return note;
    } else if (typeof note === 'object' && note !== null) {
      // Handle case where it might be a plain object with RequestNote properties
      return new RequestNote({
        id: (note as any).id || index,
        requestId: (note as any).requestId || requestId,
        userId: (note as any).userId || userId,
        userName: (note as any).userName || 'System',
        text: (note as any).text || '',
        createdAt: (note as any).createdAt ? new Date((note as any).createdAt) : new Date(),
        updatedAt: (note as any).updatedAt ? new Date((note as any).updatedAt) : new Date()
      });
    }
    
    // Fallback for unknown types
    return new RequestNote({
      id: index,
      requestId,
      userId,
      userName: 'System',
      text: String(note),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
}

/**
 * Extract text content from RequestNote objects
 * 
 * @param notes RequestNote objects or strings
 * @returns Array of note text strings
 */
export function extractNoteText(notes: (RequestNote | string)[] | null | undefined): string[] {
  if (!notes || !Array.isArray(notes)) {
    return [];
  }
  
  return notes.map(note => {
    if (typeof note === 'string') {
      return note;
    } else if (note instanceof RequestNote) {
      return note.text;
    } else if (typeof note === 'object' && note !== null && 'text' in note) {
      return (note as any).text || '';
    }
    return String(note);
  });
}
