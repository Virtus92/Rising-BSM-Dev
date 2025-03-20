export interface StatusInfo {
    label: string;
    className: string;
}
export interface NotificationItem {
    id: number;
    title: string;
    type: string;
    icon: string;
    time: string;
    link: string;
}
export interface NotificationsResult {
    items: NotificationItem[];
    unreadCount: number;
    totalCount: number;
}
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
export declare const getAnfrageStatusInfo: (status: string) => StatusInfo;
export declare const getTerminStatusInfo: (status: string) => StatusInfo;
export declare const getProjektStatusInfo: (status: string) => StatusInfo;
export declare const getBenutzerStatusInfo: (status: string) => StatusInfo;
export declare const generateId: (length?: number) => string;
export declare const getNotifications: (req: any) => Promise<NotificationsResult>;
export declare const getNewRequestsCount: () => Promise<number>;
export declare const parseFilters: (query: Record<string, any>, defaults?: FilterOptions) => FilterOptions;
export declare const sanitizeLikeString: (str: string | null | undefined) => string;
export declare const truncateHtml: (html: string | null | undefined, maxLength: number) => string;
export declare const groupBy: <T extends Record<string, any>>(array: T[], key: keyof T) => Record<string, T[]>;
