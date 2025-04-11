# RISING-BSM Frontend

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3.5-38B2AC?logo=tailwind-css)

Diese README-Datei bietet eine umfassende Übersicht über das RISING-BSM Frontend-Projekt, das sowohl die Client-Anwendung als auch das Backend-for-Frontend (BFF) umfasst.

## 📋 Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Projektstruktur](#projektstruktur)
- [Architektur](#architektur)
- [Installation](#installation)
- [Entwicklung](#entwicklung)
- [Tests](#tests)
- [Wichtige Dateien und Verzeichnisse](#wichtige-dateien-und-verzeichnisse)
- [Feature-Module](#feature-module)
- [API-Endpunkte](#api-endpunkte)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Docker](#docker)
- [Bekannte Probleme und Lösungen](#bekannte-probleme-und-lösungen)

## 🔍 Übersicht

Das RISING-BSM Frontend ist eine moderne, typsichere Web-Anwendung, die mit Next.js, React und TypeScript entwickelt wurde. Es kombiniert eine öffentliche Website mit einem geschützten Dashboard-Bereich und implementiert das Backend-for-Frontend (BFF) Pattern, um die Kommunikation mit anderen Diensten zu vereinfachen.

### Hauptfunktionen

- **Öffentliche Website** mit Home, About, Services und Kontaktformular
- **Authentifizierung** mit JWT und Refresh-Token-Mechanismus
- **Dashboard** mit Statistiken und Visualisierungen
- **Kundenmanagement** zur Verwaltung von Kundendaten
- **Anfragenmanagement** zur Bearbeitung von Kundenanfragen
- **Terminmanagement** zur Planung von Kundenterminen
- **Benutzer- und Rechteverwaltung**
- **API-Routen** als Backend-for-Frontend

## 🏗️ Projektstruktur

Die Anwendung folgt einer modularen, Feature-orientierten Architektur:

```
frontend/
├── src/
│   ├── app/              # Next.js App Router Struktur
│   │   ├── api/          # API Routes (BFF)
│   │   ├── auth/         # Authentifizierungsseiten
│   │   ├── dashboard/    # Dashboard-Seiten
│   │   └── page.tsx      # Home-Page (Landingpage)
│   ├── domain/           # Domänenmodell
│   │   ├── dtos/         # Data Transfer Objects
│   │   ├── entities/     # Entitäten
│   │   ├── enums/        # Enumerationen
│   │   ├── repositories/ # Repository-Interfaces
│   │   └── services/     # Service-Interfaces
│   ├── features/         # Feature-Module
│   │   ├── appointments/ # Terminverwaltung
│   │   ├── auth/         # Authentifizierung
│   │   ├── customers/    # Kundenverwaltung
│   │   ├── dashboard/    # Dashboard
│   │   ├── home/         # Homepage-Komponenten
│   │   ├── notifications/# Benachrichtigungen
│   │   ├── requests/     # Anfragenverwaltung
│   │   └── users/        # Benutzerverwaltung
│   ├── infrastructure/   # Infrastruktur-Code
│   │   ├── api/          # API-Clients
│   │   ├── auth/         # Auth-Implementierungen
│   │   ├── clients/      # Service-Implementierungen
│   │   ├── common/       # Gemeinsame Infrastruktur
│   │   ├── repositories/ # Repository-Implementierungen
│   │   └── services/     # Service-Implementierungen
│   ├── shared/           # Shared-Komponenten und Utilities
│   │   ├── components/   # UI-Komponenten
│   │   ├── contexts/     # React Kontexte
│   │   ├── hooks/        # Custom Hooks
│   │   ├── layouts/      # Layout-Komponenten
│   │   ├── providers/    # Provider-Komponenten
│   │   └── utils/        # Utility-Funktionen
│   └── types/            # TypeScript Typdefinitionen
├── prisma/               # Prisma ORM Schema und Migrationen
├── public/               # Statische Assets
└── ...                   # Konfigurationsdateien
```

## 🏛️ Architektur

Die Anwendung folgt dem **Domain-Driven Design (DDD)** mit klarer Schichtentrennung:

1. **Domain Layer**
   - Enthält Geschäftslogik und -regeln
   - Definiert Entitäten, DTOs, Repository-Interfaces und Service-Interfaces
   - Unabhängig von Infrastruktur und Frameworks

2. **Infrastructure Layer**
   - Implementiert Repository- und Service-Interfaces
   - Enthält Datenbankzugriff, externe API-Aufrufe und technische Implementierungen
   - Abhängig vom Domain Layer, nicht umgekehrt

3. **Features Layer**
   - Organisiert die Anwendung nach Funktionen/Features
   - Enthält UI-Komponenten, Hooks und Feature-spezifische Logik
   - Nutzt Domain- und Infrastructure-Layer

4. **Shared Layer**
   - Enthält gemeinsam genutzte Komponenten und Utilities
   - Wiederverwendbare UI-Komponenten, Hooks und Hilfsfunktionen

### Architekturprinzipien

- **Dependency Inversion**: Abhängigkeiten zeigen von außen nach innen (Infrastruktur → Domain)
- **Repository Pattern**: Abstraktion der Datenpersistenz
- **Service Layer**: Kapselung der Geschäftslogik
- **Clean Architecture**: Klare Trennung von Domäne, Anwendung und Infrastruktur

## 🚀 Installation

### Voraussetzungen

- Node.js (v18 oder höher)
- npm (v9 oder höher)
- Docker und Docker Compose (für Containerisierung)
- PostgreSQL (lokal oder via Docker)

### Setup

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Umgebungsvariablen einrichten:
   ```bash
   cp .env.local.example .env.local
   # Dann die Umgebungsvariablen anpassen
   ```

3. Prisma Client generieren:
   ```bash
   npm run prisma:generate
   ```

4. Datenbank migrieren:
   ```bash
   npm run db:migrate
   ```

5. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

## 💻 Entwicklung

### Nützliche Skripte

- `npm run dev`: Startet den Entwicklungsserver
- `npm run build`: Baut die Anwendung für die Produktion
- `npm run start`: Startet die gebaute Anwendung
- `npm run start:docker`: Startet die Anwendung im Docker-Container
- `npm run lint`: Führt ESLint aus
- `npm run test`: Führt Tests aus
- `npm run test:watch`: Führt Tests im Watch-Modus aus
- `npm run db:migrate`: Führt Datenbankmigrationen aus
- `npm run db:seed`: Befüllt die Datenbank mit Testdaten
- `npm run db:studio`: Startet Prisma Studio für die Datenbankansicht
- `npm run format`: Formatiert den Code mit Prettier

### Mit Docker entwickeln

```bash
# Im Hauptverzeichnis des Projekts
docker-compose up
```

## 🧪 Tests

Das Projekt verwendet Jest für Unit- und Integrationstests:

```bash
# Alle Tests ausführen
npm run test

# Tests im Watch-Modus ausführen
npm run test:watch

# Tests mit Coverage-Report ausführen
npm run test:ci
```

## 📂 Wichtige Dateien und Verzeichnisse

### Konfigurationsdateien

- `next.config.js`: Next.js Konfiguration
- `tailwind.config.js`: Tailwind CSS Konfiguration
- `tsconfig.json`: TypeScript Konfiguration
- `.env.local.example`: Beispiel für Umgebungsvariablen
- `prisma/schema.prisma`: Prisma Schema Definition

### Schlüsseldateien

- `src/app/layout.tsx`: Root-Layout mit Providern
- `src/app/page.tsx`: Homepage/Landingpage
- `src/infrastructure/common/bootstrap.ts`: Initialisiert die Anwendung
- `src/features/auth/providers/AuthProvider.tsx`: Authentifizierungsprovider
- `src/shared/providers/QueryProvider.tsx`: React Query Provider

## 🧩 Feature-Module

### 🔐 Auth-Modul

Umfasst Authentifizierung und Autorisierung:
- Login/Logout/Registrierung
- JWT-Authentifizierung mit Refresh Token
- Passwort-Reset
- Berechtigungsprüfung

### 👤 Customers-Modul

Verwaltung von Kundendaten:
- Kundenübersicht
- Kundendetails
- Kundenbearbeitung
- Kundensuchfunktion

### 📅 Appointments-Modul

Verwaltung von Terminen:
- Terminplanung
- Terminübersicht
- Termindetails
- Terminnotizen

### 📨 Requests-Modul

Verwaltung von Kundenanfragen:
- Anfrageübersicht
- Anfragedetails
- Anfragestatus-Management
- Anfragen zu Kunden konvertieren
- Terminplanung aus Anfragen

### 📊 Dashboard-Modul

Übersicht und Analysen:
- Statistiken und Kennzahlen
- Visualisierungen und Charts
- Aktuelle Aktivitäten
- Bevorstehende Termine

### 🔔 Notifications-Modul

Benachrichtigungssystem:
- Echtzeit-Benachrichtigungen
- Benachrichtigungszentrale
- Ungelesene Benachrichtigungen

### 👥 Users-Modul

Benutzerverwaltung:
- Benutzerübersicht
- Benutzerprofile
- Benutzerberechtigungen

## 🌐 API-Endpunkte

Die Anwendung implementiert ein Backend-for-Frontend (BFF) Pattern mit API-Routen:

### Auth-Endpoints

- `POST /api/auth/login`: Benutzeranmeldung
- `POST /api/auth/register`: Benutzerregistrierung
- `POST /api/auth/logout`: Benutzerabmeldung
- `POST /api/auth/refresh`: Token-Aktualisierung
- `POST /api/auth/forgot-password`: Passwortzurücksetzung anfordern
- `POST /api/auth/reset-password`: Passwort zurücksetzen

### User-Endpoints

- `GET /api/users/me`: Aktuellen Benutzer abrufen
- `GET /api/dashboard/user`: Dashboard-Daten für den Benutzer

### Request-Endpoints

- `GET /api/requests`: Alle Anfragen abrufen
- `GET /api/requests/:id`: Anfrage nach ID abrufen
- `POST /api/requests`: Neue Anfrage erstellen
- `PUT /api/requests/:id`: Anfrage aktualisieren
- `POST /api/requests/:id/status`: Anfragestatus ändern
- `POST /api/requests/:id/assign`: Anfrage zuweisen
- `POST /api/requests/:id/convert`: Anfrage zu Kunde konvertieren
- `POST /api/requests/:id/link-customer`: Anfrage mit Kunde verknüpfen
- `POST /api/requests/public`: Öffentliche Anfrage erstellen

### Customer-Endpoints

- `GET /api/customers`: Alle Kunden abrufen
- `GET /api/customers/:id`: Kunde nach ID abrufen
- `POST /api/customers`: Neuen Kunden erstellen
- `PUT /api/customers/:id`: Kunden aktualisieren

### Appointment-Endpoints

- `GET /api/appointments`: Alle Termine abrufen
- `GET /api/appointments/:id`: Termin nach ID abrufen
- `POST /api/appointments`: Neuen Termin erstellen
- `PUT /api/appointments/:id`: Termin aktualisieren
- `POST /api/requests/:id/appointment`: Termin aus Anfrage erstellen

## 🔧 Umgebungsvariablen

Wichtige Umgebungsvariablen (in `.env.local`):

```
# Basis-URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Datenbank
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rising_bsm?schema=public

# JWT Secrets
JWT_SECRET=your-jwt-secret-key
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=your-smtp-password

# Debug-Modus
DEBUG=true
```

## 🐳 Docker

Die Anwendung kann in Docker-Containern ausgeführt werden:

### Entwicklungsumgebung

```bash
# Docker-Compose für Entwicklung
docker-compose up
```

### Produktionsumgebung

```bash
# Docker-Compose für Produktion
docker-compose -f docker-compose.prod.yml up -d
```

### Docker-Konfiguration

- `Dockerfile`: Produktions-Build
- `Dockerfile.dev`: Entwicklungs-Build
- `docker-entrypoint.sh`: Entrypoint-Skript für Container

## 🛠️ Bekannte Probleme und Lösungen

### Auth-Cookies in Entwicklungsumgebung

Problem: Manchmal werden Auth-Cookies in der Entwicklungsumgebung nicht korrekt gesetzt.

Lösung: Stelle sicher, dass die `NEXT_PUBLIC_FRONTEND_URL` Umgebungsvariable richtig gesetzt ist und verwende immer dieselbe Domain/Port-Kombination.

### Umgebungsvariablen werden nicht geladen

Problem: Next.js lädt manchmal Umgebungsvariablen nicht korrekt.

Lösung: Stelle sicher, dass Dateinamen korrekt sind (`.env`) und starte den Entwicklungsserver neu.

### Prisma-Fehler nach Schema-Änderungen

Problem: Nach Änderungen am Prisma-Schema treten Fehler auf.

Lösung:
```bash
# Prisma-Client neu generieren
npm run prisma:generate

# Datenbank migrieren
npm run db:migrate
```

### In-Memory-Refresh-Token nach Neustart verloren

Problem: Nach einem Server-Neustart gehen In-Memory-Refresh-Tokens verloren.

Lösung: Verwende für Produktionsumgebungen eine persistente Speicherlösung für Refresh-Tokens (Datenbank).
