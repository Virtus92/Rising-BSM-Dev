'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { RequestDetailResponseDto } from '@/domain/dtos/RequestDtos';
import { useRequestData } from '../hooks/useRequestData';
import { RequestDataViewer } from './n8n/RequestDataViewer';
import { N8NWorkflowControls } from './n8n/N8NWorkflowControls';

interface RequestDetailTabsProps {
  request: RequestDetailResponseDto;
  onRefresh: () => void;
}

/**
 * Tab-based interface for request details, including N8N workflow integration
 */
export const RequestDetailTabs: React.FC<RequestDetailTabsProps> = ({
  request,
  onRefresh
}) => {
  const { requestData, isLoading, refetch } = useRequestData(request.id);
  const [activeTab, setActiveTab] = useState('details');
  
  // Group data by category for tabs
  const dataByCategory = React.useMemo(() => {
    if (!requestData) return {};
    
    return requestData.reduce((acc, data) => {
      if (!acc[data.category]) {
        acc[data.category] = [];
      }
      acc[data.category].push(data);
      return acc;
    }, {} as Record<string, any[]>);
  }, [requestData]);
  
  return (
    <div className="mt-4">
      <Tabs 
        defaultValue="details" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex flex-col space-y-4">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            {Object.keys(dataByCategory).map((category) => (
              <TabsTrigger key={category} value={category}>
                {dataByCategory[category][0].label || category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-4">
              {/* Original request details content */}
              <h2 className="text-lg font-semibold">Request Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div>{request.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div>{request.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div>{request.phone || 'N/A'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div>{request.statusLabel}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Service</div>
                    <div>{request.service}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div>{new Date(request.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Message</div>
                <div className="p-4 border rounded-md mt-1">{request.message}</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="space-y-4">
              {/* Request notes content */}
              <h2 className="text-lg font-semibold">Notes</h2>
              {request.notes && request.notes.length > 0 ? (
                <div className="space-y-3">
                  {request.notes.map(note => (
                    <div key={note.id} className="border p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{note.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-2">{note.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground italic">No notes added yet</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="processing">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">AI Processing</h2>
              <N8NWorkflowControls request={request} onComplete={onRefresh} />
            </div>
          </TabsContent>
          
          {Object.keys(dataByCategory).map((category) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  {dataByCategory[category][0].label || category}
                </h2>
                {dataByCategory[category].map(data => (
                  <RequestDataViewer 
                    key={data.id} 
                    data={data}
                    onEdit={() => {/* Open editor */}} 
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};