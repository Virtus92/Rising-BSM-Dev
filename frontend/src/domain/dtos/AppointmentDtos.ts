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
  
  // Helper function to safely extract date and time from any date format
  const extractDateAndTime = (dateValue: any): { date: string, time: string } => {
    // If it's a Date object
    if (dateValue instanceof Date) {
      const isoString = dateValue.toISOString();
      const dateParts = isoString.split('T');
      return {
        date: dateParts[0],
        time: dateParts[1].substring(0, 5)
      };
    }
    // If it's an ISO string
    else if (typeof dateValue === 'string' && dateValue.indexOf('T') !== -1) {
      const dateParts = dateValue.split('T');
      return {
        date: dateParts[0],
        time: dateParts.length > 1 ? dateParts[1].substring(0, 5) : '00:00'
      };
    }
    // If it's just a date string without time
    else if (typeof dateValue === 'string') {
      return {
        date: dateValue,
        time: '00:00'
      };
    }
    // Default fallback
    return {
      date: new Date().toISOString().split('T')[0], // Today's date as fallback
      time: '00:00'
    };
  };
  
  // Safely handle appointmentDate based on its type
  if (appointment.appointmentDate) {
    const extracted = extractDateAndTime(appointment.appointmentDate);
    appointmentDate = extracted.date;
    appointmentTime = extracted.time;
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
