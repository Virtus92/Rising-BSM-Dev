"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotAuthenticated = exports.isEmployee = exports.isManager = exports.isAdmin = exports.isAuthenticated = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const prisma_utils_1 = require("../utils/prisma.utils");
const config_1 = __importDefault(require("../config"));
const AUTH_MODE = config_1.default.AUTH_MODE || 'dual';
const authenticate = async (req, res, next) => {
    try {
        if (AUTH_MODE === 'jwt' || AUTH_MODE === 'dual') {
            const authHeader = req.headers.authorization;
            const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
            if (token) {
                try {
                    const payload = (0, jwt_1.verifyToken)(token);
                    const user = await prisma_utils_1.prisma.user.findUnique({
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
                    if (AUTH_MODE !== 'dual') {
                        throw error;
                    }
                }
            }
        }
        if (AUTH_MODE === 'session' || AUTH_MODE === 'dual') {
            if (req.session && req.session.user) {
                req.user = {
                    id: req.session.user.id,
                    name: req.session.user.name,
                    email: req.session.user.email,
                    role: req.session.user.role
                };
                return next();
            }
        }
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
const isAuthenticated = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    redirect: '/login'
                });
            }
            return res.redirect('/login');
        }
    });
};
exports.isAuthenticated = isAuthenticated;
const isAdmin = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            return (0, exports.isAuthenticated)(req, res, next);
        }
        const authReq = req;
        if (authReq.user?.role === 'admin') {
            return next();
        }
        const forbiddenError = new errors_1.ForbiddenError('Admin privileges required');
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({
                success: false,
                message: forbiddenError.message,
                redirect: '/dashboard'
            });
        }
        if (req.flash) {
            req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
        }
        return res.redirect('/dashboard');
    });
};
exports.isAdmin = isAdmin;
const isManager = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            return (0, exports.isAuthenticated)(req, res, next);
        }
        const authReq = req;
        if (authReq.user?.role === 'admin' || authReq.user?.role === 'manager') {
            return next();
        }
        const forbiddenError = new errors_1.ForbiddenError('Manager privileges required');
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({
                success: false,
                message: forbiddenError.message,
                redirect: '/dashboard'
            });
        }
        if (req.flash) {
            req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
        }
        return res.redirect('/dashboard');
    });
};
exports.isManager = isManager;
const isEmployee = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            return (0, exports.isAuthenticated)(req, res, next);
        }
        const authReq = req;
        if (['admin', 'manager', 'employee', 'mitarbeiter'].includes(authReq.user?.role || '')) {
            return next();
        }
        const forbiddenError = new errors_1.ForbiddenError('Employee privileges required');
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({
                success: false,
                message: forbiddenError.message,
                redirect: '/dashboard'
            });
        }
        if (req.flash) {
            req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
        }
        return res.redirect('/dashboard');
    });
};
exports.isEmployee = isEmployee;
const isNotAuthenticated = (req, res, next) => {
    handleAuthResult(req, res, next, (err) => {
        if (err) {
            return next();
        }
        return res.redirect('/dashboard');
    });
};
exports.isNotAuthenticated = isNotAuthenticated;
//# sourceMappingURL=auth.middleware.js.map