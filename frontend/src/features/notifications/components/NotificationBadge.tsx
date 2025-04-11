'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import NotificationList from './NotificationList';

interface NotificationBadgeProps {
  className?: string;
  iconOnly?: boolean;
}

/**
 * Benachrichtigungssymbol mit Zähler und Dropdown
 * 
 * Zeigt die Anzahl der ungelesenen Benachrichtigungen an und öffnet bei Klick eine Liste
 */
export default function NotificationBadge({ className = '', iconOnly = false }: NotificationBadgeProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { unreadCount, fetchUnreadCount } = useNotifications({
    autoFetch: false,
    unreadOnly: true,
    pollInterval: 60000, // Aktualisiere Zähler jede Minute
  });

  // Dropdown schließen, wenn außerhalb geklickt wird
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Ungelesene Benachrichtigungen beim ersten Rendern und nach Badge-Klick abrufen
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, dropdownOpen]);

  // Badge-Klick-Handler
  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Badge mit Counter */}
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 relative"
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-5 w-5" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-5 h-5 flex items-center justify-center bg-green-600 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Zähler-Text (optional) */}
      {!iconOnly && unreadCount > 0 && (
        <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
          {unreadCount}
        </span>
      )}

      {/* Dropdown-Benachrichtigungsliste */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg z-50 overflow-hidden">
          <NotificationList 
            limit={5} 
            compact={true} 
            onClose={() => setDropdownOpen(false)} 
          />
        </div>
      )}
    </div>
  );
}