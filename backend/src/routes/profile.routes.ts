import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';

/**
 * Configure file upload for profile pictures
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set upload directory for profile pictures
    cb(null, path.join(process.cwd(), 'public/uploads/profiles'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const userId = (req as any).user.id;
    const fileExt = path.extname(file.originalname);
    const uniqueId = uuid();
    cb(null, `user_${userId}_${uniqueId}${fileExt}`);
  }
});

// Configure upload limits and file types
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only images (jpeg, jpg, png, gif) are allowed'));
  }
});

/**
 * Create profile routes
 * 
 * @param profileController - Profile management controller
 * @param authMiddleware - Authentication middleware
 * @param validationService - Service for validating request data
 * @param errorHandler - Service for handling errors
 * @returns Configured router for profile endpoints
 */
export function createProfileRoutes(
  profileController: ProfileController, 
  authMiddleware: AuthMiddleware,
  validationService: IValidationService,
  errorHandler: IErrorHandler
): Router {
  const router = Router();
  const validationMiddleware = new ValidationMiddleware(validationService, errorHandler);

  // All profile routes require authentication
  router.use(authMiddleware.authenticate());

  // Profile routes
  router.get('/me', 
    profileController.getMyProfile
  );

  router.put('/me', 
    profileController.updateMyProfile
  );

  router.put('/me/password', 
    profileController.changeMyPassword
  );

  // Profile picture routes with file upload
  router.post('/me/picture',
    upload.single('profilePicture'),
    profileController.uploadProfilePicture
  );

  router.delete('/me/picture',
    profileController.deleteProfilePicture
  );

  // Activity log routes
  router.get('/me/activity',
    profileController.getMyActivityLog
  );

  return router;
}