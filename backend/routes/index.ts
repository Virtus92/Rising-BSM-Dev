import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

// Import all route modules
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import projectRoutes from './project.routes';
import appointmentRoutes from './appointment.routes';
import serviceRoutes from './service.routes';
import requestRoutes from './request.routes';
import profileRoutes from './profile.routes';
import dashboardRoutes from './dashboard.routes';
import settingsRoutes from './settings.routes';
import setupRoutes from './setup.routes';
import * as contactController from '../controllers/contact.controller';

const router = Router();

// Rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP
  message: { success: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' }
});

/**
 * @route   GET /
 * @desc    Home page
 */
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Rising BSM – Ihre Allround-Experten',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /impressum
 * @desc    Imprint page
 */
router.get('/impressum', (req, res) => {
  res.render('impressum', { 
    title: 'Rising BSM – Impressum',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /datenschutz
 * @desc    Privacy policy page
 */
router.get('/datenschutz', (req, res) => {
  res.render('datenschutz', { 
    title: 'Rising BSM – Datenschutz',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /agb
 * @desc    Terms and conditions page
 */
router.get('/agb', (req, res) => {
  res.render('agb', { 
    title: 'Rising BSM – AGB',
    user: req.session?.user || null
  });
});

/**
 * @route   POST /contact
 * @desc    Process contact form submission
 */
router.post('/contact', contactLimiter, contactController.submitContact);

// Auth routes
router.use('/', authRoutes);

// Setup routes
router.use('/setup', setupRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Customer routes
router.use('/api/customers', customerRoutes);
router.use('/dashboard/kunden', customerRoutes);

// Project routes
router.use('/api/projects', projectRoutes);
router.use('/dashboard/projekte', projectRoutes);

// Appointment routes
router.use('/api/appointments', appointmentRoutes);
router.use('/dashboard/termine', appointmentRoutes);

// Service routes
router.use('/api/services', serviceRoutes);
router.use('/dashboard/dienste', serviceRoutes);

// Request routes
router.use('/api/requests', requestRoutes);
router.use('/dashboard/requests', requestRoutes);

// Profile routes
router.use('/api/profile', profileRoutes);
router.use('/dashboard/profile', profileRoutes);

// Settings routes
router.use('/api/settings', settingsRoutes);
router.use('/dashboard/settings', settingsRoutes);

export default router;