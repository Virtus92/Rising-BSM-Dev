/**
 * Modal Controller
 * 
 * This utility provides a standardized approach for handling modals in a Next.js application
 * with support for both direct routing and modal-based interactions.
 */

/**
 * Function to convert routes with dynamic segments into modal parameters
 * 
 * Example: convertRouteToModalParam('/dashboard/users/new') => 'new'
 * Example: convertRouteToModalParam('/dashboard/users/edit/123') => 'edit:123'
 */
export function convertRouteToModalParam(route: string): string | null {
  // Skip if the route is not provided
  if (!route) return null;
  
  try {
    // Remove any query parameters
    const basePath = route.split('?')[0];
    
    // Split the path into segments
    const segments = basePath.split('/').filter(Boolean);
    
    // Need at least 2 segments to form a valid modal param
    if (segments.length < 2) return null;
    
    // For routes like /dashboard/users/new, return 'new'
    if (segments.length === 3 && segments[0] === 'dashboard') {
      return segments[2];
    }
    
    // For routes like /dashboard/users/edit/123, return 'edit:123'
    if (segments.length === 4 && segments[0] === 'dashboard') {
      return `${segments[2]}:${segments[3]}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error converting route to modal param:', error);
    return null;
  }
}

/**
 * Function to convert modal parameters back to routes
 * 
 * Example: convertModalParamToRoute('new', '/dashboard/users') => '/dashboard/users/new'
 * Example: convertModalParamToRoute('edit:123', '/dashboard/users') => '/dashboard/users/edit/123'
 */
export function convertModalParamToRoute(param: string, basePath: string): string | null {
  // Skip if the param is not provided
  if (!param || !basePath) return null;
  
  try {
    // Ensure the base path doesn't end with a slash
    const normalizedBasePath = basePath.endsWith('/') 
      ? basePath.slice(0, -1) 
      : basePath;
    
    // If the param doesn't contain a colon, it's a simple path
    if (!param.includes(':')) {
      return `${normalizedBasePath}/${param}`;
    }
    
    // For params like 'edit:123', convert to '/dashboard/users/edit/123'
    const [action, id] = param.split(':');
    if (action && id) {
      return `${normalizedBasePath}/${action}/${id}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error converting modal param to route:', error);
    return null;
  }
}

/**
 * Function to extract modal parameters from URL
 */
export function getModalParamFromUrl(url: string): string | null {
  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Check for modal parameter in query string
    const modalParam = urlObj.searchParams.get('modal');
    if (modalParam) return modalParam;
    
    // Otherwise, try to extract from the path
    return convertRouteToModalParam(urlObj.pathname);
  } catch (error) {
    console.error('Error getting modal param from URL:', error);
    return null;
  }
}

/**
 * Function to handle opening modal from URL parameters
 */
export function parseModalFromUrl(): { modalName: string | null; modalParams: Record<string, string> } {
  if (typeof window === 'undefined') {
    return { modalName: null, modalParams: {} };
  }
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const modalName = urlParams.get('modal');
    const modalParams: Record<string, string> = {};
    
    // Extract all params starting with 'modal_'
    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith('modal_')) {
        const paramName = key.replace('modal_', '');
        modalParams[paramName] = value;
      }
    }
    
    return { modalName, modalParams };
  } catch (error) {
    console.error('Error parsing modal from URL:', error);
    return { modalName: null, modalParams: {} };
  }
}

/**
 * Function to add modal parameters to a URL
 */
export function addModalParamToUrl(
  baseUrl: string, 
  modalName: string, 
  params: Record<string, string> = {}
): string {
  try {
    const url = new URL(baseUrl, window.location.origin);
    
    // Add the modal parameter
    url.searchParams.set('modal', modalName);
    
    // Add any additional parameters with 'modal_' prefix
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(`modal_${key}`, value);
    });
    
    return url.toString();
  } catch (error) {
    console.error('Error adding modal param to URL:', error);
    return baseUrl;
  }
}

/**
 * Function to remove modal parameters from a URL
 */
export function removeModalParamFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove the modal parameter
    urlObj.searchParams.delete('modal');
    
    // Remove any parameters with 'modal_' prefix
    const paramsToRemove: string[] = [];
    urlObj.searchParams.forEach((_, key) => {
      if (key.startsWith('modal_')) {
        paramsToRemove.push(key);
      }
    });
    
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error removing modal param from URL:', error);
    return url;
  }
}

/**
 * Function to update browser URL without triggering navigation
 */
export function updateUrlWithoutNavigation(url: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.history.replaceState({}, '', url);
  } catch (error) {
    console.error('Error updating URL without navigation:', error);
  }
}
