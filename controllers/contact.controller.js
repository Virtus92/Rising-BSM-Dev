/**
 * Contact Controller
 * Handles submission and processing of contact form submissions
 */
const { pool } = require('../services/db.service');
const NotificationService = require('../services/notification.service');
const { validateInput } = require('../utils/validators');
const { sanitizeInput } = require('../utils/sanitizers');
const { sendMail } = require('../services/mail.service');

/**
 * Submit contact form
 * Validates input, saves to database, and triggers notifications
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response object with success status and message
 */
async function submitContact(req, res, next) {
  try {
    // Validierungsschema
    const schema = {
      name: { type: 'text', required: true, maxLength: 100 },
      email: { type: 'email', required: true },
      telefon: { type: 'phone' },
      nachricht: { type: 'text', required: true, maxLength: 2000 }
    };

    // Validierung durchführen
    const validation = validateInput(req.body, schema);

    if (!validation.isValid) {
      req.flash('error', 'Bitte überprüfen Sie Ihre Eingaben');
      req.flash('errors', validation.errors);
      req.flash('formData', req.body);
      return res.redirect('/contact');
    }

    // Kontaktanfrage in DB speichern
    const { data } = validation;
    await pool.query(
      'INSERT INTO kontaktanfragen (name, email, telefon, nachricht) VALUES ($1, $2, $3, $4)',
      [data.name, data.email, data.telefon, data.nachricht]
    );

    // E-Mail versenden
    await sendMail({
      to: process.env.CONTACT_EMAIL,
      subject: 'Neue Kontaktanfrage',
      text: `
        Name: ${data.name}
        E-Mail: ${data.email}
        Telefon: ${data.telefon || 'Nicht angegeben'}
        
        Nachricht:
        ${data.nachricht}
      `
    });

    req.flash('success', 'Ihre Nachricht wurde erfolgreich gesendet');
    res.redirect('/contact');
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve contact request details
 * Used for admin dashboard or detailed view
 * 
 * @param {string} id - Contact request ID
 * @returns {Promise<Object>} Contact request details
 */
async function getContactRequest(req, res, next) {
  try {
    const result = await pool.query(
      `
        SELECT * FROM kontaktanfragen 
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      const error = new Error('Kontaktanfrage nicht gefunden');
      error.statusCode = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitContact,
  getContactRequest
};