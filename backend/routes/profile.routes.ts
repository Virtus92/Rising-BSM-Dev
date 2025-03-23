/**
 * Profile Routes
 * 
 * Route definitions for user profile operations with validation.
 */
import { Router } from 'express';
import multer from 'multer';
import { 
  getUserProfile,
  updateProfile,
  updatePassword,
  updateProfilePicture,
  updateNotificationSettings
} from '../controllers/profile.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  profileUpdateSchema, 
  passwordUpdateSchema, 
  notificationSettingsUpdateSchema 
} from '../types/dtos/profile.dto.js';

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/profile
 * @description Get current user profile
 * @access Private
 */
router.get('/', getUserProfile);

/**
 * @route PUT /api/v1/profile
 * @description Update user profile
 * @access Private
 */
router.put('/', validateBody(profileUpdateSchema), updateProfile);

/**
 * @route PUT /api/v1/profile/password
 * @description Update user password
 * @access Private
 */
router.put('/password', validateBody(passwordUpdateSchema), updatePassword);

/**
 * @route POST /api/v1/profile/picture
 * @description Update profile picture
 * @access Private
 */
router.post('/picture', upload.single('file'), updateProfilePicture);

/**
 * @route PUT /api/v1/profile/notifications
 * @description Update notification settings
 * @access Private
 */
router.put('/notifications', validateBody(notificationSettingsUpdateSchema), updateNotificationSettings);

export default router;