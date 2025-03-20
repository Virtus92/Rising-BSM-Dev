import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import * as settingsController from '../controllers/settings.controller';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.utils';

const router = Router();

// Middleware to check if setup is needed
const setupRequired = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if any users exist using Prisma
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      req.flash('info', 'Setup wurde bereits durchgeführt.');
      return res.redirect('/login');
    }
    
    next();
  } catch (error) {
    console.error('Setup check error:', error);
    res.status(500).render('error', { 
      message: 'Fehler bei der Überprüfung des Systemstatus' 
    });
  }
};

// Apply the middleware to both GET and POST routes
router.get('/', setupRequired, async (req: Request, res: Response) => {
  try {
    res.render('setup', { 
      title: 'Ersteinrichtung - Rising BSM',
      error: null,
      name: '',
      email: '',
      company_name: '',
      company_email: '',
      csrfToken: req.csrfToken?.() || ''
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).render('error', { 
      message: 'Fehler bei der Systeminitialisierung' 
    });
  }
});

// Validation rules
const setupValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name muss mindestens 3 Zeichen lang sein'),
  body('email').trim().isEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password').isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwörter stimmen nicht überein');
    }
    return true;
  }),
  body('company_name').trim().isLength({ min: 2 }).withMessage('Unternehmensname erforderlich'),
  body('company_email').trim().isEmail().withMessage('Gültige Unternehmens-E-Mail erforderlich')
];

router.post('/', setupRequired, setupValidation, async (req: Request, res: Response) => {
  const { 
    name, 
    email, 
    password, 
    company_name,
    company_email
  } = req.body;

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('setup', { 
      error: errors.array()[0].msg,
      name, 
      email, 
      company_name, 
      company_email,
      csrfToken: req.csrfToken?.() || ''
    });
  }

  try {
    // Use Prisma transaction instead of pool.transaction
    // Define interfaces for our data structures
    interface User {
      name: string;
      email: string;
      password: string;
      role: string;
      status: string;
    }
    
    interface SystemSetting {
      key: string;
      value: string;
    }

    let createdUser: any = null;

    await prisma.$transaction(async (tx: any) => {
      // Hash password
      const salt: string = await bcryptjs.genSalt(10);
      const hashedPassword: string = await bcryptjs.hash(password, salt);

      // Create first admin user using Prisma
      createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'admin',
          status: 'active'
        }
      });

      // Save company settings using Prisma
      await tx.systemSetting.createMany({
        data: [
          { key: 'company_name', value: company_name },
          { key: 'company_email', value: company_email },
          { key: 'setup_complete', value: 'true' },
          { key: 'setup_date', value: new Date().toISOString() }
        ]
      });
    });
    
    // Generate JWT token only if we have a created user
    if (createdUser) {
      const token = jwt.sign(
        { id: createdUser.id, email: createdUser.email, role: createdUser.role },
        process.env.JWT_SECRET || 'defaultsecret',
        { expiresIn: '24h' }
      );
      
      // Save token in session or cookie if needed
      // req.session.token = token;
    }
    
    // Redirect to login page
    req.flash('success', 'Setup erfolgreich abgeschlossen. Bitte melden Sie sich an.');
    res.redirect('/login');
  } catch (error: any) { // Explicitly type error as any to access message
    console.error('Setup error:', error);
    res.render('setup', { 
      error: 'Ein Fehler ist aufgetreten: ' + (error.message || 'Unbekannter Fehler'),
      name, 
      email, 
      company_name, 
      company_email,
      csrfToken: req.csrfToken?.() || ''
    });
  }
});

export default router;