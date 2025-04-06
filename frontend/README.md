# Rising BSM - Frontend

## Übersicht

Dies ist die Frontend-Anwendung für Rising BSM, ein Facility Management System. Die Anwendung ist mit Next.js implementiert und nutzt die folgenden Haupttechnologien:

- **Next.js 14**: Full-Stack React Framework
- **Prisma**: ORM für Datenbankzugriff
- **TailwindCSS**: Utility-First CSS Framework
- **TypeScript**: Typisierte JavaScript-Erweiterung

## Projektstruktur

```
/src
  /app                 # Next.js App Router Struktur
    /api               # API-Routen (Backend)
    /auth              # Authentifizierungsseiten
    /dashboard         # Dashboard-Seiten
    layout.tsx         # Root-Layout
    page.tsx           # Landing Page
  /components          # Wiederverwendbare React-Komponenten
  /contexts            # React Context-Provider
  /hooks               # Benutzerdefinierte React-Hooks
  /lib                 # Hilfsbibliotheken
    /api               # API-Clients für Frontend
    /core              # Kernfunktionalität
    /config            # Konfiguration
    /utils             # Hilfsfunktionen
  /providers           # React-Provider (Auth, etc.)
  /types               # TypeScript-Typdefinitionen
/prisma                # Prisma Schema und Migrationen
/public                # Öffentliche Assets
```

## Initialisierung der Anwendung

Die Anwendung wird über die folgenden Hauptmechanismen initialisiert:

1. **instrumentation.ts**: Wird beim Start von Next.js geladen und initialisiert Backend-Dienste
2. **lib/core/bootstrap.ts**: Zentrale Initialisierungslogik für Prisma und andere Services
3. **middleware.ts**: Zentrale Middleware für Authentifizierung und CORS

## API-Struktur

Die API ist unter `/app/api` implementiert und folgt REST-Prinzipien:

- `/api/auth`: Authentifizierung (Login, Logout, etc.)
- `/api/users`: Benutzerverwaltung
- `/api/dashboard`: Dashboard-Daten
- `/api/customers`: Kundenverwaltung
- `/api/projects`: Projektverwaltung
- `/api/appointments`: Terminverwaltung
- `/api/services`: Dienstverwaltung
- `/api/settings`: Einstellungen

Jede API-Route verwendet:
- **successResponse/errorResponse**: Für einheitliche Antwortformate
- **ApiError**: Für standardisierte Fehlerbehandlung
- **Prisma**: Für Datenbankzugriff

## Authentifizierung

Die Anwendung verwendet JWT (JSON Web Tokens) für die Authentifizierung:

- **Access Token**: Kurzlebig (15 Minuten), für API-Zugriff
- **Refresh Token**: Langlebig (7 Tage), für Token-Erneuerung
- **AuthProvider**: React-Context für die Verwaltung des Authentifizierungszustandes

## Starten der Anwendung

```bash
# Entwicklungsserver starten
npm run dev

# Für Produktion bauen
npm run build

# Produktionsserver starten
npm start
```

## Umgebungsvariablen

Die Anwendung verwendet die folgenden Umgebungsvariablen (in `.env.local`):

- `DATABASE_URL`: PostgreSQL-Verbindungsstring
- `JWT_SECRET`: Secret für Access Token
- `JWT_REFRESH_SECRET`: Secret für Refresh Token
- `LOG_LEVEL`: Logging-Level (debug, info, warn, error)

## Datenbank

Die Anwendung verwendet PostgreSQL mit Prisma als ORM. Das Datenbankschema ist in `prisma/schema.prisma` definiert.

```bash
# Datenbank-Migrationen anwenden
npm run db:migrate

# Datenbank für Entwicklung mit Testdaten füllen
npm run db:seed
```
