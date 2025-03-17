/**
 * Appointment Controller
 * Handles all appointment-related business logic
 */
const pool = require('../services/db.service');
const { formatDateSafely } = require('../utils/formatters');
const { getTerminStatusInfo } = require('../utils/helpers');
const exportService = require('../services/export.service');
const { validateDate, validateTimeFormat } = require('../utils/validators');

/**
 * Get all appointments with optional filtering
 */
exports.getAllAppointments = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { status, date, search, page = 1, limit = 20 } = req.query;

    // Build filter conditions
    let whereClauses = [];
    let queryParams = [];
    let paramCounter = 1;

    if (status) {
      whereClauses.push(`t.status = $${paramCounter++}`);
      queryParams.push(status);
    }

    if (date) {
      whereClauses.push(`DATE(t.termin_datum) = $${paramCounter++}`);
      queryParams.push(date);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      whereClauses.push(`
        (LOWER(t.titel) LIKE $${paramCounter} OR 
         LOWER(k.name) LIKE $${paramCounter})
      `);
      queryParams.push(searchTerm);
      paramCounter++;
    }

    // Create WHERE clause if filters exist
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Query for appointments with pagination
    const query = `
      SELECT 
        t.id, 
        t.titel, 
        t.kunde_id, 
        t.projekt_id,
        t.termin_datum,
        t.dauer,
        t.ort,
        t.status,
        k.name AS kunde_name,
        p.titel AS projekt_titel
      FROM 
        termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
        LEFT JOIN projekte p ON t.projekt_id = p.id
      ${whereClause}
      ORDER BY 
        t.termin_datum ASC
      LIMIT $${paramCounter++} OFFSET $${paramCounter++}
    `;
    
    queryParams.push(parseInt(limit), offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM termine t
      LEFT JOIN kunden k ON t.kunde_id = k.id
      ${whereClause}
    `;

    // Execute both queries in parallel
    const [appointmentsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, paramCounter - 2)) // Exclude LIMIT and OFFSET parameters
    ]);

    // Format appointment data
    const appointments = appointmentsResult.rows.map(appointment => {
      const statusInfo = getTerminStatusInfo(appointment.status);
      return {
        id: appointment.id,
        titel: appointment.titel,
        kunde_id: appointment.kunde_id,
        kunde_name: appointment.kunde_name || 'Kein Kunde zugewiesen',
        projekt_id: appointment.projekt_id,
        projekt_titel: appointment.projekt_titel || 'Kein Projekt zugewiesen',
        termin_datum: appointment.termin_datum,
        dateFormatted: formatDateSafely(appointment.termin_datum, 'dd.MM.yyyy'),
        timeFormatted: formatDateSafely(appointment.termin_datum, 'HH:mm'),
        dauer: appointment.dauer,
        ort: appointment.ort || 'Nicht angegeben',
        status: appointment.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className
      };
    });

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Return data object for rendering or JSON response
    return {
      appointments,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: totalPages,
        totalRecords: total
      },
      filters: {
        status,
        date,
        search
      }
    };
  } catch (error) {
    next(error);
    return undefined;
  }
};

/**
 * Get appointment by ID with related data
 */
exports.getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get appointment details
    const appointmentQuery = await pool.query({
      text: `
        SELECT 
          t.*, 
          k.name AS kunde_name,
          p.titel AS projekt_titel,
          p.id AS projekt_id
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
          LEFT JOIN projekte p ON t.projekt_id = p.id
        WHERE 
          t.id = $1
      `,
      values: [id]
    });
    
    if (appointmentQuery.rows.length === 0) {
      const error = new Error(`Appointment with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    const appointment = appointmentQuery.rows[0];
    const statusInfo = getTerminStatusInfo(appointment.status);

    // Get notes for this appointment
    const notesQuery = await pool.query({
      text: `SELECT * FROM termin_notizen WHERE termin_id = $1 ORDER BY erstellt_am DESC`,
      values: [id]
    });
    
    // Format appointment data for response
    const result = {
      appointment: {
        id: appointment.id,
        titel: appointment.titel,
        kunde_id: appointment.kunde_id,
        kunde_name: appointment.kunde_name || 'Kein Kunde zugewiesen',
        projekt_id: appointment.projekt_id,
        projekt_titel: appointment.projekt_titel || 'Kein Projekt zugewiesen',
        termin_datum: appointment.termin_datum,
        dateFormatted: formatDateSafely(appointment.termin_datum, 'dd.MM.yyyy'),
        timeFormatted: formatDateSafely(appointment.termin_datum, 'HH:mm'),
        dauer: appointment.dauer || 60,
        ort: appointment.ort || 'Nicht angegeben',
        beschreibung: appointment.beschreibung || 'Keine Beschreibung vorhanden',
        status: appointment.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className
      },
      notes: notesQuery.rows.map(note => ({
        id: note.id,
        text: note.text,
        formattedDate: formatDateSafely(note.erstellt_am, 'dd.MM.yyyy, HH:mm'),
        benutzer: note.benutzer_name
      }))
    };
    
    return result;
  } catch (error) {
    next(error);
    return undefined; // Explicitly return undefined when there's an error
  }
};

/**
 * Create a new appointment
 */
exports.createAppointment = async (req, res, next) => {
  try {
    const { 
      titel, 
      kunde_id, 
      projekt_id,
      termin_datum, 
      termin_zeit, 
      dauer, 
      ort, 
      beschreibung, 
      status 
    } = req.body;

    // Validate inputs
    const dateValidation = validateDate(termin_datum, { required: true });
    const timeValidation = validateTimeFormat(termin_zeit, { required: true });
    
    // Validation
    if (!titel || !termin_datum || !termin_zeit || !dateValidation.isValid || !timeValidation.isValid) {
      const errorMessages = [];
      if (!titel) errorMessages.push('Title is required');
      if (!termin_datum) errorMessages.push('Date is required');
      if (!termin_zeit) errorMessages.push('Time is required');
      if (termin_datum && !dateValidation.isValid) errorMessages.push(dateValidation.errors.join(', '));
      if (termin_zeit && !timeValidation.isValid) errorMessages.push(timeValidation.errors.join(', '));
      
      const error = new Error(`Validation failed: ${errorMessages.join('; ')}`);
      error.statusCode = 400;
      throw error;
    }
    
    // Combine date and time
    const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
    
    // Insert appointment into database
    const result = await pool.query({
      text: `
        INSERT INTO termine (
          titel, kunde_id, projekt_id, termin_datum, dauer, ort, 
          beschreibung, status, erstellt_von
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `,
      values: [
        titel, 
        kunde_id || null,
        projekt_id || null, 
        appointmentDate, 
        dauer || 60, 
        ort || null, 
        beschreibung || null, 
        status || 'geplant',
        req.session.user.id
      ]
    });
    
    // Log activity
    await pool.query({
      text: `
        INSERT INTO termin_log (
          termin_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        result.rows[0].id,
        req.session.user.id,
        req.session.user.name,
        'created',
        'Appointment created'
      ]
    });

    return {
      success: true,
      appointmentId: result.rows[0].id,
      message: 'Appointment created successfully'
    };
  } catch (error) {
    next(error);
    return undefined;
  }
};

/**
 * Update an existing appointment
 */
exports.updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      titel, 
      kunde_id, 
      projekt_id,
      termin_datum, 
      termin_zeit, 
      dauer, 
      ort, 
      beschreibung, 
      status
    } = req.body;
    
    // Validation
    if (!titel || !termin_datum || !termin_zeit) {
      const error = new Error('Title, date and time are required fields');
      error.statusCode = 400;
      throw error;
    }

    // Check if appointment exists
    const checkResult = await pool.query({
      text: 'SELECT id FROM termine WHERE id = $1',
      values: [id]
    });

    if (checkResult.rows.length === 0) {
      const error = new Error(`Appointment with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    // Combine date and time
    const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
    
    // Update appointment in database
    await pool.query({
      text: `
        UPDATE termine SET 
          titel = $1, 
          kunde_id = $2, 
          projekt_id = $3, 
          termin_datum = $4, 
          dauer = $5, 
          ort = $6, 
          beschreibung = $7, 
          status = $8, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $9
      `,
      values: [
        titel, 
        kunde_id || null, 
        projekt_id || null,
        appointmentDate, 
        dauer || 60, 
        ort || null, 
        beschreibung || null, 
        status || 'geplant',
        id
      ]
    });
    
    // Log activity
    await pool.query({
      text: `
        INSERT INTO termin_log (
          termin_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id,
        req.session.user.id,
        req.session.user.name,
        'updated',
        'Appointment updated'
      ]
    });

    return {
      success: true,
      appointmentId: id,
      message: 'Appointment updated successfully'
    };
  } catch (error) {
    next(error);
    return undefined;
  }
};

/**
 * Update appointment status
 */
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id, status, note } = req.body;
    
    // Validation
    if (!id || !status) {
      const error = new Error('Appointment ID and status are required');
      error.statusCode = 400;
      throw error;
    }
    
    // Check valid status values
    if (!['geplant', 'bestaetigt', 'abgeschlossen', 'storniert'].includes(status)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }
    
    // Update status in database
    await pool.query({
      text: `UPDATE termine SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [status, id]
    });
    
    // Add note if provided
    if (note && note.trim() !== '') {
      await pool.query({
        text: `
          INSERT INTO termin_notizen (
            termin_id, benutzer_id, benutzer_name, text
          ) VALUES ($1, $2, $3, $4)
        `,
        values: [
          id,
          req.session.user.id,
          req.session.user.name,
          note
        ]
      });
    }
    
    // Log the status change
    await pool.query({
      text: `
        INSERT INTO termin_log (
          termin_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id,
        req.session.user.id,
        req.session.user.name,
        'status_changed',
        `Status changed to: ${status}`
      ]
    });

    return {
      success: true,
      appointmentId: id,
      message: 'Appointment status updated successfully'
    };
  } catch (error) {
    next(error);
    return undefined;
  }
};

/**
 * Add a note to appointment
 */
exports.addAppointmentNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    if (!note || note.trim() === '') {
      const error = new Error('Note cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    
    // Check if appointment exists
    const checkResult = await pool.query({
      text: 'SELECT id FROM termine WHERE id = $1',
      values: [id]
    });

    if (checkResult.rows.length === 0) {
      const error = new Error(`Appointment with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    // Insert note into database
    await pool.query({
      text: `
        INSERT INTO termin_notizen (
          termin_id, benutzer_id, benutzer_name, text
        ) VALUES ($1, $2, $3, $4)
      `,
      values: [
        id,
        req.session.user.id,
        req.session.user.name,
        note
      ]
    });
    
    // Log the note addition
    await pool.query({
      text: `
        INSERT INTO termin_log (
          termin_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id,
        req.session.user.id,
        req.session.user.name,
        'note_added',
        'Note added to appointment'
      ]
    });

    return {
      success: true,
      appointmentId: id.toString(),
      message: 'Note added successfully'
    };
  } catch (error) {
    next(error);
    return undefined;
  }
};

/**
 * Export appointments data
 */
exports.exportAppointments = async (req, res, next) => {
  try {
    const { format, start_date, end_date, status } = req.query;
    
    // Build filter conditions
    let conditions = [];
    let params = [];
    let paramCounter = 1;
    
    // Date range filter
    if (start_date) {
      conditions.push(`termin_datum >= $${paramCounter++}`);
      params.push(new Date(start_date));
    }
    
    if (end_date) {
      conditions.push(`termin_datum <= $${paramCounter++}`);
      params.push(new Date(end_date));
    }
    
    // Status filter
    if (status) {
      conditions.push(`t.status = $${paramCounter++}`);
      params.push(status);
    }
    
    // Create WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Query data
    const query = {
      text: `
        SELECT 
          t.id, 
          t.titel, 
          t.termin_datum, 
          t.dauer, 
          t.ort, 
          t.status,
          t.beschreibung,
          k.name AS kunde_name,
          p.titel AS projekt_titel
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
          LEFT JOIN projekte p ON t.projekt_id = p.id
        ${whereClause}
        ORDER BY t.termin_datum
      `,
      values: params
    };
    
    const result = await pool.query(query);
    
    // Use export service to generate the appropriate format
    return await exportService.generateExport(result.rows, format, {
      filename: 'termine-export',
      title: 'Terminliste - Rising BSM',
      columns: [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Titel', key: 'titel', width: 30 },
        { header: 'Datum', key: 'datum', width: 15, 
          format: (value, row) => formatDateSafely(row.termin_datum, 'dd.MM.yyyy') },
        { header: 'Uhrzeit', key: 'uhrzeit', width: 10,
          format: (value, row) => formatDateSafely(row.termin_datum, 'HH:mm') },
        { header: 'Dauer (Min)', key: 'dauer', width: 10 },
        { header: 'Status', key: 'status', width: 15,
          format: (value) => getTerminStatusInfo(value).label },
        { header: 'Kunde', key: 'kunde_name', width: 25, default: 'Kein Kunde' },
        { header: 'Projekt', key: 'projekt_titel', width: 25, default: 'Kein Projekt' },
        { header: 'Ort', key: 'ort', width: 20, default: '' },
        { header: 'Beschreibung', key: 'beschreibung', width: 50, default: '' }
      ],
      filters: { start_date, end_date, status }
    });
  } catch (error) {
    next(error);
    return undefined;
  }
};