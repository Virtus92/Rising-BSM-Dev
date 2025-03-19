import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import * as profileController from '../controllers/profile.controller';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure file upload for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/profile'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.session?.user?.id || 'unknown'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Apply authentication middleware to all routes
router.use(isAuthenticated);

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

export default router;