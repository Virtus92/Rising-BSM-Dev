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
  Bell
} from 'lucide-react';
import { buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

export const DashboardSidebar = () => {
  const pathname = usePathname();
  
  const sidebarItems = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      label: 'Mein Profil', 
      href: '/dashboard/me', 
      icon: User 
    },
    { 
      label: 'User Management', 
      href: '/dashboard/users', 
      icon: Users 
    },
    { 
      label: 'Customer Management', 
      href: '/dashboard/customers', 
      icon: UserPlus 
    },
    { 
      label: 'Requests Management', 
      href: '/dashboard/requests', 
      icon: FileText 
    },
    { 
      label: 'Appointments', 
      href: '/dashboard/appointments', 
      icon: Calendar 
    },
    { 
      label: 'Notifications', 
      href: '/dashboard/notifications', 
      icon: Bell 
    },
    { 
      label: 'Settings', 
      href: '/dashboard/settings', 
      icon: Settings 
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
