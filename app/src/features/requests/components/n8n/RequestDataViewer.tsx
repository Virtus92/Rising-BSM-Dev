'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Pencil, Check, AlertCircle } from 'lucide-react';

interface RequestDataViewerProps {
  data: {
    id: number;
    category: string;
    label: string;
    dataType: string;
    data: any;
    isValid: boolean;
    processedBy?: string;
    version: number;
    createdAt: string;
    updatedAt: string;
  };
  onEdit?: () => void;
}

/**
 * Component to display structured data extracted by N8N workflows
 */
export const RequestDataViewer: React.FC<RequestDataViewerProps> = ({ data, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Render content based on data type
  const renderContent = () => {
    switch (data.dataType) {
      case 'conversation':
        return renderConversation(data.data);
      case 'markdown':
        return renderMarkdown(data.data);
      case 'html':
        return renderHtml(data.data);
      case 'json':
      default:
        return renderJson(data.data);
    }
  };
  
  // Render JSON data
  const renderJson = (jsonData: any) => {
    // For simple key-value pairs, render as a table
    if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      return (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <tbody>
              {Object.entries(jsonData).map(([key, value]) => (
                <tr key={key} className="border-b last:border-b-0">
                  <td className="py-2 px-3 font-medium bg-muted/50 w-1/3">{key}</td>
                  <td className="py-2 px-3">
                    {renderValue(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // For arrays or complex objects
    return (
      <pre className="p-4 bg-muted/50 rounded-md overflow-x-auto text-sm">
        {JSON.stringify(jsonData, null, 2)}
      </pre>
    );
  };
  
  // Render conversation data
  const renderConversation = (conversation: any[]) => {
    if (!Array.isArray(conversation)) {
      return renderJson(conversation);
    }
    
    return (
      <div className="space-y-2">
        {conversation.map((message, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-primary/10 ml-8'
                : 'bg-muted/50 mr-8'
            }`}
          >
            <div className="font-semibold text-xs mb-1">
              {message.role === 'user' ? 'User' : 'Assistant'}
            </div>
            <div className="text-sm">{message.content}</div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render markdown data (simplified)
  const renderMarkdown = (markdownText: string) => {
    // Ideally use a markdown renderer like react-markdown
    return (
      <div className="p-4 bg-muted/50 rounded-md overflow-x-auto text-sm whitespace-pre-wrap">
        {markdownText}
      </div>
    );
  };
  
  // Render HTML data (simplified)
  const renderHtml = (htmlContent: string) => {
    // This is a simplified approach - in a real implementation you'd need
    // to sanitize the HTML or use a dedicated HTML renderer
    return (
      <div className="p-4 bg-muted/50 rounded-md overflow-x-auto text-sm">
        <pre>{htmlContent}</pre>
      </div>
    );
  };
  
  // Render a value appropriately based on its type
  const renderValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">None</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? <Check className="h-4 w-4 text-green-500" /> : <span>No</span>;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 
          ? <span>{value.join(', ')}</span> 
          : <span className="text-muted-foreground italic">Empty array</span>;
      }
      
      return <Button variant="link" size="sm" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Collapse' : 'Expand'} object
      </Button>;
    }
    
    return <span>{String(value)}</span>;
  };
  
  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            {data.label}
            {data.isValid ? (
              <Badge variant="success" className="ml-2">Valid</Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">Invalid</Badge>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {data.processedBy && (
              <span>Processed by: {data.processedBy} • </span>
            )}
            Version: {data.version}
          </div>
        </div>
        
        {onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};