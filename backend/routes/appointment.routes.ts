import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as appointmentController from '../controllers/appointment.controller';
import { validateAppointment } from '../middleware/validation.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/termine
 * @desc    Get all appointments with optional filtering
 */
router.get('/', appointmentController.getAllAppointments);

/**
 * @route   GET /dashboard/termine/:id
 * @desc    Get appointment by ID
 */
router.get('/:id', appointmentController.getAppointmentById);

/**
 * @route   POST /dashboard/termine
 * @desc    Create a new appointment
 */
router.post('/', validateAppointment, appointmentController.createAppointment);

/**
 * @route   PUT /dashboard/termine/:id
 * @desc    Update an existing appointment
 */
router.put('/:id', validateAppointment, appointmentController.updateAppointment);

/**
 * @route   POST /dashboard/termine/status
 * @desc    Update appointment status
 */
router.post('/status', appointmentController.updateAppointmentStatus);

/**
 * @route   POST /dashboard/termine/:id/notes
 * @desc    Add a note to an appointment
 */
router.post('/:id/notes', appointmentController.addAppointmentNote);

/**
 * @route   DELETE /dashboard/termine/:id
 * @desc    Delete an appointment
 */
router.delete('/:id', appointmentController.deleteAppointment);

/**
 * @route   GET /dashboard/termine/calendar-events
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
      const startDate = new Date(termin.termin_datum);
      const endDate = new Date(startDate.getTime() + (termin.dauer || 60) * 60000);
      
      // Determine color based on status
      let bgColor;
      switch(termin.status) {
        case 'geplant': bgColor = '#ffc107'; break; // warning
        case 'bestaetigt': bgColor = '#28a745'; break; // success
        case 'abgeschlossen': bgColor = '#007bff'; break; // primary
        default: bgColor = '#6c757d'; // secondary
      }
      
      return {
        id: termin.id,
        title: termin.titel,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: false,
        backgroundColor: bgColor,
        borderColor: bgColor,
        textColor: 'white',
        extendedProps: {
          kunde: termin.kunde_name,
          kunde_id: termin.kunde_id,
          projekt: termin.projekt_titel,
          projekt_id: termin.projekt_id,
          ort: termin.ort,
          beschreibung: termin.beschreibung,
          status: termin.status
        },
        url: `/dashboard/termine/${termin.id}`
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

export default router;