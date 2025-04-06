'use client';

import { useState } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  title: string;
  description: string;
  currentStatus: string;
  newStatus: string;
  allowNote?: boolean;
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  currentStatus,
  newStatus,
  allowNote = true
}: StatusChangeModalProps) {
  const [note, setNote] = useState('');
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    onConfirm(note);
    setNote('');
  };
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'new': return 'Neu';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'completed': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              </div>
              
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                  {title}
                </h3>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                  
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-sm">
                      Von: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
                        {getStatusText(currentStatus)}
                      </span>
                    </div>
                    <div className="text-sm">
                      Zu: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(newStatus)}`}>
                        {getStatusText(newStatus)}
                      </span>
                    </div>
                  </div>
                  
                  {allowNote && (
                    <div className="mt-4">
                      <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notiz (optional)
                      </label>
                      <textarea
                        id="note"
                        name="note"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-sm"
                        placeholder="Geben Sie hier einen Grund oder eine Information zur Statusänderung ein..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleConfirm}
            >
              <Check className="h-4 w-4 mr-2" />
              Bestätigen
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
