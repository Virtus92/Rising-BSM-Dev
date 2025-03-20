import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

// Import controllers
import * as customerController from '../controllers/customer.controller';
import * as projectController from '../controllers/project.controller';
import * as appointmentController from '../controllers/appointment.controller';
import * as serviceController from '../controllers/service.controller';
import * as requestController from '../controllers/request.controller';
import * as profileController from '../controllers/profile.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

// Customers
router.get('/customers', authenticate, customerController.getAllCustomers);
router.get('/customers/:id', authenticate, customerController.getCustomerById);
router.post('/customers', authenticate, customerController.createCustomer);
router.put('/customers/:id', authenticate, customerController.updateCustomer);
router.patch('/customers/status', authenticate, customerController.updateCustomerStatus);
router.post('/customers/:id/notes', authenticate, customerController.addCustomerNote);
router.delete('/customers/:id', authenticate, customerController.deleteCustomer);

// Projects
router.get('/projects', authenticate, projectController.getAllProjects);
router.get('/projects/:id', authenticate, projectController.getProjectById);
router.post('/projects', authenticate, projectController.createProject);
router.put('/projects/:id', authenticate, projectController.updateProject);
router.patch('/projects/:id/status', authenticate, projectController.updateProjectStatus);
router.post('/projects/:id/notes', authenticate, projectController.addProjectNote);
router.get('/projects/export', authenticate, projectController.exportProjects);

// Appointments
router.get('/appointments', authenticate, appointmentController.getAllAppointments);
router.get('/appointments/:id', authenticate, appointmentController.getAppointmentById);
router.post('/appointments', authenticate, appointmentController.createAppointment);
router.put('/appointments/:id', authenticate, appointmentController.updateAppointment);
router.patch('/appointments/:id/status', authenticate, appointmentController.updateAppointmentStatus);
router.post('/appointments/:id/notes', authenticate, appointmentController.addAppointmentNote);
router.delete('/appointments/:id', authenticate, appointmentController.deleteAppointment);

// Services
router.get('/services', authenticate, serviceController.getAllServices);
router.get('/services/:id', authenticate, serviceController.getServiceById);
router.post('/services', authenticate, serviceController.createService);
router.put('/services/:id', authenticate, serviceController.updateService);
router.patch('/services/:id/status', authenticate, serviceController.toggleServiceStatus);
router.get('/services/:id/statistics', authenticate, serviceController.getServiceStatistics);

// Requests (contact requests)
router.get('/requests', authenticate, requestController.getAllRequests);
router.get('/requests/:id', authenticate, requestController.getRequestById);
router.patch('/requests/:id/status', authenticate, requestController.updateRequestStatus);
router.post('/requests/:id/notes', authenticate, requestController.addRequestNote);
router.get('/requests/export', authenticate, requestController.exportRequests);

// Profile
router.get('/profile', authenticate, profileController.getUserProfile);
router.put('/profile', authenticate, profileController.updateProfile);
router.patch('/profile/password', authenticate, profileController.updatePassword);
router.patch('/profile/picture', authenticate, profileController.updateProfilePicture);
router.patch('/profile/notifications', authenticate, profileController.updateNotificationSettings);

// Dashboard
router.get('/dashboard/stats', authenticate, dashboardController.getDashboardStats);
router.get('/dashboard/search', authenticate, dashboardController.globalSearch);
router.get('/dashboard/notifications', authenticate, dashboardController.getNotifications);
router.post('/dashboard/notifications/mark-read', authenticate, dashboardController.markNotificationsRead);

// Settings (admin only)
router.get('/settings/system', authenticate, isAdmin, settingsController.getSystemSettings);
router.put('/settings/system', authenticate, isAdmin, settingsController.updateSystemSettings);
router.get('/settings/backup', authenticate, isAdmin, settingsController.getBackupSettings);
router.put('/settings/backup', authenticate, isAdmin, settingsController.updateBackupSettings);
router.post('/settings/backup/trigger', authenticate, isAdmin, settingsController.triggerManualBackup);

// User settings
router.get('/settings', authenticate, settingsController.getUserSettings);
router.put('/settings', authenticate, settingsController.updateUserSettings);

export default router;