'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectList from './components/ProjectList';
import { getProjects } from '@/lib/api';

function ProjectsContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectsData, setProjectsData] = useState<any>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const page = parseInt(searchParams?.get('page') || '1');
  const limit = parseInt(searchParams?.get('limit') || '10');
  const status = searchParams?.get('status') || 'all';
  const customerId = searchParams?.get('customerId') || '';

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, any> = {
          page,
          limit
        };
        
        if (status !== 'all') params.status = status;
        if (customerId) params.customerId = customerId;
        
        const response = await getProjects(params);
        
        if (response.success) {
          setProjectsData(response.data);
        } else {
          setError('Fehler beim Laden der Projektdaten');
        }
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Fehler beim Laden der Projektdaten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, [page, limit, status, customerId]);

  const updateUrlParams = (params: Record<string, any>) => {
    const newParams = new URLSearchParams();
    
    // Aktuelle Parameter beibehalten
    const currentParams = searchParams || new URLSearchParams();
    for (const [key, value] of Array.from(currentParams.entries())) {
      if (!(key in params)) {
        newParams.append(key, value);
      }
    }
    
    // Neue Parameter hinzufügen
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        newParams.append(key, String(value));
      }
    }
    
    router.push(`/dashboard/projects?${newParams.toString()}`);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projektverwaltung</h1>
      </div>
      
      <ProjectList 
        initialData={projectsData}
        loading={loading}
        error={error}
        onPageChange={handlePageChange}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}

// Wrap the component that uses useSearchParams in a Suspense boundary
export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}