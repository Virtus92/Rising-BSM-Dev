# Sicherheitsprotokolle

Diese Dokumentation beschreibt die Sicherheitsmaßnahmen und -protokolle, die im Backend der Anwendung implementiert sind.

## Inhaltsverzeichnis

1. [Authentifizierungsablauf](#authentifizierungsablauf)
2. [JSON Web Tokens (JWT)](#json-web-tokens-jwt)
3. [Refresh-Token-Mechanismus](#refresh-token-mechanismus)
4. [Passwortrichtlinien](#passwortrichtlinien)
5. [CORS-Konfiguration](#cors-konfiguration)
6. [Helmet-Konfiguration](#helmet-konfiguration)
7. [Rollenbezogene Zugriffssteuerung (RBAC)](#rollenbezogene-zugriffssteuerung-rbac)
8. [Validierung von Eingabedaten](#validierung-von-eingabedaten)
9. [Logging und Überwachung](#logging-und-überwachung)
10. [Produktionsumgebungs-Sicherheit](#produktionsumgebungs-sicherheit)

## Authentifizierungsablauf

Das System verwendet ein Token-basiertes Authentifizierungssystem mit JSON Web Tokens (JWT) und einem Refresh-Token-Mechanismus:

### Login-Prozess

1. **Benutzeranmeldung**:
   - Der Benutzer übermittelt E-Mail und Passwort an den `/login`-Endpunkt.
   - Das Passwort wird mit dem Hash in der Datenbank verglichen (mit bcrypt).

2. **Token-Generierung**:
   - Bei erfolgreicher Authentifizierung werden zwei Token generiert:
     - Ein kurzlebiges Access Token (JWT, 15 Minuten gültig)
     - Ein langlebiges Refresh Token (7 Tage gültig)
   - Das Refresh Token wird in der Datenbank gespeichert, um es widerrufen zu können

3. **Token-Rückgabe**:
   - Beide Token werden an den Client zurückgegeben
   - Der Client speichert sie (z.B. im localStorage oder als HTTP-Only-Cookie)

### Token-Verwaltung

1. **Authentifizierung von Anfragen**:
   - Für geschützte Endpunkte sendet der Client das JWT im Authorization-Header
   - Format: `Authorization: Bearer <token>`
   - Der AuthMiddleware verifiziert die Signatur und Gültigkeit des Tokens

2. **Token-Erneuerung**:
   - Wenn das JWT abläuft, verwendet der Client das Refresh Token, um ein neues JWT anzufordern
   - Endpunkt: `POST /auth/refresh-token`
   - Bei erfolgreicher Validierung werden ein neues JWT und ein neues Refresh Token ausgestellt
   - Das alte Refresh Token wird in der Datenbank als ersetzt markiert

3. **Logout**:
   - Der Benutzer meldet sich ab, indem er das Refresh Token zum `/auth/logout`-Endpunkt sendet
   - Das Token wird in der Datenbank als widerrufen markiert

## JSON Web Tokens (JWT)

Die Anwendung verwendet JWTs für die Authentifizierung mit folgenden Merkmalen:

### JWT-Konfiguration

- **Signaturalgorithmus**: HS256 (HMAC mit SHA-256)
- **Secret Key**: In der Umgebungsvariable `JWT_SECRET` definiert
- **Gültigkeitsdauer**: 15 Minuten (konfigurierbar über `JWT_EXPIRY`)

### JWT-Payload

```json
{
  "sub": "1",                  // Benutzer-ID
  "role": "admin",             // Benutzerrolle
  "email": "user@example.com", // Benutzer-E-Mail
  "name": "Max Mustermann",    // Benutzername
  "iat": 1620000000,           // Ausstellungszeitpunkt
  "exp": 1620001800            // Ablaufzeitpunkt
}
```

### JWT-Validierung

- Verifizierung der Token-Signatur mit dem Secret Key
- Überprüfung der Ablaufzeit (exp claim)
- Extraktion der Benutzerinformationen (sub, role, etc.)

## Refresh-Token-Mechanismus

Die Anwendung implementiert ein sicheres Refresh-Token-System:

### Refresh-Token-Eigenschaften

- **Format**: Kryptografisch sichere Zufallszeichenfolge (64-Zeichen)
- **Speicherung**: In der `RefreshToken`-Tabelle der Datenbank
- **Gültigkeitsdauer**: 7 Tage (konfigurierbar über `REFRESH_TOKEN_EXPIRY`)
- **Token-Rotation**: Bei jeder Verwendung wird ein neues Token ausgestellt

### Refresh-Token-Sicherheitsmerkmale

- **Eindeutige Zuordnung**: Jedes Token ist einem bestimmten Benutzer zugeordnet
- **IP-Adressprotokollierung**: Die Client-IP-Adresse wird bei Erstellung und Widerruf protokolliert
- **Widerrufsverfolgung**: Widerrufene Token werden nicht gelöscht, sondern als widerrufen markiert
- **Token-Kette**: Ersetzungsbeziehungen werden verfolgt (`replacedByToken`)
- **Automatisches Löschen**: Abgelaufene Token werden durch einen Cronjob regelmäßig bereinigt

## Passwortrichtlinien

Die Anwendung erzwingt sichere Passwortpraktiken:

### Passwortanforderungen

- **Mindestlänge**: 8 Zeichen
- **Komplexität**: Muss mindestens drei der folgenden Kategorien enthalten:
  - Großbuchstaben (A-Z)
  - Kleinbuchstaben (a-z)
  - Ziffern (0-9)
  - Sonderzeichen (z.B. !@#$%^&*)
- **Zurückweisungskriterien**: Passwörter, die in gängigen Wörterbüchern vorkommen oder zu einfach sind

### Passwort-Hashing

- **Algorithmus**: bcrypt
- **Arbeitsaufwand (cost)**: 12 Runden
- **Implementierung**: Bei der Benutzerregistrierung und Passwortänderung
- **Salting**: Automatisch durch bcrypt implementiert

### Passwort-Zurücksetzung

- **Token-basiert**: Sicheres, einmaliges Token für jede Zurücksetzungsanfrage
- **Begrenzte Gültigkeit**: Token ist 24 Stunden gültig
- **E-Mail-Verifizierung**: Zurücksetzungs-Link wird an die registrierte E-Mail-Adresse gesendet
- **Token-Verifizierung**: Validierung des Tokens vor der Passwortänderung

## CORS-Konfiguration

Die Anwendung verwendet eine restriktive CORS-Konfiguration zum Schutz vor Cross-Site-Anfragen:

```javascript
// CORS-Konfiguration aus dem Backend-Code
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'https://yourdomain.com'];
    
    // Entwicklungsumgebung: Allow localhost ohne Origin-Header
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS-Richtlinie blockiert den Zugriff'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,  // Erlaubt Cookies in Cross-Site-Anfragen
  maxAge: 86400,      // Cache für 24 Stunden
};
```

### CORS-Sicherheitsmerkmale

- **Whitelist für Origins**: Nur zugelassene Domains können zugreifen
- **Konfigurierbar**: Zulässige Origins werden über Umgebungsvariablen konfiguriert
- **Methoden-Beschränkung**: Nur bestimmte HTTP-Methoden sind erlaubt
- **Header-Beschränkung**: Nur bestimmte HTTP-Header sind erlaubt
- **Strict-Origin-Policy**: Im Produktionsmodus werden Anfragen ohne Origin-Header abgelehnt

## Helmet-Konfiguration

Die Anwendung verwendet Helmet, um HTTP-Header für mehr Sicherheit zu konfigurieren:

```javascript
// Helmet-Konfiguration aus dem Backend-Code
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://yourdomain.com"],
      connectSrc: ["'self'", "https://api.yourdomain.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 15552000,  // 180 Tage
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
```

### Wichtige Helmet-Schutzmaßnahmen

1. **Content Security Policy (CSP)**: 
   - Einschränkung, von welchen Quellen Ressourcen geladen werden dürfen
   - Schutz vor XSS und Dateninjektionsangriffen

2. **HTTP Strict Transport Security (HSTS)**: 
   - Erzwingt HTTPS-Verbindungen
   - Schützt vor Protocol Downgrade-Angriffen und Cookie-Hijacking

3. **X-Frame-Options**: 
   - Verhindert Clickjacking, indem die Einbettung der Seite in Frames verboten wird

4. **X-Content-Type-Options**: 
   - Verhindert MIME-Type-Sniffing

5. **Referrer-Policy**: 
   - Kontrolliert, welche Informationen im Referrer-Header enthalten sind
   - Minimiert die Weitergabe von sensiblen Informationen

6. **X-XSS-Protection**: 
   - Aktiviert den eingebauten XSS-Schutz in modernen Browsern

## Rollenbezogene Zugriffssteuerung (RBAC)

Die Anwendung implementiert ein rollenbasiertes Zugriffssteuerungssystem:

### Benutzerrollen

- **Admin**: Vollständiger Zugriff auf alle Funktionen
- **Manager**: Zugriff auf die meisten Funktionen, eingeschränkte administrative Rechte
- **Employee**: Grundlegender Zugriff auf tägliche Betriebsfunktionen

### Autorisierungsmiddleware

```javascript
// Middleware zur Autorisierung basierend auf Benutzerrollen
export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Der Benutzer sollte bereits durch die authenticate()-Middleware authentifiziert sein
    const authenticatedUser = (req as any).user;
    
    if (!authenticatedUser || !authenticatedUser.role) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Keine Berechtigung für diese Aktion'
      });
    }

    if (allowedRoles.includes(authenticatedUser.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Keine Berechtigung für diese Aktion'
    });
  };
}
```

### Zugriffsregeln-Beispiele

- **Benutzer-Endpunkte**:
  ```javascript
  // Alle Benutzer anzeigen (nur Admin)
  router.get('/', 
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN]),
    userController.getAllUsers
  );
  
  // Eigene Benutzerdetails oder als Admin andere Benutzer anzeigen
  router.get('/:id', 
    authMiddleware.authenticate(),
    selfOrAdminAccess,
    userController.getUserById
  );
  ```

- **Kunden-Endpunkte**:
  ```javascript
  // Kunden löschen (nur Admin oder Manager)
  router.delete('/:id', 
    authMiddleware.authenticate(),
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER]),
    customerController.deleteCustomer
  );
  ```

### Datenzugriffssteuerung auf Anwendungsebene

Zusätzlich zur Route-Ebene implementiert die Anwendung Zugriffssteuerung auf Dienstebene, um sicherzustellen, dass Benutzer nur auf die ihnen zugewiesenen Daten zugreifen können:

```javascript
// Beispiel für servicebezogene Zugriffssteuerung
export class AppointmentService {
  // ...
  
  async getAppointmentById(id: number, userId: number, userRole: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    
    if (!appointment) {
      throw new NotFoundError('Termin nicht gefunden');
    }
    
    // Prüfen, ob der Benutzer Zugriff auf diesen Termin hat
    if (userRole !== UserRole.ADMIN && 
        userRole !== UserRole.MANAGER && 
        appointment.createdBy !== userId) {
      throw new ForbiddenError('Keine Berechtigung für den Zugriff auf diesen Termin');
    }
    
    return appointment;
  }
  
  // ...
}
```

## Validierung von Eingabedaten

Die Anwendung verwendet eine robuste Validierungsschicht zum Schutz vor Eingabemanipulation und Injection-Angriffen:

### Validierungsschemata

- Verwendung von Joi für die Schema-Validierung
- Definierte Schemata für alle Anfragen mit Benutzereingaben

Beispiel für ein Validierungsschema:

```javascript
// Beispiel für ein Validierungsschema (Login)
export const loginValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      'any.required': 'E-Mail ist erforderlich'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Passwort ist erforderlich'
    }),
    
  rememberMe: Joi.boolean().optional()
});
```

### Validierungsmiddleware

Die Validierungsmiddleware wird für alle Route-Handler verwendet, die Benutzereingaben akzeptieren:

```javascript
// Validierungsmiddleware
export class ValidationMiddleware {
  constructor(
    private validationService: IValidationService,
    private errorHandler: IErrorHandler
  ) {}

  validate(schema: Joi.Schema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error, value } = this.validationService.validateRequest(req, schema);
        
        if (error) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: error.message,
            details: error.details
          });
        }
        
        // Ersetze validierte Daten im Request-Objekt
        req.body = value.body || req.body;
        req.query = value.query || req.query;
        req.params = value.params || req.params;
        
        next();
      } catch (err) {
        this.errorHandler.handleError(err, req, res, next);
      }
    };
  }
}
```

### Schutz vor gängigen Schwachstellen

1. **SQL Injection**: 
   - Verwendung von Prisma ORM mit vorbereiteten Abfragen
   - Parametrisierte Queries statt String-Verkettung

2. **Cross-Site Scripting (XSS)**: 
   - Sanitization von HTML-Eingaben
   - Content-Security-Policy (CSP) zur Begrenzung von Script-Quellen

3. **CSRF-Schutz**: 
   - Implementierung von CSRF-Token-Validierung für formularbasierte Anfragen
   - SameSite-Cookie-Attribut zur Begrenzung von Cross-Site-Anfragen

4. **Parameter Pollution**: 
   - Konsolidierung doppelter Parameter

## Logging und Überwachung

Die Anwendung implementiert umfassende Logging-Funktionen für Sicherheitsüberwachung:

### Sicherheitsrelevante Ereignisprotokollierung

- **Login-Versuche**: Erfolgreiche und fehlgeschlagene Anmeldungen
- **Aktionskritische Operationen**: Benutzer-/Kundenerstellung, Löschungen, Zugriffsrechteänderungen
- **Ressourcenzugriffe**: Wichtige Datenzugriffe
- **Systemereignisse**: Start/Stopp, Konfigurationsänderungen

Beispiel für einen Logeintrag:

```javascript
// Sicherheitsrelevantes Logging in AuthController
async login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      // Fehlgeschlagener Login-Versuch protokollieren
      this.logger.warn({
        message: 'Failed login attempt',
        email: email,
        ip: ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Ungültige Anmeldeinformationen'
      });
    }
    
    // Token generieren und erfolgreiches Login protokollieren
    // ...
    
    this.logger.info({
      message: 'Successful login',
      userId: user.id,
      email: user.email,
      ip: ip,
      timestamp: new Date().toISOString()
    });
    
    // ...
  } catch (err) {
    next(err);
  }
}
```

### Logging-Konfiguration

- **Formatierung**: Strukturierte JSON-Logs für einfache Analysierbarkeit
- **Vertraulichkeit**: Automatisches Ausblenden sensibler Daten (Passwörter, Tokens)
- **Rotation**: Automatische Log-Rotation, um Speicherplatz zu sparen
- **Persistenz**: Sicherung von Logs für Auditing-Zwecke

### Aktivitätsüberwachung

Die Anwendung speichert Benutzeraktivitäten in der `UserActivity`-Tabelle:

```javascript
// Beispiel für das Protokollieren von Benutzeraktivitäten
export class ActivityService {
  // ...
  
  async logActivity(userId: number, activity: string, ipAddress?: string): Promise<void> {
    await this.prisma.userActivity.create({
      data: {
        userId,
        activity,
        ipAddress,
        timestamp: new Date()
      }
    });
  }
  
  // ...
}
```

## Produktionsumgebungs-Sicherheit

Die Anwendung implementiert zusätzliche Sicherheitsmaßnahmen für Produktionsumgebungen:

### Umgebungsvariablen-Validierung

Die Anwendung validiert kritische Umgebungsvariablen beim Start:

```javascript
// Validierung von Sicherheitskonfigurationen
export function validateSecurityConfig(logger: ILoggingService): void {
  const IS_PRODUCTION = env<string>('NODE_ENV', 'development') === 'production';
  
  // JWT Secret validieren
  const JWT_SECRET = env<string>('JWT_SECRET', '');
  const JWT_REFRESH_SECRET = env<string>('JWT_REFRESH_SECRET', '');
  
  if (IS_PRODUCTION) {
    const insecureSecrets = [
      'your-super-secret-key-change-in-production',
      'test-secret-key-very-secure-for-testing',
      'your-super-secret-refresh-key',
      'your-refresh-secret-key-change-in-production',
      'your-super-secret-development-key',
      'your-super-secret-refresh-key'
    ];
    
    // JWT Secret prüfen
    if (!JWT_SECRET || JWT_SECRET.length < 32 || insecureSecrets.includes(JWT_SECRET)) {
      const error = 'SECURITY RISK: JWT_SECRET is insecure or default in production environment!';
      logger.error(error);
      throw new Error(error);
    }
    
    // Refresh-Token-Secret prüfen
    if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32 || insecureSecrets.includes(JWT_REFRESH_SECRET)) {
      const error = 'SECURITY RISK: JWT_REFRESH_SECRET is insecure or default in production environment!';
      logger.error(error);
      throw new Error(error);
    }
  } else {
    // In Entwicklungsumgebungen nur warnen
    if (JWT_SECRET.length < 32) {
      logger.warn('JWT_SECRET is shorter than recommended (32+ characters)');
    }
    
    if (JWT_REFRESH_SECRET.length < 32) {
      logger.warn('JWT_REFRESH_SECRET is shorter than recommended (32+ characters)');
    }
  }
}
```

### Produktionsspezifische Konfigurationen

Im Produktionsmodus aktiviert die Anwendung zusätzliche Sicherheitsmaßnahmen:

1. **Strikte CORS-Richtlinien**: Nur verifizierte Domains sind zulässig
2. **Verschlüsselte Verbindungen**: Erzwingen von HTTPS-Verbindungen
3. **Rate Limiting**: Begrenzung der Anfragehäufigkeit zum Schutz vor Brute-Force-Angriffen
4. **IP-Blocking**: Automatische Blockierung verdächtiger IP-Adressen
5. **Logging-Verschärfung**: Detailliertere Protokollierung für Sicherheitsereignisse

Die gesamte Anwendung wurde nach Best Practices für die Sicherheit moderner Webanwendungen gestaltet und implementiert einen mehrschichtigen Sicherheitsansatz zum Schutz von Benutzerdaten und Systemintegrität.