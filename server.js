require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const csrf = require('@dr.pogodin/csurf');
const cors = require('cors');
const { pool } = require('./services/db.service');
const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3000;


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:9295'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token']
}));

// Middleware imports
const dbMiddleware = require('./middleware/db.middleware');
app.use(dbMiddleware);

const errorMiddleware = require('./middleware/error.middleware');

// Routes imports
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
// const blogRoutes = require('./routes/blog.routes');

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure session
let sessionStore;
try {
  sessionStore = new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  });
  console.log('Using PostgreSQL session store');
} catch (error) {
  console.warn('Failed to initialize PostgreSQL session store:', error.message);
  console.log('Falling back to memory session store');
  sessionStore = new session.MemoryStore();
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'rising-bsm-super-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
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

// CSRF protection
app.use(csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },
  // Use this simpler implementation
  value: (req) => {
    return req.body && req.body._csrf || 
           req.query && req.query._csrf || 
           req.headers['x-csrf-token'] || 
           req.headers['x-xsrf-token'];
  }
}));

// Expose CSRF token to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Make user information available to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// New requests count middleware for dashboard
const { getNewRequestsCountMiddleware } = require('./middleware/dashboard.middleware');
app.use('/dashboard', getNewRequestsCountMiddleware);
app.use('/api/dashboard', getNewRequestsCountMiddleware);

// Apply routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/kunden', customerRoutes);
app.use('/dashboard/projekte', projectRoutes);
app.use('/dashboard/termine', appointmentRoutes);
app.use('/dashboard/dienste', serviceRoutes);
app.use('/dashboard/requests', requestRoutes);
app.use('/dashboard/profile', profileRoutes);
app.use('/dashboard/settings', settingsRoutes);

// API routes
app.use('/api', apiRoutes);
app.use('/dashboard/requests', requestRoutes); // For the frontend when served through Express
app.use('/api/requests', requestRoutes);

// Contact form route with rate limiting
app.post('/contact', contactLimiter, require('./controllers/contact.controller').submitContact);

// Error handling middleware
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.csrfErrorHandler);
app.use(errorMiddleware.errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
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