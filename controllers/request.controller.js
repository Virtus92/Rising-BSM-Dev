/**
 * Request Controller
 * Handles all contact request-related business logic
 */
const pool = require('../services/db.service');
const { formatDateSafely } = require('../utils/formatters');
const { getAnfrageStatusInfo } = require('../utils/helpers');
const exportService = require('../services/export.service');

/**
 * Get all requests with optional filtering
 */
exports.getAllRequests = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { status, service, date, search, page = 1, limit = 20 } = req.query;

    console.log('Request User Session:', req.session?.user);
    console.log('Request Query Parameters:', req.query);
    console.log('Request Headers:', req.headers);

    // Build filter conditions
    let whereClauses = [];
    let queryParams = [];
    let paramCounter = 1;

    if (status) {
      whereClauses.push(`status = $${paramCounter++}`);
      queryParams.push(status);
    }

    if (service) {
      whereClauses.push(`service = $${paramCounter++}`);
      queryParams.push(service);
    }

    if (date) {
      whereClauses.push(`DATE(created_at) = $${paramCounter++}`);
      queryParams.push(date);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      whereClauses.push(`
        (LOWER(name) LIKE $${paramCounter} OR 
         LOWER(email) LIKE $${paramCounter})
      `);
      queryParams.push(searchTerm);
      paramCounter++;
    }

    // Create WHERE clause if filters exist
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Query for requests with pagination
    const query = `
      SELECT 
        id, 
        name, 
        email, 
        service, 
        status, 
        created_at
      FROM 
        kontaktanfragen
      ${whereClause}
      ORDER BY 
        created_at DESC
      LIMIT $${paramCounter++} OFFSET $${paramCounter++}
    `;
    
    queryParams.push(parseInt(limit), offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM kontaktanfragen
      ${whereClause}
    `;

    let countQueryParams = [];
    let countParamCounter = 1;

    if (status) {
      countQueryParams.push(status);
    }

    if (service) {
      countQueryParams.push(service);
    }

    if (date) {
      countQueryParams.push(date);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      countQueryParams.push(searchTerm);
    }

    // Execute both queries in parallel
    const [requestsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countQueryParams)
    ]);

    // Format request data
    const requests = requestsResult.rows.map(request => {
      const statusInfo = getAnfrageStatusInfo(request.status);
      return {
        id: request.id,
        name: request.name,
        email: request.email,
        serviceLabel: request.service === 'facility' ? 'Facility Management' : 
                     request.service === 'moving' ? 'Umzüge & Transporte' : 
                     request.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
        formattedDate: formatDateSafely(request.created_at, 'dd.MM.yyyy'),
        status: statusInfo.label,
        statusClass: statusInfo.className
      };
    });

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Return data object for rendering or JSON response
    return {
      requests,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: totalPages,
        totalRecords: total
      },
      filters: {
        status,
        service,
        date,
        search
      }
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Get request by ID with related data
 */
exports.getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get request details
    const requestQuery = await pool.query({
      text: `SELECT * FROM kontaktanfragen WHERE id = $1`,
      values: [id]
    });
    
    if (requestQuery.rows.length === 0) {
      const error = new Error(`Request with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    const request = requestQuery.rows[0];
    const statusInfo = getAnfrageStatusInfo(request.status);

    // Get notes for this request
    const notesQuery = await pool.query({
      text: `SELECT * FROM anfragen_notizen WHERE anfrage_id = $1 ORDER BY erstellt_am DESC`,
      values: [id]
    });
    
    // Format request data for response
    const result = {
      request: {
        id: request.id,
        name: request.name,
        email: request.email,
        phone: request.phone || 'Nicht angegeben',
        serviceLabel: request.service === 'facility' ? 'Facility Management' : 
                     request.service === 'moving' ? 'Umzüge & Transporte' : 
                     request.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
        message: request.message,
        formattedDate: formatDateSafely(request.created_at, 'dd.MM.yyyy, HH:mm'),
        status: statusInfo.label,
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
  }
};

/**
 * Update request status
 */
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { id, status, note } = req.body;
    
    // Validation
    if (!id || !status) {
      const error = new Error('Request ID and status are required');
      error.statusCode = 400;
      throw error;
    }
    
    // Check valid status values
    if (!['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'].includes(status)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }
    
    // Update status in database
    await pool.query({
      text: `UPDATE kontaktanfragen SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [status, id]
    });
    
    // Add note if provided
    if (note && note.trim() !== '') {
      await pool.query({
        text: `
          INSERT INTO anfragen_notizen (
            anfrage_id, benutzer_id, benutzer_name, text
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
        INSERT INTO anfragen_log (
          anfrage_id, benutzer_id, benutzer_name, aktion, details
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
      requestId: id,
      message: 'Request status updated successfully'
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Add a note to request
 */
exports.addRequestNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    if (!note || note.trim() === '') {
      const error = new Error('Note cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    
    // Check if request exists
    const checkResult = await pool.query({
      text: 'SELECT id FROM kontaktanfragen WHERE id = $1',
      values: [id]
    });

    if (checkResult.rows.length === 0) {
      const error = new Error(`Request with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    // Insert note into database
    await pool.query({
      text: `
        INSERT INTO anfragen_notizen (
          anfrage_id, benutzer_id, benutzer_name, text
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
        INSERT INTO anfragen_log (
          anfrage_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id,
        req.session.user.id,
        req.session.user.name,
        'note_added',
        'Note added to request'
      ]
    });

    return {
      success: true,
      requestId: id,
      message: 'Note added successfully'
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Export requests data
 */
exports.exportRequests = async (req, res, next) => {
  try {
    const { format, dateFrom, dateTo, status } = req.query;
    
    // Build filter conditions
    let conditions = [];
    let params = [];
    let paramCounter = 1;
    
    if (dateFrom) {
      conditions.push(`created_at >= $${paramCounter++}`);
      params.push(dateFrom);
    }
    
    if (dateTo) {
      conditions.push(`created_at <= $${paramCounter++}`);
      params.push(dateTo);
    }
    
    if (status && Array.isArray(status)) {
      conditions.push(`status IN (${status.map((_, i) => `$${paramCounter + i}`).join(', ')})`);
      params.push(...status);
      paramCounter += status.length;
    } else if (status) {
      conditions.push(`status = $${paramCounter++}`);
      params.push(status);
    }
    
    // Create WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Query data
    const query = {
      text: `
        SELECT 
          id, 
          name, 
          email, 
          phone, 
          service, 
          message, 
          status, 
          created_at
        FROM 
          kontaktanfragen
        ${whereClause}
        ORDER BY 
          created_at DESC
      `,
      values: params
    };
    
    const result = await pool.query(query);
    
    // Use export service to generate the appropriate format
    return await exportService.generateExport(result.rows, format, {
      filename: 'anfragen-export',
      title: 'Kontaktanfragen - Rising BSM',
      columns: [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'E-Mail', key: 'email', width: 30 },
        { header: 'Telefon', key: 'phone', width: 15, default: '' },
        { header: 'Service', key: 'service', width: 15,
          format: (value) => value === 'facility' ? 'Facility Management' : 
                           value === 'moving' ? 'Umzüge & Transporte' : 
                           value === 'winter' ? 'Winterdienst' : 'Sonstiges' },
        { header: 'Nachricht', key: 'message', width: 50, default: '' },
        { header: 'Status', key: 'status', width: 15,
          format: (value) => getAnfrageStatusInfo(value).label },
        { header: 'Datum', key: 'created_at', width: 15,
          format: (value) => formatDateSafely(value, 'dd.MM.yyyy HH:mm') }
      ],
      filters: { dateFrom, dateTo, status }
    });
  } catch (error) {
    next(error);
  }
};