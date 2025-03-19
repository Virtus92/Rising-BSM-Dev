/**
 * Interface for notification creation options
 */
export interface NotificationOptions {
    userId: number | null;
    type: string;
    title: string;
    message: string;
    referenceId?: number | null;
    referenceType?: string | null;
}
/**
 * Interface for notification item in response
 */
export interface NotificationItem {
    id: number;
    type: {
        key: string;
        label: string;
        icon: string;
        color: string;
    };
    title: string;
    message: string | null;
    referenceId: number | null;
    referenceType: string | null;
    timestamp: string;
    isRead: boolean;
    link: string;
}
/**
 * Interface for notification retrieval options
 */
export interface NotificationQueryOptions {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string | null;
}
/**
 * Interface for notification results
 */
export interface NotificationResults {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
}
/**
 * Class that manages creation and retrieval of notifications
 */
declare class NotificationService {
    /**
     * Create a new notification
     * @param options Notification details
     * @returns Created notification
     */
    create(options: NotificationOptions): Promise<{
        id: number;
        success: boolean;
    }>;
    /**
     * Get notifications for a user
     * @param userId User ID
     * @param options Filtering and pagination options
     * @returns Notifications and metadata
     */
    getNotifications(userId: number, options?: NotificationQueryOptions): Promise<NotificationResults>;
    /**
     * Mark notifications as read
     * @param userId User ID
     * @param notificationIds Notification ID(s)
     * @returns Update result
     */
    markAsRead(userId: number, notificationIds: number | number[]): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    /**
     * Mark all notifications as read for a user
     * @param userId User ID
     * @returns Update result
     */
    markAllAsRead(userId: number): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    /**
     * Map notification type to user-friendly representation
     * @param type Notification type
     * @returns Mapped notification type
     */
    private mapNotificationType;
    /**
     * Generate notification link based on type
     * @param notification Notification object
     * @returns Notification link
     */
    private generateNotificationLink;
}
export declare const notificationService: NotificationService;
export default notificationService;
