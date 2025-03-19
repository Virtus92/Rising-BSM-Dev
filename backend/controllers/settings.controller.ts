// controllers/settings.controller.ts
import { Request, Response } from 'express';
import path from 'path';
import prisma from '../utils/prisma.utils';
import { ForbiddenError, BadRequestError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';

interface BackupSettings {
  automatisch: boolean;
  intervall: string;
  zeit: string;
  aufbewahrung: number;
  letzte_ausfuehrung: Date | null;
  status: string;
}

interface SystemSettings {
  [category: string]: Array<{
    key: string;
    value: string;
    description: string;
    type: string;
  }>;
}

/**
 * Get user settings
 */
export const getUserSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  
  // Get user settings from database
  const settings = await prisma.userSettings.findUnique({
    where: { userId }
  });
  
  // Default settings if none exist
  const userSettings = settings || {
    language: 'de',
    darkMode: false,
    emailNotifications: true,
    pushNotifications: false,
    notificationInterval: 'sofort'
  };
  
  res.status(200).json({
    settings: {
      sprache: userSettings.language || 'de',
      dark_mode: userSettings.darkMode || false,
      benachrichtigungen_email: userSettings.emailNotifications || true,
      benachrichtigungen_push: userSettings.pushNotifications || false,
      benachrichtigungen_intervall: userSettings.notificationInterval || 'sofort'
    }
  });
});

/**
 * Update user settings
 */
export const updateUserSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  const { 
    sprache, 
    dark_mode, 
    benachrichtigungen_email, 
    benachrichtigungen_push, 
    benachrichtigungen_intervall
  } = req.body;
  
  // Check if settings exist for this user
  const existingSettings = await prisma.userSettings.findUnique({
    where: { userId }
  });
  
  if (!existingSettings) {
    // Create new settings
    await prisma.userSettings.create({
      data: {
        userId,
        language: sprache || 'de',
        darkMode: dark_mode === 'on' || dark_mode === true,
        emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
        pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
        notificationInterval: benachrichtigungen_intervall || 'sofort'
      }
    });
  } else {
    // Update existing settings
    await prisma.userSettings.update({
      where: { userId },
      data: {
        language: sprache || 'de',
        darkMode: dark_mode === 'on' || dark_mode === true,
        emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
        pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
        notificationInterval: benachrichtigungen_intervall || 'sofort',
        updatedAt: new Date()
      }
    });
  }
  
  // Log activity
  await prisma.userActivity.create({
    data: {
      userId,
      activity: 'settings_updated',
      ipAddress: req.ip || '0.0.0.0'
    }
  });
  
  res.status(200).json({
    success: true,
    message: 'Settings updated successfully'
  });
});

/**
 * Get system settings (admin only)
 */
export const getSystemSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to system settings');
  }
  
  // For now, let's use a simpler approach with a table in the database
  // Ideally this would be more sophisticated with proper schema validation
  type SystemSetting = {
    kategorie: string;
    einstellung: string;
    wert: string;
    beschreibung: string;
    typ: string;
  };
  
  // Get system settings from database using raw query for more flexibility
  const settingsQuery = await prisma.$queryRaw<SystemSetting[]>`
    SELECT * FROM system_einstellungen
    ORDER BY kategorie, einstellung
  `;
  
  // Group settings by category with explicit typing
  const settingsByCategory: SystemSettings = {};
  settingsQuery.forEach((setting: SystemSetting) => {
    if (!settingsByCategory[setting.kategorie]) {
      settingsByCategory[setting.kategorie] = [];
    }
    
    settingsByCategory[setting.kategorie].push({
      key: setting.einstellung,
      value: setting.wert,
      description: setting.beschreibung,
      type: setting.typ
    });
  });
  
  res.status(200).json({
    settings: settingsByCategory
  });
});

/**
 * Update system settings (admin only)
 */
export const updateSystemSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to system settings');
  }
  
  const { settings } = req.body;
  
  // Validate settings
  if (!settings || typeof settings !== 'object') {
    throw new BadRequestError('Invalid settings data');
  }
  
  // Update each setting in the database
  const updatePromises = Object.entries(settings).map(([key, value]) => {
    return prisma.$executeRaw`
      UPDATE system_einstellungen 
      SET wert = ${value}, updated_at = CURRENT_TIMESTAMP 
      WHERE einstellung = ${key}
    `;
  });
  
  await Promise.all(updatePromises);
  
  // Log activity
  await prisma.$executeRaw`
    INSERT INTO system_log (
      aktion, benutzer_id, benutzer_name, details, ip_adresse
    ) VALUES (
      'system_settings_updated',
      ${req.user.id},
      ${req.user.name},
      'System settings updated',
      ${req.ip || '0.0.0.0'}
    )
  `;
  
  res.status(200).json({
    success: true,
    message: 'System settings updated successfully'
  });
});

/**
 * Get backup settings (admin only)
 */
export const getBackupSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to backup settings');
  }
  
  // Get backup settings from database
  const backupSettingsQuery = await prisma.$queryRaw<any[]>`
    SELECT * FROM backup_einstellungen
    WHERE aktiv = true
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  // Default backup settings if none exist
  const backupSettings: BackupSettings = backupSettingsQuery.length > 0 ? backupSettingsQuery[0] : {
    automatisch: true,
    intervall: 'taeglich',
    zeit: '02:00',
    aufbewahrung: 7,
    letzte_ausfuehrung: null,
    status: 'nicht_ausgefuehrt'
  };
  
  // Get recent backups with explicit typing
  interface BackupRecord {
    id: number;
    dateiname: string;
    groesse: string;
    erstellt_am: Date;
    status: string;
  }
  
  const backupsQuery = await prisma.$queryRaw<BackupRecord[]>`
    SELECT * FROM backup_log
    ORDER BY erstellt_am DESC
    LIMIT 10
  `;
  
  res.status(200).json({
    settings: {
      automatisch: backupSettings.automatisch,
      intervall: backupSettings.intervall,
      zeit: backupSettings.zeit,
      aufbewahrung: backupSettings.aufbewahrung,
      letzte_ausfuehrung: backupSettings.letzte_ausfuehrung,
      status: backupSettings.status
    },
    backups: backupsQuery.map((backup: BackupRecord) => ({
      id: backup.id,
      dateiname: backup.dateiname,
      groesse: backup.groesse,
      datum: backup.erstellt_am,
      status: backup.status
    }))
  });
});

/**
 * Update backup settings (admin only)
 */
export const updateBackupSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to backup settings');
  }
  
  const { 
    automatisch, 
    intervall, 
    zeit, 
    aufbewahrung 
  } = req.body;
  
  // Validation
  if (!intervall || !zeit) {
    throw new BadRequestError('Backup interval and time are required');
  }
  
  // Insert new backup settings
  await prisma.$executeRaw`
    INSERT INTO backup_einstellungen (
      automatisch, 
      intervall, 
      zeit, 
      aufbewahrung, 
      aktiv
    ) VALUES (
      ${automatisch === 'on' || automatisch === true},
      ${intervall},
      ${zeit},
      ${parseInt(aufbewahrung || '7')},
      true
    )
  `;
  
  // Deactivate previous settings
  await prisma.$executeRaw`
    UPDATE backup_einstellungen 
    SET aktiv = false 
    WHERE created_at < CURRENT_TIMESTAMP
    AND id NOT IN (
      SELECT id FROM backup_einstellungen 
      ORDER BY created_at DESC 
      LIMIT 1
    )
  `;
  
  // Log activity
  await prisma.$executeRaw`
    INSERT INTO system_log (
      aktion, benutzer_id, benutzer_name, details, ip_adresse
    ) VALUES (
      'backup_settings_updated',
      ${req.user.id},
      ${req.user.name},
      'Backup settings updated',
      ${req.ip || '0.0.0.0'}
    )
  `;
  
  res.status(200).json({
    success: true,
    message: 'Backup settings updated successfully'
  });
});

/**
 * Trigger manual backup (admin only)
 */
export const triggerManualBackup = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to backup functionality');
  }
  
  // Start backup process (this would typically be handled by a separate backup service)
  // For this example, we'll just record the request
  
  // Generate a filename based on current timestamp
  const filename = `manual_backup_${new Date().toISOString().replace(/[:.]/g, '_')}.sql`;
  
  // Log backup request
  await prisma.$executeRaw`
    INSERT INTO backup_log (
      dateiname, 
      typ, 
      benutzer_id, 
      status,
      details
    ) VALUES (
      ${filename},
      'manuell',
      ${req.user.id},
      'ausstehend',
      'Manual backup triggered'
    )
  `;
  
  // Log activity
  await prisma.$executeRaw`
    INSERT INTO system_log (
      aktion, benutzer_id, benutzer_name, details, ip_adresse
    ) VALUES (
      'manual_backup',
      ${req.user.id},
      ${req.user.name},
      'Manual backup triggered',
      ${req.ip || '0.0.0.0'}
    )
  `;
  
  res.status(200).json({
    success: true,
    message: 'Backup process initiated',
    status: 'pending'
  });
});