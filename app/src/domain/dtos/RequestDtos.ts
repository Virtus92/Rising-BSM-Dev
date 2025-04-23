import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { RequestStatus } from '../enums/CommonEnums';
import { ContactRequest } from '../entities/ContactRequest';

// Explicitly redefine these types here to avoid circular dependencies with Symbol exports
export type RequestSource = 'human' | 'chatbot' | 'call-agent' | 'email' | 'form' | 'api';

export interface RequestMetadata {
  aiProcessed?: boolean;
  confidenceScore?: number;
  lastProcessedBy?: string;
  lastProcessedAt?: string;
  processingSteps?: Array<{
    agentId: string;
    timestamp: string;
    action: string;
    result: string;
  }>;
  tags?: string[];
  n8n?: {
    workflowTriggered?: boolean;
    workflowName?: string;
    workflowId?: string;
    executionId?: string;
    workflowStatus?: string;
    triggerTimestamp?: string;
    progress?: number;
    currentStep?: string;
    error?: {
      message: string;
      code?: string;
      details?: any;
    };
    [key: string]: any;
  };
  [key: string]: any; // Allow for flexible extension
}

/**
 * Haupt-DTO für Kontaktanfragen
 */
export interface RequestDto extends BaseResponseDto {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  status: RequestStatus;
  processorId?: number;
  customerId?: number;
  appointmentId?: number;
  ipAddress?: string;
  
  // New fields
  source?: RequestSource;
  metadata?: RequestMetadata;
}

/**
 * DTO zum Erstellen einer Kontaktanfrage
 */
export interface CreateRequestDto {
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
   * IP-Adresse (optional, wird automatisch gesetzt)
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
}

/**
 * DTO zum Aktualisieren einer Kontaktanfrage
 */
export interface UpdateRequestDto {
  /**
   * Name des Anfragenden
   */
  name?: string;
  
  /**
   * E-Mail des Anfragenden
   */
  email?: string;
  
  /**
   * Telefonnummer des Anfragenden
   */
  phone?: string;
  
  /**
   * Angefragter Service
   */
  service?: string;
  
  /**
   * Nachrichteninhalt
   */
  message?: string;
  
  /**
   * Status der Anfrage
   */
  status?: RequestStatus;
  
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
   * Source of the request (human, AI, etc.)
   */
  source?: RequestSource;
  
  /**
   * Metadata for AI processing
   */
  metadata?: RequestMetadata;
}

/**
 * DTO für Anfragenotizen
 */
export interface RequestNoteDto extends BaseResponseDto {
  /**
   * ID der Anfrage
   */
  requestId: number;
  
  /**
   * ID des Benutzers
   */
  userId: number;
  
  /**
   * Name des Benutzers
   */
  userName: string;
  
  /**
   * Notiztext
   */
  text: string;
  
  /**
   * Formatiertes Datum
   */
  formattedDate?: string;
}

/**
 * DTO zum Erstellen einer Anfragenotiz
 */
export interface CreateRequestNoteDto {
  /**
   * ID der Anfrage
   */
  requestId: number;
  
  /**
   * Notiztext
   */
  text: string;
}

/**
 * DTO für Status-Updates
 */
export interface RequestStatusUpdateDto {
  /**
   * Neuer Status
   */
  status: RequestStatus;
  
  /**
   * Optionale Notiz
   */
  note?: string;
}

/**
 * DTO für Konvertierung in einen Kunden
 */
export interface ConvertToCustomerDto {
  /**
   * ID der Anfrage
   */
  requestId: number;
  
  /**
   * Kundendaten (optional, zusätzliche Daten)
   */
  customerData?: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    type?: string;
    newsletter?: boolean;
  };
  
  /**
   * Notiz zur Konvertierung
   */
  note?: string;
  
  /**
   * Option, ob ein Termin erstellt werden soll
   */
  createAppointment?: boolean;
  
  /**
   * Termindaten (wenn createAppointment true ist)
   */
  appointmentData?: {
    title?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    duration?: number;
    location?: string;
    description?: string;
  };
}

/**
 * DTO für die Antwort mit Anfrageinformationen
 */
export interface RequestResponseDto extends BaseResponseDto {
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
   * Status-Label (formatiert)
   */
  statusLabel: string;
  
  /**
   * CSS-Klasse für Status
   */
  statusClass: string;
  
  /**
   * ID des bearbeitenden Benutzers
   */
  processorId?: number;
  
  /**
   * Name des bearbeitenden Benutzers
   */
  processorName?: string;
  
  /**
   * ID des zugeordneten Kunden
   */
  customerId?: number;
  
  /**
   * Name des zugeordneten Kunden
   */
  customerName?: string;
  
  /**
   * ID des zugeordneten Termins
   */
  appointmentId?: number;
  
  /**
   * Titel des zugeordneten Termins
   */
  appointmentTitle?: string;
  
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
}

/**
 * DTO für die detaillierte Antwort mit Anfrageinformationen
 */
export interface RequestDetailResponseDto extends RequestResponseDto {
  /**
   * Notizen zur Anfrage
   */
  notes: RequestNoteDto[];
  
  /**
   * Kundeninformationen (wenn zugeordnet)
   */
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  
  /**
   * Termininformationen (wenn zugeordnet)
   */
  appointment?: {
    id: number;
    title: string;
    appointmentDate: string;
    status: string;
  };
  
  /**
   * Aktivitätsprotokoll
   */
  activityLogs?: Array<any>;
}

/**
 * Filterparameter für Kontaktanfragen
 */
export interface RequestFilterParamsDto extends BaseFilterParamsDto {
  /**
   * Status
   */
  status?: RequestStatus;
  
  /**
   * Angefragter Service
   */
  service?: string;
  
  /**
   * ID des bearbeitenden Benutzers
   */
  processorId?: number;
  
  /**
   * ID des zugehörigen Kunden
   */
  customerId?: number;
  
  /**
   * Nur nicht zugewiesene Anfragen
   */
  unassigned?: boolean;
  
  /**
   * Nur Anfragen, die keinem Kunden zugeordnet sind
   */
  notConverted?: boolean;
  
  /**
   * Filter by source
   */
  source?: RequestSource;
}

/**
 * Konvertiert ein ContactRequest-Objekt in ein RequestDto
 * 
 * @param request - ContactRequest-Objekt
 * @returns RequestDto
 */
export function mapRequestToDto(request: ContactRequest): RequestDto {
  return {
    id: request.id,
    name: request.name,
    email: request.email,
    phone: request.phone,
    service: request.service,
    message: request.message,
    status: request.status,
    processorId: request.processorId,
    customerId: request.customerId,
    appointmentId: request.appointmentId,
    ipAddress: request.ipAddress,
    source: request.source,
    metadata: request.metadata,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
}
