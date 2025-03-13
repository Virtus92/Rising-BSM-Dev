export interface ProjectModel {
    id: number;
    titel: string;
    kunde_id: number;
    kunde_name: string;
    dienstleistung_id?: number;
    dienstleistung?: string;
    start_datum: string;
    end_datum?: string;
    betrag?: number;
    beschreibung?: string;
    status: 'neu' | 'in_bearbeitung' | 'abgeschlossen' | 'storniert';
    statusLabel: string;
    statusClass: string;
    created_at: string;
    updated_at?: string;
  }
  
  export interface ProjectFormData {
    titel: string;
    kunde_id: number;
    dienstleistung_id?: number;
    start_datum: string;
    end_datum?: string;
    betrag?: number;
    beschreibung?: string;
    status: 'neu' | 'in_bearbeitung' | 'abgeschlossen' | 'storniert';
  }