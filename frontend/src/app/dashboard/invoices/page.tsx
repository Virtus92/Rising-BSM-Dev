'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getInvoices } from '@/lib/api';
import { PlusCircle, Search, Filter, FileText, ArrowUpDown, Check, Eye, Trash, Send } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

// Typdefinition für Rechnungen
interface Invoice {
  id: number;
  invoiceNumber: string;
  customer: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  
  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoading(true);
        const response = await getInvoices();
        
        if (response.success && response.data) {
          setInvoices(response.data);
        } else {
          setError(response.message || 'Fehler beim Laden der Rechnungen');
        }
      } catch (err) {
        console.error('Error loading invoices:', err);
        setError('Fehler beim Laden der Rechnungen. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadInvoices();
  }, []);
  
  // Formatiere Betrag als Währung
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  // Formatiere Datum 
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };
  
  // Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Entwurf
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Gesendet
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <Check className="w-3 h-3 mr-1" /> Bezahlt
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Überfällig
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Storniert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Unbekannt
          </span>
        );
    }
  };
  
  // Filterung nach Suchbegriff und Status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sortierung
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'invoiceNumber':
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
        break;
      case 'customer':
        comparison = a.customer.localeCompare(b.customer);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'issueDate':
        comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        break;
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      default:
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Sortierungslogik
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Lade-Indikator
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/4 mb-6 rounded"></div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex-1 mb-4 md:mb-0 md:mr-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 w-full rounded"></div>
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 w-32 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 w-32 rounded"></div>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 w-full"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 w-full border-t border-gray-200 dark:border-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Fehler-Anzeige
  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Rechnungen</h1>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            className="mt-2 text-red-700 dark:text-red-400 underline"
            onClick={() => window.location.reload()}
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Rechnungen</h1>
        <Link
          href="/dashboard/invoices/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-md transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Neue Rechnung
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex-1 mb-4 md:mb-0 md:mr-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Suche nach Rechnungsnummer oder Kunde..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <select
                className="appearance-none pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Alle Status</option>
                <option value="draft">Entwurf</option>
                <option value="sent">Gesendet</option>
                <option value="paid">Bezahlt</option>
                <option value="overdue">Überfällig</option>
                <option value="cancelled">Storniert</option>
              </select>
              <Filter className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>
        
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Keine Rechnungen gefunden</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' ? 
                'Keine Rechnungen entsprechen den Filterkriterien.' : 
                'Erstellen Sie Ihre erste Rechnung, um loszulegen.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/invoices/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Neue Rechnung
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('invoiceNumber')}
                  >
                    <div className="flex items-center">
                      <span>Rechnungsnr.</span>
                      {sortField === 'invoiceNumber' && (
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center">
                      <span>Kunde</span>
                      {sortField === 'customer' && (
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      <span>Betrag</span>
                      {sortField === 'amount' && (
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('issueDate')}
                  >
                    <div className="flex items-center">
                      <span>Ausstellungsdatum</span>
                      {sortField === 'issueDate' && (
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center">
                      <span>Fälligkeitsdatum</span>
                      {sortField === 'dueDate' && (
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {invoice.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Anzeigen"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        
                        {invoice.status === 'draft' && (
                          <button
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Senden"
                            onClick={() => {
                              toast({
                                title: "Funktion nicht verfügbar",
                                description: "Diese Funktion ist noch nicht implementiert.",
                                variant: "warning"
                              });
                            }}
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                        
                        <button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Löschen"
                          onClick={() => {
                            toast({
                              title: "Funktion nicht verfügbar",
                              description: "Diese Funktion ist noch nicht implementiert.",
                              variant: "warning"
                            });
                          }}
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}