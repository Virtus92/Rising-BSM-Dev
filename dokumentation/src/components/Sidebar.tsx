// components/Sidebar.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronDown, ChevronRight } from 'lucide-react';

type NavItem = {
  title: string;
  href: string;
  items?: NavItem[];
};

type SidebarProps = {
  isOpen: boolean;
};

const navigationItems: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    items: [
      { title: 'Introduction', href: '/docs/getting-started/introduction' },
      { title: 'Installation', href: '/docs/getting-started/installation' },
      { title: 'Configuration', href: '/docs/getting-started/configuration' },
    ]
  },
  {
    title: 'Controllers',
    href: '/docs/controllers',
    items: [
      { title: 'Auth Controller', href: '/docs/controllers/auth' },
      { title: 'Customer Controller', href: '/docs/controllers/customer' },
      { title: 'Appointment Controller', href: '/docs/controllers/appointment' },
      { title: 'Project Controller', href: '/docs/controllers/project' },
      { title: 'Contact Controller', href: '/docs/controllers/contact' },
      { title: 'Dashboard Controller', href: '/docs/controllers/dashboard' },
      { title: 'Profile Controller', href: '/docs/controllers/profile' },
      { title: 'Request Controller', href: '/docs/controllers/request' },
      { title: 'Service Controller', href: '/docs/controllers/service' },
      { title: 'Settings Controller', href: '/docs/controllers/settings' },
    ]
  },
  {
    title: 'Middleware',
    href: '/docs/middleware',
    items: [
      { title: 'Auth Middleware', href: '/docs/middleware/auth' },
      { title: 'Dashboard Middleware', href: '/docs/middleware/dashboard' },
      { title: 'Error Middleware', href: '/docs/middleware/error' },
      { title: 'Validation Middleware', href: '/docs/middleware/validation' },
    ]
  },
  {
    title: 'Services',
    href: '/docs/services',
    items: [
      { title: 'DB Service', href: '/docs/services/db' },
      { title: 'Cache Service', href: '/docs/services/cache' },
      { title: 'Export Service', href: '/docs/services/export' },
      { title: 'Notification Service', href: '/docs/services/notification' },
    ]
  },
  {
    title: 'Utilities',
    href: '/docs/utils',
    items: [
      { title: 'Formatters', href: '/docs/utils/formatters' },
      { title: 'Helpers', href: '/docs/utils/helpers' },
      { title: 'Validators', href: '/docs/utils/validators' },
    ]
  },
  {
    title: 'API Reference',
    href: '/docs/api',
  },
];

const NavItemComponent: React.FC<{ item: NavItem; depth?: number }> = ({ 
  item, 
  depth = 0 
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(router.asPath.startsWith(item.href));
  const hasChildren = item.items && item.items.length > 0;
  const isActive = router.asPath === item.href;
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className={`${depth > 0 ? "ml-4" : "ml-0"}`}>
      <div className="flex items-center">
        {hasChildren && (
          <button
            onClick={toggleOpen}
            className="mr-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        
        <Link 
          href={item.href}
          className={`flex-1 py-2 block ${
            isActive 
              ? "text-blue-600 font-medium dark:text-blue-400" 
              : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          }`}
        >
          {item.title}
        </Link>
      </div>
      
      {hasChildren && isOpen && (
        <div className="pl-2 border-l border-gray-200 dark:border-gray-700">
          {item.items!.map((child, index) => (
            <NavItemComponent key={index} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    }`}>
      <nav className="p-4">
        {navigationItems.map((item, index) => (
          <NavItemComponent key={index} item={item} />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;