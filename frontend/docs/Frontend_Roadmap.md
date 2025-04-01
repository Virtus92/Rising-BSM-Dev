# Frontend Implementierungsplan

Dieses Dokument beschreibt die geplante Implementierung der Frontend-Komponenten, inklusive Komponentenbaum, State-Management, API-Integration, Tailwind Design-System und zeitlicher Priorisierung.

## Inhaltsverzeichnis

1. [Komponentenbaum](#komponentenbaum)
2. [State-Management-Strategie](#state-management-strategie)
3. [API-Integrationsplan](#api-integrationsplan)
4. [Tailwind Design-System](#tailwind-design-system)
5. [Zeitliche Priorisierung](#zeitliche-priorisierung)
6. [Abhängigkeiten zwischen Komponenten](#abhängigkeiten-zwischen-komponenten)

## Komponentenbaum

Die Frontend-Anwendung basiert auf Next.js und folgt einer modularen Struktur. Hier ist der Komponentenbaum der Anwendung:

```
App
├── PublicLayout
│   ├── Header
│   ├── MainContent
│   └── Footer
│
├── AuthLayout
│   ├── LoginForm
│   ├── RegistrationForm
│   ├── ForgotPasswordForm
│   └── ResetPasswordForm
│
└── DashboardLayout
    ├── DashboardSidebar
    ├── DashboardHeader
    │   └── UserProfileDropdown
    │
    ├── Dashboard (Startseite)
    │   ├── StatsCards
    │   ├── DashboardCharts
    │   ├── RecentActivities
    │   └── UpcomingAppointments
    │
    ├── UserManagement
    │   ├── UserList
    │   ├── UserDetails
    │   ├── UserForm
    │   └── UserPermissionsForm
    │
    ├── Customers
    │   ├── CustomerList
    │   ├── CustomerDetails
    │   ├── CustomerForm
    │   └── CustomerNotes
    │
    ├── Requests
    │   ├── RequestList
    │   ├── RequestDetails
    │   ├── RequestForm
    │   └── RequestNotes
    │
    ├── Appointments
    │   ├── AppointmentList
    │   ├── AppointmentCalendar
    │   ├── AppointmentDetails
    │   ├── AppointmentForm
    │   └── AppointmentNotes
    │
    ├── Services
    │   ├── ServiceList
    │   ├── ServiceDetails
    │   └── ServiceForm
    │
    ├── Projects
    │   ├── ProjectList
    │   ├── ProjectDetails
    │   ├── ProjectForm
    │   └── ProjectNotes
    │
    └── Settings
        ├── ProfileSettings
        ├── AccountSettings
        ├── NotificationSettings
        └── SystemSettings (nur Admin)
```

## State-Management-Strategie

Die Anwendung verwendet einen mehrstufigen Ansatz für das State-Management:

### 1. Lokaler Komponentenstatus

Für UI-spezifische Zustände und temporäre Daten verwenden wir den lokalen Zustand mit dem `useState`-Hook von React:

```tsx
function CustomerForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    // weitere Felder...
  });
  
  // Form-Handling-Logik...
}
```

### 2. Kontextbasiertes State-Management

Für gemeinsam genutzte Zustände, die über mehrere Komponenten hinweg benötigt werden, verwenden wir React Context:

```tsx
// AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Implementierung der Auth-Logik...
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

Die wichtigsten Kontexte in der Anwendung sind:

- **AuthContext**: Verwaltet den Authentifizierungsstatus und Benutzerinformationen
- **ThemeContext**: Verwaltet das Theming (Light/Dark Mode)
- **NotificationContext**: Verwaltet System-Benachrichtigungen
- **SettingsContext**: Verwaltet Benutzereinstellungen

### 3. API-Zustandsmanagement mit React Query

Für serverseitige Daten und API-Interaktionen wird React Query verwendet, um Caching, Lazy Loading, Pagination und automatisches Refetching zu unterstützen:

```tsx
// Beispiel für die Verwendung von React Query zum Laden von Kundendaten
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { customerApi } from '@/api/customers';

// Hook zum Abrufen aller Kunden
export function useCustomers(page = 1, limit = 20) {
  return useQuery(
    ['customers', page, limit],
    () => customerApi.getCustomers(page, limit),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 Minuten
    }
  );
}

// Hook zum Abrufen eines einzelnen Kunden
export function useCustomer(id: number) {
  return useQuery(
    ['customer', id],
    () => customerApi.getCustomerById(id),
    {
      enabled: !!id,
    }
  );
}

// Hook zum Erstellen eines Kunden
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (newCustomer) => customerApi.createCustomer(newCustomer),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
      },
    }
  );
}
```

### 4. Routing-State mit Next.js App Router

Für navigationsbezogene Zustände und URL-Parameter wird der Next.js App Router verwendet:

```tsx
'use client';

import { usePathname, useParams, useSearchParams } from 'next/navigation';

function CustomerDetailPage() {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const customerId = params.id;
  const tab = searchParams.get('tab') || 'overview';
  
  // Verwende diese Parameter für die Komponente...
}
```

## API-Integrationsplan

Die API-Integration erfolgt durch eine Reihe von spezialisierten Diensten, die mit dem Backend kommunizieren.

### API-Client-Struktur

Die Anwendung verwendet eine auf Axios basierende Client-Bibliothek, die aus der OpenAPI-Spezifikation generiert wird:

```
/src
└── api/
    ├── client.ts             # Basis-Axios-Konfiguration
    ├── interceptors.ts       # Request/Response-Interceptors
    ├── auth/                 # Auth-bezogene API-Endpoints
    ├── users/                # Benutzer-bezogene API-Endpoints
    ├── customers/            # Kunden-bezogene API-Endpoints
    ├── projects/             # Projekt-bezogene API-Endpoints
    ├── appointments/         # Termin-bezogene API-Endpoints
    ├── services/             # Dienstleistungs-bezogene API-Endpoints
    └── requests/             # Anfrage-bezogene API-Endpoints
```

### API-Integration nach Modulen

#### 1. Authentifizierung

```typescript
// src/api/auth/index.ts
import { apiClient } from '../client';
import { LoginRequest, LoginResponse, RefreshTokenRequest } from './types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
  
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },
  
  resetPassword: async (token: string, password: string, confirmPassword: string): Promise<void> => {
    await apiClient.post(`/auth/reset-password/${token}`, { password, confirmPassword });
  },
  
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  }
};
```

#### 2. Benutzer

```typescript
// src/api/users/index.ts
import { apiClient } from '../client';
import { User, CreateUserRequest, UpdateUserRequest } from './types';

export const userApi = {
  getUsers: async (page = 1, limit = 20): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/users', { params: { page, limit } });
    return response.data;
  },
  
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data.user;
  },
  
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return response.data.data.user;
  },
  
  updateUser: async (id: number, userData: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data.data.user;
  },
  
  changePassword: async (id: number, passwordData: ChangePasswordRequest): Promise<void> => {
    await apiClient.put(`/users/${id}/password`, passwordData);
  },
  
  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  }
};
```

Ähnliche API-Module werden für Kunden, Projekte, Termine, Dienstleistungen und Anfragen erstellt.

### API-Interceptors für Authentifizierung

Ein zentraler Bestandteil der API-Integration ist die Verwaltung von Auth-Tokens und automatischer Token-Erneuerung:

```typescript
// src/api/interceptors.ts
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { apiClient } from './client';
import { refreshToken } from './auth';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Request-Interceptor für das Hinzufügen von Auth-Token
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response-Interceptor für das Behandeln von 401-Fehlern und Token-Erneuerung
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Wenn es sich um einen 401-Fehler handelt und wir nicht bereits versuchen, den Token zu erneuern
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wenn bereits ein Token-Refresh im Gange ist, warten wir auf dessen Abschluss
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshTokenStr = localStorage.getItem('refresh_token');
        if (!refreshTokenStr) {
          // Kein Refresh-Token vorhanden, Benutzer zur Anmeldung weiterleiten
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await refreshToken(refreshTokenStr);
        
        if (response.data && response.data.token) {
          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Tokens im localStorage aktualisieren
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          // Header der ursprünglichen Anfrage aktualisieren
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Andere ausstehende Anfragen benachrichtigen
          onTokenRefreshed(token);
          
          isRefreshing = false;
          
          // Ursprüngliche Anfrage mit neuem Token wiederholen
          return axios(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        
        // Bei Fehler während der Token-Erneuerung zur Anmeldung weiterleiten
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### API-Mocks für Entwicklung

Für die Entwicklung ohne Backend-Abhängigkeit werden Mock-Implementierungen der API-Dienste erstellt:

```typescript
// src/api/mocks/customers.ts
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../customers/types';
import { PaginatedResponse } from '../types';

const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'Musterfirma GmbH',
    company: 'Musterfirma GmbH',
    email: 'kontakt@musterfirma.de',
    phone: '+49123456789',
    status: 'active',
    // ... weitere Eigenschaften
  },
  // ... weitere Mockdaten
];

export const mockCustomerApi = {
  getCustomers: async (page = 1, limit = 20): Promise<PaginatedResponse<Customer>> => {
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = mockCustomers.slice(start, end);
    
    return {
      success: true,
      data: {
        customers: data,
        pagination: {
          total: mockCustomers.length,
          page,
          limit,
          pages: Math.ceil(mockCustomers.length / limit)
        }
      }
    };
  },
  
  // Weitere Mock-Methoden...
};
```

## Tailwind Design-System

Die Anwendung verwendet Tailwind CSS für ein konsistentes Design-System.

### Farbschema

```javascript
// tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: colors.green[50],
          100: colors.green[100],
          200: colors.green[200],
          300: colors.green[300],
          400: colors.green[400],
          500: colors.green[500],
          600: colors.green[600],
          700: colors.green[700],
          800: colors.green[800],
          900: colors.green[900],
        },
        secondary: {
          50: colors.blue[50],
          100: colors.blue[100],
          // ... weitere Farbtöne
        },
        // Weitere Farbdefinitionen...
      }
    }
  }
};
```

### UI-Komponenten

Für konsistente UI-Elemente werden mehrere wiederverwendbare Komponenten implementiert:

#### Button-Komponente

```tsx
// src/components/ui/Button.tsx
import React from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500',
  };
  
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };
  
  const loadingStyles = isLoading ? 'opacity-70 pointer-events-none' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        loadingStyles,
        disabledStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
```

Ähnliche Komponenten werden für Formularelemente, Karten, Tabellen, Modals und andere UI-Elemente erstellt.

### Responsives Design

Die Anwendung ist von Grund auf responsiv:

```tsx
// Beispiel für responsives Layout
function CustomersPage() {
  return (
    <div>
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Karten */}
      </div>
      
      {/* Responsive Tabelle */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* ... */}
        </table>
      </div>
      
      {/* Responsive Steuerelemente */}
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="w-full sm:w-auto mb-4 sm:mb-0">
          {/* Suchfeld */}
        </div>
        <div className="w-full sm:w-auto flex justify-center">
          {/* Paginierung */}
        </div>
      </div>
    </div>
  );
}
```

### Dark Mode

Die Anwendung unterstützt sowohl Light- als auch Dark-Mode:

```tsx
// src/providers/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>('light');
  
  // Initialisiere Theme aus localStorage oder Systemeinstellungen
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    }
  }, []);
  
  // Aktualisiere DOM und localStorage bei Theme-Änderungen
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## Zeitliche Priorisierung

Die Implementierung wird in mehrere Phasen unterteilt, die aufeinander aufbauen:

### Phase 1: Authentifizierung und Basis-Layout (Wochen 1-2)

1. **Authentifizierungssystem**
   - Login-Seite
   - Registrierung
   - Passwort-Wiederherstellung
   - Auth-Context und API-Integration

2. **Basis-Layout**
   - Öffentliches Layout (Header, Footer)
   - Dashboard-Layout (Sidebar, Header)
   - Responsive Design-Grundlagen
   - Theme-Umschaltung (Light/Dark Mode)

### Phase 2: Benutzerverwaltung und Dashboard (Wochen 3-4)

3. **Benutzerverwaltung**
   - Benutzerliste
   - Benutzerdetails
   - Benutzerformular (Erstellen/Bearbeiten)
   - Berechtigungen

4. **Dashboard-Hauptseite**
   - Statistikkarten
   - Einfache Charts
   - Aktivitätsliste
   - Kommende Termine

### Phase 3: Kernfunktionalität I (Wochen 5-7)

5. **Kundenmodul**
   - Kundenliste (Filterung, Sortierung, Paginierung)
   - Kundendetails
   - Kundenformular
   - Kundennotizen

6. **Anfragenmodul**
   - Anfragenliste
   - Anfragendetails
   - Anfragenbearbeitung
   - Anfragennotizen

### Phase 4: Kernfunktionalität II (Wochen 8-10)

7. **Terminmodul**
   - Terminliste
   - Kalenderansicht
   - Termindetails
   - Terminformular
   - Terminnotizen

8. **Dienstleistungsmodul**
   - Dienstleistungsliste
   - Dienstleistungsdetails
   - Dienstleistungsformular

### Phase 5: Projektmanagement und Integration (Wochen 11-13)

9. **Projektmodul**
   - Projektliste
   - Projektdetails
   - Projektformular
   - Projektnotizen
   - Integration mit Kunden und Terminen

10. **Einstellungen**
    - Profileinstellungen
    - Kontoeinstellungen
    - Benachrichtigungseinstellungen
    - Systemeinstellungen (für Admins)

### Phase 6: Optimierung und Testing (Wochen 14-16)

11. **Leistungsoptimierung**
    - Code-Splitting
    - Lazy Loading
    - Caching-Optimierung

12. **Testing und Fehlerbehebung**
    - Unit-Tests
    - Integrationstests
    - End-to-End-Tests
    - Fehlerbehebung

## Abhängigkeiten zwischen Komponenten

Die Komponenten der Anwendung haben verschiedene Abhängigkeiten untereinander:

### 1. Hierarchische Abhängigkeiten

- **Layout-Komponenten** sind Voraussetzung für alle anderen Komponenten
- **Authentifizierung** ist Voraussetzung für alle geschützten Komponenten
- **API-Integration** ist Voraussetzung für alle datengetriebenen Komponenten

### 2. Datenabhängigkeiten

- **Kundenmodul → Projektmodul**: Projekte benötigen Kundendaten
- **Kundenmodul → Terminmodul**: Termine können mit Kunden verknüpft werden
- **Projektmodul → Terminmodul**: Termine können mit Projekten verknüpft werden
- **Dienstleistungsmodul → Projektmodul**: Projekte können mit Dienstleistungen verknüpft werden
- **Anfragenmodul → Kundenmodul**: Anfragen können zu Kunden konvertiert werden

### 3. Funktionale Abhängigkeiten

- **Dashboard → Alle Module**: Dashboard zeigt aggregierte Daten aus allen Modulen
- **Benutzer → Alle Module**: Alle Aktionen sind mit Benutzern verknüpft
- **Benachrichtigungen → Alle Module**: Benachrichtigungen können von allen Modulen ausgelöst werden

### Abhängigkeitsgraph

```
Authentifizierung
↓
Dashboard-Layout
↓
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│         │         │         │         │         │
Benutzer  Kunden    Anfragen  Dienst-   Einstellungen
                              leistungen
│         │         │         │         │
│         │         │         │         │
│ ┌───────┘         │         │         │
│ │       │         │         │         │
│ │       └────┐    │         │         │
│ │            ↓    │         │         │
│ │         Projekte ←────────┘         │
│ │            │                        │
│ └───→        │                        │
│              ↓                        │
└─────→     Termine                     │
               │                        │
               └────────────────────────┘
```

Diese Abhängigkeitsstruktur bestimmt die Reihenfolge der Implementierung und beeinflusst die Komponentendesigns. Module mit weniger Abhängigkeiten werden vor solchen mit mehr Abhängigkeiten implementiert, um sicherzustellen, dass alle erforderlichen Daten und Funktionen verfügbar sind.