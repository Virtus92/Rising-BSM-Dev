/**
 * Profile Routes
 * Handles all user profile related routes
 */
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configure file upload for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/profile'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.session.user.id}-${uniqueSuffix}${ext}`);
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
 * @desc    Display user profile
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await profileController.getUserProfile(req, res, next);
    
    res.render('dashboard/profile', {
      title: 'Mein Profil - Rising BSM',
      user: req.session.user,
      userProfile: data.user,
      settings: data.settings,
      activity: data.activity,
      currentPath: '/dashboard/profile',
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/profile/update
 * @desc    Update user profile
 */
router.post('/update', async (req, res, next) => {
  try {
    const result = await profileController.updateProfile(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Update session user data
    req.session.user = { ...req.session.user, ...result.user };
    
    // Set flash message and redirect
    req.flash('success', result.message);
    res.redirect('/dashboard/profile');
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/profile');
    }
    next(error);
  }
});

/**
 * @route   POST /dashboard/profile/password
 * @desc    Update user password
 */
router.post('/password', async (req, res, next) => {
  try {
    const result = await profileController.updatePassword(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Set flash message and redirect
    req.flash('success', result.message);
    res.redirect('/dashboard/profile');
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/profile');
    }
    next(error);
  }
});

/**
 * @route   POST /dashboard/profile/picture
 * @desc    Update profile picture
 */
router.post('/picture', upload.single('profile_picture'), async (req, res, next) => {
  try {
    // Add file info to request
    if (!req.file) {
      req.flash('error', 'No image selected');
      return res.redirect('/dashboard/profile');
    }
    
    const result = await profileController.updateProfilePicture(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Set flash message and redirect
    req.flash('success', result.message);
    res.redirect('/dashboard/profile');
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/profile');
    }
    next(error);
  }
});

/**
 * @route   POST /dashboard/profile/notifications
 * @desc    Update notification settings
 */
router.post('/notifications', async (req, res, next) => {
  try {
    const result = await profileController.updateNotificationSettings(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Set flash message and redirect
    req.flash('success', result.message);
    res.redirect('/dashboard/profile');
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/profile');
    }
    next(error);
  }
});

module.exports = router;