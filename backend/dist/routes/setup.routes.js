"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_utils_1 = require("../utils/prisma.utils");
const router = (0, express_1.Router)();
const setupRequired = async (req, res, next) => {
    try {
        const userCount = await prisma_utils_1.prisma.user.count();
        if (userCount > 0) {
            req.flash('info', 'Setup wurde bereits durchgeführt.');
            return res.redirect('/login');
        }
        next();
    }
    catch (error) {
        console.error('Setup check error:', error);
        res.status(500).render('error', {
            message: 'Fehler bei der Überprüfung des Systemstatus'
        });
    }
};
router.get('/', setupRequired, async (req, res) => {
    try {
        res.render('setup', {
            title: 'Ersteinrichtung - Rising BSM',
            error: null,
            name: '',
            email: '',
            company_name: '',
            company_email: '',
            csrfToken: req.csrfToken?.() || ''
        });
    }
    catch (error) {
        console.error('Setup error:', error);
        res.status(500).render('error', {
            message: 'Fehler bei der Systeminitialisierung'
        });
    }
});
const setupValidation = [
    (0, express_validator_1.body)('name').trim().isLength({ min: 3 }).withMessage('Name muss mindestens 3 Zeichen lang sein'),
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein'),
    (0, express_validator_1.body)('confirm_password').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwörter stimmen nicht überein');
        }
        return true;
    }),
    (0, express_validator_1.body)('company_name').trim().isLength({ min: 2 }).withMessage('Unternehmensname erforderlich'),
    (0, express_validator_1.body)('company_email').trim().isEmail().withMessage('Gültige Unternehmens-E-Mail erforderlich')
];
router.post('/', setupRequired, setupValidation, async (req, res) => {
    const { name, email, password, company_name, company_email } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.render('setup', {
            error: errors.array()[0].msg,
            name,
            email,
            company_name,
            company_email,
            csrfToken: req.csrfToken?.() || ''
        });
    }
    try {
        let createdUser = null;
        await prisma_utils_1.prisma.$transaction(async (tx) => {
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            createdUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'admin',
                    status: 'active'
                }
            });
            await tx.systemSetting.createMany({
                data: [
                    { key: 'company_name', value: company_name },
                    { key: 'company_email', value: company_email },
                    { key: 'setup_complete', value: 'true' },
                    { key: 'setup_date', value: new Date().toISOString() }
                ]
            });
        });
        if (createdUser) {
            const token = jsonwebtoken_1.default.sign({ id: createdUser.id, email: createdUser.email, role: createdUser.role }, process.env.JWT_SECRET || 'defaultsecret', { expiresIn: '24h' });
        }
        req.flash('success', 'Setup erfolgreich abgeschlossen. Bitte melden Sie sich an.');
        res.redirect('/login');
    }
    catch (error) {
        console.error('Setup error:', error);
        res.render('setup', {
            error: 'Ein Fehler ist aufgetreten: ' + (error.message || 'Unbekannter Fehler'),
            name,
            email,
            company_name,
            company_email,
            csrfToken: req.csrfToken?.() || ''
        });
    }
});
exports.default = router;
//# sourceMappingURL=setup.routes.js.map