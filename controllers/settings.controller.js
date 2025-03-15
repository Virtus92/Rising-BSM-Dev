/**
 * Settings Controller
 * Handles all application settings-related business logic
 */
const pool = require('../services/db.service');
const fs = require('fs');
const path = require('path');

/**
 * Get user settings
 */
exports.getUserSettings = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    
    // Get user settings from database
    const settingsQuery = await pool.query({
      text: `
        SELECT * FROM benutzer_einstellungen
        WHERE benutzer_id = $1
      `,
      values: [userId]
    });
    
    // Default settings if none exist
    const settings = settingsQuery.rows.length > 0 ? settingsQuery.rows[0] : {
      sprache: 'de',
      dark_mode: false,
      benachrichtigungen_email: true,
      benachrichtigungen_intervall: 'sofort'
    };
    
    return {
      settings: {
        sprache: settings.sprache || 'de',
        dark_mode: settings.dark_mode || false,
        benachrichtigungen_email: settings.benachrichtigungen_email || true,
        benachrichtigungen_push: settings.benachrichtigungen_push || false,
        benachrichtigungen_intervall: settings.benachrichtigungen_intervall || 'sofort'
      }
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    error.success = false;
    return next(error);
  }
};

/**
 * Update user settings
 */
exports.updateUserSettings = async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { 
      sprache, 
      dark_mode, 
      benachrichtigungen_email, 
      benachrichtigungen_push, 
      benachrichtigungen_intervall
    } = req.body;
    
    // Validation
    if (!sprache || !['de', 'en'].includes(sprache)) {
      const error = new Error('Invalid language setting');
      error.statusCode = 400;
      error.success = false;
      return next(error);
    }

    if (!benachrichtigungen_intervall || !['sofort', 'taeglich', 'woechentlich'].includes(benachrichtigungen_intervall)) {
      const error = new Error('Invalid notification interval setting');
      error.statusCode = 400;
      error.success = false;
      return next(error);
    }
    
    // Check if settings exist for this user
    const settingsQuery = await pool.query({
      text: 'SELECT benutzer_id FROM benutzer_einstellungen WHERE benutzer_id = $1',
      values: [userId]
    });
    
    if (settingsQuery.rows.length === 0) {
      // Create new settings
      await pool.query({
        text: `
          INSERT INTO benutzer_einstellungen (
            benutzer_id, 
            sprache, 
            dark_mode, 
            benachrichtigungen_email, 
            benachrichtigungen_push, 
            benachrichtigungen_intervall
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        values: [
          userId,
          sprache || 'de', 
          dark_mode === 'on' || dark_mode === true, 
          benachrichtigungen_email === 'on' || benachrichtigungen_email === true, 
          benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
          benachrichtigungen_intervall || 'sofort'
        ]
      });
    } else {
      // Update existing settings
      await pool.query({
        text: `
          UPDATE benutzer_einstellungen 
          SET 
            sprache = $1, 
            dark_mode = $2, 
            benachrichtigungen_email = $3, 
            benachrichtigungen_push = $4, 
            benachrichtigungen_intervall = $5,
            updated_at = CURRENT_TIMESTAMP 
          WHERE benutzer_id = $6
        `,
        values: [
          sprache || 'de', 
          dark_mode === 'on' || dark_mode === true, 
          benachrichtigungen_email === 'on' || benachrichtigungen_email === true, 
          benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
          benachrichtigungen_intervall || 'sofort',
          userId
        ]
      });
    }
    
    // Log activity
    await pool.query({
      text: `
        INSERT INTO benutzer_aktivitaet (
          benutzer_id, aktivitaet, ip_adresse
        ) VALUES ($1, $2, $3)
      `,
      values: [
        userId,
        'settings_updated',
        req.ip
      ]
    });
    
    return {
      success: true,
      message: 'Settings updated successfully'
    };
  } catch (error) {
    console.error('Error updating user settings:', error);
    error.success = false; // Ensure error object has success property
    next(error);
  }
};

/**
 * Get system settings (admin only)
 */
exports.getSystemSettings = async (req, res, next) => {
  try {
    // Verify user is admin
    if (req.session.user.role !== 'admin') {
      const error = new Error('Unauthorized access to system settings');
      error.statusCode = 403;
      throw error;
    }
    
    // Get system settings from database
    const settingsQuery = await pool.query(`
      SELECT * FROM system_einstellungen
      ORDER BY kategorie, einstellung
    `);
    
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
    
    return {
      settings: settingsByCategory
    };
  } catch (error) {
    console.error('Error getting system settings:', error);
    error.success = false; // Ensure error object has success property
    next(error);
  }
};

/**
 * Update system settings (admin only)
 */
exports.updateSystemSettings = async (req, res, next) => {
  try {
    // Verify user is admin
    if (req.session.user.role !== 'admin') {
      const error = new Error('Unauthorized access to system settings');
      error.statusCode = 403;
      throw error;
    }
    
    const { settings } = req.body;
    
    // Validate settings
    if (!settings || typeof settings !== 'object') {
      const error = new Error('Invalid settings data');
      error.statusCode = 400;
      error.success = false;
      throw error;
    }
    
    // Update each setting in the database
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return pool.query({
        text: `
          UPDATE system_einstellungen 
          SET wert = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE einstellung = $2
        `,
        values: [value, key]
      });
    });
    
    await Promise.all(updatePromises);
    
    // Log activity
    await pool.query({
      text: `
        INSERT INTO system_log (
          aktion, benutzer_id, benutzer_name, details, ip_adresse
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        'system_settings_updated',
        req.session.user.id,
        req.session.user.name,
        'System settings updated',
        req.ip
      ]
    });
    
    return {
      success: true,
      message: 'System settings updated successfully'
    };
  } catch (error) {
    console.error('Error updating system settings:', error);
    error.success = false; // Ensure error object has success property
    next(error);
  }
};

/**
 * Get backup settings (admin only)
 */
exports.getBackupSettings = async (req, res, next) => {
  try {
    // Verify user is admin
    if (req.session.user.role !== 'admin') {
      const error = new Error('Unauthorized access to backup settings');
      error.statusCode = 403;
      throw error;
    }
    
    // Get backup settings from database
    const settingsQuery = await pool.query(`
      SELECT * FROM backup_einstellungen
      WHERE aktiv = true
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    // Default backup settings if none exist
    const backupSettings = settingsQuery.rows.length > 0 ? settingsQuery.rows[0] : {
      automatisch: true,
      intervall: 'taeglich',
      zeit: '02:00',
      aufbewahrung: 7,
      letzte_ausfuehrung: null,
      status: 'nicht_ausgefuehrt'
    };
    
    // Get recent backups
    const backupsQuery = await pool.query(`
      SELECT * FROM backup_log
      ORDER BY erstellt_am DESC
      LIMIT 10
    `);
    
    return {
      settings: {
        automatisch: backupSettings.automatisch,
        intervall: backupSettings.intervall,
        zeit: backupSettings.zeit,
        aufbewahrung: backupSettings.aufbewahrung,
        letzte_ausfuehrung: backupSettings.letzte_ausfuehrung,
        status: backupSettings.status
      },
      backups: backupsQuery.rows.map(backup => ({
        id: backup.id,
        dateiname: backup.dateiname,
        groesse: backup.groesse,
        datum: backup.erstellt_am,
        status: backup.status
      }))
    };
  } catch (error) {
    console.error('Error getting backup settings:', error);
    error.success = false; // Ensure error object has success property
    next(error);
  }
};

/**
 * Update backup settings (admin only)
 */
exports.updateBackupSettings = async (req, res, next) => {
  try {
    // Verify user is admin
    if (req.session.user.role !== 'admin') {
      const error = new Error('Unauthorized access to backup settings');
      error.statusCode = 403;
      throw error;
    }
    
    const { 
      automatisch, 
      intervall, 
      zeit, 
      aufbewahrung 
    } = req.body;
    
    // Validation
    if (!intervall || !['taeglich', 'woechentlich', 'monatlich'].includes(intervall)) {
      const error = new Error('Invalid backup interval');
      error.statusCode = 400;
      error.success = false;
      return next(error);
    }

    if (!zeit || !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(zeit)) {
      const error = new Error('Invalid backup time format. Use HH:mm');
      error.statusCode = 400;
      error.success = false;
      return next(error);
    }
    
    // Insert new backup settings
    await pool.query({
      text: `
        INSERT INTO backup_einstellungen (
          automatisch, 
          intervall, 
          zeit, 
          aufbewahrung, 
          aktiv
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        automatisch === 'on' || automatisch === true,
        intervall,
        zeit,
        parseInt(aufbewahrung || 7),
        true
      ]
    });
    
    // Deactivate previous settings
    await pool.query({
      text: `
        UPDATE backup_einstellungen 
        SET aktiv = false 
        WHERE created_at < CURRENT_TIMESTAMP
        AND id NOT IN (
          SELECT id FROM backup_einstellungen 
          ORDER BY created_at DESC 
          LIMIT 1
        )
      `
    });
    
    // Log activity
    await pool.query({
      text: `
        INSERT INTO system_log (
          aktion, benutzer_id, benutzer_name, details, ip_adresse
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        'backup_settings_updated',
        req.session.user.id,
        req.session.user.name,
        'Backup settings updated',
        req.ip
      ]
    });
    
    return {
      success: true,
      message: 'Backup settings updated successfully'
    };
  } catch (error) {
    console.error('Error updating backup settings:', error);
    error.success = false; // Ensure error object has success property
    next(error);
  }
};

/**
 * Trigger manual backup (admin only)
 */
exports.triggerManualBackup = async (req, res, next) => {
  try {
    // Verify user is admin
    if (req.session.user.role !== 'admin') {
      const error = new Error('Unauthorized access to backup functionality');
      error.statusCode = 403;
      throw error;
    }
    
    // Start backup process (this would typically be handled by a separate backup service)
    // For this example, we'll just record the request
    
    // Log backup request
    await pool.query({
      text: `
        INSERT INTO backup_log (
          dateiname, 
          typ, 
          benutzer_id, 
          status,
          details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        `manual_backup_${new Date().toISOString().replace(/[:.]/g, '_')}.sql`,
        'manuell',
        req.session.user.id,
        'ausstehend',
        'Manual backup triggered'
      ]
    });
    
    // Log activity
    await pool.query({
      text: `
        INSERT INTO system_log (
          aktion, benutzer_id, benutzer_name, details, ip_adresse
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        'manual_backup',
        req.session.user.id,
        req.session.user.name,
        'Manual backup triggered',
        req.ip
      ]
    });
    
    return {
      success: true,
      message: 'Backup process initiated',
      status: 'pending'
    };
  } catch (error) {
    console.error('Error triggering manual backup:', error);
    error.success = false; // Ensure error object has success property
    next(error);
  }
};