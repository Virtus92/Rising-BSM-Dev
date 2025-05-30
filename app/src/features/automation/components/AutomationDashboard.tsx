'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Webhook, 
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAutomation } from '../hooks/useAutomation';
import { WebhookForm } from './WebhookForm';
import { ScheduleForm } from './ScheduleForm';
import { AutomationList } from './AutomationList';
import { ExecutionHistory } from './ExecutionHistory';

export function AutomationDashboard() {
  const { 
    dashboardData, 
    webhooks, 
    schedules,
    executions,
    loading,
    error,
    fetchDashboard,
    fetchWebhooks,
    fetchSchedules,
    fetchExecutions
  } = useAutomation();

  const [activeTab, setActiveTab] = useState('overview');
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Load data on mount
    const loadData = async () => {
      setIsInitializing(true);
      try {
        // Load all data in parallel
        await Promise.all([
          fetchDashboard(),
          fetchWebhooks(),
          fetchSchedules(),
          fetchExecutions()
        ]);
      } catch (error) {
        console.error('Error loading automation data:', error);
        // Continue even if some requests fail
      } finally {
        setIsInitializing(false);
      }
    };
    
    loadData();
  }, [fetchDashboard, fetchWebhooks, fetchSchedules, fetchExecutions]);

  // Refresh data after creating/updating
  const handleWebhookSuccess = () => {
    setShowWebhookForm(false);
    // Data is already refreshed in the hook after creation
    fetchDashboard();
  };

  const handleScheduleSuccess = () => {
    setShowScheduleForm(false);
    // Data is already refreshed in the hook after creation
    fetchDashboard();
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message="Loading automation data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automation Dashboard</h1>
          <p className="text-muted-foreground">
            Manage webhooks, schedules, and monitor automation executions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowWebhookForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
          <Button variant="outline" onClick={() => setShowScheduleForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalWebhooks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.activeWebhooks || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalSchedules || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.activeSchedules || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(dashboardData?.successRate || 0).toFixed(1)}%</div>
            <Progress 
              value={dashboardData?.successRate || 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalExecutions || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                {dashboardData?.successfulExecutions || 0}
              </div>
              <div className="flex items-center">
                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                {dashboardData?.failedExecutions || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions Alert */}
      {dashboardData?.topFailedAutomations && dashboardData.topFailedAutomations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Attention Required
            </CardTitle>
            <CardDescription className="text-orange-700">
              Some automations have been failing frequently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.topFailedAutomations.map((automation) => (
                <div key={`${automation.type}-${automation.id}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {automation.type}
                    </Badge>
                    <span className="text-sm font-medium">{automation.name}</span>
                  </div>
                  <Badge variant="destructive">
                    {automation.failureCount} failures
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Executions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>Latest automation execution results</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentExecutions && dashboardData.recentExecutions.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentExecutions.map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {execution.automationType}
                          </Badge>
                          <span className="text-sm">
                            ID: {execution.automationId}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {execution.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {execution.executionTimeMs}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent executions</p>
                )}
              </CardContent>
            </Card>

            {/* Execution History */}
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>Detailed execution logs and results</CardDescription>
              </CardHeader>
              <CardContent>
                <ExecutionHistory executions={executions} compact />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webhooks">
          <AutomationList 
            type="webhook" 
            items={webhooks}
            onRefresh={fetchWebhooks}
          />
        </TabsContent>

        <TabsContent value="schedules">
          <AutomationList 
            type="schedule" 
            items={schedules}
            onRefresh={fetchSchedules}
          />
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showWebhookForm && (
        <WebhookForm
          onClose={() => setShowWebhookForm(false)}
          onSuccess={handleWebhookSuccess}
        />
      )}

      {showScheduleForm && (
        <ScheduleForm
          onClose={() => setShowScheduleForm(false)}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  );
}
