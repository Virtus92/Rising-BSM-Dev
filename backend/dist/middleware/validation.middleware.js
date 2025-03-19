"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContactForm = exports.validateStatusUpdate = exports.validateService = exports.validateAppointment = exports.validateProject = exports.validateCustomer = void 0;
const validators_1 = require("../utils/validators");
const errors_1 = require("../utils/errors");
/**
 * Validates customer data
 */
const validateCustomer = (req, res, next) => {
    try {
        const { name, email, firma, telefon, adresse, plz, ort, notizen, newsletter, status, kundentyp } = req.body;
        // Validation schema
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
        const { isValid, errors } = (0, validators_1.validateInput)(req.body, validationSchema);
        // If there are validation errors
        if (!isValid) {
            throw new errors_1.ValidationError('Validation failed: ' + errors.join('. '), errors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateCustomer = validateCustomer;
/**
 * Validates project data
 */
const validateProject = (req, res, next) => {
    try {
        const { titel, start_datum, end_datum } = req.body;
        const errors = [];
        // Required fields
        if (!titel || typeof titel !== 'string' || titel.trim() === '') {
            errors.push('Title is required');
        }
        if (!start_datum) {
            errors.push('Start date is required');
        }
        else {
            const dateValidation = (0, validators_1.validateDate)(start_datum);
            if (!dateValidation.isValid) {
                errors.push('Please enter a valid start date');
            }
        }
        // Optional end date should be after start date
        if (end_datum && start_datum) {
            const startDateValidation = (0, validators_1.validateDate)(start_datum);
            const endDateValidation = (0, validators_1.validateDate)(end_datum);
            if (startDateValidation.isValid && endDateValidation.isValid) {
                const startDate = new Date(start_datum);
                const endDate = new Date(end_datum);
                if (endDate < startDate) {
                    errors.push('End date must be after start date');
                }
            }
        }
        // If there are validation errors
        if (errors.length > 0) {
            throw new errors_1.ValidationError('Validation failed: ' + errors.join('. '), errors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateProject = validateProject;
/**
 * Validates appointment data
 */
const validateAppointment = (req, res, next) => {
    try {
        const { titel, termin_datum, termin_zeit } = req.body;
        const errors = [];
        // Required fields
        if (!titel || typeof titel !== 'string' || titel.trim() === '') {
            errors.push('Title is required');
        }
        if (!termin_datum) {
            errors.push('Date is required');
        }
        else {
            const dateValidation = (0, validators_1.validateDate)(termin_datum);
            if (!dateValidation.isValid) {
                errors.push('Please enter a valid date');
            }
        }
        if (!termin_zeit) {
            errors.push('Time is required');
        }
        else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(termin_zeit)) {
            errors.push('Please enter a valid time (HH:MM)');
        }
        // Validate the date is not in the past
        if (termin_datum && termin_zeit) {
            try {
                const now = new Date();
                const appointmentDate = new Date(`${termin_datum}T${termin_zeit}`);
                if (appointmentDate < now) {
                    errors.push('Appointment date and time cannot be in the past');
                }
            }
            catch (e) {
                errors.push('Invalid appointment date or time format');
            }
        }
        // If there are validation errors
        if (errors.length > 0) {
            throw new errors_1.ValidationError('Validation failed: ' + errors.join('. '), errors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateAppointment = validateAppointment;
/**
 * Validates service data
 */
const validateService = (req, res, next) => {
    try {
        const { name, preis_basis, einheit } = req.body;
        const errors = [];
        // Required fields
        if (!name || typeof name !== 'string' || name.trim() === '') {
            errors.push('Name is required');
        }
        if (!preis_basis) {
            errors.push('Base price is required');
        }
        else if (isNaN(parseFloat(preis_basis)) || parseFloat(preis_basis) < 0) {
            errors.push('Please enter a valid price (must be a positive number)');
        }
        if (!einheit || typeof einheit !== 'string' || einheit.trim() === '') {
            errors.push('Unit is required');
        }
        // If there are validation errors
        if (errors.length > 0) {
            throw new errors_1.ValidationError('Validation failed: ' + errors.join('. '), errors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateService = validateService;
/**
 * Validates request status update
 */
const validateStatusUpdate = (req, res, next) => {
    try {
        const { id, status } = req.body;
        const errors = [];
        // Required fields
        if (!id) {
            errors.push('ID is required');
        }
        if (!status || typeof status !== 'string') {
            errors.push('Status is required');
        }
        // If there are validation errors
        if (errors.length > 0) {
            throw new errors_1.ValidationError('Validation failed: ' + errors.join('. '), errors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateStatusUpdate = validateStatusUpdate;
/**
 * Validates contact form submission
 */
const validateContactForm = (req, res, next) => {
    try {
        // Validation schema for contact form
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
        // Validate input
        const validationResult = (0, validators_1.validateInput)(req.body, validationSchema);
        if (!validationResult.isValid) {
            throw new errors_1.ValidationError('Validation failed', validationResult.errors);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateContactForm = validateContactForm;
exports.default = {
    validateCustomer: exports.validateCustomer,
    validateProject: exports.validateProject,
    validateAppointment: exports.validateAppointment,
    validateService: exports.validateService,
    validateStatusUpdate: exports.validateStatusUpdate,
    validateContactForm: exports.validateContactForm
};
//# sourceMappingURL=validation.middleware.js.map