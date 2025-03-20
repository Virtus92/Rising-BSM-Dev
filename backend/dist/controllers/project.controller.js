"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportProjects = exports.addProjectNote = exports.updateProjectStatus = exports.updateProject = exports.createProject = exports.getProjectById = exports.getAllProjects = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const formatters_1 = require("../utils/formatters");
const helpers_1 = require("../utils/helpers");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
const validation_types_1 = require("../utils/validation-types");
exports.getAllProjects = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, kunde_id, search, page = 1, limit = config_1.default.DEFAULT_PAGE_SIZE } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(config_1.default.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config_1.default.DEFAULT_PAGE_SIZE));
    const skip = (pageNumber - 1) * pageSize;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (kunde_id) {
        where.customerId = Number(kunde_id);
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { Customer: { name: { contains: search, mode: 'insensitive' } } }
        ];
    }
    const [projects, totalCount] = await Promise.all([
        prisma_utils_1.prisma.project.findMany({
            where,
            include: {
                Customer: true,
                Service: true
            },
            orderBy: { startDate: 'desc' },
            take: pageSize,
            skip
        }),
        prisma_utils_1.prisma.project.count({ where })
    ]);
    const formattedProjects = projects.map((project) => {
        const statusInfo = (0, helpers_1.getProjektStatusInfo)(project.status);
        return {
            id: project.id,
            titel: project.title,
            kunde_id: project.customerId,
            kunde_name: project.Customer?.name || 'Kein Kunde zugewiesen',
            dienstleistung: project.Service?.name || 'Keine Dienstleistung',
            start_datum: (0, formatters_1.formatDateSafely)(project.startDate || new Date(), 'dd.MM.yyyy'),
            end_datum: (0, formatters_1.formatDateSafely)(project.endDate || new Date(), 'dd.MM.yyyy'),
            status: project.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className,
            betrag: project.amount
        };
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    res.status(200).json({
        success: true,
        projects: formattedProjects,
        pagination: {
            current: pageNumber,
            limit: pageSize,
            total: totalPages,
            totalRecords: totalCount
        },
        filters: {
            status,
            kunde_id,
            search
        }
    });
});
exports.getProjectById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const projectId = Number(id);
    if (isNaN(projectId)) {
        throw new errors_1.BadRequestError('Invalid project ID');
    }
    const project = await prisma_utils_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            Customer: true,
            Service: true
        }
    });
    if (!project) {
        throw new errors_1.NotFoundError(`Project with ID ${projectId} not found`);
    }
    const statusInfo = (0, helpers_1.getProjektStatusInfo)(project.status);
    const [appointments, notes] = await Promise.all([
        prisma_utils_1.prisma.appointment.findMany({
            where: { projectId },
            orderBy: { appointmentDate: 'asc' }
        }),
        prisma_utils_1.prisma.projectNote.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })
    ]);
    const result = {
        project: {
            id: project.id,
            titel: project.title,
            kunde_id: project.customerId,
            kunde_name: project.Customer?.name || 'Kein Kunde zugewiesen',
            dienstleistung_id: project.serviceId,
            dienstleistung: project.Service?.name || 'Nicht zugewiesen',
            start_datum: (0, formatters_1.formatDateSafely)(project.startDate, 'dd.MM.yyyy'),
            end_datum: project.endDate ? (0, formatters_1.formatDateSafely)(project.endDate, 'dd.MM.yyyy') : 'Nicht festgelegt',
            betrag: project.amount ? Number(project.amount) : null,
            beschreibung: project.description || 'Keine Beschreibung vorhanden',
            status: project.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className
        },
        appointments: appointments.map((appointment) => {
            const appointmentStatus = (0, helpers_1.getTerminStatusInfo)(appointment.status);
            return {
                id: appointment.id,
                titel: appointment.title,
                datum: (0, formatters_1.formatDateSafely)(appointment.appointmentDate, 'dd.MM.yyyy, HH:mm'),
                statusLabel: appointmentStatus.label,
                statusClass: appointmentStatus.className
            };
        }),
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
exports.createProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const validationSchema = {
        titel: { type: 'text', required: true, minLength: 2 },
        kunde_id: { type: 'text', required: false },
        dienstleistung_id: { type: 'text', required: false },
        start_datum: { type: 'date', required: true },
        end_datum: { type: 'date', required: false },
        betrag: { type: 'numeric', required: false },
        beschreibung: { type: 'text', required: false },
        status: { type: 'text', required: false }
    };
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    const newProject = await prisma_utils_1.prisma.project.create({
        data: {
            title: validatedData.titel,
            customerId: validatedData.kunde_id ? Number(validatedData.kunde_id) : null,
            serviceId: validatedData.dienstleistung_id ? Number(validatedData.dienstleistung_id) : null,
            startDate: new Date(validatedData.start_datum),
            endDate: validatedData.end_datum ? new Date(validatedData.end_datum) : null,
            amount: validatedData.betrag ? Number(validatedData.betrag) : null,
            description: validatedData.beschreibung || null,
            status: validatedData.status || 'neu',
            createdBy: req.user?.id || null
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.projectLog.create({
            data: {
                projectId: newProject.id,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'created',
                details: 'Project created'
            }
        });
        if (validatedData.kunde_id) {
            await prisma_utils_1.prisma.notification.create({
                data: {
                    userId: Number(validatedData.kunde_id),
                    type: 'projekt',
                    title: 'Neues Projekt erstellt',
                    message: `Ein neues Projekt "${validatedData.titel}" wurde angelegt.`,
                    referenceId: newProject.id,
                    referenceType: 'projekte'
                }
            });
        }
    }
    res.status(201).json({
        success: true,
        projectId: newProject.id,
        message: 'Project created successfully'
    });
});
exports.updateProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const projectId = Number(id);
    if (isNaN(projectId)) {
        throw new errors_1.BadRequestError('Invalid project ID');
    }
    const validationSchema = {
        titel: { type: 'text', required: true, minLength: 2 },
        kunde_id: { type: 'text', required: false },
        dienstleistung_id: { type: 'text', required: false },
        start_datum: { type: 'date', required: true },
        end_datum: { type: 'date', required: false },
        betrag: { type: 'numeric', required: false },
        beschreibung: { type: 'text', required: false },
        status: { type: 'text', required: false }
    };
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    const project = await prisma_utils_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new errors_1.NotFoundError(`Project with ID ${projectId} not found`);
    }
    const updatedProject = await prisma_utils_1.prisma.project.update({
        where: { id: projectId },
        data: {
            title: validatedData.titel,
            customerId: validatedData.kunde_id ? Number(validatedData.kunde_id) : null,
            serviceId: validatedData.dienstleistung_id ? Number(validatedData.dienstleistung_id) : null,
            startDate: new Date(validatedData.start_datum),
            endDate: validatedData.end_datum ? new Date(validatedData.end_datum) : null,
            amount: validatedData.betrag ? Number(validatedData.betrag) : null,
            description: validatedData.beschreibung || null,
            status: validatedData.status || 'neu',
            updatedAt: new Date()
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.projectLog.create({
            data: {
                projectId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'updated',
                details: 'Project updated'
            }
        });
    }
    res.status(200).json({
        success: true,
        projectId,
        message: 'Project updated successfully'
    });
});
exports.updateProjectStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id, status, note } = req.body;
    const projectId = Number(id);
    if (isNaN(projectId)) {
        throw new errors_1.BadRequestError('Invalid project ID');
    }
    if (!status) {
        throw new errors_1.ValidationError('Status is required', ['Status is required']);
    }
    if (!['neu', 'in_bearbeitung', 'abgeschlossen', 'storniert'].includes(status)) {
        throw new errors_1.ValidationError('Invalid status value', ['Status must be one of: neu, in_bearbeitung, abgeschlossen, storniert']);
    }
    const project = await prisma_utils_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new errors_1.NotFoundError(`Project with ID ${projectId} not found`);
    }
    await prisma_utils_1.prisma.$transaction(async (tx) => {
        await tx.project.update({
            where: { id: projectId },
            data: {
                status,
                updatedAt: new Date()
            }
        });
        if (note && note.trim() !== '' && req.user?.id) {
            await tx.projectNote.create({
                data: {
                    projectId,
                    userId: req.user.id,
                    userName: req.user.name || 'Unknown',
                    text: note
                }
            });
        }
        if (req.user?.id) {
            await tx.projectLog.create({
                data: {
                    projectId,
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
        projectId,
        message: 'Project status updated successfully'
    });
});
exports.addProjectNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const projectId = Number(id);
    const { note } = req.body;
    if (isNaN(projectId)) {
        throw new errors_1.BadRequestError('Invalid project ID');
    }
    if (!note || note.trim() === '') {
        throw new errors_1.ValidationError('Note cannot be empty', ['Note cannot be empty']);
    }
    const project = await prisma_utils_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new errors_1.NotFoundError(`Project with ID ${projectId} not found`);
    }
    await prisma_utils_1.prisma.projectNote.create({
        data: {
            projectId,
            userId: req.user?.id || null,
            userName: req.user?.name || 'Unknown',
            text: note
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.projectLog.create({
            data: {
                projectId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'note_added',
                details: 'Note added to project'
            }
        });
    }
    res.status(201).json({
        success: true,
        projectId,
        message: 'Note added successfully'
    });
});
exports.exportProjects = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({
        message: 'Export functionality is being migrated to TypeScript and Prisma'
    });
});
//# sourceMappingURL=project.controller.js.map