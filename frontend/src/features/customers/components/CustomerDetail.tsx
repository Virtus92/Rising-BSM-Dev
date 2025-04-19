'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2, Mail, Phone, MapPin, Building, Calendar, Tag, ArrowLeft, MessageSquare, FileText } from 'lucide-react';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { useCustomer } from '@/features/customers/hooks/useCustomer';
import { useToast } from '@/shared/hooks/useToast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { CustomerAppointmentsTab } from './CustomerAppointmentsTab';
import { NotesTab } from './NotesTab';

interface CustomerDetailProps {
  customerId: string | number;
  onClose?: () => void;
}

/**
 * DetailKomponente für einen Kunden
 * 
 * Zeigt alle Details eines Kunden an und bietet Optionen zum Bearbeiten und Löschen
 */
export default function CustomerDetail({ customerId, onClose }: CustomerDetailProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const { 
    customer, 
    loading, 
    error, 
    deleteCustomer 
  } = useCustomer(customerId);

  // Handler für das Löschen eines Kunden
  const handleDelete = async () => {
    try {
      const success = await deleteCustomer();
      
      if (success) {
        toast({
          title: 'Erfolg',
          description: 'Kunde wurde erfolgreich gelöscht',
          variant: 'success'
        });
        
        // Nach dem Löschen zur Kundenliste zurückkehren
        if (onClose) {
          onClose();
        } else {
          router.push('/dashboard/customers');
        }
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Beim Löschen des Kunden ist ein Fehler aufgetreten',
        variant: 'error'
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p className="text-red-700 dark:text-red-400">
          {error || 'Kunde konnte nicht geladen werden'}
        </p>
        <button 
          className="mt-2 text-red-700 dark:text-red-400 font-medium underline"
          onClick={() => window.location.reload()}
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Status-Badge mit entsprechender Farbe
  const renderStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'active':
        return (
          <span className={`${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`}>
            Aktiv
          </span>
        );
      case 'inactive':
        return (
          <span className={`${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`}>
            Inaktiv
          </span>
        );
      case 'deleted':
        return (
          <span className={`${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`}>
            Gelöscht
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400`}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* Header mit Aktionen */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          {onClose && (
            <button 
              onClick={onClose}
              className="mr-2 p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Kundendetails
          </h2>
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/customers/${customer.id}/edit`}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 inline-flex items-center"
          >
            <Edit className="h-5 w-5" />
            <span className="sr-only">Bearbeiten</span>
          </Link>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-md text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center"
          >
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Löschen</span>
          </button>
        </div>
      </div>

      {/* Kundendetails */}
      <div className="px-6 py-4">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
            {customer.companyName && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{customer.companyName}</p>
            )}
          </div>
          <div className="mt-2 md:mt-0">
            {renderStatusBadge(customer.status)}
            {customer.type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 ml-2">
                {customer.type === 'business' ? 'Geschäftskunde' : 'Privatkunde'}
              </span>
            )}
          </div>
        </div>

        {/* Kontaktdaten */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Kontaktdaten</h3>
            <ul className="space-y-2">
              {customer.email && (
                <li className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">E-Mail</p>
                    <a href={`mailto:${customer.email}`} className="text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-500">{customer.email}</a>
                  </div>
                </li>
              )}
              {customer.phone && (
                <li className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Telefon</p>
                    <a href={`tel:${customer.phone}`} className="text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-500">{customer.phone}</a>
                  </div>
                </li>
              )}
              {(customer.address || customer.city || customer.zipCode || customer.country) && (
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Adresse</p>
                    <address className="not-italic text-gray-900 dark:text-white">
                      {customer.address && <p>{customer.address}</p>}
                      {(customer.zipCode || customer.city) && (
                        <p>{customer.zipCode && `${customer.zipCode} `}{customer.city}</p>
                      )}
                      {customer.country && <p>{customer.country}</p>}
                    </address>
                  </div>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Weitere Informationen</h3>
            <ul className="space-y-2">
              {customer.vatNumber && (
                <li className="flex items-start">
                  <Building className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">UID/USt-ID</p>
                    <p className="text-gray-900 dark:text-white">{customer.vatNumber}</p>
                  </div>
                </li>
              )}
              {customer.createdAt && (
                <li className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Kunde seit</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(customer.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </li>
              )}
              {customer.newsletter !== undefined && (
                <li className="flex items-start">
                  <Tag className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Newsletter</p>
                    <p className="text-gray-900 dark:text-white">
                      {customer.newsletter ? 'Abonniert' : 'Nicht abonniert'}
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Notizen */}
        {customer.notes && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Notizen</h3>
            <div className="bg-gray-50 dark:bg-slate-700/30 rounded-md p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{customer.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs for customer data */}
      <div className="mt-6">
        <Tabs defaultValue="info" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="mb-2 flex w-full justify-start md:justify-center flex-nowrap">
              <TabsTrigger value="info" className="min-w-max">
                <FileText className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Information</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="min-w-max">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Appointments</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="min-w-max">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Notes</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="info" className="mt-2">
            {/* Customer information is shown by default */}
          </TabsContent>
          
          <TabsContent value="appointments" className="mt-2 px-4">
            <CustomerAppointmentsTab customerId={parseInt(String(customerId))} />
          </TabsContent>
          
          <TabsContent value="notes" className="mt-2 px-4">
            <NotesTab customerId={parseInt(String(customerId))} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Löschen-Bestätigungsdialog */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Kunden löschen
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sind Sie sicher, dass Sie diesen Kunden löschen möchten? Alle zugehörigen Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Löschen
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}