require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');
const helmet = require('helmet');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const csrf = require('@dr.pogodin/csurf');
const { formatDistanceToNow, isToday, isTomorrow, format } = require('date-fns');
const { de } = require('date-fns/locale');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route-Importe
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const projectRoutes = require('./routes/projects.js');

// PostgreSQL-Pool für Sessions
const pool = require('./db');

// PostgreSQL-Verbindung einrichten
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// Prüfe die Verbindung beim Start
pool.connect((err, client, release) => {
  if (err) {
    console.error('Fehler bei der Datenbankverbindung:', err);
  } else {
    console.log('Datenbankverbindung hergestellt');
    release();
  }
});

// Cookie-Parser Middleware
app.use(cookieParser());

// Basis-Sicherheitsheader
app.use(helmet());

// Update the Content-Security-Policy in server.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://code.jquery.com", "https://cdn.datatables.net", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.datatables.net"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", "https://n8n.dinel.at"]
    }
  },
  crossOriginEmbedderPolicy: false, // May need to be enabled in production
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Body-Parser Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

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

// Flash-Messages
app.use(flash());

// CSRF-Schutz aktivieren
app.use(csrf());

// CSRF-Token als Response-Local verfügbar machen
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Routen verwenden
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
// Projekte-Routen importieren
app.use('/dashboard/projekte', projectRoutes);

// Blog-Routen importieren
const blogRoutes = require('./routes/blog');

// Startseite
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Rising BSM – Ihre Allround-Experten'
  });
});

app.get('/impressum', (req, res) => {
  res.render('impressum', { title: 'Rising BSM – Impressum' });
});

app.get('/datenschutz', (req, res) => {
  res.render('datenschutz', { title: 'Rising BSM – Datenschutz' });
});

app.get('/agb', (req, res) => {
  res.render('agb', { title: 'Rising BSM – AGB' });
});

// Blog-Middleware für Dashboard
app.use('/dashboard/blog', blogRoutes);

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
        LEFT JOIN blog_categories c ON pc.category_id = c.id
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
      await axios.post(process.env.N8N_WEBHOOK_URL || 'https://n8n.dinel.at/webhook/e2b8d680-425b-44ab-94aa-55ecda267de1', {
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
    console.error('Request body:', req.body); // Log the request body for debugging
    res.status(500).json({ success: false, error: error.message });
  }
});

// Globaler Error-Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Ein Serverfehler ist aufgetreten' 
      : err.message 
  });
});

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
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});