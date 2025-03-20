"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfErrorHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
const errorHandler = (err, req, res, next) => {
    const statusCode = err instanceof errors_1.AppError ? err.statusCode : 500;
    const message = err.message || 'An unexpected error occurred';
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error ${statusCode}: ${message}`);
    if (config_1.default.IS_DEVELOPMENT) {
        console.error(err.stack);
    }
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        res.status(statusCode).json((0, errors_1.createErrorResponse)(err));
        return;
    }
    if (err.code === 'EBADCSRFTOKEN') {
        if (req.flash) {
            req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
        }
        return res.redirect('back');
    }
    if (err instanceof errors_1.AppError && err.redirect) {
        if (req.flash) {
            req.flash('error', message);
        }
        return res.redirect(err.redirect);
    }
    const user = req.user;
    if (statusCode === 404) {
        return res.status(404).render('error.ejs', {
            title: 'Seite nicht gefunden - Rising BSM',
            statusCode: 404,
            message: 'Die angeforderte Seite wurde nicht gefunden.',
            error: config_1.default.SHOW_STACK_TRACES ? err : {},
            user: user
        });
    }
    if (err instanceof errors_1.ValidationError) {
        return res.status(400).render('error.ejs', {
            title: 'Validation Error - Rising BSM',
            statusCode: 400,
            message: message,
            errors: err.errors,
            error: config_1.default.SHOW_STACK_TRACES ? err : {},
            user: user
        });
    }
    res.status(statusCode).render('error.ejs', {
        title: 'Fehler - Rising BSM',
        statusCode,
        message: config_1.default.IS_PRODUCTION
            ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
            : message,
        error: config_1.default.SHOW_STACK_TRACES ? err : {},
        user: user
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new errors_1.AppError(`Seite nicht gefunden - ${req.originalUrl}`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const csrfErrorHandler = (err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') {
        return next(err);
    }
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        res.status(403).json({
            success: false,
            error: 'CSRF token verification failed',
            message: 'Sicherheitstoken ungültig oder abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.'
        });
        return;
    }
    if (req.flash) {
        req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
    }
    res.redirect('back');
};
exports.csrfErrorHandler = csrfErrorHandler;
//# sourceMappingURL=error.middleware.js.map