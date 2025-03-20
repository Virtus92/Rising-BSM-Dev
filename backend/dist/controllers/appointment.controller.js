"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAppointmentNote = exports.updateAppointmentStatus = exports.deleteAppointment = exports.updateAppointment = exports.createAppointment = exports.getAppointmentById = exports.getAllAppointments = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const formatters_1 = require("../utils/formatters");
const helpers_1 = require("../utils/helpers");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
exports.getAllAppointments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, date, search, page = 1, limit = config_1.default.DEFAULT_PAGE_SIZE } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(config_1.default.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config_1.default.DEFAULT_PAGE_SIZE));
    const skip = (pageNumber - 1) * pageSize;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (date) {
        where.appointmentDate = {
            gte: new Date(`${date}T00:00:00`),
            lt: new Date(`${date}T23:59:59`)
        };
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { Customer: { name: { contains: search, mode: 'insensitive' } } }
        ];
    }
    const [appointments, totalCount] = await Promise.all([
        prisma_utils_1.prisma.appointment.findMany({
            where,
            include: {
                Customer: true,
                Project: true
            },
            orderBy: { appointmentDate: 'asc' },
            take: pageSize,
            skip
        }),
        prisma_utils_1.prisma.appointment.count({ where })
    ]);
    const formattedAppointments = appointments.map((appointment) => {
        const statusInfo = (0, helpers_1.getTerminStatusInfo)(appointment.status);
        return {
            id: appointment.id,
            titel: appointment.title,
            kunde_id: appointment.customerId,
            kunde_name: appointment.Customer?.name || 'Kein Kunde zugewiesen',
            projekt_id: appointment.projectId,
            projekt_titel: appointment.Project?.title || 'Kein Projekt zugewiesen',
            termin_datum: appointment.appointmentDate,
            dateFormatted: (0, formatters_1.formatDateSafely)(appointment.appointmentDate, 'dd.MM.yyyy'),
            timeFormatted: (0, formatters_1.formatDateSafely)(appointment.appointmentDate, 'HH:mm'),
            dauer: appointment.duration !== null ? appointment.duration : 60,
            ort: appointment.location || 'Nicht angegeben',
            status: appointment.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className
        };
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    res.status(200).json({
        success: true,
        appointments: formattedAppointments,
        pagination: {
            current: pageNumber,
            limit: pageSize,
            total: totalPages,
            totalRecords: totalCount
        },
        filters: {
            status,
            date,
            search
        }
    });
});
exports.getAppointmentById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const appointmentId = Number(id);
    if (isNaN(appointmentId)) {
        throw new errors_1.BadRequestError('Invalid appointment ID');
    }
    const appointment = await prisma_utils_1.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            Customer: true,
            Project: true
        }
    });
    if (!appointment) {
        throw new errors_1.NotFoundError(`Appointment with ID ${appointmentId} not found`);
    }
    const statusInfo = (0, helpers_1.getTerminStatusInfo)(appointment.status);
    const notes = await prisma_utils_1.prisma.appointmentNote.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' }
    });
    const result = {
        appointment: {
            id: appointment.id,
            titel: appointment.title,
            kunde_id: appointment.customerId,
            kunde_name: appointment.Customer?.name || 'Kein Kunde zugewiesen',
            projekt_id: appointment.projectId,
            projekt_titel: appointment.Project?.title || 'Kein Projekt zugewiesen',
            termin_datum: appointment.appointmentDate,
            dateFormatted: (0, formatters_1.formatDateSafely)(appointment.appointmentDate, 'dd.MM.yyyy'),
            timeFormatted: (0, formatters_1.formatDateSafely)(appointment.appointmentDate, 'HH:mm'),
            dauer: appointment.duration !== null ? appointment.duration : 60,
            ort: appointment.location || 'Nicht angegeben',
            beschreibung: appointment.description || 'Keine Beschreibung vorhanden',
            status: appointment.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className
        },
        notes: notes.map((note) => ({
            id: note.id,
            text: note.text,
            formattedDate: (0, formatters_1.formatDateSafely)(note.createdAt, 'dd.MM.yyyy, HH:mm'),
            benutzer: note.userName
        }))
    };
    res.status(200).json({
        success: true,
        ...result
    });
});
exports.createAppointment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { titel, kunde_id, projekt_id, termin_datum, termin_zeit, dauer, ort, beschreibung, status } = req.body;
    const dateValidation = (0, validators_1.validateDate)(termin_datum, { required: true });
    const timeValidation = (0, validators_1.validateTimeFormat)(termin_zeit, { required: true });
    if (!titel || !termin_datum || !termin_zeit || !dateValidation.isValid || !timeValidation.isValid) {
        const errorMessages = [];
        if (!titel)
            errorMessages.push('Title is required');
        if (!termin_datum)
            errorMessages.push('Date is required');
        if (!termin_zeit)
            errorMessages.push('Time is required');
        if (termin_datum && !dateValidation.isValid)
            errorMessages.push(dateValidation.errors.join(', '));
        if (termin_zeit && !timeValidation.isValid)
            errorMessages.push(timeValidation.errors.join(', '));
        throw new errors_1.ValidationError(`Validation failed: ${errorMessages.join('; ')}`, errorMessages);
    }
    const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
    const newAppointment = await prisma_utils_1.prisma.appointment.create({
        data: {
            title: titel,
            customerId: kunde_id ? Number(kunde_id) : null,
            projectId: projekt_id ? Number(projekt_id) : null,
            appointmentDate: appointmentDate,
            duration: dauer ? Number(dauer) : 60,
            location: ort || null,
            description: beschreibung || null,
            status: status || 'geplant',
            createdBy: req.user?.id || null
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.appointmentLog.create({
            data: {
                appointmentId: newAppointment.id,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'created',
                details: 'Appointment created'
            }
        });
    }
    res.status(201).json({
        success: true,
        appointmentId: newAppointment.id,
        message: 'Appointment created successfully'
    });
});
exports.updateAppointment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const appointmentId = Number(id);
    if (isNaN(appointmentId)) {
        throw new errors_1.BadRequestError('Invalid appointment ID');
    }
    const { titel, kunde_id, projekt_id, termin_datum, termin_zeit, dauer, ort, beschreibung, status } = req.body;
    if (!titel || !termin_datum || !termin_zeit) {
        throw new errors_1.ValidationError('Title, date and time are required fields');
    }
    const appointment = await prisma_utils_1.prisma.appointment.findUnique({
        where: { id: appointmentId }
    });
    if (!appointment) {
        throw new errors_1.NotFoundError(`Appointment with ID ${appointmentId} not found`);
    }
    const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
    const updatedAppointment = await prisma_utils_1.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
            title: titel,
            customerId: kunde_id ? Number(kunde_id) : null,
            projectId: projekt_id ? Number(projekt_id) : null,
            appointmentDate: appointmentDate,
            duration: dauer ? Number(dauer) : 60,
            location: ort || null,
            description: beschreibung || null,
            status: status || 'geplant',
            updatedAt: new Date()
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.appointmentLog.create({
            data: {
                appointmentId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'updated',
                details: 'Appointment updated'
            }
        });
    }
    res.status(200).json({
        success: true,
        appointmentId,
        message: 'Appointment updated successfully'
    });
});
exports.deleteAppointment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const appointmentId = Number(id);
    if (isNaN(appointmentId)) {
        throw new errors_1.BadRequestError('Invalid appointment ID');
    }
    const appointment = await prisma_utils_1.prisma.appointment.findUnique({
        where: { id: appointmentId }
    });
    if (!appointment) {
        throw new errors_1.NotFoundError(`Appointment with ID ${appointmentId} not found`);
    }
    await prisma_utils_1.prisma.appointment.delete({
        where: { id: appointmentId }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.appointmentLog.create({
            data: {
                appointmentId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'deleted',
                details: 'Appointment deleted'
            }
        });
    }
    res.status(200).json({
        success: true,
        appointmentId,
        message: 'Appointment deleted successfully'
    });
});
exports.updateAppointmentStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id, status, note } = req.body;
    const appointmentId = Number(id);
    if (isNaN(appointmentId)) {
        throw new errors_1.BadRequestError('Invalid appointment ID');
    }
    if (!status) {
        throw new errors_1.ValidationError('Status is required', ['Status is required']);
    }
    if (!['geplant', 'bestaetigt', 'abgeschlossen', 'storniert'].includes(status)) {
        throw new errors_1.ValidationError('Invalid status value', ['Status must be one of: geplant, bestaetigt, abgeschlossen, storniert']);
    }
    const appointment = await prisma_utils_1.prisma.appointment.findUnique({
        where: { id: appointmentId }
    });
    if (!appointment) {
        throw new errors_1.NotFoundError(`Appointment with ID ${appointmentId} not found`);
    }
    await prisma_utils_1.prisma.$transaction(async (tx) => {
        await tx.appointment.update({
            where: { id: appointmentId },
            data: {
                status,
                updatedAt: new Date()
            }
        });
        if (note && note.trim() !== '' && req.user?.id) {
            await tx.appointmentNote.create({
                data: {
                    appointmentId,
                    userId: req.user.id,
                    userName: req.user.name || 'Unknown',
                    text: note
                }
            });
        }
        if (req.user?.id) {
            await tx.appointmentLog.create({
                data: {
                    appointmentId,
                    userId: req.user.id,
                    userName: req.user.name || 'Unknown',
                    action: 'status_changed',
                    details: `Status changed to: ${status}`
                }
            });
        }
    });
    res.status(200).json({
        success: true,
        appointmentId,
        message: 'Appointment status updated successfully'
    });
});
exports.addAppointmentNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const appointmentId = Number(id);
    const { note } = req.body;
    if (isNaN(appointmentId)) {
        throw new errors_1.BadRequestError('Invalid appointment ID');
    }
    if (!note || note.trim() === '') {
        throw new errors_1.ValidationError('Note cannot be empty', ['Note cannot be empty']);
    }
    const appointment = await prisma_utils_1.prisma.appointment.findUnique({
        where: { id: appointmentId }
    });
    if (!appointment) {
        throw new errors_1.NotFoundError(`Appointment with ID ${appointmentId} not found`);
    }
    if (req.user?.id) {
        await prisma_utils_1.prisma.appointmentNote.create({
            data: {
                appointmentId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                text: note
            }
        });
        await prisma_utils_1.prisma.appointmentLog.create({
            data: {
                appointmentId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'note_added',
                details: 'Note added to appointment'
            }
        });
    }
    else {
        console.warn('Note added without user context');
    }
    res.status(201).json({
        success: true,
        appointmentId,
        message: 'Note added successfully'
    });
});
//# sourceMappingURL=appointment.controller.js.map