import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
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
router.get('/', (req: Request, res: Response) => {
  res.render('index', { 
    title: 'Rising BSM – Ihre Allround-Experten',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /impressum
 * @desc    Imprint page
 */
router.get('/impressum', (req: Request, res: Response) => {
  res.render('impressum', { 
    title: 'Rising BSM – Impressum',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /datenschutz
 * @desc    Privacy policy page
 */
router.get('/datenschutz', (req: Request, res: Response) => {
  res.render('datenschutz', { 
    title: 'Rising BSM – Datenschutz',
    user: req.session?.user || null
  });
});

/**
 * @route   GET /agb
 * @desc    Terms and conditions page
 */
router.get('/agb', (req: Request, res: Response) => {
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

export default router;