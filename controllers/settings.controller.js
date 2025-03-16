/**
 * Settings Controller
 * Handles all application settings-related business logic
 */
const { pool } = require('../services/db.service');
const fs = require('fs');
const path = require('path');
const { validateInput } = require('../utils/validators');

/**
 * Get user settings
 * @param {number} userId - ID des Benutzers
 */
exports.getUserSettings = async (userId) => {
  const settingsQuery = await pool.query(
    'SELECT * FROM benutzer_einstellungen WHERE benutzer_id = $1',
    [userId]
  );

  // Default settings if none exist
  return settingsQuery.rows[0] || {
    sprache: 'de',
    dark_mode: false,
    benachrichtigungen_email: true,
    benachrichtigungen_intervall: 'sofort'
  };
};

/**
 * Update user settings
 * @param {number} userId - ID des Benutzers
 * @param {Object} settings - Neue Einstellungen
 */
exports.updateUserSettings = async (userId, settings) => {
  const schema = {
    sprache: { type: 'text', required: true, enum: ['de', 'en'] },
    dark_mode: { type: 'boolean' },
    benachrichtigungen_email: { type: 'boolean' },
    benachrichtigungen_intervall: { type: 'text', enum: ['sofort', 'taeglich', 'woechentlich'] }
  };

  const validation = validateInput(settings, schema);
  if (!validation.isValid) {
    throw new Error('Ungültige Einstellungen: ' + Object.values(validation.errors).join(', '));
  }

  const { sprache, dark_mode, benachrichtigungen_email, benachrichtigungen_intervall } = validation.data;

  // Prüfen ob Einstellungen existieren
  const existingSettings = await pool.query(
    'SELECT benutzer_id FROM benutzer_einstellungen WHERE benutzer_id = $1',
    [userId]
  );

  if (existingSettings.rows.length > 0) {
    await pool.query(
      `UPDATE benutzer_einstellungen 
       SET sprache = $1, dark_mode = $2, benachrichtigungen_email = $3, 
           benachrichtigungen_intervall = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE benutzer_id = $5`,
      [sprache, dark_mode, benachrichtigungen_email, benachrichtigungen_intervall, userId]
    );
  } else {
    await pool.query(
      `INSERT INTO benutzer_einstellungen 
       (benutzer_id, sprache, dark_mode, benachrichtigungen_email, benachrichtigungen_intervall) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, sprache, dark_mode, benachrichtigungen_email, benachrichtigungen_intervall]
    );
  }
};

/**
 * Get system settings
 */
exports.getSystemSettings = async () => {
  const settingsQuery = await pool.query(
    'SELECT * FROM system_einstellungen ORDER BY kategorie, einstellung'
  );

  // Group settings by category
  const settingsByCategory = {};
  settingsQuery.rows.forEach(setting => {
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

  return settingsByCategory;
};

/**
 * Update system settings
 * @param {Object} settings - Neue Systemeinstellungen
 */
exports.updateSystemSettings = async (settings) => {
  const schema = {
    maintenance_mode: { type: 'boolean' },
    backup_interval: { type: 'text', enum: ['taeglich', 'woechentlich', 'monatlich'] },
    log_level: { type: 'text', enum: ['error', 'warn', 'info', 'debug'] }
  };

  const validation = validateInput(settings, schema);
  if (!validation.isValid) {
    throw new Error('Ungültige Systemeinstellungen: ' + Object.values(validation.errors).join(', '));
  }

  // Update each setting
  for (const [key, value] of Object.entries(validation.data)) {
    await pool.query(
      'UPDATE system_einstellungen SET wert = $1, updated_at = CURRENT_TIMESTAMP WHERE einstellung = $2',
      [value, key]
    );
  }
};

/**
 * Get backup settings
 */
exports.getBackupSettings = async () => {
  const settingsQuery = await pool.query(
    'SELECT * FROM backup_einstellungen WHERE aktiv = true ORDER BY created_at DESC LIMIT 1'
  );

  const backupsQuery = await pool.query(
    'SELECT * FROM backup_log ORDER BY erstellt_am DESC LIMIT 10'
  );

  // Default backup settings if none exist
  const settings = settingsQuery.rows[0] || {
    automatisch: true,
    intervall: 'taeglich',
    zeit: '02:00',
    aufbewahrung: 7,
    letzte_ausfuehrung: null,
    status: 'nicht_ausgefuehrt'
  };

  return {
    settings,
    backups: backupsQuery.rows.map(backup => ({
      id: backup.id,
      dateiname: backup.dateiname,
      groesse: backup.groesse,
      datum: backup.erstellt_am,
      status: backup.status
    }))
  };
};

/**
 * Update backup settings
 * @param {Object} settings - Neue Backup-Einstellungen
 */
exports.updateBackupSettings = async (settings) => {
  const schema = {
    automatisch: { type: 'boolean' },
    intervall: { type: 'text', required: true, enum: ['taeglich', 'woechentlich', 'monatlich'] },
    zeit: { type: 'text', required: true, pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
    aufbewahrung: { type: 'numeric', min: 1, max: 365 }
  };

  const validation = validateInput(settings, schema);
  if (!validation.isValid) {
    throw new Error('Ungültige Backup-Einstellungen: ' + Object.values(validation.errors).join(', '));
  }

  const { automatisch, intervall, zeit, aufbewahrung } = validation.data;

  // Deactivate old settings
  await pool.query(
    'UPDATE backup_einstellungen SET aktiv = false WHERE aktiv = true'
  );

  // Insert new settings
  await pool.query(
    `INSERT INTO backup_einstellungen 
     (automatisch, intervall, zeit, aufbewahrung, aktiv) 
     VALUES ($1, $2, $3, $4, true)`,
    [automatisch, intervall, zeit, aufbewahrung]
  );
};

/**
 * Trigger manual backup
 */
exports.triggerManualBackup = async () => {
  const backupFileName = `manual_backup_${new Date().toISOString().replace(/[:.]/g, '_')}.sql`;
  
  // Create backup log entry
  const result = await pool.query(
    `INSERT INTO backup_log (dateiname, typ, status, details) 
     VALUES ($1, 'manuell', 'ausstehend', 'Manuelles Backup gestartet') 
     RETURNING id`,
    [backupFileName]
  );

  // Start backup process asynchronously
  // This would typically be handled by a separate backup service
  // For now, we just return the backup ID
  return {
    backupId: result.rows[0].id,
    fileName: backupFileName,
    status: 'ausstehend'
  };
};