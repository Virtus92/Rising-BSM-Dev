/**
 * Appointment Routes
 * Handles all routes related to appointment management
 */
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { validateAppointment } = require('../middleware/validation.middleware');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/appointments
 * @desc    Display list of appointments with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await appointmentController.getAllAppointments(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(data);
    }
    
    // Otherwise render the view
    res.render('dashboard/appointments/index', { 
      title: 'Termine - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      appointments: data.appointments,
      newRequestsCount: req.newRequestsCount,
      statusFilter: req.query.status || '',
      pagination: data.pagination,
      filters: data.filters,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /dashboard/appointments/neu
 * @desc    Display form to create a new appointment
 */
router.get('/neu', async (req, res, next) => {
  try {
    // Get customers for dropdown
    const kundenQuery = await req.db.query({
      text: `
      SELECT id, name FROM kunden ORDER BY name ASC
    `
    });
    
    // Get projects for dropdown
    const projekteQuery = await req.db.query({
      text: `
      SELECT id, titel FROM projekte 
      WHERE status IN ('neu', 'in_bearbeitung') 
      ORDER BY titel ASC
    `
    });
    
    // Prefilled data from query parameters
    const { kunde_id, projekt_id, kunde_name } = req.query;
    
    res.render('dashboard/appointments/neu', {
      title: 'Neuer Termin - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/appointments',
      kunden: kundenQuery.rows,
      projekte: projekteQuery.rows,
      formData: {
        kunde_id: kunde_id || '',
        kunde_name: kunde_name || '',
        projekt_id: projekt_id || '',
        titel: '',
        termin_datum: new Date().toISOString().split('T')[0],
        termin_zeit: new Date().toTimeString().split(' ')[0].substring(0, 5),
        dauer: 60,
        ort: '',
        beschreibung: '',
        status: 'geplant'
      },
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/appointments/neu
 * @desc    Create a new appointment
 */
router.post('/neu', validateAppointment, async (req, res, next) => {
  try {
    const result = await appointmentController.createAppointment(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Termin erfolgreich angelegt.');
    res.redirect(`/dashboard/appointments/${result.appointmentId}`);
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/appointments/neu');
    }
    next(error);
  }
});

/**
 * @route   POST /dashboard/appointments/update-status
 * @desc    Update appointment status
 */
router.post('/update-status', async (req, res, next) => {
  try {
    const result = await appointmentController.updateAppointmentStatus(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Termin-Status erfolgreich aktualisiert.');
    res.redirect(`/dashboard/appointments/${req.body.id}`);
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/appointments/${req.body.id}`);
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/appointments/export
 * @desc    Export appointments in various formats
 */
router.get('/export', async (req, res, next) => {
  try {
    const result = await appointmentController.exportAppointments(req, res, next);
    
    // The export service returns different content types based on format
    const { format, data, contentType, filename } = result;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    if (contentType.includes('json')) {
      return res.json(data);
    } else {
      return res.send(data);
    }
  } catch (error) {
    // For export errors, return JSON error response
    console.error('Export error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'An error occurred during export'
    });
  }
});

/**
 * @route   GET /dashboard/appointments/calendar-events
 * @desc    Get calendar events as JSON for calendar view
 */
router.get('/calendar-events', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    
    // Get appointments in date range
    const termineQuery = await req.db.query({
      text: `
        SELECT 
          t.id, 
          t.titel, 
          t.termin_datum,
          t.dauer,
          t.status,
          t.ort,
          t.beschreibung,
          k.name AS kunde_name,
          k.id AS kunde_id,
          p.titel AS projekt_titel,
          p.id AS projekt_id
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
          LEFT JOIN projekte p ON t.projekt_id = p.id
        WHERE 
          t.termin_datum >= $1 AND t.termin_datum <= $2
        ORDER BY 
          t.termin_datum ASC
      `,
      values: [start, end]
    });
    
    // Format for fullcalendar
    const events = termineQuery.rows.map(termin => {
      const startDate = new Date(appointment.termin_datum);
      const endDate = new Date(startDate.getTime() + (appointment.dauer || 60) * 60000);
      
      // Determine color based on status
      let bgColor;
      switch(appointment.status) {
        case 'geplant': bgColor = '#ffc107'; break; // warning
        case 'bestaetigt': bgColor = '#28a745'; break; // success
        case 'abgeschlossen': bgColor = '#007bff'; break; // primary
        default: bgColor = '#6c757d'; // secondary
      }
      
      return {
        id: appointment.id,
        title: appointment.titel,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: false,
        backgroundColor: bgColor,
        borderColor: bgColor,
        textColor: 'white',
        extendedProps: {
          kunde: appointment.kunde_name,
          kunde_id: appointment.kunde_id,
          projekt: appointment.projekt_titel,
          projekt_id: appointment.projekt_id,
          ort: appointment.ort,
          beschreibung: appointment.beschreibung,
          status: appointment.status
        },
        url: `/dashboard/appointments/${appointment.id}`
      };
    });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database error: ' + error.message 
    });
  }
});

/**
 * @route   POST /dashboard/appointments/:id/add-note
 * @desc    Add a note to an appointment
 */
router.post('/:id/add-note', async (req, res, next) => {
  try {
    const result = await appointmentController.addAppointmentNote(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/appointments/${req.params.id}`);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/appointments/${req.params.id}`);
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/appointments/:id/edit
 * @desc    Display form to edit an appointment
 */
router.get('/:id/edit', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get appointment details
    const appointmentQuery = await req.db.query({
      text: `
        SELECT 
          t.*, 
          k.name AS kunde_name
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
        WHERE 
          t.id = $1
      `,
      values: [id]
    });
    
    if (appointmentQuery.rows.length === 0) {
      req.flash('error', `Termin mit ID ${id} nicht gefunden`);
      return res.redirect('/dashboard/appointments');
    }
    
    const appointment = appointmentQuery.rows[0];
    
    // Get customers for dropdown
    const kundenQuery = await req.db.query(`
      SELECT id, name FROM kunden ORDER BY name ASC
    `);
    
    // Get projects for dropdown
    const projekteQuery = await req.db.query(`
      SELECT id, titel FROM projekte 
      WHERE status IN ('neu', 'in_bearbeitung') 
      ORDER BY titel ASC
    `);
    
    // Format date and time for form
    const appointmentDate = new Date(appointment.termin_datum);
    const formattedDate = appointmentDate.toISOString().split('T')[0];
    const formattedTime = appointmentDate.toTimeString().split(' ')[0].substring(0, 5);
    
    res.render('dashboard/appointments/edit', {
      title: `Termin bearbeiten: ${appointment.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/appointments',
      appointment: {
        id: appointment.id,
        titel: appointment.titel,
        kunde_id: appointment.kunde_id,
        kunde_name: appointment.kunde_name || 'Kein Kunde zugewiesen',
        projekt_id: appointment.projekt_id,
        termin_datum: formattedDate,
        termin_zeit: formattedTime,
        dauer: appointment.dauer || 60,
        ort: appointment.ort || '',
        beschreibung: appointment.beschreibung || '',
        status: appointment.status
      },
      kunden: kundenQuery.rows,
      projekte: projekteQuery.rows,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/appointments/:id/edit
 * @desc    Update an appointment
 */
router.post('/:id/edit', validateAppointment, async (req, res, next) => {
  try {
    const result = await appointmentController.updateAppointment(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Termin erfolgreich aktualisiert.');
    res.redirect(`/dashboard/appointments/${req.params.id}`);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/appointments/${req.params.id}/edit`);
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/appointments/:id
 * @desc    Display appointment details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await appointmentController.getAppointmentById(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(data);
    }
    
    // Otherwise render the view
    res.render('dashboard/appointments/detail', {
      title: `Termin: ${data.appointment.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/appointments',
      termin: data.appointment,
      notizen: data.notes,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    if (error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/appointments');
    }
    next(error);
  }
});

module.exports = router;