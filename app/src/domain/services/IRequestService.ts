import { IBaseService, ServiceOptions } from './IBaseService';
import { ContactRequest } from '../entities/ContactRequest';
import { Appointment } from '../entities/Appointment';
import { 
  CreateRequestDto, 
  UpdateRequestDto, 
  RequestStatusUpdateDto, 
  ConvertToCustomerDto,
  RequestFilterParamsDto, 
  RequestDetailResponseDto,
  RequestResponseDto,
  RequestNoteDto
} from '../dtos/RequestDtos';
import { AppointmentResponseDto } from '../dtos/AppointmentDtos';
import { CustomerResponseDto } from '../dtos/CustomerDtos';
import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * Service-Interface für Kontaktanfragen
 */
export interface IRequestService extends IBaseService<
  ContactRequest,
  CreateRequestDto,
  UpdateRequestDto,
  RequestResponseDto
> {
  /**
   * Erstellt eine neue Kontaktanfrage
   * 
   * @param data - Anfragedaten
   * @param options - Service-Optionen
   * @returns Erstellte Anfrage
   */
  createRequest(data: CreateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto>;
  
  /**
   * Findet alle Kontaktanfragen mit Filtern
   * 
   * @param filters - Filterparameter
   * @param options - Service-Optionen
   * @returns Gefilterte Anfragen mit Paginierung
   */
  findRequests(filters: RequestFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<RequestResponseDto>>;
  
  /**
   * Findet eine Kontaktanfrage anhand ihrer ID
   * 
   * @param id - ID der Anfrage
   * @param options - Service-Optionen
   * @returns Detaillierte Anfrageinformationen
   */
  findRequestById(id: number, options?: ServiceOptions): Promise<RequestDetailResponseDto>;
  
  /**
   * Aktualisiert eine Kontaktanfrage
   * 
   * @param id - ID der Anfrage
   * @param data - Aktualisierungsdaten
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  updateRequest(id: number, data: UpdateRequestDto, options?: ServiceOptions): Promise<RequestResponseDto>;
  
  /**
   * Aktualisiert den Status einer Kontaktanfrage
   * 
   * @param id - ID der Anfrage
   * @param data - Status-Update-Daten
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  updateRequestStatus(id: number, data: RequestStatusUpdateDto, options?: ServiceOptions): Promise<RequestResponseDto>;
  
  /**
   * Löscht eine Kontaktanfrage
   * 
   * @param id - ID der Anfrage
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  deleteRequest(id: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Fügt eine Notiz zu einer Kontaktanfrage hinzu
   * 
   * @param id - ID der Anfrage
   * @param userId - ID des Benutzers
   * @param userName - Name des Benutzers
   * @param text - Notiztext
   * @param options - Service-Optionen
   * @returns Erstellte Notiz
   */
  addNote(id: number, userId: number, userName: string, text: string, options?: ServiceOptions): Promise<RequestNoteDto>;
  
  /**
   * Weist eine Kontaktanfrage einem Benutzer zu
   * 
   * @param id - ID der Anfrage
   * @param userId - ID des Benutzers
   * @param note - Optionale Notiz
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  assignRequest(id: number, userId: number, note?: string, options?: ServiceOptions): Promise<RequestResponseDto>;
  
  /**
   * Konvertiert eine Kontaktanfrage in einen Kunden
   * 
   * @param data - Konvertierungsdaten
   * @param options - Service-Optionen
   * @returns Ergebnis der Konvertierung
   */
  convertToCustomer(data: ConvertToCustomerDto, options?: ServiceOptions): Promise<{
    customer: CustomerResponseDto;
    appointment?: AppointmentResponseDto;
    request: RequestResponseDto;
  }>;
  
  /**
   * Verknüpft eine Kontaktanfrage mit einem bestehenden Kunden
   * 
   * @param requestId - ID der Anfrage
   * @param customerId - ID des Kunden
   * @param note - Optionale Notiz
   * @param options - Service-Optionen
   * @returns Aktualisierte Anfrage
   */
  linkToCustomer(requestId: number, customerId: number, note?: string, options?: ServiceOptions): Promise<RequestResponseDto>;
  
  /**
   * Erstellt einen Termin für eine Kontaktanfrage
   * 
   * @param requestId - ID der Anfrage
   * @param appointmentData - Termindaten
   * @param note - Optionale Notiz
   * @param options - Service-Optionen
   * @returns Erstellter Termin
   */
  createAppointmentForRequest(requestId: number, appointmentData: Partial<Appointment>, note?: string, options?: ServiceOptions): Promise<AppointmentResponseDto>;
  
  /**
   * Ruft Statistiken zu Kontaktanfragen ab
   * 
   * @param period - Zeitraum (week, month, year)
   * @param options - Service-Optionen
   * @returns Statistiken
   */
  getRequestStats(period?: string, options?: ServiceOptions): Promise<{
    totalRequests: number;
    newRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    conversionRate: number;
  }>;
}