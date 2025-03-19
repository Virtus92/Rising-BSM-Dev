"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfErrorHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
/**
 * Global error handler middleware
 * Handles all unhandled errors from routes and controllers
 */
const errorHandler = (err, req, res, next) => {
    // Default to 500 if not an AppError
    const statusCode = err instanceof errors_1.AppError ? err.statusCode : 500;
    const message = err.message || 'An unexpected error occurred';
    // Log the error (with stack trace in development)
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error ${statusCode}: ${message}`);
    if (config_1.default.IS_DEVELOPMENT) {
        console.error(err.stack);
    }
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        res.status(statusCode).json((0, errors_1.createErrorResponse)(err));
        return;
    }
    // Handle CSRF errors
    if (err.code === 'EBADCSRFTOKEN') {
        if (req.flash) {
            req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
        }
        return res.redirect('back');
    }
    // For custom errors with redirects
    if (err instanceof errors_1.AppError && err.redirect) {
        if (req.flash) {
            req.flash('error', message);
        }
        return res.redirect(err.redirect);
    }
    // Handle regular requests based on error type
    if (statusCode === 404) {
        return res.status(404).render('error', {
            title: 'Seite nicht gefunden - Rising BSM',
            statusCode: 404,
            message: 'Die angeforderte Seite wurde nicht gefunden.',
            error: config_1.default.SHOW_STACK_TRACES ? err : {},
            user: req.user
        });
    }
    // For validation errors
    if (err instanceof errors_1.ValidationError) {
        return res.status(400).render('error', {
            title: 'Validation Error - Rising BSM',
            statusCode: 400,
            message: message,
            errors: err.errors,
            error: config_1.default.SHOW_STACK_TRACES ? err : {},
            user: req.user
        });
    }
    // For all other errors
    res.status(statusCode).render('error', {
        title: 'Fehler - Rising BSM',
        statusCode,
        message: config_1.default.IS_PRODUCTION
            ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
            : message,
        error: config_1.default.SHOW_STACK_TRACES ? err : {},
        user: req.user
    });
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 * Handles routes that don't match any defined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new errors_1.AppError(`Seite nicht gefunden - ${req.originalUrl}`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * CSRF error handler
 * Special handler for CSRF token validation errors
 */
const csrfErrorHandler = (err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') {
        return next(err);
    }
    // For API requests
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        res.status(403).json({
            success: false,
            error: 'CSRF token verification failed',
            message: 'Sicherheitstoken ungültig oder abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.'
        });
        return;
    }
    // For regular requests
    if (req.flash) {
        req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
    }
    res.redirect('back');
};
exports.csrfErrorHandler = csrfErrorHandler;
//# sourceMappingURL=error.middleware.js.map