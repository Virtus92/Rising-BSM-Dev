"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerManualBackup = exports.updateBackupSettings = exports.getBackupSettings = exports.updateSystemSettings = exports.getSystemSettings = exports.updateUserSettings = exports.getUserSettings = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
const errors_1 = require("../utils/errors");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getUserSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const settings = await prisma_utils_1.prisma.userSettings.findUnique({
        where: { userId }
    });
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
exports.updateUserSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const { sprache, dark_mode, benachrichtigungen_email, benachrichtigungen_push, benachrichtigungen_intervall } = req.body;
    const existingSettings = await prisma_utils_1.prisma.userSettings.findUnique({
        where: { userId }
    });
    if (!existingSettings) {
        await prisma_utils_1.prisma.userSettings.create({
            data: {
                userId,
                language: sprache || 'de',
                darkMode: dark_mode === 'on' || dark_mode === true,
                emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
                pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
                notificationInterval: benachrichtigungen_intervall || 'sofort'
            }
        });
    }
    else {
        await prisma_utils_1.prisma.userSettings.update({
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
    await prisma_utils_1.prisma.userActivity.create({
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
exports.getSystemSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    if (req.user.role !== 'admin') {
        throw new errors_1.ForbiddenError('Unauthorized access to system settings');
    }
    const settingsQuery = await prisma_utils_1.prisma.$queryRaw `
    SELECT * FROM system_einstellungen
    ORDER BY kategorie, einstellung
  `;
    const settingsByCategory = {};
    settingsQuery.forEach((setting) => {
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
exports.updateSystemSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    if (req.user.role !== 'admin') {
        throw new errors_1.ForbiddenError('Unauthorized access to system settings');
    }
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
        throw new errors_1.BadRequestError('Invalid settings data');
    }
    const updatePromises = Object.entries(settings).map(([key, value]) => {
        return prisma_utils_1.prisma.$executeRaw `
      UPDATE system_einstellungen 
      SET wert = ${value}, updated_at = CURRENT_TIMESTAMP 
      WHERE einstellung = ${key}
    `;
    });
    await Promise.all(updatePromises);
    await prisma_utils_1.prisma.$executeRaw `
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
exports.getBackupSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    if (req.user.role !== 'admin') {
        throw new errors_1.ForbiddenError('Unauthorized access to backup settings');
    }
    const backupSettingsQuery = await prisma_utils_1.prisma.$queryRaw `
    SELECT * FROM backup_einstellungen
    WHERE aktiv = true
    ORDER BY created_at DESC
    LIMIT 1
  `;
    const backupSettings = backupSettingsQuery.length > 0 ? backupSettingsQuery[0] : {
        automatisch: true,
        intervall: 'taeglich',
        zeit: '02:00',
        aufbewahrung: 7,
        letzte_ausfuehrung: null,
        status: 'nicht_ausgefuehrt'
    };
    const backupsQuery = await prisma_utils_1.prisma.$queryRaw `
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
        backups: backupsQuery.map((backup) => ({
            id: backup.id,
            dateiname: backup.dateiname,
            groesse: backup.groesse,
            datum: backup.erstellt_am,
            status: backup.status
        }))
    });
});
exports.updateBackupSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    if (req.user.role !== 'admin') {
        throw new errors_1.ForbiddenError('Unauthorized access to backup settings');
    }
    const { automatisch, intervall, zeit, aufbewahrung } = req.body;
    if (!intervall || !zeit) {
        throw new errors_1.BadRequestError('Backup interval and time are required');
    }
    await prisma_utils_1.prisma.$executeRaw `
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
    await prisma_utils_1.prisma.$executeRaw `
    UPDATE backup_einstellungen 
    SET aktiv = false 
    WHERE created_at < CURRENT_TIMESTAMP
    AND id NOT IN (
      SELECT id FROM backup_einstellungen 
      ORDER BY created_at DESC 
      LIMIT 1
    )
  `;
    await prisma_utils_1.prisma.$executeRaw `
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
exports.triggerManualBackup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    if (req.user.role !== 'admin') {
        throw new errors_1.ForbiddenError('Unauthorized access to backup functionality');
    }
    const filename = `manual_backup_${new Date().toISOString().replace(/[:.]/g, '_')}.sql`;
    await prisma_utils_1.prisma.$executeRaw `
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
    await prisma_utils_1.prisma.$executeRaw `
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
//# sourceMappingURL=settings.controller.js.map