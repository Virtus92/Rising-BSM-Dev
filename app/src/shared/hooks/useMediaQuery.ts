'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for detecting media query matches
 * 
 * @param query - CSS media query
 * @returns Whether the media query matches
 */
export const useMediaQuery = (query: string): boolean => {
  // Default to false on server or during initial render
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is available (client-side only)
    if (typeof window !== 'undefined') {
      // Create media query list
      const mediaQuery = window.matchMedia(query);
      
      // Set initial value
      setMatches(mediaQuery.matches);

      // Define event listener that updates state
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Add event listener
      // Using deprecated `addListener` for wider browser support
      // but using `addEventListener` if available
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // @ts-ignore - For older browsers
        mediaQuery.addListener(handleChange);
      }

      // Cleanup function to remove listener
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          // @ts-ignore - For older browsers
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, [query]);

  return matches;
};

/**
 * Hook for detecting mobile devices
 * 
 * @param breakpoint - Screen width breakpoint for mobile (default 768px)
 * @returns Whether the device is considered mobile
 */
export const useMobileDetection = (breakpoint = 768): boolean => {
  return useMediaQuery(`(max-width: ${breakpoint}px)`);
};

export default useMediaQuery;
