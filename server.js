require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');

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

// Body-Parser Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Startseite bereitstellen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Kontaktformular-Route
app.post('/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  // Server-side validation for required fields
  if (!name || !email || !message || !service) {
    return res.status(400).json({ success: false, error: 'Name, E-Mail und Nachricht sind Pflichtfelder.' });
  }

  try {
    // Daten in PostgreSQL speichern
    const result = await pool.query(
      'INSERT INTO kontaktanfragen (name, email, phone, service, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone, service, message]
    );
    const contactId = result.rows[0].id;

    // Benachrichtigung an N8N senden
    await axios.post('https://n8n.dinel.at/webhook-test/e2b8d680-425b-44ab-94aa-55ecda267de1', {
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

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});