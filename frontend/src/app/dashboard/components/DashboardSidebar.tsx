'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Calendar, BarChart2, Settings, Package, 
  FileText, Truck, Snowflake, ChevronDown, HelpCircle
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
}

const DashboardSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  
  // Effect to collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    // Initial setup
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close mobile sidebar on navigation
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname]);
  
  const toggleSubmenu = (name: string) => {
    if (expandedMenu === name) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(name);
    }
  };
  
  // Navigation items with potential submenus
  const navigation: NavItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      name: 'Kunden', 
      href: '/dashboard/customers', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      name: 'Termine', 
      href: '/dashboard/appointments', 
      icon: <Calendar className="h-5 w-5" /> 
    },
    { 
      name: 'Leistungen', 
      href: '#', 
      icon: <Package className="h-5 w-5" />,
      submenu: [
        { name: 'Facility Management', href: '/dashboard/services/facility', icon: <FileText className="h-5 w-5" /> },
        { name: 'Umzüge & Transporte', href: '/dashboard/services/moving', icon: <Truck className="h-5 w-5" /> },
        { name: 'Sommer- & Winterdienst', href: '/dashboard/services/winter', icon: <Snowflake className="h-5 w-5" /> },
      ]
    },
    { 
      name: 'Berichte', 
      href: '/dashboard/reports', 
      icon: <BarChart2 className="h-5 w-5" /> 
    },
    { 
      name: 'Einstellungen', 
      href: '/dashboard/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
    { 
      name: 'Hilfe', 
      href: '/dashboard/help', 
      icon: <HelpCircle className="h-5 w-5" /> 
    },
  ];
  
  // Check if a link is active
  const isLinkActive = (href: string) => {
    const currentPath = pathname ?? '';
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };
  
  // Check if a submenu should be expanded because a child is active
  const shouldExpandSubmenu = (submenu?: NavItem[]) => {
    if (!submenu) return false;
    return submenu.some(item => isLinkActive(item.href));
  };
  
  return (
    <aside 
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:overflow-y-auto z-30 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-transform duration-300 ease-in-out flex flex-col pt-16`}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              {item.submenu ? (
                // If item has submenu
                <div className="mb-2">
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${
                      expandedMenu === item.name || shouldExpandSubmenu(item.submenu)
                        ? 'text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/10'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => toggleSubmenu(item.name)}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      expandedMenu === item.name || shouldExpandSubmenu(item.submenu) ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Submenu */}
                  <div className={`mt-1 pl-4 transition-all ${
                    expandedMenu === item.name || shouldExpandSubmenu(item.submenu) ? 'max-h-96' : 'max-h-0 overflow-hidden'
                  }`}>
                    <ul className="space-y-1 border-l border-gray-200 dark:border-slate-700 pl-2">
                      {item.submenu.map((subitem) => (
                        <li key={subitem.name}>
                          <Link 
                            href={subitem.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                              isLinkActive(subitem.href)
                                ? 'text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/10'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {subitem.icon}
                            <span className="ml-3">{subitem.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                // Regular item without submenu
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isLinkActive(item.href)
                      ? 'text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/10'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <Link 
          href="/"
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500"
        >
          <span>Zurück zur Website</span>
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;