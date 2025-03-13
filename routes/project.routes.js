const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { validateProject } = require('../middleware/validation.middleware');

/**
 * @route   GET /dashboard/projects
 * @desc    Display list of projects with optional filtering
 */
router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const data = await projectController.getAllProjects(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(data);
    }

    // Otherwise render the view
    res.render('dashboard/projects/index', {
      title: 'Projekte - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      projects: data.projects,
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
 * @route   GET /dashboard/projects/neu
 * @desc    Display form to create a new project
 */
router.get('/neu', isAuthenticated, async (req, res, next) => {
  try {
    // Get customers for dropdown
    const kundenQuery = await req.db.query({
      text: `SELECT id, name FROM kunden ORDER BY name ASC`
    });

    // Get services for dropdown
    const dienstleistungenQuery = await req.db.query({
      text: `
        SELECT id, name FROM dienstleistungen 
        WHERE aktiv = true 
        ORDER BY name ASC
      `
    });

    res.render('dashboard/projects/neu', {
      title: 'Neues Projekt - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/projects',
      kunden: kundenQuery.rows,
      dienstleistungen: dienstleistungenQuery.rows,
      formData: {
        titel: '',
        kunde_id: req.query.kunde_id || '',
        dienstleistung_id: '',
        start_datum: new Date().toISOString().split('T')[0],
        end_datum: '',
        betrag: '',
        beschreibung: '',
        status: 'neu'
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
 * @route   POST /dashboard/projects/neu
 * @desc    Create a new project
 */
router.post('/neu', isAuthenticated, validateProject, async (req, res, next) => {
  try {
    const result = await projectController.createProject(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }

    // Otherwise set flash message and redirect
    req.flash('success', 'Projekt erfolgreich angelegt.');
    res.redirect(`/dashboard/projects/${result.projectId}`);
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/projects/neu');
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/projects/export
 * @desc    Export projects in various formats
 */
router.get('/export', isAuthenticated, async (req, res, next) => {
  try {
    const result = await projectController.exportProjects(req, res, next);

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
    console.error('Export error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'An error occurred during export'
    });
  }
});

/**
 * @route   POST /dashboard/projects/update-status
 * @desc    Update project status
 */
router.post('/update-status', isAuthenticated, async (req, res, next) => {
  try {
    const result = await projectController.updateProjectStatus(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }

    // Otherwise set flash message and redirect
    req.flash('success', 'Projekt-Status erfolgreich aktualisiert.');
    res.redirect(`/dashboard/projects/${req.body.id}`);
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/projects/${req.body.id}`);
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/projects/:id
 * @desc    Display project details
 */
router.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const data = await projectController.getProjectById(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(data);
    }

    // Otherwise render the view
    res.render('dashboard/projects/detail', {
      title: `Projekt: ${data.project.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/projects',
      projekt: data.project,
      termine: data.appointments,
      notizen: data.notes,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    if (error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/projects');
    }
    next(error);
  }
});

/**
 * @route   POST /dashboard/projects/:id/add-note
 * @desc    Add a note to a project
 */
router.post('/:id/add-note', isAuthenticated, async (req, res, next) => {
  try {
    const result = await projectController.addProjectNote(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }

    // Otherwise set flash message and redirect
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/projects/${req.params.id}`);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/projects/${req.params.id}`);
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/projects/:id/edit
 * @desc    Display form to edit a project
 */
router.get('/:id/edit', isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get project details
    const projectQuery = await req.db.query({
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
      req.flash('error', `Projekt mit ID ${id} nicht gefunden`);
      return res.redirect('/dashboard/projects');
    }

    const project = projectQuery.rows[0];

    // Get customers for dropdown
    const kundenQuery = await req.db.query(`
      SELECT id, name FROM kunden ORDER BY name ASC
    `);

    // Get services for dropdown
    const dienstleistungenQuery = await req.db.query(`
      SELECT id, name FROM dienstleistungen 
      WHERE aktiv = true 
      ORDER BY name ASC
    `);

    res.render('dashboard/projects/edit', {
      title: `Projekt bearbeiten: ${project.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/projects',
      projekt: {
        id: project.id,
        titel: project.titel,
        kunde_id: project.kunde_id,
        kunde_name: project.kunde_name || 'Kein Kunde zugewiesen',
        dienstleistung_id: project.dienstleistung_id,
        start_datum: project.start_datum.toISOString().split('T')[0],
        end_datum: project.end_datum ? project.end_datum.toISOString().split('T')[0] : '',
        betrag: project.betrag,
        beschreibung: project.beschreibung,
        status: project.status
      },
      kunden: kundenQuery.rows,
      dienstleistungen: dienstleistungenQuery.rows,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/projects/:id/edit
 * @desc    Update a project
 */
router.post('/:id/edit', isAuthenticated, validateProject, async (req, res, next) => {
  try {
    const result = await projectController.updateProject(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }

    // Otherwise set flash message and redirect
    req.flash('success', 'Projekt erfolgreich aktualisiert.');
    res.redirect(`/dashboard/projects/${req.params.id}`);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/projects/${req.params.id}/edit`);
    }
    next(error);
  }
});

module.exports = router;