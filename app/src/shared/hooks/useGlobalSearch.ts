'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for integrating global search with list pages
 * 
 * This hook provides a way to connect the header search functionality
 * with the filtering functionality of list pages
 */
export function useGlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  
  /**
   * Perform a global search based on the current context
   */
  const performGlobalSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      console.log('Global search: Empty search term, skipping');
      return;
    }
    
    // Determine the current context based on pathname
    const pathSegments = pathname.split('/').filter(Boolean);
    const currentSection = pathSegments[1]; // After 'dashboard'
    
    console.log('Global search: Analyzing pathname', { pathname, pathSegments, currentSection });
    
    // Build search URL based on current section
    let searchUrl = '';
    
    switch (currentSection) {
      case 'customers':
        searchUrl = `/dashboard/customers?search=${encodeURIComponent(searchTerm)}`;
        break;
        
      case 'appointments':
        searchUrl = `/dashboard/appointments?search=${encodeURIComponent(searchTerm)}`;
        break;
        
      case 'requests':
        searchUrl = `/dashboard/requests?search=${encodeURIComponent(searchTerm)}`;
        break;
        
      case 'users':
        searchUrl = `/dashboard/users?search=${encodeURIComponent(searchTerm)}`;
        break;
        
      default:
        // If not on a specific section, default to customers
        searchUrl = `/dashboard/customers?search=${encodeURIComponent(searchTerm)}`;
        console.log('Global search: Using default section (customers)');
        break;
    }
    
    console.log('Global search: Navigating to search URL', { searchUrl, searchTerm });
    
    // Navigate to the search URL
    router.push(searchUrl);
  }, [pathname, router]);
  
  /**
   * Clear search from the current URL
   */
  const clearSearch = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    router.push(url.pathname + url.search);
  }, [router]);
  
  /**
   * Get current search term from URL
   */
  const getCurrentSearchTerm = useCallback(() => {
    if (typeof window === 'undefined') return '';
    
    const url = new URL(window.location.href);
    return url.searchParams.get('search') || '';
  }, []);
  
  return {
    performGlobalSearch,
    clearSearch,
    getCurrentSearchTerm
  };
}
