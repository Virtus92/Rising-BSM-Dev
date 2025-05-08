import React, { useState } from 'react';
import { useWebhooks } from '../hooks/useWebhooks';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Spinner } from '@/shared/components/ui/spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { MoreHorizontalIcon, PencilIcon, TrashIcon, EyeIcon } from 'lucide-react';

interface WebhookListProps {
  onEdit?: (webhook: any) => void;
  onView?: (webhook: any) => void;
  onCreate?: () => void;
}

/**
 * Component for displaying a list of registered N8N webhooks
 */
export const WebhookList: React.FC<WebhookListProps> = ({ onEdit, onView, onCreate }) => {
  const { webhooks, loading, error, fetchWebhooks, deleteWebhook } = useWebhooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [webhookToDelete, setWebhookToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter webhooks based on search term
  const filteredWebhooks = searchTerm
    ? webhooks.filter(webhook => 
        webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (webhook.description && webhook.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (webhook.path && webhook.path.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : webhooks;

  // Handle refresh button click
  const handleRefresh = () => {
    fetchWebhooks();
  };

  // Handle webhook deletion
  const handleDelete = async () => {
    if (!webhookToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteWebhook(webhookToDelete.id);
    } finally {
      setIsDeleting(false);
      setWebhookToDelete(null);
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Registered N8N webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/15 p-4 mb-4">
            <p className="text-destructive">{error}</p>
          </div>
          <Button onClick={handleRefresh}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Registered N8N webhooks</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleRefresh} disabled={loading}>
            {loading ? <Spinner size="sm" className="mr-2" /> : null}
            Refresh
          </Button>
          {onCreate && (
            <Button size="sm" onClick={onCreate}>
              Add Webhook
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search webhooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        {loading && webhooks.length === 0 ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : filteredWebhooks.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {searchTerm ? 'No webhooks match your search' : 'No webhooks available'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted rounded-sm px-1 py-0.5">{webhook.path}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={webhook.active ? 'success' : 'secondary'}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {webhook.category ? (
                        <Badge variant="outline">{webhook.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(webhook)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(webhook)}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => setWebhookToDelete({ id: webhook.id, name: webhook.name })}
                            className="text-destructive focus:text-destructive"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!webhookToDelete} onOpenChange={(open) => !open && setWebhookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook <span className="font-semibold">{webhookToDelete?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Spinner size="sm" className="mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
