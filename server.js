import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import flash from 'connect-flash';
import bcrypt from 'bcryptjs';
import csrf from '@dr.pogodin/csurf';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import validator from 'validator';
import multer from 'multer';
import blogRoutes from './routes/blog.js';
import axios from 'axios';
import pool from './db.js';
import env from 'dotenv';
env.config();

const pgSession = connectPgSimple(session);

const app = express();
const PORT = process.env.PORT || 3000;

// Datenbankverbindung

// Route-Importe mit neuer Struktur
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard/index.js';
import anfragenRoutes from './routes/dashboard/anfragen.js';
import projectRoutes from './routes/dashboard/projekte.js';
import kundenRoutes from './routes/dashboard/kunden.js';
import termineRoutes from './routes/dashboard/termine.js';
import dienstleistungenRoutes from './routes/dashboard/dienste.js';
import settingsRoutes from './routes/dashboard/settings.js';
import profileRoutes from './routes/dashboard/profile.js';
import apiRoutes from './routes/dashboard/api.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session-Konfiguration
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
    maxAge: 24 * 60 * 60 * 1000 // 1 Tag
  }
}));

// Globale Variablen für die Views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.isManager = req.session.isManager;
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});

// XSS-Schutz für alle POST-Requests
app.use((req, res, next) => {
  if (req.method === 'POST' && req.body) {
    for (const key in req.body) {
      req.body[key] = validator.escape(req.body[key]);
    }
  }
  next();
});

// Middleware-Konfigurationen 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d'
}));
app.use(flash());
// Globale Middleware für Benutzerinformationen
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Helmet für Sicherheits-Header
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
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

// Konfiguration von Multer für Bild-Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/blog')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    // Prüfe erlaubte Dateitypen
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Nur Bildformate sind erlaubt!'), false);
    }
    cb(null, true);
  }
});

// Apply CSRF middleware before state-changing routes
// Routen verwenden
// app.use('/', authRoutes);
// app.use('/dashboard', dashboardRoutes);
// app.use('/dashboard/projekte', projectRoutes);
// app.use('/dashboard/anfragen', anfragenRoutes);
// app.use('/dashboard/kunden', kundenRoutes);
// app.use('/dashboard/termine', termineRoutes);
// app.use('/dashboard/dienste', dienstleistungenRoutes);
// app.use('/dashboard/settings', settingsRoutes);
// Apply CSRF middleware before state-changing routes
app.use(csrf());

// Routen verwenden
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/dashboard/projekte', projectRoutes);
app.use('/dashboard/anfragen', anfragenRoutes);
app.use('/dashboard/kunden', kundenRoutes);
app.use('/dashboard/termine', termineRoutes);
app.use('/dashboard/dienste', dienstleistungenRoutes);
app.use('/dashboard/settings', settingsRoutes);
app.use('/dashboard/profile', profileRoutes);
app.use('/dashboard/api', apiRoutes);
app.use('/dashboard/blog', blogRoutes);

// Generisches Error-Handler-Middleware für API-Routen
app.use('/dashboard/api', (err, req, res, next) => {
  console.error('API-Fehler:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message
  });
});

app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Rising BSM'
  });
});

app.get('/impressum', (_, res) => {
  res.render('impressum', { title: 'Rising BSM – Impressum' });
});

app.get('/datenschutz', (_, res) => {
  res.render('datenschutz', { title: 'Rising BSM – Datenschutz' });
});

app.get('/agb', (_, res) => {
  res.render('agb', { title: 'Rising BSM – AGB' });
});

// Blog-Middleware für Dashboard
app.get('/blog', async (req, res) => {
  try {
    // Fetch published blog posts
    const postsQuery = await pool.query(`
      SELECT 
        p.id, 
        p.title, 
        p.slug,
        p.excerpt, 
        p.published_at,
        p.featured_image,
        u.name as author_name,
        ARRAY_AGG(DISTINCT c.name) as categories
      FROM 
        blog_posts p
        LEFT JOIN benutzer u ON p.author_id = u.id
        LEFT JOIN blog_post_categories pc ON p.id = pc.post_id
        LEFT JOIN blog_categories c ON pc.id = pc.category_id
      WHERE 
        p.status = 'published'
      GROUP BY
        p.id, u.name
      ORDER BY 
        p.published_at DESC
      LIMIT 10
    `);
    
    // Fetch categories for sidebar
    const categoriesQuery = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.slug,
        COUNT(pc.post_id) as post_count
      FROM 
        blog_categories c
        JOIN blog_post_categories pc ON c.id = pc.category_id
        JOIN blog_posts p ON pc.post_id = p.id
      WHERE
        p.status = 'published'
      GROUP BY 
        c.id
      ORDER BY 
        c.name
    `);
    
    // Render the blog index template with the required data
    res.render('blog/index', {
      title: 'Blog - Rising BSM',
      posts: postsQuery.rows.map(post => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        date: format(new Date(post.published_at), 'dd.MM.yyyy'),
        author: post.author_name,
        image: post.featured_image,
        categories: post.categories.filter(c => c !== null)
      })),
      categories: categoriesQuery.rows
    });
  } catch (error) {
    console.error('Error loading blog index:', error);
    res.status(500).render('error', {
      message: 'Error loading blog: ' + error.message,
      error: error
    });
  }
});

app.get('/blog/search', (req, res, next) => {
  req.url = '/public/search' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  next();
}, blogRoutes);

app.get('/blog/category/:slug', (req, res, next) => {
  req.url = '/public/category/' + req.params.slug;
  next();
}, blogRoutes);

// Individual blog post route - most specific route should be last
app.get('/blog/:slug', (req, res, next) => {
  req.url = '/public/' + req.params.slug;
  next();
}, blogRoutes);

// Catch-all for any other /blog routes
app.use('/blog', (req, res, next) => {
  if (!req.url.startsWith('/public')) {
    req.url = '/public' + req.url;
  }
  next();
}, blogRoutes);

// Route für Bild-Uploads
app.post('/dashboard/api/upload', upload.single('image'), (req, res) => {
  try {
    const filePath = '/uploads/blog/' + req.file.filename;
    res.json({ success: true, filePath });
  } catch (error) {
    console.error('Fehler beim Bildupload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Kontakt-Formular Rate-Limiting
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5, // 5 Anfragen pro IP
  message: { success: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' }
});

// Kontaktformular-Route
app.post('/contact', contactLimiter, async (req, res) => {
  const { name, email, phone, service, message } = req.body;
  
  // Validierung
  if (!name || !email || !message || !service) {
    return res.status(400).json({ success: false, error: 'Name, E-Mail und Nachricht sind Pflichtfelder.' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
  }

  if (phone && !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    return res.status(400).json({ success: false, error: 'Bitte geben Sie eine gültige Telefonnummer ein.' });
  }

  // XSS-Schutz durch Escape von HTML
  const sanitizedName = validator.escape(name);
  const sanitizedMessage = validator.escape(message);
  const sanitizedPhone = phone ? validator.escape(phone) : '';
  

  try {
    // Daten in PostgreSQL speichern
    const result = await pool.query(
      'INSERT INTO kontaktanfragen (name, email, phone, service, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone, service, message]
    );
    const contactId = result.rows[0].id;

    try {
      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('N8N_WEBHOOK_URL environment variable is not set');
      }
      await axios.post(webhookUrl, {
        id: contactId,
        name: sanitizedName,
        email,
        phone: sanitizedPhone,
        service,
        message: sanitizedMessage,
      });
      res.status(200).json({ success: true, message: 'Formular erfolgreich gesendet!' });

    } catch (axiosError) {
      console.error('Error notifying N8N:', axiosError);
      if (process.env.NODE_ENV !== 'production') {
        console.error('Request body:', req.body); // Log the request body for debugging
      }
      return res.status(500).json({ success: false, error: 'Fehler beim Benachrichtigen des Webhooks.' });
    }
  } catch (dbError) {
    console.error('Error saving contact form:', dbError);
    if (process.env.NODE_ENV !== 'production') {
      console.error('Request body:', req.body); // Log the request body for debugging
    }
    return res.status(500).json({ success: false, error: 'Ein Fehler ist beim Speichern des Formulars aufgetreten.' });
  }
});

// Globaler Error-Handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF-Fehler beim Request von:', req.headers.referer || 'Unbekannt');
    
    // Für AJAX-Anfragen JSON zurückgeben
    if (req.xhr || req.headers.accept && req.headers.accept.includes('json') || 
        req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.status(403).json({ 
        success: false, 
        error: 'invalid csrf token',
        message: 'Sicherheitstoken ungültig oder abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.'
      });
    }
    
    // Für normale Anfragen die Fehlerseite anzeigen
    return res.status(403).render('error', {
      message: 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.',
      error: {}
    });
  }
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Ein Serverfehler ist aufgetreten' 
      : err.message 
  });
});