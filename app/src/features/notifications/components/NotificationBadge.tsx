'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
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
 */
export default function NotificationBadge({ className = '', iconOnly = false }: NotificationBadgeProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Use notifications hook with polling for unread count
  const { unreadCount } = useNotifications({
    limit: 1, // Just need the count, not full notifications
    unreadOnly: true,
    autoFetch: true, // Let the hook handle data fetching
    pollInterval: 60000 // Check for new notifications every minute
  });

  // Badge click handler
  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

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
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg z-50 overflow-hidden">
          <NotificationDropdown 
            limit={5}
            onClose={() => setDropdownOpen(false)}
          />
        </div>
      )}
    </div>
  );
}