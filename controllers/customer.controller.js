/**
 * Customer Controller
 * Handles all customer-related business logic
 */
const BaseController = require('./baseController');
const pool = require('../services/db.service');
const { formatDateSafely } = require('../utils/formatters');
const { getProjektStatusInfo, getTerminStatusInfo } = require('../utils/helpers');
const exportService = require('../services/export.service');
const { validateCustomerCreation, validateCustomerUpdate, validateCustomerStatusUpdate, validateCustomerId } = require('../middleware/customerValidation.middleware');
const ConnectionManager = require('../services/connectionManager');

class CustomerController extends BaseController {
  /**
   * Get all customers with optional filtering
   */
  async getAllCustomers(req, res, next) {
    return this.executeQuery(async () => {
      // Extract filter parameters
      const { status = '', type = '', search = '', page = '1', limit = '20' } = req.query;

      // Build filter conditions
      let conditions = [];
      let params = [];
      let paramCounter = 1;

      if (status) {
        conditions.push(`status = $${paramCounter++}`);
        params.push(status);
      }

      if (type) {
        conditions.push(`kundentyp = $${paramCounter++}`);
        params.push(type);
      }

      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(`
        (LOWER(name) LIKE $${paramCounter} OR 
         LOWER(firma) LIKE $${paramCounter} OR 
         LOWER(email) LIKE $${paramCounter})
      `);
        params.push(searchTerm);
        paramCounter++;
      }

      // Create WHERE clause if filters exist
      let { whereClause, paramIndex: newParamCounter } = this.buildWhereClause(conditions, params);

      // Calculate pagination
      const offset = (page - 1) * limit;
    
      // Query for customers with pagination
      let query = `
      SELECT 
        id, name, firma, email, telefon, adresse, plz, ort,
        status, kundentyp, created_at
      FROM kunden
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${newParamCounter++} OFFSET $${newParamCounter++}
    `;
    
      params.push(parseInt(limit), offset);

      // Get total count for pagination
      let countQuery = `
      SELECT COUNT(*) AS total
      FROM kunden
      ${whereClause}
    `;
    
      // Execute both queries in parallel
      const [customersResult, countResult] = await Promise.all([
        ConnectionManager.withConnection(client => client.query(query, params)),
        ConnectionManager.withConnection(client => client.query(countQuery, params.slice(0, params.length - 2)))
      ]);

      // Format customer data
      const customers = customersResult.rows.map(customer => ({
        id: customer.id,
        name: customer.name,
        firma: customer.firma,
        email: customer.email,
        telefon: customer.telefon,
        adresse: customer.adresse,
        plz: customer.plz,
        ort: customer.ort,
        status: customer.status,
        statusLabel: customer.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
        statusClass: customer.status === 'aktiv' ? 'success' : 'secondary',
        kundentyp: customer.kundentyp,
        kundentypLabel: customer.kundentyp === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
        created_at: formatDateSafely(customer.created_at, 'dd.MM.yyyy')
      }));

      // Get customer statistics
      const statsQuery = await ConnectionManager.withConnection(client => client.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN kundentyp = 'privat' THEN 1 END) AS privat,
        COUNT(CASE WHEN kundentyp = 'geschaeft' THEN 1 END) AS geschaeft,
        COUNT(CASE WHEN status = 'aktiv' THEN 1 END) AS aktiv
      FROM kunden
    `));

      // Get growth data for the chart
      const growthQuery = await ConnectionManager.withConnection(client => client.query(`
      SELECT
        DATE_TRUNC('month', created_at) AS month,
        COUNT(*) AS customer_count
      FROM kunden
      WHERE status != 'geloescht' AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `));

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      // Return data object for rendering or JSON response
      const data = {
        customers,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total: totalPages,
          totalRecords: total
        },
        filters: {
          status,
          type,
          search
        },
        stats: statsQuery.rows[0],
        growthData: growthQuery.rows.map(row => ({
          month: formatDateSafely(row.month, 'MM/yyyy'),
          customer_count: parseInt(row.customer_count)
        }))
      };

      return data;
    }, next);
  }

  /**
   * Get customer by ID with related data
   */
  async getCustomerById(req, res, next) {
    return this.executeQuery(async () => {
      const { id } = req.params;
    
      // Get customer details
      const customerQuery = await ConnectionManager.withConnection(client => client.query({
        text: `SELECT * FROM kunden WHERE id = $1`,
        values: [id]
      }));
    
      if (customerQuery.rows.length === 0) {
        const error = new Error(`Customer with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }
    
      const customer = customerQuery.rows[0];

      // Get appointments for this customer
      const appointmentsQuery = await ConnectionManager.withConnection(client => client.query({
        text: `
        SELECT id, titel, termin_datum, status 
        FROM termine 
        WHERE kunde_id = $1 
        ORDER BY termin_datum DESC
        LIMIT 10
      `,
        values: [id]
      }));
    
      // Get projects for this customer
      const projectsQuery = await ConnectionManager.withConnection(client => client.query({
        text: `
        SELECT id, titel, start_datum, status 
        FROM projekte 
        WHERE kunde_id = $1 
        ORDER BY start_datum DESC
        LIMIT 10
      `,
        values: [id]
      }));
    
      // Format customer data for response
      const result = {
        customer: {
          id: customer.id,
          name: customer.name,
          firma: customer.firma || 'Nicht angegeben',
          email: customer.email,
          telefon: customer.telefon || 'Nicht angegeben',
          adresse: customer.adresse || 'Nicht angegeben',
          plz: customer.plz || '',
          ort: customer.ort || '',
          kundentyp: customer.kundentyp === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
          status: customer.status,
          statusLabel: customer.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
          statusClass: customer.status === 'aktiv' ? 'success' : 'secondary',
          notizen: customer.notizen || 'Keine Notizen vorhanden',
          newsletter: customer.newsletter,
          created_at: formatDateSafely(customer.created_at, 'dd.MM.yyyy')
        },
        appointments: appointmentsQuery.rows.map(appointment => {
          const statusInfo = getTerminStatusInfo(appointment.status);
          return {
            id: appointment.id,
            titel: appointment.titel,
            datum: formatDateSafely(appointment.termin_datum, 'dd.MM.yyyy, HH:mm'),
            status: appointment.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className
          };
        }),
        projects: projectsQuery.rows.map(project => {
          const statusInfo = getProjektStatusInfo(project.status);
          return {
            id: project.id,
            titel: project.titel,
            datum: formatDateSafely(project.start_datum, 'dd.MM.yyyy'),
            status: project.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className
          };
        })
      };
    
      return result;
    }, next);
  }

  /**
   * Create a new customer
   */
  async createCustomer(req, res, next) {
    return this.executeQuery(async () => {
      const { 
        name, 
        firma, 
        email, 
        telefon, 
        adresse, 
        plz, 
        ort, 
        kundentyp, 
        status, 
        notizen, 
        newsletter 
      } = req.body;
    
      // Validation
      if (!name || !email) {
        const error = new Error('Name and email are required fields');
        error.statusCode = 400;
        throw error;
      }
    
      // Insert customer into database
      const result = await ConnectionManager.withConnection(client => client.query({
        text: `
        INSERT INTO kunden (
          name, firma, email, telefon, adresse, plz, ort, 
          kundentyp, status, notizen, newsletter
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id
      `,
        values: [
          name, 
          firma || null, 
          email, 
          telefon || null, 
          adresse || null, 
          plz || null, 
          ort || null, 
          kundentyp || 'privat', 
          status || 'aktiv', 
          notizen || null, 
          newsletter === 'on' || newsletter === true
        ]
      }));
    
      // Log the activity
      await ConnectionManager.withConnection(client => client.query({
        text: `
        INSERT INTO kunden_log (
          kunde_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          result.rows[0].id,
          req.session.user.id,
          req.session.user.name,
          'created',
          'Customer created'
        ]
      }));

      return {
        success: true,
        customerId: result.rows[0].id,
        message: 'Customer created successfully'
      };
    }, next);
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(req, res, next) {
    return this.executeQuery(async () => {
      const { id } = req.params;
      const { 
        name, 
        firma, 
        email, 
        telefon, 
        adresse, 
        plz, 
        ort, 
        kundentyp, 
        status, 
        notizen, 
        newsletter 
      } = req.body;
    
      // Validation
      if (!name || !email) {
        const error = new Error('Name and email are required fields');
        error.statusCode = 400;
        throw error;
      }

      // Check if customer exists
      const checkResult = await ConnectionManager.withConnection(client => client.query({
        text: 'SELECT id FROM kunden WHERE id = $1',
        values: [id]
      }));

      if (checkResult.rows.length === 0) {
        const error = new Error(`Customer with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }
    
      // Update customer in database
      await ConnectionManager.withConnection(client => client.query({
        text: `
        UPDATE kunden SET 
          name = $1, 
          firma = $2, 
          email = $3, 
          telefon = $4, 
          adresse = $5, 
          plz = $6, 
          ort = $7, 
          kundentyp = $8, 
          status = $9, 
          notizen = $10, 
          newsletter = $11, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $12
      `,
        values: [
          name, 
          firma || null, 
          email, 
          telefon || null, 
          adresse || null, 
          plz || null, 
          ort || null, 
          kundentyp || 'privat', 
          status || 'aktiv', 
          notizen || null, 
          newsletter === 'on' || newsletter === true,
          id
        ]
      }));
    
      // Log the update activity
      await ConnectionManager.withConnection(client => client.query({
        text: `
        INSERT INTO kunden_log (
          kunde_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          id,
          req.session.user.id,
          req.session.user.name,
          'updated',
          'Customer information updated'
        ]
      }));

      return {
        success: true,
        customerId: id,
        message: 'Customer updated successfully'
      };
    }, next);
  }

  /**
   * Add a note to customer
   */
  async addCustomerNote(req, res, next) {
    return this.executeQuery(async () => {
      const { id } = req.params;
      const { notiz } = req.body;
    
      if (!notiz || notiz.trim() === '') {
        const error = new Error('Note cannot be empty');
        error.statusCode = 400;
        throw error;
      }
    
      // Get current notes
      const customerQuery = await ConnectionManager.withConnection(client => client.query({
        text: `SELECT notizen FROM kunden WHERE id = $1`,
        values: [id]
      }));
    
      if (customerQuery.rows.length === 0) {
        const error = new Error(`Customer with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }
    
      const currentNotes = customerQuery.rows[0].notizen || '';
      const timestamp = formatDateSafely(new Date(), 'dd.MM.yyyy, HH:mm');
      const userName = req.session.user.name;
    
      // Format the new note with timestamp and username
      const newNote = `${timestamp} - ${userName}:\n${notiz}\n\n${currentNotes}`;
    
      // Update notes in database
      await ConnectionManager.withConnection(client => client.query({
        text: `UPDATE kunden SET notizen = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        values: [newNote, id]
      }));
    
      // Log the note activity
      await ConnectionManager.withConnection(client => client.query({
        text: `
        INSERT INTO kunden_log (
          kunde_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          id,
          req.session.user.id,
          req.session.user.name,
          'note_added',
          'Note added to customer'
        ]
      }));

      return {
        success: true,
        customerId: id,
        message: 'Note added successfully'
      };
    }, next);
  }

  /**
   * Update customer status
   */
  async updateCustomerStatus(req, res, next) {
    return this.executeQuery(async () => {
      const { id, status } = req.body;
    
      // Validation
      if (!id || !status) {
        const error = new Error('Customer ID and status are required');
        error.statusCode = 400;
        throw error;
      }
    
      // Check valid status values
      if (!['aktiv', 'inaktiv', 'geloescht'].includes(status)) {
        const error = new Error('Invalid status value');
        error.statusCode = 400;
        throw error;
      }
    
      // Update status in database
      await ConnectionManager.withConnection(client => client.query({
        text: `UPDATE kunden SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        values: [status, id]
      }));
    
      // Log the status change
      await ConnectionManager.withConnection(client => client.query({
        text: `
        INSERT INTO kunden_log (
          kunde_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          id,
          req.session.user.id,
          req.session.user.name,
          'status_changed',
          `Status changed to: ${status}`
        ]
      }));

      return {
        success: true,
        customerId: id,
        message: 'Customer status updated successfully'
      };
    }, next);
  }

  /**
   * Delete a customer (mark as deleted)
   */
  async deleteCustomer(req, res, next) {
    return this.executeQuery(async () => {
      const { id } = req.body;
    
      // Validation
      if (!id) {
        const error = new Error('Customer ID is required');
        error.statusCode = 400;
        throw error;
      }
    
      // Check if customer has related projects or appointments
      const relatedProjectsQuery = await ConnectionManager.withConnection(client => client.query(
        'SELECT COUNT(*) FROM projekte WHERE kunde_id = $1',
        [id]
      ));
    
      const relatedAppointmentsQuery = await ConnectionManager.withConnection(client => client.query(
        'SELECT COUNT(*) FROM termine WHERE kunde_id = $1',
        [id]
      ));
    
      const relatedProjects = parseInt(relatedProjectsQuery.rows[0].count);
      const relatedAppointments = parseInt(relatedAppointmentsQuery.rows[0].count);
    
      if (relatedProjects > 0 || relatedAppointments > 0) {
        const error = new Error(`Cannot delete customer. ${relatedProjects} projects and ${relatedAppointments} appointments are still linked to this customer.`);
        error.statusCode = 400;
        throw error;
      }
    
      // Mark as deleted instead of actual deletion
      await ConnectionManager.withConnection(client => client.query({
        text: `UPDATE kunden SET status = 'geloescht', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        values: [id]
      }));
    
      // Log the deletion
      await ConnectionManager.withConnection(client => client.query({
        text: `
        INSERT INTO kunden_log (
          kunde_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          id,
          req.session.user.id,
          req.session.user.name,
          'deleted',
          'Customer marked as deleted'
        ]
      }));

      return {
        success: true,
        message: 'Customer successfully deleted'
      };
    }, next);
  }

  /**
   * Export customers data
   */
  async exportCustomers(req, res, next) {
    return this.executeQuery(async () => {
      const { format, status, type } = req.query;
    
      // Build filter conditions
      let conditions = [];
      let params = [];
      let paramCounter = 1;
    
      if (status) {
        conditions.push(`status = $${paramCounter++}`);
        params.push(status);
      } else {
        // By default, exclude deleted customers
        conditions.push(`status != 'geloescht'`);
      }
    
      if (type) {
        conditions.push(`kundentyp = $${paramCounter++}`);
        params.push(type);
      }
    
      // Create WHERE clause
      let { whereClause } = this.buildWhereClause(conditions, params);
    
      // Query data
      const query = {
        text: `
        SELECT 
          id, name, firma, email, telefon, adresse, plz, ort,
          land, kundentyp, status, created_at, updated_at, newsletter
        FROM kunden
        ${whereClause}
        ORDER BY name ASC
      `,
        values: params
      };
    
      const result = await ConnectionManager.withConnection(client => client.query(query));
    
      // Use export service to generate the appropriate format
      return await exportService.generateExport(result.rows, format, {
        filename: 'kunden-export',
        title: 'Kundenliste - Rising BSM',
        columns: [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Name', key: 'name', width: 20 },
          { header: 'Firma', key: 'firma', width: 20 },
          { header: 'E-Mail', key: 'email', width: 25 },
          { header: 'Telefon', key: 'telefon', width: 15 },
          { header: 'Adresse', key: 'adresse', width: 25 },
          { header: 'PLZ', key: 'plz', width: 10 },
          { header: 'Ort', key: 'ort', width: 15 },
          { header: 'Land', key: 'land', width: 15, default: 'Österreich' },
          { header: 'Kundentyp', key: 'kundentyp', width: 15, 
            format: (value) => value === 'geschaeft' ? 'Geschäftskunde' : 'Privatkunde' },
          { header: 'Status', key: 'status', width: 12,
            format: (value) => value === 'aktiv' ? 'Aktiv' : 'Inaktiv' },
          { header: 'Erstellt am', key: 'created_at', width: 18,
            format: (value) => formatDateSafely(value, 'dd.MM.yyyy') },
          { header: 'Newsletter', key: 'newsletter', width: 12,
            format: (value) => value ? 'Ja' : 'Nein' }
        ],
        filters: { status, type }
      });
    }, next);
  }
}

module.exports = new CustomerController();