"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceStatistics = exports.toggleServiceStatus = exports.updateService = exports.createService = exports.getServiceById = exports.getAllServices = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const formatters_1 = require("../utils/formatters");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
const validation_types_1 = require("../utils/validation-types");
exports.getAllServices = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, search, page = 1, limit = config_1.default.DEFAULT_PAGE_SIZE } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(config_1.default.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config_1.default.DEFAULT_PAGE_SIZE));
    const skip = (pageNumber - 1) * pageSize;
    const where = {};
    if (status === 'aktiv') {
        where.active = true;
    }
    else if (status === 'inaktiv') {
        where.active = false;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }
    const [services, totalCount] = await Promise.all([
        prisma_utils_1.prisma.service.findMany({
            where,
            orderBy: { name: 'asc' },
            take: pageSize,
            skip
        }),
        prisma_utils_1.prisma.service.count({ where })
    ]);
    const formattedServices = services.map((service) => ({
        id: service.id,
        name: service.name,
        beschreibung: service.description,
        preis_basis: parseFloat(service.priceBase?.toString() || '0'),
        einheit: service.unit || '',
        mwst_satz: parseFloat(service.vatRate?.toString() || '0'),
        aktiv: service.active,
        created_at: (0, formatters_1.formatDateSafely)(service.createdAt, 'dd.MM.yyyy'),
        updated_at: (0, formatters_1.formatDateSafely)(service.updatedAt, 'dd.MM.yyyy')
    }));
    const totalPages = Math.ceil(totalCount / pageSize);
    res.status(200).json({
        success: true,
        services: formattedServices,
        pagination: {
            current: pageNumber,
            limit: pageSize,
            total: totalPages,
            totalRecords: totalCount
        },
        filters: {
            status,
            search
        }
    });
});
exports.getServiceById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    const service = await prisma_utils_1.prisma.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    res.status(200).json({
        success: true,
        service: {
            id: service.id,
            name: service.name,
            beschreibung: service.description || '',
            preis_basis: parseFloat(service.priceBase?.toString() || '0'),
            einheit: service.unit || '',
            mwst_satz: parseFloat(service.vatRate?.toString() || '0'),
            aktiv: service.active,
            created_at: (0, formatters_1.formatDateSafely)(service.createdAt, 'dd.MM.yyyy'),
            updated_at: (0, formatters_1.formatDateSafely)(service.updatedAt, 'dd.MM.yyyy')
        }
    });
});
exports.createService = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const validationSchema = {
        name: { type: 'text', required: true, minLength: 2 },
        beschreibung: { type: 'text', required: false },
        preis_basis: { type: 'numeric', required: true, min: 0 },
        einheit: { type: 'text', required: true },
        mwst_satz: { type: 'numeric', required: false },
        aktiv: { type: 'text', required: false }
    };
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    const newService = await prisma_utils_1.prisma.service.create({
        data: {
            name: validatedData.name,
            description: validatedData.beschreibung || null,
            priceBase: validatedData.preis_basis,
            unit: validatedData.einheit,
            vatRate: validatedData.mwst_satz || 20,
            active: validatedData.aktiv === 'on' || validatedData.aktiv === true
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.serviceLog.create({
            data: {
                serviceId: newService.id,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'created',
                details: 'Service created'
            }
        });
    }
    res.status(201).json({
        success: true,
        serviceId: newService.id,
        message: 'Service created successfully'
    });
});
exports.updateService = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    const validationSchema = {
        name: { type: 'text', required: true, minLength: 2 },
        beschreibung: { type: 'text', required: false },
        preis_basis: { type: 'numeric', required: true, min: 0 },
        einheit: { type: 'text', required: true },
        mwst_satz: { type: 'numeric', required: false },
        aktiv: { type: 'text', required: false }
    };
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    const service = await prisma_utils_1.prisma.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    const updatedService = await prisma_utils_1.prisma.service.update({
        where: { id: serviceId },
        data: {
            name: validatedData.name,
            description: validatedData.beschreibung || null,
            priceBase: validatedData.preis_basis,
            unit: validatedData.einheit,
            vatRate: validatedData.mwst_satz || 20,
            active: validatedData.aktiv === 'on' || validatedData.aktiv === true,
            updatedAt: new Date()
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.serviceLog.create({
            data: {
                serviceId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'updated',
                details: 'Service updated'
            }
        });
    }
    res.status(200).json({
        success: true,
        serviceId,
        message: 'Service updated successfully'
    });
});
exports.toggleServiceStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    const { aktiv } = req.body;
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    const service = await prisma_utils_1.prisma.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    const newStatus = aktiv === 'on' || aktiv === true;
    await prisma_utils_1.prisma.service.update({
        where: { id: serviceId },
        data: {
            active: newStatus,
            updatedAt: new Date()
        }
    });
    if (req.user?.id) {
        await prisma_utils_1.prisma.serviceLog.create({
            data: {
                serviceId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'status_changed',
                details: `Status changed to: ${newStatus ? 'active' : 'inactive'}`
            }
        });
    }
    res.status(200).json({
        success: true,
        serviceId,
        message: `Service ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
});
exports.getServiceStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    const service = await prisma_utils_1.prisma.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    const [invoicePositions, topCustomers] = await Promise.all([
        prisma_utils_1.prisma.invoicePosition.findMany({
            where: { serviceId },
            include: {
                Invoice: true
            }
        }),
        prisma_utils_1.prisma.invoicePosition.groupBy({
            by: ['invoiceId'],
            where: { serviceId },
            _sum: {
                quantity: true,
                unitPrice: true
            },
            orderBy: {
                _sum: {
                    unitPrice: 'desc'
                }
            },
            take: 5
        }).then(async (results) => {
            const invoiceIds = results.map((item) => item.invoiceId);
            const invoices = await prisma_utils_1.prisma.invoice.findMany({
                where: {
                    id: { in: invoiceIds }
                },
                include: {
                    Customer: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
        })
    ]);
    const totalRevenue = invoicePositions.reduce((sum, pos) => sum + (Number(pos.quantity) * Number(pos.unitPrice)), 0);
    const invoicesByMonth = invoicePositions.reduce((acc, pos) => {
        if (!pos.Invoice || !pos.Invoice.invoiceDate)
            return acc;
        const date = new Date(pos.Invoice.invoiceDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthKey]) {
            acc[monthKey] = {
                monat: monthKey,
                umsatz: 0
            };
        }
        acc[monthKey].umsatz += Number(pos.quantity) * Number(pos.unitPrice);
        return acc;
    }, {});
    const monthlyRevenue = Object.values(invoicesByMonth);
    monthlyRevenue.sort((a, b) => a.monat.localeCompare(b.monat));
    res.status(200).json({
        success: true,
        statistics: {
            name: service.name,
            gesamtumsatz: totalRevenue,
            rechnungsanzahl: new Set(invoicePositions.map((p) => p.invoiceId)).size,
            monatlicheUmsaetze: monthlyRevenue,
            topKunden: Array.isArray(topCustomers) ? topCustomers.map((customer) => ({
                kundenId: customer.id,
                kundenName: customer.name,
                umsatz: parseFloat(customer.total_amount?.toString() || '0')
            })) : []
        }
    });
});
//# sourceMappingURL=service.controller.js.map