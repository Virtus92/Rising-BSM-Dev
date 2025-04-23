/**
 * Basis-Entitätsklasse
 * 
 * Stellt grundlegende Eigenschaften und Funktionen für alle Entitäten bereit.
 */
export abstract class BaseEntity {
  /**
   * Eindeutige ID der Entität
   */
  id: number;
  
  /**
   * Erstellungszeitpunkt
   */
  createdAt: Date;
  
  /**
   * Letzter Aktualisierungszeitpunkt
   */
  updatedAt: Date;
  
  /**
   * ID des Benutzers, der die Entität erstellt hat
   */
  createdBy?: number;
  
  /**
   * ID des Benutzers, der die Entität zuletzt aktualisiert hat
   */
  updatedBy?: number;
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<BaseEntity> = {}) {
    this.id = data.id || 0;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
  }
  
  /**
   * Prüft, ob die Entität neu ist (noch nicht persistiert)
   */
  isNew(): boolean {
    return !this.id || this.id === 0;
  }
  
  /**
   * Aktualisiert die Auditdaten der Entität
   * 
   * @param userId - ID des Benutzers, der die Aktualisierung durchführt
   */
  updateAuditData(userId?: number): void {
    this.updatedAt = new Date();
    
    if (userId) {
      this.updatedBy = userId;
    }
  }
  
  /**
   * Markiert die Entität als erstellt
   * 
   * @param userId - ID des Benutzers, der die Entität erstellt hat
   */
  markAsCreated(userId?: number): void {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    
    if (userId) {
      this.createdBy = userId;
      this.updatedBy = userId;
    }
  }
  
  /**
   * Konvertiert die Entität in ein einfaches Objekt
   * 
   * @returns Einfaches Objekt mit den Daten der Entität
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }
}
