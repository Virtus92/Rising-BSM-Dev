import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import { ParamsDictionary } from 'express-serve-static-core';

// Define param interfaces for API routes
interface IdParam extends ParamsDictionary {
  id: string;
}

interface TokenParam extends ParamsDictionary {
  token: string;
}

// Import controllers
import * as authController from '../controllers/auth.controller';
import * as customerController from '../controllers/customer.controller';
import * as projectController from '../controllers/project.controller';
import * as appointmentController from '../controllers/appointment.controller';
import * as serviceController from '../controllers/service.controller';
import * as requestController from '../controllers/request.controller';
import * as profileController from '../controllers/profile.controller';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// Auth routes
router.post('/auth/login', authController.login);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get<TokenParam>('/auth/reset-token/:token', authController.validateResetToken);
router.post<TokenParam>('/auth/reset-password/:token', authController.resetPassword);
router.post('/auth/logout', isAuthenticated, authController.logout);

// Customer routes
router.get('/customers', isAuthenticated, customerController.getAllCustomers);
router.get<IdParam>('/customers/:id', isAuthenticated, customerController.getCustomerById);
router.post('/customers', isAuthenticated, customerController.createCustomer);
router.put<IdParam>('/customers/:id', isAuthenticated, customerController.updateCustomer);
router.post('/customers/status', isAuthenticated, customerController.updateCustomerStatus);
router.post<IdParam>('/customers/:id/notes', isAuthenticated, customerController.addCustomerNote);
router.delete('/customers', isAuthenticated, customerController.deleteCustomer);

// Project routes
router.get('/projects', isAuthenticated, projectController.getAllProjects);
router.get<IdParam>('/projects/:id', isAuthenticated, projectController.getProjectById);
router.post('/projects', isAuthenticated, projectController.createProject);
router.put<IdParam>('/projects/:id', isAuthenticated, projectController.updateProject);
router.post('/projects/status', isAuthenticated, projectController.updateProjectStatus);
router.post<IdParam>('/projects/:id/notes', isAuthenticated, projectController.addProjectNote);

// Appointment routes
router.get('/appointments', isAuthenticated, appointmentController.getAllAppointments);
router.get<IdParam>('/appointments/:id', isAuthenticated, appointmentController.getAppointmentById);
router.post('/appointments', isAuthenticated, appointmentController.createAppointment);
router.put<IdParam>('/appointments/:id', isAuthenticated, appointmentController.updateAppointment);
router.post('/appointments/status', isAuthenticated, appointmentController.updateAppointmentStatus);
router.post<IdParam>('/appointments/:id/notes', isAuthenticated, appointmentController.addAppointmentNote);
router.delete<IdParam>('/appointments/:id', isAuthenticated, appointmentController.deleteAppointment);

// Service routes
router.get('/services', isAuthenticated, serviceController.getAllServices);
router.get<IdParam>('/services/:id', isAuthenticated, serviceController.getServiceById);
router.post('/services', isAuthenticated, serviceController.createService);
router.put<IdParam>('/services/:id', isAuthenticated, serviceController.updateService);
router.post<IdParam>('/services/:id/status', isAuthenticated, serviceController.toggleServiceStatus);
router.get<IdParam>('/services/:id/statistics', isAuthenticated, serviceController.getServiceStatistics);

// Request routes (contact requests)
router.get('/requests', isAuthenticated, requestController.getAllRequests);
router.get<IdParam>('/requests/:id', isAuthenticated, requestController.getRequestById);
router.post('/requests/status', isAuthenticated, requestController.updateRequestStatus);
router.post<IdParam>('/requests/:id/notes', isAuthenticated, requestController.addRequestNote);

// Profile routes
router.get('/profile', isAuthenticated, profileController.getUserProfile);
router.put('/profile', isAuthenticated, profileController.updateProfile);
router.post('/profile/password', isAuthenticated, profileController.updatePassword);
router.post('/profile/notifications', isAuthenticated, profileController.updateNotificationSettings);

// Dashboard routes
router.get('/dashboard/stats', isAuthenticated, dashboardController.getDashboardStats);
router.get('/dashboard/search', isAuthenticated, dashboardController.globalSearch);
router.get('/dashboard/notifications', isAuthenticated, dashboardController.getNotifications);
router.post('/dashboard/notifications/mark-read', isAuthenticated, dashboardController.markNotificationsRead);

export default router;