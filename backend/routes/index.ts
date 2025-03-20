import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as contactController from '../controllers/contact.controller';
import { ParamsDictionary } from 'express-serve-static-core';
import prisma from '../utils/prisma.utils';

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
router.get('/', async (req: Request, res: Response) => {
  let dbStatus = 'OK';
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Database connection error:', error);
    dbStatus = 'Error';
  }

  const apiEndpoints = [
    { method: 'GET', path: '/api/customers', description: 'Retrieve all customers' },
    { method: 'GET', path: '/api/projects', description: 'Retrieve all projects' },
    { method: 'GET', path: '/api/appointments', description: 'Retrieve all appointments' },
    { method: 'GET', path: '/api/services', description: 'Retrieve all services' },
    { method: 'GET', path: '/api/requests', description: 'Retrieve all contact requests' },
    { method: 'GET', path: '/api/dashboard/stats', description: 'Get dashboard statistics' },
    { method: 'POST', path: '/api/auth/login', description: 'User authentication' },
    { method: 'POST', path: '/api/customers', description: 'Create a new customer' },
    { method: 'POST', path: '/api/projects', description: 'Create a new project' },
    { method: 'POST', path: '/api/contact', description: 'Submit contact form' }
  ];
  
  res.render('index', { 
    title: 'Rising BSM – Ihre Allround-Experten',
    user: req.session?.user || null,
    systemStatus: {
      databaseStatus: dbStatus,
      applicationStatus: 'OK',
      lastUpdate: new Date().toLocaleString('de-DE')
    },
    apiEndpoints
  });
});

/**
 * @route   GET /impressum
 * @desc    Imprint page
 */
router.get('/impressum', (req: Request, res: Response) => {
  res.render('impressum.ejs', { 
    title: 'Rising BSM – Impressum',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /datenschutz
 * @desc    Privacy policy page
 */
router.get('/datenschutz', (req: Request, res: Response) => {
  res.render('datenschutz.ejs', { 
    title: 'Rising BSM – Datenschutz',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /agb
 * @desc    Terms and conditions page
 */
router.get('/agb', (req: Request, res: Response) => {
  res.render('agb.ejs', { 
    title: 'Rising BSM – AGB',
    user: req.session?.user || null
  });
});

/**
 * @route   POST /contact
 * @desc    Process contact form submission
 */
router.post('/contact', contactLimiter, contactController.submitContact);

export default router;