import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { Notification } from '@/domain/entities/Notification';

/**
 * Extended pagination result with cursor-based pagination information
 */
export interface ExtendedPaginationResult<T> extends PaginationResult<T> {
  /**
   * Whether there are more items to load
   */
  hasMore?: boolean;
  
  /**
   * Cursor for fetching the next page
   */
  nextCursor?: string | null;
}

/**
 * Extended pagination result specifically for notifications
 */
export type NotificationPaginationResult = ExtendedPaginationResult<Notification>;
