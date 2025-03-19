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
// Import controllers
const authController = __importStar(require("../controllers/auth.controller"));
const customerController = __importStar(require("../controllers/customer.controller"));
const projectController = __importStar(require("../controllers/project.controller"));
const appointmentController = __importStar(require("../controllers/appointment.controller"));
const serviceController = __importStar(require("../controllers/service.controller"));
const requestController = __importStar(require("../controllers/request.controller"));
const profileController = __importStar(require("../controllers/profile.controller"));
const dashboardController = __importStar(require("../controllers/dashboard.controller"));
const router = (0, express_1.Router)();
// Auth routes
router.post('/auth/login', authController.login);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get('/auth/reset-token/:token', authController.validateResetToken);
router.post('/auth/reset-password/:token', authController.resetPassword);
router.post('/auth/logout', auth_middleware_1.isAuthenticated, authController.logout);
// Customer routes
router.get('/customers', auth_middleware_1.isAuthenticated, customerController.getAllCustomers);
router.get('/customers/:id', auth_middleware_1.isAuthenticated, customerController.getCustomerById);
router.post('/customers', auth_middleware_1.isAuthenticated, customerController.createCustomer);
router.put('/customers/:id', auth_middleware_1.isAuthenticated, customerController.updateCustomer);
router.post('/customers/status', auth_middleware_1.isAuthenticated, customerController.updateCustomerStatus);
router.post('/customers/:id/notes', auth_middleware_1.isAuthenticated, customerController.addCustomerNote);
router.delete('/customers', auth_middleware_1.isAuthenticated, customerController.deleteCustomer);
// Project routes
router.get('/projects', auth_middleware_1.isAuthenticated, projectController.getAllProjects);
router.get('/projects/:id', auth_middleware_1.isAuthenticated, projectController.getProjectById);
router.post('/projects', auth_middleware_1.isAuthenticated, projectController.createProject);
router.put('/projects/:id', auth_middleware_1.isAuthenticated, projectController.updateProject);
router.post('/projects/status', auth_middleware_1.isAuthenticated, projectController.updateProjectStatus);
router.post('/projects/:id/notes', auth_middleware_1.isAuthenticated, projectController.addProjectNote);
// Appointment routes
router.get('/appointments', auth_middleware_1.isAuthenticated, appointmentController.getAllAppointments);
router.get('/appointments/:id', auth_middleware_1.isAuthenticated, appointmentController.getAppointmentById);
router.post('/appointments', auth_middleware_1.isAuthenticated, appointmentController.createAppointment);
router.put('/appointments/:id', auth_middleware_1.isAuthenticated, appointmentController.updateAppointment);
router.post('/appointments/status', auth_middleware_1.isAuthenticated, appointmentController.updateAppointmentStatus);
router.post('/appointments/:id/notes', auth_middleware_1.isAuthenticated, appointmentController.addAppointmentNote);
router.delete('/appointments/:id', auth_middleware_1.isAuthenticated, appointmentController.deleteAppointment);
// Service routes
router.get('/services', auth_middleware_1.isAuthenticated, serviceController.getAllServices);
router.get('/services/:id', auth_middleware_1.isAuthenticated, serviceController.getServiceById);
router.post('/services', auth_middleware_1.isAuthenticated, serviceController.createService);
router.put('/services/:id', auth_middleware_1.isAuthenticated, serviceController.updateService);
router.post('/services/:id/status', auth_middleware_1.isAuthenticated, serviceController.toggleServiceStatus);
router.get('/services/:id/statistics', auth_middleware_1.isAuthenticated, serviceController.getServiceStatistics);
// Request routes (contact requests)
router.get('/requests', auth_middleware_1.isAuthenticated, requestController.getAllRequests);
router.get('/requests/:id', auth_middleware_1.isAuthenticated, requestController.getRequestById);
router.post('/requests/status', auth_middleware_1.isAuthenticated, requestController.updateRequestStatus);
router.post('/requests/:id/notes', auth_middleware_1.isAuthenticated, requestController.addRequestNote);
// Profile routes
router.get('/profile', auth_middleware_1.isAuthenticated, profileController.getUserProfile);
router.put('/profile', auth_middleware_1.isAuthenticated, profileController.updateProfile);
router.post('/profile/password', auth_middleware_1.isAuthenticated, profileController.updatePassword);
router.post('/profile/notifications', auth_middleware_1.isAuthenticated, profileController.updateNotificationSettings);
// Dashboard routes
router.get('/dashboard/stats', auth_middleware_1.isAuthenticated, dashboardController.getDashboardStats);
router.get('/dashboard/search', auth_middleware_1.isAuthenticated, dashboardController.globalSearch);
router.get('/dashboard/notifications', auth_middleware_1.isAuthenticated, dashboardController.getNotifications);
router.post('/dashboard/notifications/mark-read', auth_middleware_1.isAuthenticated, dashboardController.markNotificationsRead);
exports.default = router;
//# sourceMappingURL=api.routes.js.map