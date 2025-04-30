/**
 * Validierungsergebnisse
 * 
 * Wird verwendet, um den Status einer Validierung anzuzeigen.
 */
export enum ValidationResult {
  /**
   * Validierung erfolgreich
   */
  SUCCESS = 'success',
  
  /**
   * Validierungsfehler
   */
  ERROR = 'error',
  
  /**
   * Validierungswarnung
   */
  WARNING = 'warning'
}

/**
 * Validierungsfehlerkategorien
 * 
 * Wird verwendet, um die Art des Validierungsfehlers zu klassifizieren.
 */
export enum ValidationErrorType {
  /**
   * Erforderliches Feld fehlt
   */
  REQUIRED = 'required',
  
  /**
   * Formatfehler
   */
  FORMAT = 'format',
  
  /**
   * Ungültiger Wert
   */
  INVALID = 'invalid',
  
  /**
   * Wert außerhalb des gültigen Bereichs
   */
  RANGE = 'range',
  
  /**
   * Duplikat gefunden
   */
  DUPLICATE = 'duplicate',
  
  /**
   * Keine Berechtigung
   */
  PERMISSION = 'permission',
  
  /**
   * Ungültiges Format
   */
  INVALID_FORMAT = 'invalid_format',
  
  /**
   * Wert zu kurz
   */
  TOO_SHORT = 'too_short',
  
  /**
   * Interner Fehler
   */
  INTERNAL_ERROR = 'internal_error',
  
  /**
   * Sonstiger Fehler
   */
  OTHER = 'other'
}
