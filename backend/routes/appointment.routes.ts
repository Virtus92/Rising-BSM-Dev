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
  addAppointmentNote
} from '../controllers/appointment.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  appointmentCreateSchema, 
  appointmentUpdateSchema, 
  appointmentStatusUpdateSchema, 
  appointmentNoteCreateSchema 
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
router.post('/', validateBody(appointmentCreateSchema), createAppointment);

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
}), validateBody(appointmentUpdateSchema), updateAppointment);

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
}), validateBody(appointmentStatusUpdateSchema), updateAppointmentStatus);

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
}), validateBody(appointmentNoteCreateSchema), addAppointmentNote);

export default router;