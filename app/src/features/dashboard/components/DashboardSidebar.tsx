'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  FileText, 
  Calendar, 
  LayoutDashboard,
  User,
  Settings,
  Bell,
  Shield
} from 'lucide-react';
import { buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { PermissionGuard } from '@/shared/components/PermissionGuard';

export const DashboardSidebar = () => {
  const pathname = usePathname();
  
  const sidebarItems = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      // Dashboard is accessible to all authenticated users
    },
    { 
      label: 'Mein Profil', 
      href: '/dashboard/me', 
      icon: User,
      // Profile is accessible to all authenticated users
    },
    { 
      label: 'User Management', 
      href: '/dashboard/users', 
      icon: Users,
      permission: SystemPermission.USERS_VIEW // Only users with USERS_VIEW permission can access
    },
    { 
      label: 'Customer Management', 
      href: '/dashboard/customers', 
      icon: UserPlus,
      permission: SystemPermission.CUSTOMERS_VIEW // Only users with CUSTOMERS_VIEW permission can access
    },
    { 
      label: 'Requests Management', 
      href: '/dashboard/requests', 
      icon: FileText,
      permission: SystemPermission.REQUESTS_VIEW // Only users with REQUESTS_VIEW permission can access
    },
    { 
      label: 'Appointments', 
      href: '/dashboard/appointments', 
      icon: Calendar,
      permission: SystemPermission.APPOINTMENTS_VIEW // Only users with APPOINTMENTS_VIEW permission can access
    },
    { 
      label: 'Permission Management', 
      href: '/dashboard/permissions', 
      icon: Shield,
      permission: SystemPermission.SYSTEM_ADMIN // Only users with SYSTEM_ADMIN permission can access
    },
    { 
      label: 'Notifications', 
      href: '/dashboard/notifications', 
      icon: Bell,
      permission: SystemPermission.NOTIFICATIONS_VIEW // Only users with NOTIFICATIONS_VIEW permission can access
    },
    { 
      label: 'Settings', 
      href: '/dashboard/settings', 
      icon: Settings,
      permission: SystemPermission.SETTINGS_VIEW // Only users with SETTINGS_VIEW permission can access
    }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border p-4 flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Rising BSM</h2>
      </div>
      <nav className="flex-1 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          // If item requires permission check, wrap it in PermissionGuard
          if (item.permission) {
            return (
              <PermissionGuard key={item.href} permission={item.permission}>
                <Link 
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }), 
                    'w-full justify-start mb-1 hover:bg-accent text-foreground',
                    isActive && 'bg-accent/50 font-medium'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Link>
              </PermissionGuard>
            );
          }
          
          // Regular menu item without permission check
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost' }), 
                'w-full justify-start mb-1 hover:bg-accent text-foreground',
                isActive && 'bg-accent/50 font-medium'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
