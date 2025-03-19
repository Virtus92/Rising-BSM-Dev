/**
 * Status information with label and class name
 */
export interface StatusInfo {
    label: string;
    className: string;
}
/**
 * Notification item interface
 */
export interface NotificationItem {
    id: number;
    title: string;
    type: string;
    icon: string;
    time: string;
    link: string;
}
/**
 * Notifications result interface
 */
export interface NotificationsResult {
    items: NotificationItem[];
    unreadCount: number;
    totalCount: number;
}
/**
 * Filter options interface
 */
export interface FilterOptions {
    page?: number;
    limit?: number;
    sort?: {
        field: string;
        direction: string;
    };
    start_date?: Date;
    end_date?: Date;
    search?: string;
    status?: string;
    type?: string;
    [key: string]: any;
}
/**
 * Get status information for a request
 * @param status Status code
 * @returns Status label and class name
 */
export declare const getAnfrageStatusInfo: (status: string) => StatusInfo;
/**
 * Get status information for an appointment
 * @param status Status code
 * @returns Status label and class name
 */
export declare const getTerminStatusInfo: (status: string) => StatusInfo;
/**
 * Get status information for a project
 * @param status Status code
 * @returns Status label and class name
 */
export declare const getProjektStatusInfo: (status: string) => StatusInfo;
/**
 * Get status information for a user
 * @param status Status code
 * @returns Status label and class name
 */
export declare const getBenutzerStatusInfo: (status: string) => StatusInfo;
/**
 * Generate unique ID
 * @param length Length of ID
 * @returns Random ID
 */
export declare const generateId: (length?: number) => string;
/**
 * Get notifications for current user
 * @param req Express request object
 * @returns Notifications with unread count
 */
export declare const getNotifications: (req: any) => Promise<NotificationsResult>;
/**
 * Count new requests
 * @returns Count of new requests
 */
export declare const getNewRequestsCount: () => Promise<number>;
/**
 * Parse query filters
 * @param query Express req.query object
 * @param defaults Default filter values
 * @returns Parsed filters
 */
export declare const parseFilters: (query: Record<string, any>, defaults?: FilterOptions) => FilterOptions;
/**
 * Sanitize a string for use in SQL LIKE clause
 * @param str String to sanitize
 * @returns Sanitized string
 */
export declare const sanitizeLikeString: (str: string | null | undefined) => string;
/**
 * Truncate HTML string and close any open tags
 * @param html HTML string to truncate
 * @param maxLength Maximum length
 * @returns Truncated HTML with closed tags
 */
export declare const truncateHtml: (html: string | null | undefined, maxLength: number) => string;
/**
 * Group array by key
 * @param array Array to group
 * @param key Property to group by
 * @returns Grouped object
 */
export declare const groupBy: <T extends Record<string, any>>(array: T[], key: keyof T) => Record<string, T[]>;
