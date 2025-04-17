'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Menu, Moon, Sun, User, LogOut, X, Check, 
  Clock, AlarmClock, Calendar, FileText, AlertCircle, Info,
  Settings, ChevronRight
} from 'lucide-react';
import NotificationBadge from '@/features/notifications/components/NotificationBadge';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/components/ui/button';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { getLogger } from '@/infrastructure/common/logging';

// Removed notification item props as we're using the NotificationBadge component

// Removed NotificationItem component as we're using the NotificationBadge component instead

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
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Notification handling is now delegated to the NotificationBadge component
  
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
  
  // Theme toggle callback - improved to use next-themes properly
  const toggleTheme = useCallback(async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      
      // Use next-themes compatible approach
      if (typeof window !== 'undefined') {
        // First, update the class on the root element
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          // Also set data-attribute as next-themes might be looking for this
          document.documentElement.setAttribute('class', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
          // Clear class attribute while preserving other classes
          document.documentElement.classList.remove('dark');
        }
        
        // Set for localStorage persistence
        localStorage.setItem('theme', newTheme);
      }
      
      // Update theme in global settings if available
      if (settings && settings.updateSetting) {
        await settings.updateSetting('theme', newTheme);
      }
      
      // Log success for debugging
      console.log(`Theme toggled to ${newTheme}`);
    } catch (error) {
      console.error('Failed to toggle theme:', error);
      toast({
        title: 'Fehler',
        description: 'Designeinstellung konnte nicht gespeichert werden',
        variant: 'error'
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close profile dropdown if clicked outside
      if (isProfileOpen && 
          event.target instanceof Node && 
          !document.getElementById('profile-dropdown')?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);
  
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
            <NotificationBadge />
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
