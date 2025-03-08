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

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL-Verbindung einrichten
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

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

// Content-Security-Policy anpassen
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"], // unsafe-inline hinzufügen
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'", "https://n8n.dinel.at"]
  }
}));

// Body-Parser Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Startseite
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Rising BSM – Ihre Allround-Experten',
    csrfToken: req.csrfToken()
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

  if (phone && !validator.isMobilePhone(phone, 'any')) {
    return res.status(400).json({ success: false, error: 'Bitte geben Sie eine gültige Telefonnummer ein.' });
  }

  try {
    // Daten in PostgreSQL speichern
    const result = await pool.query(
      'INSERT INTO kontaktanfragen (name, email, phone, service, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone, service, message]
    );
    const contactId = result.rows[0].id;

    // Benachrichtigung an N8N senden
    await axios.post('https://n8n.dinel.at/webhook/e2b8d680-425b-44ab-94aa-55ecda267de1', {
      id: contactId,
      name,
      email,
      phone,
      service,
      message,
    });

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

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});