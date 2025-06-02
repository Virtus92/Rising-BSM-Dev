'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BaseListComponent } from '@/shared/components/data/BaseListComponent';
import type { ColumnDef, CardProps } from '@/shared/components/data/BaseListComponent';
import { BaseCard } from '@/shared/components/data/BaseCard';
import { PluginDto } from '@/domain/dtos/PluginDtos';
import { usePlugins } from '../hooks/usePlugins';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  Package, Download, Star, Eye, Shield, Code, Palette, 
  Workflow, Layers, Search, Filter, Check, X, Clock, 
  DollarSign, Users, Calendar, Award, TrendingUp,
  AlertTriangle, Info
} from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/permissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

// Plugin type icons
const PluginTypeIcons = {
  ui: <Palette className="h-4 w-4" />,
  api: <Code className="h-4 w-4" />,
  automation: <Workflow className="h-4 w-4" />,
  mixed: <Layers className="h-4 w-4" />
};

// Status badge colors
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'suspended':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

// Plugin card component
const PluginCard = ({ item, onActionClick }: CardProps<PluginDto>) => {
  const { hasPermission } = usePermissions();
  const canView = hasPermission(SystemPermission.PLUGIN_VIEW);
  const canEdit = hasPermission(SystemPermission.PLUGIN_EDIT);
  
  return (
    <BaseCard
      item={item}
      title={item.displayName}
      description={item.description || 'No description available'}
      className="border-l-4 border-l-purple-500 transition-all duration-200 hover:shadow-lg hover:border-l-8"
      status={{
        text: item.status,
        className: getStatusBadgeColor(item.status)
      }}
      badges={[
        {
          text: item.type,
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
          icon: PluginTypeIcons[item.type]
        },
        {
          text: item.category,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
        }
      ]}
      fields={[
        {
          label: 'Author',
          value: item.author || 'Unknown',
          icon: <Users className="h-4 w-4 text-purple-600" />
        },
        {
          label: 'Version',
          value: item.version,
          icon: <Package className="h-4 w-4 text-purple-600" />
        },
        {
          label: 'Created',
          value: new Date(item.createdAt).toLocaleDateString(),
          icon: <Calendar className="h-4 w-4 text-purple-600" />
        }
      ]}
      actions={
        <div className="flex justify-between gap-2">
          {canView && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('view', item)}
              className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/10"
            >
              <Eye className="h-4 w-4 mr-1.5" /> View
            </Button>
          )}
          {canEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('edit', item)}
            >
              <Package className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          )}
        </div>
      }
    />
  );
};

// Main plugin marketplace component
export const PluginMarketplace = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    plugins,
    isLoading,
    error,
    pagination,
    filters,
    setFilter,
    updateFilters,
    setPage,
    setPageSize,
    setSortField,
    setSortDirection,
    refetch,
    filterByType,
    filterByCategory,
    filterByStatus,
    filterByRating
  } = usePlugins();
  
  // Permissions
  const canCreate = hasPermission(SystemPermission.PLUGIN_CREATE);
  const canApprove = hasPermission(SystemPermission.PLUGIN_APPROVE);
  const canManage = hasPermission(SystemPermission.PLUGIN_MANAGE);
  
  // Handle search
  const handleSearch = useCallback(() => {
    setFilter('query', searchQuery);
  }, [searchQuery, setFilter]);
  
  // Handle actions
  const handleActionClick = useCallback((action: string, plugin?: PluginDto) => {
    if (!plugin) return;
    
    switch (action) {
      case 'view':
        router.push(`/dashboard/plugins/${plugin.id}`);
        break;
      case 'edit':
        router.push(`/dashboard/plugins/${plugin.id}/edit`);
        break;
      case 'install':
        // Show honest message about installation
        toast?.({
          title: 'Plugin Installation',
          description: 'Plugin installation is not yet implemented. This is a development feature.',
          variant: 'default',
        });
        break;
    }
  }, [router, toast]);
  
  // Column definitions
  const columns: ColumnDef<PluginDto>[] = [
    {
      accessorKey: 'displayName',
      header: 'Plugin',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-3">
          {item.icon && (
            <img 
              src={item.icon} 
              alt={item.displayName} 
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <div>
            <div className="font-medium">{item.displayName}</div>
            <div className="text-sm text-muted-foreground">{item.name}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          {PluginTypeIcons[item.type as keyof typeof PluginTypeIcons]}
          <span className="capitalize">{item.type}</span>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Category',
      sortable: true
    },
    {
      accessorKey: 'author',
      header: 'Author',
      sortable: true,
      cell: (item) => item.author || 'Unknown'
    },
    {
      accessorKey: 'version',
      header: 'Version',
      sortable: true
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      cell: (item) => (
        <Badge className={getStatusBadgeColor(item.status)}>
          {item.status}
        </Badge>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      sortable: true,
      cell: (item) => new Date(item.createdAt).toLocaleDateString()
    }
  ];
  
  // Filter options
  const filterOptions = [
    {
      id: 'type',
      label: 'Type',
      icon: <Layers className="h-4 w-4" />,
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'ui', label: 'UI Plugins' },
        { value: 'api', label: 'API Plugins' },
        { value: 'automation', label: 'Automation' },
        { value: 'mixed', label: 'Mixed' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      icon: <Shield className="h-4 w-4" />,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'approved', label: 'Approved' },
        { value: 'pending', label: 'Pending' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'suspended', label: 'Suspended' }
      ],
      visible: canManage
    }
  ];
  
  // Check if this is development environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isDevelopment ? 'Plugin Development' : 'Plugin Manager'}
          </h2>
          <p className="text-muted-foreground">
            {isDevelopment 
              ? 'Create and manage your plugins locally' 
              : 'Manage installed plugins'}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => router.push('/dashboard/plugins/create')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Package className="h-4 w-4 mr-2" />
            Create Plugin
          </Button>
        )}
      </div>
      
      {/* Development Mode Alert */}
      {isDevelopment && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> You're viewing locally stored plugins. 
            Plugin execution and marketplace features are not yet implemented. 
            This is a CRUD interface for managing plugin records.
          </AlertDescription>
        </Alert>
      )}
      
      {/* No Plugins Alert */}
      {!isLoading && plugins.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>No plugins found.</strong> Create your first plugin or run: 
            <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              node scripts/create-test-plugin.js
            </code>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-md"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          {filterOptions
            .filter(filter => filter.visible !== false)
            .map(filter => (
              <Select
                key={filter.id}
                value={String(filters[filter.id as keyof typeof filters] || 'all')}
                onValueChange={(value) => {
                  const filterValue = value === 'all' ? undefined : value;
                  setFilter(filter.id as any, filterValue);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    {filter.icon}
                    <SelectValue placeholder={filter.label} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
        </div>
      </div>
      
      {/* Plugin List */}
      <BaseListComponent<PluginDto>
        items={plugins}
        columns={columns}
        keyExtractor={(plugin) => plugin.uuid || plugin.id?.toString() || '0'}
        cardComponent={PluginCard}
        isLoading={isLoading}
        error={error}
        totalItems={pagination?.total || 0}
        currentPage={pagination?.page || 1}
        totalPages={pagination?.totalPages || 0}
        pageSize={pagination?.limit || 20}
        emptyStateMessage="No plugins found. Create your first plugin to get started."
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction);
        }}
        onActionClick={handleActionClick}
      />
    </div>
  );
};
