# Features-Modul

## Übersicht

Das Features-Modul organisiert die Anwendung in funktionale Einheiten. Jedes Feature kapselt eigene UI-Komponenten, Hooks, Hilfsfunktionen und andere Artefakte, die zusammen eine kohärente Funktion der Anwendung bilden. Diese Modulstruktur fördert die Wiederverwendbarkeit und Wartbarkeit durch klare Trennung der Zuständigkeiten.

## Struktur

```
features/
├── appointments/      # Terminverwaltung
│   ├── components/    # UI-Komponenten
│   ├── hooks/         # Feature-spezifische Hooks
│   └── index.ts       # Export aller Komponenten
├── auth/              # Authentifizierung
│   ├── components/    # UI-Komponenten
│   ├── hooks/         # Feature-spezifische Hooks
│   ├── providers/     # Auth-Provider
│   ├── utils/         # Auth-Utilities
│   └── index.ts       # Export aller Komponenten
├── customers/         # Kundenverwaltung
│   ├── components/    # UI-Komponenten
│   ├── hooks/         # Feature-spezifische Hooks
│   └── index.ts       # Export aller Komponenten
├── dashboard/         # Dashboard
│   ├── components/    # UI-Komponenten
│   └── hooks/         # Feature-spezifische Hooks
├── home/              # Homepage
│   └── components/    # UI-Komponenten
├── notifications/     # Benachrichtigungen
│   ├── components/    # UI-Komponenten
│   └── hooks/         # Feature-spezifische Hooks
├── requests/          # Anfragenverwaltung
│   ├── components/    # UI-Komponenten
│   ├── hooks/         # Feature-spezifische Hooks
│   └── index.ts       # Export aller Komponenten
├── users/             # Benutzerverwaltung
│   ├── components/    # UI-Komponenten
│   ├── hooks/         # Feature-spezifische Hooks
│   └── index.ts       # Export aller Komponenten
└── index.ts           # Export aller Features
```

## Feature-Module

### 📅 Appointments

Das Appointments-Feature ist für die Verwaltung von Terminen verantwortlich.

**Komponenten:**
- `AppointmentList`: Listet Termine auf und bietet Filtermöglichkeiten
- Weitere terminbezogene Komponenten

**Hooks:**
- `useAppointments`: Hook für den Zugriff auf Termin-Funktionen

**Funktionen:**
- Terminplanung und -verwaltung
- Terminübersicht und -details
- Terminbestätigung und -absage

### 🔐 Auth

Das Auth-Feature ist für die Authentifizierung und Autorisierung verantwortlich.

**Komponenten:**
- `LoginForm`: Formular für die Benutzeranmeldung
- `RegisterForm`: Formular für die Benutzerregistrierung
- `ForgotPasswordForm`: Formular für die Passwortzurücksetzung
- `ResetPasswordForm`: Formular zum Zurücksetzen des Passworts

**Hooks:**
- `useAuthManagement`: Hook für Authentifizierungsfunktionen

**Provider:**
- `AuthProvider`: React-Provider für Authentifizierungszustand

**Utilities:**
- `authUtils`: Hilfsfunktionen für die Authentifizierung

**Funktionen:**
- Benutzeranmeldung und -registrierung
- Passwortzurücksetzung
- Sitzungsverwaltung
- Berechtigungsprüfung

### 👤 Customers

Das Customers-Feature ist für die Verwaltung von Kundendaten verantwortlich.

**Komponenten:**
- `CustomerList`: Listet Kunden auf und bietet Filtermöglichkeiten
- `CustomerDetail`: Zeigt detaillierte Kundeninformationen an
- `CustomerForm`: Formular zum Erstellen und Bearbeiten von Kunden
- `CustomerFilterPanel`: Panel für die Kundenfilterung
- `CustomerListItem`: Einzelner Kundeneintrag in der Liste

**Hooks:**
- `useCustomers`: Hook für den Zugriff auf Kundenlisten
- `useCustomer`: Hook für den Zugriff auf einzelne Kunden
- `useCustomerForm`: Hook für Kundenformulare

**Funktionen:**
- Kundenverwaltung
- Kundensuche und -filterung
- Kundenerstellung und -bearbeitung

### 📊 Dashboard

Das Dashboard-Feature bietet einen Überblick über wichtige Kennzahlen und aktuelle Aktivitäten.

**Komponenten:**
- `DashboardHeader`: Kopfzeile des Dashboards
- `DashboardSidebar`: Seitenleiste des Dashboards
- `DashboardCharts`: Diagramme und Visualisierungen
- `StatsCards`: Karten mit Statistiken
- `RecentActivities`: Liste der letzten Aktivitäten
- `UpcomingAppointments`: Liste bevorstehender Termine

**Hooks:**
- `useDashboardStats`: Hook für Dashboard-Statistiken
- `useDashboardCharts`: Hook für Diagramme und Visualisierungen
- `useRecentActivities`: Hook für aktuelle Aktivitäten
- `useUpcomingAppointments`: Hook für bevorstehende Termine

**Funktionen:**
- Anzeige von Kennzahlen und Metriken
- Visualisierung von Trends und Daten
- Übersicht über aktuelle Aktivitäten
- Schnellzugriff auf wichtige Funktionen

### 🏠 Home

Das Home-Feature ist für die öffentliche Startseite der Anwendung verantwortlich.

**Komponenten:**
- `Hero`: Hero-Bereich der Startseite
- `Services`: Bereich für die angebotenen Dienstleistungen
- `About`: Über-uns-Bereich
- `Contact`: Kontaktbereich
- `ContactForm`: Kontaktformular

**Funktionen:**
- Öffentliche Webseite
- Firmen- und Dienstleistungspräsentation
- Kontaktaufnahme

### 🔔 Notifications

Das Notifications-Feature ist für das Benachrichtigungssystem verantwortlich.

**Komponenten:**
- `NotificationBadge`: Badge mit der Anzahl ungelesener Benachrichtigungen
- `NotificationList`: Liste von Benachrichtigungen
- `NotificationItem`: Einzelne Benachrichtigung

**Hooks:**
- `useNotifications`: Hook für den Zugriff auf Benachrichtigungen

**Funktionen:**
- Anzeige von Benachrichtigungen
- Markieren von Benachrichtigungen als gelesen
- Benachrichtigungsfilterung

### 📨 Requests

Das Requests-Feature ist für die Verwaltung von Kundenanfragen verantwortlich.

**Komponenten:**
- `RequestList`: Listet Anfragen auf und bietet Filtermöglichkeiten
- `RequestDetail`: Zeigt detaillierte Anfrageinformationen an
- `RequestFilterPanel`: Panel für die Anfragefilterung
- `ConvertToCustomerForm`: Formular zum Konvertieren einer Anfrage in einen Kunden
- `LinkToCustomerForm`: Formular zum Verknüpfen einer Anfrage mit einem Kunden
- `CreateAppointmentForm`: Formular zum Erstellen eines Termins aus einer Anfrage

**Hooks:**
- `useRequests`: Hook für den Zugriff auf Anfragelisten
- `useRequest`: Hook für den Zugriff auf einzelne Anfragen

**Funktionen:**
- Anfragenverwaltung
- Anfragebearbeitung
- Anfragestatus-Management
- Konvertierung von Anfragen in Kunden
- Verknüpfung von Anfragen mit Kunden
- Erstellung von Terminen aus Anfragen

### 👥 Users

Das Users-Feature ist für die Verwaltung von Benutzern verantwortlich.

**Komponenten:**
- `UserList`: Listet Benutzer auf und bietet Verwaltungsfunktionen

**Hooks:**
- `useUsers`: Hook für den Zugriff auf Benutzerlisten

**Funktionen:**
- Benutzerverwaltung
- Benutzerrollenverwaltung

## Design-Prinzipien

Bei der Entwicklung von Feature-Modulen sollten folgende Prinzipien beachtet werden:

1. **Kohäsion**: Jedes Feature-Modul sollte eine klare, kohärente Verantwortlichkeit haben.
2. **Kapselung**: Features sollten ihre internen Details verbergen und nur eine klar definierte API nach außen anbieten.
3. **Wiederverwendbarkeit**: Features sollten so gestaltet sein, dass sie leicht in verschiedenen Kontexten wiederverwendet werden können.
4. **Trennung der Zuständigkeiten**: Jede Komponente und jeder Hook sollte eine klar definierte Verantwortlichkeit haben.

## Komponenten-Struktur

Jede Feature-Komponente sollte einer konsistenten Struktur folgen:

1. **Imports**: Zuerst externe Bibliotheken, dann interne Module
2. **Typen und Interfaces**: Typdefinitionen für die Komponente
3. **Konstanten**: Konstante Werte, die in der Komponente verwendet werden
4. **Komponente**: Die eigentliche React-Komponente
5. **Export**: Export der Komponente

Beispiel:
```tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { CustomerDto } from '@/domain';
import { useCustomers } from '../hooks/useCustomers';

interface CustomerListProps {
  filter?: string;
}

const CustomerList: React.FC<CustomerListProps> = ({ filter }) => {
  const { customers, isLoading } = useCustomers({ filter });
  
  // Komponenten-Logik
  
  return (
    <div>
      {/* Komponenten-Markup */}
    </div>
  );
};

export default CustomerList;
```

## Hook-Struktur

Jeder Feature-Hook sollte einer konsistenten Struktur folgen:

1. **Imports**: Zuerst externe Bibliotheken, dann interne Module
2. **Typen und Interfaces**: Typdefinitionen für den Hook
3. **Hook**: Der eigentliche React-Hook
4. **Export**: Export des Hooks

Beispiel:
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerDto } from '@/domain';
import { CustomerClient } from '@/infrastructure/api';

interface UseCustomersOptions {
  filter?: string;
}

export const useCustomers = (options: UseCustomersOptions = {}) => {
  const queryClient = useQueryClient();
  const { filter } = options;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', filter],
    queryFn: () => CustomerClient.getCustomers({ filter })
  });
  
  // Hook-Logik
  
  return {
    customers: data?.data || [],
    isLoading,
    error
  };
};
```

## Best Practices

1. **Klare Modul-Grenzen**: Halte die Grenzen zwischen Features klar und minimiere Cross-Feature-Abhängigkeiten.
2. **Shared Components verwenden**: Nutze UI-Komponenten aus dem Shared-Modul, um Konsistenz zu gewährleisten.
3. **Domain-Services verwenden**: Greife auf Services aus dem Domain-Modul zu, um Geschäftslogik zu implementieren.
4. **Minimal API Surface**: Exportiere nur das Nötigste aus jedem Feature-Modul.
5. **Common Hooks für Wiederverwendbarkeit**: Erstelle wiederverwendbare Hooks für gemeinsame Funktionen.
6. **Lazy Loading nutzen**: Implementiere Lazy Loading für Features, um die initiale Ladezeit zu verbessern.

## Kommunikation zwischen Features

Features sollten möglichst unabhängig voneinander sein. Für die Kommunikation zwischen Features gibt es mehrere Möglichkeiten:

1. **Über Context API**: Nutze React Context für Feature-übergreifende Zustände.
2. **Über Query Cache**: Nutze den React Query Cache, um Daten zwischen Features zu teilen.
3. **Über Services**: Greife auf gemeinsame Services zu, um Daten zwischen Features zu teilen.
4. **Über Events**: Implementiere ein Event-System für Feature-übergreifende Kommunikation.

## Erweiterung

Beim Hinzufügen eines neuen Features:

1. Erstelle ein neues Verzeichnis unter `features/`
2. Implementiere die notwendigen Komponenten unter `components/`
3. Implementiere die notwendigen Hooks unter `hooks/`
4. Erstelle eine `index.ts`-Datei, die die öffentliche API des Features exportiert
5. Integriere das Feature in die Anwendung, indem du es im entsprechenden Modul importierst
