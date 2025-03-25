/**
 * Appointment Routes
 * 
 * Route definitions for Appointment entity operations with validation.
 */
import { Router } from 'express';
import { 
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  addAppointmentNote,
  exportAppointments
} from '../controllers/appointment.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  appointmentCreateValidation, 
  appointmentUpdateValidation,
  appointmentStatusUpdateValidation,
  appointmentNoteCreateValidation,
  AppointmentStatus
} from '../types/dtos/appointment.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/appointments
 * @description Get all appointments with filtering and pagination
 * @access Private
 */
router.get('/', getAllAppointments);

/**
 * @route GET /api/v1/appointments/statistics
 * @description Get appointment statistics
 * @access Private
 
router.get('/statistics', getAppointmentStatistics);
*/

/**
 * @route GET /api/v1/appointments/export
 * @description Export appointments data
 * @access Private
 */
router.get('/export', exportAppointments);

/**
 * @route GET /api/v1/appointments/:id
 * @description Get appointment by ID with related data
 * @access Private
 */
router.get('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Appointment ID is required',
      type: 'Appointment ID must be a number'
    }
  }
}), getAppointmentById);

/**
 * @route POST /api/v1/appointments
 * @description Create a new appointment
 * @access Private
 */
router.post('/', validateBody(appointmentCreateValidation), createAppointment);

/**
 * @route PUT /api/v1/appointments/:id
 * @description Update an existing appointment
 * @access Private
 */
router.put('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Appointment ID is required',
      type: 'Appointment ID must be a number'
    }
  }
}), validateBody(appointmentUpdateValidation), updateAppointment);

/**
 * @route DELETE /api/v1/appointments/:id
 * @description Delete an appointment
 * @access Private
 */
router.delete('/:id', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Appointment ID is required',
      type: 'Appointment ID must be a number'
    }
  }
}), deleteAppointment);

/**
 * @route PATCH /api/v1/appointments/:id/status
 * @description Update appointment status
 * @access Private
 */
router.patch('/:id/status', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Appointment ID is required',
      type: 'Appointment ID must be a number'
    }
  }
}), validateBody({
  status: appointmentStatusUpdateValidation.status,
  note: appointmentStatusUpdateValidation.note
}), updateAppointmentStatus);

/**
 * @route POST /api/v1/appointments/:id/notes
 * @description Add a note to appointment
 * @access Private
 */
router.post('/:id/notes', validateParams({
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Appointment ID is required',
      type: 'Appointment ID must be a number'
    }
  }
}), validateBody({
  text: {
    type: 'string',
    required: true,
    min: 1,
    max: 1000,
    messages: {
      required: 'Note text is required',
      min: 'Note text cannot be empty',
      max: 'Note text must not exceed 1000 characters'
    }
  }
}), addAppointmentNote);

export default router;