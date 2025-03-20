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
const express_rate_limit_1 = require("express-rate-limit");
const contactController = __importStar(require("../controllers/contact.controller"));
const router = (0, express_1.Router)();
const contactLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { success: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' }
});
router.get('/', (req, res) => {
    res.render('index.ejs', {
        title: 'Rising BSM – Ihre Allround-Experten',
        user: req.session?.user || null
    });
});
router.get('/impressum', (req, res) => {
    res.render('impressum.ejs', {
        title: 'Rising BSM – Impressum',
        user: req.session?.user || null
    });
});
router.get('/datenschutz', (req, res) => {
    res.render('datenschutz.ejs', {
        title: 'Rising BSM – Datenschutz',
        user: req.session?.user || null
    });
});
router.get('/agb', (req, res) => {
    res.render('agb.ejs', {
        title: 'Rising BSM – AGB',
        user: req.session?.user || null
    });
});
router.post('/contact', contactLimiter, contactController.submitContact);
exports.default = router;
//# sourceMappingURL=index.js.map