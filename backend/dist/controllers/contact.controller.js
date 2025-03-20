"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContactRequest = exports.submitContact = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const notification_service_1 = __importDefault(require("../services/notification.service"));
const validators_1 = require("../utils/validators");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.submitContact = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const validationSchema = {
        name: {
            type: 'text',
            required: true,
            minLength: 2,
            maxLength: 100,
        },
        email: {
            type: 'email',
        },
        phone: {
            type: 'phone',
            required: false,
        },
        service: {
            type: 'text',
            required: true,
        },
        message: {
            type: 'text',
            required: true,
            minLength: 10,
            maxLength: 1000,
        },
    };
    const validationResult = (0, validators_1.validateInput)(req.body, validationSchema);
    if (!validationResult.isValid) {
        return res.status(400).json({
            success: false,
            errors: validationResult.errors,
        });
    }
    const { name, email, phone = null, service, message } = validationResult.validatedData;
    const contactRequest = await prisma_utils_1.prisma.contactRequest.create({
        data: {
            name,
            email,
            phone,
            service,
            message,
            status: 'neu',
            ipAddress: req.ip,
        },
    });
    const requestId = contactRequest.id;
    const adminUsers = await prisma_utils_1.prisma.user.findMany({
        where: {
            role: {
                in: ['admin', 'manager'],
            },
        },
        select: {
            id: true,
        },
    });
    const notifications = [];
    if (!adminUsers || adminUsers.length === 0) {
        console.warn('No admin users found to notify.');
    }
    else {
        adminUsers.forEach((admin) => {
            notifications.push({
                userId: admin.id,
                type: 'anfrage',
                title: 'Neue Kontaktanfrage',
                message: `Neue Anfrage von ${name} über ${service}`,
                referenceId: requestId,
                referenceType: 'kontaktanfragen',
            });
        });
    }
    notifications.push({
        userId: null,
        type: 'contact_confirmation',
        title: 'Kontaktanfrage erhalten',
        message: `Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden`,
        referenceId: requestId,
        referenceType: 'kontaktanfragen',
    });
    await Promise.all(notifications.map((notification) => notification_service_1.default.create(notification)));
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(201).json({
            success: true,
            message: 'Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns bald bei Ihnen.',
            requestId,
        });
    }
    else {
        return res.redirect('/');
    }
});
exports.getContactRequest = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const contactRequest = await prisma_utils_1.prisma.contactRequest.findUnique({
        where: { id: Number(id) },
    });
    if (!contactRequest) {
        return res.status(404).json({ message: 'Contact request not found' });
    }
    return res.json(contactRequest);
});
//# sourceMappingURL=contact.controller.js.map