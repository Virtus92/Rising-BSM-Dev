'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Play, Plus, Settings, Activity, Webhook, Server } from 'lucide-react';

/**
 * N8N Workflow Integration Dashboard
 */
export default function N8NDashboardPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">N8N Workflow Integration</h1>
          <p className="text-muted-foreground">
            Configure and manage automated workflows using n8n
          </p>
        </div>
        
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Connection Settings
        </Button>
      </div>
      
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API Endpoints</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="executions">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-end">
            <Button className="mb-4">
              <Plus className="mr-2 h-4 w-4" />
              New Workflow Template
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Sample workflow cards */}
            <WorkflowCard 
              title="Customer Onboarding"
              description="Automates customer onboarding process"
              status="active"
            />
            
            <WorkflowCard 
              title="Email Notifications"
              description="Sends email notifications for upcoming appointments"
              status="active"
            />
            
            <WorkflowCard 
              title="Data Enrichment"
              description="Enriches customer data from external sources"
              status="inactive"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-end">
            <Button className="mb-4">
              <Plus className="mr-2 h-4 w-4" />
              New Webhook
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Sample webhook cards */}
            <WebhookCard 
              title="Customer Data Webhook"
              description="Receives customer data updates"
              path="/webhooks/customers"
            />
            
            <WebhookCard 
              title="Appointment Updates"
              description="Handles appointment status changes"
              path="/webhooks/appointments"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <div className="flex justify-end">
            <Button className="mb-4">
              <Plus className="mr-2 h-4 w-4" />
              Register API Endpoint
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sample API endpoint cards */}
            <ApiEndpointCard 
              title="Get Customers"
              method="GET"
              path="/api/customers"
              isPublic={true}
            />
            
            <ApiEndpointCard 
              title="Create Appointment"
              method="POST"
              path="/api/appointments"
              isPublic={false}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="triggers" className="space-y-4">
          <div className="flex justify-end">
            <Button className="mb-4">
              <Plus className="mr-2 h-4 w-4" />
              New Trigger
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sample trigger cards */}
            <TriggerCard 
              title="New Request Trigger"
              eventType="request.created"
              workflow="Customer Onboarding"
            />
            
            <TriggerCard 
              title="Appointment Reminder"
              eventType="appointment.upcoming"
              workflow="Email Notifications"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="executions" className="space-y-4">
          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Workflow</th>
                  <th className="p-3 text-left">Trigger</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Started</th>
                  <th className="p-3 text-left">Completed</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Sample execution rows */}
                <tr className="border-b">
                  <td className="p-3">1001</td>
                  <td className="p-3">Customer Onboarding</td>
                  <td className="p-3">request.created</td>
                  <td className="p-3">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Completed
                    </span>
                  </td>
                  <td className="p-3">2023-05-10 14:30</td>
                  <td className="p-3">2023-05-10 14:32</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">1002</td>
                  <td className="p-3">Email Notifications</td>
                  <td className="p-3">appointment.upcoming</td>
                  <td className="p-3">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Running
                    </span>
                  </td>
                  <td className="p-3">2023-05-10 15:45</td>
                  <td className="p-3">-</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Configure connection to your n8n instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="n8n-url" className="text-sm font-medium">
                    N8N Base URL
                  </label>
                  <input
                    id="n8n-url"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="https://n8n.example.com"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="n8n-api-key" className="text-sm font-medium">
                    API Key
                  </label>
                  <input
                    id="n8n-api-key"
                    type="password"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter API key"
                  />
                </div>
                
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced settings for n8n integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    id="auto-discovery"
                    type="checkbox"
                    className="rounded"
                  />
                  <label htmlFor="auto-discovery" className="text-sm font-medium">
                    Enable automatic API endpoint discovery
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="webhooks-enabled"
                    type="checkbox"
                    className="rounded"
                    defaultChecked
                  />
                  <label htmlFor="webhooks-enabled" className="text-sm font-medium">
                    Enable webhooks
                  </label>
                </div>
                
                <Button>Save Advanced Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Card components for different sections

function WorkflowCard({ title, description, status }: { 
  title: string; 
  description: string; 
  status: 'active' | 'inactive'; 
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{title}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm">
            <Play className="mr-2 h-3 w-3" />
            Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookCard({ title, description, path }: {
  title: string;
  description: string;
  path: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="bg-muted p-2 rounded text-sm font-mono overflow-x-auto">
            {path}
          </div>
          <div className="flex justify-between items-center">
            <Button size="sm" variant="outline">
              Edit
            </Button>
            <Button size="sm" variant="secondary">
              <Webhook className="mr-2 h-3 w-3" />
              Test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApiEndpointCard({ title, method, path, isPublic }: {
  title: string;
  method: string;
  path: string;
  isPublic: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{title}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded font-mono ${
            method === 'GET' ? 'bg-blue-100 text-blue-800' : 
            method === 'POST' ? 'bg-green-100 text-green-800' : 
            method === 'PUT' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {method}
          </span>
        </div>
        <CardDescription className="flex items-center">
          <span className="bg-muted px-2 py-1 rounded text-xs font-mono">{path}</span>
          {isPublic && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
              Public
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm" variant="secondary">
            <Server className="mr-2 h-3 w-3" />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TriggerCard({ title, eventType, workflow }: {
  title: string;
  eventType: string;
  workflow: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          <div className="flex flex-col">
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded w-fit">
              {eventType}
            </span>
            <span className="mt-1">Triggers: {workflow}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm" variant="secondary">
            <Activity className="mr-2 h-3 w-3" />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}