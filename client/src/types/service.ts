export interface ServiceModel {
    id: number;
    name: string;
    beschreibung?: string;
    preis_basis: number;
    einheit: string;
    mwst_satz: number;
    aktiv: boolean;
    created_at: string;
    updated_at?: string;
  }
  
  export interface ServiceFormData {
    name: string;
    beschreibung?: string;
    preis_basis: number;
    einheit: string;
    mwst_satz: number;
    aktiv: boolean;
  }