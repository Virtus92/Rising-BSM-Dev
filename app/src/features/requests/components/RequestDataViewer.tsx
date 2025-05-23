'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { Separator } from '@/shared/components/ui/separator';
import { ChevronDown, ChevronRight, Edit, FileText, MessageSquare, Database } from 'lucide-react';
import { RequestDataItem } from '../hooks/useRequestData';

interface RequestDataViewerProps {
  data: RequestDataItem;
  onEdit?: (dataId: number) => void;
  onRefresh?: () => void;
}

/**
 * Component for viewing and interacting with structured request data
 */
export const RequestDataViewer: React.FC<RequestDataViewerProps> = ({
  data,
  onEdit,
  onRefresh
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get appropriate icon based on data type
  const getDataTypeIcon = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'json':
      case 'object':
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Format data for display based on type
  const renderDataContent = () => {
    if (!data.data) {
      return <div className="text-muted-foreground italic">No data available</div>;
    }

    try {
      // Handle conversation data specially
      if (data.dataType === 'conversation' && Array.isArray(data.data)) {
        return (
          <div className="space-y-2">
            {data.data.map((message: any, index: number) => (
              <div key={index} className="bg-muted/50 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                    {message.role || 'system'}
                  </Badge>
                  {message.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-sm">{message.content || message.message}</div>
              </div>
            ))}
          </div>
        );
      }

      // Handle object/JSON data
      if (typeof data.data === 'object') {
        return (
          <div className="space-y-2">
            {Object.entries(data.data).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground">{key}</div>
                <div className="text-sm bg-muted/50 p-2 rounded">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>
        );
      }

      // Handle simple text/string data
      return (
        <div className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
          {String(data.data)}
        </div>
      );
    } catch (error) {
      return (
        <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
          Error displaying data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      );
    }
  };

  // Get validity indicator
  const getValidityBadge = () => {
    if (data.isValid === true) {
      return <Badge variant="default" className="bg-green-500">Valid</Badge>;
    } else if (data.isValid === false) {
      return <Badge variant="destructive">Invalid</Badge>;
    } else {
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {getDataTypeIcon(data.dataType)}
                </div>
                <div className="text-left">
                  <CardTitle className="text-base">{data.label}</CardTitle>
                  <CardDescription className="text-xs">
                    {data.dataType} • Version {data.version}
                    {data.processedBy && ` • Processed by ${data.processedBy}`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getValidityBadge()}
                <Badge variant="outline" className="text-xs">
                  Order: {data.order}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            
            {/* Metadata */}
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span><br />
                  {new Date(data.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span><br />
                  {new Date(data.updatedAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Category:</span><br />
                  {data.category}
                </div>
                <div>
                  <span className="font-medium">Data Type:</span><br />
                  {data.dataType}
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Data Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Data Content</h4>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(data.id)}
                    className="gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
              
              {renderDataContent()}
            </div>

            {/* Processing Information */}
            {data.processedBy && (
              <>
                <Separator className="my-4" />
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                  <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Processing Information
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Processed by: {data.processedBy}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Version: {data.version} • Validity: {data.isValid ? 'Valid' : 'Invalid'}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};