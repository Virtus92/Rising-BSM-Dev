'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';
import { 
  CalendarClock, 
  User, 
  Edit, 
  TrashIcon, 
  LogIn, 
  LogOut, 
  Key, 
  AlertCircle, 
  Info, 
  Activity, 
  FileText,
  Settings
} from 'lucide-react';
import { UserService } from '@/features/users/lib/services/UserService';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { EntityType } from '@/domain/enums/EntityTypes';
import { format, parseISO, isValid } from 'date-fns';

// Define activity type with icon and color
const activityTypes: Record<string, { icon: React.ReactNode, color: string }> = {
  'create': { icon: <FileText className="h-5 w-5" />, color: 'bg-green-50 text-green-600' },
  'update': { icon: <Edit className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
  'delete': { icon: <TrashIcon className="h-5 w-5" />, color: 'bg-red-50 text-red-600' },
  'login': { icon: <LogIn className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600' },
  'logout': { icon: <LogOut className="h-5 w-5" />, color: 'bg-gray-50 text-gray-600' },
  'change_password': { icon: <Key className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
  'reset_password': { icon: <Key className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
  'activate': { icon: <Activity className="h-5 w-5" />, color: 'bg-green-50 text-green-600' },
  'deactivate': { icon: <AlertCircle className="h-5 w-5" />, color: 'bg-gray-50 text-gray-600' },
  'system': { icon: <Settings className="h-5 w-5" />, color: 'bg-gray-50 text-gray-600' },
  'default': { icon: <Info className="h-5 w-5" />, color: 'bg-gray-50 text-gray-600' }
};

// Helper function to format display time
const formatTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) {
      return 'Invalid date';
    }
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error as Error);
    return 'Invalid date';
  }
};

// Helper function to get activity details
const getActivityDetails = (action: string) => {
  const lowercaseAction = action.toLowerCase();
  
  for (const [key, value] of Object.entries(activityTypes)) {
    if (lowercaseAction.includes(key)) {
      return value;
    }
  }
  
  return activityTypes.default;
};

interface UserActivityProps {
  userId: number;
  limit?: number;
}

export const UserActivity: React.FC<UserActivityProps> = ({
  userId,
  limit = 10
}) => {
  const [activities, setActivities] = useState<ActivityLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserActivity = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await UserService.getUserActivity(userId, limit);
        
        if (response.success && response.data) {
          setActivities(Array.isArray(response.data) ? response.data : []);
        } else {
          setError(response.message || 'Failed to fetch user activity');
        }
      } catch (err) {
        console.error('Error fetching user activity:', err);
        setError('Failed to load user activity');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserActivity();
  }, [userId, limit]);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              View recent user actions and system events
            </CardDescription>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="hidden sm:flex"
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CalendarClock className="h-12 w-12 mb-2 text-muted-foreground/50" />
            <p className="text-center">No activity recorded for this user yet.</p>
            <p className="text-sm text-center mt-1 max-w-md">
              Activity logs will appear here when the user performs actions in the system.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const { icon, color } = getActivityDetails(activity.action);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full ${color}`}>
                    {icon}
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {activity.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <CalendarClock className="h-3.5 w-3.5 mr-1" />
                        {formatTime(activity.createdAt)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {activity.details ? (
                        typeof activity.details === 'object' ? (
                          // Handle object details
                          activity.details.message || 
                          // Just stringify and display, since we're not rendering HTML
                          JSON.stringify(activity.details, null, 2)
                        ) : (
                          // Handle string details
                          String(activity.details)
                        )
                      ) : 'No additional details'}
                    </p>
                    
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.entityType || 'System'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserActivity;
