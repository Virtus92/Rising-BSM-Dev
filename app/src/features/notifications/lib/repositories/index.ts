/**
 * Unified export for NotificationRepository that works on both client and server
 */

import { INotificationRepository } from '@/domain/repositories/INotificationRepository';

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get the appropriate implementation of NotificationRepository based on environment
 */
export const NotificationRepository = isBrowser
  ? require('./NotificationRepository.client').NotificationRepository
  : require('./NotificationRepository.server').NotificationRepository;

// Re-export for convenience
export default NotificationRepository;
