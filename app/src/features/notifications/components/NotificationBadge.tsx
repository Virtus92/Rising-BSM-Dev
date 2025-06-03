'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import NotificationDropdown from './NotificationDropdown';
import { Button } from '@/shared/components/ui/button';

interface NotificationBadgeProps {
  className?: string;
  iconOnly?: boolean;
}

/**
 * Notification icon with counter and dropdown
 * 
 * Shows the number of unread notifications and opens a list when clicked
 * Only fetches notifications when authenticated
 */
export default function NotificationBadge({ className = '', iconOnly = false }: NotificationBadgeProps) {
  // IMPORTANT: Always maintain the same hook ordering in every render
  
  // State hooks first
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Auth context
  const { isAuthenticated, user } = useAuth();
  
  // Refs for tracking state that shouldn't trigger re-renders
  const notificationsInitializedRef = useRef(false);
  const authReadyRef = useRef(false);
  const isMountedRef = useRef(false);
  
  // Always create the notifications hook - never conditionally render hooks
  // Control data fetching with the autoFetch parameter instead
  const notifications = useNotifications({
    limit: dropdownOpen ? 10 : 10, // Always fetch 10 to get accurate count
    unreadOnly: false, // Always fetch all to see both read and unread
    autoFetch: shouldFetch,
    pollInterval: 300000 // 5 minutes
  });
  
  // Use useMemo for derived state to avoid unnecessary recalculations
  const unreadCount = useMemo(() => {
    return notifications?.unreadCount ?? 0;
  }, [notifications]);

  // Mark component as mounted so we know setup is complete
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Only start fetching notifications when auth is ready
  useEffect(() => {
    // Set auth ready flag when we have a definitive answer
    if (!authReadyRef.current && (isAuthenticated === true || isAuthenticated === false)) {
      authReadyRef.current = true;
    }
    
    // Don't attempt fetching if not authenticated
    if (!isAuthenticated || !user) {
      if (shouldFetch) {
        setShouldFetch(false);
      }
      return;
    }
    
    // Prevent duplicate initialization
    if (notificationsInitializedRef.current) return;
    
    // Small delay to prevent immediate fetching on mount
    const timer = setTimeout(() => {
      if (isMountedRef.current && isAuthenticated && user) {
        setShouldFetch(true);
        notificationsInitializedRef.current = true;
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, shouldFetch]);

  // Badge click handler - not a hook so can be defined after all hooks
  const toggleDropdown = () => {
    if (!isAuthenticated || !user) return;
    
    const newState = !dropdownOpen;
    setDropdownOpen(newState);
    
    // When opening dropdown, refetch to get the full list
    if (newState && notifications && typeof notifications.refetch === 'function') {
      // Small timeout to allow the dropdown to open before fetching
      setTimeout(() => {
        if (isMountedRef.current) {
          notifications.refetch();
        }
      }, 50);
    }
  };

  // Early return if not authenticated - after all hooks have been called
  if (!isAuthenticated || !authReadyRef.current) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Badge with counter */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        className="relative"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown notification list */}
      {dropdownOpen && isAuthenticated && (
        <div className="absolute md:right-0 right-1/2 md:transform-none transform translate-x-1/2 mt-2 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg z-50 overflow-hidden">
          <NotificationDropdown 
            notifications={notifications}
            onClose={() => setDropdownOpen(false)}
          />
        </div>
      )}
    </div>
  );
}