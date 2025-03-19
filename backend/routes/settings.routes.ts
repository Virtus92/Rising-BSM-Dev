import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/settings
 * @desc    Display user settings
 */
router.get('/', settingsController.getUserSettings);

/**
 * @route   PUT /dashboard/settings
 * @desc    Update user settings
 */
router.put('/', settingsController.updateUserSettings);

/**
 * @route   GET /dashboard/settings/system
 * @desc    Display system settings (admin only)
 */
router.get('/system', isAdmin, settingsController.getSystemSettings);

/**
 * @route   PUT /dashboard/settings/system
 * @desc    Update system settings (admin only)
 */
router.put('/system', isAdmin, settingsController.updateSystemSettings);

/**
 * @route   GET /dashboard/settings/backup
 * @desc    Display backup settings (admin only)
 */
router.get('/backup', isAdmin, settingsController.getBackupSettings);

/**
 * @route   PUT /dashboard/settings/backup
 * @desc    Update backup settings (admin only)
 */
router.put('/backup', isAdmin, settingsController.updateBackupSettings);

/**
 * @route   POST /dashboard/settings/backup/trigger
 * @desc    Trigger manual backup (admin only)
 */
router.post('/backup/trigger', isAdmin, settingsController.triggerManualBackup);

export default router;
