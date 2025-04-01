# Datenmodelle

Diese Dokumentation bietet einen detaillierten Überblick über die Datenmodelle (Prisma-Schema) und TypeScript-Interfaces, die im Backend verwendet werden.

## Inhaltsverzeichnis

1. [Übersicht der Datenmodelle](#übersicht-der-datenmodelle)
2. [Benutzer & Authentifizierung](#benutzer--authentifizierung)
3. [Kunden & CRM](#kunden--crm)
4. [Projekte](#projekte)
5. [Termine](#termine)
6. [Dienstleistungen](#dienstleistungen)
7. [Finanzen & Rechnungen](#finanzen--rechnungen)
8. [Kontaktanfragen & Kommunikation](#kontaktanfragen--kommunikation)
9. [Benachrichtigungen](#benachrichtigungen)
10. [Systemeinstellungen](#systemeinstellungen)
11. [TypeScript-Interfaces](#typescript-interfaces)

## Übersicht der Datenmodelle

Die Anwendung verwendet Prisma ORM für die Datenbankinteraktion mit PostgreSQL als Datenbank-Backend. Die Datenmodelle sind in logische Gruppen unterteilt, die verschiedene Aspekte des Geschäftsmanagements abdecken.

## Benutzer & Authentifizierung

### User

```prisma
model User {
  id                Int                @id @default(autoincrement())
  name              String             @db.VarChar(100)
  email             String             @unique @db.VarChar(100)
  password          String             @db.VarChar(100)
  role              String             @default("employee") @db.VarChar(20)
  phone             String?            @db.VarChar(30)
  status            String             @default("active") @db.Text
  profilePicture    String?            @db.VarChar(255)
  createdAt         DateTime           @default(now()) @db.Timestamp(6)
  updatedAt         DateTime           @updatedAt @db.Timestamp(6)
  createdBy         Int?                             
  updatedBy         Int?
  lastLoginAt       DateTime?
  resetToken        String?
  resetTokenExpiry  DateTime?
  settings          UserSettings?
  activities        UserActivity[]
  projects          Project[]
  appointments      Appointment[]
  refreshTokens     RefreshToken[]
  serviceLogs       ServiceLog[]
  customerLogs      CustomerLog[]
  requestLogs       RequestLog[]
  projectNotes      ProjectNote[]
  requestNotes      RequestNote[]
  appointmentNotes  AppointmentNote[]
  appointmentLogs   AppointmentLog[]

  @@index([email])
  @@index([name])
}
```

Beschreibung:
- Zentrale Entität für Benutzer des Systems
- Enthält grundlegende Benutzerinformationen wie Name, E-Mail und Passwort
- Verschiedene Benutzerrollen (Standard: "employee")
- Implementiert weiche Löschung über den Status (active/inactive)
- Speichert Protokollinformationen (Erstellung, Aktualisierung)
- Speichert Sicherheitsinformationen für Passwortwiederherstellung
- Hat Beziehungen zu vielen anderen Entitäten für Aktionen und Besitz

### UserSettings

```prisma
model UserSettings {
  id                  Int      @id @default(autoincrement())
  userId              Int      @unique
  darkMode            Boolean  @default(false)
  emailNotifications  Boolean  @default(true)
  pushNotifications   Boolean  @default(false)
  language            String   @default("de") @db.VarChar(10)
  notificationInterval String   @default("immediate") @db.VarChar(20)
  createdAt           DateTime @default(now()) @db.Timestamp(6)
  updatedAt           DateTime @updatedAt @db.Timestamp(6)
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Beschreibung:
- Benutzerspezifische Einstellungen für UI-Präferenzen und Benachrichtigungen
- 1:1-Beziehung mit User-Modell
- Speichert Einstellungen für Dark Mode, Sprache und Benachrichtigungspräferenzen
- Kaskadenlöschen bei Benutzerlöschung

### UserActivity

```prisma
model UserActivity {
  id        Int       @id @default(autoincrement())
  userId    Int
  timestamp DateTime? @default(now()) @db.Timestamp(6)
  activity  String    @db.VarChar(255)
  ipAddress String?   @db.VarChar(255)
  user      User      @relation(fields: [userId], references: [id])
}
```

Beschreibung:
- Protokolliert Benutzeraktivitäten im System
- Speichert Zeitstempel, Aktivitätsbeschreibung und IP-Adresse
- Dient zur Nachverfolgung und Auditierung

### UserSession

```prisma
model UserSession {
  sid    String   @id @db.VarChar
  sess   Json
  expire DateTime @db.Timestamp(6)
}
```

Beschreibung:
- Verwaltet aktive Benutzersitzungen
- Speichert Sitzungsdaten als JSON
- Enthält Ablaufzeiten für Sitzungen

### RefreshToken

```prisma
model RefreshToken {
  token           String    @id
  userId          Int
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  createdByIp     String?
  isRevoked       Boolean   @default(false)
  revokedAt       DateTime?
  revokedByIp     String?
  replacedByToken String?
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Beschreibung:
- Verwaltet Refresh-Tokens für die JWT-Authentifizierung
- Implementiert Token-Rotation und Widerrufverfolgung
- Speichert IP-Adressen für die Sicherheitsprotokollierung
- Kaskadenlöschen bei Benutzerlöschung

## Kunden & CRM

### Customer

```prisma
model Customer {
  id           Int            @id @default(autoincrement())
  name         String         @db.VarChar(100)
  company      String?        @db.VarChar(100)
  email        String?        @db.VarChar(100)
  phone        String?        @db.VarChar(30)
  address      String?        @db.Text
  postalCode   String?        @db.VarChar(10)
  city         String?        @db.VarChar(100)
  country      String         @default("Austria") @db.VarChar(100)
  notes        String?        @db.Text
  newsletter   Boolean        @default(false)
  status       String         @default("active") @db.VarChar(20)
  type         String         @default("private") @db.VarChar(20)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  createdBy    Int? 
  updatedBy    Int?
  projects     Project[]
  appointments Appointment[]
  invoices     Invoice[]
  logs         CustomerLog[]

  @@index([email])
  @@index([status])
}
```

Beschreibung:
- Zentrale Entität für Kundeninformationen
- Unterstützt sowohl Privat- als auch Geschäftskunden (type-Feld)
- Speichert Kontaktdaten und Adressen
- Verfolgt Marketing-Zustimmungen (newsletter)
- Implementiert weiche Löschung (status)
- Hat Beziehungen zu Projekten, Terminen und Rechnungen

### CustomerLog

```prisma
model CustomerLog {
  id         Int      @id @default(autoincrement())
  customerId Int
  userId     Int?
  userName   String   @db.Text
  action     String   @db.Text
  details    String?  @db.Text
  createdAt  DateTime @default(now()) @db.Timestamp(6)
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
}
```

Beschreibung:
- Protokolliert Änderungen an Kundendaten
- Speichert Aktionen, die an einem Kundendatensatz durchgeführt wurden
- Verweist auf den ausführenden Benutzer (wenn vorhanden)
- Kaskadenlöschen bei Kundenlöschung

## Projekte

### Project

```prisma
model Project {
  id          Int            @id @default(autoincrement())
  title       String         @db.VarChar(200)
  customerId  Int?
  serviceId   Int?
  startDate   DateTime?      @db.Date
  endDate     DateTime?      @db.Date
  amount      Decimal?       @db.Decimal
  description String?        @db.Text
  status      String         @default("new") @db.VarChar(20)
  createdBy   Int?
  createdAt   DateTime       @default(now()) @db.Timestamp(6)
  updatedAt   DateTime       @updatedAt @db.Timestamp(6)
  customer    Customer?      @relation(fields: [customerId], references: [id])
  service     Service?       @relation(fields: [serviceId], references: [id])
  creator     User?          @relation(fields: [createdBy], references: [id])
  invoices    Invoice[]
  appointments Appointment[]
  notes       ProjectNote[]
}
```

Beschreibung:
- Verwaltet Kundenprojekte
- Verbindet einen Kunden mit einer spezifischen Dienstleistung
- Enthält Projektdetails, Start- und Enddaten
- Verfolgt den Projektstatus (neu, in Bearbeitung, abgeschlossen usw.)
- Hat Beziehungen zu Rechnungen, Terminen und Notizen

### ProjectNote

```prisma
model ProjectNote {
  id        Int      @id @default(autoincrement())
  projectId Int?
  userId    Int?
  userName  String   @db.Text
  text      String   @db.Text
  createdAt DateTime @default(now()) @db.Timestamp(6)
  project   Project? @relation(fields: [projectId], references: [id])
  user      User?    @relation(fields: [userId], references: [id])
}
```

Beschreibung:
- Speichert Notizen zu Projekten
- Enthält den Notiztext und den zugehörigen Benutzer
- Behält das Erstellungsdatum bei

### ProjectLog

```prisma
model ProjectLog {
  id        Int      @id @default(autoincrement())
  projectId Int
  userId    Int
  userName  String
  action    String
  details   String?
  createdAt DateTime @default(now())
}
```

Beschreibung:
- Protokolliert Änderungen an Projektdaten
- Verfolgt Aktionen, die an einem Projekt durchgeführt wurden
- Speichert Details zur Änderung

## Termine

### Appointment

```prisma
model Appointment {
  id              Int               @id @default(autoincrement())
  title           String            @db.VarChar(200)
  customerId      Int?
  projectId       Int?
  appointmentDate DateTime          @db.Timestamp(6)
  duration        Int?
  location        String?           @db.VarChar(200)
  description     String?           @db.Text
  status          String            @default("planned") @db.VarChar(20)
  createdBy       Int?
  createdAt       DateTime          @default(now()) @db.Timestamp(6)
  updatedAt       DateTime          @updatedAt @db.Timestamp(6)
  customer        Customer?         @relation(fields: [customerId], references: [id])
  project         Project?          @relation(fields: [projectId], references: [id])
  creator         User?             @relation(fields: [createdBy], references: [id])
  notes           AppointmentNote[]

  @@index([customerId])
  @@index([appointmentDate])
  @@index([status])
}
```

Beschreibung:
- Verwaltet Kundentermine und interne Meetings
- Kann an einen Kunden und/oder ein Projekt angehängt werden
- Speichert Datum, Dauer und Ortsdetails
- Verfolgt Terminstatus (geplant, bestätigt, abgeschlossen usw.)
- Hat Indizes für schnelle Suche nach Datum und Status

### AppointmentNote

```prisma
model AppointmentNote {
  id            Int         @id @default(autoincrement())
  appointmentId Int
  userId        Int
  userName      String      @db.VarChar(100)
  text          String      @db.Text
  createdAt     DateTime    @default(now()) @db.Timestamp(6)
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  user          User        @relation(fields: [userId], references: [id])
}
```

Beschreibung:
- Speichert Notizen zu Terminen
- Enthält den Notiztext und den zugehörigen Benutzer
- Behält das Erstellungsdatum bei

### AppointmentLog

```prisma
model AppointmentLog {
  id            Int      @id @default(autoincrement())
  appointmentId Int
  userId        Int
  userName      String   @db.Text
  action        String   @db.Text
  details       String?  @db.Text
  createdAt     DateTime @default(now()) @db.Timestamp(6)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Beschreibung:
- Protokolliert Änderungen an Termindaten
- Verfolgt Aktionen, die an einem Termin durchgeführt wurden
- Speichert Details zur Änderung

## Dienstleistungen

### Service

```prisma
model Service {
  id           Int               @id @default(autoincrement())
  name         String            @db.VarChar(100)
  description  String?           @db.Text
  basePrice    Decimal           @db.Decimal
  vatRate      Decimal           @default(20.00) @db.Decimal
  active       Boolean           @default(true)
  unit         String?           @db.VarChar(20)
  createdAt    DateTime          @default(now()) @db.Timestamp(6)
  updatedAt    DateTime          @updatedAt @db.Timestamp(6)
  projects     Project[]
  invoiceItems InvoiceItem[]
  logs         ServiceLog[]
}
```

Beschreibung:
- Verwaltet angebotene Dienstleistungen
- Speichert Preisdetails und Mehrwertsteuersätze
- Enthält optionale Maßeinheiten für die Dienstleistung
- Hat einen aktiv/inaktiv-Status für die Steuerung der Verfügbarkeit
- Wird in Projekten und Rechnungspositionen verwendet

### ServiceLog

```prisma
model ServiceLog {
  id          Int      @id @default(autoincrement())
  serviceId   Int
  userId      Int?
  userName    String?  @db.VarChar(255)
  action      String   @db.VarChar(255)
  details     String?  @db.Text
  createdAt   DateTime @default(now()) @db.Timestamp(6)
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  service     Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
}
```

Beschreibung:
- Protokolliert Änderungen an Dienstleistungsdaten
- Verfolgt Aktionen, die an einer Dienstleistung durchgeführt wurden
- Speichert Details zur Änderung

## Finanzen & Rechnungen

### Invoice

```prisma
model Invoice {
  id              Int           @id @default(autoincrement())
  invoiceNumber   String        @db.VarChar(50)
  projectId       Int?
  customerId      Int?
  amount          Decimal       @db.Decimal
  vatAmount       Decimal       @db.Decimal
  totalAmount     Decimal       @db.Decimal
  invoiceDate     DateTime      @db.Date
  dueDate         DateTime      @db.Date
  paidAt          DateTime?     @db.Timestamp(6)
  status          String        @default("open") @db.VarChar(20)
  createdAt       DateTime      @default(now()) @db.Timestamp(6)
  updatedAt       DateTime      @updatedAt @db.Timestamp(6)
  items           InvoiceItem[]
  project         Project?      @relation(fields: [projectId], references: [id])
  customer        Customer?     @relation(fields: [customerId], references: [id])

  @@index([invoiceDate], name: "idx_invoice_date")
}
```

Beschreibung:
- Verwaltet Kundenrechnungen
- Kann an ein Projekt und/oder einen Kunden angehängt werden
- Enthält Beträge, Mehrwertsteuerbeträge und Gesamtsummen
- Verfolgt Rechnungsstatus (offen, bezahlt usw.)
- Hat Indizes für schnelle Suche nach Datum

### InvoiceItem

```prisma
model InvoiceItem {
  id         Int      @id @default(autoincrement())
  invoiceId  Int
  serviceId  Int
  quantity   Int
  unitPrice  Decimal  @db.Decimal
  createdAt  DateTime @default(now()) @db.Timestamp(6)
  updatedAt  DateTime @updatedAt @db.Timestamp(6)
  invoice    Invoice  @relation(fields: [invoiceId], references: [id])
  service    Service  @relation(fields: [serviceId], references: [id])
}
```

Beschreibung:
- Repräsentiert einzelne Positionen auf einer Rechnung
- Verknüpft eine Dienstleistung mit einer Rechnung
- Speichert Mengen und Einzelpreise
- Erlaubt eine detaillierte Rechnungsstellung

## Kontaktanfragen & Kommunikation

### ContactRequest

```prisma
model ContactRequest {
  id          Int           @id @default(autoincrement())
  name        String        @db.VarChar(100)
  email       String        @db.VarChar(100)
  phone       String?       @db.VarChar(30)
  service     String        @db.VarChar(50)
  message     String        @db.Text
  status      String        @default("new") @db.VarChar(20)
  processorId Int?
  ipAddress   String?       @db.VarChar(255)
  createdAt   DateTime      @default(now()) @db.Timestamp(6)
  updatedAt   DateTime      @updatedAt @db.Timestamp(6)
  notes       RequestNote[]
}
```

Beschreibung:
- Speichert Kontaktanfragen von der Website
- Enthält Basisinformationen zum Interessenten
- Verfolgt den Status der Anfrage (neu, in Bearbeitung, abgeschlossen)
- Speichert optional die IP-Adresse für Sicherheits- und Missbrauchsprävention

### RequestNote

```prisma
model RequestNote {
  id        Int           @id @default(autoincrement())
  requestId Int
  userId    Int
  userName  String        @db.VarChar(100)
  text      String        @db.Text
  createdAt DateTime      @default(now()) @db.Timestamp(6)
  request   ContactRequest @relation(fields: [requestId], references: [id])
  user      User          @relation(fields: [userId], references: [id])
}
```

Beschreibung:
- Speichert Notizen zu Kontaktanfragen
- Enthält den Notiztext und den zugehörigen Benutzer
- Behält das Erstellungsdatum bei

### RequestLog

```prisma
model RequestLog {
  id        Int      @id @default(autoincrement())
  requestId Int
  userId    Int
  userName  String   @db.VarChar(255)
  action    String   @db.VarChar(255)
  details   String?  @db.Text
  createdAt DateTime @default(now()) @db.Timestamp(6)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Beschreibung:
- Protokolliert Änderungen an Kontaktanfragedaten
- Verfolgt Aktionen, die an einer Anfrage durchgeführt wurden
- Speichert Details zur Änderung

## Benachrichtigungen

### Notification

```prisma
model Notification {
  id            Int       @id @default(autoincrement())
  userId        Int?
  referenceId   Int?
  referenceType String?   @db.VarChar(50)
  type          String    @db.VarChar(20)
  title         String    @db.VarChar(100)
  message       String?   @db.Text
  description   String?   @db.Text
  read          Boolean   @default(false)
  createdAt     DateTime  @default(now()) @db.Timestamp(6)
  updatedAt     DateTime  @updatedAt
  createdBy     Int?
  updatedBy     Int?
}
```

Beschreibung:
- Verwaltet Benutzerbenachrichtigungen
- Kann mit verschiedenen Entitätstypen verknüpft werden (referenceType)
- Enthält Titel, Nachricht und detaillierte Beschreibung
- Verfolgt den Lesestatus
- Speichert Erstellungs- und Aktualisierungsdetails

## Systemeinstellungen

### SystemSettings

```prisma
model SystemSettings {
  id          Int      @id @default(autoincrement())
  key         String   @unique @db.VarChar(100)
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Beschreibung:
- Speichert anwendungsweite Konfigurationseinstellungen
- Verwendet ein Key-Value-Format mit optionaler Beschreibung
- Speichert Erstellungs- und Aktualisierungsdetails

## TypeScript-Interfaces

Das Backend verwendet TypeScript-Interfaces, die den Prisma-Modellen entsprechen. Hier sind einige der wichtigsten Interfaces:

### Benutzer-Interfaces

```typescript
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

export interface IUser {
  id: number;
  name: string;
  email: string;
  password?: string; // Optional in responses
  role: UserRole;
  phone?: string;
  status: UserStatus;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
  lastLoginAt?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

export interface IUserSettings {
  id: number;
  userId: number;
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  notificationInterval: 'immediate' | 'daily' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
}
```

### Kunden-Interfaces

```typescript
export enum CustomerType {
  PRIVATE = 'private',
  BUSINESS = 'business'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LEAD = 'lead'
}

export interface ICustomer {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country: string;
  notes?: string;
  newsletter: boolean;
  status: CustomerStatus;
  type: CustomerType;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}
```

### Projekt-Interfaces

```typescript
export enum ProjectStatus {
  NEW = 'new',
  IN_PROGRESS = 'in-progress',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface IProject {
  id: number;
  title: string;
  customerId?: number;
  serviceId?: number;
  startDate?: Date;
  endDate?: Date;
  amount?: number;
  description?: string;
  status: ProjectStatus;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Termin-Interfaces

```typescript
export enum AppointmentStatus {
  PLANNED = 'planned',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export interface IAppointment {
  id: number;
  title: string;
  customerId?: number;
  projectId?: number;
  appointmentDate: Date;
  duration?: number;
  location?: string;
  description?: string;
  status: AppointmentStatus;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Dienstleistungs-Interfaces

```typescript
export interface IService {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  vatRate: number;
  active: boolean;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rechnungs-Interfaces

```typescript
export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export interface IInvoice {
  id: number;
  invoiceNumber: string;
  projectId?: number;
  customerId?: number;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  invoiceDate: Date;
  dueDate: Date;
  paidAt?: Date;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceItem {
  id: number;
  invoiceId: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Anfragen-Interfaces

```typescript
export enum RequestStatus {
  NEW = 'new',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CUSTOMER_CONVERTED = 'customer-converted',
  CANCELLED = 'cancelled'
}

export interface IContactRequest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  status: RequestStatus;
  processorId?: number;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Benachrichtigungs-Interfaces

```typescript
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export interface INotification {
  id: number;
  userId?: number;
  referenceId?: number;
  referenceType?: string;
  type: NotificationType;
  title: string;
  message?: string;
  description?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}
```

Diese Dokumentation bietet einen umfassenden Überblick über die Datenmodelle und TypeScript-Interfaces im Backend. Die Modelle sind nach Funktionsbereichen gruppiert und enthalten detaillierte Beschreibungen der einzelnen Felder, Beziehungen und Indizes.