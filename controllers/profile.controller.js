/**
 * Profile Controller
 * Handles all user profile related business logic
 */
const BaseController = require('./baseController');
const bcrypt = require('bcryptjs');
const pool = require('../services/db.service');
const { formatDateSafely } = require('../utils/formatters');

class ProfileController extends BaseController {
  /**
   * Get current user profile data
   */
  async getUserProfile(req, res, next) {
    return this.executeQuery(async () => {
      const userId = req.session.user.id;
    
      // Get user data from database
      const userQuery = await pool.query({
        text: `
          SELECT 
            id, name, email, telefon, rolle, 
            profilbild, erstellt_am, updated_at
          FROM benutzer 
          WHERE id = $1
        `,
        values: [userId]
      });
    
      if (userQuery.rows.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
    
      const user = userQuery.rows[0];
    
      // Get user settings
      const settingsQuery = await pool.query({
        text: `
          SELECT * FROM benutzer_einstellungen
          WHERE benutzer_id = $1
        `,
        values: [userId]
      });
    
      const settings = settingsQuery.rows.length > 0 ? settingsQuery.rows[0] : {
        sprache: 'de',
        dark_mode: false,
        benachrichtigungen_email: true,
        benachrichtigungen_intervall: 'sofort'
      };
    
      // Get recent activity
      const activityQuery = await pool.query({
        text: `
          SELECT aktivitaet, ip_adresse, erstellt_am
          FROM benutzer_aktivitaet
          WHERE benutzer_id = $1
          ORDER BY erstellt_am DESC
          LIMIT 5
        `,
        values: [userId]
      });
    
      // Format data for response
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          telefon: user.telefon || '',
          rolle: user.rolle,
          profilbild: user.profilbild || null,
          seit: formatDateSafely(user.erstellt_am, 'dd.MM.yyyy')
        },
        settings: {
          sprache: settings.sprache || 'de',
          dark_mode: settings.dark_mode || false,
          benachrichtigungen_email: settings.benachrichtigungen_email || true,
          benachrichtigungen_intervall: settings.benachrichtigungen_intervall || 'sofort'
        },
        activity: activityQuery.rows.map(activity => ({
          type: activity.aktivitaet,
          ip: activity.ip_adresse,
          date: formatDateSafely(activity.erstellt_am, 'dd.MM.yyyy, HH:mm')
        }))
      };
    }, next);
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    return this.executeQuery(async () => {
      const userId = req.session.user.id;
      const { 
        name, 
        email, 
        telefon 
      } = req.body;
    
      // Validation
      if (!name || !email) {
        const error = new Error('Name and email are required fields');
        error.statusCode = 400;
        throw error;
      }
    
      // Check if email is unique (if changed)
      if (email !== req.session.user.email) {
        const emailCheck = await pool.query({
          text: 'SELECT id FROM benutzer WHERE email = $1 AND id != $2',
          values: [email, userId]
        });
      
        if (emailCheck.rows.length > 0) {
          const error = new Error('Email address is already in use');
          error.statusCode = 400;
          throw error;
        }
      }
    
      // Update user in database
      await pool.query({
        text: `
          UPDATE benutzer 
          SET 
            name = $1, 
            email = $2, 
            telefon = $3, 
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = $4
        `,
        values: [name, email, telefon || null, userId]
      });
    
      // Log the activity
      await pool.query({
        text: `
          INSERT INTO benutzer_aktivitaet (
            benutzer_id, aktivitaet, ip_adresse
          ) VALUES ($1, $2, $3)
        `,
        values: [
          userId,
          'profile_updated',
          req.ip
        ]
      });
    
      // Return updated user data for session
      return {
        success: true,
        user: {
          id: userId,
          name: name,
          email: email,
          role: req.session.user.role,
          initials: name.split(' ').map(n => n[0]).join('')
        },
        message: 'Profile updated successfully'
      };
    }, next);
  }

  /**
   * Update user password
   */
  async updatePassword(req, res, next) {
    return this.executeQuery(async () => {
      const userId = req.session.user.id;
      const { current_password, new_password, confirm_password } = req.body;
    
      // Validation
      if (!current_password || !new_password || !confirm_password) {
        const error = new Error('All password fields are required');
        error.statusCode = 400;
        throw error;
      }
    
      if (new_password !== confirm_password) {
        const error = new Error('New passwords do not match');
        error.statusCode = 400;
        throw error;
      }
    
      if (new_password.length < 8) {
        const error = new Error('Password must be at least 8 characters long');
        error.statusCode = 400;
        throw error;
      }
    
      // Get current password hash
      const userQuery = await pool.query({
        text: 'SELECT passwort FROM benutzer WHERE id = $1',
        values: [userId]
      });
    
      if (userQuery.rows.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
    
      // Verify current password
      const passwordMatches = await bcrypt.compare(
        current_password, 
        userQuery.rows[0].passwort
      );
    
      if (!passwordMatches) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
      }
    
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);
    
      // Update password in database
      await pool.query({
        text: `
          UPDATE benutzer 
          SET 
            passwort = $1, 
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `,
        values: [hashedPassword, userId]
      });
    
      // Log the activity
      await pool.query({
        text: `
          INSERT INTO benutzer_aktivitaet (
            benutzer_id, aktivitaet, ip_adresse
          ) VALUES ($1, $2, $3)
        `,
        values: [
          userId,
          'password_changed',
          req.ip
        ]
      });
    
      return {
        success: true,
        message: 'Password updated successfully'
      };
    }, next);
  }

  /**
   * Update profile picture
   */
  async updateProfilePicture(req, res, next) {
    return this.executeQuery(async () => {
      const userId = req.session.user.id;
    
      // Check if file was uploaded
      if (!req.file) {
        const error = new Error('No image file uploaded');
        error.statusCode = 400;
        throw error;
      }
    
      // Image path (to be stored in database)
      const imagePath = `/uploads/profile/${req.file.filename}`;
    
      // Update profile picture in database
      await pool.query({
        text: `
          UPDATE benutzer 
          SET 
            profilbild = $1, 
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `,
        values: [imagePath, userId]
      });
    
      return {
        success: true,
        imagePath: imagePath,
        message: 'Profile picture updated successfully'
      };
    }, next);
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(req, res, next) {
    return this.executeQuery(async () => {
      const userId = req.session.user.id;
      const { 
        benachrichtigungen_email, 
        benachrichtigungen_push, 
        benachrichtigungen_intervall 
      } = req.body;
    
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
              benachrichtigungen_email, 
              benachrichtigungen_push, 
              benachrichtigungen_intervall
            ) VALUES ($1, $2, $3, $4)
          `,
          values: [
            userId,
            benachrichtigungen_email === 'on',
            benachrichtigungen_push === 'on',
            benachrichtigungen_intervall || 'sofort'
          ]
        });
      } else {
        // Update existing settings
        await pool.query({
          text: `
            UPDATE benutzer_einstellungen 
            SET 
              benachrichtigungen_email = $1, 
              benachrichtigungen_push = $2, 
              benachrichtigungen_intervall = $3,
            updated_at = CURRENT_TIMESTAMP 
            WHERE benutzer_id = $4
          `,
          values: [
            benachrichtigungen_email === 'on',
            benachrichtigungen_push === 'on',
            benachrichtigungen_intervall || 'sofort',
            userId
          ]
        });
      }
    
      return {
        success: true,
        message: 'Notification settings updated successfully'
      };
    }, next);
  }
}

module.exports = new ProfileController();