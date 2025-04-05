'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectList from './components/ProjectList';
import { getProjects } from '@/lib/api';
import { ApiResponse, Project as ApiProject, PaginatedList } from '@/lib/api/types';

// Type from ProjectList component
interface Project {
  id: number;
  title: string;
  customerId?: number;
  customerName?: string;
  serviceId?: number;
  serviceName?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
}

// Interface to match what ProjectList expects
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function ProjectsContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectsData, setProjectsData] = useState<PaginatedList<ApiProject> | null>(null);
  
  // Transformed data for ProjectList component
  const transformedData = projectsData && projectsData.items ? {
    projects: projectsData.items.map(item => ({
      id: item.id,
      title: item.title,
      customerId: item.customerId,
      customerName: item.customerName,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      status: item.status,
      startDate: item.startDate,
      endDate: item.endDate,
      amount: item.amount
    })),
    pagination: {
      total: projectsData.pagination.totalRecords,
      page: projectsData.pagination.current,
      limit: projectsData.pagination.limit,
      pages: Math.ceil(projectsData.pagination.totalRecords / projectsData.pagination.limit)
    }
  } : undefined;
  
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
        
        const response = await getProjects<PaginatedList<ApiProject>>(params);
        
        if (response.success && response.data) {
          setProjectsData(response.data);
        } else {
          setError('Error loading project data');
        }
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Error loading project data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, [page, limit, status, customerId]);

  const updateUrlParams = (params: Record<string, any>) => {
    const newParams = new URLSearchParams();
    
    // Keep current parameters
    const currentParams = searchParams || new URLSearchParams();
    for (const [key, value] of Array.from(currentParams.entries())) {
      if (!(key in params)) {
        newParams.append(key, value);
      }
    }
    
    // Add new parameters
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
    // Reset page when filters change
    updateUrlParams({ ...filters, page: 1 });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Management</h1>
      </div>
      
      <ProjectList 
        initialData={transformedData}
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