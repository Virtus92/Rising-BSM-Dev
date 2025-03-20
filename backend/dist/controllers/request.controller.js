"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRequests = exports.addRequestNote = exports.updateRequestStatus = exports.getRequestById = exports.getAllRequests = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const formatters_1 = require("../utils/formatters");
const helpers_1 = require("../utils/helpers");
const errors_1 = require("../utils/errors");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
exports.getAllRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, service, date, search, page = 1, limit = config_1.default.DEFAULT_PAGE_SIZE } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(config_1.default.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config_1.default.DEFAULT_PAGE_SIZE));
    const skip = (pageNumber - 1) * pageSize;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (service) {
        where.service = service;
    }
    if (date) {
        where.createdAt = {
            gte: new Date(`${date}T00:00:00`),
            lt: new Date(`${date}T23:59:59`)
        };
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }
    const [requests, totalCount] = await Promise.all([
        prisma_utils_1.prisma.contactRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip
        }),
        prisma_utils_1.prisma.contactRequest.count({ where })
    ]);
    const formattedRequests = requests.map((request) => {
        const statusInfo = (0, helpers_1.getAnfrageStatusInfo)(request.status);
        return {
            id: request.id,
            name: request.name,
            email: request.email,
            serviceLabel: request.service === 'facility' ? 'Facility Management' :
                request.service === 'moving' ? 'Umzüge & Transporte' :
                    request.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
            formattedDate: (0, formatters_1.formatDateSafely)(request.createdAt, 'dd.MM.yyyy'),
            status: statusInfo.label,
            statusClass: statusInfo.className
        };
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    res.status(200).json({
        success: true,
        requests: formattedRequests,
        pagination: {
            current: pageNumber,
            limit: pageSize,
            total: totalPages,
            totalRecords: totalCount
        },
        filters: {
            status,
            service,
            date,
            search
        }
    });
});
exports.getRequestById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const requestId = Number(id);
    if (isNaN(requestId)) {
        throw new errors_1.BadRequestError('Invalid request ID');
    }
    const request = await prisma_utils_1.prisma.contactRequest.findUnique({
        where: { id: requestId }
    });
    if (!request) {
        throw new errors_1.NotFoundError(`Request with ID ${requestId} not found`);
    }
    const statusInfo = (0, helpers_1.getAnfrageStatusInfo)(request.status);
    const notes = await prisma_utils_1.prisma.requestNote.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' }
    });
    const result = {
        request: {},
        notes: notes.map((note) => ({
            id: note.id,
            text: note.text,
            formattedDate: (0, formatters_1.formatDateSafely)(note.createdAt, 'dd.MM.yyyy, HH:mm'),
            benutzer: note.userName
        }))
    };
});
exports.updateRequestStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id, status, note } = req.body;
    const requestId = Number(id);
    if (isNaN(requestId)) {
        throw new errors_1.BadRequestError('Invalid request ID');
    }
    if (!status) {
        throw new errors_1.ValidationError('Status is required', ['Status is required']);
    }
    if (!['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'].includes(status)) {
        throw new errors_1.ValidationError('Invalid status value', ['Status must be one of: neu, in_bearbeitung, beantwortet, geschlossen']);
    }
    const request = await prisma_utils_1.prisma.contactRequest.findUnique({
        where: { id: requestId }
    });
    if (!request) {
        throw new errors_1.NotFoundError(`Request with ID ${requestId} not found`);
    }
    await prisma_utils_1.prisma.$transaction(async (tx) => {
        await tx.contactRequest.update({
            where: { id: requestId },
            data: {
                status,
                updatedAt: new Date()
            }
        });
        if (note && note.trim() !== '' && req.user?.id) {
            await tx.requestNote.create({
                data: {
                    requestId,
                    userId: req.user.id,
                    userName: req.user.name || 'Unknown',
                    text: note
                }
            });
        }
        if (req.user?.id) {
            await tx.requestLog.create({
                data: {
                    requestId,
                    userId: req.user.id,
                    userName: req.user.name || 'Unknown',
                    action: 'status_changed',
                    details: `Status changed to: ${status}`
                }
            });
        }
    });
});
exports.addRequestNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const requestId = Number(id);
    const { note } = req.body;
    if (isNaN(requestId)) {
        throw new errors_1.BadRequestError('Invalid request ID');
    }
    if (!note || note.trim() === '') {
        throw new errors_1.ValidationError('Note cannot be empty', ['Note cannot be empty']);
    }
    const request = await prisma_utils_1.prisma.contactRequest.findUnique({
        where: { id: requestId }
    });
    if (!request) {
        throw new errors_1.NotFoundError(`Request with ID ${requestId} not found`);
    }
    if (req.user?.id) {
        await prisma_utils_1.prisma.requestNote.create({
            data: {
                requestId,
                userId: req.user.id,
                userName: req.user?.name || 'Unknown',
                text: note
            }
        });
        await prisma_utils_1.prisma.requestLog.create({
            data: {
                requestId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'note_added',
                details: 'Note added to request'
            }
        });
    }
    else {
        console.warn('Note added without user context');
    }
    res.status(201).json({
        success: true,
        requestId,
        message: 'Note added successfully'
    });
});
exports.exportRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.status(501).json({
        message: 'Export functionality is being migrated to TypeScript and Prisma'
    });
});
//# sourceMappingURL=request.controller.js.map