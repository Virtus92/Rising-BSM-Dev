# RISING-BSM

## Business Service Management System

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-entwicklung-orange)

RISING-BSM ist ein umfassendes Business Service Management System, das für die Verwaltung von Facility Management Services entwickelt wurde. Es ermöglicht die effiziente Verwaltung von Kundenanfragen, Terminen, Kundendaten und Mitarbeitern in einer einzigen Anwendung.

## 📋 Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Projektstruktur](#projektstruktur)
- [Technologie-Stack](#technologie-stack)
- [Installation](#installation)
- [Entwicklung](#entwicklung)
- [Produktivumgebung](#produktivumgebung)
- [Architektur](#architektur)
- [API-Dokumentation](#api-dokumentation)

## 🔍 Übersicht

RISING-BSM ist eine All-in-One-Lösung für Facility Management Unternehmen. Die Anwendung umfasst:

- **Öffentliche Website** zur Präsentation des Unternehmens und Services
- **Kontaktanfragen-Management** für eingehende Kundenanfragen
- **Kunden-Management** zur Verwaltung von Kundendaten und -beziehungen
- **Termin-Management** zur Planung und Überwachung von Kundenterminen
- **Dashboard** mit Kennzahlen und Statistiken
- **Benutzerverwaltung** mit verschiedenen Berechtigungsstufen

## 🏗️ Projektstruktur

Das Projekt ist in einem monorepo-ähnlichen Aufbau organisiert:

```
Rising-BSM/
├── frontend/           # Next.js Frontend + API (Backend-for-Frontend Pattern)
│   ├── src/
│   │   ├── app/        # Next.js App Router
│   │   ├── domain/     # Domänenlogik, Entitäten, DTOs
│   │   ├── features/   # Feature-Module
│   │   ├── infrastructure/ # Infrastrukturcode, Repositories, Services
│   │   └── shared/     # Gemeinsame Komponenten und Utilities
│   ├── prisma/         # Prisma ORM Schema & Migrationen
│   └── public/         # Statische Assets
└── docker-compose.yml  # Docker-Compose für Entwicklung und Produktion
```

## 🔧 Technologie-Stack

### Frontend & API
- **Next.js**: React-Framework mit serverseitigen Komponenten und API-Routen
- **TypeScript**: Typsicheres JavaScript
- **Tailwind CSS**: Utility-first CSS-Framework
- **React Query**: State Management für asynchrone Daten
- **Zod**: Schema-Validierung
- **React Hook Form**: Formularverarbeitung

### Backend & Datenbank
- **Next.js API Routes**: Backend-for-Frontend API
- **Prisma ORM**: Datenbankabstraktion und Migration
- **PostgreSQL**: Relationale Datenbank
- **JWT**: Authentifizierung und Autorisierung
- **bcrypt**: Sicheres Passwort-Hashing

### Infrastruktur
- **Docker**: Containerisierung
- **Docker Compose**: Container-Orchestrierung

## 🚀 Installation

### Voraussetzungen
- Node.js (Version 18 oder höher)
- Docker und Docker Compose
- Git

### Setup

1. Repository klonen:
   ```bash
   git clone <repository-url>
   cd Rising-BSM
   ```

2. Umgebungsvariablen einrichten:
   ```bash
   # Im frontend-Verzeichnis
   cp .env.local.example .env.local
   # Dann die Umgebungsvariablen anpassen
   ```

3. Mit Docker starten:
   ```bash
   docker-compose up
   ```

4. Die Anwendung ist nun unter http://localhost:3000 erreichbar.

## 💻 Entwicklung

### Lokale Entwicklung
```bash
# Ins frontend-Verzeichnis wechseln
cd frontend

# Abhängigkeiten installieren
npm install

# Prisma Client generieren
npm run prisma:generate

# Datenbank migrieren 
npm run db:migrate

# Entwicklungsserver starten
npm run dev
```

### Nützliche Skripte
- `npm run dev`: Startet den Entwicklungsserver
- `npm run build`: Baut die Anwendung für die Produktion
- `npm run start`: Startet die gebaute Anwendung
- `npm run lint`: Führt ESLint aus
- `npm run test`: Führt Tests aus
- `npm run db:migrate`: Führt Datenbankmigrationen aus
- `npm run db:seed`: Befüllt die Datenbank mit Testdaten
- `npm run db:studio`: Startet Prisma Studio für die Datenbankansicht

## 🌍 Produktivumgebung

### Deployment

1. Produktions-Build erstellen:
   ```bash
   cd frontend
   npm run build
   ```

2. Mit Docker Compose für Produktion starten:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🏛️ Architektur

Die Anwendung folgt einer Domain-Driven Design (DDD) Architektur mit klarer Trennung von:

- **Domain**: Geschäftslogik, Entitäten, Repositories und Services Interfaces
- **Infrastructure**: Konkrete Implementierungen von Repositories und Services
- **Features**: Feature-Module für die UI-Komponenten und -Logik
- **Shared**: Gemeinsam genutzte Komponenten und Utilities

### Architektonische Prinzipien:
- **Dependency Inversion**: Verwendung von Interfaces für lose Kopplung
- **Repository Pattern**: Abstraktion der Datenpersistenz
- **Service Layer**: Geschäftslogik in Services gekapselt
- **Clean Architecture**: Klare Trennung von Domäne, Anwendung und Infrastruktur

## 📚 API-Dokumentation

Die API-Dokumentation ist im OpenAPI-Format verfügbar:

- **Entwicklung**: http://localhost:3000/api-docs

### Hauptendpunkte:

- `/api/auth/*`: Authentifizierung (Login, Register, Refresh)
- `/api/users/*`: Benutzerverwaltung
- `/api/customers/*`: Kundenverwaltung
- `/api/requests/*`: Anfragenverwaltung
- `/api/appointments/*`: Terminverwaltung
- `/api/dashboard/*`: Dashboard-Daten
