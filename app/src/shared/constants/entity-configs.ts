import { 
  Calendar, 
  User, 
  MessageSquare, 
  FileCheck, 
  AppWindow,
  Building,
  Users,
  ClipboardList
} from 'lucide-react';

// Entity type configurations for consistent styling and behavior
export const ENTITY_CONFIGS = {
  appointment: {
    colors: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      darkBg: 'dark:bg-blue-900',
      darkText: 'dark:text-blue-200',
      accent: 'blue-500'
    },
    fallbackInitials: 'AP',
    icon: Calendar
  },
  customer: {
    colors: {
      bg: 'bg-green-100',
      text: 'text-green-700', 
      darkBg: 'dark:bg-green-900',
      darkText: 'dark:text-green-200',
      accent: 'green-500'
    },
    fallbackInitials: 'CU',
    icon: Building
  },
  user: {
    colors: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      darkBg: 'dark:bg-purple-900', 
      darkText: 'dark:text-purple-200',
      accent: 'purple-500'
    },
    fallbackInitials: 'US',
    icon: User
  },
  request: {
    colors: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      darkBg: 'dark:bg-orange-900',
      darkText: 'dark:text-orange-200', 
      accent: 'orange-500'
    },
    fallbackInitials: 'RQ',
    icon: MessageSquare
  }
} as const;

// Status configurations for different entities
export const STATUS_CONFIGS = {
  appointment: {
    scheduled: { color: 'bg-blue-500', label: 'Scheduled' },
    confirmed: { color: 'bg-green-500', label: 'Confirmed' },
    completed: { color: 'bg-emerald-500', label: 'Completed' },
    cancelled: { color: 'bg-red-500', label: 'Cancelled' },
    no_show: { color: 'bg-orange-500', label: 'No Show' }
  },
  customer: {
    active: { color: 'bg-green-500', label: 'Active' },
    inactive: { color: 'bg-yellow-500', label: 'Inactive' },
    deleted: { color: 'bg-red-500', label: 'Deleted' }
  },
  user: {
    active: { color: 'bg-green-500', label: 'Active' },
    inactive: { color: 'bg-yellow-500', label: 'Inactive' },
    suspended: { color: 'bg-orange-500', label: 'Suspended' },
    deleted: { color: 'bg-red-500', label: 'Deleted' }
  },
  request: {
    new: { color: 'bg-blue-500', label: 'New' },
    in_progress: { color: 'bg-yellow-500', label: 'In Progress' },
    completed: { color: 'bg-green-500', label: 'Completed' },
    cancelled: { color: 'bg-red-500', label: 'Cancelled' }
  }
} as const;

// Common tab configurations
export const COMMON_TABS = {
  overview: {
    id: 'overview',
    label: 'Overview', 
    icon: FileCheck
  },
  details: {
    id: 'details',
    label: 'Details',
    icon: AppWindow
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    icon: MessageSquare
  },
  activity: {
    id: 'activity',
    label: 'Activity',
    icon: ClipboardList
  }
} as const;

// Utility function to get entity configuration
export const getEntityConfig = (entityType: keyof typeof ENTITY_CONFIGS) => {
  return ENTITY_CONFIGS[entityType];
};

// Utility function to get status configuration  
export const getStatusConfig = (entityType: keyof typeof STATUS_CONFIGS) => {
  return STATUS_CONFIGS[entityType];
};

// Utility function to get avatar configuration for an entity
export const getAvatarConfig = (entityType: keyof typeof ENTITY_CONFIGS, name?: string) => {
  const config = ENTITY_CONFIGS[entityType];
  const initials = name 
    ? name.split(' ').map(part => part?.[0] || '').slice(0, 2).join('').toUpperCase()
    : config.fallbackInitials;
    
  return {
    initials,
    bgColor: `${config.colors.bg} ${config.colors.darkBg}`,
    textColor: `${config.colors.text} ${config.colors.darkText}`
  };
};