import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as appointmentController from '../controllers/appointment.controller';
import { validateAppointment } from '../middleware/validation.middleware';
import { ParamsDictionary } from 'express-serve-static-core';

interface AppointmentParams extends ParamsDictionary {
  id: string;
}

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/termine
 * @desc    Get all appointments
 */
router.get('/', appointmentController.getAllAppointments);

/**
 * @route   GET /dashboard/termine/:id
 * @desc    Get appointment by ID
 */
router.get<AppointmentParams>('/:id', appointmentController.getAppointmentById);

/**
 * @route   POST /dashboard/termine
 * @desc    Create a new appointment
 */
router.post('/', validateAppointment, appointmentController.createAppointment);

/**
 * @route   PUT /dashboard/termine/:id
 * @desc    Update an existing appointment
 */
router.put<AppointmentParams>('/:id', validateAppointment, appointmentController.updateAppointment);

/**
 * @route   DELETE /dashboard/termine/:id
 * @desc    Delete an appointment
 */
router.delete<AppointmentParams>('/:id', appointmentController.deleteAppointment);

export default router;