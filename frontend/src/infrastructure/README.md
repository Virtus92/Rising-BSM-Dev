# Infrastructure-Modul

## Übersicht

Das Infrastructure-Modul ist für die technische Implementierung der im Domain-Modul definierten Interfaces verantwortlich. Es stellt die Verbindung zwischen der Geschäftslogik und externen Systemen wie Datenbanken, APIs und externen Diensten her.

## Struktur

```
infrastructure/
├── api/                # API-Clients und Helpers
│   ├── AppointmentClient.ts
│   ├── CustomerClient.ts
│   ├── RequestClient.ts
│   ├── SettingsClient.ts
│   ├── UserClient.ts
│   ├── response-formatter.ts
│   └── route-handler.ts
├── auth/               # Authentifizierungsimplementierung
│   ├── AuthClient.ts
│   └── TokenManager.ts
├── clients/            # Service-Clients
│   ├── ApiClient.ts
│   ├── AppointmentService.ts
│   ├── CustomerService.ts
│   ├── RequestService.ts
│   └── UserService.ts
├── common/             # Gemeinsame Infrastrukturkomponenten
│   ├── bootstrap.ts
│   ├── database/       # Datenbankzugriff
│   ├── error/          # Fehlerbehandlung
│   ├── factories/      # Factories für DI
│   ├── logging/        # Logging
│   ├── settings/       # Anwendungseinstellungen
│   └── validation/     # Validierungslogik
├── repositories/       # Repository-Implementierungen
│   ├── ActivityLogRepository.ts
│   ├── AppointmentRepository.ts
│   ├── BaseRepository.ts
│   ├── CustomerRepository.ts
│   ├── NotificationRepository.ts
│   ├── PrismaRepository.ts
│   ├── RefreshTokenRepository.ts
│   ├── RequestRepository.ts
│   └── UserRepository.ts
└── services/           # Service-Implementierungen
    ├── ActivityLogService.ts
    ├── AppointmentService.ts
    ├── AuthService.ts
    ├── BaseService.ts
    ├── CustomerService.ts
    ├── NotificationService.ts
    ├── RefreshTokenService.ts
    ├── RequestService.ts
    └── UserService.ts
```

## Verantwortlichkeiten

Das Infrastructure-Modul hat folgende Verantwortlichkeiten:

1. Implementierung der Repository-Interfaces aus dem Domain-Modul
2. Implementierung der Service-Interfaces aus dem Domain-Modul
3. Verwaltung von Datenbankverbindungen und -zugriff
4. Implementierung der Authentifizierungs- und Autorisierungslogik
5. Bereitstellung von API-Clients für externe Dienste
6. Fehlerbehandlung und Logging
7. Konfigurationsmanagement
8. Initialisierung und Bootstrap der Anwendung

## Komponenten

### API-Clients

Die API-Clients sind für die Kommunikation mit API-Endpunkten verantwortlich:

- `AppointmentClient`: Client für Termin-Endpunkte
- `CustomerClient`: Client für Kunden-Endpunkte
- `RequestClient`: Client für Anfragen-Endpunkte
- `SettingsClient`: Client für Einstellungs-Endpunkte
- `UserClient`: Client für Benutzer-Endpunkte
- `response-formatter.ts`: Formatierung von API-Antworten
- `route-handler.ts`: Hilfslogik für API-Routen

### Auth

Implementierung der Authentifizierungs- und Autorisierungslogik:

- `AuthClient`: Client für Authentifizierungs-Endpunkte
- `TokenManager`: Verwaltung von JWT-Tokens und Refresh-Logik

### Clients

Service-Clients für die Frontend-Kommunikation:

- `ApiClient`: Basisklasse für HTTP-Anfragen
- `AppointmentService`: Client für Terminservices
- `CustomerService`: Client für Kundenservices
- `RequestService`: Client für Anfragenservices
- `UserService`: Client für Benutzerservices

### Common

Gemeinsame Infrastrukturkomponenten:

- `bootstrap.ts`: Initialisierung der Anwendung
- `database/`: Datenbankzugriff und -konfiguration
- `error/`: Fehlerbehandlung und -typen
- `factories/`: Factories für Dependency Injection
- `logging/`: Logging-Implementierung
- `settings/`: Anwendungseinstellungen
- `validation/`: Validierungslogik und -services

### Repositories

Implementierung der Repository-Interfaces aus dem Domain-Modul:

- `ActivityLogRepository`: Implementierung von IActivityLogRepository
- `AppointmentRepository`: Implementierung von IAppointmentRepository
- `BaseRepository`: Implementierung von IBaseRepository
- `CustomerRepository`: Implementierung von ICustomerRepository
- `NotificationRepository`: Implementierung von INotificationRepository
- `PrismaRepository`: Basisklasse für Prisma-ORM-Zugriff
- `RefreshTokenRepository`: Implementierung von IRefreshTokenRepository
- `RequestRepository`: Implementierung von IRequestRepository
- `UserRepository`: Implementierung von IUserRepository

### Services

Implementierung der Service-Interfaces aus dem Domain-Modul:

- `ActivityLogService`: Implementierung von IActivityLogService
- `AppointmentService`: Implementierung von IAppointmentService
- `AuthService`: Implementierung von IAuthService
- `BaseService`: Implementierung von IBaseService
- `CustomerService`: Implementierung von ICustomerService
- `NotificationService`: Implementierung von INotificationService
- `RefreshTokenService`: Implementierung von IRefreshTokenService
- `RequestService`: Implementierung von IRequestService
- `UserService`: Implementierung von IUserService

## Schlüsselkonzepte

### Dependency Injection

Das Infrastructure-Modul nutzt Factory-Funktionen zur Implementierung eines einfachen Dependency-Injection-Mechanismus:

```typescript
// Beispiel aus factories/repositoryFactory.ts
export function getUserRepository(): IUserRepository {
  if (!userRepository) {
    userRepository = new UserRepository(getPrismaClient());
  }
  return userRepository;
}
```

### Repository Pattern

Die Repository-Implementierungen abstrahieren den Datenbankzugriff:

```typescript
// Beispiel aus UserRepository.ts
export class UserRepository extends PrismaRepository implements IUserRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return user ? this.mapToEntity(user) : null;
  }
  
  // Weitere Implementierungen...
}
```

### Service Layer

Die Service-Implementierungen kapseln Geschäftslogik:

```typescript
// Beispiel aus AuthService.ts
export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private refreshTokenService: IRefreshTokenService,
    private logger: ILoggingService
  ) {}
  
  async login(credentials: LoginDto): Promise<Result<AuthResponseDto>> {
    // Implementierung...
  }
  
  // Weitere Implementierungen...
}
```

### API-Clients

Die API-Clients nutzen einen gemeinsamen ApiClient für HTTP-Anfragen:

```typescript
// Beispiel aus CustomerClient.ts
export default class CustomerClient {
  static async getCustomers(params?: CustomerQueryParams): Promise<ApiResponse<CustomerDto[]>> {
    return ApiClient.get<CustomerDto[]>('/customers', { params });
  }
  
  // Weitere Implementierungen...
}
```

## Verwendung

Das Infrastructure-Modul sollte niemals direkt von der UI importiert werden. Stattdessen sollten Services über die Factory-Funktionen bezogen werden:

```typescript
import { getCustomerService } from '@/infrastructure/common/factories/serviceFactory';

// In einer React-Komponente oder einem Hook
const customerService = getCustomerService();
const result = await customerService.getCustomers();
```

## Bootstrap-Prozess

Der Bootstrap-Prozess in `bootstrap.ts` initialisiert alle notwendigen Services und Komponenten:

1. Initialisierung des Loggers
2. Initialisierung des ErrorHandlers
3. Initialisierung des ValidationService
4. Initialisierung des ApiClient
5. Initialisierung des TokenManager
6. Initialisierung der Prisma-Verbindung
7. Initialisierung aller Repositories
8. Initialisierung aller Services

## Best Practices

1. **Trennung von Domäne und Implementierung**: Halte die Implementierungsdetails im Infrastructure-Modul von der Domäne getrennt.
2. **Fehlerbehandlung**: Implementiere einheitliche Fehlerbehandlung für alle Services und Repositories.
3. **Logging**: Verwende den Logger für alle wichtigen Operationen.
4. **Lazy Initialization**: Initialisiere Services und Repositories erst bei Bedarf.
5. **Testbarkeit**: Gestalte Komponenten so, dass sie gut testbar sind, mit klaren Abhängigkeiten.

## Erweiterung

Beim Hinzufügen neuer Funktionen oder Entitäten:

1. Implementiere das entsprechende Repository-Interface aus dem Domain-Modul
2. Implementiere das entsprechende Service-Interface aus dem Domain-Modul
3. Registriere die neuen Komponenten in den entsprechenden Factory-Funktionen
4. Füge API-Clients nach Bedarf hinzu
5. Aktualisiere den Bootstrap-Prozess, um die neuen Komponenten zu initialisieren
