/**
 * Contact Controller
 * Handles submission and processing of contact form submissions
 */
const pool = require('../services/db.service');
const NotificationService = require('../services/notification.service');
const { validateInput } = require('../utils/validators');
const ConnectionManager = require('../services/connectionManager');

/**
 * Submit contact form
 * Validates input, saves to database, and triggers notifications
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.submitContact = async (req, res, next) => {
  try {
    // Input validation schema
    const validationSchema = {
      name: { 
        type: 'text', 
        required: true, 
        minLength: 2, 
        maxLength: 100 
      },
      email: { 
        type: 'email' 
      },
      phone: { 
        type: 'phone', 
        required: false 
      },
      service: { 
        type: 'text', 
        required: true 
      },
      message: { 
        type: 'text', 
        required: true, 
        minLength: 10, 
        maxLength: 1000 
      }
    };

    // Validate input
    const validationResult = validateInput(req.body, validationSchema);

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        errors: validationResult.errors
      });
    }

    const { 
      name, 
      email, 
      phone = null, 
      service, 
      message 
    } = validationResult.validatedData;

    // Insert contact request into database
    const result = await ConnectionManager.withConnection(client => client.query({
      text: `
        INSERT INTO kontaktanfragen (
          name, 
          email, 
          phone, 
          service, 
          message, 
          status,
          ip_adresse
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id
      `,
      values: [
        name, 
        email, 
        phone, 
        service, 
        message, 
        'neu', 
        req.ip
      ]
    }));

    const requestId = result.rows[0].id;

    // Determine notification recipient (admin users)
    const adminQuery = await ConnectionManager.withConnection(client => client.query(`
      SELECT id FROM benutzer 
      WHERE rolle IN ('admin', 'manager')
    `));

    // Create notifications for admins
    const notificationPromises = adminQuery.rows.map(admin => 
      NotificationService.create({
        userId: admin.id,
        type: 'anfrage',
        title: 'Neue Kontaktanfrage',
        message: `Neue Anfrage von ${name} über ${service}`,
        referenceId: requestId,
        referenceType: 'kontaktanfragen'
      })
    );

    await Promise.all(notificationPromises);

    // Respond based on request type
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(201).json({
        success: true,
        message: 'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns bald bei Ihnen.',
        requestId
      });
    } else {
      req.flash('success', 'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns bald bei Ihnen.');
      return res.redirect('/');
    }

  } catch (error) {
    console.error('Contact form submission error:', error);

    // Handle specific error types
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Eine ähnliche Anfrage wurde kürzlich bereits übermittelt.'
      });
    }

    // Generic error handling
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      });
    } else {
      req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      return res.redirect('/');
    }
  }
};

/**
 * Retrieve contact request details
 * Used for admin dashboard or detailed view
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>}
 */
exports.getContactRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await ConnectionManager.withConnection(client => client.query({
      text: `
        SELECT * FROM kontaktanfragen 
        WHERE id = $1
      `,
      values: [id]
    }));

    if (result.rows.length === 0) {
      const error = new Error('Kontaktanfrage nicht gefunden');
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  } catch (error) {
    next(error);
  }
};