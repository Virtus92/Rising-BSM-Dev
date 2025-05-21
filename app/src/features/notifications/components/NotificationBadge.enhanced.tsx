'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationContext } from '../providers/NotificationProvider';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { NotificationVirtualList } from './NotificationVirtualList';
import { useAuth } from '@/features/auth/providers/AuthProvider';

interface NotificationBadgeProps {
  className?: string;
  maxHeight?: number;
}

/**
 * Modern notification badge component that uses the NotificationContext
 * Shows the unread count and opens a dropdown with notifications
 */
export function NotificationBadge({ className = '', maxHeight = 400 }: NotificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { state, fetchNotifications } = useNotificationContext();
  const { isAuthenticated, user } = useAuth();
  const { unreadCount } = state;
  
  // Track whether initial fetch has been done
  const initialFetchDone = useRef(false);
  
  // Fetch notifications when badge is opened
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated, user, fetchNotifications]);
  
  // Initial fetch on mount
  useEffect(() => {
    if (!initialFetchDone.current && isAuthenticated && user) {
      // Set a small delay to avoid too many concurrent requests during app init
      const timer = setTimeout(() => {
        fetchNotifications(true);
        initialFetchDone.current = true;
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, fetchNotifications]);
  
  // Don't render if not authenticated
  if (!isAuthenticated || !user) return null;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          className={`relative ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span 
              className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={5}
      >
        <NotificationVirtualList 
          showHeader={true}
          showControls={true}
          height={maxHeight}
          limit={5}
          onlyUnread={false}
        />
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBadge;
