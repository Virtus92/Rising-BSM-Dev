'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

/**
 * Props for the Dashboard Layout
 */
interface DashboardLayoutProps {
  /**
   * Child elements to display in the main area
   */
  children: ReactNode;
}

/**
 * Dashboard Layout Component
 * 
 * Provides a layout with header and sidebar for the dashboard.
 * Protects dashboard pages from unauthorized access.
 */
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simple mounting effect
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  // Listen for window resizing
  useEffect(() => {
    const handleResize = () => {
      // Close sidebar on small screens when window is resized
      if (window.innerWidth >= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Show loading indicator during mounting
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader setSidebarOpen={setSidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop - always visible */}
        <div className="hidden md:block md:w-64 md:flex-shrink-0">
          <DashboardSidebar />
        </div>
        
        {/* Mobile Sidebar - Only visible when toggled */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-80 max-w-[80%] flex flex-col bg-card shadow-lg">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Rising BSM</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <DashboardSidebar />
              </div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
