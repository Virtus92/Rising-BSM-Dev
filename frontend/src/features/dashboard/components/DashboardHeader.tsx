'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, Search, Menu, Moon, Sun, User, LogOut, X, Check, 
  Clock, AlarmClock, Calendar, FileText, AlertCircle, Info,
  Settings, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useToast } from '@/shared/hooks/useToast';
import { NotificationClient } from '@/infrastructure/api/NotificationClient';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * Props für die NotificationItem-Komponente
 */
interface NotificationItemProps {
  /**
   * Die Benachrichtigung, die angezeigt werden soll
   */
  notification: NotificationResponseDto;
  
  /**
   * Callback für das Markieren als gelesen
   */
  onMarkAsRead: (id: number) => void;
  
  /**
   * Funktion für die Bestimmung der URL basierend auf der Benachrichtigung
   */
  getNotificationUrl: (notification: NotificationResponseDto) => string;
  
  /**
   * Funktion für die Bestimmung des Icons basierend auf dem Benachrichtigungstyp
   */
  getNotificationIcon: (type: NotificationType | string) => JSX.Element;
};

// Memo-ized notification component for better performance
const NotificationItem = memo(({ 
  notification, 
  onMarkAsRead, 
  getNotificationUrl,
  getNotificationIcon 
}: NotificationItemProps) => {
  return (
    <Link 
      href={getNotificationUrl(notification)}
      onClick={() => {
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
      }}
      className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 block ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''} text-gray-800 dark:text-gray-200`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1.5" aria-hidden="true"></span>
            )}
          </div>
          {notification.message && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    </Link>
  );
});

NotificationItem.displayName = 'NotificationItem';

/**
 * Hauptkomponente für den Dashboard-Header
 * 
 * Zeigt die Navigation, Benutzerprofil, Benachrichtigungen und Theme-Toggle an
 */
const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const { toast } = useToast();
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Callback for loading notifications
  const loadNotifications = useCallback(async () => {
    if (!isNotificationsOpen) return;
    
    try {
      setLoading(true);
      setNotificationError(null);
      const response = await NotificationClient.getNotifications();
      
      if (response.success && response.data) {
        setNotifications(response.data || []);
        // Count unread notifications
        const unread = response.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        setNotificationError(response.message || 'Fehler beim Laden der Benachrichtigungen');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error);
      setNotificationError('Fehler beim Laden der Benachrichtigungen');
    } finally {
      setLoading(false);
    }
  }, [isNotificationsOpen]);
  
  // Load notifications when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen) {
      loadNotifications();
    }
  }, [isNotificationsOpen, loadNotifications]);
  
  // Periodic unread count update
  useEffect(() => {
    // Update unread count every minute when logged in
    const intervalId = setInterval(async () => {
      if (user) {
        try {
          const response = await NotificationClient.getNotifications({ unreadOnly: true });
          if (response.success && response.data) {
            setUnreadCount(response.data.length);
          }
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Benachrichtigungszählers:', error);
        }
      }
    }, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  // Callback for marking a notification as read
  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await NotificationClient.markNotificationAsRead(notificationId);
      
      if (response.success) {
        // Update notification status in UI
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread counter
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
  }, [toast]);
  
  // Callback for marking all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const response = await NotificationClient.markAllNotificationsAsRead();
      
      if (response.success) {
        // Mark all notifications as read in the UI
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread counter
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
  }, [toast]);
  
  // Get notification icon (memoized)
  const getNotificationIcon = useCallback((type: NotificationType | string) => {
    switch (type) {
      case NotificationType.MESSAGE:
        return <FileText className="h-4 w-4 text-purple-500" aria-hidden="true" />;
      case NotificationType.APPOINTMENT:
        return <Calendar className="h-4 w-4 text-blue-500" aria-hidden="true" />;
      case NotificationType.PROJECT:
        return <Clock className="h-4 w-4 text-green-500" aria-hidden="true" />;
      case NotificationType.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />;
      case NotificationType.SYSTEM:
        return <AlarmClock className="h-4 w-4 text-amber-500" aria-hidden="true" />;
      case NotificationType.INFO:
      default:
        return <Info className="h-4 w-4 text-gray-500" aria-hidden="true" />;
    }
  }, []);
  
  // Get notification URL (memoized)
  const getNotificationUrl = useCallback((notification: NotificationResponseDto): string => {
    if (notification.link) return notification.link;
    
    // Default links based on type
    switch (notification.type) {
      case NotificationType.APPOINTMENT:
        return `/dashboard/appointments`;
      case NotificationType.PROJECT:
        return `/dashboard/projects`;
      case NotificationType.TASK:
        return `/dashboard/tasks`;
      case NotificationType.MESSAGE:
        return `/dashboard/messages`;
      default:
        return '#';
    }
  }, []);
  
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
      
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Update theme in global settings if available
      if (settings && settings.updateSetting) {
        await settings.updateSetting('theme', newTheme);
      }
    } catch (error) {
      console.error('Failed to toggle theme:', error);
      toast({
        title: 'Fehler',
        description: 'Designeinstellung konnte nicht gespeichert werden',
        variant: 'error'
      });
    }
  }, [theme, settings, toast]);
  
  // Toggle dropdowns
  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen(!isNotificationsOpen);
    // Close other dropdowns
    if (isProfileOpen) setIsProfileOpen(false);
  }, [isNotificationsOpen, isProfileOpen]);
  
  const toggleProfile = useCallback(() => {
    setIsProfileOpen(!isProfileOpen);
    // Close other dropdowns
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  }, [isProfileOpen, isNotificationsOpen]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    const logger = getLogger();
    
    try {
      logger.debug('User initiating logout');
      await logout();
      
      router.push('/auth/login');
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Sie wurden erfolgreich abgemeldet.',
        variant: 'success'
      });
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error as string | Error | Record<string, any>);
      
      toast({
        title: 'Fehler bei der Abmeldung',
        description: 'Bitte versuchen Sie es erneut.',
        variant: 'error'
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close profile dropdown if clicked outside
      if (isProfileOpen && 
          event.target instanceof Node && 
          !document.getElementById('profile-dropdown')?.contains(event.target)) {
        setIsProfileOpen(false);
      }
      
      // Close notifications dropdown if clicked outside
      if (isNotificationsOpen && 
          event.target instanceof Node && 
          !document.getElementById('notifications-dropdown')?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotificationsOpen]);
  
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm h-16 sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Logo and Mobile Menu */}
        <div className="flex items-center">
          <button 
            className="block md:hidden mr-3"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600 dark:text-gray-300" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" aria-hidden="true" />
            )}
          </button>
          
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-green-600 dark:text-green-500">
              {settings?.companyName || 'Rising BSM'}
            </span>
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
              aria-label="Suche"
            />
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 absolute left-3" aria-hidden="true" />
          </div>
          
          {/* Notifications */}
          <div className="relative" id="notifications-dropdown">
            <button 
              className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 p-1.5 rounded-full relative"
              onClick={toggleNotifications}
              aria-label={`Benachrichtigungen ${unreadCount > 0 ? `(${unreadCount} ungelesen)` : ''}`}
              aria-haspopup="true"
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {isNotificationsOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="notifications-menu"
              >
                <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Benachrichtigungen</h3>
                  
                  {notifications.length > 0 && unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium flex items-center"
                      aria-label="Alle als gelesen markieren"
                    >
                      <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                      Alle lesen
                    </button>
                  )}
                </div>
                
                <div className="max-h-72 overflow-y-auto">
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
                      <button 
                        onClick={loadNotifications}
                        className="mt-2 text-xs text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium"
                      >
                        Erneut versuchen
                      </button>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div role="list">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          getNotificationUrl={getNotificationUrl}
                          getNotificationIcon={getNotificationIcon}
                        />
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
                    <Link
                      href="/dashboard/notifications"
                      className="text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium flex items-center justify-between"
                    >
                      <span>Alle Benachrichtigungen anzeigen</span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button 
            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 p-1.5 rounded-full"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Zum dunklen Design wechseln' : 'Zum hellen Design wechseln'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Sun className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          
          {/* Profile */}
          <div className="relative" id="profile-dropdown">
            <button 
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500"
              onClick={toggleProfile}
              aria-label="Profilmenü öffnen"
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
            >
              <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <span className="text-sm font-medium" aria-hidden="true">{userInitials}</span>
              </div>
            </button>
            
            {isProfileOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="profile-menu"
              >
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
                
                <ul role="none">
                  <li role="none">
                    <Link 
                      href="/dashboard/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      Profil
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      Einstellungen
                    </Link>
                  </li>
                  <li role="none">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 w-full text-left"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" aria-hidden="true" />
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
