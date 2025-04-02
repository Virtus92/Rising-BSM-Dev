'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerList from './components/CustomerList';
import { getCustomers } from '@/lib/api';

function CustomersContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customersData, setCustomersData] = useState<any>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const page = parseInt(searchParams?.get('page') || '1');
  const limit = parseInt(searchParams?.get('limit') || '10');
  const status = searchParams?.get('status') || 'all';
  const type = searchParams?.get('type') || 'all';
  const search = searchParams?.get('search') || '';

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, any> = {
          page,
          limit
        };
        
        if (search) params.search = search;
        if (status !== 'all') params.status = status;
        if (type !== 'all') params.type = type;
        
        const response = await getCustomers(params);
        
        if (response.success) {
          setCustomersData(response.data);
        } else {
          setError('Fehler beim Laden der Kundendaten');
        }
      } catch (err) {
        console.error('Error loading customers:', err);
        setError('Fehler beim Laden der Kundendaten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadCustomers();
  }, [page, limit, status, type, search]);

  const updateUrlParams = (params: Record<string, any>) => {
    const newParams = new URLSearchParams();
    
    // Aktuelle Parameter beibehalten
    if (searchParams) {
      for (const [key, value] of Array.from(searchParams.entries())) {
        if (!(key in params)) {
          newParams.append(key, value);
        }
      }
    }
    
    // Neue Parameter hinzufügen
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        newParams.append(key, String(value));
      }
    }
    
    router.push(`/dashboard/customers?${newParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    // Seite zurücksetzen, wenn Filter geändert werden
    updateUrlParams({ ...filters, page: 1 });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kundenverwaltung</h1>
      </div>
      
      <CustomerList 
        initialData={customersData}
        loading={loading}
        error={error}
        onPageChange={handlePageChange}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}

// Wrap the component that uses useSearchParams in a Suspense boundary
export default function CustomersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomersContent />
    </Suspense>
  );
}