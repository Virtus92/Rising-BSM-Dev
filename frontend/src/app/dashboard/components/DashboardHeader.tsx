'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, Search, Menu, Moon, Sun, User, LogOut, X, Check, 
  Clock, AlarmClock, Calendar, FileText, AlertCircle, Info
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '@/lib/api/notifications';

const DashboardHeader = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Zustand für Benachrichtigungen
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Benachrichtigungen laden
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setNotificationError(null);
        const response = await getNotifications();
        
        if (response.success && response.data) {
          setNotifications(response.data.notifications || []);
          // Ungelesene Benachrichtigungen zählen
          const unread = response.data.notifications.filter(n => !n.read).length;
          setUnreadCount(unread);
        } else {
          setNotificationError('Fehler beim Laden der Benachrichtigungen');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benachrichtigungen:', error);
        setNotificationError('Fehler beim Laden der Benachrichtigungen');
      } finally {
        setLoading(false);
      }
    };
    
    // Benachrichtigungen laden, wenn das Dropdown geöffnet wird
    if (isNotificationsOpen) {
      loadNotifications();
    }
  }, [isNotificationsOpen]);
  
  // Benachrichtigung als gelesen markieren
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await markNotificationAsRead(notificationId);
      
      if (response.success) {
        // Benachrichtigungsstatus in der UI aktualisieren
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Ungelesenen Zähler aktualisieren
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigung konnte nicht als gelesen markiert werden',
        variant: 'error'
      });
    }
  };
  
  // Alle Benachrichtigungen als gelesen markieren
  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      
      if (response.success) {
        // Alle Benachrichtigungen in der UI als gelesen markieren
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );
        
        // Ungelesenen Zähler zurücksetzen
        setUnreadCount(0);
        
        toast({
          title: 'Erfolg',
          description: 'Alle Benachrichtigungen wurden als gelesen markiert',
          variant: 'success'
        });
      }
    } catch (error) {
      console.error('Fehler beim Markieren aller als gelesen:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigungen konnten nicht als gelesen markiert werden',
        variant: 'error'
      });
    }
  };
  
  // Icon für die jeweilige Benachrichtigungsart
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'anfrage':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'termin':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'projekt':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'warnung':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'system':
        return <AlarmClock className="h-4 w-4 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Ziel-URL für Benachrichtigungen ermitteln
  const getNotificationUrl = (notification: Notification): string => {
    if (notification.link) return notification.link;
    
    // Standardlinks basierend auf Referenztyp und ID
    if (notification.referenceType && notification.referenceId) {
      switch (notification.referenceType) {
        case 'kunde':
          return `/dashboard/customers/${notification.referenceId}`;
        case 'projekt':
          return `/dashboard/projects/${notification.referenceId}`;
        case 'termin':
          return `/dashboard/appointments#appointment-${notification.referenceId}`;
        case 'anfrage':
          return `/dashboard/requests/${notification.referenceId}`;
        default:
          return '#';
      }
    }
    
    return '#';
  };
  
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
    try {
      await logout();
      router.push('/auth/login');
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Sie wurden erfolgreich abgemeldet.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Logout failed', error);
      toast({
        title: 'Fehler bei der Abmeldung',
        description: 'Bitte versuchen Sie es erneut.',
        variant: 'error'
      });
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm h-16">
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
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Benachrichtigungen</h3>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-4">
                      <div className="animate-pulse flex flex-col space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  ) : notificationError ? (
                    <div className="px-4 py-4 text-center">
                      <p className="text-sm text-red-500 dark:text-red-400">{notificationError}</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div>
                      {notifications.map((notification) => (
                        <Link 
                          key={notification.id} 
                          href={getNotificationUrl(notification)}
                          onClick={() => {
                            if (!notification.read) {
                              handleMarkAsRead(notification.id);
                            }
                          }}
                          className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 block ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="mr-2 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-gray-800 dark:text-gray-200`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1.5"></span>
                                )}
                              </div>
                              {notification.message && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Keine Benachrichtigungen</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && unreadCount > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700">
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium flex items-center"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Alle als gelesen markieren
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Mitarbeiter'}
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