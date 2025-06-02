/**
 * Debug helper for testing search and filter functionality
 */

// This file provides debugging utilities for search and filter functionality
// It can be imported in components to log filter state changes

export const debugFilters = {
  logFilterChange: (componentName: string, filters: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Filter Change:`, {
        timestamp: new Date().toISOString(),
        filters: JSON.stringify(filters, null, 2)
      });
    }
  },
  
  logSearchChange: (componentName: string, searchTerm: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Search Change:`, {
        timestamp: new Date().toISOString(),
        searchTerm,
        length: searchTerm.length
      });
    }
  },
  
  logApiCall: (componentName: string, url: string, params: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] API Call:`, {
        timestamp: new Date().toISOString(),
        url,
        params: JSON.stringify(params, null, 2)
      });
    }
  }
};
