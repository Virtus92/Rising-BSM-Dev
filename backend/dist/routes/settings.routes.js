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
const settingsController = __importStar(require("../controllers/settings.controller"));
// No route parameters are actually used in this file
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.isAuthenticated);
/**
 * @route   GET /dashboard/settings
 * @desc    Display user settings
 */
router.get('/', settingsController.getUserSettings);
/**
 * @route   PUT /dashboard/settings
 * @desc    Update user settings
 */
router.put('/', settingsController.updateUserSettings);
/**
 * @route   GET /dashboard/settings/system
 * @desc    Display system settings (admin only)
 */
router.get('/system', auth_middleware_1.isAdmin, settingsController.getSystemSettings);
/**
 * @route   PUT /dashboard/settings/system
 * @desc    Update system settings (admin only)
 */
router.put('/system', auth_middleware_1.isAdmin, settingsController.updateSystemSettings);
/**
 * @route   GET /dashboard/settings/backup
 * @desc    Display backup settings (admin only)
 */
router.get('/backup', auth_middleware_1.isAdmin, settingsController.getBackupSettings);
/**
 * @route   PUT /dashboard/settings/backup
 * @desc    Update backup settings (admin only)
 */
router.put('/backup', auth_middleware_1.isAdmin, settingsController.updateBackupSettings);
/**
 * @route   POST /dashboard/settings/backup/trigger
 * @desc    Trigger manual backup (admin only)
 */
router.post('/backup/trigger', auth_middleware_1.isAdmin, settingsController.triggerManualBackup);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map