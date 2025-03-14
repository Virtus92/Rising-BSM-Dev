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
const validator = require('validator');
// const blogRoutes = require('./routes/blog.routes');

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:9295"],
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
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
    secure: false, // Disable secure for local development
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

// Reset and configure CSRF (after session, before routes)
const setupCsrf = require('./csrf-reset');
setupCsrf(app);

// Apply routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/customers', customerRoutes);
app.use('/dashboard/projects', projectRoutes);
app.use('/dashboard/appointments', appointmentRoutes);
app.use('/dashboard/services', serviceRoutes);
app.use('/dashboard/requests', requestRoutes);
app.use('/dashboard/profile', profileRoutes);
app.use('/dashboard/settings', settingsRoutes);

// API routes
app.use('/api', apiRoutes);
app.use('/dashboard/requests', requestRoutes); // For the frontend when served through Express
app.use('/api/requests', requestRoutes);

// Contact form route with rate limiting (keep this one)
app.post('/contact', contactLimiter, async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  // Validierung
  if (!name || !email || !message || !service) {
    return res.status(400).json({ success: false, error: 'Name, E-Mail und Nachr                                                                                                             icht sind Pflichtfelder.' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, error: 'Bitte geben Sie eine g                                                                                                             ültige E-Mail-Adresse ein.' });
  }

  if (phone && !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    return res.status(400).json({ success: false, error: 'Bitte geben Sie eine g                                                                                                             ültige Telefonnummer ein.' });
  }

  // XSS-Schutz durch Escape von HTML
  const sanitizedName = validator.escape(name);
  const sanitizedMessage = validator.escape(message);
  const sanitizedPhone = phone ? validator.escape(phone) : '';


  try {
    // Daten in PostgreSQL speichern
    const result = await pool.query(
      'INSERT INTO kontaktanfragen (name, email, phone, service, message) VALUES                                                                                                              ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone, service, message]
    );
    const contactId = result.rows[0].id;

    try {
      await axios.post(process.env.N8N_WEBHOOK_URL || 'https://n8n.dinel.at/webh                                                                                                             ook/e2b8d680-425b-44ab-94aa-55ecda267de1', {
        id: contactId,
        name: sanitizedName,
        email,
        phone: sanitizedPhone,
        service,
        message: sanitizedMessage,
      });
    } catch (webhookError) {
      console.error('Error notifying N8N webhook:', webhookError);
      // Continue even if webhook fails - we already saved to database
    }

    res.status(200).json({ success: true, id: contactId });
  } catch (error) {
    console.error('Error saving contact or notifying N8N:', error);
    console.error('Request body:', req.body); // Log the request body for debugg                                                                                                             ing
    res.status(500).json({ success: false, error: error.message });
  }
});

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