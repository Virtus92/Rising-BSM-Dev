"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomerStatus = exports.addCustomerNote = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const validation_types_1 = require("../utils/validation-types");
const validators_1 = require("../utils/validators");
const prisma_utils_1 = __importDefault(require("../utils/prisma.utils"));
const formatters_1 = require("../utils/formatters");
const helpers_1 = require("../utils/helpers");
const errors_1 = require("../utils/errors");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
/**
 * Get all customers with optional filtering
 */
exports.getAllCustomers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Extract filter parameters
    const { status, type: kundentyp, search, page = 1, limit = config_1.default.DEFAULT_PAGE_SIZE } = req.query;
    // Validate and sanitize pagination parameters
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(config_1.default.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config_1.default.DEFAULT_PAGE_SIZE));
    const skip = (pageNumber - 1) * pageSize;
    // Build filter conditions
    const where = {};
    if (status) {
        where.status = status;
    }
    if (kundentyp) {
        where.type = kundentyp;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }
    // Execute database queries in parallel
    const [customers, totalCount, stats, growthData] = await Promise.all([
        prisma_utils_1.default.customer.findMany({
            where,
            orderBy: { name: 'asc' },
            take: pageSize,
            skip
        }),
        prisma_utils_1.default.customer.count({ where }),
        // Get customer statistics
        prisma_utils_1.default.$queryRaw `
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN type = 'privat' THEN 1 END) AS privat,
        COUNT(CASE WHEN type = 'geschaeft' THEN 1 END) AS geschaeft,
        COUNT(CASE WHEN status = 'aktiv' THEN 1 END) AS aktiv
      FROM "Customer"
    `,
        // Get growth data for the chart
        prisma_utils_1.default.$queryRaw `
      SELECT
        DATE_TRUNC('month', "createdAt") AS month,
        COUNT(*) AS customer_count
      FROM "Customer"
      WHERE status != 'geloescht' AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `
    ]);
    const formattedCustomers = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        firma: customer.company || '',
        email: customer.email || '',
        telefon: customer.phone || '',
        adresse: customer.address || '',
        plz: customer.postalCode || '',
        ort: customer.city || '',
        status: customer.status,
        statusLabel: customer.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
        statusClass: customer.status === 'aktiv' ? 'success' : 'secondary',
        kundentyp: customer.type,
        kundentypLabel: customer.type === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
        created_at: (0, formatters_1.formatDateSafely)(customer.createdAt, 'dd.MM.yyyy')
    }));
    // Calculate pagination data
    const totalPages = Math.ceil(totalCount / pageSize);
    const formattedGrowthData = growthData.map((row) => ({
        month: (0, formatters_1.formatDateSafely)(row.month, 'MM/yyyy'),
        customer_count: Number(row.customer_count)
    }));
    // Use the formatted data in your response
    res.status(200).json({
        // Other properties...
        growthData: formattedGrowthData
    });
});
/**
 * Get customer by ID with related data
 */
exports.getCustomerById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const customerId = Number(id);
    if (isNaN(customerId)) {
        throw new errors_1.BadRequestError('Invalid customer ID');
    }
    // Get customer details
    const customer = await prisma_utils_1.default.customer.findUnique({
        where: { id: customerId }
    });
    if (!customer) {
        throw new errors_1.NotFoundError(`Customer with ID ${customerId} not found`);
    }
    // Get appointments for this customer with Promise.all for parallel execution
    const [appointments, projects] = await Promise.all([
        prisma_utils_1.default.appointment.findMany({
            where: { customerId },
            orderBy: { appointmentDate: 'desc' },
            take: 10
        }),
        prisma_utils_1.default.project.findMany({
            where: { customerId },
            orderBy: { startDate: 'desc' },
            take: 10
        })
    ]);
    const formattedAppointments = appointments.map((appointment) => {
        const statusInfo = (0, helpers_1.getTerminStatusInfo)(appointment.status);
        return {
            id: appointment.id,
            titel: appointment.title,
            datum: (0, formatters_1.formatDateSafely)(appointment.appointmentDate, 'dd.MM.yyyy, HH:mm'),
            status: appointment.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className
        };
    });
    const formattedProjects = projects.map((project) => {
        const statusInfo = (0, helpers_1.getProjektStatusInfo)(project.status);
        return {
            id: project.id,
            titel: project.title,
            datum: (0, formatters_1.formatDateSafely)(project.startDate, 'dd.MM.yyyy'),
            status: project.status,
            statusLabel: statusInfo.label,
            statusClass: statusInfo.className
        };
    });
    // Format customer data for response
    const result = {
        customer: {
            id: customer.id,
            name: customer.name,
            firma: customer.company || 'Nicht angegeben',
            email: customer.email || '',
            telefon: customer.phone || 'Nicht angegeben',
            adresse: customer.address || 'Nicht angegeben',
            plz: customer.postalCode || '',
            ort: customer.city || '',
            kundentyp: customer.type === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
            status: customer.status,
            statusLabel: customer.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
            statusClass: customer.status === 'aktiv' ? 'success' : 'secondary',
            notizen: customer.notes || 'Keine Notizen vorhanden',
            newsletter: customer.newsletter,
            created_at: (0, formatters_1.formatDateSafely)(customer.createdAt, 'dd.MM.yyyy')
        },
        appointments: formattedAppointments,
        projects: formattedProjects
    };
    res.status(200).json({
        success: true,
        ...result
    });
});
/**
 * Create a new customer
 */
exports.createCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Validate input using the validator utility
    const validationSchema = {
        name: { type: 'text', required: true, minLength: 2 },
        email: { type: 'email', required: true },
        firma: { type: 'text', required: false },
        telefon: { type: 'phone', required: false },
        adresse: { type: 'text', required: false },
        plz: { type: 'text', required: false },
        ort: { type: 'text', required: false },
        notizen: { type: 'text', required: false },
        newsletter: { type: 'text', required: false },
        status: { type: 'text', required: false },
        kundentyp: { type: 'text', required: false }
    };
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    // Check if email is already in use
    const existingCustomer = await prisma_utils_1.default.customer.findFirst({
        where: { email: validatedData.email }
    });
    if (existingCustomer) {
        throw new errors_1.ValidationError('Email is already in use', ['Email is already in use']);
    }
    // Insert customer into database
    const newCustomer = await prisma_utils_1.default.customer.create({
        data: {
            name: validatedData.name,
            company: validatedData.firma || null,
            email: validatedData.email,
            phone: validatedData.telefon || null,
            address: validatedData.adresse || null,
            postalCode: validatedData.plz || null,
            city: validatedData.ort || null,
            type: validatedData.kundentyp || 'privat',
            status: validatedData.status || 'aktiv',
            notes: validatedData.notizen || null,
            newsletter: validatedData.newsletter === 'on' || validatedData.newsletter === true
        }
    });
    // Log the activity
    if (req.user?.id) {
        await prisma_utils_1.default.customerLog.create({
            data: {
                customerId: newCustomer.id,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'created',
                details: 'Customer created'
            }
        });
    }
    res.status(201).json({
        success: true,
        customerId: newCustomer.id,
        message: 'Customer created successfully'
    });
});
/**
 * Update an existing customer
 */
exports.updateCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const customerId = Number(id);
    if (isNaN(customerId)) {
        throw new errors_1.BadRequestError('Invalid customer ID');
    }
    // Validate input using the validator utility
    const validationSchema = {
        name: { type: 'text', required: true, minLength: 2 },
        email: { type: 'email', required: true },
        firma: { type: 'text', required: false },
        telefon: { type: 'phone', required: false },
        adresse: { type: 'text', required: false },
        plz: { type: 'text', required: false },
        ort: { type: 'text', required: false },
        notizen: { type: 'text', required: false },
        newsletter: { type: 'text', required: false },
        status: { type: 'text', required: false },
        kundentyp: { type: 'text', required: false }
    };
    const baseSchema = (0, validation_types_1.convertValidationSchema)(validationSchema);
    const { validatedData } = (0, validators_1.validateInput)(req.body, baseSchema, { throwOnError: true });
    // Check if customer exists
    const existingCustomer = await prisma_utils_1.default.customer.findUnique({
        where: { id: customerId }
    });
    if (!existingCustomer) {
        throw new errors_1.NotFoundError(`Customer with ID ${customerId} not found`);
    }
    // Check if email is unique (if changed)
    if (validatedData.email !== existingCustomer.email) {
        const emailCheck = await prisma_utils_1.default.customer.findFirst({
            where: {
                email: validatedData.email,
                id: { not: customerId }
            }
        });
        if (emailCheck) {
            throw new errors_1.ValidationError('Email address is already in use', ['Email address is already in use']);
        }
    }
    // Update customer in database
    const updatedCustomer = await prisma_utils_1.default.customer.update({
        where: { id: customerId },
        data: {
            name: validatedData.name,
            company: validatedData.firma || null,
            email: validatedData.email,
            phone: validatedData.telefon || null,
            address: validatedData.adresse || null,
            postalCode: validatedData.plz || null,
            city: validatedData.ort || null,
            type: validatedData.kundentyp || 'privat',
            status: validatedData.status || 'aktiv',
            notes: validatedData.notizen || null,
            newsletter: validatedData.newsletter === 'on' || validatedData.newsletter === true,
            updatedAt: new Date()
        }
    });
    // Log the update activity
    if (req.user?.id) {
        await prisma_utils_1.default.customerLog.create({
            data: {
                customerId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'updated',
                details: 'Customer information updated'
            }
        });
    }
    res.status(200).json({
        success: true,
        customerId,
        message: 'Customer updated successfully'
    });
});
/**
 * Add a note to customer
 */
exports.addCustomerNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const customerId = Number(id);
    const { notiz } = req.body;
    if (isNaN(customerId)) {
        throw new errors_1.BadRequestError('Invalid customer ID');
    }
    if (!notiz || notiz.trim() === '') {
        throw new errors_1.ValidationError('Note cannot be empty', ['Note cannot be empty']);
    }
    // Get customer
    const customer = await prisma_utils_1.default.customer.findUnique({
        where: { id: customerId }
    });
    if (!customer) {
        throw new errors_1.NotFoundError(`Customer with ID ${customerId} not found`);
    }
    const currentNotes = customer.notes || '';
    const timestamp = (0, formatters_1.formatDateSafely)(new Date(), 'dd.MM.yyyy, HH:mm');
    const userName = req.user?.name || 'Unknown';
    // Format the new note with timestamp and username
    const newNote = `${timestamp} - ${userName}:\n${notiz}\n\n${currentNotes}`;
    // Update notes in database
    await prisma_utils_1.default.customer.update({
        where: { id: customerId },
        data: {
            notes: newNote,
            updatedAt: new Date()
        }
    });
    // Log the note activity
    if (req.user?.id) {
        await prisma_utils_1.default.customerLog.create({
            data: {
                customerId,
                userId: req.user.id,
                userName,
                action: 'note_added',
                details: 'Note added to customer'
            }
        });
    }
    res.status(200).json({
        success: true,
        customerId,
        message: 'Note added successfully'
    });
});
/**
 * Update customer status
 */
exports.updateCustomerStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id, status } = req.body;
    const customerId = Number(id);
    if (isNaN(customerId)) {
        throw new errors_1.BadRequestError('Invalid customer ID');
    }
    // Validation
    if (!status) {
        throw new errors_1.ValidationError('Status is required', ['Status is required']);
    }
    // Check valid status values
    if (!['aktiv', 'inaktiv', 'geloescht'].includes(status)) {
        throw new errors_1.ValidationError('Invalid status value', ['Status must be one of: aktiv, inaktiv, geloescht']);
    }
    // Check if customer exists
    const customer = await prisma_utils_1.default.customer.findUnique({
        where: { id: customerId }
    });
    if (!customer) {
        throw new errors_1.NotFoundError(`Customer with ID ${customerId} not found`);
    }
    // Update status in database
    await prisma_utils_1.default.customer.update({
        where: { id: customerId },
        data: {
            status,
            updatedAt: new Date()
        }
    });
    // Log the status change
    if (req.user?.id) {
        await prisma_utils_1.default.customerLog.create({
            data: {
                customerId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'status_changed',
                details: `Status changed to: ${status}`
            }
        });
    }
    res.status(200).json({
        success: true,
        customerId,
        message: 'Customer status updated successfully'
    });
});
/**
 * Delete a customer (mark as deleted)
 */
exports.deleteCustomer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.body;
    const customerId = Number(id);
    if (isNaN(customerId)) {
        throw new errors_1.BadRequestError('Invalid customer ID');
    }
    // Check if customer exists
    const customer = await prisma_utils_1.default.customer.findUnique({
        where: { id: customerId }
    });
    if (!customer) {
        throw new errors_1.NotFoundError(`Customer with ID ${customerId} not found`);
    }
    // Check if customer has related projects or appointments
    const [relatedProjects, relatedAppointments] = await Promise.all([
        prisma_utils_1.default.project.count({
            where: { customerId }
        }),
        prisma_utils_1.default.appointment.count({
            where: { customerId }
        })
    ]);
    if (relatedProjects > 0 || relatedAppointments > 0) {
        throw new errors_1.BadRequestError(`Cannot delete customer. ${relatedProjects} projects and 
      ${relatedAppointments} appointments are still linked to this customer.`);
    }
    // Mark as deleted instead of actual deletion
    await prisma_utils_1.default.customer.update({
        where: { id: customerId },
        data: {
            status: 'geloescht',
            updatedAt: new Date()
        }
    });
    // Log the deletion
    if (req.user?.id) {
        await prisma_utils_1.default.customerLog.create({
            data: {
                customerId,
                userId: req.user.id,
                userName: req.user.name || 'Unknown',
                action: 'deleted',
                details: 'Customer marked as deleted'
            }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Customer successfully deleted'
    });
});
//# sourceMappingURL=customer.controller.js.map