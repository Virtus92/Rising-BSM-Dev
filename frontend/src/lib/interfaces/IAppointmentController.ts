import { Request, Response } from 'express';
import { IBaseController } from './IBaseController.js';
import { Appointment } from '../entities/Appointment.js';

/**
 * Interface for appointment controller
 * Extends the base controller with appointment-specific methods
 */
export interface IAppointmentController extends IBaseController<Appointment, number> {
  /**
   * Get appointment details including notes and relations
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getDetails(req: Request, res: Response): Promise<void>;
  
  /**
   * Find appointments with filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  findAppointments(req: Request, res: Response): Promise<void>;
  
  /**
   * Get upcoming appointments
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getUpcoming(req: Request, res: Response): Promise<void>;
  
  /**
   * Update appointment status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Add note to appointment
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  addNote(req: Request, res: Response): Promise<void>;
  
  /**
   * Get appointment notes
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getNotes(req: Request, res: Response): Promise<void>;
}
