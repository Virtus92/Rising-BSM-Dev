import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { AppointmentStatus } from '../enums/CommonEnums';
import { Appointment } from '../entities/Appointment';

// Ensure this module doesn't use 'use client' directive as it's used in server components

/**
 * Customer data structure used across appointment DTOs
 */
export interface AppointmentCustomerData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Haupt-DTO für Termine
 */
export interface AppointmentDto extends BaseResponseDto {
  title: string;
  customerId?: number;
  customerName?: string;
  customerData?: AppointmentCustomerData;
  appointmentDate: string | Date;
  appointmentTime: string;
  duration: number;
  location?: string;
  description?: string;
  status: AppointmentStatus;
  service?: string;
  scheduledAt?: string;
}

/**
 * DTO zum Erstellen eines Termins
 */
export interface CreateAppointmentDto {
  /**
   * Titel des Termins
   */
  title: string;
  
  /**
   * Kunden-ID (optional)
   */
  customerId?: number;
  
  /**
   * Datum des Termins (YYYY-MM-DD)
   */
  appointmentDate: string;
  
  /**
   * Uhrzeit des Termins (HH:MM)
   */
  appointmentTime: string;
  
  /**
   * Dauer in Minuten
   */
  duration?: number;
  
  /**
   * Ort des Termins
   */
  location?: string;
  
  /**
   * Beschreibung
   */
  description?: string;
  
  /**
   * Status
   */
  status?: AppointmentStatus;
  
  /**
   * Service
   */
  service?: string;
}

/**
 * DTO zum Aktualisieren eines Termins
 */
export interface UpdateAppointmentDto {
  /**
   * Titel des Termins
   */
  title?: string;
  
  /**
   * Kunden-ID
   */
  customerId?: number;
  
  /**
   * Datum des Termins (YYYY-MM-DD)
   */
  appointmentDate?: string;
  
  /**
   * Uhrzeit des Termins (HH:MM)
   */
  appointmentTime?: string;
  
  /**
   * Dauer in Minuten
   */
  duration?: number;
  
  /**
   * Ort des Termins
   */
  location?: string;
  
  /**
   * Beschreibung
   */
  description?: string;
  
  /**
   * Status
   */
  status?: AppointmentStatus;
  
  /**
   * Service
   */
  service?: string;
}

/**
 * DTO für die Antwort mit Termininformationen
 */
export interface AppointmentResponseDto extends BaseResponseDto {
  /**
   * Titel des Termins
   */
  title: string;
  
  /**
   * Kunden-ID
   */
  customerId?: number;
  
  /**
   * Kundenname
   */
  customerName?: string;
  
  /**
   * Kundeninformationen
   */
  customerData?: AppointmentCustomerData;
  
  /**
   * Datum des Termins (YYYY-MM-DD)
   */
  appointmentDate: string;
  
  /**
   * Formatiertes Datum
   */
  dateFormatted: string;
  
  /**
   * Uhrzeit des Termins (HH:MM)
   */
  appointmentTime: string;
  
  /**
   * Formatierte Uhrzeit
   */
  timeFormatted: string;
  
  /**
   * Dauer in Minuten
   */
  duration: number;
  
  /**
   * Ort des Termins
   */
  location?: string;
  
  /**
   * Beschreibung
   */
  description?: string;
  
  /**
   * Status
   */
  status: AppointmentStatus;
  
  /**
   * Status-Label
   */
  statusLabel: string;
  
  /**
   * CSS-Klasse für den Status
   */
  statusClass: string;
  
  /**
   * Service
   */
  service?: string;
  
  /**
   * Geplante Zeit
   */
  scheduledAt?: string;
}

/**
 * DTO für die Antwort mit detaillierten Termininformationen
 */
export interface AppointmentDetailResponseDto extends AppointmentResponseDto {
  /**
   * Notizen zum Termin
   */
  notes: AppointmentNoteDto[];
  
  /**
   * Kundeninformationen
   */
  customer?: AppointmentCustomerData;
  
  /**
   * Aktivitätsprotokoll
   */
  activityLogs?: Array<any>;
}

/**
 * DTO für Terminnotizen
 */
export interface AppointmentNoteDto extends BaseResponseDto {
  /**
   * Termin-ID
   */
  appointmentId: number;
  
  /**
   * Notiztext
   */
  text: string;
  
  /**
   * Benutzer-ID
   */
  userId: number;
  
  /**
   * Benutzername
   */
  userName: string;
  
  /**
   * Formatiertes Datum
   */
  formattedDate: string;
}

/**
 * DTO für die Erstellung einer Terminnotiz
 */
export interface CreateAppointmentNoteDto {
  /**
   * Termin-ID
   */
  appointmentId: number;
  
  /**
   * Notiztext
   */
  text: string;
}

/**
 * DTO für die Aktualisierung des Terminstatus
 */
export interface StatusUpdateDto {
  /**
   * Neuer Status
   */
  status: AppointmentStatus;
  
  /**
   * Optionale Notiz
   */
  note?: string;
}

/**
 * DTO für die Aktualisierung des Terminstatus
 */
export interface UpdateAppointmentStatusDto {
  /**
   * Neuer Status
   */
  status: AppointmentStatus;
  
  /**
   * Optionale Notiz
   */
  note?: string;
}

/**
 * Filterparameter für Terminabfragen
 */
export interface AppointmentFilterParamsDto extends BaseFilterParamsDto {
  /**
   * Terminstatus
   */
  status?: AppointmentStatus;
  
  /**
   * Kunden-ID
   */
  customerId?: number;
  
  /**
   * ID des erstellenden Benutzers
   */
  createdById?: number;
  
  /**
   * Nur heutige Termine
   */
  today?: boolean;
  
  /**
   * Nur zukünftige Termine
   */
  upcoming?: boolean;
  
  /**
   * Nur vergangene Termine
   */
  past?: boolean;
}

/**
 * Konvertiert ein Appointment-Objekt in ein DTO
 * 
 * @param appointment - Appointment-Objekt
 * @returns AppointmentDto
 */
export function mapAppointmentToDto(appointment: Appointment): AppointmentDto {
  // Consistently format the date to YYYY-MM-DD
  let appointmentDate = '';
  let appointmentTime = '00:00';
  
  // Safely handle appointmentDate based on its type
  if (appointment.appointmentDate) {
    // Handle Date objects
    if (appointment.appointmentDate instanceof Date) {
      const isoString = appointment.appointmentDate.toISOString();
      const dateParts = isoString.split('T');
      appointmentDate = dateParts[0];
      appointmentTime = dateParts[1].substring(0, 5);
    } 
    // Handle string values
    else if (typeof appointment.appointmentDate === 'string') {
      const dateStr = appointment.appointmentDate as string;
      if (dateStr.indexOf('T') !== -1) {
        const dateParts = dateStr.split('T');
        appointmentDate = dateParts[0];
        appointmentTime = dateParts.length > 1 ? dateParts[1].substring(0, 5) : '00:00';
      } else {
        appointmentDate = dateStr;
      }
    }
  }
  
  // Ensure duration is a number
  let duration: number = 60; // Default duration
  if (appointment.duration !== undefined && appointment.duration !== null) {
    if (typeof appointment.duration === 'string') {
      // Handle string duration - convert to number
      const parsedDuration = parseInt(appointment.duration as string, 10);
      duration = isNaN(parsedDuration) ? 60 : parsedDuration;
    } else if (typeof appointment.duration === 'number') {
      duration = appointment.duration;
    }
  }
  
  return {
    id: appointment.id,
    title: appointment.title,
    customerId: appointment.customerId,
    appointmentDate: appointmentDate,
    appointmentTime: appointmentTime,
    duration: duration,
    location: appointment.location,
    description: appointment.description,
    status: appointment.status,
    createdAt: appointment.createdAt instanceof Date 
      ? appointment.createdAt.toISOString()
      : typeof appointment.createdAt === 'string'
        ? appointment.createdAt
        : new Date().toISOString(),
    updatedAt: appointment.updatedAt instanceof Date
      ? appointment.updatedAt.toISOString()
      : typeof appointment.updatedAt === 'string'
        ? appointment.updatedAt
        : new Date().toISOString()
  };
}
