"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
/**
 * Notification Service
 * Manages notification creation, sending, and tracking
 */
const prisma_utils_1 = __importDefault(require("../utils/prisma.utils"));
const formatters_1 = require("../utils/formatters");
const cache_service_1 = require("./cache.service");
const config_1 = __importDefault(require("../config"));
/**
 * Class that manages creation and retrieval of notifications
 */
class NotificationService {
    /**
     * Create a new notification
     * @param options Notification details
     * @returns Created notification
     */
    async create(options) {
        try {
            const { userId, type, title, message, referenceId = null, referenceType = null } = options;
            // Insert notification into database
            const notification = await prisma_utils_1.default.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    referenceId,
                    referenceType,
                    read: false
                }
            });
            // Clear cache for this user
            if (userId) {
                cache_service_1.cache.delete(`notifications_${userId}`);
            }
            return {
                id: notification.id,
                success: true
            };
        }
        catch (error) {
            console.error('Notification creation error:', error);
            return { id: 0, success: false };
        }
    }
    /**
     * Get notifications for a user
     * @param userId User ID
     * @param options Filtering and pagination options
     * @returns Notifications and metadata
     */
    async getNotifications(userId, options = {}) {
        try {
            const { limit = 10, offset = 0, unreadOnly = false, type = null } = options;
            // Try to get from cache
            const cacheKey = `notifications_${userId}_${limit}_${offset}_${unreadOnly}_${type || 'all'}`;
            if (config_1.default.CACHE_ENABLED) {
                const cachedResult = cache_service_1.cache.get(cacheKey);
                if (cachedResult) {
                    return cachedResult;
                }
            }
            // Build Prisma where clause
            const where = {
                userId,
                ...(unreadOnly ? { read: false } : {}),
                ...(type ? { type } : {})
            };
            // Execute queries in parallel
            const [notifications, counts] = await Promise.all([
                // Get notifications
                prisma_utils_1.default.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: offset
                }),
                // Get counts
                prisma_utils_1.default.notification.groupBy({
                    by: [],
                    where,
                    _count: { _all: true },
                    having: {}
                })
            ]);
            // Get unread count
            const unreadCount = await prisma_utils_1.default.notification.count({
                where: {
                    userId,
                    read: false
                }
            });
            // Format notifications
            const formattedNotifications = notifications.map(notification => ({
                id: notification.id,
                type: this.mapNotificationType(notification.type),
                title: notification.title,
                message: notification.message,
                referenceId: notification.referenceId,
                referenceType: notification.referenceType,
                timestamp: (0, formatters_1.formatRelativeTime)(notification.createdAt),
                isRead: notification.read,
                link: this.generateNotificationLink(notification)
            }));
            const result = {
                notifications: formattedNotifications,
                total: counts.length > 0 ? counts[0]._count._all : 0,
                unreadCount
            };
            // Cache the result
            if (config_1.default.CACHE_ENABLED) {
                cache_service_1.cache.set(cacheKey, result, 30); // Cache for 30 seconds
            }
            return result;
        }
        catch (error) {
            console.error('Notification retrieval error:', error);
            throw error;
        }
    }
    /**
     * Mark notifications as read
     * @param userId User ID
     * @param notificationIds Notification ID(s)
     * @returns Update result
     */
    async markAsRead(userId, notificationIds) {
        try {
            // Normalize to array
            const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
            // Update notifications
            const result = await prisma_utils_1.default.notification.updateMany({
                where: {
                    userId,
                    id: { in: ids }
                },
                data: {
                    read: true,
                    updatedAt: new Date()
                }
            });
            // Clear cache for this user
            cache_service_1.cache.delete(`notifications_${userId}`);
            return {
                success: true,
                updatedCount: result.count
            };
        }
        catch (error) {
            console.error('Notification mark as read error:', error);
            return { success: false, updatedCount: 0 };
        }
    }
    /**
     * Mark all notifications as read for a user
     * @param userId User ID
     * @returns Update result
     */
    async markAllAsRead(userId) {
        try {
            const result = await prisma_utils_1.default.notification.updateMany({
                where: {
                    userId,
                    read: false
                },
                data: {
                    read: true,
                    updatedAt: new Date()
                }
            });
            // Clear cache for this user
            cache_service_1.cache.delete(`notifications_${userId}`);
            return {
                success: true,
                updatedCount: result.count
            };
        }
        catch (error) {
            console.error('Notification mark all as read error:', error);
            return { success: false, updatedCount: 0 };
        }
    }
    /**
     * Map notification type to user-friendly representation
     * @param type Notification type
     * @returns Mapped notification type
     */
    mapNotificationType(type) {
        const typeMap = {
            'anfrage': {
                key: 'request',
                label: 'Anfrage',
                icon: 'envelope',
                color: 'info'
            },
            'termin': {
                key: 'appointment',
                label: 'Termin',
                icon: 'calendar',
                color: 'primary'
            },
            'projekt': {
                key: 'project',
                label: 'Projekt',
                icon: 'briefcase',
                color: 'success'
            },
            'system': {
                key: 'system',
                label: 'System',
                icon: 'bell',
                color: 'warning'
            },
            'contact_confirmation': {
                key: 'contact_confirmation',
                label: 'Kontaktanfrage',
                icon: 'envelope-open',
                color: 'success'
            }
        };
        return typeMap[type] || {
            key: 'default',
            label: 'Benachrichtigung',
            icon: 'info-circle',
            color: 'secondary'
        };
    }
    /**
     * Generate notification link based on type
     * @param notification Notification object
     * @returns Notification link
     */
    generateNotificationLink(notification) {
        switch (notification.type) {
            case 'anfrage':
                return `/dashboard/requests/${notification.referenceId}`;
            case 'termin':
                return `/dashboard/termine/${notification.referenceId}`;
            case 'projekt':
                return `/dashboard/projekte/${notification.referenceId}`;
            case 'contact_confirmation':
                return `/dashboard/requests/${notification.referenceId}`;
            default:
                return '/dashboard/notifications';
        }
    }
}
// Export singleton instance
exports.notificationService = new NotificationService();
exports.default = exports.notificationService;
//# sourceMappingURL=notification.service.js.map