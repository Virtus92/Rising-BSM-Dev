# Notification System Migration Guide

This guide provides instructions for migrating from the old notifications implementation to the new one.

## Summary of Changes

The notification system has been completely redesigned with the following improvements:

1. **Context-Based State Management**: Uses a React Context for centralized notification state
2. **Cursor-Based Pagination**: More efficient loading of large notification lists
3. **Virtualized Rendering**: Better performance for large notification lists
4. **Modern Components**: Enhanced UI with consistent styling and better UX

## Migration Steps

### 1. Update Layout to Include Provider

Add the `NotificationLayout` to your app layout:

```tsx
// app/layout.tsx or app/dashboard/layout.tsx
import { NotificationLayout } from '@/features/notifications';

export default function Layout({ children }) {
  return (
    <NotificationLayout>
      {children}
    </NotificationLayout>
  );
}
```

### 2. Replace Notification Badge

Replace the old notification badge with the enhanced version:

```tsx
// Before
import { NotificationBadge } from '@/features/notifications';

// After
import { EnhancedNotificationBadge } from '@/features/notifications';

// Usage
<EnhancedNotificationBadge />
```

### 3. Replace Notification Lists

Replace the old notification list with the virtualized version:

```tsx
// Before
import { NotificationList } from '@/features/notifications';

// After
import { NotificationVirtualList } from '@/features/notifications';

// Usage
<NotificationVirtualList 
  height={600}
  showHeader={true}
  onlyUnread={false}
  limit={20}
/>
```

### 4. Use the New Hook

Replace the old `useNotifications` hook with the new one:

```tsx
// Before
import { useNotifications } from '@/features/notifications';

// After
import { useNotificationsNew as useNotifications } from '@/features/notifications';

// Usage
const { 
  notifications, 
  isLoading, 
  unreadCount, 
  markAsRead, 
  markAllAsRead 
} = useNotifications();
```

### 5. Replace the Notifications Page

Replace the old notifications page with the enhanced version:

1. Rename `app/dashboard/notifications/page.tsx` to `app/dashboard/notifications/page.old.tsx`
2. Rename `app/dashboard/notifications/page.enhanced.tsx` to `app/dashboard/notifications/page.tsx`

## Breaking Changes

1. The response format for notifications has changed, removing the redundant `content` field.
2. The pagination behavior has changed to use cursor-based pagination, while maintaining backward compatibility.
3. The hook API has been simplified and standardized.

## Backward Compatibility

While the new implementation introduces many changes, it maintains backward compatibility:

1. The old hooks and components are still available.
2. The API endpoints support both the new cursor-based pagination and the old page-based pagination.
3. The new hook provides all the same methods as the old one for compatibility.
