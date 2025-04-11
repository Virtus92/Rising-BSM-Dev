'use client';

import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  FileText, 
  Calendar, 
  LayoutDashboard,
  User
} from 'lucide-react';
import { buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

export const DashboardSidebar = () => {
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
    }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Rising BSM</h2>
      </div>
      <nav className="flex-1">
        {sidebarItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: 'ghost' }), 
              'w-full justify-start mb-2 hover:bg-accent text-foreground'
            )}
          >
            <item.icon className="mr-2 h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
