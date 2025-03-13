export interface AppointmentModel {
  id: number;
  titel: string;
  kunde_id: number;
  kunde_name: string;
  projekt_id: number | null;
  projekt_titel: string | null;
  termin_datum: string;
  dateFormatted: string;
  timeFormatted: string;
  dauer: number;
  ort: string;
  status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
  statusLabel: string;
  statusClass: string;
  beschreibung?: string;
}

export interface AppointmentFormData {
  titel: string;
  kunde_id: number;
  projekt_id?: number;
  termin_datum: string; 
  dauer: number;
  ort: string;
  status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
  beschreibung?: string;
}