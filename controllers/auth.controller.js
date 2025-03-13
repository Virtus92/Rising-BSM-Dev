/**
 * Auth Controller
 * Handles all authentication related business logic
 */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../services/db.service');
const BaseController = require('./baseController');
const { validateLogin } = require('../middleware/authValidation.middleware');
const ConnectionManager = require('../utils/connectionManager');

class AuthController extends BaseController {
  /**
   * Handle user login
   */
  async login(req, res, next) {
    return this.executeQuery(async () => {
      const { email, password, remember } = req.body;

      // Find user in database
      const result = await ConnectionManager.withConnection(client => client.query(
        'SELECT * FROM benutzer WHERE email = $1',
        [email.toLowerCase()]
      ));

      if (result.rows.length === 0) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      }

      const user = result.rows[0];

      // Verify password
      const passwordMatches = await bcrypt.compare(password, user.passwort);
      
      if (!passwordMatches) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      }

      // Check if account is active
      if (user.status !== 'aktiv') {
        const error = new Error('Account is inactive or suspended');
        error.statusCode = 403;
        throw error;
      }

      // Create session data - don't store password hash
      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.rolle,
        initials: user.name.split(' ').map(n => n[0]).join('')
      };

      // Log login activity
      await ConnectionManager.withConnection(client => client.query(
        `INSERT INTO benutzer_aktivitaet (benutzer_id, aktivitaet, ip_adresse) 
         VALUES ($1, $2, $3)`,
        [user.id, 'login', req.ip]
      ));

      return { user: sessionUser, remember: remember === 'on' };
    }, next);
  }

  /**
   * Handle forgot password request
   */
  async forgotPassword(req, res, next) {
    return this.executeQuery(async () => {
      const { email } = req.body;

      // Input validation
      if (!email || typeof email !== 'string') {
        const error = new Error('Please provide a valid email address');
        error.statusCode = 400;
        throw error;
      }

      // Sanitize input
      const sanitizedEmail = email.trim().toLowerCase();

      // Check if user exists
      const result = await ConnectionManager.withConnection(client => client.query(
        'SELECT * FROM benutzer WHERE email = $1',
        [sanitizedEmail]
      ));

      // For security reasons, always return success even if user not found
      if (result.rows.length === 0) {
        return {
          success: true,
          message: 'If an account with this email exists, password reset instructions have been sent'
        };
      }

      const user = result.rows[0];

      // Generate token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Set token expiry to 1 hour
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);

      // Save token to database
      await ConnectionManager.withConnection(client => client.query(
        `UPDATE benutzer 
         SET reset_token = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [hashedToken, expiry, user.id]
      ));

      // Return token and user email for the email service to handle
      return {
        success: true,
        userId: user.id,
        email: user.email,
        token: resetToken,
        message: 'If an account with this email exists, password reset instructions have been sent'
      };
    }, next);
  }

  /**
   * Validate reset token
   */
  async validateResetToken(req, res, next) {
    return this.executeQuery(async () => {
      const { token } = req.params;
      
      if (!token) {
        const error = new Error('Invalid token');
        error.statusCode = 400;
        throw error;
      }

      // Hash the token from the URL
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with this token and valid expiry
      const result = await ConnectionManager.withConnection(client => client.query(
        `SELECT id, email FROM benutzer 
         WHERE reset_token = $1 
         AND reset_token_expiry > CURRENT_TIMESTAMP`,
        [hashedToken]
      ));

      if (result.rows.length === 0) {
        const error = new Error('Invalid or expired token');
        error.statusCode = 400;
        throw error;
      }

      return {
        success: true,
        userId: result.rows[0].id,
        email: result.rows[0].email
      };
    }, next);
  }

  /**
   * Reset password
   */
  async resetPassword(req, res, next) {
    return this.executeQuery(async () => {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;
      
      // Input validation
      if (!password || !confirmPassword) {
        const error = new Error('Please enter and confirm your new password');
        error.statusCode = 400;
        throw error;
      }
      
      if (password !== confirmPassword) {
        const error = new Error('Passwords do not match');
        error.statusCode = 400;
        throw error;
      }

      if (password.length < 8) {
        const error = new Error('Password must be at least 8 characters long');
        error.statusCode = 400;
        throw error;
      }

      // Hash the token from the URL
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with this token and valid expiry
      const result = await ConnectionManager.withConnection(client => client.query(
        `SELECT id FROM benutzer 
         WHERE reset_token = $1 
         AND reset_token_expiry > CURRENT_TIMESTAMP`,
        [hashedToken]
      ));

      if (result.rows.length === 0) {
        const error = new Error('Invalid or expired token');
        error.statusCode = 400;
        throw error;
      }

      const userId = result.rows[0].id;

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update user's password and clear reset token
      await ConnectionManager.withConnection(client => client.query(
        `UPDATE benutzer 
         SET passwort = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [hashedPassword, userId]
      ));

      // Log password reset activity
      await ConnectionManager.withConnection(client => client.query(
        `INSERT INTO benutzer_aktivitaet (benutzer_id, aktivitaet, ip_adresse) 
         VALUES ($1, $2, $3)`,
        [userId, 'password_reset', req.ip]
      ));

      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    }, next);
  }

  /**
   * Log out user
   */
  async logout(req, res, next) {
    return this.executeQuery(async () => {
      if (req.session && req.session.user) {
        // Log logout activity
        await ConnectionManager.withConnection(client => client.query(
          `INSERT INTO benutzer_aktivitaet (benutzer_id, aktivitaet, ip_adresse) 
           VALUES ($1, $2, $3)`,
          [req.session.user.id, 'logout', req.ip]
        ));
      }

      return { success: true };
    }, next);
  }
}

module.exports = new AuthController();