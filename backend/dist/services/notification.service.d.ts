export interface NotificationOptions {
    userId: number | null;
    type: string;
    title: string;
    message: string;
    referenceId?: number | null;
    referenceType?: string | null;
}
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
export interface NotificationQueryOptions {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string | null;
}
export interface NotificationResults {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
}
declare class NotificationService {
    create(options: NotificationOptions): Promise<{
        id: number;
        success: boolean;
    }>;
    getNotifications(userId: number, options?: NotificationQueryOptions): Promise<NotificationResults>;
    markAsRead(userId: number, notificationIds: number | number[]): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    markAllAsRead(userId: number): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    private mapNotificationType;
    private generateNotificationLink;
}
export declare function getUnreadNotificationsCount(userId: number): Promise<number>;
export declare const notificationService: NotificationService;
export default notificationService;
