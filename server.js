import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
const pgSession = connectPgSimple(session);
import flash from 'connect-flash';
import csrf from '@dr.pogodin/csurf';

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
import { pool } from './services/db.service';

// Middleware imports
import * as errorMiddleware from './middleware/error.middleware';
import { getNewRequestsCountMiddleware } from './middleware/dashboard.middleware';

// Routes imports
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
// const blogRoutes = require('./routes/blog.routes');

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security middleware
const helmetConfig = {
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
};

app.use(helmet(helmetConfig));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Flash messages
app.use(flash());

// Rate limiters
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },
  headerName: 'x-csrf-token' // Configure csrf to look for the token in the x-csrf-token header
});

// Function to apply CSRF protection
const applyCsrfProtection = (routes, csrfProtection) => {
  routes.forEach(route => {
    app.use(route, csrfProtection, (req, res, next) => {
      res.locals.csrfToken = req.csrfToken();
      next();
    });
  });
};

// Apply CSRF protection to specific routes
const protectedRoutes = [
  '/dashboard',
  '/dashboard/customers',
  '/dashboard/projects',
  '/dashboard/appointments',
  '/dashboard/services',
  '/dashboard/requests',
  '/dashboard/profile',
  '/dashboard/settings'
];

applyCsrfProtection(protectedRoutes, csrfProtection);

// Make user information available to views
app.use((req, res, next) => {
  if (!res.locals.user) {
    res.locals.user = req.session.user || null;
  }
  next();
});

// New requests count middleware for dashboard
app.use('/dashboard', getNewRequestsCountMiddleware);

// Apply routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/customers', customerRoutes);
app.use('/dashboard/projects', projectRoutes);
app.use('/dashboard/appointments', appointmentRoutes);
app.use('/dashboard/services', serviceRoutes);
app.use('/dashboard/requests', requestRoutes);
app.use('/dashboard/profile', profileRoutes);
app.use('/dashboard/settings', settingsRoutes);
//app.use('/dashboard/blog', blogRoutes);
//app.use('/blog', blogRoutes);

// Contact form route with rate limiting
import { submitContact } from './controllers/contact.controller';
app.post('/contact', contactLimiter, submitContact);

// Error handling middleware
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.csrfErrorHandler);
app.use(errorMiddleware.errorHandler);

let server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

function shutdown() {
  server.close(() => {
    console.log('Closed out remaining connections.');
    pool.end(() => {
      console.log('Closed database connection.');
      process.exit(1);
    });
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});