/**
 * DTO für Benutzeranmeldung
 */
export interface LoginDto {
  /**
   * E-Mail-Adresse
   */
  email: string;
  
  /**
   * Passwort
   */
  password: string;
  
  /**
   * "Angemeldet bleiben"-Option
   */
  remember?: boolean;
}

/**
 * DTO für Token-Payload
 */
export interface TokenPayloadDto {
  /**
   * Benutzer-ID
   */
  sub: string;
  
  /**
   * E-Mail-Adresse
   */
  email: string;
  
  /**
   * Benutzername
   */
  name: string;
  
  /**
   * Benutzerrolle
   */
  role: string;
  
  /**
   * Erstellungszeitpunkt
   */
  iat: number;
  
  /**
   * Ablaufzeitpunkt
   */
  exp: number;
}

/**
 * DTO für Authentifizierungsantwort
 */
export interface AuthResponseDto {
  /**
   * Benutzer-ID
   */
  id: number;
  
  /**
   * Access Token
   */
  accessToken: string;
  
  /**
   * Refresh Token
   */
  refreshToken: string;
  
  /**
   * Ablaufzeit in Sekunden
   */
  expiresIn: number;
  
  /**
   * Erstellungszeitpunkt
   */
  createdAt: string;
  
  /**
   * Aktualisierungszeitpunkt
   */
  updatedAt: string;
  
  /**
   * Benutzerdaten
   */
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * DTO für Token-Aktualisierung
 */
export interface RefreshTokenDto {
  /**
   * Refresh Token
   */
  refreshToken: string;
}

/**
 * DTO für Token-Aktualisierungsantwort
 */
export interface RefreshTokenResponseDto {
  /**
   * Benutzer-ID
   */
  id: number;
  
  /**
   * Neues Access Token
   */
  accessToken: string;
  
  /**
   * Neues Refresh Token (falls Rotation aktiviert)
   */
  refreshToken: string;
  
  /**
   * Ablaufzeit in Sekunden
   */
  expiresIn: number;
  
  /**
   * Erstellungszeitpunkt
   */
  createdAt: string;
  
  /**
   * Aktualisierungszeitpunkt
   */
  updatedAt: string;
}

/**
 * DTO für "Passwort vergessen"
 */
export interface ForgotPasswordDto {
  /**
   * E-Mail-Adresse
   */
  email: string;
}

/**
 * DTO für Passwort-Zurücksetzen
 */
export interface ResetPasswordDto {
  /**
   * Token für Passwort-Zurücksetzen
   */
  token: string;
  
  /**
   * Neues Passwort
   */
  password: string;
  
  /**
   * Passwortbestätigung
   */
  confirmPassword: string;
}

/**
 * DTO für Abmeldung
 */
export interface LogoutDto {
  /**
   * Refresh Token
   */
  refreshToken?: string;
}
