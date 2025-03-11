/**
 * Service Controller
 * Handles all service-related business logic
 */
const pool = require('../services/db.service');
const { formatDateSafely } = require('../utils/formatters');
const exportService = require('../services/export.service');

/**
 * Get all services with optional filtering
 */
exports.getAllServices = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { status, search, page = 1, limit = 20 } = req.query;

    // Build filter conditions
    let whereClauses = [];
    let queryParams = [];
    let paramCounter = 1;

    if (status === 'aktiv') {
      whereClauses.push(`aktiv = true`);
    } else if (status === 'inaktiv') {
      whereClauses.push(`aktiv = false`);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      whereClauses.push(`
        (LOWER(name) LIKE $${paramCounter} OR 
         LOWER(beschreibung) LIKE $${paramCounter})
      `);
      queryParams.push(searchTerm);
      paramCounter++;
    }

    // Create WHERE clause if filters exist
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Query for services with pagination
    const query = `
      SELECT 
        id, 
        name, 
        beschreibung, 
        preis_basis, 
        einheit, 
        mwst_satz, 
        aktiv,
        created_at,
        updated_at
      FROM 
        dienstleistungen
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramCounter++} OFFSET $${paramCounter++}
    `;
    
    queryParams.push(parseInt(limit), offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM dienstleistungen
      ${whereClause}
    `;

    // Execute both queries in parallel
    const [servicesResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, paramCounter - 2)) // Exclude LIMIT and OFFSET parameters
    ]);

    // Format service data
    const services = servicesResult.rows.map(service => ({
      id: service.id,
      name: service.name,
      beschreibung: service.beschreibung,
      preis_basis: parseFloat(service.preis_basis),
      einheit: service.einheit,
      mwst_satz: parseFloat(service.mwst_satz),
      aktiv: service.aktiv,
      created_at: formatDateSafely(service.created_at, 'dd.MM.yyyy'),
      updated_at: formatDateSafely(service.updated_at, 'dd.MM.yyyy')
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Return data object for rendering or JSON response
    return {
      services,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: totalPages,
        totalRecords: total
      },
      filters: {
        status,
        search
      }
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Get service by ID
 */
exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get service details
    const serviceQuery = await pool.query({
      text: `
        SELECT 
          id, 
          name, 
          beschreibung, 
          preis_basis, 
          einheit, 
          mwst_satz, 
          aktiv,
          created_at,
          updated_at
        FROM dienstleistungen 
        WHERE id = $1
      `,
      values: [id]
    });
    
    if (serviceQuery.rows.length === 0) {
      const error = new Error(`Service with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    const service = serviceQuery.rows[0];
    
    // Format service data for response
    return {
      service: {
        id: service.id,
        name: service.name,
        beschreibung: service.beschreibung || '',
        preis_basis: parseFloat(service.preis_basis),
        einheit: service.einheit,
        mwst_satz: parseFloat(service.mwst_satz),
        aktiv: service.aktiv,
        created_at: formatDateSafely(service.created_at, 'dd.MM.yyyy'),
        updated_at: formatDateSafely(service.updated_at, 'dd.MM.yyyy')
      }
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new service
 */
exports.createService = async (req, res, next) => {
  try {
    const { 
      name, 
      beschreibung, 
      preis_basis, 
      einheit, 
      mwst_satz, 
      aktiv 
    } = req.body;
    
    // Validation
    if (!name || !preis_basis || !einheit) {
      const error = new Error('Name, base price and unit are required fields');
      error.statusCode = 400;
      throw error;
    }
    
    // Insert service into database
    const result = await pool.query({
      text: `
        INSERT INTO dienstleistungen (
          name, 
          beschreibung, 
          preis_basis, 
          einheit, 
          mwst_satz, 
          aktiv
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `,
      values: [
        name, 
        beschreibung || null, 
        parseFloat(preis_basis), 
        einheit, 
        parseFloat(mwst_satz || 20), 
        aktiv === 'on' || aktiv === true
      ]
    });
    
    // Log the activity
    await pool.query({
      text: `
        INSERT INTO dienstleistungen_log (
          dienstleistung_id, 
          benutzer_id, 
          benutzer_name, 
          aktion, 
          details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        result.rows[0].id,
        req.session.user.id,
        req.session.user.name,
        'created',
        'Service created'
      ]
    });

    return {
      success: true,
      serviceId: result.rows[0].id,
      message: 'Service created successfully'
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing service
 */
exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      beschreibung, 
      preis_basis, 
      einheit, 
      mwst_satz, 
      aktiv 
    } = req.body;
    
    // Validation
    if (!name || !preis_basis || !einheit) {
      const error = new Error('Name, base price and unit are required fields');
      error.statusCode = 400;
      throw error;
    }

    // Check if service exists
    const checkResult = await pool.query({
      text: 'SELECT id FROM dienstleistungen WHERE id = $1',
      values: [id]
    });

    if (checkResult.rows.length === 0) {
      const error = new Error(`Service with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    // Update service in database
    await pool.query({
      text: `
        UPDATE dienstleistungen 
        SET 
          name = $1, 
          beschreibung = $2, 
          preis_basis = $3, 
          einheit = $4, 
          mwst_satz = $5, 
          aktiv = $6, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $7
      `,
      values: [
        name, 
        beschreibung || null, 
        parseFloat(preis_basis), 
        einheit, 
        parseFloat(mwst_satz || 20), 
        aktiv === 'on' || aktiv === true,
        id
      ]
    });
    
    // Log the activity
    await pool.query({
      text: `
        INSERT INTO dienstleistungen_log (
          dienstleistung_id, 
          benutzer_id, 
          benutzer_name, 
          aktion, 
          details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id,
        req.session.user.id,
        req.session.user.name,
        'updated',
        'Service updated'
      ]
    });

    return {
      success: true,
      serviceId: id,
      message: 'Service updated successfully'
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle service status (active/inactive)
 */
exports.toggleServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { aktiv } = req.body;
    
    // Check if service exists
    const checkResult = await pool.query({
      text: 'SELECT id FROM dienstleistungen WHERE id = $1',
      values: [id]
    });

    if (checkResult.rows.length === 0) {
      const error = new Error(`Service with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    // Update service status in database
    await pool.query({
      text: `
        UPDATE dienstleistungen 
        SET 
          aktiv = $1, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `,
      values: [
        aktiv === 'on' || aktiv === true,
        id
      ]
    });
    
    // Log the activity
    await pool.query({
      text: `
        INSERT INTO dienstleistungen_log (
          dienstleistung_id, 
          benutzer_id, 
          benutzer_name, 
          aktion, 
          details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id,
        req.session.user.id,
        req.session.user.name,
        'status_changed',
        `Status changed to: ${aktiv ? 'active' : 'inactive'}`
      ]
    });

    return {
      success: true,
      serviceId: id,
      message: `Service ${aktiv ? 'activated' : 'deactivated'} successfully`
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Get service statistics
 */
exports.getServiceStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate service exists
    const serviceQuery = await pool.query({
      text: 'SELECT name FROM dienstleistungen WHERE id = $1',
      values: [id]
    });
    
    if (serviceQuery.rows.length === 0) {
      const error = new Error(`Service with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    
    // Total revenue for this service
    const revenueQuery = await pool.query({
      text: `
        SELECT 
          SUM(rp.anzahl * rp.einzelpreis) as gesamtumsatz,
          COUNT(DISTINCT r.id) as rechnungsanzahl
        FROM 
          rechnungspositionen rp
          JOIN rechnungen r ON rp.rechnung_id = r.id
        WHERE 
          rp.dienstleistung_id = $1
      `,
      values: [id]
    });

    // Monthly revenue development
    const monthlyRevenueQuery = await pool.query({
      text: `
        SELECT 
          DATE_TRUNC('month', r.rechnungsdatum) as monat,
          SUM(rp.anzahl * rp.einzelpreis) as umsatz
        FROM 
          rechnungspositionen rp
          JOIN rechnungen r ON rp.rechnung_id = r.id
        WHERE 
          rp.dienstleistung_id = $1
        GROUP BY 
          DATE_TRUNC('month', r.rechnungsdatum)
        ORDER BY 
          monat
      `,
      values: [id]
    });

    // Top customers for this service
    const topCustomersQuery = await pool.query({
      text: `
        SELECT 
          k.id, 
          k.name, 
          SUM(rp.anzahl * rp.einzelpreis) as umsatz
        FROM 
          rechnungspositionen rp
          JOIN rechnungen r ON rp.rechnung_id = r.id
          JOIN kunden k ON r.kunde_id = k.id
        WHERE 
          rp.dienstleistung_id = $1
        GROUP BY 
          k.id, k.name
        ORDER BY 
          umsatz DESC
        LIMIT 5
      `,
      values: [id]
    });
    
    return {
      statistics: {
        name: serviceQuery.rows[0].name,
        gesamtumsatz: revenueQuery.rows[0].gesamtumsatz || 0,
        rechnungsanzahl: parseInt(revenueQuery.rows[0].rechnungsanzahl || 0),
        monatlicheUmsaetze: monthlyRevenueQuery.rows.map(row => ({
          monat: formatDateSafely(row.monat, 'MM/yyyy'),
          umsatz: parseFloat(row.umsatz)
        })),
        topKunden: topCustomersQuery.rows.map(row => ({
          kundenId: row.id,
          kundenName: row.name,
          umsatz: parseFloat(row.umsatz)
        }))
      }
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Export services data
 */
exports.exportServices = async (req, res, next) => {
  try {
    const { format, status } = req.query;
    
    // Build filter conditions
    let conditions = [];
    let params = [];
    
    if (status === 'aktiv') {
      conditions.push('aktiv = true');
    } else if (status === 'inaktiv') {
      conditions.push('aktiv = false');
    }
    
    // Create WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Query data
    const query = {
      text: `
        SELECT 
          id, 
          name, 
          beschreibung, 
          preis_basis, 
          einheit, 
          mwst_satz, 
          aktiv,
          created_at
        FROM 
          dienstleistungen
        ${whereClause}
        ORDER BY name ASC
      `,
      values: params
    };
    
    const result = await pool.query(query);
    
    // Use export service to generate the appropriate format
    return await exportService.generateExport(result.rows, format, {
      filename: 'dienstleistungen-export',
      title: 'Dienstleistungen - Rising BSM',
      columns: [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Beschreibung', key: 'beschreibung', width: 50, default: '' },
        { header: 'Basis-Preis', key: 'preis_basis', width: 15,
          format: (value) => parseFloat(value).toLocaleString('de-DE', {style: 'currency', currency: 'EUR'}) },
        { header: 'Einheit', key: 'einheit', width: 15 },
        { header: 'MwSt-Satz', key: 'mwst_satz', width: 15,
          format: (value) => `${value}%` },
        { header: 'Status', key: 'aktiv', width: 15,
          format: (value) => value ? 'Aktiv' : 'Inaktiv' },
        { header: 'Erstellt am', key: 'created_at', width: 15,
          format: (value) => formatDateSafely(value, 'dd.MM.yyyy') }
      ],
      filters: { status }
    });
  } catch (error) {
    next(error);
  }
};