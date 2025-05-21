'use client';

import React, { useState } from 'react';
import { NotificationVirtualList } from '@/features/notifications/components/NotificationVirtualList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { NotificationProvider } from '@/features/notifications/providers/NotificationProvider';
import { useNotificationContext } from '@/features/notifications/providers/NotificationProvider';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  
  return (
    <NotificationProvider>
      <div className="container py-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">Unread Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>
                  View all notifications, regardless of read status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationListContainer onlyUnread={false} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Unread Notifications</CardTitle>
                <CardDescription>
                  Only showing your unread notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationListContainer onlyUnread={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </NotificationProvider>
  );
}

// Container component to manage filter state
function NotificationListContainer({ onlyUnread }: { onlyUnread: boolean }) {
  // Use the notification context directly
  const { updateFilters } = useNotificationContext();
  
  // Update filters when the tab changes
  React.useEffect(() => {
    updateFilters({ unreadOnly: onlyUnread });
  }, [onlyUnread, updateFilters]);
  
  return (
    <NotificationVirtualList 
      height={600}
      showHeader={false}
      onlyUnread={onlyUnread}
      limit={20}
    />
  );
}
