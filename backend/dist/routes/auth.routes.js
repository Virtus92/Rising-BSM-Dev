"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authController = __importStar(require("../controllers/auth.controller"));
const router = (0, express_1.Router)();
/**
 * @route   GET /login
 * @desc    Render login page
 */
router.get('/login', auth_middleware_1.isNotAuthenticated, (req, res) => {
    res.render('login', {
        title: 'Login - Rising BSM',
        error: req.flash('error')[0] || null,
        success: req.flash('success')[0] || null,
        csrfToken: req.csrfToken()
    });
});
/**
 * @route   POST /login
 * @desc    Process login
 */
router.post('/login', auth_middleware_1.isNotAuthenticated, authController.login);
/**
 * @route   GET /logout
 * @desc    Process logout
 */
router.post('/logout', authController.logout);
/**
 * @route   GET /forgot-password
 * @desc    Render forgot password page
 */
router.get('/forgot-password', auth_middleware_1.isNotAuthenticated, (req, res) => {
    res.render('forgot-password', {
        title: 'Passwort vergessen - Rising BSM',
        error: req.flash('error')[0] || null,
        success: req.flash('success')[0] || null,
        csrfToken: req.csrfToken()
    });
});
/**
 * @route   POST /forgot-password
 * @desc    Process forgot password request
 */
router.post('/forgot-password', auth_middleware_1.isNotAuthenticated, authController.forgotPassword);
/**
 * @route   GET /reset-password/:token
 * @desc    Render reset password page
 */
router.get('/reset-password/:token', auth_middleware_1.isNotAuthenticated, authController.validateResetToken);
/**
 * @route   POST /reset-password/:token
 * @desc    Process reset password
 */
router.post('/reset-password/:token', auth_middleware_1.isNotAuthenticated, authController.resetPassword);
/**
 * @route   POST /refresh-token
 * @desc    Refresh access token
 */
router.post('/refresh-token', authController.refreshToken);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map