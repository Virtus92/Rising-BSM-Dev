"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
exports.getUnreadNotificationsCount = getUnreadNotificationsCount;
const prisma_utils_1 = require("../utils/prisma.utils");
const formatters_1 = require("../utils/formatters");
const cache_service_1 = require("./cache.service");
const config_1 = __importDefault(require("../config"));
class NotificationService {
    async create(options) {
        try {
            const { userId, type, title, message, referenceId = null, referenceType = null } = options;
            const notification = await prisma_utils_1.prisma.notification.create({
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
    async getNotifications(userId, options = {}) {
        try {
            const { limit = 10, offset = 0, unreadOnly = false, type = null } = options;
            const cacheKey = `notifications_${userId}_${limit}_${offset}_${unreadOnly}_${type || 'all'}`;
            if (config_1.default.CACHE_ENABLED) {
                const cachedResult = cache_service_1.cache.get(cacheKey);
                if (cachedResult) {
                    return cachedResult;
                }
            }
            const where = {
                userId,
                ...(unreadOnly ? { read: false } : {}),
                ...(type ? { type } : {})
            };
            const [notifications, totalCount] = await Promise.all([
                prisma_utils_1.prisma.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: offset
                }),
                prisma_utils_1.prisma.notification.count({ where })
            ]);
            const unreadCount = await prisma_utils_1.prisma.notification.count({
                where: {
                    userId,
                    read: false
                }
            });
            const formattedNotifications = notifications.map((notification) => ({
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
                total: totalCount,
                unreadCount
            };
            if (config_1.default.CACHE_ENABLED) {
                cache_service_1.cache.set(cacheKey, result, 30);
            }
            return result;
        }
        catch (error) {
            console.error('Notification retrieval error:', error);
            throw error;
        }
    }
    async markAsRead(userId, notificationIds) {
        try {
            const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
            const result = await prisma_utils_1.prisma.notification.updateMany({
                where: {
                    userId,
                    id: { in: ids }
                },
                data: {
                    read: true
                }
            });
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
    async markAllAsRead(userId) {
        try {
            const result = await prisma_utils_1.prisma.notification.updateMany({
                where: {
                    userId,
                    read: false
                },
                data: {
                    read: true
                }
            });
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
async function getUnreadNotificationsCount(userId) {
    try {
        return await prisma_utils_1.prisma.notification.count({
            where: {
                userId,
                read: false
            }
        });
    }
    catch (error) {
        console.error('Error getting unread notification count:', error);
        return 0;
    }
}
exports.notificationService = new NotificationService();
exports.default = exports.notificationService;
//# sourceMappingURL=notification.service.js.map