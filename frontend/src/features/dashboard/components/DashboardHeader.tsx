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
import { Button } from '@/shared/components/ui/button';
import { NotificationClient } from '@/infrastructure/api/NotificationClient';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * Props for the NotificationItem component
 */
interface NotificationItemProps {
  /**
   * The notification to display
   */
  notification: NotificationResponseDto;
  
  /**
   * Callback for marking as read
   */
  onMarkAsRead: (id: number) => void;
  
  /**
   * Function to determine the URL based on the notification
   */
  getNotificationUrl: (notification: NotificationResponseDto) => string;
  
  /**
   * Function to determine the icon based on the notification type
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
      className={`px-4 py-2 hover:bg-accent block ${!notification.isRead ? 'bg-muted' : ''}`}
    >
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 bg-primary rounded-full ml-2 mt-1.5" aria-hidden="true"></span>
            )}
          </div>
          {notification.message && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(notification.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    </Link>
  );
});

NotificationItem.displayName = 'NotificationItem';

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
 * Main component for the dashboard header
 * 
 * Displays navigation, user profile, notifications, and theme toggle
 */
const DashboardHeader = ({ setSidebarOpen }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const { toast } = useToast();
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
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
        // Ensure data is an array
        const notificationArray = Array.isArray(response.data) ? response.data : [];
        setNotifications(notificationArray);
        // Count unread notifications
        const unread = notificationArray.filter(n => !n.isRead).length;
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
          // Use a more robust approach to handle potential server errors
          const response = await NotificationClient.getNotifications({ unreadOnly: true });
          if (response.success && response.data) {
            // Ensure data is an array
            const notificationArray = Array.isArray(response.data) ? response.data : [];
            setUnreadCount(notificationArray.length);
          }
        } catch (error) {
          // Log error but don't disrupt the UI
          console.error('Error updating notification counter:', error);
          // Don't change the unread count on error - keep the previous value
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
    <header className="bg-background border-b shadow-sm h-16 sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Logo and Mobile Menu */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-primary">
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
              className="py-1.5 pl-9 pr-2 rounded-md bg-background border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-40 lg:w-60"
              aria-label="Suche"
            />
            <Search className="h-4 w-4 text-muted-foreground absolute left-3" aria-hidden="true" />
          </div>
          
          {/* Notifications */}
          <div className="relative" id="notifications-dropdown">
            <Button
              variant="ghost"
              size="icon"
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
            </Button>
            
            {isNotificationsOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-card border rounded-md shadow-lg py-1 z-50"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="notifications-menu"
              >
                <div className="px-4 py-2 border-b flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Benachrichtigungen</h3>
                  
                  {notifications.length > 0 && unreadCount > 0 && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-7 px-2"
                      aria-label="Alle als gelesen markieren"
                    >
                      <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                      Alle lesen
                    </Button>
                  )}
                </div>
                
                <div className="max-h-72 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-4">
                      <div className="animate-pulse flex flex-col space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-full mt-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </div>
                  ) : notificationError ? (
                    <div className="px-4 py-4 text-center">
                      <p className="text-sm text-red-500">{notificationError}</p>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={loadNotifications}
                        className="mt-2 text-xs"
                      >
                        Erneut versuchen
                      </Button>
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
                      <p className="text-sm text-muted-foreground">Keine Benachrichtigungen</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t">
                    <Link
                      href="/dashboard/notifications"
                      className="text-sm font-medium flex items-center justify-between"
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
          <Button 
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Zum dunklen Design wechseln' : 'Zum hellen Design wechseln'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Sun className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
          
          {/* Profile */}
          <div className="relative" id="profile-dropdown">
            <Button 
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full p-0"
              onClick={toggleProfile}
              aria-label="Profilmenü öffnen"
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
            >
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <span className="text-sm font-medium" aria-hidden="true">{userInitials}</span>
              </div>
            </Button>
            
            {isProfileOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-card border rounded-md shadow-lg py-1 z-50"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="profile-menu"
              >
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold">
                    {user?.name || 'Benutzer'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Mitarbeiter'}
                  </p>
                </div>
                
                <ul role="none" className="py-1">
                  <li role="none">
                    <Link 
                      href="/dashboard/me" 
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
                      Profil
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      href="/dashboard/settings" 
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
                      Einstellungen
                    </Link>
                  </li>
                  <li role="none" className="border-t mt-1 pt-1">
                    <Button 
                      variant="ghost"
                      className="flex items-center w-full px-4 py-2 text-sm justify-start font-normal hover:bg-accent rounded-none"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
                      Abmelden
                    </Button>
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
