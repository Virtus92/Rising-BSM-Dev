/**
 * Project Controller
 * Handles all project-related business logic
 */
const BaseController = require('./baseController');
const pool = require('../services/db.service');
const { formatDateSafely } = require('../utils/formatters');
const { getProjektStatusInfo } = require('../utils/helpers');
const exportService = require('../services/export.service');
const { validateProjectCreation, validateProjectUpdate, validateProjectStatusUpdate, validateProjectId } = require('../middleware/projectValidation.middleware');

class ProjectController extends BaseController {
  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(req, res, next) {
    return this.executeQuery(async () => {
      // Extract filter parameters
      const { status = '', kunde_id = '', search = '', page = '1', limit = '20' } = req.query;

      // Build filter conditions
      let conditions = [];
      let params = [];
      let paramCounter = 1;

      if (status) {
        conditions.push(`p.status = $${paramCounter++}`);
        params.push(status);
      }

      if (kunde_id) {
        conditions.push(`p.kunde_id = $${paramCounter++}`);
        params.push(kunde_id);
      }

      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(`(
        LOWER(p.titel) LIKE $${paramCounter} OR 
        LOWER(k.name) LIKE $${paramCounter}
      )`);
        params.push(searchTerm);
        paramCounter++;
      }

      // Create WHERE clause if filters exist
      const { whereClause, paramIndex: newParamIndex } = this.buildWhereClause(conditions, params);

      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Query for projects with pagination
      const query = `
      SELECT 
        p.id, 
        p.titel, 
        p.kunde_id,
        p.start_datum,
        p.end_datum,
        p.status,
        p.betrag,
        k.name AS kunde_name,
        d.name AS dienstleistung_name
      FROM 
        projekte p
        LEFT JOIN kunden k ON p.kunde_id = k.id
        LEFT JOIN dienstleistungen d ON p.dienstleistung_id = d.id
      ${whereClause}
      ORDER BY p.start_datum DESC
      LIMIT $${newParamIndex++} OFFSET $${newParamIndex++}
    `;
      
      params.push(parseInt(limit), offset);

      // Get total count for pagination
      const countQuery = `
      SELECT COUNT(*) AS total
      FROM projekte p
      LEFT JOIN kunden k ON p.kunde_id = k.id
      ${whereClause}
    `;

      // Execute both queries in parallel
      const [projectsResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, params.length - 2)) // Exclude LIMIT and OFFSET parameters
      ]);

      // Format project data
      const projects = projectsResult.rows.map(project => {
        const statusInfo = getProjektStatusInfo(project.status);
        return {
          id: project.id,
          titel: project.titel,
          kunde_id: project.kunde_id,
          kunde_name: project.kunde_name || 'Kein Kunde zugewiesen',
          dienstleistung: project.dienstleistung_name || 'Nicht zugewiesen',
          start_datum: formatDateSafely(project.start_datum, 'dd.MM.yyyy'),
          end_datum: project.end_datum ? formatDateSafely(project.end_datum, 'dd.MM.yyyy') : '-',
          status: project.status,
          statusLabel: statusInfo.label,
          statusClass: statusInfo.className,
          betrag: project.betrag ? parseFloat(project.betrag) : null
        };
      });

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      // Return data object for rendering or JSON response
      return {
        projects,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total: totalPages,
          totalRecords: total
        },
        filters: {
          status,
          kunde_id,
          search
        }
      };
    }, next);
  }

  /**
   * Get project by ID with related data
   */
  async getProjectById(req, res, next) {
    return this.executeQuery(async () => {
      const { id } = req.params;
      
      // Get project details
      const projectQuery = await pool.query({
        text: `
        SELECT 
          p.*, 
          k.name AS kunde_name
        FROM 
          projekte p
          LEFT JOIN kunden k ON p.kunde_id = k.id
        WHERE 
          p.id = $1
      `,
        values: [id]
      });
      
      if (projectQuery.rows.length === 0) {
        const error = new Error(`Project with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }
      
      const project = projectQuery.rows[0];
      const statusInfo = getProjektStatusInfo(project.status);

      // Get appointments for this project
      const appointmentsQuery = await pool.query({
        text: `
        SELECT id, titel, termin_datum, status 
        FROM termine 
        WHERE projekt_id = $1 
        ORDER BY termin_datum ASC
      `,
        values: [id]
      });
      
      // Get notes for this project
      const notesQuery = await pool.query({
        text: `
        SELECT * FROM projekt_notizen 
        WHERE projekt_id = $1 
        ORDER BY erstellt_am DESC
      `,
        values: [id]
      });
      
      // Format project data for response
      const result = {
        project: {
          id: project.id,
          titel: project.titel,
          kunde_id: project.kunde_id,
          kunde_name: project.kunde_name || 'Kein Kunde zugewiesen',
          start_datum: formatDateSafely(project.start_datum, 'dd.MM.yyyy'),
          end_datum: project.end_datum ? formatDateSafely(project.end_datum, 'dd.MM.yyyy') : 'Nicht festgelegt',
          betrag: project.betrag ? parseFloat(project.betrag) : null,
          beschreibung: project.beschreibung || 'Keine Beschreibung vorhanden',
          status: project.status,
          statusLabel: statusInfo.label,
          statusClass: statusInfo.className
        },
        appointments: appointmentsQuery.rows.map(appointment => {
          const appointmentStatus = appointment.status === 'geplant' ? { label: 'Geplant', className: 'warning' } :
            appointment.status === 'bestaetigt' ? { label: 'Bestätigt', className: 'success' } :
            appointment.status === 'abgeschlossen' ? { label: 'Abgeschlossen', className: 'primary' } :
            { label: 'Storniert', className: 'secondary' };
          return {
            id: appointment.id,
            titel: appointment.titel,
            datum: formatDateSafely(appointment.termin_datum, 'dd.MM.yyyy, HH:mm'),
            statusLabel: appointmentStatus.label,
            statusClass: appointmentStatus.className
          };
        }),
        notes: notesQuery.rows.map(note => ({
          id: note.id,
          text: note.text,
          formattedDate: formatDateSafely(note.erstellt_am, 'dd.MM.yyyy, HH:mm'),
          benutzer: note.benutzer_name
        }))
      };
      
      return result;
    }, next);
  }

  /**
   * Create a new project
   */
  async createProject(req, res, next) {
    return this.executeQuery(async () => {
      const { 
        titel, 
        kunde_id, 
        dienstleistung_id,
        start_datum, 
        end_datum, 
        betrag, 
        beschreibung, 
        status 
      } = req.body;
      
      // Validation
      if (!titel || !start_datum) {
        const error = new Error('Title and start date are required fields');
        error.statusCode = 400;
        throw error;
      }
      
      // Insert project into database
      const result = await pool.query({
        text: `
        INSERT INTO projekte (
          titel, 
          kunde_id, 
          dienstleistung_id,
          start_datum, 
          end_datum, 
          betrag, 
          beschreibung, 
          status,
          erstellt_von
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `,
        values: [
          titel, 
          kunde_id || null, 
          dienstleistung_id || null,
          start_datum, 
          end_datum || null, 
          betrag ? parseFloat(betrag) : null, 
          beschreibung || null, 
          status || 'neu',
          req.session.user.id
        ]
      });
      
      const projectId = result.rows[0].id;
      
      // Log the activity
      await pool.query({
        text: `
        INSERT INTO projekt_log (
          projekt_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          projectId,
          req.session.user.id,
          req.session.user.name,
          'created',
          'Project created'
        ]
      });

      // Create notification for customer if assigned
      if (kunde_id) {
        await pool.query({
          text: `
          INSERT INTO benachrichtigungen (
            benutzer_id, typ, titel, nachricht, referenz_id
          ) VALUES ($1, $2, $3, $4, $5)
        `,
          values: [
            kunde_id,
            'projekt',
            'Neues Projekt erstellt',
            `Ein neues Projekt "${titel}" wurde angelegt.`,
            projectId
          ]
        });
      }

      return {
        success: true,
        projectId: projectId,
        message: 'Project created successfully'
      };
    }, next);
  }

  /**
   * Update an existing project
   */
  async updateProject(req, res, next) {
    return this.executeQuery(async () => {
      const { id } = req.params;
      const { 
        titel, 
        kunde_id, 
        dienstleistung_id,
        start_datum, 
        end_datum, 
        betrag, 
        beschreibung, 
        status 
      } = req.body;
      
      // Validation
      if (!titel || !start_datum) {
        const error = new Error('Title and start date are required fields');
        error.statusCode = 400;
        throw error;
      }

      // Check if project exists
      const checkResult = await pool.query({
        text: 'SELECT id FROM projekte WHERE id = $1',
        values: [id]
      });

      if (checkResult.rows.length === 0) {
        const error = new Error(`Project with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }
      
      // Update project in database
      await pool.query({
        text: `
        UPDATE projekte SET 
          titel = $1, 
          kunde_id = $2, 
          dienstleistung_id = $3, 
          start_datum = $4, 
          end_datum = $5, 
          betrag = $6, 
          beschreibung = $7, 
          status = $8, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $9
      `,
        values: [
          titel, 
          kunde_id || null, 
          dienstleistung_id || null,
          start_datum, 
          end_datum || null, 
          betrag ? parseFloat(betrag) : null, 
          beschreibung || null, 
          status || 'neu',
          id
        ]
      });
      
      // Log the activity
      await pool.query({
        text: `
        INSERT INTO projekt_log (
          projekt_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          id,
          req.session.user.id,
          req.session.user.name,
          'updated',
          'Project updated'
        ]
      });

      return {
        success: true,
        projectId: id,
        message: 'Project updated successfully'
      };
    }, next);
  }

   /**
   * Update project status
   */
  async updateProjectStatus(req, res, next) {
    return this.executeQuery(async () => {
      const { id, status, note } = req.body;
      
      // Validation
      if (!id || !status) {
        const error = new Error('Project ID and status are required');
        error.statusCode = 400;
        throw error;
      }
      
      // Check valid status values
      if (!['neu', 'in_bearbeitung', 'abgeschlossen', 'storniert'].includes(status)) {
        const error = new Error('Invalid status value');
        error.statusCode = 400;
        throw error;
      }
      
      // Update status in database
      await pool.query({
        text: `UPDATE projekte SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        values: [status, id]
      });
      
      // Add note if provided
      if (note && note.trim() !== '') {
        await pool.query({
          text: `
          INSERT INTO projekt_notizen (
            projekt_id, benutzer_id, benutzer_name, text
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
        INSERT INTO projekt_log (
          projekt_id, benutzer_id, benutzer_name, aktion, details
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
        projectId: id,
        message: 'Project status updated successfully'
      };
    }, next);
  }

  /**
   * Add a note to project
   */
  async addProjectNote(req, res, next) {
    return this.executeQuery(async () => {
      const { id } = req.params;
      const { note } = req.body;
      
      if (!note || note.trim() === '') {
        const error = new Error('Note cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      
      // Check if project exists
      const checkResult = await pool.query({
        text: 'SELECT id FROM projekte WHERE id = $1',
        values: [id]
      });

      if (checkResult.rows.length === 0) {
        const error = new Error(`Project with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }
      
      // Insert note into database
      await pool.query({
        text: `
        INSERT INTO projekt_notizen (
          projekt_id, benutzer_id, benutzer_name, text
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
        INSERT INTO projekt_log (
          projekt_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        values: [
          id,
          req.session.user.id,
          req.session.user.name,
          'note_added',
          'Note added to project'
        ]
      });

      return {
        success: true,
        projectId: id,
        message: 'Note added successfully'
      };
    }, next);
  }

  /**
   * Export projects data
   */
  async exportProjects(req, res, next) {
    return this.executeQuery(async () => {
      const { format, status, kunde_id } = req.query;
      
      // Build filter conditions
      let conditions = [];
      let params = [];
      let paramCounter = 1;
      
      if (status) {
        conditions.push(`p.status = $${paramCounter++}`);
        params.push(status);
      }
      
      if (kunde_id) {
        conditions.push(`p.kunde_id = $${paramCounter++}`);
        params.push(kunde_id);
      }
      
      // Create WHERE clause
      const { whereClause } = this.buildWhereClause(conditions, params);
      
      // Query data
      const query = {
        text: `
        SELECT 
          p.id, 
          p.titel, 
          p.start_datum, 
          p.end_datum, 
          p.betrag, 
          p.status,
          p.beschreibung,
          k.name AS kunde_name,
          d.name AS dienstleistung_name
        FROM 
          projekte p
          LEFT JOIN kunden k ON p.kunde_id = k.id
          LEFT JOIN dienstleistungen d ON p.dienstleistung_id = d.id
        ${whereClause}
        ORDER BY p.start_datum DESC
      `,
        values: params
      };
      
      const result = await pool.query(query);
      
      // Use export service to generate the appropriate format
      return await exportService.generateExport(result.rows, format, {
        filename: 'projekte-export',
        title: 'Projektliste - Rising BSM',
        columns: [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Titel', key: 'titel', width: 30 },
          { header: 'Start', key: 'start_datum', width: 15, 
            format: (value) => formatDateSafely(value, 'dd.MM.yyyy') },
          { header: 'Ende', key: 'end_datum', width: 15,
            format: (value) => value ? formatDateSafely(value, 'dd.MM.yyyy') : 'Nicht festgelegt' },
          { header: 'Betrag', key: 'betrag', width: 15,
            format: (value) => value ? parseFloat(value).toLocaleString('de-DE', {style: 'currency', currency: 'EUR'}) : '-' },
          { header: 'Status', key: 'status', width: 15,
            format: (value) => getProjektStatusInfo(value).label },
          { header: 'Kunde', key: 'kunde_name', width: 25, default: 'Kein Kunde' },
          { header: 'Dienstleistung', key: 'dienstleistung_name', width: 25, default: 'Keine Zuordnung' },
          { header: 'Beschreibung', key: 'beschreibung', width: 50, default: '' }
        ],
        filters: { status, kunde_id }
      });
    }, next);
  }
}

module.exports = new ProjectController();