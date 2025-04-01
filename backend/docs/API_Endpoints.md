# API Endpoints Dokumentation

Diese Dokumentation bietet einen umfassenden Überblick über alle verfügbaren API-Endpunkte im Backend. Für jeden Endpunkt werden die Route, die HTTP-Methode, erforderliche Berechtigungen, Parameter, Request-Body und Beispielantworten dokumentiert.

## Inhaltsverzeichnis

1. [Authentifizierung](#authentifizierung)
2. [Benutzer](#benutzer)
3. [Kunden](#kunden)
4. [Projekte](#projekte)
5. [Termine](#termine)
6. [Dienstleistungen](#dienstleistungen)
7. [Anfragen](#anfragen)
8. [Benachrichtigungen](#benachrichtigungen)
9. [Einstellungen](#einstellungen)
10. [Dashboard](#dashboard)

## Authentifizierung

Die Authentifizierung verwendet JWT (JSON Web Tokens) mit Refresh-Token-Mechanismus.

### Login

- **Route**: `POST /login`
- **Beschreibung**: Authentifiziert einen Benutzer und gibt JWT + Refresh-Token zurück
- **Auth erforderlich**: Nein
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "sicheres-passwort"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Max Mustermann",
        "email": "user@example.com",
        "role": "employee"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "abcdef123456..."
    }
  }
  ```

### Token erneuern

- **Route**: `POST /auth/refresh-token`
- **Beschreibung**: Erneuert ein abgelaufenes JWT mit einem gültigen Refresh-Token
- **Auth erforderlich**: Nein
- **Request Body**:
  ```json
  {
    "refreshToken": "abcdef123456..."
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "ghijkl789012..."
    }
  }
  ```

### Passwort vergessen

- **Route**: `POST /auth/forgot-password`
- **Beschreibung**: Sendet eine E-Mail mit einem Passwort-Reset-Link
- **Auth erforderlich**: Nein
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Wenn diese E-Mail-Adresse existiert, wurde eine Anweisungs-E-Mail gesendet."
  }
  ```

### Reset-Token validieren

- **Route**: `GET /auth/reset-token/:token`
- **Beschreibung**: Prüft, ob ein Reset-Token gültig ist
- **Auth erforderlich**: Nein
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "valid": true
  }
  ```

### Passwort zurücksetzen

- **Route**: `POST /auth/reset-password/:token`
- **Beschreibung**: Setzt das Passwort mit einem gültigen Reset-Token zurück
- **Auth erforderlich**: Nein
- **Request Body**:
  ```json
  {
    "password": "neues-sicheres-passwort",
    "confirmPassword": "neues-sicheres-passwort"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Passwort erfolgreich zurückgesetzt."
  }
  ```

### Logout

- **Route**: `POST /auth/logout`
- **Beschreibung**: Invalidiert den Refresh-Token eines Benutzers
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "refreshToken": "abcdef123456..."
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Erfolgreich abgemeldet."
  }
  ```

## Benutzer

Die Benutzer-Endpoints verwalten Benutzerkonten und -berechtigungen.

### Alle Benutzer abrufen

- **Route**: `GET /users`
- **Beschreibung**: Liste aller Benutzer im System
- **Auth erforderlich**: Ja (nur Admin)
- **Query-Parameter**:
  - `page`: Seitenzahl (Standard: 1)
  - `limit`: Einträge pro Seite (Standard: 20)
  - `sort`: Sortierfeld (Standard: 'createdAt')
  - `order`: Sortierreihenfolge ('asc' oder 'desc', Standard: 'desc')
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": 1,
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "admin",
          "status": "active",
          "createdAt": "2023-01-15T10:30:00Z"
        },
        // weitere Benutzer...
      ],
      "pagination": {
        "total": 25,
        "page": 1,
        "limit": 20,
        "pages": 2
      }
    }
  }
  ```

### Benutzer suchen

- **Route**: `GET /users/search`
- **Beschreibung**: Sucht nach Benutzern anhand von Suchkriterien
- **Auth erforderlich**: Ja (nur Admin)
- **Query-Parameter**:
  - `query`: Suchbegriff
  - `role`: Rolle (optional)
  - `status`: Status (optional)
  - `page`: Seitenzahl (Standard: 1)
  - `limit`: Einträge pro Seite (Standard: 20)
- **Erfolgreiche Antwort** (200 OK): Ähnlich wie bei "Alle Benutzer abrufen"

### Benutzerstatistiken

- **Route**: `GET /users/statistics`
- **Beschreibung**: Sammelt Statistiken über Benutzer im System
- **Auth erforderlich**: Ja (nur Admin)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "total": 25,
      "active": 22,
      "inactive": 3,
      "byRole": {
        "admin": 2,
        "manager": 5,
        "employee": 18
      },
      "recentlyActive": 15
    }
  }
  ```

### Benutzer nach ID abrufen

- **Route**: `GET /users/:id`
- **Beschreibung**: Ruft detaillierte Informationen zu einem bestimmten Benutzer ab
- **Auth erforderlich**: Ja (eigener Benutzer oder Admin)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Max Mustermann",
        "email": "user@example.com",
        "role": "employee",
        "phone": "+49123456789",
        "status": "active",
        "profilePicture": "https://example.com/profiles/user1.jpg",
        "createdAt": "2023-01-15T10:30:00Z",
        "lastLoginAt": "2023-05-05T08:15:30Z"
      }
    }
  }
  ```

### Benutzer erstellen

- **Route**: `POST /users`
- **Beschreibung**: Erstellt einen neuen Benutzer
- **Auth erforderlich**: Ja (nur Admin)
- **Request Body**:
  ```json
  {
    "name": "Neuer Benutzer",
    "email": "neu@example.com",
    "password": "sicheres-passwort",
    "role": "employee",
    "phone": "+49123456789",
    "status": "active"
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 26,
        "name": "Neuer Benutzer",
        "email": "neu@example.com",
        "role": "employee",
        "status": "active",
        "createdAt": "2023-05-10T14:30:00Z"
      }
    },
    "message": "Benutzer erfolgreich erstellt."
  }
  ```

### Benutzer aktualisieren

- **Route**: `PUT /users/:id`
- **Beschreibung**: Aktualisiert Benutzerinformationen
- **Auth erforderlich**: Ja (nur Admin)
- **Request Body**:
  ```json
  {
    "name": "Aktualisierter Name",
    "email": "aktualisiert@example.com",
    "phone": "+49987654321",
    "role": "manager"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 5,
        "name": "Aktualisierter Name",
        "email": "aktualisiert@example.com",
        "role": "manager",
        "phone": "+49987654321",
        "status": "active",
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Benutzer erfolgreich aktualisiert."
  }
  ```

### Benutzer löschen

- **Route**: `DELETE /users/:id`
- **Beschreibung**: Löscht einen Benutzer
- **Auth erforderlich**: Ja (nur Admin)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Benutzer erfolgreich gelöscht."
  }
  ```

### Benutzerstatus aktualisieren

- **Route**: `PATCH /users/:id/status`
- **Beschreibung**: Ändert den Status eines Benutzers (aktiv/inaktiv)
- **Auth erforderlich**: Ja (nur Admin)
- **Request Body**:
  ```json
  {
    "status": "inactive"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 5,
        "status": "inactive",
        "updatedAt": "2023-05-10T16:00:00Z"
      }
    },
    "message": "Benutzerstatus erfolgreich aktualisiert."
  }
  ```

### Passwort ändern

- **Route**: `PUT /users/:id/password`
- **Beschreibung**: Ändert das Passwort eines Benutzers
- **Auth erforderlich**: Ja (eigener Benutzer oder Admin)
- **Request Body**:
  ```json
  {
    "currentPassword": "altes-passwort",
    "newPassword": "neues-passwort",
    "confirmPassword": "neues-passwort"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Passwort erfolgreich geändert."
  }
  ```

## Kunden

Endpoints zur Verwaltung von Kundeninformationen.

### Alle Kunden abrufen

- **Route**: `GET /customers`
- **Beschreibung**: Liste aller Kunden
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `page`: Seitenzahl (Standard: 1)
  - `limit`: Einträge pro Seite (Standard: 20)
  - `sort`: Sortierfeld (Standard: 'createdAt')
  - `order`: Sortierreihenfolge ('asc' oder 'desc', Standard: 'desc')
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "customers": [
        {
          "id": 1,
          "name": "Firma XYZ GmbH",
          "company": "XYZ GmbH",
          "email": "kontakt@xyz.com",
          "phone": "+49123456789",
          "status": "active",
          "type": "business",
          "createdAt": "2023-02-10T09:15:00Z"
        },
        // weitere Kunden...
      ],
      "pagination": {
        "total": 45,
        "page": 1,
        "limit": 20,
        "pages": 3
      }
    }
  }
  ```

### Kunden nach ID abrufen

- **Route**: `GET /customers/:id`
- **Beschreibung**: Ruft detaillierte Informationen zu einem Kunden ab
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "customer": {
        "id": 1,
        "name": "Firma XYZ GmbH",
        "company": "XYZ GmbH",
        "email": "kontakt@xyz.com",
        "phone": "+49123456789",
        "address": "Musterstraße 123",
        "postalCode": "12345",
        "city": "Berlin",
        "country": "Germany",
        "status": "active",
        "type": "business",
        "newsletter": true,
        "notes": "Wichtiger Geschäftskunde",
        "createdAt": "2023-02-10T09:15:00Z",
        "updatedAt": "2023-04-15T11:30:00Z"
      }
    }
  }
  ```

### Kunden erstellen

- **Route**: `POST /customers`
- **Beschreibung**: Erstellt einen neuen Kunden
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "name": "Anna Schmidt",
    "company": "Schmidt & Partner",
    "email": "info@schmidt-partner.de",
    "phone": "+49123456789",
    "address": "Hauptstraße 42",
    "postalCode": "10115",
    "city": "Berlin",
    "country": "Germany",
    "type": "business",
    "newsletter": true,
    "notes": "Neuer Kunde durch Empfehlung"
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "customer": {
        "id": 46,
        "name": "Anna Schmidt",
        "company": "Schmidt & Partner",
        "email": "info@schmidt-partner.de",
        "status": "active",
        "createdAt": "2023-05-10T14:30:00Z"
      }
    },
    "message": "Kunde erfolgreich erstellt."
  }
  ```

### Kunden aktualisieren

- **Route**: `PUT /customers/:id`
- **Beschreibung**: Aktualisiert Kundeninformationen
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "name": "Anna Schmidt-Müller",
    "phone": "+49987654321",
    "address": "Neue Straße 5",
    "notes": "Aktualisierte Kontaktdaten"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "customer": {
        "id": 46,
        "name": "Anna Schmidt-Müller",
        "phone": "+49987654321",
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Kunde erfolgreich aktualisiert."
  }
  ```

### Kunden löschen

- **Route**: `DELETE /customers/:id`
- **Beschreibung**: Löscht einen Kunden
- **Auth erforderlich**: Ja (nur Admin oder Manager)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Kunde erfolgreich gelöscht."
  }
  ```

## Projekte

Endpoints zur Verwaltung von Projekten.

### Alle Projekte abrufen

- **Route**: `GET /projects`
- **Beschreibung**: Liste aller Projekte
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `page`: Seitenzahl (Standard: 1)
  - `limit`: Einträge pro Seite (Standard: 20)
  - `status`: Projektstatus-Filter (optional)
  - `customerId`: Kunden-ID-Filter (optional)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "projects": [
        {
          "id": 1,
          "title": "Website-Redesign",
          "customerId": 5,
          "customerName": "Musterfirma AG",
          "serviceId": 3,
          "serviceName": "Webdesign",
          "status": "in-progress",
          "startDate": "2023-03-01",
          "endDate": "2023-05-31"
        },
        // weitere Projekte...
      ],
      "pagination": {
        "total": 28,
        "page": 1,
        "limit": 20,
        "pages": 2
      }
    }
  }
  ```

### Projekt nach ID abrufen

- **Route**: `GET /projects/:id`
- **Beschreibung**: Ruft detaillierte Informationen zu einem Projekt ab
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "project": {
        "id": 1,
        "title": "Website-Redesign",
        "customerId": 5,
        "customerName": "Musterfirma AG",
        "serviceId": 3,
        "serviceName": "Webdesign",
        "status": "in-progress",
        "startDate": "2023-03-01",
        "endDate": "2023-05-31",
        "amount": 5000.00,
        "description": "Komplettes Redesign der Unternehmenswebsite mit responsivem Design",
        "createdBy": 2,
        "createdByName": "Max Mustermann",
        "createdAt": "2023-02-15T10:00:00Z",
        "updatedAt": "2023-04-10T14:20:00Z",
        "notes": [
          {
            "id": 5,
            "text": "Kunde wünscht zusätzlich einen Blog-Bereich",
            "userId": 2,
            "userName": "Max Mustermann",
            "createdAt": "2023-03-05T09:30:00Z"
          }
        ]
      }
    }
  }
  ```

### Projekt erstellen

- **Route**: `POST /projects`
- **Beschreibung**: Erstellt ein neues Projekt
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "title": "SEO-Optimierung",
    "customerId": 8,
    "serviceId": 5,
    "startDate": "2023-06-01",
    "endDate": "2023-07-31",
    "amount": 2500.00,
    "description": "Suchmaschinenoptimierung für die bestehende Website",
    "status": "new"
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "project": {
        "id": 29,
        "title": "SEO-Optimierung",
        "customerId": 8,
        "serviceId": 5,
        "status": "new",
        "createdBy": 2,
        "createdAt": "2023-05-10T14:30:00Z"
      }
    },
    "message": "Projekt erfolgreich erstellt."
  }
  ```

### Projekt aktualisieren

- **Route**: `PUT /projects/:id`
- **Beschreibung**: Aktualisiert Projektinformationen
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "title": "SEO-Optimierung Plus",
    "endDate": "2023-08-15",
    "amount": 3000.00,
    "status": "in-progress"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "project": {
        "id": 29,
        "title": "SEO-Optimierung Plus",
        "status": "in-progress",
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Projekt erfolgreich aktualisiert."
  }
  ```

### Projekt löschen

- **Route**: `DELETE /projects/:id`
- **Beschreibung**: Löscht ein Projekt
- **Auth erforderlich**: Ja (nur Admin oder Manager)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Projekt erfolgreich gelöscht."
  }
  ```

### Projektnotiz hinzufügen

- **Route**: `POST /projects/:id/notes`
- **Beschreibung**: Fügt eine Notiz zu einem Projekt hinzu
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "text": "Kunde wünscht wöchentliche Fortschrittsberichte."
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "note": {
        "id": 15,
        "projectId": 29,
        "text": "Kunde wünscht wöchentliche Fortschrittsberichte.",
        "userId": 2,
        "userName": "Max Mustermann",
        "createdAt": "2023-05-10T16:00:00Z"
      }
    },
    "message": "Notiz erfolgreich hinzugefügt."
  }
  ```

## Termine

Endpoints zur Verwaltung von Terminen.

### Alle Termine abrufen

- **Route**: `GET /appointments`
- **Beschreibung**: Liste aller Termine
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `page`: Seitenzahl (Standard: 1)
  - `limit`: Einträge pro Seite (Standard: 20)
  - `startDate`: Filtere nach Startdatum (YYYY-MM-DD)
  - `endDate`: Filtere nach Enddatum (YYYY-MM-DD)
  - `status`: Terminstatusstatus-Filter (optional)
  - `customerId`: Kunden-ID-Filter (optional)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "appointments": [
        {
          "id": 1,
          "title": "Erstgespräch",
          "customerId": 12,
          "customerName": "Hans Meyer",
          "appointmentDate": "2023-05-15T10:00:00Z",
          "duration": 60,
          "status": "planned"
        },
        // weitere Termine...
      ],
      "pagination": {
        "total": 35,
        "page": 1,
        "limit": 20,
        "pages": 2
      }
    }
  }
  ```

### Termin nach ID abrufen

- **Route**: `GET /appointments/:id`
- **Beschreibung**: Ruft detaillierte Informationen zu einem Termin ab
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "appointment": {
        "id": 1,
        "title": "Erstgespräch",
        "customerId": 12,
        "customerName": "Hans Meyer",
        "projectId": 8,
        "projectTitle": "Steuerberatung 2023",
        "appointmentDate": "2023-05-15T10:00:00Z",
        "duration": 60,
        "location": "Büro, Raum 3",
        "description": "Erstberatung für Steuerjahr 2023",
        "status": "planned",
        "createdBy": 3,
        "createdByName": "Maria Schmidt",
        "createdAt": "2023-05-02T14:30:00Z",
        "updatedAt": "2023-05-02T14:30:00Z",
        "notes": [
          {
            "id": 3,
            "text": "Kunde bringt Unterlagen vom Vorjahr mit",
            "userId": 3,
            "userName": "Maria Schmidt",
            "createdAt": "2023-05-03T09:15:00Z"
          }
        ]
      }
    }
  }
  ```

### Termin erstellen

- **Route**: `POST /appointments`
- **Beschreibung**: Erstellt einen neuen Termin
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "title": "Projektabschlussgespräch",
    "customerId": 5,
    "projectId": 29,
    "appointmentDate": "2023-08-20T14:00:00Z",
    "duration": 90,
    "location": "Online (Zoom)",
    "description": "Abschlussbesprechung des SEO-Projekts",
    "status": "planned"
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "appointment": {
        "id": 36,
        "title": "Projektabschlussgespräch",
        "customerId": 5,
        "projectId": 29,
        "appointmentDate": "2023-08-20T14:00:00Z",
        "status": "planned",
        "createdBy": 2,
        "createdAt": "2023-05-10T14:30:00Z"
      }
    },
    "message": "Termin erfolgreich erstellt."
  }
  ```

### Termin aktualisieren

- **Route**: `PUT /appointments/:id`
- **Beschreibung**: Aktualisiert Termininformationen
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "appointmentDate": "2023-08-21T15:00:00Z",
    "duration": 120,
    "status": "confirmed"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "appointment": {
        "id": 36,
        "appointmentDate": "2023-08-21T15:00:00Z",
        "duration": 120,
        "status": "confirmed",
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Termin erfolgreich aktualisiert."
  }
  ```

### Termin löschen

- **Route**: `DELETE /appointments/:id`
- **Beschreibung**: Löscht einen Termin
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Termin erfolgreich gelöscht."
  }
  ```

### Terminnotiz hinzufügen

- **Route**: `POST /appointments/:id/notes`
- **Beschreibung**: Fügt eine Notiz zu einem Termin hinzu
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "text": "Kunde möchte eine Zusammenfassung per E-Mail nach dem Meeting."
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "note": {
        "id": 20,
        "appointmentId": 36,
        "text": "Kunde möchte eine Zusammenfassung per E-Mail nach dem Meeting.",
        "userId": 2,
        "userName": "Max Mustermann",
        "createdAt": "2023-05-10T16:00:00Z"
      }
    },
    "message": "Notiz erfolgreich hinzugefügt."
  }
  ```

## Dienstleistungen

Endpoints zur Verwaltung von Dienstleistungen.

### Alle Dienstleistungen abrufen

- **Route**: `GET /services`
- **Beschreibung**: Liste aller Dienstleistungen
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `active`: Filtere nach aktiven/inaktiven Dienstleistungen (true/false)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "services": [
        {
          "id": 1,
          "name": "Steuerberatung",
          "basePrice": 120.00,
          "vatRate": 20.00,
          "active": true
        },
        {
          "id": 2,
          "name": "Buchhaltung",
          "basePrice": 80.00,
          "vatRate": 20.00,
          "active": true
        },
        // weitere Dienstleistungen...
      ]
    }
  }
  ```

### Dienstleistung nach ID abrufen

- **Route**: `GET /services/:id`
- **Beschreibung**: Ruft detaillierte Informationen zu einer Dienstleistung ab
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "service": {
        "id": 1,
        "name": "Steuerberatung",
        "description": "Umfassende Steuerberatung für Unternehmen und Privatpersonen",
        "basePrice": 120.00,
        "vatRate": 20.00,
        "active": true,
        "unit": "Stunde",
        "createdAt": "2023-01-05T10:00:00Z",
        "updatedAt": "2023-03-10T14:20:00Z"
      }
    }
  }
  ```

### Dienstleistung erstellen

- **Route**: `POST /services`
- **Beschreibung**: Erstellt eine neue Dienstleistung
- **Auth erforderlich**: Ja (nur Admin oder Manager)
- **Request Body**:
  ```json
  {
    "name": "Unternehmensberatung",
    "description": "Strategische Beratung für kleine und mittlere Unternehmen",
    "basePrice": 150.00,
    "vatRate": 20.00,
    "unit": "Stunde",
    "active": true
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "service": {
        "id": 10,
        "name": "Unternehmensberatung",
        "basePrice": 150.00,
        "active": true,
        "createdAt": "2023-05-10T14:30:00Z"
      }
    },
    "message": "Dienstleistung erfolgreich erstellt."
  }
  ```

### Dienstleistung aktualisieren

- **Route**: `PUT /services/:id`
- **Beschreibung**: Aktualisiert Dienstleistungsinformationen
- **Auth erforderlich**: Ja (nur Admin oder Manager)
- **Request Body**:
  ```json
  {
    "name": "Premium Unternehmensberatung",
    "basePrice": 180.00,
    "description": "Erweiterte strategische Beratung mit Potenzialanalyse"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "service": {
        "id": 10,
        "name": "Premium Unternehmensberatung",
        "basePrice": 180.00,
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Dienstleistung erfolgreich aktualisiert."
  }
  ```

### Dienstleistung löschen

- **Route**: `DELETE /services/:id`
- **Beschreibung**: Löscht eine Dienstleistung
- **Auth erforderlich**: Ja (nur Admin)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Dienstleistung erfolgreich gelöscht."
  }
  ```

## Anfragen

Endpoints zur Verwaltung von Kontaktanfragen.

### Alle Anfragen abrufen

- **Route**: `GET /requests`
- **Beschreibung**: Liste aller Kontaktanfragen
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `page`: Seitenzahl (Standard: 1)
  - `limit`: Einträge pro Seite (Standard: 20)
  - `status`: Statusfilter (optional)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "requests": [
        {
          "id": 1,
          "name": "Lisa Müller",
          "email": "lisa.mueller@example.com",
          "service": "Steuerberatung",
          "status": "new",
          "createdAt": "2023-05-05T09:30:00Z"
        },
        // weitere Anfragen...
      ],
      "pagination": {
        "total": 18,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
  }
  ```

### Anfrage nach ID abrufen

- **Route**: `GET /requests/:id`
- **Beschreibung**: Ruft detaillierte Informationen zu einer Anfrage ab
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "request": {
        "id": 1,
        "name": "Lisa Müller",
        "email": "lisa.mueller@example.com",
        "phone": "+49123456789",
        "service": "Steuerberatung",
        "message": "Ich benötige Hilfe bei meiner Steuererklärung für das Jahr 2022.",
        "status": "new",
        "processorId": null,
        "createdAt": "2023-05-05T09:30:00Z",
        "updatedAt": "2023-05-05T09:30:00Z",
        "notes": []
      }
    }
  }
  ```

### Anfrage aktualisieren

- **Route**: `PUT /requests/:id`
- **Beschreibung**: Aktualisiert den Status einer Anfrage
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "status": "in-progress",
    "processorId": 2
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "request": {
        "id": 1,
        "status": "in-progress",
        "processorId": 2,
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Anfrage erfolgreich aktualisiert."
  }
  ```

### Anfrage löschen

- **Route**: `DELETE /requests/:id`
- **Beschreibung**: Löscht eine Anfrage
- **Auth erforderlich**: Ja (nur Admin oder Manager)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Anfrage erfolgreich gelöscht."
  }
  ```

### Anfrage-Notiz hinzufügen

- **Route**: `POST /requests/:id/notes`
- **Beschreibung**: Fügt eine Notiz zu einer Anfrage hinzu
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "text": "Kunde telefonisch kontaktiert, wir haben einen Termin für nächste Woche vereinbart."
  }
  ```
- **Erfolgreiche Antwort** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "note": {
        "id": 5,
        "requestId": 1,
        "text": "Kunde telefonisch kontaktiert, wir haben einen Termin für nächste Woche vereinbart.",
        "userId": 2,
        "userName": "Max Mustermann",
        "createdAt": "2023-05-10T16:00:00Z"
      }
    },
    "message": "Notiz erfolgreich hinzugefügt."
  }
  ```

## Benachrichtigungen

Endpoints zur Verwaltung von Benutzerbenachrichtigungen.

### Alle Benachrichtigungen abrufen

- **Route**: `GET /notifications`
- **Beschreibung**: Liste aller Benachrichtigungen für den aktuellen Benutzer
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `page`: Seitenzahl (Standard: 1)
  - `limit`: Einträge pro Seite (Standard: 20)
  - `read`: Filtere nach gelesenen/ungelesenen Benachrichtigungen (true/false)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "notifications": [
        {
          "id": 1,
          "title": "Neuer Termin",
          "message": "Ein neuer Termin wurde für Sie eingetragen",
          "read": false,
          "createdAt": "2023-05-09T14:30:00Z"
        },
        // weitere Benachrichtigungen...
      ],
      "pagination": {
        "total": 12,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
  }
  ```

### Benachrichtigung als gelesen markieren

- **Route**: `PATCH /notifications/:id/read`
- **Beschreibung**: Markiert eine Benachrichtigung als gelesen
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "notification": {
        "id": 1,
        "read": true,
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Benachrichtigung als gelesen markiert."
  }
  ```

### Alle Benachrichtigungen als gelesen markieren

- **Route**: `POST /notifications/read-all`
- **Beschreibung**: Markiert alle Benachrichtigungen des Benutzers als gelesen
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "message": "Alle Benachrichtigungen wurden als gelesen markiert."
  }
  ```

## Einstellungen

Endpoints zur Verwaltung von Benutzer- und Systemeinstellungen.

### Benutzereinstellungen abrufen

- **Route**: `GET /settings/user`
- **Beschreibung**: Ruft die Einstellungen des aktuellen Benutzers ab
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "settings": {
        "id": 1,
        "userId": 2,
        "darkMode": true,
        "emailNotifications": true,
        "pushNotifications": false,
        "language": "de",
        "notificationInterval": "immediate",
        "updatedAt": "2023-04-10T15:20:00Z"
      }
    }
  }
  ```

### Benutzereinstellungen aktualisieren

- **Route**: `PUT /settings/user`
- **Beschreibung**: Aktualisiert die Einstellungen des aktuellen Benutzers
- **Auth erforderlich**: Ja
- **Request Body**:
  ```json
  {
    "darkMode": false,
    "language": "en",
    "pushNotifications": true
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "settings": {
        "id": 1,
        "darkMode": false,
        "language": "en",
        "pushNotifications": true,
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Einstellungen erfolgreich aktualisiert."
  }
  ```

### Systemeinstellungen abrufen

- **Route**: `GET /settings/system`
- **Beschreibung**: Ruft Systemeinstellungen ab
- **Auth erforderlich**: Ja (nur Admin)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "settings": [
        {
          "id": 1,
          "key": "company_name",
          "value": "Rising BSM GmbH",
          "description": "Name des Unternehmens"
        },
        {
          "id": 2,
          "key": "default_vat_rate",
          "value": "20",
          "description": "Standard-Mehrwertsteuersatz in Prozent"
        },
        // weitere Einstellungen...
      ]
    }
  }
  ```

### Systemeinstellung aktualisieren

- **Route**: `PUT /settings/system/:key`
- **Beschreibung**: Aktualisiert eine Systemeinstellung
- **Auth erforderlich**: Ja (nur Admin)
- **Request Body**:
  ```json
  {
    "value": "Rising Business Solutions GmbH",
    "description": "Vollständiger Unternehmensname"
  }
  ```
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "setting": {
        "id": 1,
        "key": "company_name",
        "value": "Rising Business Solutions GmbH",
        "description": "Vollständiger Unternehmensname",
        "updatedAt": "2023-05-10T15:20:00Z"
      }
    },
    "message": "Einstellung erfolgreich aktualisiert."
  }
  ```

## Dashboard

Endpoints für Dashboard-Funktionen und -Statistiken.

### Dashboard-Übersicht

- **Route**: `GET /dashboard/overview`
- **Beschreibung**: Ruft zusammenfassende Statistiken für das Dashboard ab
- **Auth erforderlich**: Ja
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "customers": {
        "total": 45,
        "new": 5
      },
      "projects": {
        "total": 28,
        "active": 15,
        "completed": 10,
        "new": 3
      },
      "appointments": {
        "upcoming": 12,
        "today": 3
      },
      "requests": {
        "new": 8,
        "inProgress": 5
      }
    }
  }
  ```

### Monatliche Umsatzstatistiken

- **Route**: `GET /dashboard/revenue`
- **Beschreibung**: Ruft Umsatzstatistiken für einen Zeitraum ab
- **Auth erforderlich**: Ja (Admin oder Manager)
- **Query-Parameter**:
  - `startDate`: Startdatum für die Statistik (YYYY-MM-DD)
  - `endDate`: Enddatum für die Statistik (YYYY-MM-DD)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "total": 85600.00,
      "byMonth": [
        {
          "month": "2023-01",
          "amount": 15200.00
        },
        {
          "month": "2023-02",
          "amount": 18400.00
        },
        {
          "month": "2023-03",
          "amount": 22000.00
        },
        {
          "month": "2023-04",
          "amount": 30000.00
        }
      ],
      "byService": [
        {
          "serviceId": 1,
          "serviceName": "Steuerberatung",
          "amount": 45000.00
        },
        {
          "serviceId": 2,
          "serviceName": "Buchhaltung",
          "amount": 25600.00
        },
        {
          "serviceId": 3,
          "serviceName": "Webdesign",
          "amount": 15000.00
        }
      ]
    }
  }
  ```

### Aktivitätsprotokoll

- **Route**: `GET /dashboard/activity`
- **Beschreibung**: Ruft die neuesten Aktivitäten im System ab
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `limit`: Anzahl der Aktivitäten (Standard: 20)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "activities": [
        {
          "userId": 2,
          "userName": "Max Mustermann",
          "activity": "Neuen Kunden erstellt: Anna Schmidt",
          "timestamp": "2023-05-10T14:30:00Z"
        },
        {
          "userId": 3,
          "userName": "Maria Schmidt",
          "activity": "Termin aktualisiert: Projektbesprechung",
          "timestamp": "2023-05-10T13:15:00Z"
        },
        // weitere Aktivitäten...
      ]
    }
  }
  ```

### Anstehende Termine

- **Route**: `GET /dashboard/appointments`
- **Beschreibung**: Ruft anstehende Termine für den aktuellen Benutzer ab
- **Auth erforderlich**: Ja
- **Query-Parameter**:
  - `days`: Anzahl der Tage voraus (Standard: 7)
- **Erfolgreiche Antwort** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "appointments": [
        {
          "id": 25,
          "title": "Kundenbesprechung",
          "customerName": "Hans Meyer",
          "appointmentDate": "2023-05-11T10:00:00Z",
          "duration": 60,
          "location": "Büro, Raum 2"
        },
        {
          "id": 28,
          "title": "Projektupdate",
          "customerName": "Firma XYZ GmbH",
          "appointmentDate": "2023-05-12T14:30:00Z",
          "duration": 45,
          "location": "Online (Teams)"
        },
        // weitere Termine...
      ]
    }
  }
  ```

---

Diese Dokumentation deckt die wichtigsten API-Endpunkte des Backends ab. Jeder Endpunkt wird mit Routen, Beschreibungen, Authentifizierungsanforderungen, Request-Parametern und Beispielantworten dokumentiert.
