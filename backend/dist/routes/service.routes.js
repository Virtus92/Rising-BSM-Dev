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
const serviceController = __importStar(require("../controllers/service.controller"));
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.isAuthenticated);
/**
 * @route   GET /dashboard/dienste
 * @desc    Get all services with optional filtering
 */
router.get('/', serviceController.getAllServices);
/**
 * @route   GET /dashboard/dienste/:id
 * @desc    Get service by ID
 */
router.get('/:id', serviceController.getServiceById);
/**
 * @route   POST /dashboard/dienste
 * @desc    Create a new service
 */
router.post('/', validation_middleware_1.validateService, serviceController.createService);
/**
 * @route   PUT /dashboard/dienste/:id
 * @desc    Update an existing service
 */
router.put('/:id', validation_middleware_1.validateService, serviceController.updateService);
/**
 * @route   POST /dashboard/dienste/:id/status
 * @desc    Toggle service status (active/inactive)
 */
router.post('/:id/status', serviceController.toggleServiceStatus);
/**
 * @route   GET /dashboard/dienste/:id/statistics
 * @desc    Get service statistics
 */
router.get('/:id/statistics', serviceController.getServiceStatistics);
exports.default = router;
//# sourceMappingURL=service.routes.js.map