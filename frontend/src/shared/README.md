# Shared-Modul

## Übersicht

Das Shared-Modul enthält wiederverwendbare Komponenten, Hooks, Utilities und andere Artefakte, die von mehreren Features gemeinsam genutzt werden. Es bildet die Grundlage für ein konsistentes Erscheinungsbild und Verhalten der gesamten Anwendung und verhindert Duplizierung von Code zwischen Feature-Modulen.

## Struktur

```
shared/
├── components/           # Gemeinsame UI-Komponenten
│   ├── ApiInitializer.tsx  # Initialisierung der API
│   ├── error/            # Fehlerkomponenten
│   │   └── ErrorBoundary.tsx
│   ├── layout/           # Layout-Komponenten
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   └── ui/               # Base UI-Komponenten
│       ├── alert-dialog.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── ...
├── contexts/             # Gemeinsame React-Kontexte
│   └── SettingsContext.tsx
├── hooks/                # Gemeinsame React-Hooks
│   ├── useApiQuery.ts
│   ├── useFileUpload.ts
│   ├── useFormWithValidation.ts
│   └── useToast.ts
├── layouts/              # Layout-Strukturen
│   └── dashboard/
│       └── DashboardLayout.tsx
├── providers/            # Gemeinsame Provider
│   ├── QueryProvider.tsx
│   └── ThemeProvider.tsx
└── utils/                # Gemeinsame Hilfsfunktionen
    ├── apiUtils.ts
    ├── cn.ts             # ClassNames Utility
    ├── date-utils.ts
    └── errorHandler.ts
```

## Komponenten

### UI-Komponenten

Das Shared-Modul enthält eine umfangreiche Sammlung von UI-Komponenten, die auf dem Shadcn/UI-Design-System basieren und mit Tailwind CSS implementiert sind.

**Base Components:**
- `Button`: Verschiedene Button-Varianten
- `Card`: Kartenkomponenten für strukturierte Inhalte
- `Input`: Eingabefelder
- `Checkbox`: Checkboxen
- `Select`: Dropdown-Auswahl
- `Dialog`: Modal-Dialoge
- `Form`: Formular-Komponenten
- `Alert`: Benachrichtigungen und Warnungen
- `Badge`: Badges und Labels
- `Tabs`: Tabbed-Interface-Komponenten
- `Table`: Tabellenkomponenten
- `Tooltip`: Tooltips für zusätzliche Informationen

**Layout-Komponenten:**
- `Header`: Hauptnavigation und Kopfzeile
- `Footer`: Fußzeile mit Impressum und Links

**Fehlerkomponenten:**
- `ErrorBoundary`: React Error Boundary für Fehlerbehandlung

**Initialisierer:**
- `ApiInitializer`: Initialisiert API-Verbindungen und Services

### Hooks

Das Shared-Modul enthält wiederverwendbare React-Hooks:

- `useApiQuery`: Wrapper für React Query mit einheitlicher Fehlerbehandlung
- `useFileUpload`: Hook für Datei-Uploads
- `useFormWithValidation`: Hook für Formulare mit Validierung
- `useToast`: Hook für Toast-Benachrichtigungen

### Contexts

Kontexte für anwendungsweite Zustände:

- `SettingsContext`: Anwendungseinstellungen und -konfiguration

### Providers

Provider für gemeinsame Funktionalitäten:

- `QueryProvider`: React Query Provider für die Anwendung
- `ThemeProvider`: Theme-Provider für Light/Dark-Mode

### Layouts

Wiederverwendbare Layout-Strukturen:

- `DashboardLayout`: Layout für Dashboard-Seiten mit Seitenleiste und Kopfzeile

### Utils

Hilfsfunktionen für verschiedene Zwecke:

- `apiUtils`: Hilfsfunktionen für API-Aufrufe
- `cn`: ClassNames-Utility für bedingte Tailwind-Klassen
- `date-utils`: Datums- und Zeitfunktionen
- `errorHandler`: Fehlerbehandlung und -formatierung

## Verwendung

### UI-Komponenten

```tsx
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

const MyComponent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formular</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Name eingeben" />
        <Button>Speichern</Button>
      </CardContent>
    </Card>
  );
};
```

### Hooks

```tsx
import { useApiQuery } from '@/shared/hooks/useApiQuery';
import { useToast } from '@/shared/hooks/useToast';

const MyComponent = () => {
  const { toast } = useToast();
  
  const { data, isLoading } = useApiQuery({
    queryKey: ['customers'],
    queryFn: () => CustomerClient.getCustomers(),
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Komponenten-Logik
};
```

### Utils

```tsx
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/date-utils';

const MyComponent = ({ isActive }) => {
  return (
    <div className={cn("base-class", isActive && "active-class")}>
      Datum: {formatDate(new Date())}
    </div>
  );
};
```

## Best Practices

1. **Komponenten-Design**
   - Halte Komponenten modular und fokussiert auf eine Aufgabe
   - Verwende Props für Anpassungen
   - Stelle sicher, dass alle Komponenten typensicher sind
   - Dokumentiere Props mit JSDoc-Kommentaren

2. **Hook-Design**
   - Halte Hooks modular und fokussiert auf eine Aufgabe
   - Verwende Typisierung für alle Parameter und Rückgabewerte
   - Behandele Fehler angemessen
   - Dokumentiere Parameter und Rückgabewerte

3. **Wiederverwendbarkeit**
   - Gestalte Komponenten und Hooks so, dass sie in verschiedenen Kontexten verwendet werden können
   - Vermeide Feature-spezifische Abhängigkeiten
   - Verwende Composition Pattern für komplexe Komponenten

4. **Konsistenz**
   - Halte dich an Namenskonventionen
   - Verwende konsistente Stilregeln (z.B. für CSS/Tailwind)
   - Gestalte APIs ähnlich, um Lernkurven zu reduzieren

## Komponenten-Bibliothek

Die UI-Komponenten im Shared-Modul bilden eine interne Komponenten-Bibliothek, die auf dem Shadcn/UI-Design-System basiert:

- **Basis**: Tailwind CSS für Styling
- **Theming**: CSS-Variablen für Theme-Unterstützung
- **Accessibility**: ARIA-Attribute und Keyboard-Navigation
- **Responsiveness**: Mobile-First-Design für alle Komponenten

### Tailwind CSS

Die Anwendung verwendet Tailwind CSS für das Styling. Der `cn`-Utility hilft bei der bedingten Anwendung von Klassen:

```tsx
import { cn } from '@/shared/utils/cn';

<button 
  className={cn(
    "base-button-class", 
    variant === "primary" ? "primary-class" : "secondary-class",
    disabled && "disabled-class"
  )}
>
  Button Text
</button>
```

### Theme-Unterstützung

Die Anwendung unterstützt Light- und Dark-Mode über den ThemeProvider:

```tsx
<ThemeProvider 
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

Komponenten verwenden CSS-Variablen für Theme-Farben:

```css
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

## Formulare

Für Formulare gibt es eine Kombination aus React Hook Form und Zod für Validierung:

```tsx
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Name muss mindestens 3 Zeichen lang sein'),
  email: z.string().email('Ungültige Email-Adresse')
});

const MyForm = () => {
  const { form, handleSubmit, formState } = useFormWithValidation({
    schema,
    defaultValues: {
      name: '',
      email: ''
    }
  });
  
  // Form-Logik
};
```

## Erweiterung

Beim Hinzufügen neuer Komponenten oder Utilities zum Shared-Modul:

1. Stelle sicher, dass die Komponente/Utility wirklich wiederverwendbar ist
2. Platziere sie im entsprechenden Unterverzeichnis
3. Exportiere sie über eine `index.ts`-Datei
4. Dokumentiere die Verwendung mit JSDoc-Kommentaren
5. Stelle sicher, dass sie mit beiden Themes (light/dark) funktioniert
6. Teste sie in verschiedenen Kontexten

## Komponentenentwicklung

Für die Entwicklung neuer UI-Komponenten:

1. **Einfachheit zuerst**: Beginne mit einer einfachen Version und erweitere sie bei Bedarf
2. **Zustände berücksichtigen**: Berücksichtige alle Zustände (normal, hover, active, disabled, loading, error)
3. **Zugänglichkeit**: Stelle sicher, dass die Komponente barrierefrei ist (ARIA-Attribute, Keyboard-Unterstützung)
4. **Responsive Design**: Stelle sicher, dass die Komponente auf allen Bildschirmgrößen gut aussieht
5. **Varianten unterstützen**: Implementiere verschiedene Varianten (z.B. Größe, Farbe, Stil)
