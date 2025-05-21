/**
 * Notifications Feature Module
 * 
 * This file exports all notification-related functionality
 */

// Export API functionality
export * from './api';

// Export library functionality (clients, entities, services)
export * from './lib';

// Export hooks, components, and utilities
export * from './hooks';
// Export enhanced hooks
export { useNotifications as useNotificationsNew } from './hooks/useNotifications.new';

// Export components
export * from './components';
// Export enhanced components
export { NotificationVirtualList } from './components/NotificationVirtualList';
export { NotificationBadge as EnhancedNotificationBadge } from './components/NotificationBadge.enhanced';

// Export utilities
export * from './utils';

// Export context and providers
export * from './providers/NotificationProvider';

// Export layouts
export * from './layouts/NotificationLayout';
