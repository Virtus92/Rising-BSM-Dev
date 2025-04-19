import { BaseEntity } from './BaseEntity';
import { RequestStatus } from '../enums/CommonEnums';
import { RequestData } from './RequestData';
import { RequestSource, RequestMetadata } from '../dtos/RequestDtos';

// Import types from RequestDtos.ts to prevent circular dependency

/**
 * Kontaktanfrage-Entität
 * 
 * Repräsentiert eine Kontaktanfrage im System.
 */
export class ContactRequest extends BaseEntity {
  /**
   * Name des Anfragenden
   */
  name: string;
  
  /**
   * E-Mail des Anfragenden
   */
  email: string;
  
  /**
   * Telefonnummer des Anfragenden
   */
  phone?: string;
  
  /**
   * Angefragter Service
   */
  service: string;
  
  /**
   * Nachrichteninhalt
   */
  message: string;
  
  /**
   * Status der Anfrage
   */
  status: RequestStatus;
  
  /**
   * ID des bearbeitenden Benutzers
   */
  processorId?: number;
  
  /**
   * ID des zugeordneten Kunden
   */
  customerId?: number;
  
  /**
   * ID des zugeordneten Termins
   */
  appointmentId?: number;
  
  /**
   * IP-Adresse
   */
  ipAddress?: string;
  
  /**
   * Source of the request (human, AI, etc.)
   */
  source?: RequestSource;
  
  /**
   * Metadata for AI processing
   */
  metadata?: RequestMetadata;
  
  /**
   * Associated structured data
   */
  requestData?: RequestData[];
  
  /**
   * Konstruktor
   * 
   * @param data - Initialisierungsdaten
   */
  constructor(data: Partial<ContactRequest> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone;
    this.service = data.service || '';
    this.message = data.message || '';
    this.status = data.status || RequestStatus.NEW;
    this.processorId = data.processorId;
    this.customerId = data.customerId;
    this.appointmentId = data.appointmentId;
    this.ipAddress = data.ipAddress;
    
    // New fields
    this.source = data.source;
    this.metadata = data.metadata || {};
    this.requestData = data.requestData || [];
  }
  
  /**
   * Prüft, ob die Anfrage neu ist
   */
  isNew(): boolean {
    return this.status === RequestStatus.NEW;
  }
  
  /**
   * Prüft, ob die Anfrage in Bearbeitung ist
   */
  isInProgress(): boolean {
    return this.status === RequestStatus.IN_PROGRESS;
  }
  
  /**
   * Prüft, ob die Anfrage abgeschlossen ist
   */
  isCompleted(): boolean {
    return this.status === RequestStatus.COMPLETED;
  }
  
  /**
   * Prüft, ob die Anfrage abgebrochen wurde
   */
  isCancelled(): boolean {
    return this.status === RequestStatus.CANCELLED;
  }
  
  /**
   * Prüft, ob die Anfrage einem Benutzer zugewiesen ist
   */
  isAssigned(): boolean {
    return !!this.processorId;
  }
  
  /**
   * Prüft, ob die Anfrage einem Kunden zugeordnet ist
   */
  isLinkedToCustomer(): boolean {
    return !!this.customerId;
  }
  
  /**
   * Prüft, ob die Anfrage einem Termin zugeordnet ist
   */
  isLinkedToAppointment(): boolean {
    return !!this.appointmentId;
  }
  
  /**
   * Checks if the request has been processed by AI
   */
  isAIProcessed(): boolean {
    return !!this.metadata?.aiProcessed;
  }
  
  /**
   * Gets data for a specific category
   * 
   * @param category - Category to filter by
   * @returns Array of matching RequestData items
   */
  getDataByCategory(category: string): RequestData[] {
    return this.requestData?.filter(d => d.category === category) || [];
  }
  
  /**
   * Add metadata key-value pair
   * 
   * @param key - Metadata key
   * @param value - Metadata value
   * @returns This instance for chaining
   */
  addMetadata(key: string, value: any): ContactRequest {
    if (!this.metadata) this.metadata = {};
    this.metadata[key] = value;
    return this;
  }
  
  /**
   * Add a processing step to metadata
   * 
   * @param agentId - ID of the agent that performed the step
   * @param action - Action performed
   * @param result - Result of the action
   * @returns This instance for chaining
   */
  addProcessingStep(agentId: string, action: string, result: string): ContactRequest {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.processingSteps) this.metadata.processingSteps = [];
    
    this.metadata.processingSteps.push({
      agentId,
      timestamp: new Date().toISOString(),
      action,
      result
    });
    
    return this;
  }
  
  /**
   * Aktualisiert den Status der Anfrage
   * 
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  updateStatus(status: RequestStatus, updatedBy?: number): ContactRequest {
    this.status = status;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Markiert die Anfrage als "in Bearbeitung"
   * 
   * @param processorId - ID des Bearbeiters
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  markAsInProgress(processorId: number, updatedBy?: number): ContactRequest {
    this.status = RequestStatus.IN_PROGRESS;
    this.processorId = processorId;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Markiert die Anfrage als abgeschlossen
   * 
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  markAsCompleted(updatedBy?: number): ContactRequest {
    this.status = RequestStatus.COMPLETED;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Markiert die Anfrage als abgebrochen
   * 
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  markAsCancelled(updatedBy?: number): ContactRequest {
    this.status = RequestStatus.CANCELLED;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Weist die Anfrage einem Benutzer zu
   * 
   * @param processorId - ID des Bearbeiters
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  assignTo(processorId: number, updatedBy?: number): ContactRequest {
    this.processorId = processorId;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Verknüpft die Anfrage mit einem Kunden
   * 
   * @param customerId - Kunden-ID
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  linkToCustomer(customerId: number, updatedBy?: number): ContactRequest {
    this.customerId = customerId;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Verknüpft die Anfrage mit einem Termin
   * 
   * @param appointmentId - Termin-ID
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  linkToAppointment(appointmentId: number, updatedBy?: number): ContactRequest {
    this.appointmentId = appointmentId;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Aktualisiert die Anfragedaten
   * 
   * @param data - Neue Daten
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierte Anfrage
   */
  update(data: Partial<ContactRequest>, updatedBy?: number): ContactRequest {
    // Nur definierte Eigenschaften aktualisieren
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.service !== undefined) this.service = data.service;
    if (data.message !== undefined) this.message = data.message;
    if (data.status !== undefined) this.status = data.status;
    if (data.processorId !== undefined) this.processorId = data.processorId;
    if (data.customerId !== undefined) this.customerId = data.customerId;
    if (data.appointmentId !== undefined) this.appointmentId = data.appointmentId;
    if (data.source !== undefined) this.source = data.source;
    if (data.metadata !== undefined) this.metadata = data.metadata;
    
    // Auditdaten aktualisieren
    this.updateAuditData(updatedBy);
    
    return this;
  }
  
  /**
   * Validiert das E-Mail-Format
   */
  isValidEmail(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.email);
  }
  
  /**
   * Konvertiert die Entität in ein einfaches Objekt
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    return {
      ...baseObject,
      name: this.name,
      email: this.email,
      phone: this.phone,
      service: this.service,
      message: this.message,
      status: this.status,
      processorId: this.processorId,
      customerId: this.customerId,
      appointmentId: this.appointmentId,
      ipAddress: this.ipAddress,
      source: this.source,
      metadata: this.metadata
      // requestData is omitted intentionally, should be fetched separately
    };
  }
}