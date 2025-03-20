"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareDashboardContextMiddleware = exports.logUserActivityMiddleware = exports.attachNotificationsMiddleware = exports.getNewRequestsCountMiddleware = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const notification_service_1 = __importDefault(require("../services/notification.service"));
const getNewRequestsCountMiddleware = async (req, res, next) => {
    try {
        const count = await prisma_utils_1.prisma.contactRequest.count({
            where: { status: 'neu' }
        });
        req.newRequestsCount = count;
        next();
    }
    catch (error) {
        console.error('Error fetching new requests count:', error);
        req.newRequestsCount = 0;
        next();
    }
};
exports.getNewRequestsCountMiddleware = getNewRequestsCountMiddleware;
const attachNotificationsMiddleware = async (req, res, next) => {
    try {
        const authReq = req;
        if (authReq.user) {
            const notificationsData = await notification_service_1.default.getNotifications(authReq.user.id, { limit: 5, unreadOnly: true });
            req.notifications = notificationsData.notifications;
            req.unreadNotificationsCount = notificationsData.unreadCount;
        }
        else {
            req.notifications = [];
            req.unreadNotificationsCount = 0;
        }
        next();
    }
    catch (error) {
        console.error('Error attaching notifications:', error);
        req.notifications = [];
        req.unreadNotificationsCount = 0;
        next();
    }
};
exports.attachNotificationsMiddleware = attachNotificationsMiddleware;
const logUserActivityMiddleware = async (req, res, next) => {
    try {
        const authReq = req;
        if (authReq.user) {
            await prisma_utils_1.prisma.userActivity.create({
                data: {
                    userId: authReq.user.id,
                    activity: 'route_access',
                    ipAddress: req.ip || '0.0.0.0',
                }
            });
        }
        next();
    }
    catch (error) {
        console.error('Error logging user activity:', error);
        next();
    }
};
exports.logUserActivityMiddleware = logUserActivityMiddleware;
exports.prepareDashboardContextMiddleware = [
    exports.getNewRequestsCountMiddleware,
    exports.attachNotificationsMiddleware,
    exports.logUserActivityMiddleware
];
exports.default = {
    getNewRequestsCountMiddleware: exports.getNewRequestsCountMiddleware,
    attachNotificationsMiddleware: exports.attachNotificationsMiddleware,
    logUserActivityMiddleware: exports.logUserActivityMiddleware,
    prepareDashboardContextMiddleware: exports.prepareDashboardContextMiddleware
};
//# sourceMappingURL=dashboard.middleware.js.map