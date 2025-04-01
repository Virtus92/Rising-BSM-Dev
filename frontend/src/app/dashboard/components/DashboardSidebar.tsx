'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  Calendar, 
  Inbox, 
  Briefcase, 
  Package, 
  Settings, 
  ChevronDown,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const DashboardSidebar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { logout } = useAuth();
  const router = useRouter();
  
  const toggleSubmenu = (key: string) => {
    setOpenSubmenu(prev => prev === key ? null : key);
  };
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/dashboard',
    },
    {
      title: 'Kunden',
      icon: <Users className="w-5 h-5" />,
      path: '/dashboard/customers',
    },
    {
      title: 'Termine',
      icon: <Calendar className="w-5 h-5" />,
      path: '/dashboard/appointments',
    },
    {
      title: 'Anfragen',
      icon: <Inbox className="w-5 h-5" />,
      path: '/dashboard/requests',
    },
    {
      title: 'Projekte',
      icon: <Briefcase className="w-5 h-5" />,
      path: '/dashboard/projects',
    },
    {
      title: 'Leistungen',
      icon: <Package className="w-5 h-5" />,
      path: '/dashboard/services',
      submenu: [
        { title: 'Alle Leistungen', path: '/dashboard/services' },
        { title: 'Neue Leistung', path: '/dashboard/services/new' },
        { title: 'Statistiken', path: '/dashboard/services/statistics' },
      ]
    },
    {
      title: 'Einstellungen',
      icon: <Settings className="w-5 h-5" />,
      path: '/dashboard/settings',
    },
  ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={toggleMobileMenu}
          className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-md text-gray-600 dark:text-gray-300 focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-slate-800 w-64 shadow-md z-30 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'fixed inset-y-0 left-0 translate-x-0 lg:relative lg:translate-x-0' 
            : 'fixed -translate-x-full lg:relative lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="text-2xl font-bold text-green-600 dark:text-green-500">
            Rising BSM
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={`flex items-center justify-between w-full p-2 rounded-md text-sm font-medium ${
                          pathname?.startsWith(item.path)
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${
                          openSubmenu === item.title ? 'transform rotate-180' : ''
                        }`} 
                      />
                    </button>
                    
                    {openSubmenu === item.title && (
                      <ul className="mt-1 pl-6 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.title}>
                            <Link
                              href={subItem.path}
                              className={`block p-2 rounded-md text-sm ${
                                isActive(subItem.path)
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    className={`flex items-center p-2 rounded-md text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="px-4 mt-8">
          <button 
            className="flex items-center w-full p-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default DashboardSidebar;