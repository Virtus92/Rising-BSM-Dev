'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  Calendar, 
  User,
  Settings,
  Shield,
  ChevronDown,
  BarChart2,
  Zap,
} from 'lucide-react';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { cn } from '@/shared/utils/cn';

/**
 * Interface for navigation items
 */
interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  permission?: SystemPermission;
  badge?: number | string;
  badgeColor?: string;
  submenu?: NavItem[];
}

/**
 * Modern Dashboard Sidebar with Tailwind CSS
 * 
 * Features collapsible sections, animations, and responsive design
 */
export const DashboardSidebar = () => {
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>(null);
  
  // Setup navigation data
  const navItems: NavItem[] = [
    { 
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    { 
      label: 'Statistics',
      icon: BarChart2,
      href: '/dashboard/statistics',
      permission: SystemPermission.SYSTEM_ADMIN,
    },
    { 
      label: 'Roles & Permissions',
      icon: Shield,
      href: '/dashboard/permissions',
      permission: SystemPermission.SYSTEM_ADMIN,
    },
    { 
      label: 'User Management',
      icon: Users,
      href: '/dashboard/users',
      permission: SystemPermission.USERS_VIEW,
    },
    { 
      label: 'Customer Management',
      icon: UserPlus,
      href: '/dashboard/customers',
      permission: SystemPermission.CUSTOMERS_VIEW,
    },
    { 
      label: 'Request Management',
      icon: FileText,
      href: '/dashboard/requests',
      permission: SystemPermission.REQUESTS_VIEW,
    },
    { 
      label: 'Appointment Management',
      icon: Calendar,
      href: '/dashboard/appointments',
      permission: SystemPermission.APPOINTMENTS_VIEW
    },
    { 
      label: 'Automation',
      icon: Zap,
      href: '/dashboard/automation',
      permission: SystemPermission.AUTOMATION_VIEW
    },
    { 
      label: 'My Profile',
      icon: User,
      href: '/dashboard/me',
    },
    { 
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
      permission: SystemPermission.SETTINGS_VIEW
    },
  ];
  
  // Close expanded sections when route changes
  useEffect(() => {
    // But keep the current section open if navigating within it
    const currentOpenSection = openSection;
    if (currentOpenSection) {
      const section = navItems.find(item => item.label === currentOpenSection);
      if (section?.submenu) {
        const isWithinSection = section.submenu.some(subItem => 
          pathname === subItem.href || pathname?.startsWith(`${subItem.href}/`)
        );
        
        if (!isWithinSection) {
          setOpenSection(null);
        }
      }
    }
  }, [pathname, openSection, navItems]);
  
  // Toggle a collapsible section
  const toggleSection = (label: string) => {
    setOpenSection(prev => prev === label ? null : label);
  };
  
  // Check if a nav item or any of its children is active
  const isNavItemActive = (item: NavItem): boolean => {
    if (pathname === item.href || pathname?.startsWith(`${item.href}/`)) {
      return true;
    }
    
    if (item.submenu) {
      return item.submenu.some(subItem => isNavItemActive(subItem));
    }
    
    return false;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item);
            
            // If item requires permission, wrap it in PermissionGuard
            const NavItemContent = () => {
              if (item.submenu) {
                // This is a section with submenu
                return (
                  <div key={item.label} className="mb-1">
                    <button 
                      type="button"
                      onClick={() => toggleSection(item.label)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <span className="flex items-center">
                        <item.icon className={cn(
                          "h-5 w-5 mr-2",
                          isActive 
                            ? "text-indigo-600 dark:text-indigo-400" 
                            : "text-slate-500 dark:text-slate-400"
                        )} />
                        {item.label}
                        
                        {/* Show badge if present */}
                        {item.badge && (
                          <span className={cn(
                            "ml-2 px-1.5 py-0.5 text-xs rounded-full text-white", 
                            item.badgeColor || "bg-indigo-500"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200",
                        openSection === item.label ? "rotate-180" : ""
                      )} />
                    </button>
                    
                  </div>
                );
              } else {
                // This is a regular nav item
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 group',
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="flex items-center">
                      <item.icon className={cn(
                        "h-5 w-5 mr-2 transition-colors",
                        isActive 
                          ? "text-indigo-600 dark:text-indigo-400" 
                          : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      )} />
                      {item.label}
                    </span>
                    
                    {/* Show badge if present */}
                    {item.badge && (
                      <span className={cn(
                        "px-1.5 py-0.5 text-xs rounded-full text-white", 
                        item.badgeColor || "bg-indigo-500"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }
            };
            
            // Wrap with permission guard if needed
            return item.permission ? (
              <PermissionGuard key={item.href} permission={item.permission}>
                <NavItemContent />
              </PermissionGuard>
            ) : (
              <div key={item.href}>
                <NavItemContent />
              </div>
            );
          })}
        </div>
      </nav>
      
      {/* Footer - Version info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
        <div className="text-xs text-slate-500 dark:text-slate-500">
          Rising BSM v0.7.0
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;