import { IBaseService, ServiceOptions } from './IBaseService';
import { Appointment } from '../entities/Appointment';
import { 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentResponseDto,
  AppointmentDetailResponseDto,
  UpdateAppointmentStatusDto
} from '../dtos/AppointmentDtos';

/**
 * Service-Interface für Terminverwaltung
 */
export interface IAppointmentService extends IBaseService<
  Appointment,
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentResponseDto
> {
  /**
   * Holt einen Termin mit Details
   * 
   * @param id - Termin-ID
   * @param options - Service-Optionen
   * @returns Termin mit Details
   */
  getAppointmentDetails(id: number, options?: ServiceOptions): Promise<AppointmentDetailResponseDto | null>;
  
  /**
   * Findet Termine für einen Kunden
   * 
   * @param customerId - Kunden-ID
   * @param options - Service-Optionen
   * @returns Liste von Terminen
   */
  findByCustomer(customerId: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
  
  /**
   * Findet Termine für einen Datumsbereich
   * 
   * @param startDate - Startdatum (YYYY-MM-DD)
   * @param endDate - Enddatum (YYYY-MM-DD)
   * @param options - Service-Optionen
   * @returns Liste von Terminen
   */
  findByDateRange(startDate: string, endDate: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
  
  /**
   * Aktualisiert den Status eines Termins
   * 
   * @param id - Termin-ID
   * @param statusData - Status-Update-Daten
   * @param options - Service-Optionen
   * @returns Aktualisierter Termin
   */
  updateStatus(id: number, statusData: UpdateAppointmentStatusDto, options?: ServiceOptions): Promise<AppointmentResponseDto>;
  
  /**
   * Fügt eine Notiz zu einem Termin hinzu
   * 
   * @param id - Termin-ID
   * @param note - Notiz
   * @param options - Service-Optionen
   * @returns Erfolg der Operation
   */
  addNote(id: number, note: string, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Holt bevorstehende Termine
   * 
   * @param limit - Optionale Begrenzung der Anzahl
   * @param options - Service-Optionen
   * @returns Liste von Terminen
   */
  getUpcoming(limit?: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
}