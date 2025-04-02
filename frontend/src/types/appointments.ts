export interface Appointment {
  id: number;
  titel: string;
  kunde_id?: number | null;
  kunde_name: string;
  projekt_id?: number | null;
  projekt_titel: string;
  termin_datum: string;
  dateFormatted: string;
  termin_zeit: string;
  timeFormatted: string;
  dauer: number;
  ort?: string | null;
  beschreibung?: string | null;
  status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
  statusLabel: string;
  statusClass: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  titel: string;
  kunde_id?: number | null;
  projekt_id?: number | null;
  termin_datum: string;
  termin_zeit: string;
  dauer?: number;
  ort?: string | null;
  beschreibung?: string | null;
  status?: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
}

export interface AppointmentUpdate {
  titel?: string;
  kunde_id?: number | null;
  projekt_id?: number | null;
  termin_datum?: string;
  termin_zeit?: string;
  dauer?: number;
  ort?: string | null;
  beschreibung?: string | null;
  status?: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
}

export interface AppointmentNote {
  note: string;
}

export interface AppointmentStatusUpdate {
  status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
  note?: string;
}

export interface AppointmentWithDetails extends Appointment {
  notes: {
    id: number;
    text: string;
    userName: string;
    formattedDate: string;
    createdAt: string;
  }[];
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  project?: {
    id: number;
    title: string;
    status: string;
  };
}
