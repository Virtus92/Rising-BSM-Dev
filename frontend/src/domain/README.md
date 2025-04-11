# Domain-Modul

## Übersicht

Das Domain-Modul bildet das Herzstück der Anwendung und definiert die Geschäftsdomäne. Es enthält die Kernkonzepte und Geschäftsregeln und ist unabhängig von externen Frameworks und spezifischen Implementierungsdetails.

## Struktur

```
domain/
├── dtos/              # Data Transfer Objects
├── entities/          # Domänenentitäten
├── enums/             # Enumerationen und konstante Werte
├── repositories/      # Repository-Interfaces
├── services/          # Service-Interfaces
├── types/             # TypeScript-Typdefinitionen und -Deklarationen
│   ├── next-auth.d.ts # NextAuth-Typerweiterungen
│   └── next.d.ts      # Next.js-Typerweiterungen
└── index.ts           # Export aller Domain-Komponenten
```

## Verantwortlichkeiten

Das Domain-Modul hat folgende Verantwortlichkeiten:

1. Definition der Kernentitäten des Geschäftsmodells
2. Definition der Data Transfer Objects (DTOs) für die Kommunikation
3. Definition der Repository-Interfaces für die Datenpersistenz
4. Definition der Service-Interfaces für die Geschäftslogik
5. Definition von Enumerationen und konstanten Werten
6. Definition von TypeScript-Typerweiterungen für Next.js und NextAuth

## Komponenten

### Entitäten

Entitäten repräsentieren die Kernkonzepte der Geschäftsdomäne:

- `User`: Benutzer und deren Berechtigungen
- `Customer`: Kundendaten
- `Appointment`: Termine und Zeitpläne
- `ContactRequest`: Kundenanfragen
- `Notification`: Benachrichtigungen
- `ActivityLog`: Aktivitätsprotokollierung
- `RefreshToken`: Token für die Authentifizierung

Alle Entitäten erben von `BaseEntity`, die gemeinsame Eigenschaften wie `id`, `createdAt` und `updatedAt` definiert.

### DTOs (Data Transfer Objects)

DTOs sind leichtgewichtige Objekte für die Datenübertragung zwischen Schichten:

- `UserDto`: Benutzerinformationen
- `CustomerDto`: Kundeninformationen
- `AppointmentDto`: Termininformationen
- `RequestDto`: Anfrageinformationen
- `AuthDto`: Authentifizierungsdaten
- `ActivityLogDto`: Aktivitätsprotokolldaten
- `NotificationDto`: Benachrichtigungsdaten

DTOs werden verwendet, um Daten zwischen API und UI zu übertragen und validieren.

### Repository-Interfaces

Repository-Interfaces definieren Methoden für den Datenzugriff:

- `IUserRepository`: Benutzerdatenzugriff
- `ICustomerRepository`: Kundendatenzugriff
- `IAppointmentRepository`: Termindatenzugriff
- `IRequestRepository`: Anfragedatenzugriff
- `IActivityLogRepository`: Zugriff auf Aktivitätsprotokolle
- `INotificationRepository`: Zugriff auf Benachrichtigungen
- `IRefreshTokenRepository`: Zugriff auf Refresh-Tokens

Alle Repository-Interfaces erweitern `IBaseRepository<T>`, das grundlegende CRUD-Operationen definiert.

### Service-Interfaces

Service-Interfaces definieren die Geschäftslogik:

- `IUserService`: Benutzerverwaltung
- `ICustomerService`: Kundenverwaltung
- `IAppointmentService`: Terminverwaltung
- `IRequestService`: Anfragenverwaltung
- `IAuthService`: Authentifizierung und Autorisierung
- `IActivityLogService`: Aktivitätsprotokollierung
- `INotificationService`: Benachrichtigungsverwaltung
- `IRefreshTokenService`: Token-Verwaltung

Alle Service-Interfaces erweitern `IBaseService<T>`, das grundlegende Operationen definiert.

### Enumerationen

Enumerationen definieren konstante Werte und Typen:

- `UserRole`: Benutzerrollen (ADMIN, MANAGER, STAFF)
- `RequestStatus`: Anfragestatus (NEW, IN_PROGRESS, COMPLETED, CANCELLED)
- `AppointmentStatus`: Terminstatus (SCHEDULED, COMPLETED, CANCELLED)
- `EntityType`: Entitätstypen für die Aktivitätsprotokollierung
- `ValidationResult`: Validierungsergebnisse

## Verwendung

Das Domain-Modul wird von anderen Modulen importiert, jedoch werden die Domain-Komponenten nie direkt implementiert. Stattdessen werden die Interfaces im Infrastructure-Modul implementiert und über Dependency Injection bereitgestellt.

### Beispiel für den Import:

```typescript
import { 
  User, 
  UserDto, 
  UserRole, 
  IUserRepository, 
  IUserService 
} from '@/domain';
```

## Best Practices

1. **Unabhängigkeit bewahren**: Das Domain-Modul sollte keine Abhängigkeiten zu externen Frameworks oder Bibliotheken haben.
2. **Reine Geschäftslogik**: Halte die Domäne frei von Implementierungsdetails wie HTTP, Datenbanken oder UI.
3. **Sprache der Domäne verwenden**: Verwende eine klare, einheitliche Terminologie, die dem Geschäftskontext entspricht.
4. **Konsistente Namenskonventionen**: Verwende konsistente Namenskonventionen für Interfaces, Entitäten und DTOs.
5. **Minimale Kopplung**: Minimiere Abhängigkeiten zwischen Domain-Komponenten.

## Erweiterung

Beim Hinzufügen neuer Funktionen oder Entitäten:

1. Definiere die neue Entität in `entities/`
2. Erstelle entsprechende DTOs in `dtos/`
3. Definiere Repository-Interfaces in `repositories/`
4. Definiere Service-Interfaces in `services/`
5. Füge Enumerationen nach Bedarf hinzu
6. Exportiere alle neuen Komponenten in `index.ts`
