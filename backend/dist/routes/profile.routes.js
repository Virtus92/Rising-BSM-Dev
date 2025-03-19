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
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const profileController = __importStar(require("../controllers/profile.controller"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Since this file doesn't use :id parameters in routes, we can remove this interface
// or keep it for potential future use, but with proper typing
const router = (0, express_1.Router)();
// Configure file upload for profile pictures
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../public/uploads/profile'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `profile-${req.session?.user?.id || 'unknown'}-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});
// Apply authentication middleware to all routes
router.use(auth_middleware_1.isAuthenticated);
/**
 * @route   GET /dashboard/profile
 * @desc    Get user profile data
 */
router.get('/', profileController.getUserProfile);
/**
 * @route   PUT /dashboard/profile
 * @desc    Update user profile
 */
router.put('/', profileController.updateProfile);
/**
 * @route   POST /dashboard/profile/password
 * @desc    Update user password
 */
router.post('/password', profileController.updatePassword);
/**
 * @route   POST /dashboard/profile/picture
 * @desc    Update profile picture
 */
router.post('/picture', upload.single('profile_picture'), profileController.updateProfilePicture);
/**
 * @route   POST /dashboard/profile/notifications
 * @desc    Update notification settings
 */
router.post('/notifications', profileController.updateNotificationSettings);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map