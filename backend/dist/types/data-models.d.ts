export interface CustomerData {
    name: string;
    firma?: string;
    email: string;
    telefon?: string;
    adresse?: string;
    plz?: string;
    ort?: string;
    notizen?: string;
    newsletter?: boolean | string;
    status?: string;
    kundentyp?: string;
}
export interface ProjectData {
    titel: string;
    kunde_id?: string | number | null;
    dienstleistung_id?: string | number | null;
    start_datum: string;
    end_datum?: string | null;
    betrag?: string | number | null;
    beschreibung?: string | null;
    status?: string;
}
export interface AppointmentData {
    titel: string;
    kunde_id?: string | number | null;
    projekt_id?: string | number | null;
    termin_datum: string;
    termin_zeit: string;
    dauer?: string | number;
    ort?: string | null;
    beschreibung?: string | null;
    status?: string;
}
export interface ServiceData {
    name: string;
    beschreibung?: string | null;
    preis_basis: number;
    einheit: string;
    mwst_satz?: number;
    aktiv?: boolean | string;
}
export interface RequestNoteData {
    requestId: number;
    text: string;
}
export interface ProjectNoteData {
    projectId: number;
    text: string;
}
export interface AppointmentNoteData {
    appointmentId: number;
    text: string;
}
export interface UserData {
    name: string;
    email: string;
    password?: string;
    role?: string;
    phone?: string;
    status?: string;
}
export interface UserSettingsData {
    language?: string;
    darkMode?: boolean | string;
    emailNotifications?: boolean | string;
    pushNotifications?: boolean | string;
    notificationInterval?: string;
}
export interface StatusUpdateData {
    id: number;
    status: string;
    note?: string;
}
export interface NotificationData {
    userId: number | null;
    type: string;
    title: string;
    message: string;
    referenceId?: number | null;
    referenceType?: string | null;
}
export interface BackupSettingsData {
    automatisch: boolean | string;
    intervall: string;
    zeit: string;
    aufbewahrung: number;
}
export interface ContactRequestData {
    name: string;
    email: string;
    phone?: string;
    service: string;
    message: string;
}
export interface LoginData {
    email: string;
    password: string;
    remember?: boolean | string;
}
export interface PasswordResetData {
    password: string;
    confirmPassword: string;
}
