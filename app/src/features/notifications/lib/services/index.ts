/**
 * Unified export for NotificationService that works on both client and server
 */

import { INotificationService } from '@/domain/services/INotificationService';

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get the appropriate implementation of NotificationService based on environment
 */
export const NotificationService = isBrowser
  ? require('./NotificationService.client').NotificationService
  : require('./NotificationService.server').NotificationService;

// Re-export for convenience
export default NotificationService;
