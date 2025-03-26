/**
 * Settings Routes
 * 
 * Route definitions for system and user settings with validation.
 */
import { Router } from 'express';
import { 
  getUserSettings,
  updateUserSettings,
  getSystemSettings,
  updateSystemSettings,
  getBackupSettings,
  updateBackupSettings,
  triggerManualBackup
} from '../controllers/settings.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import { 
  userSettingsUpdateValidation,
  systemSettingsUpdateValidation,
  backupSettingsUpdateValidation
} from '../dtos/deprecated/settings.dto.js';

// Create router
const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/settings/user
 * @description Get user settings
 * @access Private
 */
router.get('/user', getUserSettings);

/**
 * @route PUT /api/v1/settings/user
 * @description Update user settings
 * @access Private
 */
router.put('/user', validateBody(userSettingsUpdateValidation), updateUserSettings);

/**
 * @route GET /api/v1/settings/system
 * @description Get system settings
 * @access Admin only
 */
router.get('/system', isAdmin, getSystemSettings);

/**
 * @route PUT /api/v1/settings/system
 * @description Update system settings
 * @access Admin only
 */
router.put('/system', isAdmin, validateBody(systemSettingsUpdateValidation), updateSystemSettings);

/**
 * @route GET /api/v1/settings/backup
 * @description Get backup settings
 * @access Admin only
 */
router.get('/backup', isAdmin, getBackupSettings);

/**
 * @route PUT /api/v1/settings/backup
 * @description Update backup settings
 * @access Admin only
 */
router.put('/backup', isAdmin, validateBody(backupSettingsUpdateValidation), updateBackupSettings);

/**
 * @route POST /api/v1/settings/backup/trigger
 * @description Trigger manual backup
 * @access Admin only
 */
router.post('/backup/trigger', isAdmin, triggerManualBackup);

export default router;