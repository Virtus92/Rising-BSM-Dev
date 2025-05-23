'use client';

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { RequestDetailResponseDto } from '@/domain/dtos/RequestDtos';
import { useRequestData } from '../hooks/useRequestData';
import { RequestDataViewer } from './RequestDataViewer';
import { RequestAutomationControls } from './RequestAutomationControls';
import { RequestStatus } from '@/domain';

interface RequestDetailTabsProps {
  request: RequestDetailResponseDto;
  onRefresh: () => void;
}

/**
 * Enhanced tab-based interface for request details with automation integration
 */
export const RequestDetailTabs: React.FC<RequestDetailTabsProps> = ({
  request,
  onRefresh
}) => {
  const { requestData, isLoading, refetch } = useRequestData(request.id);
  const [activeTab, setActiveTab] = useState('details');
  
  // Group data by category for dynamic tabs
  const dataByCategory = useMemo(() => {
    if (!requestData) return {};
    
    return requestData.reduce((acc, data) => {
      if (!acc[data.category]) {
        acc[data.category] = [];
      }
      acc[data.category].push(data);
      return acc;
    }, {} as Record<string, any[]>);
  }, [requestData]);

  // Sort categories for consistent tab order
  const sortedCategories = useMemo(() => {
    return Object.keys(dataByCategory).sort((a, b) => {
      // Define preferred order for common categories
      const categoryOrder: Record<string, number> = {
        'summary': 1,
        'customer-info': 2,
        'product-details': 3,
        'appointment-preferences': 4,
        'conversation': 5,
        'extracted-data': 6
      };
      
      const orderA = categoryOrder[a] || 999;
      const orderB = categoryOrder[b] || 999;
      
      return orderA - orderB;
    });
  }, [dataByCategory]);

  // Calculate total data items for processing tab badge
  const totalDataItems = useMemo(() => {
    return Object.values(dataByCategory).reduce((total, items) => total + items.length, 0);
  }, [dataByCategory]);

  const handleDataRefresh = () => {
    refetch();
    onRefresh();
  };

  return (
    <div className="mt-6">
      <Tabs 
        defaultValue="details" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex flex-col space-y-6">
          {/* Dynamic tab list with responsive design */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <TabsTrigger value="details" className="flex items-center gap-2">
              📋 Details
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              📝 Notes
              {request.notes && request.notes.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {request.notes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              🤖 Automation
              {totalDataItems > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {totalDataItems}
                </Badge>
              )}
            </TabsTrigger>
            {sortedCategories.map((category) => (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                📊 {dataByCategory[category][0]?.label || category}
                <Badge variant="outline" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {dataByCategory[category].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Request Details
                  <Badge variant={request.status === RequestStatus.NEW ? 'default' : 'secondary'}>
                    {request.statusLabel}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Request submitted on {new Date(request.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Name</div>
                      <div className="text-sm text-muted-foreground">{request.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{request.email}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-sm text-muted-foreground">{request.phone || 'Not provided'}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Service Information */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Service Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Requested Service</div>
                      <div className="text-sm text-muted-foreground">{request.service}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Message */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Message</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(request.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {new Date(request.updatedAt).toLocaleString()}
                    </div>
                    {request.assignedToName && (
                      <div>
                        <span className="font-medium">Assigned to:</span> {request.assignedToName}
                      </div>
                    )}
                    {request.customerId && (
                      <div>
                        <span className="font-medium">Customer ID:</span> {request.customerId}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📝 Notes
                  {request.notes && request.notes.length > 0 && (
                    <Badge variant="secondary">
                      {request.notes.length} note{request.notes.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Internal notes and comments about this request
                </CardDescription>
              </CardHeader>
              <CardContent>
                {request.notes && request.notes.length > 0 ? (
                  <div className="space-y-4">
                    {request.notes
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((note) => (
                      <div key={note.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{note.userName}</div>
                            <Badge variant="outline" className="text-xs">
                              {note.createdBy || 'Staff'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {note.text}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-sm">No notes have been added yet</div>
                    <div className="text-xs mt-1">Notes will appear here when added by staff members</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤖 Automation & Processing
                  {totalDataItems > 0 && (
                    <Badge variant="secondary">
                      {totalDataItems} data item{totalDataItems !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Automated processing and extracted data for this request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Automation Controls */}
                <RequestAutomationControls 
                  request={request} 
                  onComplete={handleDataRefresh} 
                />

                {/* Processing Status Summary */}
                {totalDataItems > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-3">Processing Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedCategories.map((category) => (
                          <div key={category} className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium">
                                {dataByCategory[category][0]?.label || category}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {dataByCategory[category].length}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last updated: {new Date(
                                Math.max(...dataByCategory[category].map(item => 
                                  new Date(item.updatedAt).getTime()
                                ))
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Dynamic Data Category Tabs */}
          {sortedCategories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 {dataByCategory[category][0]?.label || category}
                    <Badge variant="secondary">
                      {dataByCategory[category].length} item{dataByCategory[category].length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Structured data extracted and processed for this category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dataByCategory[category]
                    .sort((a, b) => b.version - a.version) // Show latest versions first
                    .map((data) => (
                    <RequestDataViewer 
                      key={data.id} 
                      data={data}
                      onEdit={() => {
                        // TODO: Implement data editing functionality
                        console.log('Edit data item:', data.id);
                      }}
                      onRefresh={refetch}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};