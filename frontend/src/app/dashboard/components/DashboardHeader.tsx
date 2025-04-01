'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, Search, Menu, Moon, Sun, User, LogOut, X 
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const DashboardHeader = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // For demo purposes, we're adding some dummy notifications
  const notifications = [
    { id: 1, title: 'Neuer Kundentermin', time: 'Vor 5 Minuten', read: false },
    { id: 2, title: 'Projektaktualisierung', time: 'Vor 2 Stunden', read: false },
    { id: 3, title: 'Neue Anfrage', time: 'Gestern', read: true },
  ];
  
  useEffect(() => {
    // Check for user preference or system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  };
  
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    // Close other dropdowns
    if (isProfileOpen) setIsProfileOpen(false);
  };
  
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    // Close other dropdowns
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 z-40 shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Logo and Mobile Menu */}
        <div className="flex items-center">
          <button 
            className="block md:hidden mr-3"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-green-600 dark:text-green-500">Rising BSM</span>
          </Link>
        </div>
        
        {/* Right side - Search, Notifications, Theme, Profile */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <input
              type="text"
              placeholder="Suchen..."
              className="py-1.5 pl-9 pr-2 rounded-md bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-40 lg:w-60"
            />
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 absolute left-3" />
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 p-1.5 rounded-full relative"
              onClick={toggleNotifications}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Benachrichtigungen</h3>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-gray-800 dark:text-gray-200`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Keine Benachrichtigungen</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700">
                    <button className="text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium">
                      Alle lesen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button 
            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 p-1.5 rounded-full"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>
          
          {/* Profile */}
          <div className="relative">
            <button 
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500"
              onClick={toggleProfile}
            >
              <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <span className="text-sm font-medium">{getInitials()}</span>
              </div>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.name || 'Benutzer'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                
                <ul>
                  <li>
                    <Link 
                      href="/dashboard/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Profil
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 w-full text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Abmelden
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;