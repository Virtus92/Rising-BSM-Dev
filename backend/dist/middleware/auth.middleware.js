"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotAuthenticated = exports.isEmployee = exports.isManager = exports.isAdmin = exports.isAuthenticated = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const prisma_utils_1 = __importDefault(require("../utils/prisma.utils"));
const config_1 = __importDefault(require("../config"));
const AUTH_MODE = config_1.default.AUTH_MODE || 'dual';
/**
 * Authentication middleware that supports both session and JWT authentication
 * Attaches user object to request if authenticated
 */
const authenticate = async (req, res, next) => {
    try {
        // Strategy 1: Check JWT token in Authorization header
        if (AUTH_MODE === 'jwt' || AUTH_MODE === 'dual') {
            const authHeader = req.headers.authorization;
            const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
            if (token) {
                try {
                    const payload = (0, jwt_1.verifyToken)(token);
                    // Fetch up-to-date user information from database
                    const user = await prisma_utils_1.default.user.findUnique({
                        where: { id: payload.userId },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            status: true
                        }
                    });
                    if (user && user.status === 'aktiv') {
                        req.user = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        };
                        return next();
                    }
                }
                catch (error) {
                    // If in dual mode, continue to try session authentication
                    if (AUTH_MODE !== 'dual') {
                        throw error;
                    }
                }
            }
        }
        // Strategy 2: Check session-based authentication
        if (AUTH_MODE === 'session' || AUTH_MODE === 'dual') {
            if (req.session && req.session.user) {
                // Optional: Verify session user is still valid in database
                req.user = {
                    id: req.session.user.id,
                    name: req.session.user.name,
                    email: req.session.user.email,
                    role: req.session.user.role
                };
                return next();
            }
        }
        // If no authentication is found
        if (AUTH_MODE === 'dual') {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        else if (AUTH_MODE === 'jwt') {
            throw new errors_1.UnauthorizedError('Valid JWT token required');
        }
        else {
            throw new errors_1.UnauthorizedError('Valid session required');
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Utility function that wraps authenticate to handle the callback properly
 */
function handleAuthResult(req, res, next, callback) {
    try {
        (0, exports.authenticate)(req, res, (err) => {
            if (err) {
                callback(err);
                return;
            }
            next();
        });
    }
    catch (error) {
        callback(error);
    }
}
/**
 * Middleware to check if the user is authenticated
 * If not, redirects to login page or returns 401
 **/
const isAuthenticated = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            // For API requests, return 401 Unauthorized
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    redirect: '/login'
                });
            }
            // For regular requests, redirect to login page
            return res.redirect('/login');
        }
    });
};
exports.isAuthenticated = isAuthenticated;
/**
 * Middleware to check if the authenticated user has admin privileges
 **/
const isAdmin = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            // Reuse isAuthenticated logic for unauthenticated users
            return (0, exports.isAuthenticated)(req, res, next);
        }
        const authReq = req;
        // Check for admin role
        if (authReq.user?.role === 'admin') {
            return next();
        }
        // Not an admin - forbidden
        const forbiddenError = new errors_1.ForbiddenError('Admin privileges required');
        // For API requests, return 403 Forbidden
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({
                success: false,
                message: forbiddenError.message,
                redirect: '/dashboard'
            });
        }
        // For regular requests, redirect with flash message
        if (req.flash) {
            req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
        }
        return res.redirect('/dashboard');
    });
};
exports.isAdmin = isAdmin;
/**
 * Middleware to check if the authenticated user has manager privileges (manager or admin)
 **/
const isManager = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            // Reuse isAuthenticated logic for unauthenticated users
            return (0, exports.isAuthenticated)(req, res, next);
        }
        const authReq = req;
        // Check for manager or admin role
        if (authReq.user?.role === 'admin' || authReq.user?.role === 'manager') {
            return next();
        }
        // Not a manager - forbidden
        const forbiddenError = new errors_1.ForbiddenError('Manager privileges required');
        // For API requests, return 403 Forbidden
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({
                success: false,
                message: forbiddenError.message,
                redirect: '/dashboard'
            });
        }
        // For regular requests, redirect with flash message
        if (req.flash) {
            req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
        }
        return res.redirect('/dashboard');
    });
};
exports.isManager = isManager;
/**
 * Middleware to check if the authenticated user has employee privileges (or higher)
 **/
const isEmployee = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            // Reuse isAuthenticated logic for unauthenticated users
            return (0, exports.isAuthenticated)(req, res, next);
        }
        const authReq = req;
        // Check for employee, manager or admin role
        if (['admin', 'manager', 'employee', 'mitarbeiter'].includes(authReq.user?.role || '')) {
            return next();
        }
        // Not an employee - forbidden
        const forbiddenError = new errors_1.ForbiddenError('Employee privileges required');
        // For API requests, return 403 Forbidden
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({
                success: false,
                message: forbiddenError.message,
                redirect: '/dashboard'
            });
        }
        // For regular requests, redirect with flash message
        if (req.flash) {
            req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
        }
        return res.redirect('/dashboard');
    });
};
exports.isEmployee = isEmployee;
/**
 * Middleware to check if the user is not authenticated
 * Used for login/register pages to prevent authenticated users from accessing them
 **/
const isNotAuthenticated = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            // If authentication fails, user is not authenticated
            return next();
        }
        // User is authenticated, redirect to dashboard
        return res.redirect('/dashboard');
    });
};
exports.isNotAuthenticated = isNotAuthenticated;
//# sourceMappingURL=auth.middleware.js.map