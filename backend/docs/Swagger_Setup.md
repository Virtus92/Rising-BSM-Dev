# Swagger/OpenAPI Setup

Diese Dokumentation beschreibt die Einrichtung und Verwendung der OpenAPI/Swagger-Dokumentation im Backend der Anwendung.

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [OpenAPI-Spezifikation](#openapi-spezifikation)
3. [Swagger UI Integration](#swagger-ui-integration)
4. [Organisation der API-Definitionen](#organisation-der-api-definitionen)
5. [Erweitern der API-Dokumentation](#erweitern-der-api-dokumentation)
6. [Validierung der Spezifikation](#validierung-der-spezifikation)
7. [Automatische Codegenerierung](#automatische-codegenerierung)
8. [Best Practices](#best-practices)

## Übersicht

Die Anwendung folgt einem API-First-Ansatz, bei dem die API-Spezifikation als zentrale Quelle der Wahrheit dient. Die OpenAPI-Spezifikation (Version 3.0) wird verwendet, um:

1. Die API-Endpunkte, Anforderungsparameter und Antwortstrukturen zu dokumentieren
2. Eine interaktive Dokumentation über Swagger UI bereitzustellen
3. Die Validierung von Anfragen und Antworten zu automatisieren
4. Client-Code zu generieren (TypeScript-Clients für Frontend)

## OpenAPI-Spezifikation

Die Hauptspezifikationsdatei befindet sich unter `/backend/openapi/openapi.yaml`. Diese Datei definiert:

- Allgemeine API-Informationen (Version, Titel, Beschreibung)
- Server-URLs für verschiedene Umgebungen
- Authentifizierungsschemata
- Gemeinsame Parameter und Antwortstrukturen

```yaml
# Auszug aus openapi.yaml
openapi: 3.0.3
info:
  title: Rising BSM API
  description: API für das Rising Business Service Management System
  version: 1.0.0
  contact:
    name: Entwicklungsteam
    email: dev@rising-bsm.com

servers:
  - url: https://api.rising-bsm.com/v1
    description: Produktionsserver
  - url: https://staging-api.rising-bsm.com/v1
    description: Staging-Server
  - url: http://localhost:4000/v1
    description: Lokaler Entwicklungsserver

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT-Token im Authorization-Header
  
  schemas:
    # Gemeinsame Antwortstrukturen
    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
        message:
          type: string
    
    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object
    
    # Weitere Schemadefinitionen...

# Standardsicherheitsanforderung für alle Endpunkte
security:
  - BearerAuth: []

# Die tatsächlichen Pfade werden über Referenzen zu externen Dateien definiert
paths:
  # Pfadreferenzen werden hier eingebunden
```

## Swagger UI Integration

Die Swagger UI wird automatisch in die Anwendung integriert und ist im Entwicklungsmodus unter `/api-docs` verfügbar. Die Integration erfolgt über:

```javascript
// Auszug aus dem SwaggerConfig-Service
export class SwaggerConfig {
  constructor(
    private readonly logger: ILoggingService
  ) {}

  setupSwagger(app: Express): void {
    try {
      // OpenAPI-Spezifikation laden
      const apiSpec = YAML.load(path.join(process.cwd(), 'openapi/openapi.yaml'));
      
      // Swagger UI-Optionen
      const options = {
        explorer: true,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true
        }
      };
      
      // Swagger UI einrichten
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpec, options));
      
      // Rohspezifikation als JSON verfügbar machen
      app.get('/openapi.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(apiSpec);
      });
      
      this.logger.info('Swagger UI erfolgreich eingerichtet unter /api-docs');
    } catch (error) {
      this.logger.error('Fehler beim Einrichten von Swagger UI:', error);
    }
  }
}
```

## Organisation der API-Definitionen

Die API-Definitionen werden modular organisiert, um die Wartbarkeit zu verbessern:

```
/backend/openapi/
├── openapi.yaml              # Hauptdefinitionsdatei
├── paths/                    # Pfaddefinitionen (Endpunkte)
│   ├── auth.yaml             # Authentifizierungsendpunkte
│   ├── users.yaml            # Benutzerendpunkte
│   ├── customers.yaml        # Kundenendpunkte
│   ├── projects.yaml         # Projektendpunkte
│   ├── appointments.yaml     # Terminendpunkte
│   ├── services.yaml         # Dienstleistungsendpunkte
│   ├── requests.yaml         # Kontaktanfragenendpunkte
│   ├── notifications.yaml    # Benachrichtigungsendpunkte
│   └── settings.yaml         # Einstellungsendpunkte
└── schemas/                  # Schemadefinitionen (Datenmodelle)
    ├── auth.yaml             # Authentifizierungsschemata
    ├── users.yaml            # Benutzerschemata
    ├── customers.yaml        # Kundenschemata
    ├── projects.yaml         # Projektschemata
    ├── appointments.yaml     # Terminschemata
    ├── services.yaml         # Dienstleistungsschemata
    ├── requests.yaml         # Kontaktanfragenschemata
    ├── notifications.yaml    # Benachrichtigungsschemata
    └── common.yaml           # Gemeinsame Schemata
```

Jede Pfaddatei definiert die Endpunkte für eine bestimmte Ressource:

```yaml
# Beispiel: paths/users.yaml
/users:
  get:
    summary: Alle Benutzer abrufen
    description: Ruft eine Liste aller Benutzer ab, mit Paginierung und Filteroptionen.
    operationId: getAllUsers
    tags:
      - Benutzer
    parameters:
      - $ref: '../schemas/common.yaml#/components/parameters/PageParam'
      - $ref: '../schemas/common.yaml#/components/parameters/LimitParam'
      - name: role
        in: query
        description: Filter nach Benutzerrolle
        schema:
          type: string
          enum: [admin, manager, employee]
      - name: status
        in: query
        description: Filter nach Benutzerstatus
        schema:
          type: string
          enum: [active, inactive, pending]
    responses:
      '200':
        description: Liste der Benutzer erfolgreich abgerufen
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    users:
                      type: array
                      items:
                        $ref: '../schemas/users.yaml#/components/schemas/User'
                    pagination:
                      $ref: '../schemas/common.yaml#/components/schemas/Pagination'
      '401':
        $ref: '../schemas/common.yaml#/components/responses/UnauthorizedError'
      '403':
        $ref: '../schemas/common.yaml#/components/responses/ForbiddenError'
    security:
      - BearerAuth: []
```

## Erweitern der API-Dokumentation

Um die API-Dokumentation zu erweitern oder zu aktualisieren:

1. **Neue Endpunkte hinzufügen**:
   - Identifizieren Sie den entsprechenden Ressourcentyp (z.B. Benutzer, Projekte)
   - Fügen Sie den neuen Endpunkt zur entsprechenden Pfaddatei hinzu oder erstellen Sie eine neue

2. **Neue Datenmodelle hinzufügen**:
   - Erstellen oder aktualisieren Sie Schemadefinitionen in der entsprechenden Schemadatei
   - Stellen Sie sicher, dass alle erforderlichen Eigenschaften, Validierungen und Beispiele dokumentiert sind

3. **Beispielanfragen und -antworten**:
   - Fügen Sie aussagekräftige Beispiele hinzu, um die Verwendung der API zu veranschaulichen
   - Dokumentieren Sie alle möglichen Antwortcodes und Fehlerbedingungen

4. **Validieren der Aktualisierungen**:
   - Verwenden Sie einen OpenAPI-Validator, um die aktualisierten Spezifikationen zu validieren
   - Testen Sie die aktualisierten Definitionen mit Swagger UI

### Beispiel für das Hinzufügen eines neuen Endpunkts

1. Identifizieren Sie die passende Pfaddatei (z.B. `paths/customers.yaml` für einen neuen Kundenendpunkt)

2. Fügen Sie den neuen Endpunkt hinzu:

```yaml
/customers/inactive:
  get:
    summary: Inaktive Kunden abrufen
    description: Ruft eine Liste aller inaktiven Kunden ab.
    operationId: getInactiveCustomers
    tags:
      - Kunden
    parameters:
      - $ref: '../schemas/common.yaml#/components/parameters/PageParam'
      - $ref: '../schemas/common.yaml#/components/parameters/LimitParam'
    responses:
      '200':
        description: Liste der inaktiven Kunden erfolgreich abgerufen
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    customers:
                      type: array
                      items:
                        $ref: '../schemas/customers.yaml#/components/schemas/Customer'
                    pagination:
                      $ref: '../schemas/common.yaml#/components/schemas/Pagination'
      '401':
        $ref: '../schemas/common.yaml#/components/responses/UnauthorizedError'
    security:
      - BearerAuth: []
```

## Validierung der Spezifikation

Die OpenAPI-Spezifikation wird bei der Entwicklung validiert, um sicherzustellen, dass sie korrekt ist:

1. **Lokale Validierung**:
   - Verwenden Sie das `openapi-validator`-Tool, um die Spezifikation zu validieren
   - Führen Sie das Validierungstool bei Änderungen an der Spezifikation aus

2. **Automatisierte Validierung**:
   - Die CI/CD-Pipeline validiert die Spezifikation bei jedem Push
   - Fehler in der Spezifikation verhindern die Bereitstellung

3. **Lint-Regeln**:
   - Verwenden Sie `spectral` oder ähnliche Tools, um Konsistenz in der Spezifikation zu gewährleisten
   - Konfigurieren Sie benutzerdefinierte Lint-Regeln entsprechend den Projektstandards

Beispiel für Lint-Regeln:

```javascript
// .spectral.yaml
extends: ["spectral:oas", "spectral:asyncapi"]
rules:
  operation-tags: error
  operation-operationId: error
  operation-summary: error
  operation-description: warning
  path-params: error
  no-$ref-siblings: off
```

## Automatische Codegenerierung

Die OpenAPI-Spezifikation wird verwendet, um TypeScript-Clients für das Frontend zu generieren:

1. **TypeScript-Client**:
   - Verwenden Sie `openapi-generator` oder ein ähnliches Tool, um einen TypeScript-Client zu generieren
   - Der generierte Code wird im Frontend-Projekt im Verzeichnis `src/api` gespeichert

2. **Modell-Interfaces**:
   - Die Datenmodelle werden als TypeScript-Interfaces generiert
   - Diese Interfaces werden für die Typsicherheit im Frontend verwendet

Beispielbefehl für die Codegenerierung:

```bash
# openapi-generator-cli wird verwendet, um Frontend-Code zu generieren
openapi-generator-cli generate \
  -i ./openapi/openapi.yaml \
  -g typescript-axios \
  -o ../frontend/src/api \
  --additional-properties=withSeparateModelsAndApi=true,modelPropertyNaming=camelCase
```

Ein NPM-Skript im `package.json` kann für die Codegenerierung eingerichtet werden:

```json
{
  "scripts": {
    "generate-api": "openapi-generator-cli generate -i ./openapi/openapi.yaml -g typescript-axios -o ../frontend/src/api --additional-properties=withSeparateModelsAndApi=true,modelPropertyNaming=camelCase"
  }
}
```

## Best Practices

Bei der Arbeit mit der OpenAPI/Swagger-Dokumentation sollten folgende Best Practices beachtet werden:

1. **API-First-Entwicklung**:
   - Beginnen Sie mit der Definition der API (OpenAPI-Spezifikation)
   - Implementieren Sie dann den Server-Code basierend auf der Spezifikation
   - Verwenden Sie die generierte Client-Bibliothek im Frontend

2. **Konsistente Benennung**:
   - Verwenden Sie konsistente Benennungskonventionen (z.B. camelCase für Eigenschaften, PascalCase für Schemata)
   - Pfade sollten RESTful sein (z.B. `/users/{id}` statt `/getUser/{id}`)
   - Operations-IDs sollten Verben enthalten (z.B. `createUser`, `getAllUsers`)

3. **Vollständige Dokumentation**:
   - Dokumentieren Sie alle Parameter, Anforderungen und Antworten
   - Fügen Sie Beschreibungen und Beispiele hinzu
   - Dokumentieren Sie Fehlerszenarien und deren Antworten

4. **Versionierung**:
   - Verwenden Sie semantische Versionierung für die API
   - Dokumentieren Sie Breaking Changes
   - Erwägen Sie die Verwendung von API-Versionspfaden (z.B. `/v1/users`)

5. **Erweiterte Funktionen**:
   - Nutzen Sie Diskriminator-Mappings für polymorphe Modelle
   - Verwenden Sie Komponenten-Referenzen für wiederverwendbare Elemente
   - Definieren Sie Beispiele für komplexe Anforderungen und Antworten

Die Einhaltung dieser Best Practices gewährleistet eine gut dokumentierte, konsistente und wartbare API.