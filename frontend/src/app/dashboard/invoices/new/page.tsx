'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash, Send, Save } from 'lucide-react';
import Link from 'next/link';
import { createInvoice, getCustomers } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

// Typdefinitionen
interface Customer {
  id: number;
  name: string;
  email: string;
  company?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  
  // Formulardaten
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState<string>(getTodayString());
  const [dueDate, setDueDate] = useState<string>(getDefaultDueDate());
  const [items, setItems] = useState<InvoiceItem[]>([getEmptyItem()]);
  const [notes, setNotes] = useState<string>('');
  
  // Lade Kundendaten
  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        const response = await getCustomers();
        
        if (response.success && response.data) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
        toast({
          title: 'Fehler',
          description: 'Kundendaten konnten nicht geladen werden.',
          variant: 'error',
        });
      } finally {
        setLoadingCustomers(false);
      }
    }
    
    loadCustomers();
  }, [toast]);
  
  // Hilfsfunktionen für Datumsberechnung
  function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  
  function getDefaultDueDate() {
    const today = new Date();
    today.setDate(today.getDate() + 30); // 30 Tage Zahlungsziel standardmäßig
    return today.toISOString().split('T')[0];
  }
  
  // Hilfsfunktion für leere Rechnungsposition
  function getEmptyItem(): InvoiceItem {
    return {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      tax: 19, // Standard-MwSt in Deutschland
      total: 0,
    };
  }
  
  // Rechnungsposition hinzufügen
  const addItem = () => {
    setItems([...items, getEmptyItem()]);
  };
  
  // Rechnungsposition entfernen
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      toast({
        title: 'Hinweis',
        description: 'Mindestens eine Position muss vorhanden sein.',
        variant: 'warning',
      });
    }
  };
  
  // Rechnungsposition aktualisieren
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Neuberechnung des Gesamtbetrags
        if (field === 'quantity' || field === 'unitPrice' || field === 'tax') {
          const quantity = field === 'quantity' ? value : item.quantity;
          const unitPrice = field === 'unitPrice' ? value : item.unitPrice;
          const netTotal = quantity * unitPrice;
          const taxAmount = netTotal * (item.tax / 100);
          updatedItem.total = netTotal + taxAmount;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };
  
  // Gesamtsummen berechnen
  const calculateSummary = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = items.reduce((sum, item) => {
      const itemNet = item.quantity * item.unitPrice;
      return sum + (itemNet * (item.tax / 100));
    }, 0);
    const total = subtotal + taxTotal;
    
    return { subtotal, taxTotal, total };
  };
  
  // Formatieren von Währungsbeträgen
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  
  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Kunden aus.',
        variant: 'error',
      });
      return;
    }
    
    if (items.some(item => !item.description || item.quantity <= 0)) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Positionsdaten korrekt aus.',
        variant: 'error',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { total } = calculateSummary();
      
      const invoiceData = {
        customerId,
        issueDate,
        dueDate,
        items: items.map(({ id, ...item }) => item), // ID entfernen, da temporär
        notes,
        status: 'draft',
        amount: total,
      };
      
      const response = await createInvoice(invoiceData);
      
      if (response.success) {
        toast({
          title: 'Erfolg',
          description: 'Rechnung wurde erfolgreich erstellt.',
          variant: 'success',
        });
        router.push('/dashboard/invoices');
      } else {
        throw new Error(response.message || 'Fehler beim Erstellen der Rechnung');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Fehler',
        description: 'Die Rechnung konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Berechnung der Summen
  const { subtotal, taxTotal, total } = calculateSummary();
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link 
            href="/dashboard/invoices" 
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Neue Rechnung</h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={() => router.push('/dashboard/invoices')}
          >
            Abbrechen
          </button>
          
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            onClick={() => {
              toast({
                title: 'Funktion nicht verfügbar',
                description: 'Diese Funktion ist noch nicht implementiert.',
                variant: 'warning',
              });
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            Speichern & Senden
          </button>
          
          <button
            type="submit"
            form="invoice-form"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      </div>
      
      <form id="invoice-form" onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          {/* Kopfbereich */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kunde <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={customerId || ''}
                  onChange={(e) => setCustomerId(parseInt(e.target.value) || null)}
                  required
                  disabled={loadingCustomers}
                >
                  <option value="">Kunden auswählen</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company ? `${customer.company} (${customer.name})` : customer.name}
                    </option>
                  ))}
                </select>
                {loadingCustomers && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Kundendaten werden geladen...
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ausstellungsdatum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fälligkeitsdatum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Rechnungspositionen */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Rechnungspositionen</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Beschreibung
                    </th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Menge
                    </th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Einzelpreis
                    </th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      MwSt. %
                    </th>
                    <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Gesamt
                    </th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Artikelbezeichnung"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          required
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                            €
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-28 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="w-24 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                          required
                        >
                          <option value="0">0%</option>
                          <option value="7">7%</option>
                          <option value="19">19%</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-right text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              type="button"
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={addItem}
            >
              <Plus className="w-4 h-4 mr-2" />
              Position hinzufügen
            </button>
          </div>
          
          {/* Summen und Notizen */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notizen / Zahlungsinformationen
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="z.B. Zahlungsbedingungen, Bankverbindung oder andere Hinweise"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="border rounded-md border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Zwischensumme:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">MwSt.:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(taxTotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-base font-bold border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <span className="text-gray-900 dark:text-white">Gesamtbetrag:</span>
                  <span className="text-green-600 dark:text-green-500">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
