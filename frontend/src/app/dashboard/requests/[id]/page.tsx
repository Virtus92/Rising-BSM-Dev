'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Clock, CornerDownRight, Check, X } from 'lucide-react';

interface RequestNote {
  id: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
}

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [notes, setNotes] = useState<RequestNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<string>('');
  const [sendingNote, setSendingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    async function loadRequest() {
      try {
        setLoading(true);
        
        // Simuliere API-Antwort mit Verzögerung
        setTimeout(() => {
          // Mock-Anfrage mit Notizen
          const mockRequest = {
            id: parseInt(params.id),
            name: 'Max Mustermann',
            email: 'max.mustermann@example.com',
            phone: '+49 123 456789',
            message: 'Ich bin an einer Website-Entwicklung interessiert. Können Sie mir ein Angebot erstellen? Ich möchte gerne eine moderne Website mit Responsive Design und Content-Management-System haben. Außerdem sollte die Website SEO-optimiert sein und über einen Blog-Bereich verfügen.',
            service: 'Website-Entwicklung',
            status: 'new',
            statusLabel: 'Neu',
            statusClass: 'text-blue-500 bg-blue-100',
            createdAt: '2023-11-15T10:23:45Z',
            updatedAt: '2023-11-15T10:23:45Z'
          };
          
          const mockNotes = [
            {
              id: 1,
              userId: 1,
              userName: 'Admin User',
              text: 'Anfrage eingegangen, wird bearbeitet.',
              createdAt: '2023-11-15T10:30:00Z'
            },
            {
              id: 2,
              userId: 2,
              userName: 'Max Mustermann',
              text: 'Kunde per E-Mail kontaktiert, warte auf Rückmeldung.',
              createdAt: '2023-11-15T11:15:22Z'
            }
          ];
          
          setRequest(mockRequest);
          setNotes(mockNotes);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error loading request details:', err);
        setError('Fehler beim Laden der Anfrage-Details. Bitte versuchen Sie es später erneut.');
        setLoading(false);
      }
    }
    
    loadRequest();
  }, [params.id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      return;
    }
    
    try {
      setSendingNote(true);
      
      // Simuliere API-Antwort mit Verzögerung
      setTimeout(() => {
        const newNoteObject: RequestNote = {
          id: notes.length + 1,
          userId: 1,
          userName: 'Admin User',
          text: newNote,
          createdAt: new Date().toISOString()
        };
        
        setNotes([...notes, newNoteObject]);
        setNewNote('');
        setSendingNote(false);
      }, 500);
    } catch (err) {
      console.error('Error adding note:', err);
      setSendingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (changingStatus) return;
    
    try {
      setChangingStatus(true);
      
      // Simuliere API-Antwort mit Verzögerung
      setTimeout(() => {
        const statusLabels: Record<string, string> = {
          'new': 'Neu',
          'in_progress': 'In Bearbeitung',
          'completed': 'Abgeschlossen',
          'cancelled': 'Abgebrochen'
        };
        
        const statusClasses: Record<string, string> = {
          'new': 'text-blue-500 bg-blue-100',
          'in_progress': 'text-yellow-500 bg-yellow-100',
          'completed': 'text-green-500 bg-green-100',
          'cancelled': 'text-red-500 bg-red-100'
        };
        
        setRequest({
          ...request,
          status: newStatus,
          statusLabel: statusLabels[newStatus],
          statusClass: statusClasses[newStatus]
        });
        
        // Füge automatisch eine Notiz hinzu
        const newNoteObject: RequestNote = {
          id: notes.length + 1,
          userId: 1,
          userName: 'Admin User',
          text: `Status auf "${statusLabels[newStatus]}" geändert.`,
          createdAt: new Date().toISOString()
        };
        
        setNotes([...notes, newNoteObject]);
        setChangingStatus(false);
      }, 500);
    } catch (err) {
      console.error('Error changing status:', err);
      setChangingStatus(false);
    }
  };

  // Formatierte Zeitanzeige
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zur Liste
        </button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <p className="text-gray-700 dark:text-gray-300">Anfrage nicht gefunden.</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück zur Liste
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header mit Zurück-Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anfrage Details</h1>
        </div>
        <div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.statusClass}`}>
            {request.statusLabel}
          </span>
        </div>
      </div>

      {/* Anfrage Details */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Anfrage von {request.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Kontaktinformationen</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a href={`mailto:${request.email}`} className="hover:underline">
                    {request.email}
                  </a>
                </div>
                {request.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a href={`tel:${request.phone}`} className="hover:underline">
                      {request.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Details</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Eingegangen am {formatDate(request.createdAt)}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Zuletzt aktualisiert am {formatDate(request.updatedAt)}</span>
                </div>
                {request.service && (
                  <div className="flex items-start text-gray-600 dark:text-gray-300 mt-2">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs px-2 py-1 rounded">
                      {request.service}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Nachricht</h3>
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                {request.message}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Status ändern</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusChange('new')}
                disabled={request.status === 'new' || changingStatus}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  request.status === 'new' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 cursor-default'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                } transition-colors disabled:opacity-50`}
              >
                Neu
              </button>
              <button
                onClick={() => handleStatusChange('in_progress')}
                disabled={request.status === 'in_progress' || changingStatus}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  request.status === 'in_progress' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 cursor-default'
                    : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30'
                } transition-colors disabled:opacity-50`}
              >
                In Bearbeitung
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={request.status === 'completed' || changingStatus}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  request.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 cursor-default'
                    : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                } transition-colors disabled:opacity-50`}
              >
                <span className="flex items-center"><Check className="h-3.5 w-3.5 mr-1" /> Abgeschlossen</span>
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={request.status === 'cancelled' || changingStatus}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  request.status === 'cancelled' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 cursor-default'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                } transition-colors disabled:opacity-50`}
              >
                <span className="flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Abgebrochen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notizen */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notizen
          </h2>
          
          <div className="space-y-4 mb-6">
            {notes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Noch keine Notizen vorhanden
              </p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-semibold text-sm">
                      {note.userName.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {note.userName}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line">
                        {note.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Neue Notiz hinzufügen */}
          <form onSubmit={handleAddNote}>
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-semibold text-sm">
                  A
                </div>
              </div>
              <div className="flex-grow">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Neue Notiz hinzufügen..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                  rows={3}
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingNote || !newNote.trim()}
                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingNote ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Speichern...
                      </>
                    ) : (
                      <>
                        <CornerDownRight className="h-4 w-4 mr-1" /> Hinzufügen
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
