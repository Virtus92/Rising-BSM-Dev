import { UserRole } from '@/domain/entities/User';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Interface Configuration for different roles
 * 
 * This provides UI configuration for different roles to ensure
 * consistent experience across the application.
 */

export type MenuSection = {
  title: string;
  description?: string;
  items: MenuItem[];
};

export type MenuItem = {
  name: string;
  description?: string;
  path: string;
  icon?: string;
  permission?: string | string[];
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  children?: MenuItem[];
};

/**
 * Dashboard sidebar navigation configuration by role
 */
export const dashboardNavigation: Record<UserRole, MenuSection[]> = {
  // Admin sees everything
  [UserRole.ADMIN]: [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
        },
        {
          name: 'Activities',
          path: '/dashboard/activities',
          icon: 'Activity',
        },
      ],
    },
    {
      title: 'Core',
      items: [
        {
          name: 'Users',
          path: '/dashboard/users',
          icon: 'Users',
          permission: SystemPermission.USERS_VIEW,
        },
        {
          name: 'Customers',
          path: '/dashboard/customers',
          icon: 'UserCheck',
          permission: SystemPermission.CUSTOMERS_VIEW,
        },
        {
          name: 'Appointments',
          path: '/dashboard/appointments',
          icon: 'Calendar',
          permission: SystemPermission.APPOINTMENTS_VIEW,
        },
        {
          name: 'Requests',
          path: '/dashboard/requests',
          icon: 'Inbox',
          permission: SystemPermission.REQUESTS_VIEW,
        },
        {
          name: 'Services',
          path: '/dashboard/services',
          icon: 'Briefcase',
          permission: SystemPermission.USERS_VIEW,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          name: 'Settings',
          path: '/dashboard/settings',
          icon: 'Settings',
          permission: SystemPermission.SETTINGS_VIEW,
        },
        {
          name: 'Profile',
          path: '/dashboard/profile',
          icon: 'User',
          permission: SystemPermission.PROFILE_VIEW,
        },
      ],
    },
  ],
  
  // Managers see most things but have limited access to some settings
  [UserRole.MANAGER]: [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
        },
        {
          name: 'Activities',
          path: '/dashboard/activities',
          icon: 'Activity',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          name: 'Customers',
          path: '/dashboard/customers',
          icon: 'UserCheck',
          permission: SystemPermission.CUSTOMERS_VIEW,
        },
        {
          name: 'Appointments',
          path: '/dashboard/appointments',
          icon: 'Calendar',
          permission: SystemPermission.APPOINTMENTS_VIEW,
        },
        {
          name: 'Requests',
          path: '/dashboard/requests',
          icon: 'Inbox',
          permission: SystemPermission.REQUESTS_VIEW,
        },
        {
          name: 'Services',
          path: '/dashboard/services',
          icon: 'Briefcase',
          permission: SystemPermission.USERS_VIEW,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          name: 'Profile',
          path: '/dashboard/profile',
          icon: 'User',
          permission: SystemPermission.PROFILE_VIEW,
        },
      ],
    },
  ],
  
  // Employees have limited access focused on day-to-day operations
  [UserRole.EMPLOYEE]: [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
        },
      ],
    },
    {
      title: 'Daily Work',
      items: [
        {
          name: 'Appointments',
          path: '/dashboard/appointments',
          icon: 'Calendar',
          permission: SystemPermission.APPOINTMENTS_VIEW,
        },
        {
          name: 'Customers',
          path: '/dashboard/customers',
          icon: 'UserCheck',
          permission: SystemPermission.CUSTOMERS_VIEW,
        },
        {
          name: 'Requests',
          path: '/dashboard/requests',
          icon: 'Inbox',
          permission: SystemPermission.REQUESTS_VIEW,
        },
      ],
    },
    {
      title: 'Personal',
      items: [
        {
          name: 'Profile',
          path: '/dashboard/profile',
          icon: 'User',
          permission: SystemPermission.PROFILE_VIEW,
        },
      ],
    },
  ],
  
  // Regular users see minimal interface focused on their own data
  [UserRole.USER]: [
    {
      title: 'My Account',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
        },
        {
          name: 'Appointments',
          path: '/dashboard/appointments',
          icon: 'Calendar',
          permission: SystemPermission.APPOINTMENTS_VIEW,
        },
        {
          name: 'Profile',
          path: '/dashboard/profile',
          icon: 'User',
          permission: SystemPermission.PROFILE_VIEW,
        },
      ],
    },
  ],
};

/**
 * Action permissions mapping per area
 * This controls what actions users see in different parts of the app
 */
export type ActionConfig = {
  name: string;
  permission: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export const actionPermissions: Record<string, ActionConfig[]> = {
  customers: [
    { name: 'View', permission: SystemPermission.CUSTOMERS_VIEW, icon: 'Eye' },
    { name: 'Create', permission: SystemPermission.CUSTOMERS_CREATE, icon: 'Plus' },
    { name: 'Edit', permission: SystemPermission.CUSTOMERS_EDIT, icon: 'Edit' },
    { name: 'Delete', permission: SystemPermission.CUSTOMERS_DELETE, icon: 'Trash2', variant: 'destructive' },
  ],
  appointments: [
    { name: 'View', permission: SystemPermission.APPOINTMENTS_VIEW, icon: 'Eye' },
    { name: 'Create', permission: SystemPermission.APPOINTMENTS_CREATE, icon: 'Plus' },
    { name: 'Edit', permission: SystemPermission.APPOINTMENTS_EDIT, icon: 'Edit' },
    { name: 'Delete', permission: SystemPermission.APPOINTMENTS_DELETE, icon: 'Trash2', variant: 'destructive' },
  ],
  requests: [
    { name: 'View', permission: SystemPermission.REQUESTS_VIEW, icon: 'Eye' },
    { name: 'Create', permission: SystemPermission.REQUESTS_CREATE, icon: 'Plus' },
    { name: 'Edit', permission: SystemPermission.REQUESTS_EDIT, icon: 'Edit' },
    { name: 'Delete', permission: SystemPermission.REQUESTS_DELETE, icon: 'Trash2', variant: 'destructive' },
    { name: 'Approve', permission: SystemPermission.REQUESTS_APPROVE, icon: 'Check', variant: 'default' },
    { name: 'Reject', permission: SystemPermission.REQUESTS_REJECT, icon: 'X', variant: 'outline' },
    { name: 'Assign', permission: SystemPermission.REQUESTS_ASSIGN, icon: 'UserPlus', variant: 'secondary' },
  ],
  users: [
    { name: 'View', permission: SystemPermission.USERS_VIEW, icon: 'Eye' },
    { name: 'Create', permission: SystemPermission.USERS_CREATE, icon: 'Plus' },
    { name: 'Edit', permission: SystemPermission.USERS_EDIT, icon: 'Edit' },
    { name: 'Delete', permission: SystemPermission.USERS_DELETE, icon: 'Trash2', variant: 'destructive' },
  ],
  settings: [
    { name: 'View', permission: SystemPermission.SETTINGS_VIEW, icon: 'Eye' },
    { name: 'Edit', permission: SystemPermission.SETTINGS_EDIT, icon: 'Edit' },
  ],
};

/**
 * Get the role display info
 */
export const getRoleInfo = (role: UserRole | string) => {
  switch (role) {
    case UserRole.ADMIN:
      return {
        label: 'Administrator',
        description: 'Full access to all system features and settings',
        color: 'text-red-600 bg-red-50 ring-red-600/10',
        icon: 'Shield',
      };
    case UserRole.MANAGER:
      return {
        label: 'Manager',
        description: 'Can manage users, customers, appointments and requests',
        color: 'text-violet-600 bg-violet-50 ring-violet-600/10',
        icon: 'Briefcase',
      };
    case UserRole.EMPLOYEE:
      return {
        label: 'Employee',
        description: 'Can handle day-to-day operations',
        color: 'text-blue-600 bg-blue-50 ring-blue-600/10',
        icon: 'UserCircle',
      };
    case UserRole.USER:
      return {
        label: 'User',
        description: 'Basic access to personal features only',
        color: 'text-gray-600 bg-gray-50 ring-gray-600/10',
        icon: 'User',
      };
    default:
      return {
        label: String(role),
        description: 'Custom role',
        color: 'text-gray-600 bg-gray-50 ring-gray-600/10',
        icon: 'User',
      };
  }
};