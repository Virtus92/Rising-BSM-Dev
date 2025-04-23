/**
 * Entity color configurations for consistent theming across the application
 * These colors match the requirements:
 * - Users: blue
 * - Customers: green
 * - Requests: orange
 * - Appointments: purple
 */

export const EntityColors = {
  // User-related colors
  users: {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    light: "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    hover: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    label: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    status: {
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      suspended: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      deleted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    }
  },
  
  // Customer-related colors
  customers: {
    primary: "bg-green-600 text-white hover:bg-green-700",
    light: "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    hover: "hover:bg-green-50 dark:hover:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    label: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    types: {
      individual: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      business: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      government: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      nonProfit: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    }
  },
  
  // Request-related colors
  requests: {
    primary: "bg-orange-600 text-white hover:bg-orange-700",
    light: "bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    hover: "hover:bg-orange-50 dark:hover:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    label: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    status: {
      new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      inProgress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    }
  },
  
  // Appointment-related colors
  appointments: {
    primary: "bg-purple-600 text-white hover:bg-purple-700",
    light: "bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    hover: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    label: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    status: {
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      inProgress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      noShow: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  },
  
  // Notification-related colors
  notifications: {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    light: "bg-indigo-50 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    hover: "hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
    label: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    status: {
      unread: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      read: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    },
    types: {
      alert: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      appointment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    }
  }
};

/**
 * Utility function to get entity-specific button styles
 * 
 * @param entityType The type of entity (users, customers, requests, appointments)
 * @param variant Button variant (primary, outline, etc.)
 * @returns CSS classes for the button
 */
export function getEntityButtonStyles(
  entityType: 'users' | 'customers' | 'requests' | 'appointments',
  variant: 'primary' | 'light' | 'outline' = 'primary'
): string {
  const colors = EntityColors[entityType];
  
  switch (variant) {
    case 'primary':
      return colors.primary;
    case 'light':
      return colors.light;
    case 'outline':
      return `bg-transparent ${colors.text} border ${colors.border} ${colors.hover}`;
    default:
      return colors.primary;
  }
}

/**
 * Get status badge color based on entity type and status
 */
export function getStatusBadgeColor(
  entityType: 'users' | 'customers' | 'requests' | 'appointments',
  status: string
): string {
  const colors = EntityColors[entityType];
  
  // Handle status mapping for each entity type
  switch (entityType) {
    case 'users':
      switch (status.toLowerCase()) {
        case 'active': return colors.status.active;
        case 'inactive': return colors.status.inactive;
        case 'suspended': return colors.status.suspended;
        case 'deleted': return colors.status.deleted;
        default: return colors.badge; // Default to entity color
      }
    
    case 'requests':
      switch (status.toLowerCase()) {
        case 'new': return colors.status.new;
        case 'in_progress': 
        case 'inprogress': 
        case 'in progress': return colors.status.inProgress;
        case 'completed': return colors.status.completed;
        case 'cancelled': return colors.status.cancelled;
        default: return colors.badge; // Default to entity color
      }
    
    case 'appointments':
      switch (status.toLowerCase()) {
        case 'scheduled': return colors.status.scheduled;
        case 'confirmed': return colors.status.confirmed;
        case 'in_progress': 
        case 'inprogress': 
        case 'in progress': return colors.status.inProgress;
        case 'completed': return colors.status.completed;
        case 'cancelled': return colors.status.cancelled;
        case 'no_show': 
        case 'noshow': 
        case 'no show': return colors.status.noShow;
        default: return colors.badge; // Default to entity color
      }
    
    // Customers don't have statuses, but may have types
    case 'customers':
    default:
      return colors.badge; // Default to entity color
  }
}

/**
 * Get customer type badge color
 */
export function getCustomerTypeBadgeColor(type: string): string {
  const colors = EntityColors.customers.types;
  
  switch (type.toLowerCase()) {
    case 'individual': return colors.individual;
    case 'business': return colors.business;
    case 'government': return colors.government;
    case 'non_profit': 
    case 'nonprofit': 
    case 'non profit': return colors.nonProfit;
    default: return EntityColors.customers.badge; // Default customer color
  }
}
