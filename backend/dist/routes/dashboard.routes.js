"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const dashboardController = __importStar(require("../controllers/dashboard.controller"));
const dashboardMiddleware = __importStar(require("../middleware/dashboard.middleware"));
const router = (0, express_1.Router)();
// Apply authentication middleware to all dashboard routes
router.use(auth_middleware_1.isAuthenticated);
// Apply each middleware separately to avoid array issues
// This fixes the TypeScript error with prepareDashboardContextMiddleware
router.use(dashboardMiddleware.getNewRequestsCountMiddleware);
router.use(dashboardMiddleware.attachNotificationsMiddleware);
router.use(dashboardMiddleware.logUserActivityMiddleware);
/**
 * @route   GET /dashboard
 * @desc    Dashboard home page with stats and overview
 */
router.get('/', dashboardController.getDashboardData);
/**
 * @route   GET /dashboard/search
 * @desc    Global search across all entities
 */
router.get('/search', dashboardController.globalSearch);
/**
 * @route   GET /dashboard/notifications
 * @desc    View all notifications
 */
router.get('/notifications', dashboardController.getNotifications);
/**
 * @route   POST /dashboard/notifications/mark-read
 * @desc    Mark notification(s) as read
 */
router.post('/notifications/mark-read', dashboardController.markNotificationsRead);
/**
 * @route   GET /dashboard/stats
 * @desc    API endpoint for dashboard statistics
 */
router.get('/stats', dashboardController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map