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
const customerController = __importStar(require("../controllers/customer.controller"));
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.isAuthenticated);
/**
 * @route   GET /dashboard/kunden
 * @desc    Get all customers
 */
router.get('/', customerController.getAllCustomers);
/**
 * @route   GET /dashboard/kunden/:id
 * @desc    Get customer by ID
 */
router.get('/:id', customerController.getCustomerById);
/**
 * @route   POST /dashboard/kunden
 * @desc    Create a new customer
 */
router.post('/', validation_middleware_1.validateCustomer, customerController.createCustomer);
/**
 * @route   PUT /dashboard/kunden/:id
 * @desc    Update an existing customer
 */
router.put('/:id', validation_middleware_1.validateCustomer, customerController.updateCustomer);
/**
 * @route   POST /dashboard/kunden/status
 * @desc    Update customer status
 */
router.post('/status', customerController.updateCustomerStatus);
/**
 * @route   POST /dashboard/kunden/:id/notes
 * @desc    Add a note to a customer
 */
router.post('/:id/notes', customerController.addCustomerNote);
/**
 * @route   DELETE /dashboard/kunden
 * @desc    Delete a customer (mark as deleted)
 */
router.delete('/', customerController.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map