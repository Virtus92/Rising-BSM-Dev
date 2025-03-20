"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = exports.truncateHtml = exports.sanitizeLikeString = exports.parseFilters = exports.getNewRequestsCount = exports.getNotifications = exports.generateId = exports.getBenutzerStatusInfo = exports.getProjektStatusInfo = exports.getTerminStatusInfo = exports.getAnfrageStatusInfo = void 0;
const cache_service_1 = require("../services/cache.service");
const prisma_utils_1 = require("./prisma.utils");
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
const getBenutzerStatusInfo = (status) => {
    const statusMap = {
        'aktiv': { label: 'Aktiv', className: 'success' },
        'inaktiv': { label: 'Inaktiv', className: 'secondary' },
        'gesperrt': { label: 'Gesperrt', className: 'danger' }
    };
    return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};
exports.getBenutzerStatusInfo = getBenutzerStatusInfo;
const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};
exports.generateId = generateId;
const getNotifications = async (req) => {
    if (!req.session || !req.session.user) {
        return { items: [], unreadCount: 0, totalCount: 0 };
    }
    try {
        const userId = req.session.user.id;
        const cacheKey = `notifications_${userId}`;
        return await cache_service_1.cache.getOrExecute(cacheKey, async () => {
            const notifications = await prisma_utils_1.prisma.notification.findMany({
                where: {
                    userId: Number(userId)
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });
            const unreadCount = await prisma_utils_1.prisma.notification.count({
                where: {
                    userId: Number(userId),
                    read: false
                }
            });
            const totalCount = await prisma_utils_1.prisma.notification.count({
                where: {
                    userId: Number(userId)
                }
            });
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
        }, 30);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        return { items: [], unreadCount: 0, totalCount: 0 };
    }
};
exports.getNotifications = getNotifications;
const getNewRequestsCount = async () => {
    try {
        const cacheKey = 'new_requests_count';
        return await cache_service_1.cache.getOrExecute(cacheKey, async () => {
            const count = await prisma_utils_1.prisma.contactRequest.count({
                where: { status: 'neu' }
            });
            return count;
        }, 60);
    }
    catch (error) {
        console.error('Error counting new requests:', error);
        return 0;
    }
};
exports.getNewRequestsCount = getNewRequestsCount;
const parseFilters = (query, defaults = {}) => {
    const filters = { ...defaults };
    filters.page = parseInt(query.page) || 1;
    filters.limit = parseInt(query.limit) || 20;
    if (query.sort) {
        const [field, direction] = query.sort.split(':');
        filters.sort = {
            field: field || 'id',
            direction: (direction || 'asc').toUpperCase()
        };
    }
    if (query.start_date) {
        filters.start_date = new Date(query.start_date);
        if (!query.end_date) {
            filters.end_date = new Date();
        }
    }
    if (query.end_date) {
        filters.end_date = new Date(query.end_date);
    }
    if (query.search) {
        filters.search = query.search.trim();
    }
    if (query.status) {
        filters.status = query.status;
    }
    if (query.type) {
        filters.type = query.type;
    }
    return filters;
};
exports.parseFilters = parseFilters;
const sanitizeLikeString = (str) => {
    if (!str)
        return '';
    return str.replace(/[%_\\]/g, '\\$&');
};
exports.sanitizeLikeString = sanitizeLikeString;
const truncateHtml = (html, maxLength) => {
    if (!html || html.length <= maxLength) {
        return html || '';
    }
    return html.substring(0, maxLength) + '...';
};
exports.truncateHtml = truncateHtml;
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