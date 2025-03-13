const BaseController = require('./baseController');
const pool = require('../services/db.service');
const fs = require('fs');
const path = require('path');
const ConnectionManager = require('../services/connectionManager');

class SettingsController extends BaseController {
  /**
   * Get user settings
   */
  async getUserSettings(req, res, next) {
    return this.executeQuery(async () => {
      const userId = req.session.user.id;
      
      // Get user settings from database
      const settingsQuery = await ConnectionManager.withConnection(client => client.query({
        text: `
          SELECT * FROM benutzer_einstellungen
          WHERE benutzer_id = $1
        `,
        values: [userId]
      }));
      
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
    }, next);
  }

  /**
   * Update user settings
   */
  async updateUserSettings(req, res, next) {
    return this.executeQuery(async () => {
      const userId = req.session.user.id;
      const { 
        sprache, 
        dark_mode, 
        benachrichtigungen_email, 
        benachrichtigungen_push, 
        benachrichtigungen_intervall
      } = req.body;
      
      // Check if settings exist for this user
      const settingsQuery = await ConnectionManager.withConnection(client => client.query({
        text: 'SELECT benutzer_id FROM benutzer_einstellungen WHERE benutzer_id = $1',
        values: [userId]
      }));
      
      if (settingsQuery.rows.length === 0) {
        // Create new settings
        await ConnectionManager.withConnection(client => client.query({
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
        }));
      } else {
        // Update existing settings
        await ConnectionManager.withConnection(client => client.query({
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
        }));
      }
      
      // Log activity
      await ConnectionManager.withConnection(client => client.query({
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
      }));
      
      return {
        success: true,
        message: 'Settings updated successfully'
      };
    }, next);
  }

  /**
   * Get system settings (admin only)
   */
  async getSystemSettings(req, res, next) {
    return this.executeQuery(async () => {
      // Verify user is admin
      if (req.session.user.role !== 'admin') {
        const error = new Error('Unauthorized access to system settings');
        error.statusCode = 403;
        throw error;
      }
      
      // Get system settings from database
      const settingsQuery = await ConnectionManager.withConnection(client => client.query(`
        SELECT * FROM system_einstellungen
        ORDER BY kategorie, einstellung
      `));
      
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
    }, next);
  }

  /**
   * Update system settings (admin only)
   */
  async updateSystemSettings(req, res, next) {
    return this.executeQuery(async () => {
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
        throw error;
      }
      
      // Update each setting in the database
      const updatePromises = Object.entries(settings).map(([key, value]) => {
        return ConnectionManager.withConnection(client => client.query({
          text: `
            UPDATE system_einstellungen 
            SET wert = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE einstellung = $2
          `,
          values: [value, key]
        }));
      });
      
      await Promise.all(updatePromises);
      
      // Log activity
      await ConnectionManager.withConnection(client => client.query({
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
      }));
      
      return {
        success: true,
        message: 'System settings updated successfully'
      };
    }, next);
  }

  /**
   * Get backup settings (admin only)
   */
  async getBackupSettings(req, res, next) {
    return this.executeQuery(async () => {
      // Verify user is admin
      if (req.session.user.role !== 'admin') {
        const error = new Error('Unauthorized access to backup settings');
        error.statusCode = 403;
        throw error;
      }
      
      // Get backup settings from database
      const settingsQuery = await ConnectionManager.withConnection(client => client.query(`
        SELECT * FROM backup_einstellungen
        WHERE aktiv = true
        ORDER BY created_at DESC
        LIMIT 1
      `));
      
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
      const backupsQuery = await ConnectionManager.withConnection(client => client.query(`
        SELECT * FROM backup_log
        ORDER BY erstellt_am DESC
        LIMIT 10
      `));
      
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
    }, next);
  }

  /**
   * Update backup settings (admin only)
   */
  async updateBackupSettings(req, res, next) {
    return this.executeQuery(async () => {
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
      if (!intervall || !zeit) {
        const error = new Error('Backup interval and time are required');
        error.statusCode = 400;
        throw error;
      }
      
      // Insert new backup settings
      await ConnectionManager.withConnection(client => client.query({
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
      }));
      
      // Deactivate previous settings
      await ConnectionManager.withConnection(client => client.query({
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
      }));
      
      // Log activity
      await ConnectionManager.withConnection(client => client.query({
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
      }));
      
      return {
        success: true,
        message: 'Backup settings updated successfully'
      };
    }, next);
  }

  /**
   * Trigger manual backup (admin only)
   */
  async triggerManualBackup(req, res, next) {
    return this.executeQuery(async () => {
      // Verify user is admin
      if (req.session.user.role !== 'admin') {
        const error = new Error('Unauthorized access to backup functionality');
        error.statusCode = 403;
        throw error;
      }
      
      // Start backup process (this would typically be handled by a separate backup service)
      // For this example, we'll just record the request
      
      // Log backup request
      await ConnectionManager.withConnection(client => client.query({
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
      }));
      
      // Log activity
      await ConnectionManager.withConnection(client => client.query({
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
      }));
      
      return {
        success: true,
        message: 'Backup process initiated',
        status: 'pending'
      };
    }, next);
  }
}

module.exports = new SettingsController();