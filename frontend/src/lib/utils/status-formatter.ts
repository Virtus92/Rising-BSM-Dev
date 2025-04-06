/**
 * Status formatting utilities for consistent status display
 */

/**
 * Type definitions for status
 */
export type StatusConfig = {
  label: string;
  class: string;
  color: string;
  icon?: string;
};

export type StatusMap = Record<string, StatusConfig>;

/**
 * Default status configuration for projects
 */
export const PROJECT_STATUS_MAP: StatusMap = {
  'new': {
    label: 'Neu',
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    color: '#3B82F6'
  },
  'in_progress': {
    label: 'In Bearbeitung',
    class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    color: '#F59E0B'
  },
  'completed': {
    label: 'Abgeschlossen',
    class: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    color: '#10B981'
  },
  'cancelled': {
    label: 'Storniert',
    class: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    color: '#EF4444'
  },
  'on_hold': {
    label: 'Angehalten',
    class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    color: '#8B5CF6'
  }
};

/**
 * Default status configuration for appointments
 */
export const APPOINTMENT_STATUS_MAP: StatusMap = {
  'planned': {
    label: 'Geplant',
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    color: '#3B82F6'
  },
  'confirmed': {
    label: 'Bestätigt',
    class: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    color: '#10B981'
  },
  'completed': {
    label: 'Abgeschlossen',
    class: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
    color: '#14B8A6'
  },
  'cancelled': {
    label: 'Storniert',
    class: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    color: '#EF4444'
  },
  'in_progress': {
    label: 'Läuft',
    class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    color: '#F59E0B'
  }
};

/**
 * Default status configuration for requests
 */
export const REQUEST_STATUS_MAP: StatusMap = {
  'new': {
    label: 'Neu',
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    color: '#3B82F6'
  },
  'in_progress': {
    label: 'In Bearbeitung',
    class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    color: '#F59E0B'
  },
  'completed': {
    label: 'Abgeschlossen',
    class: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    color: '#10B981'
  },
  'cancelled': {
    label: 'Abgebrochen',
    class: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    color: '#EF4444'
  }
};

/**
 * Default status configuration for customers
 */
export const CUSTOMER_STATUS_MAP: StatusMap = {
  'active': {
    label: 'Aktiv',
    class: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    color: '#10B981'
  },
  'inactive': {
    label: 'Inaktiv',
    class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    color: '#F59E0B'
  },
  'pending': {
    label: 'Ausstehend',
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    color: '#3B82F6'
  },
  'deleted': {
    label: 'Gelöscht',
    class: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    color: '#EF4444'
  }
};

/**
 * Get status configuration for a given status and entity type
 * @param status Status string
 * @param entityType Type of entity (project, appointment, request, customer)
 * @returns Status configuration
 */
export const getStatusConfig = (
  status: string | null | undefined, 
  entityType: 'project' | 'appointment' | 'request' | 'customer'
): StatusConfig => {
  if (!status) {
    return {
      label: 'Unbekannt',
      class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      color: '#6B7280'
    };
  }
  
  let statusMap: StatusMap;
  
  switch (entityType) {
    case 'project':
      statusMap = PROJECT_STATUS_MAP;
      break;
    case 'appointment':
      statusMap = APPOINTMENT_STATUS_MAP;
      break;
    case 'request':
      statusMap = REQUEST_STATUS_MAP;
      break;
    case 'customer':
      statusMap = CUSTOMER_STATUS_MAP;
      break;
    default:
      statusMap = {};
  }
  
  // Normalize status string for lookup (to handle variants like 'canceled' vs 'cancelled')
  const normalizedStatus = status.toLowerCase()
    .replace('canceled', 'cancelled')
    .replace('-', '_')
    .replace(' ', '_');
  
  return statusMap[normalizedStatus] || {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    color: '#6B7280'
  };
};

/**
 * Get status label for a given status and entity type
 * @param status Status string
 * @param entityType Type of entity
 * @returns Formatted status label
 */
export const getStatusLabel = (
  status: string | null | undefined, 
  entityType: 'project' | 'appointment' | 'request' | 'customer'
): string => {
  return getStatusConfig(status, entityType).label;
};

/**
 * Get CSS class for a given status and entity type
 * @param status Status string
 * @param entityType Type of entity
 * @returns CSS class string
 */
export const getStatusClass = (
  status: string | null | undefined, 
  entityType: 'project' | 'appointment' | 'request' | 'customer'
): string => {
  return getStatusConfig(status, entityType).class;
};

/**
 * Get color for a given status and entity type
 * @param status Status string
 * @param entityType Type of entity
 * @returns Color string (hex)
 */
export const getStatusColor = (
  status: string | null | undefined, 
  entityType: 'project' | 'appointment' | 'request' | 'customer'
): string => {
  return getStatusConfig(status, entityType).color;
};
