# Rising-BSM Architektur-Dokumentation

## Übersicht

Das Rising-BSM-Projekt verwendet eine mehrschichtige Architektur, die auf bewährten Patterns wie Repository, Service, und Dependency Injection basiert. Die Anwendung ist mit Next.js implementiert und nutzt die App-Router-Architektur.

## Core-Konzepte

### Schichtenarchitektur

1. **Präsentationsschicht (Presentation Layer)**
   - Next.js Pages und Komponenten
   - API-Routes als Controller

2. **Anwendungsschicht (Application Layer)**
   - Services für Geschäftslogik
   - DTO-Transformationen

3. **Domänenschicht (Domain Layer)**
   - Entitäts-Definitionen und Interfaces
   - Domänenlogik und Regeln

4. **Infrastrukturschicht (Infrastructure Layer)**
   - Repositories für Datenbankzugriff
   - Externe Dienste und Integrationen

### Design Patterns

1. **Repository Pattern**
   - Abstrahiert den Datenbankzugriff
   - Ermöglicht Unit-Tests mit Mock-Repositories

2. **Service Pattern** 
   - Kapselt Geschäftslogik
   - Orchestriert Repository-Operationen

3. **Factory Pattern**
   - Zentralisiert die Erstellung von Service- und Repository-Instanzen
   - Vereinfacht Dependency Injection

4. **DTO Pattern**
   - Data Transfer Objects für API-Anfragen und -Antworten
   - Entkoppelt interne Modelle von externen Schnittstellen

## Dateistruktur

```
/frontend
├── prisma/                # Prisma Schema und Migrations
├── public/                # Statische Assets
└── src/
    ├── app/               # Next.js App Router
    │   ├── api/           # API-Routen
    │   └── ...            # Frontend-Seiten
    ├── components/        # React-Komponenten
    ├── contexts/          # React-Kontexte
    ├── lib/               # Backend-Implementierung
    │   ├── core/          # Basis-Abstraktionen (BaseRepository, BaseService)
    │   ├── repositories/  # Repository-Implementierungen
    │   ├── services/      # Service-Implementierungen
    │   └── utils/         # Hilfsfunktionen
    ├── providers/         # React-Provider
    └── types/             # TypeScript-Definitionen
        ├── dtos/          # Data Transfer Objects
        ├── entities/      # Domänenmodelle
        ├── enums/         # Enumerationen
        └── interfaces/    # Interfaces
```

## Kernkomponenten

### BaseRepository

Die `BaseRepository`-Klasse dient als Grundlage für alle Repository-Implementierungen und bietet standardisierte Methoden für CRUD-Operationen:

```typescript
export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  constructor(
    protected readonly model: any,
    protected readonly logger: ILoggingService,
    protected readonly errorHandler: IErrorHandler
  ) {}

  // Standard-Implementierungen für:
  async findAll(options?: QueryOptions): Promise<T[]> { ... }
  async findById(id: ID, options?: QueryOptions): Promise<T | null> { ... }
  async create(data: Partial<T>): Promise<T> { ... }
  async update(id: ID, data: Partial<T>): Promise<T> { ... }
  async delete(id: ID): Promise<boolean> { ... }
  // ...weitere Methoden...
}
```

### BaseService

Die `BaseService`-Klasse dient als Grundlage für alle Service-Implementierungen und stellt standardisierte Geschäftslogik zur Verfügung:

```typescript
export abstract class BaseService<T, C, U, R> implements IService<T, C, U, R> {
  constructor(
    protected readonly repository: IRepository<T, any>,
    protected readonly logger: ILoggingService,
    protected readonly validator: IValidationService,
    protected readonly errorHandler: IErrorHandler
  ) {}

  // Standard-Implementierungen für:
  async getAll(options?: ServiceOptions): Promise<R[]> { ... }
  async getById(id: any, options?: ServiceOptions): Promise<R | null> { ... }
  async create(data: C, options?: ServiceOptions): Promise<R> { ... }
  async update(id: any, data: U, options?: ServiceOptions): Promise<R> { ... }
  async delete(id: any, options?: ServiceOptions): Promise<boolean> { ... }
  // ...weitere Methoden...
}
```

### Factories

Die Factory-Funktionen kapseln die Erstellung von Service- und Repository-Instanzen und verwalten deren Abhängigkeiten:

```typescript
// Beispiel für ein Repository-Factory
export function getUserRepository() {
  return new UserRepository(createLogger('UserRepository'), errorHandler);
}

// Beispiel für ein Service-Factory
export function getUserService() {
  return new UserService(
    getUserRepository(),
    createLogger('UserService'),
    validationService,
    errorHandler
  );
}
```

### API-Response-Utilities

Die API-Response-Utilities stellen sicher, dass alle API-Endpunkte ein einheitliches Antwortformat verwenden:

```typescript
// Erfolgsantwort
return apiResponse.success(data, 'Operation erfolgreich');

// Fehlerantwort
return apiResponse.notFound('Ressource nicht gefunden');

// Paginierte Antwort
return apiResponse.paginated(data, pagination);
```

### Entitäts-Interfaces

Entitäts-Interfaces definieren die Struktur der Domänenmodelle und sind eng an das Datenbankschema angelehnt:

```typescript
export interface IUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  // ...weitere Eigenschaften...
}
```

## Best Practices

### Repository-Entwicklung

1. **Immer von BaseRepository ableiten**
   - Nutze die Basisfunktionalität für CRUD-Operationen
   - Implementiere nur domänenspezifische Methoden

2. **Fehlerbehandlung**
   - Verwende das ErrorHandler-Interface für einheitliche Fehlermeldungen
   - Logge alle Fehler mit dem Logger-Service

3. **Mapping**
   - Implementiere `mapToDomainEntity` und `mapToORMEntity` für die Konvertierung zwischen ORM und Domänenmodellen

### Service-Entwicklung

1. **Immer von BaseService ableiten**
   - Nutze die Basisfunktionalität für Standard-Operationen
   - Implementiere nur domänenspezifische Geschäftslogik

2. **Validierung**
   - Definiere Validierungsschemas für Create- und Update-Operationen
   - Nutze den ValidationService für die Eingabevalidierung

3. **Audit-Logging**
   - Nutze den ServiceOptions-Parameter für Kontext-Informationen
   - Implementiere die Hook-Methoden (beforeCreate, afterCreate, etc.)

### API-Route-Entwicklung

1. **Factory-Funktionen verwenden**
   - Nutze die Factory-Funktionen zur Instanziierung von Services
   - Vermeide direkte Instanziierung mit `new`

2. **Einheitliches Antwortformat**
   - Verwende die API-Response-Utilities für alle Antworten
   - Implementiere konsistente Fehlerbehandlung

3. **Try-Catch-Blöcke**
   - Fange Fehler ab und verarbeite sie mit apiResponse.handleError
   - Vermeide unbehandelte Fehler

## Datenbankzugriff

Das Projekt verwendet Prisma ORM für den Datenbankzugriff:

1. **Zentrale Prisma-Instanz**
   - Die Datei `src/lib/db.ts` exportiert eine zentrale Prisma-Instanz
   - Im Entwicklungsmodus wird die Instanz wiederverwendet

2. **Repository-Abstraktion**
   - Repositories kapseln den Datenbankzugriff
   - BaseRepository bietet eine einheitliche Schnittstelle

3. **Transaktionen**
   - Verwende die `withTransaction`-Methode für transaktionale Operationen
   - Implementiere komplexe Operationen in einer einzelnen Transaktion

## Validierung und Fehlerbehandlung

1. **ValidationService**
   - Zentrale Komponente für die Eingabevalidierung
   - Unterstützt verschiedene Validierungsschemas

2. **ErrorHandler**
   - Vereinheitlicht Fehlermeldungen und HTTP-Statuscodes
   - Bietet spezifische Fehlertypen (NotFoundError, ValidationError, etc.)

3. **Logger-Integration**
   - Alle Fehler werden mit dem Logger-Service protokolliert
   - Kontext-Informationen werden für die Fehlerdiagnose mitgegeben

## Migrationsschritte

Die Migration von der alten zur neuen Architektur erfolgt schrittweise:

1. **Core-Komponenten**
   - Implementierung der Basisklassen und Interfaces
   - Einrichtung der Factory-Funktionen

2. **Entity-Interfaces**
   - Umwandlung von Klassen zu Interfaces
   - Trennung von Entitäten und DTOs

3. **Repository-Migration**
   - Umstellung auf BaseRepository
   - Einführung der einheitlichen Fehlerbehandlung

4. **Service-Migration**
   - Umstellung auf BaseService
   - Implementierung der Validierung

5. **API-Route-Migration**
   - Verwendung der Factory-Funktionen
   - Einführung der einheitlichen Antwortformate

## Fazit

Die neue Architektur bietet zahlreiche Vorteile:

- **Konsistenz**: Einheitliche Patterns und Strukturen
- **Testbarkeit**: Klare Trennung der Verantwortlichkeiten
- **Wartbarkeit**: Modulare und erweiterbare Komponenten
- **Typsicherheit**: Starke TypeScript-Integration

Die Migration ist ein fortlaufender Prozess, der schrittweise umgesetzt wird, um die Stabilität der Anwendung zu gewährleisten.
