"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = exports.truncateHtml = exports.sanitizeLikeString = exports.parseFilters = exports.getNewRequestsCount = exports.getNotifications = exports.generateId = exports.getBenutzerStatusInfo = exports.getProjektStatusInfo = exports.getTerminStatusInfo = exports.getAnfrageStatusInfo = void 0;
/**
 * Helper utilities
 * Common utility functions used across the application
 */
const cache_service_1 = require("../services/cache.service");
const db_service_bak_1 = require("../services/db.service.bak");
const prisma_utils_1 = __importDefault(require("./prisma.utils"));
/**
 * Get status information for a request
 * @param status Status code
 * @returns Status label and class name
 */
const getAnfrageStatusInfo = (status) => {
    const statusMap = {
        'neu': { label: 'Neu', className: 'warning' },
        'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
        'beantwortet': { label: 'Beantwortet', className: 'success' },
        'geschlossen': { label: 'Geschlossen', className: 'secondary' }
    };
    return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};
exports.getAnfrageStatusInfo = getAnfrageStatusInfo;
/**
 * Get status information for an appointment
 * @param status Status code
 * @returns Status label and class name
 */
const getTerminStatusInfo = (status) => {
    const statusMap = {
        'geplant': { label: 'Geplant', className: 'warning' },
        'bestaetigt': { label: 'Bestätigt', className: 'success' },
        'abgeschlossen': { label: 'Abgeschlossen', className: 'primary' },
        'storniert': { label: 'Storniert', className: 'secondary' }
    };
    return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};
exports.getTerminStatusInfo = getTerminStatusInfo;
/**
 * Get status information for a project
 * @param status Status code
 * @returns Status label and class name
 */
const getProjektStatusInfo = (status) => {
    const statusMap = {
        'neu': { label: 'Neu', className: 'info' },
        'in_bearbeitung': { label: 'In Bearbeitung', className: 'primary' },
        'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
        'storniert': { label: 'Storniert', className: 'secondary' }
    };
    return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};
exports.getProjektStatusInfo = getProjektStatusInfo;
/**
 * Get status information for a user
 * @param status Status code
 * @returns Status label and class name
 */
const getBenutzerStatusInfo = (status) => {
    const statusMap = {
        'aktiv': { label: 'Aktiv', className: 'success' },
        'inaktiv': { label: 'Inaktiv', className: 'secondary' },
        'gesperrt': { label: 'Gesperrt', className: 'danger' }
    };
    return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};
exports.getBenutzerStatusInfo = getBenutzerStatusInfo;
/**
 * Generate unique ID
 * @param length Length of ID
 * @returns Random ID
 */
const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};
exports.generateId = generateId;
/**
 * Get notifications for current user
 * @param req Express request object
 * @returns Notifications with unread count
 */
const getNotifications = async (req) => {
    if (!req.session || !req.session.user) {
        return { items: [], unreadCount: 0, totalCount: 0 };
    }
    try {
        const userId = req.session.user.id;
        const cacheKey = `notifications_${userId}`;
        // Try to get from cache first
        return await cache_service_1.cache.getOrExecute(cacheKey, async () => {
            // Get notifications using Prisma
            const notifications = await prisma_utils_1.default.notification.findMany({
                where: {
                    userId: Number(userId)
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });
            // Get unread count
            const unreadCount = await prisma_utils_1.default.notification.count({
                where: {
                    userId: Number(userId),
                    read: false
                }
            });
            // Get total count
            const totalCount = await prisma_utils_1.default.notification.count({
                where: {
                    userId: Number(userId)
                }
            });
            // Format notifications
            const items = notifications.map((n) => {
                const { formatRelativeTime } = require('./formatters');
                return {
                    id: n.id,
                    title: n.title,
                    type: n.type === 'anfrage' ? 'success' :
                        n.type === 'termin' ? 'primary' :
                            n.type === 'warnung' ? 'warning' : 'info',
                    icon: n.type === 'anfrage' ? 'envelope' :
                        n.type === 'termin' ? 'calendar-check' :
                            n.type === 'warnung' ? 'exclamation-triangle' : 'bell',
                    time: formatRelativeTime(n.createdAt),
                    link: n.type === 'anfrage' ? `/dashboard/requests/${n.referenceId}` :
                        n.type === 'termin' ? `/dashboard/termine/${n.referenceId}` :
                            n.type === 'projekt' ? `/dashboard/projekte/${n.referenceId}` :
                                '/dashboard/notifications'
                };
            });
            return {
                items,
                unreadCount,
                totalCount
            };
        }, 30); // Cache for 30 seconds
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        return { items: [], unreadCount: 0, totalCount: 0 };
    }
};
exports.getNotifications = getNotifications;
/**
 * Count new requests
 * @returns Count of new requests
 */
const getNewRequestsCount = async () => {
    try {
        const cacheKey = 'new_requests_count';
        return await cache_service_1.cache.getOrExecute(cacheKey, async () => {
            const result = await db_service_bak_1.db.query(`
        SELECT COUNT(*) FROM kontaktanfragen 
        WHERE status = 'neu'
      `);
            return parseInt(result.rows[0].count || '0');
        }, 60); // Cache for 1 minute
    }
    catch (error) {
        console.error('Error counting new requests:', error);
        return 0;
    }
};
exports.getNewRequestsCount = getNewRequestsCount;
/**
 * Parse query filters
 * @param query Express req.query object
 * @param defaults Default filter values
 * @returns Parsed filters
 */
const parseFilters = (query, defaults = {}) => {
    const filters = { ...defaults };
    // Add pagination
    filters.page = parseInt(query.page) || 1;
    filters.limit = parseInt(query.limit) || 20;
    // Add sorting
    if (query.sort) {
        const [field, direction] = query.sort.split(':');
        filters.sort = {
            field: field || 'id',
            direction: (direction || 'asc').toUpperCase()
        };
    }
    // Add date range
    if (query.start_date) {
        filters.start_date = new Date(query.start_date);
        // Default end_date to today if not provided
        if (!query.end_date) {
            filters.end_date = new Date();
        }
    }
    if (query.end_date) {
        filters.end_date = new Date(query.end_date);
    }
    // Add search term
    if (query.search) {
        filters.search = query.search.trim();
    }
    // Add status
    if (query.status) {
        filters.status = query.status;
    }
    // Add type
    if (query.type) {
        filters.type = query.type;
    }
    return filters;
};
exports.parseFilters = parseFilters;
/**
 * Sanitize a string for use in SQL LIKE clause
 * @param str String to sanitize
 * @returns Sanitized string
 */
const sanitizeLikeString = (str) => {
    if (!str)
        return '';
    // Escape special characters in LIKE pattern
    return str.replace(/[%_\\]/g, '\\$&');
};
exports.sanitizeLikeString = sanitizeLikeString;
/**
 * Truncate HTML string and close any open tags
 * @param html HTML string to truncate
 * @param maxLength Maximum length
 * @returns Truncated HTML with closed tags
 */
const truncateHtml = (html, maxLength) => {
    if (!html || html.length <= maxLength) {
        return html || '';
    }
    // Simple truncation for now
    // A more complex version would properly close HTML tags
    return html.substring(0, maxLength) + '...';
};
exports.truncateHtml = truncateHtml;
/**
 * Group array by key
 * @param array Array to group
 * @param key Property to group by
 * @returns Grouped object
 */
const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        result[groupKey] = result[groupKey] || [];
        result[groupKey].push(item);
        return result;
    }, {});
};
exports.groupBy = groupBy;
//# sourceMappingURL=helpers.js.map