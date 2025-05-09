'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Menu, Moon, Sun, Bell, User, LogOut, Settings, 
  ChevronDown, CheckCheck, Clock, Calendar, Mail, HelpCircle,
  X, BarChart2, Users
} from 'lucide-react';
import NotificationBadge from '@/features/notifications/components/NotificationBadge';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useToast } from '@/shared/hooks/useToast';
import { Transition, Dialog, Popover } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useSearch } from '@/shared/hooks/useSearch';
import { getLogger } from '@/core/logging';
import { setItem } from '@/shared/utils/storage/cookieStorage';

/**
 * Props for the DashboardHeader component
 */
interface DashboardHeaderProps {
  /**
   * Function to toggle the sidebar on mobile devices
   */
  setSidebarOpen: (isOpen: boolean) => void;
};

/**
 * Quick Action Item Interface
 */
interface QuickAction {
  icon: React.ReactNode;
  name: string;
  description: string;
  href: string;
  color: string;
}

/**
 * Dashboard Header Component
 * 
 * Header for the dashboard with navigation, user profile, and quick actions
 */
const DashboardHeader = ({ setSidebarOpen }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { search, setSearchTerm, searchResults, isSearching } = useSearch();
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Update theme when settings change
  useEffect(() => {
    const logger = getLogger();
    
    if (settings) {
      logger.debug('Applying theme settings', { theme: settings.theme });
      
      // Apply settings theme or use system preference if set to system
      if (settings.theme === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      } else if (settings.theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        logger.debug('System theme preference detected', { prefersDark });
        
        if (prefersDark) {
          setTheme('dark');
          document.documentElement.classList.add('dark');
        } else {
          setTheme('light');
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, [settings?.theme]);
  
  // Theme toggle callback
  const toggleTheme = useCallback(async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      
      // Update DOM
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      
      // Set for localStorage persistence
      setItem('theme', newTheme);
      
      // Update theme in global settings if available
      if (settings && settings.updateSetting) {
        await settings.updateSetting('theme', newTheme);
      }
    } catch (error) {
      console.error('Failed to toggle theme:', error as Error);
      toast({
        title: 'Error',
        description: 'Could not save theme preference',
        variant: 'destructive'
      });
    }
  }, [theme, settings, toast]);
  
  // Toggle profile dropdown
  const toggleProfile = useCallback(() => {
    setIsProfileOpen(!isProfileOpen);
  }, [isProfileOpen]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    const logger = getLogger();
    
    try {
      logger.debug('User initiating logout');
      await logout();
      
      router.push('/auth/login');
      toast({
        title: 'Successfully logged out',
        description: 'You have been logged out successfully.',
        variant: 'success'
      });
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error as string | Error | Record<string, any>);
      
      toast({
        title: 'Logout error',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  }, [logout, router, toast]);

  // Get user initials for avatar (memoized)
  const userInitials = useMemo(() => {
    if (!user || !user.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }, [user]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileOpen && 
          event.target instanceof Node && 
          !document.getElementById('profile-dropdown')?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      // Perform search
      setSearchTerm(searchQuery);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = (result: any) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    
    // Navigate based on result type
    if (result.type === 'customer') {
      router.push(`/dashboard/customers/${result.id}`);
    } else if (result.type === 'appointment') {
      router.push(`/dashboard/appointments/${result.id}`);
    } else if (result.type === 'request') {
      router.push(`/dashboard/requests/${result.id}`);
    }
  };
  
  // Quick actions data
  const quickActions: QuickAction[] = [
    {
      icon: <Users className="h-6 w-6" />,
      name: "New Customer",
      description: "Add a new customer to the system",
      href: "/dashboard/customers/new",
      color: "bg-blue-500 text-white"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      name: "New Appointment",
      description: "Schedule a new appointment",
      href: "/dashboard/appointments/new",
      color: "bg-emerald-500 text-white"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      name: "New Request",
      description: "Create a new service request",
      href: "/dashboard/requests/new",
      color: "bg-violet-500 text-white"
    },
    {
      icon: <BarChart2 className="h-6 w-6" />,
      name: "Analytics",
      description: "View business performance metrics",
      href: "/dashboard/statistics",
      color: "bg-amber-500 text-white"
    }
  ];
  
  return (
    <>
      <header className="h-16 z-30 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left section: Logo and mobile menu button */}
          <div className="flex items-center">
            <button 
              type="button"
              className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 ml-2 md:ml-0"
            >
              <div className="w-8 h-8 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white">
                <span className="font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 hidden md:inline-block">
                {settings?.companyName || 'Rising BSM'}
              </span>
            </Link>
          </div>
          
          {/* Center section: Search (medium screens+) */}
          <div className="hidden md:flex flex-1 max-w-md mx-10">
            <button 
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center text-sm leading-6 text-slate-400 rounded-md ring-1 ring-slate-200 shadow-sm py-1.5 pl-2 pr-3 hover:ring-slate-300 dark:bg-slate-800 dark:highlight-white/5 dark:hover:bg-slate-700 dark:ring-slate-700 dark:hover:ring-slate-600 transition-all duration-200"
            >
              <Search className="mr-2 h-4 w-4 flex-none" />
              <span className="flex-1 text-left">Search...</span>
              <span className="text-xs border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 opacity-60 select-none">
                ⌘K
              </span>
            </button>
          </div>
          
          {/* Right section: Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <button 
              type="button"
              className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            
            {/* Quick actions dropdown */}
            <Popover className="relative">
              {({ open }: { open: boolean }) => (
                <>
                  <Popover.Button 
                    className={`${
                      open ? 'bg-slate-100 dark:bg-slate-800' : ''
                    } p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 focus:outline-none`}
                  >
                    <span className="sr-only">Quick actions</span>
                    <svg 
                      className="h-6 w-6" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                      />
                    </svg>
                  </Popover.Button>
                  
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-2.5 w-72 rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 p-3">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Quick Actions</h3>
                      </div>
                      <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
                        {quickActions.map((action, index) => (
                          <Link 
                            key={index}
                            href={action.href}
                            className="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color} mr-4 flex-shrink-0`}>
                              {action.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{action.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
            
            {/* Notifications */}
            <div className="relative">
              <NotificationBadge />
            </div>
            
            {/* Theme toggle */}
            <button 
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            {/* Profile dropdown */}
            <div className="relative" id="profile-dropdown">
              <button 
                type="button"
                onClick={toggleProfile}
                className="flex items-center focus:outline-none"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="flex items-center space-x-3 rounded-full">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user?.name || 'Profile'} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" 
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-medium shadow-sm border-2 border-white dark:border-slate-800">
                      {userInitials}
                    </div>
                  )}
                  <span className="hidden md:inline-block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
              </button>
              
              {/* Profile dropdown menu */}
              <Transition
                show={isProfileOpen}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <div className="absolute right-0 z-10 mt-2 w-60 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 divide-y divide-slate-100 dark:divide-slate-700 focus:outline-none">
                  {/* User info */}
                  <div className="px-5 py-4">
                    <div className="flex items-center">
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user?.name || 'Profile'} 
                          className="h-10 w-10 rounded-full object-cover mr-3" 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-medium shadow-sm mr-3">
                          {userInitials}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Signed in as <span className="font-medium">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Menu items */}
                  <div className="py-2">
                    <Link 
                      href="/dashboard/me" 
                      className="flex items-center px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                      Your Profile
                    </Link>
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                      Settings
                    </Link>
                    <Link 
                      href="/dashboard/help" 
                      className="flex items-center px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <HelpCircle className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                      Help & Support
                    </Link>
                  </div>
                  
                  {/* Sign out button */}
                  <div className="py-2">
                    <button 
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                      Sign out
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>
      
      {/* Command palette / search dialog */}
      <Transition appear show={isSearchOpen} as={Fragment}>
        <Dialog className="relative z-50" onClose={() => setIsSearchOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-3 shadow-xl transition-all">
                  <div className="relative">
                    <form onSubmit={handleSearchSubmit}>
                      <div className="flex items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                        <Search className="h-5 w-5 text-slate-500 dark:text-slate-400 ml-3" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border-0 bg-transparent py-3 pl-3 pr-10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-0 sm:text-sm"
                          placeholder="Search for customers, appointments, requests..."
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setIsSearchOpen(false)}
                          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </form>
                    
                    {/* Search Results */}
                    <div className="py-3 px-3">
                      {isSearching ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : searchResults && searchResults.length > 0 ? (
                        <div className="space-y-1">
                          {searchResults.map((result, index) => (
                            <button
                              key={index}
                              type="button"
                              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                              onClick={() => handleSelectSearchResult(result)}
                            >
                              {result.type === 'customer' ? (
                                <Users className="h-4 w-4 mr-2 text-blue-500" />
                              ) : result.type === 'appointment' ? (
                                <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                              ) : (
                                <Mail className="h-4 w-4 mr-2 text-violet-500" />
                              )}
                              <div className="flex-1 text-left">
                                <div className="font-medium">{result.title || result.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : searchQuery && !isSearching ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          No results found
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                            Try searching for
                          </p>
                          <div className="space-y-1">
                            {[
                              { text: "Customers", icon: <Users className="h-4 w-4" /> },
                              { text: "Appointments", icon: <Calendar className="h-4 w-4" /> },
                              { text: "New requests", icon: <Mail className="h-4 w-4" /> }
                            ].map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                onClick={() => {
                                  setSearchQuery(suggestion.text);
                                  setSearchTerm(suggestion.text);
                                }}
                              >
                                <span className="mr-2 text-slate-500 dark:text-slate-400">
                                  {suggestion.icon}
                                </span>
                                {suggestion.text}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Quick links - Optional */}
                    <div className="py-3 px-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Quick links</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Customers', icon: <Users className="h-4 w-4" />, path: '/dashboard/customers' },
                          { name: 'Calendar', icon: <Calendar className="h-4 w-4" />, path: '/dashboard/appointments' },
                          { name: 'Requests', icon: <Mail className="h-4 w-4" />, path: '/dashboard/requests' },
                          { name: 'Analytics', icon: <BarChart2 className="h-4 w-4" />, path: '/dashboard/analytics' },
                        ].map((item, index) => (
                          <Link
                            key={index}
                            href={item.path}
                            className="flex items-center rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                            onClick={() => setIsSearchOpen(false)}
                          >
                            <span className="mr-2 text-slate-500 dark:text-slate-400">{item.icon}</span>
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default DashboardHeader;
