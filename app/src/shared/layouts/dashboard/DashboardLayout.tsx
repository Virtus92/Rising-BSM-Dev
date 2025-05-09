'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHeader from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { X } from 'lucide-react';

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
 * Modern Dashboard Layout Component
 * 
 * Provides a layout with header and sidebar for the dashboard.
 * Features responsive design, animations, and modern styling.
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
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Show loading indicator during mounting
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900"></div>
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <DashboardHeader setSidebarOpen={setSidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop - always visible */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16">
          <DashboardSidebar />
        </div>
        
        {/* Mobile Sidebar - Only visible when toggled */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              
              {/* Sidebar */}
              <motion.div 
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 w-72 max-w-[90vw] h-screen lg:hidden"
              >
                <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-xl">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard</h2>
                    <button 
                      type="button"
                      className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setSidebarOpen(false)}
                      aria-label="Close sidebar"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    <DashboardSidebar />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {/* Page content wrapper */}
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
