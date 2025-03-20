import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import PgSession from 'connect-pg-simple';
import flash from 'connect-flash';
// @ts-ignore
import csurf from '@dr.pogodin/csurf';
import cors from 'cors';
import { Pool } from 'pg';

import config from './config';
import { prisma } from './utils/prisma.utils';

// Define session user type
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      name: string;
      email: string;
      role: string;
      initials: string;
    };
  }
}

// Create Express app
const app: Express = express();
const port = config.PORT;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
    const setupSetting = await prisma.$queryRaw`
      SELECT * FROM system_settings WHERE key = 'setup_complete'
    `;
    
    // If setup isn't complete, redirect to setup
    if (!setupSetting || (Array.isArray(setupSetting) && setupSetting.length === 0)) {
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
import indexRoutes from './routes/index';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes'; 
import customerRoutes from './routes/customer.routes';
import projectRoutes from './routes/project.routes';
import appointmentRoutes from './routes/appointment.routes';
import serviceRoutes from './routes/service.routes';
import requestRoutes from './routes/request.routes';
import profileRoutes from './routes/profile.routes';
import settingsRoutes from './routes/settings.routes';
import setupRoutes from './routes/setup.routes';
import { submitContact } from './controllers/contact.controller';

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

app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true // Ensure this is true
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

// Make user information available to views
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.user = req.session?.user || null;
  next();
});

// Apply API routes
app.use('/api', apiRoutes);

// Apply web routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/setup', setupRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/kunden', customerRoutes);
app.use('/dashboard/projekte', projectRoutes);
app.use('/dashboard/termine', appointmentRoutes);
app.use('/dashboard/dienste', serviceRoutes);
app.use('/dashboard/requests', requestRoutes);
app.use('/dashboard/profile', profileRoutes);
app.use('/dashboard/settings', settingsRoutes);

// Contact form route with rate limiting
app.post('/contact', contactLimiter, submitContact);

// CSRF protection
app.use(csurf());

// Error handling middleware
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
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