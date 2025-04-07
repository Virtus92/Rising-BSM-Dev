# Rising BSM - Business Service Management

## Projektübersicht

Rising BSM ist eine modulare Business Service Management Anwendung für die Verwaltung von Kunden, Projekten, Dienstleistungen und Terminen. Die Anwendung bietet umfassende Features zur Kundenbetreuung, Projektverwaltung, Terminplanung und Rechnungsstellung.

## Architektur

Die Anwendung ist mit Next.js und Typescript implementiert und nutzt einen Domain-Driven-Design (DDD) Ansatz. Die Architektur besteht aus folgenden Hauptkomponenten:

### Frontend

- **Next.js App Router**: Für das Routing und die Seitenstruktur
- **React**: Für die UI-Komponenten
- **Tailwind CSS**: Für das Styling

### Backend

- **Next.js API Routes**: Für die API-Implementierung
- **Prisma ORM**: Für den Datenbankzugriff
- **PostgreSQL**: Als primäre Datenbank

### Architekturlayer

Die Backend-Implementierung folgt einer mehrschichtigen Architektur:

1. **Entitäten** (`/src/types/entities`): TypeScript Interfaces, die die Domänenmodelle definieren
2. **DTOs** (`/src/types/dtos`): Data Transfer Objects für Ein- und Ausgaben
3. **Repositories** (`/src/lib/repositories`): Datenzugriffsschicht für Datenbankoperationen
4. **Services** (`/src/lib/services`): Geschäftslogik und Domänenoperationen
5. **API-Routen** (`/src/app/api`): API-Endpunkte und Controller

## Datestruktur

```
/frontend
├── prisma/              # Prisma Schema und Migrations
├── public/              # Statische Assets
└── src/
    ├── app/             # Next.js App Router
    │   ├── api/         # API-Routen
    │   └── ...          # Frontend-Seiten
    ├── components/      # React-Komponenten
    ├── contexts/        # React-Kontexte
    ├── lib/             # Backend-Implementierung
    │   ├── core/        # Basis-Abstraktionen (BaseRepository, BaseService)
    │   ├── repositories/# Repository-Implementierungen
    │   ├── services/    # Service-Implementierungen
    │   └── utils/       # Hilfsfunktionen
    ├── providers/       # React-Provider
    └── types/           # TypeScript-Definitionen
        ├── dtos/        # Data Transfer Objects
        ├── entities/    # Domänenmodelle
        ├── enums/       # Enumerationen
        └── interfaces/  # Interfaces
```

## Kernkonzepte

### Repository-Pattern

Repositories sind für den Datenzugriff verantwortlich und kapseln die Datenbankoperationen. Sie bieten eine einheitliche Schnittstelle für den Zugriff auf die Domänenmodelle.

```typescript
// Beispiel: UserRepository
export class UserRepository extends BaseRepository<IUser, number> {
  async findByEmail(email: string): Promise<IUser | null> {
    // Implementierung...
  }
}
```

### Service-Pattern

Services kapseln die Geschäftslogik und orchestrieren die Repository-Operationen. Sie sind für die Validierung, Autorisierung und andere Business Rules verantwortlich.

```typescript
// Beispiel: UserService
export class UserService extends BaseService<IUser, CreateUserDto, UpdateUserDto, UserResponseDto> {
  async authenticate(email: string, password: string): Promise<UserResponseDto | null> {
    // Implementierung...
  }
}
```

### Factory-Pattern

Factories werden verwendet, um Services und Repositories mit ihren Abhängigkeiten zu instanziieren und bieten eine einheitliche Schnittstelle für den Zugriff.

```typescript
// Beispiel: getUserService
export function getUserService() {
  return new UserService(
    getUserRepository(),
    createLogger('UserService'),
    validationService,
    errorHandler
  );
}
```

### Einheitliche API-Antworten

Alle API-Endpunkte verwenden ein einheitliches Antwortformat, um Konsistenz zu gewährleisten.

```typescript
// Beispiel: Erfolgreiches Abrufen eines Benutzers
return apiResponse.success(user, 'User retrieved successfully');

// Beispiel: Fehlerbehandlung
return apiResponse.notFound(`User with ID ${id} not found`);
```

## Entwicklungsumgebung

### Voraussetzungen

- Node.js >= 18
- Docker und Docker Compose
- npm oder yarn

### Installation

1. Repository klonen
   ```
   git clone https://github.com/your-username/rising-bsm.git
   cd rising-bsm
   ```

2. Abhängigkeiten installieren
   ```
   cd frontend
   npm install
   ```

3. Umgebungsvariablen einrichten
   ```
   cp .env.example .env
   ```
   Dann .env-Datei bearbeiten und die entsprechenden Werte setzen.

4. Entwicklungsumgebung mit Docker starten
   ```
   docker-compose up -d
   ```

5. Datenbank migrieren und Prisma Client generieren
   ```
   npm run prisma:generate
   npm run db:migrate
   ```

6. Entwicklungsserver starten
   ```
   npm run dev
   ```

### Verfügbare Scripts

- **npm run dev**: Startet den Entwicklungsserver
- **npm run build**: Erstellt eine Produktions-Build
- **npm run start**: Startet die Anwendung im Produktionsmodus
- **npm run lint**: Führt ESLint aus
- **npm run prisma:generate**: Generiert den Prisma Client
- **npm run db:migrate**: Führt Datenbankmigrationen aus
- **npm run db:seed**: Füllt die Datenbank mit Testdaten

## Deployment

### Docker

Die Anwendung kann mit Docker Compose in Produktion bereitgestellt werden:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manuelles Deployment

1. Produktions-Build erstellen
   ```
   npm run build
   ```

2. Abhängigkeiten für Produktion installieren
   ```
   npm ci --production
   ```

3. Prisma Client generieren
   ```
   npm run prisma:generate
   ```

4. Anwendung im Produktionsmodus starten
   ```
   npm run start
   ```

## Best Practices

### API-Entwicklung

- Verwende die standardisierten API-Response-Funktionen
- Implementiere Fehlerbehandlung in jedem API-Endpunkt
- Validiere alle Eingaben
- Dokumentiere API-Endpunkte mit JSDoc-Kommentaren

### Repository/Service-Entwicklung

- Verwende BaseRepository und BaseService als Basis
- Halte die Services und Repositories klein und fokussiert
- Implementiere Business-Logik in Services, nicht in Repositories
- Repositories sollten nur Datenbankoperationen durchführen

### Typsicherheit

- Definiere alle Entitäten als TypeScript-Interfaces
- Verwende DTOs für Ein- und Ausgabe
- Nutze Enums für Status- und Typwerte
- Vermeide `any` und verwende stattdessen spezifische Typen

## Kontakt

Bei Fragen oder Problemen wenden Sie sich bitte an den Projektinhaber.
