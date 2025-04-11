'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { NotificationClient } from '@/infrastructure/api/NotificationClient';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { Check, Calendar, FileText, Clock, AlertCircle, Info, Trash2, Bell, Filter, Loader2 } from 'lucide-react';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { useToast } from '@/shared/hooks/useToast';
import { Skeleton } from '@/shared/components/ui/skeleton';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const { toast } = useToast();

  // Function to fetch notifications
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await NotificationClient.getNotifications({
        unreadOnly: unreadOnly || activeTab === 'unread'
      });

      if (response.success) {
        setNotifications(response.data || []);
      } else {
        setError(response.message || 'Fehler beim Laden der Benachrichtigungen');
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Fehler beim Laden der Benachrichtigungen. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Load notifications on mount and when activeTab changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, activeTab]);

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType | string) => {
    switch (type) {
      case NotificationType.MESSAGE:
        return <FileText className="h-5 w-5 text-purple-500" aria-hidden="true" />;
      case NotificationType.APPOINTMENT:
        return <Calendar className="h-5 w-5 text-blue-500" aria-hidden="true" />;
      case NotificationType.PROJECT:
        return <Clock className="h-5 w-5 text-green-500" aria-hidden="true" />;
      case NotificationType.ERROR:
        return <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />;
      case NotificationType.SYSTEM:
      default:
        return <Info className="h-5 w-5 text-amber-500" aria-hidden="true" />;
    }
  };

  // Get notification URL based on type
  const getNotificationUrl = (notification: NotificationResponseDto): string => {
    if (notification.link) return notification.link;
    
    // Default links based on type
    switch (notification.type) {
      case NotificationType.APPOINTMENT:
        return `/dashboard/appointments`;
      case NotificationType.PROJECT:
        return `/dashboard/projects`;
      case NotificationType.TASK:
        return `/dashboard/tasks`;
      case NotificationType.MESSAGE:
        return `/dashboard/messages`;
      default:
        return '#';
    }
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await NotificationClient.markNotificationAsRead(notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        
        toast({
          title: 'Benachrichtigung als gelesen markiert',
          variant: 'success'
        });
      } else {
        throw new Error(response.message || 'Fehler beim Markieren als gelesen');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Fehler',
        description: 'Die Benachrichtigung konnte nicht als gelesen markiert werden.',
        variant: 'error'
      });
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true);
      const response = await NotificationClient.markAllNotificationsAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        toast({
          title: 'Alle Benachrichtigungen gelesen',
          description: 'Alle Benachrichtigungen wurden als gelesen markiert.',
          variant: 'success'
        });
      } else {
        throw new Error(response.message || 'Fehler beim Markieren aller Benachrichtigungen als gelesen');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: 'Fehler',
        description: 'Die Benachrichtigungen konnten nicht als gelesen markiert werden.',
        variant: 'error'
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Benachrichtigungen</h1>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Filter className="h-4 w-4 mr-2" />
            )}
            Aktualisieren
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isLoading || isMarkingAllRead || unreadCount === 0}
          >
            {isMarkingAllRead ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Alle als gelesen markieren
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="unread">
            Ungelesen {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Alle Benachrichtigungen</CardTitle>
              <CardDescription>
                Zeigt alle Benachrichtigungen an, unabhängig vom Lesestatus
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                // Error state
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Fehler beim Laden</p>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => fetchNotifications()}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                // Empty state
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Keine Benachrichtigungen</p>
                  <p className="text-muted-foreground">
                    Sie haben derzeit keine Benachrichtigungen.
                  </p>
                </div>
              ) : (
                // Notifications list
                <div className="space-y-1 divide-y">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`py-3 px-4 -mx-4 flex items-start hover:bg-accent transition-colors duration-200 ${!notification.isRead ? 'bg-muted' : ''}`}
                    >
                      <div className="mr-4 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <Link 
                            href={getNotificationUrl(notification)}
                            className="text-base font-medium hover:underline"
                            onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                          >
                            {notification.title}
                          </Link>
                          
                          {!notification.isRead && (
                            <span className="ml-2 flex-shrink-0 h-2 w-2 bg-primary rounded-full" />
                          )}
                        </div>
                        
                        {notification.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        )}
                        
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </span>
                          
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Als gelesen markieren
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Ungelesene Benachrichtigungen</CardTitle>
              <CardDescription>
                Nur ungelesene Benachrichtigungen werden angezeigt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Fehler beim Laden</p>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => fetchNotifications(true)}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : unreadCount === 0 ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Alles gelesen!</p>
                  <p className="text-muted-foreground">
                    Sie haben keine ungelesenen Benachrichtigungen.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 divide-y">
                  {notifications
                    .filter(notification => !notification.isRead)
                    .map(notification => (
                      <div 
                        key={notification.id} 
                        className="py-3 px-4 -mx-4 flex items-start hover:bg-accent bg-muted transition-colors duration-200"
                      >
                        <div className="mr-4 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <Link 
                              href={getNotificationUrl(notification)}
                              className="text-base font-medium hover:underline"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              {notification.title}
                            </Link>
                            
                            <span className="ml-2 flex-shrink-0 h-2 w-2 bg-primary rounded-full" />
                          </div>
                          
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          )}
                          
                          <div className="mt-1 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.createdAt)}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Als gelesen markieren
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
