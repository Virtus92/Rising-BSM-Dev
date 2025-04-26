/**
 * Export all notification API routes
 */

// Named exports to avoid ambiguity
import { GET as GetNotifications } from './get-notifications-route';
import { GET as GetNotification } from './get-notification-route';
import { POST as CreateNotification } from './create-notification-route';
import { PUT as UpdateNotification } from './update-notification-route';
import { DELETE as DeleteNotification } from './delete-notification-route';
import { PATCH as ReadNotification } from './read-notification-route';
import { PATCH as ReadAllNotifications } from './read-all-notifications-route';

// Re-export with explicit names
export {
  GetNotifications,
  GetNotification,
  CreateNotification,
  UpdateNotification,
  DeleteNotification,
  ReadNotification,
  ReadAllNotifications
};

// Export specific HTTP methods
export const GET = GetNotifications;
export const POST = CreateNotification;
export const PUT = UpdateNotification;
export const DELETE = DeleteNotification;
export const PATCH = ReadNotification; // Note: We keep the first PATCH method for backward compatibility
