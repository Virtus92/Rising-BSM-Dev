export interface CustomerModel {
    id: number;
    name: string;
    firma?: string;
    email: string;
    telefon?: string;
    adresse?: string;
    plz?: string;
    ort?: string;
    status: 'aktiv' | 'inaktiv' | 'geloescht';
    statusLabel: string;
    statusClass: string;
    kundentyp: 'privat' | 'geschaeft';
    kundentypLabel: string;
    notizen?: string;
    newsletter?: boolean;
    created_at: string;
    updated_at?: string;
  }
  
  export interface CustomerFormData {
    name: string;
    firma?: string;
    email: string;
    telefon?: string;
    adresse?: string;
    plz?: string;
    ort?: string;
    kundentyp: 'privat' | 'geschaeft';
    status?: 'aktiv' | 'inaktiv';
    notizen?: string;
    newsletter?: boolean;
  }