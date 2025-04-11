'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
// Auth is now handled by the parent component
import { getLogger } from '@/infrastructure/common/logging';

/**
 * Props für das Dashboard-Layout
 */
interface DashboardLayoutProps {
  /**
   * Kindelemente, die im Hauptbereich angezeigt werden sollen
   */
  children: ReactNode;
}

/**
 * Dashboard Layout Komponente
 * 
 * Stellt ein Layout mit Header und Sidebar für das Dashboard bereit.
 * Schützt die Dashboard-Seiten vor unautorisierten Zugriffen.
 */
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Simple mounting effect without auth check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Zeige Ladeindikator während des Mountings
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
      <DashboardHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
