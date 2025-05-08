import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';

/**
 * Type definitions for menu structure
 */
export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  permission?: string | string[];
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  children?: MenuItem[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

/**
 * Dashboard navigation configuration
 */
export const dashboardNavigation: Record<UserRole, MenuSection[]> = {
  [UserRole.ADMIN]: [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
          permission: SystemPermission.DASHBOARD_VIEW
        },
        {
          name: 'Notifications',
          path: '/dashboard/notifications',
          icon: 'Bell',
          permission: SystemPermission.NOTIFICATIONS_VIEW
        }
      ]
    },
    {
      title: 'Business',
      items: [
        {
          name: 'Requests',
          path: '/dashboard/requests',
          icon: 'MessageSquare',
          permission: SystemPermission.REQUESTS_VIEW
        },
        {
          name: 'Appointments',
          path: '/dashboard/appointments',
          icon: 'CalendarClock',
          permission: SystemPermission.APPOINTMENTS_VIEW
        },
        {
          name: 'Customers',
          path: '/dashboard/customers',
          icon: 'Users',
          permission: SystemPermission.CUSTOMERS_VIEW
        }
      ]
    },
    {
      title: 'Automation',
      items: [
        {
          name: 'Workflows',
          path: '/dashboard/n8n',
          icon: 'Workflow',
          permission: SystemPermission.AUTOMATION_VIEW
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          name: 'Users',
          path: '/dashboard/users',
          icon: 'UserCog',
          permission: SystemPermission.USERS_VIEW
        },
        {
          name: 'Permissions',
          path: '/dashboard/permissions',
          icon: 'Shield',
          permission: SystemPermission.PERMISSIONS_VIEW
        },
        {
          name: 'Settings',
          path: '/dashboard/settings',
          icon: 'Settings',
          permission: SystemPermission.SETTINGS_VIEW
        },
        {
          name: 'Diagnostics',
          path: '/dashboard/diagnostics',
          icon: 'Activity',
          permission: SystemPermission.DIAGNOSTICS_VIEW
        }
      ]
    }
  ],
  [UserRole.MANAGER]: [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
          permission: SystemPermission.DASHBOARD_VIEW
        },
        {
          name: 'Notifications',
          path: '/dashboard/notifications',
          icon: 'Bell',
          permission: SystemPermission.NOTIFICATIONS_VIEW
        }
      ]
    },
    {
      title: 'Business',
      items: [
        {
          name: 'Requests',
          path: '/dashboard/requests',
          icon: 'MessageSquare',
          permission: SystemPermission.REQUESTS_VIEW
        },
        {
          name: 'Appointments',
          path: '/dashboard/appointments',
          icon: 'CalendarClock',
          permission: SystemPermission.APPOINTMENTS_VIEW
        },
        {
          name: 'Customers',
          path: '/dashboard/customers',
          icon: 'Users',
          permission: SystemPermission.CUSTOMERS_VIEW
        }
      ]
    },
    {
      title: 'Automation',
      items: [
        {
          name: 'Workflows',
          path: '/dashboard/n8n',
          icon: 'Workflow',
          permission: SystemPermission.AUTOMATION_VIEW
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          name: 'Users',
          path: '/dashboard/users',
          icon: 'UserCog',
          permission: SystemPermission.USERS_VIEW
        },
        {
          name: 'Settings',
          path: '/dashboard/settings',
          icon: 'Settings',
          permission: SystemPermission.SETTINGS_VIEW
        }
      ]
    }
  ],
  [UserRole.USER]: [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: 'LayoutDashboard',
          permission: SystemPermission.DASHBOARD_VIEW
        },
        {
          name: 'Notifications',
          path: '/dashboard/notifications',
          icon: 'Bell',
          permission: SystemPermission.NOTIFICATIONS_VIEW
        }
      ]
    },
    {
      title: 'Business',
      items: [
        {
          name: 'Requests',
          path: '/dashboard/requests',
          icon: 'MessageSquare',
          permission: SystemPermission.REQUESTS_VIEW
        },
        {
          name: 'Appointments',
          path: '/dashboard/appointments',
          icon: 'CalendarClock',
          permission: SystemPermission.APPOINTMENTS_VIEW
        },
        {
          name: 'Customers',
          path: '/dashboard/customers',
          icon: 'Users',
          permission: SystemPermission.CUSTOMERS_VIEW
        }
      ]
    }
  ]
};