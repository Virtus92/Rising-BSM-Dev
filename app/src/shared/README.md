# Shared Module

## Overview

The Shared module provides common utilities, components, and hooks that are used across the Rising-BSM application. It focuses on reusable elements that aren't tied to specific business domains and can be used by any part of the application.

## Directory Structure

```
shared/
├── components/         # Reusable UI components
│   ├── ui/             # Base UI components (button, input, etc.)
│   └── layout/         # Layout components (header, footer, etc.)
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── layouts/            # Page layout templates
├── providers/          # Application-wide providers
├── services/           # Shared services
├── styles/             # Global styles and theme definitions
└── utils/              # Utility functions
```

## Key Components

### UI Components

The UI components provide a consistent design system for the application. They are built using Tailwind CSS and follow a composition-based approach.

**Key UI Components:**

- **Button**: Flexible button component with multiple variants and sizes
- **Input**: Text input component with validation support
- **Select**: Dropdown select component with custom styling
- **Modal**: Modal dialog component for overlays
- **Card**: Card component for content containers
- **Table**: Table component for data display

**Example Usage:**

```tsx
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function LoginForm() {
  return (
    <form>
      <Input 
        type="email" 
        placeholder="Email" 
        required 
      />
      <Input 
        type="password" 
        placeholder="Password" 
        required 
      />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

### Layout Components

Layout components provide the structure for the application pages.

**Key Layout Components:**

- **Header**: Application header with navigation
- **Footer**: Application footer with links
- **Sidebar**: Navigation sidebar for the dashboard

**Example Usage:**

```tsx
import { Header } from '@/shared/components/layout/Header';
import { Footer } from '@/shared/components/layout/Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
```

### Hooks

Custom React hooks provide reusable logic across the application.

**Key Hooks:**

- **useToast**: Hook for displaying toast notifications
- **useMediaQuery**: Hook for responsive design
- **useLocalStorage**: Hook for local storage access
- **useDebounce**: Hook for debouncing values
- **useForm**: Hook for form handling

**Example Usage:**

```tsx
import { useToast } from '@/shared/hooks/useToast';

export function SaveButton() {
  const { toast } = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      toast({ 
        title: 'Saved successfully', 
        variant: 'success' 
      });
    } catch (error) {
      toast({ 
        title: 'Failed to save', 
        description: error.message, 
        variant: 'error' 
      });
    }
  };
  
  return <Button onClick={handleSave}>Save</Button>;
}
```

### Contexts

React contexts provide application-wide state management.

**Key Contexts:**

- **SettingsContext**: Application settings and preferences
- **ThemeContext**: Theme management
- **ModalContext**: Modal management

**Example Usage:**

```tsx
import { useSettings } from '@/shared/contexts/SettingsContext';

export function LanguageSelector() {
  const { settings, updateSettings } = useSettings();
  
  const handleChange = (e) => {
    updateSettings({ language: e.target.value });
  };
  
  return (
    <select value={settings.language} onChange={handleChange}>
      <option value="en">English</option>
      <option value="de">German</option>
      <option value="fr">French</option>
    </select>
  );
}
```

### Utils

Utility functions provide common functionality used across the application.

**Key Utils:**

- **cn**: Function for conditional class name merging
- **formatDate**: Date formatting utilities
- **validation**: Input validation functions
- **storage**: Browser storage utilities

**Example Usage:**

```tsx
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/formatDate';

export function AppointmentCard({ appointment, isActive }) {
  return (
    <div className={cn(
      'p-4 rounded-lg', 
      isActive ? 'bg-blue-100' : 'bg-gray-100'
    )}>
      <h3>{appointment.title}</h3>
      <p>{formatDate(appointment.date, 'dd/MM/yyyy HH:mm')}</p>
    </div>
  );
}
```

## Design Patterns

### Component Composition

The UI components follow a composition-based approach, allowing for flexible and reusable components.

```tsx
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

// Composition example
export function FeatureCard({ title, description, onAction }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>{description}</p>
      </Card.Content>
      <Card.Footer>
        <Button onClick={onAction}>Learn More</Button>
      </Card.Footer>
    </Card>
  );
}
```

### Render Props

Some components use the render props pattern for flexible rendering.

```tsx
import { DataTable } from '@/shared/components/ui/data-table';

export function UserTable({ data }) {
  return (
    <DataTable 
      data={data}
      columns={[
        { 
          header: 'Name',
          accessor: 'name'
        },
        {
          header: 'Actions',
          cell: ({ row }) => (
            <Button onClick={() => editUser(row.original)}>
              Edit
            </Button>
          )
        }
      ]}
    />
  );
}
```

### Controlled Components

Form components follow the controlled component pattern.

```tsx
import { useState } from 'react';
import { Input } from '@/shared/components/ui/input';

export function SearchBox({ onSearch }) {
  const [query, setQuery] = useState('');
  
  const handleChange = (e) => {
    setQuery(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
    </form>
  );
}
```

## Best Practices

1. **Component Reusability**: Design components to be reusable across different contexts.
2. **Minimal Props**: Keep the number of required props minimal.
3. **Default Props**: Provide sensible defaults where possible.
4. **Consistent Naming**: Follow consistent naming conventions.
5. **Accessibility**: Ensure all components are accessible.
6. **Documentation**: Document component props and usage.
7. **Testing**: Write tests for shared components.

## Adding New Components

When adding a new shared component:

1. Determine if the component is truly shared or feature-specific.
2. Place the component in the appropriate subdirectory.
3. Design the component API to be flexible and reusable.
4. Document the component's props and usage.
5. Create tests for the component.
6. Export the component through the appropriate index file.

## Style Guidelines

The UI components follow these style guidelines:

1. **Tailwind CSS**: Use Tailwind CSS for styling.
2. **Class Variance Authority**: Use CVA for component variants.
3. **Dark Mode Support**: Ensure all components support dark mode.
4. **Responsive Design**: Make components responsive by default.
5. **Design System**: Follow the application's design system.

## Using Shared Components in Features

Feature-specific components should use shared components as building blocks:

```tsx
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export function CustomerCard({ customer, onEdit, onDelete }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{customer.name}</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>{customer.email}</p>
        <p>{customer.phone}</p>
      </Card.Content>
      <Card.Footer>
        <Button onClick={onEdit} variant="outline">Edit</Button>
        <Button onClick={onDelete} variant="destructive">Delete</Button>
      </Card.Footer>
    </Card>
  );
}
```
