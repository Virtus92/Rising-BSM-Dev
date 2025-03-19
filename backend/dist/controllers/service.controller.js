"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceStatistics = exports.toggleServiceStatus = exports.updateService = exports.createService = exports.getServiceById = exports.getAllServices = void 0;
const prisma_utils_1 = __importDefault(require("../utils/prisma.utils"));
const formatters_1 = require("../utils/formatters");
const errors_1 = require("../utils/errors");
const validators_1 = require("../utils/validators");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
const validation_types_1 = require("../utils/validation-types");
/**
 * Get all services with optional filtering
 */
exports.getAllServices = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Extract filter parameters
    const { status, search, page = 1, limit = config_1.default.DEFAULT_PAGE_SIZE } = req.query;
    // Validate and sanitize pagination parameters
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(config_1.default.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config_1.default.DEFAULT_PAGE_SIZE));
    const skip = (pageNumber - 1) * pageSize;
    // Build filter conditions
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
    // Execute queries in parallel
    const [services, totalCount] = await Promise.all([
        prisma_utils_1.default.service.findMany({
            where,
            orderBy: { name: 'asc' },
            take: pageSize,
            skip
        }),
        prisma_utils_1.default.service.count({ where })
    ]);
    // Format service data
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
    // Calculate pagination data
    const totalPages = Math.ceil(totalCount / pageSize);
    // Return data object for rendering or JSON response
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
/**
 * Get service by ID
 */
exports.getServiceById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    // Get service details
    const service = await prisma_utils_1.default.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    // Format service data for response
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
/**
 * Create a new service
 */
exports.createService = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Validation schema
    const validationSchema = {
        name: { type: 'text', required: true, minLength: 2 },
        beschreibung: { type: 'text', required: false },
        preis_basis: { type: 'numeric', required: true, min: 0 },
        einheit: { type: 'text', required: true },
        mwst_satz: { type: 'numeric', required: false },
        aktiv: { type: 'text', required: false }
    };
    // Convert to base schema
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    // Insert service into database
    const newService = await prisma_utils_1.default.service.create({
        data: {
            name: validatedData.name,
            description: validatedData.beschreibung || null,
            priceBase: validatedData.preis_basis,
            unit: validatedData.einheit,
            vatRate: validatedData.mwst_satz || 20,
            active: validatedData.aktiv === 'on' || validatedData.aktiv === true
        }
    });
    // Log the activity
    if (req.user?.id) {
        await prisma_utils_1.default.serviceLog.create({
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
/**
 * Update an existing service
 */
exports.updateService = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    // Validation schema
    const validationSchema = {
        name: { type: 'text', required: true, minLength: 2 },
        beschreibung: { type: 'text', required: false },
        preis_basis: { type: 'numeric', required: true, min: 0 },
        einheit: { type: 'text', required: true },
        mwst_satz: { type: 'numeric', required: false },
        aktiv: { type: 'text', required: false }
    };
    // Convert to base schema
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    // Check if service exists
    const service = await prisma_utils_1.default.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    // Update service in database
    const updatedService = await prisma_utils_1.default.service.update({
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
    // Log the activity
    if (req.user?.id) {
        await prisma_utils_1.default.serviceLog.create({
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
/**
 * Toggle service status (active/inactive)
 */
exports.toggleServiceStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    const { aktiv } = req.body;
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    // Check if service exists
    const service = await prisma_utils_1.default.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    const newStatus = aktiv === 'on' || aktiv === true;
    // Update service status in database
    await prisma_utils_1.default.service.update({
        where: { id: serviceId },
        data: {
            active: newStatus,
            updatedAt: new Date()
        }
    });
    // Log the activity
    if (req.user?.id) {
        await prisma_utils_1.default.serviceLog.create({
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
/**
 * Get service statistics
 */
exports.getServiceStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const serviceId = Number(id);
    if (isNaN(serviceId)) {
        throw new errors_1.BadRequestError('Invalid service ID');
    }
    // Validate service exists
    const service = await prisma_utils_1.default.service.findUnique({
        where: { id: serviceId }
    });
    if (!service) {
        throw new errors_1.NotFoundError(`Service with ID ${serviceId} not found`);
    }
    // Execute statistics queries in parallel
    const [invoicePositions, topCustomers] = await Promise.all([
        // Total revenue for this service
        prisma_utils_1.default.invoicePosition.findMany({
            where: { serviceId },
            include: {
                Invoice: true
            }
        }),
        // Top customers for this service (using Prisma instead of raw SQL)
        prisma_utils_1.default.invoicePosition.groupBy({
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
            // Get invoice IDs
            const invoiceIds = results.map((item) => item.invoiceId);
            // Get customer information from invoices
            const invoices = await prisma_utils_1.default.invoice.findMany({
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
    // Calculate total revenue
    const totalRevenue = invoicePositions.reduce((sum, pos) => sum + (Number(pos.quantity) * Number(pos.unitPrice)), 0);
    // Group by month for monthly revenue
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
    const monthlyRevenue = Object.values(invoicesByMonth).sort((a, b) => a.monat.localeCompare(b.monat));
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