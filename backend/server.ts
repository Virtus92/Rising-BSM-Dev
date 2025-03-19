import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import PgSession from 'connect-pg-simple';
import flash from 'connect-flash';
import csurf from '@dr.pogodin/csurf';
import cors from 'cors';
import { Pool } from 'pg';

import config from './config';

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Database connection
import prisma from './utils/prisma.utils';

// Import middleware
import * as errorMiddleware from './middleware/error.middleware';
import * as dashboardMiddleware from './middleware/dashboard.middleware';

// Middleware to check if setup is completed
const setupCompletedMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip for setup and public routes
    if (req.path === '/setup' || req.path === '/login' || req.path === '/' || req.path.startsWith('/public')) {
      return next();
    }

    // Check if setup is complete using Prisma
    const setupSetting = await prisma.systemSetting.findFirst({
      where: { key: 'setup_complete' }
    });
    
    // If setup isn't complete, redirect to setup
    if (!setupSetting || setupSetting.value !== 'true') {
      return res.redirect('/setup');
    }
    
    next();
  } catch (error) {
    console.error('Setup check middleware error:', error);
    next();
  }
};

// Import routes
import apiRoutes from './routes/api.routes';
// Instead of requiring all routes individually, we'll import them here
// We'll assume routes are being transformed to TypeScript gradually

// Apply middleware
// CORS
app.use(cors({
  origin: config.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "https://cdn.jsdelivr.net", 
        "https://cdnjs.cloudflare.com", 
        "https://code.jquery.com", 
        "https://cdn.datatables.net", 
        "'unsafe-inline'", 
        "'unsafe-hashes'"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdn.jsdelivr.net", 
        "https://cdnjs.cloudflare.com", 
        "https://cdn.datatables.net"
      ]
    }
  }
}));

// Parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure PostgreSQL session store
const pgSession = PgSession(session);
const pool = new Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
  ssl: config.DB_SSL ? { rejectUnauthorized: false } : false
});

// Configure session
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'rising-bsm-super-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.IS_PRODUCTION, 
    httpOnly: true,
    sameSite: 'strict',
    maxAge: config.SESSION_MAX_AGE // 1 day
  }
}));

// Flash messages
app.use(flash());

// Check if setup is completed
app.use(setupCompletedMiddleware);

// Rate limiters
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

// CSRF protection
app.use(csurf());

// Make CSRF token available to views
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Make user information available to views
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.user = req.session?.user || null;
  next();
});

// Apply API routes first - these use the new TypeScript controllers
app.use('/api', apiRoutes);

// For other routes, we'll continue using the existing JavaScript routes until migrated
// This is a temporary solution during migration
// We'll need to import these properly once converted to TypeScript
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const customerRoutes = require('./routes/customer.routes');
const projectRoutes = require('./routes/project.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const serviceRoutes = require('./routes/service.routes');
const requestRoutes = require('./routes/request.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');
const setupRoutes = require('./routes/setup.routes');

// Apply the existing JavaScript routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', setupRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/kunden', customerRoutes);
app.use('/dashboard/projekte', projectRoutes);
app.use('/dashboard/termine', appointmentRoutes);
app.use('/dashboard/dienste', serviceRoutes);
app.use('/dashboard/requests', requestRoutes);
app.use('/dashboard/profile', profileRoutes);
app.use('/dashboard/settings', settingsRoutes);

// Contact form route with rate limiting
app.post('/contact', contactLimiter, require('./controllers/contact.controller').submitContact);

// Error handling middleware
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.csrfErrorHandler);
app.use(errorMiddleware.errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

// Process error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Give the server time to log the error before shutting down
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});