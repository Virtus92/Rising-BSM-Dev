import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma.utils';
import { formatDateSafely } from '../utils/formatters';

import { validateDate, validateTimeFormat } from '../utils/validators';
import { getTerminStatusInfo } from '../utils/helpers';

/**
 * Get all appointments with optional filtering
 */
export const getAllAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, date, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (status) {
      where.status = status as string;
    }

    if (date) {
      where.appointmentDate = {
        gte: new Date(date as string),
        lt: new Date(new Date(date as string).setDate(new Date(date as string).getDate() + 1)),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { Customer: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          Customer: true,
          Project: true,
        },
        orderBy: {
          appointmentDate: 'asc',
        },
        skip,
        take: limitNumber,
      }),
      prisma.appointment.count({ where }),
    ]);

    const formattedAppointments = appointments.map((appointment) => {
      const statusInfo = getTerminStatusInfo(appointment.status);
      return {
        id: appointment.id,
        titel: appointment.title,
        kunde_id: appointment.customerId,
        kunde_name: appointment.Customer?.name || 'Kein Kunde zugewiesen',
        projekt_id: appointment.projectId,
        projekt_titel: appointment.Project?.title || 'Kein Projekt zugewiesen',
        termin_datum: appointment.appointmentDate,
        dateFormatted: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy'),
        timeFormatted: formatDateSafely(appointment.appointmentDate, 'HH:mm'),
        dauer: appointment.duration,
        ort: appointment.location || 'Nicht angegeben',
        status: appointment.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className,
      };
    });

    const totalPages = Math.ceil(total / limitNumber);

    return res.json({
      appointments: formattedAppointments,
      pagination: {
        current: pageNumber,
        limit: limitNumber,
        total: totalPages,
        totalRecords: total,
      },
      filters: {
        status,
        date,
        search,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment by ID with related data
 */
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: {
        Customer: true,
        Project: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: `Appointment with ID ${id} not found` });
    }

    const statusInfo = getTerminStatusInfo(appointment.status);

    const result = {
      appointment: {
        id: appointment.id,
        titel: appointment.title,
        kunde_id: appointment.customerId,
        kunde_name: appointment.Customer?.name || 'Kein Kunde zugewiesen',
        projekt_id: appointment.projectId,
        projekt_titel: appointment.Project?.title || 'Kein Projekt zugewiesen',
        termin_datum: appointment.appointmentDate,
        dateFormatted: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy'),
        timeFormatted: formatDateSafely(appointment.appointmentDate, 'HH:mm'),
        dauer: appointment.duration || 60,
        ort: appointment.location || 'Nicht angegeben',
        beschreibung: appointment.description || 'Keine Beschreibung vorhanden',
        status: appointment.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className,
      },
      notes: [], // Implement notes fetching if needed
    };

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new appointment
 */
export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      titel,
      kunde_id,
      projekt_id,
      termin_datum,
      termin_zeit,
      dauer,
      ort,
      beschreibung,
      status
    } = req.body;

    // Validate inputs
    const dateValidation = validateDate(termin_datum, { required: true });
    const timeValidation = validateTimeFormat(termin_zeit, { required: true });

    // Validation
    if (!titel || !termin_datum || !termin_zeit || !dateValidation.isValid || !timeValidation.isValid) {
      const errorMessages = [];
      if (!titel) errorMessages.push('Title is required');
      if (!termin_datum) errorMessages.push('Date is required');
      if (!termin_zeit) errorMessages.push('Time is required');
      if (termin_datum && !dateValidation.isValid) errorMessages.push(dateValidation.errors.join(', '));
      if (termin_zeit && !timeValidation.isValid) errorMessages.push(timeValidation.errors.join(', '));

      const error: any = new Error(`Validation failed: ${errorMessages.join('; ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Combine date and time
    const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);

    const appointment = await prisma.appointment.create({
      data: {
        title: titel,
        customerId: kunde_id ? Number(kunde_id) : null,
        projectId: projekt_id ? Number(projekt_id) : null,
        appointmentDate: appointmentDate,
        duration: dauer ? Number(dauer) : 60,
        location: ort || null,
        description: beschreibung || null,
        status: status || 'geplant',
        createdBy: req.session.user?.id,
      },
    });

    return res.status(201).json({
      success: true,
      appointmentId: appointment.id,
      message: 'Appointment created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update an existing appointment
 */
export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      titel,
      kunde_id,
      projekt_id,
      termin_datum,
      termin_zeit,
      dauer,
      ort,
      beschreibung,
      status
    } = req.body;

    // Validation
    if (!titel || !termin_datum || !termin_zeit) {
      const error: any = new Error('Title, date and time are required fields');
      error.statusCode = 400;
      throw error;
    }

    // Combine date and time
    const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);

    const appointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        title: titel,
        customerId: kunde_id ? Number(kunde_id) : null,
        projectId: projekt_id ? Number(projekt_id) : null,
        appointmentDate: appointmentDate,
        duration: dauer ? Number(dauer) : 60,
        location: ort || null,
        description: beschreibung || null,
        status: status || 'geplant',
      },
    });

    return res.json({
      success: true,
      appointmentId: appointment.id,
      message: 'Appointment updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete an existing appointment
 */
export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) }
    });

    if (!appointment) {
      const error: any = new Error(`Appointment with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    await prisma.appointment.delete({
      where: { id: Number(id) },
    });

    return res.json({
      success: true,
      appointmentId: id,
      message: 'Appointment deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, status, note } = req.body;

    // Validation
    if (!id || !status) {
      const error: any = new Error('Appointment ID and status are required');
      error.statusCode = 400;
      throw error;
    }

    // Check valid status values
    if (!['geplant', 'bestaetigt', 'abgeschlossen', 'storniert'].includes(status)) {
      const error: any = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }

    const appointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        status: status,
      },
    });

    // Implement note adding logic if needed

    return res.json({
      success: true,
      appointmentId: appointment.id,
      message: 'Appointment status updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Add a note to appointment
 */
export const addAppointmentNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    // Implement note adding logic if needed

    return res.json({
      success: true,
      appointmentId: id,
      message: 'Note added successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Export appointments data
 */
export const exportAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { format, start_date, end_date, status } = req.query;

    // Implement export logic using Prisma
    return res.status(500).json({ message: 'Export functionality not implemented yet' });
  } catch (error: any) {
    next(error);
  }
};
