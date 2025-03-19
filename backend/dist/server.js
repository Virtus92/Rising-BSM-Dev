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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const csurf_1 = __importDefault(require("@dr.pogodin/csurf"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
const config_1 = __importDefault(require("./config"));
const prisma_utils_1 = __importDefault(require("./utils/prisma.utils"));
// Create Express app
const app = (0, express_1.default)();
const port = config_1.default.PORT;
// Import middleware
const errorMiddleware = __importStar(require("./middleware/error.middleware"));
// Middleware to check if setup is completed
const setupCompletedMiddleware = async (req, res, next) => {
    try {
        // Skip for setup and public routes
        if (req.path === '/setup' || req.path === '/login' || req.path === '/' || req.path.startsWith('/public')) {
            return next();
        }
        // Check if setup is complete using Prisma
        const setupSetting = await prisma_utils_1.default.$queryRaw `
      SELECT * FROM system_settings WHERE key = 'setup_complete'
    `;
        // If setup isn't complete, redirect to setup
        if (!setupSetting || (Array.isArray(setupSetting) && setupSetting.length === 0)) {
            return res.redirect('/setup');
        }
        next();
    }
    catch (error) {
        console.error('Setup check middleware error:', error);
        next();
    }
};
// Import routes
const api_routes_1 = __importDefault(require("./routes/api.routes"));
const index_1 = __importDefault(require("./routes/index"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const request_routes_1 = __importDefault(require("./routes/request.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const setup_routes_1 = __importDefault(require("./routes/setup.routes"));
const contact_controller_1 = require("./controllers/contact.controller");
// Apply middleware
// CORS
app.use((0, cors_1.default)({
    origin: config_1.default.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://code.jquery.com",
                "https://cdn.datatables.net",
                "'unsafe-inline'",
                "'unsafe-hashes'"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://cdn.datatables.net"
            ]
        }
    }
}));
// Parse request body
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Configure PostgreSQL session store
const pgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
const pool = new pg_1.Pool({
    user: config_1.default.DB_USER,
    host: config_1.default.DB_HOST,
    database: config_1.default.DB_NAME,
    password: config_1.default.DB_PASSWORD,
    port: config_1.default.DB_PORT,
    ssl: config_1.default.DB_SSL ? { rejectUnauthorized: false } : false
});
// Configure session
app.use((0, express_session_1.default)({
    store: new pgSession({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'rising-bsm-super-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config_1.default.IS_PRODUCTION,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: config_1.default.SESSION_MAX_AGE // 1 day
    }
}));
// Flash messages
app.use((0, connect_flash_1.default)());
// Check if setup is completed
app.use(setupCompletedMiddleware);
// Rate limiters
const contactLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per IP
    message: { success: false, error: 'Too many requests. Please try again later.' }
});
// Make user information available to views
app.use((req, res, next) => {
    res.locals.user = req.session?.user || null;
    next();
});
// Apply API routes
app.use('/api', api_routes_1.default);
// Apply web routes
app.use('/', index_1.default);
app.use('/', auth_routes_1.default);
app.use('/setup', setup_routes_1.default);
app.use('/dashboard', dashboard_routes_1.default);
app.use('/dashboard/kunden', customer_routes_1.default);
app.use('/dashboard/projekte', project_routes_1.default);
app.use('/dashboard/termine', appointment_routes_1.default);
app.use('/dashboard/dienste', service_routes_1.default);
app.use('/dashboard/requests', request_routes_1.default);
app.use('/dashboard/profile', profile_routes_1.default);
app.use('/dashboard/settings', settings_routes_1.default);
// Contact form route with rate limiting
app.post('/contact', contactLimiter, contact_controller_1.submitContact);
// CSRF protection
app.use((0, csurf_1.default)());
// Error handling middleware
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.errorHandler);
// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Environment: ${config_1.default.NODE_ENV}`);
});
// Process error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give the server time to log the error before shutting down
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
//# sourceMappingURL=server.js.map