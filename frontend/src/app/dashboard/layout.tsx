'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardHeader from './components/DashboardHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Debug-Informationen
  useEffect(() => {
    console.log('Dashboard Auth Status:', { isAuthenticated, loading });
  }, [isAuthenticated, loading]);

  // Zusätzlicher Client-Side-Schutz für das Dashboard
  useEffect(() => {
    // Warten, bis der Auth-Status geladen ist, um Flackern zu vermeiden
    if (!loading && !isAuthenticated) {
      console.log('Nicht authentifiziert, leite um zu Login...');
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Ladeanzeige anzeigen, während der Auth-Status geprüft wird
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-500"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Lädt...</p>
        </div>
      </div>
    );
  }

  // Nur den Inhalt anzeigen, wenn der Benutzer authentifiziert ist
  // Die Middleware sollte unauthorized Benutzer bereits umleiten,
  // dies ist ein zusätzlicher Schutz auf Client-Seite
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}