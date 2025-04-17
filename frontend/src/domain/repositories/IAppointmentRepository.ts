import { IBaseRepository, PaginationResult } from './IBaseRepository';
import { Appointment } from '../entities/Appointment';
import { AppointmentNote } from '../entities/AppointmentNote';
import { AppointmentFilterParamsDto } from '../dtos/AppointmentDtos';

/**
 * Repository-Interface für Termine
 */
export interface IAppointmentRepository extends IBaseRepository<Appointment> {
  /**
   * Findet Termine für einen Kunden
   * 
   * @param customerId - Kunden-ID
   * @returns Termine des Kunden
   */
  findByCustomer(customerId: number): Promise<Appointment[]>;
  
  /**
   * Findet Termine für einen Datumsbereich
   * 
   * @param startDate - Startdatum
   * @param endDate - Enddatum
   * @returns Termine im angegebenen Zeitraum
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  
  /**
   * Findet Termine für einen bestimmten Tag
   * 
   * @param date - Datum
   * @returns Termine für den angegebenen Tag
   */
  findByDate(date: Date): Promise<Appointment[]>;
  
  /**
   * Findet bevorstehende Termine
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Bevorstehende Termine
   */
  findUpcoming(limit?: number): Promise<Appointment[]>;
  
  /**
   * Findet Termine mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefilterte Termine mit Paginierung
   */
  findAppointments(filters: AppointmentFilterParamsDto): Promise<PaginationResult<Appointment>>;
  
  /**
   * Aktualisiert den Status eines Termins
   * 
   * @param id - Termin-ID
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierter Termin
   */
  updateStatus(id: number, status: string, updatedBy?: number): Promise<Appointment>;
  
  /**
   * Findet einen Termin mit allen Beziehungen
   * 
   * @param id - Termin-ID
   * @returns Termin mit Beziehungen
   */
  findByIdWithRelations(id: number | string): Promise<Appointment | null>;
  
  /**
   * Erstellt eine Notiz zu einem Termin
   * 
   * @param appointmentId - Termin-ID
   * @param userId - Benutzer-ID
   * @param text - Notiztext
   * @returns Erstellte Notiz
   */
  addNote(appointmentId: number, userId: number, text: string): Promise<AppointmentNote>;
  
  /**
   * Findet Notizen zu einem Termin
   * 
   * @param appointmentId - Termin-ID
   * @returns Notizen zum Termin
   */
  findNotes(appointmentId: number): Promise<AppointmentNote[]>;
}