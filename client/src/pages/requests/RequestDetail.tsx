import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { requestService } from '../../api/services/requestService';
import { customerService } from '../../api/services/customerService';
import { Inquiry } from '../../types';
import React from 'react';
import { ArrowLeft, User, Mail, Phone, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';

const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Inquiry | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        const data = await requestService.getById(parseInt(id));
        setRequest(data.request);
        console.log('Request state:', data.request); // Add this line
        setNotes(data.notes || []);
      } catch (err: any) {
        console.error('Error fetching request data:', err);
        setError(err.message || 'Failed to load request data');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [id]);

  const handleStatusChange = async (status: 'neu' | 'in_bearbeitung' | 'beantwortet' | 'geschlossen') => {
    try {
      if (!id || !request) return;
      
      await requestService.updateStatus(parseInt(id), status);
      
      // Refresh request data
      const data = await requestService.getById(parseInt(id));
      setRequest(data.request);
    } catch (err: any) {
      console.error('Error updating request status:', err);
      setError(err.message || 'Failed to update request status');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !id) return;
    
    setAddingNote(true);
    try {
      await requestService.addNote(parseInt(id), noteText);
      
      // Refresh request data
      const data = await requestService.getById(parseInt(id));
      setNotes(data.notes || []);
      setNoteText('');
    } catch (err: any) {
      console.error('Error adding note:', err);
      setError(err.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!request) return;
    
    // Navigate to new customer form with prefilled data
    navigate(`/dashboard/kunden/neu?name=${encodeURIComponent(request.name)}&email=${encodeURIComponent(request.email)}&phone=${encodeURIComponent(request.phone || '')}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
        <AlertTriangle className="inline-block mr-2" size={20} />
        {error}
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 mb-4">
        <AlertTriangle className="inline-block mr-2" size={20} />
        Anfrage nicht gefunden
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard/requests')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Anfrage von {request.name}
          </h1>
        </div>
        <div>
          <button
            onClick={handleCreateCustomer}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <User size={16} className="mr-2" />
            Kunde erstellen
          </button>
        </div>
      </div>

      {/* Request Information */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Anfrage Details</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Name:</span>
              <span className="font-medium">{request.name}</span>
            </div>
            
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">E-Mail:</span>
              <a href={`mailto:${request.email}`} className="text-primary-600 hover:text-primary-800">
                {request.email}
              </a>
            </div>
            
            {request.phone && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500 mr-2">Telefon:</span>
                <a href={`tel:${request.phone}`} className="text-primary-600 hover:text-primary-800">
                  {request.phone}
                </a>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-500 mr-2">Erstellt am:</span>
              <span>
                {request.formattedDate}
              </span>
            </div>
            
            <div className="md:col-span-2 flex items-start">
            <span className="text-gray-500 mr-2 mt-0.5">Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                request.statusInfo?.className === 'success' ? 'bg-green-100 text-green-800' :
                request.statusInfo?.className === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                request.statusInfo?.className === 'info' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.statusInfo?.label}
              </span>
            </div>
          </div>
          
          {request.service && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Betreff</h3>
              <p className="text-sm text-gray-700">{request.service}</p>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Nachricht</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-line">{request.message}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Status aktualisieren</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('neu')}
              disabled={request.status === 'neu'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                request.status === 'neu'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Neu
            </button>
            
            <button
              onClick={() => handleStatusChange('in_bearbeitung')}
              disabled={request.status === 'in_bearbeitung'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                request.status === 'in_bearbeitung'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              In Bearbeitung
            </button>
            
            <button
              onClick={() => handleStatusChange('beantwortet')}
              disabled={request.status === 'beantwortet'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                request.status === 'beantwortet'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              Beantwortet
            </button>
            
            <button
              onClick={() => handleStatusChange('geschlossen')}
              disabled={request.status === 'geschlossen'}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                request.status === 'geschlossen'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Geschlossen
            </button>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Notizen</h2>
        </div>
        <div className="px-6 py-5">
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="mb-6">
            <div className="mb-3">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Neue Notiz hinzufügen
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Notizen zur Anfrage eingeben..."
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingNote || !noteText.trim()}
                className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {addingNote ? 'Wird hinzugefügt...' : 'Notiz hinzufügen'}
                {!addingNote && <MessageSquare size={16} className="ml-2" />}
              </button>
            </div>
          </form>

          {/* Notes List */}
          {notes.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notes.map((note, index) => (
                <li key={index} className="py-4">
                  <div className="flex space-x-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">{note.user}</h3>
                        <p className="text-sm text-gray-500">{note.date}</p>
                      </div>
                      <p className="text-sm text-gray-500 whitespace-pre-line">{note.content}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>Keine Notizen vorhanden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;