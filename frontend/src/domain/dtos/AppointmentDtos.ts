import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { AppointmentStatus } from '../enums/CommonEnums';
import { Appointment } from '../entities/Appointment';

/**
 * Haupt-DTO für Termine
 */
export interface AppointmentDto extends BaseResponseDto {
  title: string;
  customerId?: number;
  customerName?: string;
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
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  
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
  // Formatierung des Datums in ISO-String, falls es sich um ein Date-Objekt handelt
  const appointmentDate = appointment.appointmentDate instanceof Date
    ? appointment.appointmentDate.toISOString().split('T')[0]
    : typeof appointment.appointmentDate === 'string'
      ? appointment.appointmentDate
      : '';
      
  // Extraktion der Uhrzeit aus dem Datum
  const appointmentTime = appointment.appointmentDate instanceof Date
    ? appointment.appointmentDate.toISOString().split('T')[1].substring(0, 5)
    : '00:00';
    
  return {
    id: appointment.id,
    title: appointment.title,
    customerId: appointment.customerId,
    appointmentDate: appointmentDate,
    appointmentTime: appointmentTime,
    duration: appointment.duration || 60,
    location: appointment.location,
    description: appointment.description,
    status: appointment.status,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString()
  };
}
