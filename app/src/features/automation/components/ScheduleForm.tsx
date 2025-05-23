'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  Plus, 
  Minus, 
  TestTube, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Clock,
  PlayCircle
} from 'lucide-react';
import { useAutomation } from '../hooks/useAutomation';
import { useCronParser } from '../hooks/useCronParser';
import { CreateScheduleRequest } from '../api/models';

interface ScheduleFormProps {
  schedule?: any; // For editing existing schedule
  onClose: () => void;
  onSuccess: () => void;
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

const cronPresets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
  { label: 'Daily at 9 AM', value: '0 9 * * *' },
  { label: 'Daily at 6 PM', value: '0 18 * * *' },
  { label: 'Weekdays at 9 AM', value: '0 9 * * MON-FRI' },
  { label: 'Weekly on Monday at 9 AM', value: '0 9 * * MON' },
  { label: 'Monthly on 1st at 9 AM', value: '0 9 1 * *' }
];

export function ScheduleForm({ schedule, onClose, onSuccess }: ScheduleFormProps) {
  const { createSchedule, updateSchedule, executeSchedule, loading } = useAutomation();
  const { parseCron, cronResult, cronLoading } = useCronParser();
  
  const [formData, setFormData] = useState<CreateScheduleRequest>({
    name: schedule?.name || '',
    description: schedule?.description || '',
    cronExpression: schedule?.cronExpression || '0 9 * * *',
    webhookUrl: schedule?.webhookUrl || '',
    headers: schedule?.headers || {},
    payload: schedule?.payload || {},
    timezone: schedule?.timezone || 'UTC',
    active: schedule?.active ?? true
  });

  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [testExecuteResult, setTestExecuteResult] = useState<any>(null);
  const [testExecuteError, setTestExecuteError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse cron expression when it changes
  useEffect(() => {
    if (formData.cronExpression && formData.timezone) {
      parseCron(formData.cronExpression, formData.timezone);
    }
  }, [formData.cronExpression, formData.timezone, parseCron]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      let result;
      if (schedule?.id) {
        result = await updateSchedule(schedule.id.toString(), formData);
      } else {
        result = await createSchedule(formData);
      }
      
      if (result) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setFormData(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          [newHeaderKey]: newHeaderValue
        }
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData(prev => ({
      ...prev,
      headers: newHeaders
    }));
  };

  const handleUsePreset = (cronExpression: string) => {
    setFormData(prev => ({
      ...prev,
      cronExpression
    }));
  };

  const handleTestExecute = async () => {
    if (!schedule?.id) {
      setTestExecuteError('Schedule must be saved before testing execution');
      return;
    }

    try {
      setTestExecuteError('');
      setTestExecuteResult(null);
      
      const result = await executeSchedule(schedule.id.toString());
      setTestExecuteResult(result);
    } catch (error: any) {
      setTestExecuteError(error.message || 'Test execution failed');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? 'Edit Schedule' : 'Create New Schedule'}
          </DialogTitle>
          <DialogDescription>
            Configure a scheduled automation that runs at specified intervals
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Schedule"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="active">Active</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this schedule does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://your-webhook-endpoint.com/webhook"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Headers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">HTTP Headers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                    />
                    <Input
                      placeholder="Header value"
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddHeader} disabled={!newHeaderKey || !newHeaderValue}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {Object.entries(formData.headers || {}).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(formData.headers || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2 border rounded">
                          <Badge variant="outline">{key}</Badge>
                          <code className="flex-1 p-1 bg-muted rounded text-sm">{value}</code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveHeader(key)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cron Expression</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cronExpression">Cron Expression *</Label>
                    <Input
                      id="cronExpression"
                      value={formData.cronExpression}
                      onChange={(e) => setFormData(prev => ({ ...prev, cronExpression: e.target.value }))}
                      placeholder="0 9 * * *"
                      className="font-mono"
                      required
                    />
                  </div>

                  {/* Cron Presets */}
                  <div className="space-y-2">
                    <Label>Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {cronPresets.map((preset) => (
                        <Button
                          key={preset.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleUsePreset(preset.value)}
                          className="justify-start text-left"
                        >
                          <div>
                            <div className="font-medium">{preset.label}</div>
                            <div className="text-xs text-muted-foreground font-mono">{preset.value}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Cron Expression Result */}
                  {cronResult && (
                    <Alert className={cronResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      {cronResult.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription>
                        {cronResult.isValid ? (
                          <div className="space-y-1">
                            <p className="font-medium text-green-800">Valid Expression</p>
                            <p className="text-green-700">{cronResult.description}</p>
                            {cronResult.nextRun && (
                              <p className="text-sm text-green-600">
                                Next run: {new Date(cronResult.nextRun).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-red-800">Invalid cron expression</p>
                            {cronResult.errors && cronResult.errors.length > 0 && (
                              <ul className="list-disc list-inside text-sm mt-1">
                                {cronResult.errors.map((error: string, i: number) => (
                                  <li key={i}>{error}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Cron Help */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Cron Format: minute hour day month day-of-week</p>
                      <div className="text-sm space-y-1">
                        <p>• Use <code>*</code> for any value</p>
                        <p>• Use <code>*/5</code> for every 5 units</p>
                        <p>• Use <code>1-5</code> for ranges</p>
                        <p>• Use <code>MON-FRI</code> for weekday names</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Payload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={JSON.stringify(formData.payload, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData(prev => ({ ...prev, payload: parsed }));
                      } catch (error) {
                        // Invalid JSON, keep the raw value for now
                      }
                    }}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder='{\n  "scheduleName": "{{scheduleName}}",\n  "timestamp": "{{now}}"\n}'
                  />
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Define the JSON payload that will be sent to the webhook URL when the schedule executes.
                      You can use template variables like <code>{'{{now}}'}</code> for current timestamp,
                      <code>{'{{scheduleName}}'}</code> for the schedule name.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Schedule Execution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {schedule?.id ? (
                    <Button type="button" onClick={handleTestExecute} disabled={loading}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Execute Now
                    </Button>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Save the schedule first to enable test execution.
                      </AlertDescription>
                    </Alert>
                  )}

                  {testExecuteResult && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>Execution successful!</strong></p>
                          <p>Status: <Badge variant="outline">{testExecuteResult.status}</Badge></p>
                          <p>Execution Time: <Badge variant="outline">{testExecuteResult.executionTimeMs}ms</Badge></p>
                          {testExecuteResult.responseBody && (
                            <details className="mt-2">
                              <summary className="cursor-pointer font-medium">Response Body</summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {testExecuteResult.responseBody}
                              </pre>
                            </details>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {testExecuteError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p><strong>Execution failed:</strong></p>
                        <p>{testExecuteError}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isSubmitting || (cronResult ? !cronResult.isValid : false)}>
              {isSubmitting ? 'Saving...' : (schedule ? 'Update Schedule' : 'Create Schedule')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
