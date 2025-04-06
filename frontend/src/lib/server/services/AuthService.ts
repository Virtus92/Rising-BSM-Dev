import bcrypt from 'bcryptjs';
import { add, isBefore } from 'date-fns';
import crypto from 'crypto';
import { IAuthService } from '../interfaces/IAuthService';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';
import { IValidationService } from '../interfaces/IValidationService';
import { generateToken, generateRefreshToken, verifyToken } from '../core/auth';

/**
 * Service für die Authentifizierung und Benutzerverwaltung
 */
export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler,
    private validationService: IValidationService
  ) {}

  /**
   * Authentifiziert einen Benutzer mit Email und Passwort
   */
  async authenticate(email: string, password: string, ipAddress?: string) {
    try {
      this.logger.debug('AuthService.authenticate', { email });
      
      // Benutzer anhand der E-Mail finden
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw this.errorHandler.createError('Ungültige E-Mail oder Passwort', 401);
      }
      
      // Überprüfen, ob der Benutzer aktiv ist
      if (user.status !== 'active') {
        throw this.errorHandler.createError('Benutzerkonto ist deaktiviert', 403);
      }
      
      // Passwort überprüfen
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw this.errorHandler.createError('Ungültige E-Mail oder Passwort', 401);
      }
      
      // Login-Zeitstempel aktualisieren
      await this.userRepository.update(user.id, { lastLoginAt: new Date() });
      
      // Tokens generieren
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);
      
      // Refresh-Token in der Datenbank speichern
      const refreshTokenExpires = add(new Date(), { days: 7 });
      await this.refreshTokenRepository.create({
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpires,
        createdByIp: ipAddress
      });
      
      // Alte abgelaufene Tokens entfernen
      await this.refreshTokenRepository.removeExpiredTokens();
      
      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AuthService.authenticate');
    }
  }

  /**
   * Aktualisiert ein Access-Token mit einem Refresh-Token
   */
  async refreshToken(token: string, ipAddress?: string) {
    try {
      this.logger.debug('AuthService.refreshToken');
      
      // Token aus der Datenbank abrufen
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      if (!refreshToken) {
        throw this.errorHandler.createError('Ungültiges Token', 401);
      }
      
      // Überprüfen, ob das Token bereits widerrufen wurde
      if (refreshToken.isRevoked) {
        // Alle Benutzer-Token widerrufen, da dies auf eine mögliche Kompromittierung hinweist
        await this.refreshTokenRepository.revokeAllUserTokens(refreshToken.userId);
        throw this.errorHandler.createError('Token wurde widerrufen', 401);
      }
      
      // Überprüfen, ob das Token abgelaufen ist
      if (isBefore(refreshToken.expiresAt, new Date())) {
        throw this.errorHandler.createError('Token ist abgelaufen', 401);
      }
      
      // Benutzer abrufen
      const user = await this.userRepository.findById(refreshToken.userId);
      if (!user) {
        throw this.errorHandler.createError('Benutzer nicht gefunden', 404);
      }
      
      // Überprüfen, ob der Benutzer aktiv ist
      if (user.status !== 'active') {
        throw this.errorHandler.createError('Benutzerkonto ist deaktiviert', 403);
      }
      
      // Neue Tokens generieren
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      const newAccessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);
      
      // Altes Token ersetzen
      await this.refreshTokenRepository.replaceToken(token, newRefreshToken);
      
      // Neues Token in der Datenbank speichern
      const refreshTokenExpires = add(new Date(), { days: 7 });
      await this.refreshTokenRepository.create({
        token: newRefreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpires,
        createdByIp: ipAddress
      });
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AuthService.refreshToken');
    }
  }

  /**
   * Widerruft ein Refresh-Token
   */
  async revokeToken(token: string, ipAddress?: string) {
    try {
      this.logger.debug('AuthService.revokeToken');
      
      // Token aus der Datenbank abrufen
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      if (!refreshToken) {
        throw this.errorHandler.createError('Ungültiges Token', 401);
      }
      
      // Überprüfen, ob das Token bereits widerrufen wurde
      if (refreshToken.isRevoked) {
        throw this.errorHandler.createError('Token wurde bereits widerrufen', 400);
      }
      
      // Token widerrufen
      await this.refreshTokenRepository.revokeToken(token, ipAddress);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AuthService.revokeToken');
    }
  }

  /**
   * Überprüft die Gültigkeit eines Tokens
   */
  async validateToken(token: string) {
    try {
      this.logger.debug('AuthService.validateToken');
      
      const decoded = verifyToken(token);
      if (!decoded) {
        return false;
      }
      
      // Überprüfen, ob der Benutzer existiert und aktiv ist
      const user = await this.userRepository.findById(decoded.id);
      if (!user || user.status !== 'active') {
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error('Token validation error', error);
      return false;
    }
  }

  /**
   * Generiert ein Passwort-Reset-Token
   */
  async generateResetToken(email: string) {
    try {
      this.logger.debug('AuthService.generateResetToken');
      
      // Benutzer anhand der E-Mail finden
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Aus Sicherheitsgründen nicht preisgeben, dass die E-Mail nicht existiert
        return crypto.randomBytes(32).toString('hex');
      }
      
      // Token generieren
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = add(new Date(), { hours: 24 });
      
      // Token in der Datenbank speichern
      await this.userRepository.update(user.id, {
        resetToken,
        resetTokenExpiry
      });
      
      return resetToken;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AuthService.generateResetToken');
    }
  }

  /**
   * Setzt ein Passwort mit einem Reset-Token zurück
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      this.logger.debug('AuthService.resetPassword');
      
      // Benutzer mit diesem Token finden
      const user = await this.userRepository.findByResetToken(token);
      if (!user) {
        throw this.errorHandler.createError('Ungültiges Token', 400);
      }
      
      // Überprüfen, ob das Token abgelaufen ist
      if (!user.resetTokenExpiry || isBefore(user.resetTokenExpiry, new Date())) {
        throw this.errorHandler.createError('Token ist abgelaufen', 400);
      }
      
      // Passwort hashen
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Benutzer aktualisieren
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });
      
      // Alle Tokens des Benutzers widerrufen
      await this.refreshTokenRepository.revokeAllUserTokens(user.id);
      
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AuthService.resetPassword');
    }
  }

  /**
   * Ändert das Passwort eines Benutzers
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    try {
      this.logger.debug('AuthService.changePassword', { userId });
      
      // Benutzer abrufen
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw this.errorHandler.createError('Benutzer nicht gefunden', 404);
      }
      
      // Aktuelles Passwort überprüfen
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw this.errorHandler.createError('Aktuelles Passwort ist ungültig', 400);
      }
      
      // Neues Passwort validieren
      if (newPassword.length < 8) {
        throw this.errorHandler.createError('Neues Passwort muss mindestens 8 Zeichen lang sein', 400);
      }
      
      // Passwort hashen
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Benutzer aktualisieren
      await this.userRepository.update(userId, {
        password: hashedPassword
      });
      
      // Alle Tokens des Benutzers widerrufen, außer dem aktuellen
      await this.refreshTokenRepository.revokeAllUserTokens(userId);
      
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AuthService.changePassword');
    }
  }

  /**
   * Registriert einen neuen Benutzer
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) {
    try {
      this.logger.debug('AuthService.register');
      
      // Validierung der Benutzerdaten
      const validationResult = this.validationService.validate(userData, {
        name: {
          required: true,
          type: 'string',
          minLength: 2,
          maxLength: 100
        },
        email: {
          required: true,
          type: 'email'
        },
        password: {
          required: true,
          type: 'string',
          minLength: 8
        },
        role: {
          type: 'string',
          enum: ['admin', 'manager', 'employee']
        }
      });
      
      if (!validationResult.isValid) {
        throw this.errorHandler.createError('Validierungsfehler', 400, validationResult.errors);
      }
      
      // Überprüfen, ob die E-Mail bereits existiert
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw this.errorHandler.createError('E-Mail wird bereits verwendet', 400);
      }
      
      // Passwort hashen
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Benutzer erstellen
      const user = await this.userRepository.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'employee',
        status: 'active'
      });
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AuthService.register');
    }
  }
}
